#!/usr/bin/env bash
# Ralph loop over a Wayfinder map on GitHub. Runs on the HOST; every agent session runs in a
# Docker sandbox (sbx). See scripts/ralph/README.md for the whole flow.
#
#   ralph.sh queue  1           read the map's tickets from GitHub and show what build would do
#   ralph.sh build  1 [max]     build the approved tickets down the chain, then run the retro
#   ralph.sh ticket 22          build one ticket on its own, then run the retro
#   ralph.sh retry  1 22        let build try a failed ticket again
#   ralph.sh retro  1           re-run the retro over every session so far
#   ralph.sh status 1           show the queue as last read
#   ralph.sh clean  1           remove the map's sandboxes and base branches; merged branches too
#
# GitHub decides what a map build takes: an open child issue of the map with the approval label
# (RALPH_READY_LABEL, default ready-for-agent) is approved, in the order its native "blocked by"
# links give. For `ticket`, running the command is the approval. The spec is the issue the map's
# body links as "Spec: ..."; RALPH_SPEC (an issue number) overrides it.
#
# Trust boundary: a sandbox works on a private clone (sbx create --clone), and the host repo is
# mounted into it read-only, so nothing an agent does can plant a hook or a config line that
# the host's git would later run. The agent's commits come back through `git fetch`. Of the
# state directory, a sandbox can write only reports/ and pr/. The queue never leaves the host,
# and anything read from GitHub or back from a sandbox is validated before it names a branch.
# The repo is public, so only the issue body and its owner's comments reach a session.
#
# Written for macOS's bash 3.2: no associative arrays, no mapfile, no ${x,,}.
set -euo pipefail

RALPH_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO="$(git -C "$RALPH_DIR" rev-parse --show-toplevel)"
# --clone refuses a worktree, so sandboxes clone the main repository; it must stay on main.
MAIN_TREE="$(dirname "$(cd "$(git -C "$REPO" rev-parse --git-common-dir)" && pwd)")"
cd "$MAIN_TREE"   # gh finds the GitHub repo from the working directory
TEMPLATE="${RALPH_TEMPLATE:-gtrack-ralph:1}"
MAX_TURNS="${RALPH_MAX_TURNS:-200}"
READY="${RALPH_READY_LABEL:-ready-for-agent}"
GH_USER="${RALPH_GH_USER:-simhen79}"   # CLAUDE.md: GitHub commands for this repo run as this account

MODE="${1:-}"
MAP="${2:-}"   # for `ticket`, the ticket's number until its lookup finds the map
[ -n "$MODE" ] && [ -n "$MAP" ] || { sed -n '5,11p' "$0" >&2; exit 2; }
printf '%s' "$MAP" | grep -Eq '^[0-9]+$' || { echo "ralph: '$MAP' is not an issue number" >&2; exit 2; }
STATE_ROOT="${RALPH_STATE:-$HOME/.ralph/gtrack}"
SPEC=""

GH_TOKEN="$(gh auth token --user "$GH_USER")" || { echo "ralph: gh has no token for $GH_USER" >&2; exit 1; }
export GH_TOKEN
OWNER="$(gh repo view --json owner -q .owner.login)"
NAME="$(gh repo view --json name -q .name)"
PROJECT="${RALPH_PROJECT-2}"   # the "gtrack v1" board; RALPH_PROJECT= turns board moves off

# use_state NUMBER: the state folder of a map, or of a ticket that has no map.
# queue.tsv: NUM <tab> LOCAL <tab> STATE <tab> APPROVED <tab> ASSIGNED <tab> SLUG <tab> UI <tab> NEEDS_PROTO <tab> BRANCH <tab> PROTOTYPE
# STATE is GitHub's OPEN or CLOSED. UI is yes when the Design section lists screens; NEEDS_PROTO
# is yes when it says to prototype before building, and PROTOTYPE is the prototype/ branch the
# ticket names (empty when none). LOCAL is the loop's own progress: new, retry, built, pr-open
# or failed.
use_state() {
  STATE="$STATE_ROOT/map-$1"
  QUEUE="$STATE/queue.tsv"
  mkdir -p "$STATE/logs" "$STATE/reports" "$STATE/pr" "$STATE/context"
  touch "$QUEUE"
}
[ "$MODE" = ticket ] || use_state "$MAP"

log() { printf '[ralph %s] %s\n' "$(date +%H:%M:%S)" "$*" >&2; }
TAB="$(printf '\t')"

# What a build or ticket run leaves waiting on you. It ends with a "Waiting on you" summary and
# a macOS notification, whatever stopped it, so a stop never hides in the middle of the log.
WAITING=""   # one line per ticket: a draft PR to review, or why the chain stopped there
STOPPED=""   # why the run stopped early, when it did
PROTO_LABEL="${RALPH_PROTO_LABEL:-needs-prototype}"

# waiting_on_you NUM WHAT: logs WHAT and keeps it for the summary.
waiting_on_you() {
  log "#$1 $2"
  WAITING="$WAITING  #$1 $(field "$1" 6): $2
"
}

# stopped_at NUM WHY: the chain stops at NUM until you do WHY.
stopped_at() {
  waiting_on_you "$1" "$2"
  STOPPED="Stopped at #$1: $2"
}

# notify TITLE MESSAGE: a macOS notification. Both go in as arguments, never as AppleScript.
notify() {
  command -v osascript >/dev/null 2>&1 || return 0
  osascript -e 'on run argv' \
    -e 'display notification (item 2 of argv) with title "Ralph" subtitle (item 1 of argv) sound name "Glass"' \
    -e 'end run' "$1" "$2" >/dev/null 2>&1 || true
}

# finish: the EXIT trap of build and ticket.
finish() {
  local status=$?
  if [ -n "$WAITING" ]; then
    printf '\n=== Waiting on you ===\n%s\n' "$WAITING" >&2
  fi
  if [ -n "$STOPPED" ]; then
    notify "Waiting on you" "$STOPPED"
  elif [ "$status" -ne 0 ]; then
    notify "Stopped with an error" "ralph.sh $MODE $MAP exited with $status; see the terminal"
  elif [ -n "$WAITING" ]; then
    notify "Finished" "Draft PRs to review: $(printf '%s' "$WAITING" | grep -c '^')"
  else
    notify "Finished" "ralph.sh $MODE $MAP: nothing new to build"
  fi
}
case "$MODE" in build | ticket) trap finish EXIT ;; esac

render() {   # render <prompt-file> NAME value ...: fills each {{NAME}}
  local text
  text="$(cat "$1")"
  shift
  while [ $# -gt 1 ]; do
    text="${text//"{{$1}}"/$2}"
    shift 2
  done
  printf '%s' "$text"
}

field() { awk -F'\t' -v k="$1" -v n="$2" '$1 == k { print $n }' "$QUEUE"; }

set_field() {   # set_field NUM column value
  local tmp="$QUEUE.tmp"
  awk -F'\t' -v OFS='\t' -v k="$1" -v n="$2" -v v="$3" '$1 == k { $n = v } { print }' "$QUEUE" > "$tmp"
  mv "$tmp" "$QUEUE"
}

# Pushes as GH_USER over HTTPS, with the token passed to git for this one command only.
push() {
  git -c credential.helper= \
    -c "credential.helper=!f() { echo username=$GH_USER; echo password=\$GH_TOKEN; }; f" \
    push -q "$@"
}

pr_state() { gh pr view "$1" --json state -q .state 2>/dev/null || true; }

# move_on_board NUM STATUS: sets the ticket's Status on the project board, adding the ticket to
# the board first when it isn't on it. Needs the token's `project` scope.
BOARD_ID=""
BOARD_FIELDS=""
move_on_board() {
  [ -n "$PROJECT" ] || return 0
  local ids item_id
  if [ -z "$BOARD_ID" ]; then   # read once per run
    BOARD_ID="$(gh project view "$PROJECT" --owner "$OWNER" --format json -q .id)" || return 1
    BOARD_FIELDS="$(gh project field-list "$PROJECT" --owner "$OWNER" --format json)" || { BOARD_ID=""; return 1; }
  fi
  ids="$(printf '%s' "$BOARD_FIELDS" |
    jq -r --arg s "$2" '.fields[] | select(.name == "Status") | "\(.id) \(.options[] | select(.name == $s) | .id)"')"
  [ -n "$ids" ] || { log "project $PROJECT has no Status option '$2'"; return 1; }
  item_id="$(gh project item-add "$PROJECT" --owner "$OWNER" \
    --url "https://github.com/$OWNER/$NAME/issues/$1" --format json -q .id)" || return 1
  gh project item-edit --id "$item_id" --project-id "$BOARD_ID" \
    --field-id "${ids% *}" --single-select-option-id "${ids#* }" >/dev/null
}

# select_on_board JSON: moves every ticket the loop could start now (open, approved, unassigned,
# no open blocker) to Selected For Development. JSON is the map query refresh_queue made.
select_on_board() {
  [ -n "$PROJECT" ] || return 0
  local num
  for num in $(printf '%s' "$1" | jq -r --arg ready "$READY" '.data.repository.issue.subIssues.nodes[]
      | select(.state == "OPEN" and .assignees.totalCount == 0
               and any(.labels.nodes[]; .name == $ready)
               and all(.blockedBy.nodes[]; .state != "OPEN")) | .number'); do
    move_on_board "$num" "Selected For Development" ||
      log "#$num: could not move it to Selected For Development on project $PROJECT"
  done
}

# Commits in the sandbox carry the repo's own identity, passed in rather than configured.
GIT_NAME="$(git config user.name)"
GIT_EMAIL="$(git config user.email)"

# sandbox_exec SANDBOX COMMAND...: runs in the sandbox's clone. `sbx run` prints nothing
# without a TTY, so every command, claude included, goes through exec, which does not
# inherit create-time env.
sandbox_exec() {
  local sandbox="$1"
  shift
  sbx exec -w "$MAIN_TREE" \
    -e GIT_AUTHOR_NAME="$GIT_NAME" -e GIT_AUTHOR_EMAIL="$GIT_EMAIL" \
    -e GIT_COMMITTER_NAME="$GIT_NAME" -e GIT_COMMITTER_EMAIL="$GIT_EMAIL" \
    "$sandbox" "$@" </dev/null
}

ensure_sandbox() {   # ensure_sandbox NAME
  if ! sbx ls 2>/dev/null | awk '{ print $1 }' | grep -qx "$1"; then
    log "creating sandbox $1 from $TEMPLATE"
    sbx create --clone --name "$1" -t "$TEMPLATE" --pull never --no-progress claude "$MAIN_TREE" \
      "$STATE/reports" "$STATE/pr" "$STATE/logs:ro" "$STATE/context:ro" </dev/null >&2 || return 1
  fi
}

# The skills the implement, review and PR prompts call. A sandbox has none of the host's skills,
# so each ticket run copies these in from this machine: ~/.claude/skills first, then the newest
# mattpocock-skills plugin. tdd names codebase-design, so it comes too. A skill that cannot be
# found or copied stops the ticket rather than letting a session carry on without it.
SKILLS="tdd codebase-design code-review pr"

skill_source() {   # skill_source NAME: the real directory holding NAME's SKILL.md on this machine
  local dir
  for dir in "$HOME/.claude/skills/$1" \
    "$(ls -d "$HOME"/.claude/plugins/cache/*/mattpocock-skills/*/skills/*/"$1" 2>/dev/null | sort -V | tail -n 1)"; do
    if [ -n "$dir" ] && [ -f "$dir/SKILL.md" ]; then
      (cd "$dir" && pwd -P)   # sbx cp copies a symlink as a link, which dangles in the sandbox
      return 0
    fi
  done
  return 1
}

install_skills() {   # install_skills SANDBOX
  local skill src dest
  dest="$(sandbox_exec "$1" bash -c 'mkdir -p ~/.claude/skills && cd ~/.claude/skills && pwd')" || return 1
  for skill in $SKILLS; do
    src="$(skill_source "$skill")" ||
      { log "skill $skill is not in ~/.claude/skills or the mattpocock-skills plugin"; return 1; }
    # sbx cp leaves the files owned by the host's uid, which the sandbox user cannot delete.
    sbx exec -u root "$1" rm -rf "$dest/$skill" </dev/null || return 1
    sbx cp "$src" "$1:$dest/$skill" </dev/null >&2 || return 1
    sandbox_exec "$1" test -f "$dest/$skill/SKILL.md" ||
      { log "skill $skill did not reach the sandbox"; return 1; }
  done
}

# checkout_in_sandbox SANDBOX BASE_BRANCH [BRANCH]: the clone's origin is GitHub, which the
# sandbox has no credentials for, but sbx mounts the host repo read-only at /run/sandbox/source,
# so a branch the host just created is one fetch from the `host` remote. Without BRANCH,
# detaches at the base.
checkout_in_sandbox() {
  sandbox_exec "$1" bash -c '
    git remote add host /run/sandbox/source 2>/dev/null || true
    git fetch -q host
    if [ -z "$2" ]; then git switch -q --detach "host/$1"
    else git switch -q "$2" 2>/dev/null || git switch -q -c "$2" "host/$1"; fi
  ' checkout "$2" "${3:-}" >&2
}

# run_agent SANDBOX LOGNAME PROMPT: one fresh claude session; the transcript goes to logs/
# for the retro. Fails unless the session ended with <promise>COMPLETE</promise>. A retry
# keeps the earlier attempt's transcript under a timestamped name, and a failure leaves a
# note next to it. Both stay in logs/, which a sandbox cannot write, so the host never writes
# through a link an agent planted.
run_agent() {
  local transcript="$STATE/logs/$2.jsonl" failed="$STATE/logs/$2-failed.md" result
  [ -f "$transcript" ] && mv "$transcript" "$STATE/logs/$2.$(date -r "$transcript" +%Y%m%d-%H%M%S).jsonl"
  [ -f "$failed" ] && mv "$failed" "$STATE/logs/$2-failed.$(date -r "$failed" +%Y%m%d-%H%M%S).md"
  log "session $2"
  sandbox_exec "$1" claude -p "$3" --output-format stream-json --verbose \
    --max-turns "$MAX_TURNS" > "$transcript" || true
  result="$(jq -r 'select(.type == "result") | .result // ""' "$transcript" 2>/dev/null | tail -n 1)"
  case "$result" in
    *"<promise>COMPLETE</promise>"*) return 0 ;;
  esac
  {
    printf '# %s did not complete (%s)\n\n' "$2" "$(date '+%Y-%m-%d %H:%M:%S')"
    if grep -q '"type":"result"' "$transcript"; then
      jq -r 'select(.type == "result") | "- subtype: \(.subtype)\n- turns: \(.num_turns)\n- terminal reason: \(.terminal_reason // "")"' \
        "$transcript" 2>/dev/null | tail -n 3
    else
      printf -- '- no result line: the session was killed or crashed\n'
    fi
    printf '\n## The session'"'"'s last text\n\n'
    jq -r 'select(.type == "assistant") | .message.content[]? | select(.type == "text") | .text' \
      "$transcript" 2>/dev/null | tail -n 40
  } > "$failed"
  log "session $2 did not complete; see $failed"
  return 1
}

# The fields of one ticket, as TSV, from an issue node of the GraphQL queries below. Everything
# here names a branch or steers the loop, so the jq keeps only values that pass validation.
TICKET_JQ='
  def owner_comments: [.comments.nodes[] | select(.author.login == $owner) | .body] | join("\n");
  def slug: .title | ascii_downcase | gsub("[^a-z0-9]+"; "-") | gsub("^-+|-+$"; "")
    | if length > 40 then .[0:41] | sub("-[^-]*$"; "") else . end;
  # A verdict is posted as a comment; a body that cites an older prototype as an input is not one.
  def prototype: owner_comments | [match("prototype/[A-Za-z0-9._/-]+"; "g").string | sub("[./]+$"; "")]
    | map(select(test("^prototype/[A-Za-z0-9._-]+(/[A-Za-z0-9._-]+)*$"))) | last // "";
  [ (.number | tostring), .state,
    (if any(.labels.nodes[]; .name == $ready) then "yes" else "no" end),
    (if .assignees.totalCount > 0 then "yes" else "no" end),
    slug,
    (if (.body | test("(?m)^- \\*\\*Screens")) then "yes" else "no" end),
    (if (.body | contains("**Prototype before building:**")) then "yes" else "no" end),
    prototype ] | @tsv'

ISSUE_FIELDS='number title state body
  labels(first: 20) { nodes { name } }
  assignees(first: 5) { totalCount }
  blockedBy(first: 50) { nodes { number state } }
  comments(last: 50) { nodes { author { login } body } }'

# spec_from_body BODY: the number of the issue a "[Spec: ...](…/issues/N)" link points to.
spec_from_body() {
  printf '%s' "$1" | grep -oE "\[Spec:[^]]*\]\(https://github\.com/$OWNER/$NAME/issues/[0-9]+\)" |
    head -n 1 | grep -oE '[0-9]+\)$' | tr -d ')' || true
}

# write_context NUM FILE: the issue's title, body and its owner's comments, for a session to read.
write_context() {
  gh api "repos/$OWNER/$NAME/issues/$1" --jq '"# #\(.number) \(.title)\n\n\(.body)"' > "$2"
  gh api "repos/$OWNER/$NAME/issues/$1/comments" --paginate \
    --jq ".[] | select(.user.login == \"$OWNER\") | \"\n## Comment, \(.created_at)\n\n\(.body)\"" >> "$2"
}

# spec_source: the spec step of the build prompts, with or without a spec issue.
spec_source() {
  if [ -n "$SPEC" ]; then
    printf 'Read the spec, `%s/context/spec.md` (issue #%s). It wins wherever the ticket, the code or other docs disagree.' "$STATE" "$SPEC"
  else
    printf 'There is no spec issue: the ticket'"'"'s user stories, acceptance criteria and Design section are the whole spec.'
  fi
}

# The queue, lookup and retro sessions read main as it is now. Sets MAP_SANDBOX.
map_sandbox() {
  MAP_SANDBOX="ralph-map$MAP-main"
  git fetch -q origin --prune
  git branch -q -f --no-track "ralph-base/map$MAP" origin/main
  ensure_sandbox "$MAP_SANDBOX"
  checkout_in_sandbox "$MAP_SANDBOX" "ralph-base/map$MAP"
}

# refresh_queue: re-reads the map from GitHub. GitHub supplies the order and each ticket's state;
# the loop's own progress and a branch, once made, are kept. A ticket that has left the map is
# dropped from the queue (its branch and PR, if any, are untouched).
refresh_queue() {
  local json num state approved assigned slug ui needs proto local_state new="$QUEUE.new"
  json="$(gh api graphql -F owner="$OWNER" -F name="$NAME" -F num="$MAP" -f query="
    query(\$owner: String!, \$name: String!, \$num: Int!) { repository(owner: \$owner, name: \$name) {
      issue(number: \$num) { body subIssues(first: 100) { nodes { $ISSUE_FIELDS } } } } }")"
  [ "$(printf '%s' "$json" | jq -r '.data.repository.issue != null')" = true ] ||
    { log "issue #$MAP not found"; return 1; }
  SPEC="${RALPH_SPEC:-$(spec_from_body "$(printf '%s' "$json" | jq -r .data.repository.issue.body)")}"
  printf '%s' "$SPEC" | grep -Eq '^[0-9]*$' || { log "RALPH_SPEC must be an issue number"; return 1; }
  [ -n "$SPEC" ] || { log "no spec found for map #$MAP: link a 'Spec: ...' issue from its body, or set RALPH_SPEC"; return 1; }
  printf '%s\n' "$SPEC" > "$STATE/spec"
  write_context "$SPEC" "$STATE/context/spec.md"
  log "spec: #$SPEC"
  # Blocking order: each ticket after every open ticket in the map that blocks it.
  : > "$new"
  printf '%s' "$json" | jq -r --arg owner "$OWNER" --arg ready "$READY" '
    .data.repository.issue.subIssues.nodes as $all
    | ($all | map({ key: (.number | tostring),
                    value: [.blockedBy.nodes[] | select(.state == "OPEN") | .number] }) | from_entries) as $deps
    | def depth($n; $k): if $k > 50 then error("blocking cycle at #\($n)") else
        ([$deps[$n | tostring][]? | select($deps[tostring] != null) | depth(.; $k + 1) + 1] | max // 0) end;
      $all | map(. + { depth: depth(.number; 0) }) | sort_by(.depth, .number) | .[] | '"$TICKET_JQ" |
    while IFS="$TAB" read -r num state approved assigned slug ui needs proto; do
      local_state="$(field "$num" 2)"
      if [ -n "$local_state" ] && [ "$local_state" != new ]; then
        # Started already: keep its branch and progress, refresh only what GitHub says.
        printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$num" "$local_state" "$state" "$approved" "$assigned" \
          "$(field "$num" 6)" "$ui" "$needs" "$(field "$num" 9)" "$proto" >> "$new"
      else
        printf '%s\tnew\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$num" "$state" "$approved" "$assigned" \
          "$slug" "$ui" "$needs" "ralph/$num-$slug" "$proto" >> "$new"
      fi
    done
  mv "$new" "$QUEUE"
  select_on_board "$json"
}

# needs_prototype NUM: true (and says why) when NUM's Design section asks for a prototype
# first but the ticket names no prototype/ branch that exists on origin. Such a screen is built
# from a prototype a person has driven (/mattpocock-skills:prototype), not from a guess.
# The ticket carries the PROTO_LABEL label while it waits, so the board shows it too.
needs_prototype() {
  local proto
  [ "$(field "$1" 8)" = yes ] || return 1
  proto="$(field "$1" 10)"
  if [ -n "$proto" ] && git ls-remote --exit-code -q --heads origin "$proto" >/dev/null 2>&1; then
    gh issue edit "$1" --remove-label "$PROTO_LABEL" >/dev/null 2>&1 || true
    return 1
  fi
  gh label create "$PROTO_LABEL" --color FBCA04 \
    --description "Ralph is waiting for a prototype/ branch and its verdict on this ticket" >/dev/null 2>&1 || true
  gh issue edit "$1" --add-label "$PROTO_LABEL" >/dev/null || log "#$1: could not add the $PROTO_LABEL label"
  stopped_at "$1" "needs a prototype: ${proto:+its branch $proto is not on origin}${proto:-it names no prototype/ branch}. Run /mattpocock-skills:prototype, push its prototype/ branch, and name the branch and the verdict in a comment on the ticket"
}

# read_recently FILE: true when FILE is non-empty and was written under 10 minutes ago.
read_recently() {
  [ -s "$1" ] && [ $(($(date +%s) - $(stat -f %m "$1"))) -lt 600 ]
}

cmd_status() {
  { printf 'NUM\tLOCAL\tSTATE\tAPPROVED\tASSIGNED\tSLUG\tUI\tNEEDS_PROTO\tBRANCH\tPROTOTYPE\n'; cat "$QUEUE"; } |
    column -t -s "$TAB" >&2 || cat "$QUEUE" >&2
}

cmd_queue() {
  refresh_queue || exit 1
  cmd_status
  log "build takes open tickets labelled '$READY', in this order, and stops at the first that is not ready"
}

cmd_retry() {
  local num
  for num in "$@"; do
    case "$(field "$num" 2)" in
      failed | built) set_field "$num" 2 retry ;;
      *) log "#$num is neither failed nor stuck at built; left as it is" ;;
    esac
  done
  cmd_status
}

# gate_summary NUM: the last lines of the loop's own gate log, which the host wrote.
gate_summary() {
  printf '```text\n'
  tail -n 15 "$STATE/logs/$1-gates.log"
  printf '```\n'
}

# build_ticket NUM BASE_COMMIT BASE_BRANCH: implement, browser check, review, gates, PR, comment.
# It runs inside an `if`, where errexit is off, so every step checks its own status.
build_ticket() {
  local num="$1" base_commit="$2" base_branch="$3" branch sandbox base fetched url title body proto
  branch="$(field "$num" 9)"
  sandbox="ralph-$num"
  base="ralph-base/$num"
  fetched="refs/remotes/sandbox-$sandbox/$branch"
  proto="$(field "$num" 10)"

  # The Wayfinder claim: an assigned ticket is taken, so other sessions skip it.
  gh issue edit "$num" --add-assignee "$GH_USER" >/dev/null || return 1
  # The board is for people to look at, so a failed move doesn't stop the build.
  move_on_board "$num" "In Progress" || log "#$num: could not move it to In Progress on project $PROJECT"
  write_context "$num" "$STATE/context/$num.md" || return 1
  if [ -n "$proto" ]; then
    git fetch -q origin "+refs/heads/$proto:refs/heads/ralph-proto/$num" || return 1
  fi
  set -- NUM "$num" MAP "$MAP" STATE "$STATE" SPEC_SOURCE "$(spec_source)" CHECKOUT "$MAIN_TREE" \
    BRANCH "$branch" BASE "host/$base" BASE_BRANCH "$base_branch" \
    PROTOTYPE "${proto:+the branch host/ralph-proto/$num (from $proto)}${proto:-none}"

  git branch -q -f --no-track "$base" "$base_commit" || return 1
  ensure_sandbox "$sandbox" || return 1
  install_skills "$sandbox" || { log "#$num: could not give the sandbox its skills"; return 1; }
  checkout_in_sandbox "$sandbox" "$base" "$branch" || return 1
  log "#$num: setting up the sandbox"
  sandbox_exec "$sandbox" bash -c "$(cat "$RALPH_DIR/sandbox-setup.sh")" setup "$MAIN_TREE" \
    > "$STATE/logs/$num-setup.log" 2>&1 || { log "#$num: setup failed; see $STATE/logs/$num-setup.log"; return 1; }

  # Passed in rather than run from the clone, like dev-server.sh: implement and review run it
  # before they commit, so they gate on exactly what the loop gates on below.
  sandbox_exec "$sandbox" bash -c 'printf "%s\n" "$1" > /tmp/gates.sh && chmod +x /tmp/gates.sh' \
    gates "$(cat "$RALPH_DIR/gates.sh")" || return 1
  run_agent "$sandbox" "$num-implement" "$(render "$RALPH_DIR/prompts/implement.md" "$@")" || return 1
  # The queue guesses "has a screen" from the Design section; a page under resources/js in
  # what was actually built settles it the other way.
  if [ "$(field "$num" 7)" = yes ] || sandbox_exec "$sandbox" git diff --name-only "host/$base...HEAD" |
    grep -q '^api/resources/js/.*\.tsx$'; then
    # Passed in rather than run from the clone: a stacked branch may predate the script.
    sandbox_exec "$sandbox" bash -c 'printf "%s\n" "$1" > /tmp/dev-server.sh && chmod +x /tmp/dev-server.sh' \
      dev-server "$(cat "$RALPH_DIR/dev-server.sh")" || return 1
    run_agent "$sandbox" "$num-verify" "$(render "$RALPH_DIR/prompts/verify.md" "$@")" || return 1
  fi
  run_agent "$sandbox" "$num-review" "$(render "$RALPH_DIR/prompts/review.md" "$@")" || return 1

  # The loop's own gates: never trust a session's word that the build is green.
  log "#$num: gates"
  sandbox_exec "$sandbox" bash -c "$(cat "$RALPH_DIR/gates.sh")" gates "host/$base" \
    > "$STATE/logs/$num-gates.log" 2>&1 ||
    { log "#$num: gates red or changes left uncommitted; see $STATE/logs/$num-gates.log"; return 1; }
  git fetch -q "sandbox-$sandbox" "+refs/heads/$branch:$fetched" || return 1
  [ "$(git rev-list --count "$base..$fetched")" -gt 0 ] || { log "#$num: no commits"; return 1; }
  git branch -q -f --no-track "$branch" "$fetched" || return 1
  set_field "$num" 2 built

  run_agent "$sandbox" "$num-pr" "$(render "$RALPH_DIR/prompts/pr.md" "$@")" || return 1
  # pr/ is writable from the sandbox, so the host never opens a file in it: a symlink there
  # would have the host publish one of its own files as the PR body. Read both through the
  # sandbox, where a link reaches nothing the agent could not already read.
  title="$(sandbox_exec "$sandbox" head -n 1 "$STATE/pr/$num.title")" &&
    body="$(sandbox_exec "$sandbox" cat "$STATE/pr/$num.md")" ||
    { log "#$num: no PR title or body in $STATE/pr/"; return 1; }
  push -u origin "$branch" || return 1
  url="$(gh pr create --draft --base "$base_branch" --head "$branch" \
    --title "$title" --body "$body")" || return 1
  set_field "$num" 2 pr-open
  waiting_on_you "$num" "draft PR $url to review and merge"
  move_on_board "$num" "In Review" || log "#$num: could not move it to In Review on project $PROJECT"
  { printf 'The Ralph loop built this ticket: draft PR %s, on branch `%s`.\n\nThe loop'"'"'s own gates:\n\n' "$url" "$branch"
    gate_summary "$num"
    printf '\nWhat the reviews left unfixed is in the PR body.\n'; } |
    gh issue comment "$num" --body-file - >/dev/null || log "#$num: the issue comment failed; the PR is open regardless"
  sbx stop "$sandbox" </dev/null >/dev/null 2>&1 || true
}

# cmd_ticket NUM: builds one ticket on its own, whether or not it belongs to a map. Running the
# command is the approval, so it only has to be open. Its progress is kept with its map's, so a
# map build later sees it. It stacks on a blocker's open loop branch when it has one, and
# refuses while any other blocker is open.
cmd_ticket() {
  local num="$1" json row map local_state bnum bstate stacked="" base base_branch
  json="$(gh api graphql -F owner="$OWNER" -F name="$NAME" -F num="$num" -f query="
    query(\$owner: String!, \$name: String!, \$num: Int!) { repository(owner: \$owner, name: \$name) {
      issue(number: \$num) { $ISSUE_FIELDS parent { number body } } } }")"
  [ "$(printf '%s' "$json" | jq -r '.data.repository.issue != null')" = true ] || { log "issue #$num not found"; exit 1; }
  map="$(printf '%s' "$json" | jq -r '.data.repository.issue.parent.number // empty')"
  MAP="${map:-$num}"
  use_state "$MAP"
  if [ -n "$map" ]; then
    SPEC="${RALPH_SPEC:-$(spec_from_body "$(printf '%s' "$json" | jq -r .data.repository.issue.parent.body)")}"
  else
    SPEC="${RALPH_SPEC:-}"
  fi
  printf '%s' "$SPEC" | grep -Eq '^[0-9]*$' || { log "RALPH_SPEC must be an issue number"; exit 1; }
  if [ -n "$SPEC" ]; then
    printf '%s\n' "$SPEC" > "$STATE/spec"
    write_context "$SPEC" "$STATE/context/spec.md"
  fi
  log "#$num: ${map:+map #$map}${map:-no map}; spec: ${SPEC:+#$SPEC}${SPEC:-none, the ticket is the spec}"

  row="$(printf '%s' "$json" | jq -r --arg owner "$OWNER" --arg ready "$READY" ".data.repository.issue | $TICKET_JQ")"
  local_state="$(field "$num" 2)"
  if [ -z "$local_state" ]; then
    printf '%s\n' "$row" | awk -F'\t' -v OFS='\t' '{ print $1, "new", $2, $3, $4, $5, $6, $7, "ralph/" $1 "-" $5, $8 }' >> "$QUEUE"
    local_state=new
  else
    set_field "$num" 3 "$(printf '%s' "$row" | cut -f2)"
    set_field "$num" 10 "$(printf '%s' "$row" | cut -f8)"
  fi
  case "$local_state" in
    pr-open) log "#$num already has a draft PR from the loop"; exit 0 ;;
    built | failed) stopped_at "$num" "is $local_state; once the cause is fixed: ralph.sh retry $MAP $num"; exit 1 ;;
  esac
  if [ "$(field "$num" 3)" = CLOSED ] && [ "$local_state" = new ]; then log "#$num is closed; nothing to build"; exit 0; fi
  if [ "$local_state" = new ] && needs_prototype "$num"; then exit 1; fi

  git fetch -q origin --prune
  while read -r bnum; do
    [ -n "$bnum" ] || continue
    bstate="$(field "$bnum" 2)"
    case "$bstate" in
      built | pr-open)
        [ "$(pr_state "$(field "$bnum" 9)")" != MERGED ] || continue
        [ -z "$stacked" ] || { stopped_at "$num" "is blocked by two unmerged loop branches; merge one first"; exit 1; }
        stacked="$(field "$bnum" 9)" ;;
      *) stopped_at "$num" "is blocked by #$bnum, which is open (and was not built by this loop for map #$MAP)"; exit 1 ;;
    esac
  done < <(printf '%s' "$json" | jq -r '.data.repository.issue.blockedBy.nodes[] | select(.state == "OPEN") | .number')
  if [ -n "$stacked" ]; then
    base="$(git rev-parse "refs/heads/$stacked")"
    base_branch="$stacked"
  else
    base="$(git rev-parse origin/main)"
    base_branch=main
  fi

  log "=== #$num on $base_branch ==="
  if build_ticket "$num" "$base" "$base_branch" </dev/null; then
    cmd_status
    cmd_retro
  else
    set_field "$num" 2 failed
    stopped_at "$num" "failed; its logs are in $STATE/logs/. Fix the cause, then: ralph.sh retry $MAP $num"
    cmd_status
    cmd_retro
    exit 1
  fi
}

# Walks the queue in blocking order. Each ticket stacks on the one before it until that one
# merges. The chain stops at the first ticket that is neither finished nor ready, or that
# fails, because everything after it would be built on top of it.
cmd_build() {
  local limit="${1:-999}" built=0 attempted=0 base base_branch
  local num local_state state approved assigned branch
  # A `queue` run minutes ago already read GitHub; RALPH_REFRESH=1 re-reads it anyway.
  if [ -z "${RALPH_REFRESH:-}" ] && read_recently "$QUEUE" && read_recently "$STATE/spec"; then
    SPEC="${RALPH_SPEC:-$(cat "$STATE/spec")}"
    log "reusing the queue read from GitHub under 10 minutes ago (RALPH_REFRESH=1 re-reads it)"
  else
    refresh_queue || exit 1
  fi
  git fetch -q origin --prune
  base="$(git rev-parse origin/main)"
  base_branch=main
  while IFS="$TAB" read -r num local_state state approved assigned _ _ _ branch _; do
    [ "$built" -lt "$limit" ] || break
    case "$local_state" in
      built | pr-open)
        if [ "$(pr_state "$branch")" != MERGED ]; then
          base="$(git rev-parse "refs/heads/$branch")"
          base_branch="$branch"
        fi
        continue ;;
      failed) stopped_at "$num" "failed last time; fix the cause, then: ralph.sh retry $MAP $num"; break ;;
      retry) ;;
      new)
        if [ "$state" = CLOSED ]; then continue; fi
        if [ "$approved" != yes ]; then
          stopped_at "$num" "has no '$READY' label; add it to approve the ticket"
          log "Stopping here, because the tickets after it build on it"
          break
        fi
        if [ "$assigned" = yes ]; then
          stopped_at "$num" "is assigned, so another session has claimed it; unassign it to let the loop build it"
          log "Stopping here"
          break
        fi
        if needs_prototype "$num"; then log "Stopping here, because the tickets after it build on it"; break; fi ;;
    esac
    log "=== #$num on $base_branch ==="
    attempted=$((attempted + 1))
    if build_ticket "$num" "$base" "$base_branch" </dev/null; then
      built=$((built + 1))
      base="$(git rev-parse "refs/heads/$branch")"
      base_branch="$branch"
    else
      set_field "$num" 2 failed
      stopped_at "$num" "failed; its logs are in $STATE/logs/. Fix the cause, then: ralph.sh retry $MAP $num"
      log "Stopping the chain"
      break
    fi
  done < <(cat "$QUEUE")
  cmd_status
  if [ "$attempted" -gt 0 ]; then cmd_retro; fi
}

cmd_retro() {
  map_sandbox
  run_agent "$MAP_SANDBOX" "retro-$(date +%Y%m%d-%H%M%S)" \
    "$(render "$RALPH_DIR/prompts/retro.md" MAP "$MAP" STATE "$STATE")" &&
    log "retro: $STATE/reports/retro.md"
}

# Removing a sandbox also removes its sandbox-<name> remote; fetched commits survive in the
# local branches the loop made. Safe to re-run: what is already gone (no sandbox left, a
# branch deleted earlier) is skipped, never treated as a failure under `set -e`.
cmd_clean() {
  local num branch
  sbx ls 2>/dev/null | awk '{ print $1 }' |
    { grep -E "^ralph-(map$MAP-main|$(cut -f1 "$QUEUE" | paste -sd'|' -))$" || true; } |
    while read -r sandbox; do
      if sbx rm -f "$sandbox" </dev/null >/dev/null; then log "removed sandbox $sandbox"; else log "could not remove sandbox $sandbox"; fi
    done
  git branch -D "ralph-base/map$MAP" >/dev/null 2>&1 || true
  while IFS="$TAB" read -r num _ _ _ _ _ _ _ branch _; do
    git branch -D "ralph-base/$num" "ralph-proto/$num" >/dev/null 2>&1 || true
    if [ "$(pr_state "$branch")" = MERGED ] && git branch -D "$branch" >/dev/null 2>&1; then
      log "deleted $branch (PR merged)"
    fi
  done < <(cat "$QUEUE")
}

case "$MODE" in
  queue) cmd_queue ;;
  build) cmd_build "${3:-999}" ;;
  ticket) cmd_ticket "$MAP" ;;
  retry) shift 2; cmd_retry "$@" ;;
  retro) cmd_retro ;;
  status) cmd_status ;;
  clean) cmd_clean ;;
  *) sed -n '5,11p' "$0" >&2; exit 2 ;;
esac
