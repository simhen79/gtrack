# Ralph loop

`ralph.sh` builds the tickets of a Wayfinder map one after another, without anyone at the
keyboard. Each ticket gets its own Docker sandbox (`sbx`), a private git clone inside it, and its
own MariaDB. Every agent session in it is a fresh `claude -p` whose transcript is kept for the
retro. The loop never merges anything: each ticket ends as a draft PR for a person to review.

It starts where the Wayfinder map leaves off. **GitHub decides what gets built:** the loop reads
the map's child issues and their native "blocked by" links, and the `ready-for-agent` label is
what approves a ticket. The spec is the issue the map's body links as "Spec: ...", currently
[Spec: Golf practice app v1](https://github.com/simhen79/gtrack/issues/17). Its "Testing
Decisions" name the seams, and each ticket's acceptance criteria say what to test at them.
Together they are the pre-agreed seams `tdd` needs.

**Skills come from the host.** A sandbox has none of your skills, so before every session the
loop copies in the ones the prompts call (`tdd`, `codebase-design`, `code-review`, `pr`), from
`~/.claude/skills` or else the newest `mattpocock-skills` plugin. It replaces the whole of
`/home/agent/.claude/skills`, a path the host fixes rather than asks the sandbox for, and refuses
if that directory's parent has been turned into a link. The agent has sudo in its sandbox, so
read-only files wouldn't hold; a fresh copy per session means no session follows skills an
earlier one changed or added. Sandboxes are created with `--skills=off`, so sbx's shared skills
store doesn't mount over that directory read-only. If a skill is missing, the ticket stops
before any session runs; a session that still finds a skill unknown ends blocked rather than
working without it.

```
queue ─► build, per approved ticket in blocking order:
           setup ─► implement ─► verify* ─► review ─► gates ─► PR ─► issue comment
         then retro over every session
                                  * only for tickets with a web page
```

| Phase | What runs | Output |
|---|---|---|
| queue | On the host, no agent: `gh` reads the map's child issues, labels, assignees, blocking links and owner comments, and the spec issue | `queue.tsv` in blocking order; `spec`; `context/spec.md` |
| setup | `sandbox-setup.sh`: a private MariaDB, `composer install`, `api/.env`, migrate, `npm ci` and build, `pnpm install`, two throwaway users | `logs/<NUM>-setup.log` |
| implement | `prompts/implement.md`: the `tdd` skill at the spec's and ticket's seams, the design system for screens, and the prototype's chosen variant when there is one. It runs `/tmp/gates.sh` (a copy of `gates.sh`) before it commits | commits, `reports/<NUM>-build.md` |
| verify | for a ticket whose Design section lists screens, or whose build changed a page under `api/resources/js`: `agent-browser` against `php artisan serve`, which `dev-server.sh` starts and stops, signed in as the throwaway users, at desktop and phone width, light and dark | `reports/<NUM>-verify.md` |
| review | the `code-review` skill, in a fresh context, against the ticket, the spec, `CLAUDE.md` and the design system, fixing what it finds test-first (each fix's test seen red before the fix), and running `/tmp/gates.sh` before it commits | `reports/<NUM>-review.md` |
| gates | `gates.sh`: the loop itself runs CI's checks (generated types up to date, the web typecheck and build, the whole Pest suite on MariaDB), Pint on the PHP the change touched, and the phone's typecheck and Jest when `apps/mobile` or `packages/types` changed. It does not take a session's word for any of them | `logs/<NUM>-gates.log` |
| PR | the `pr` skill writes the body, then a test guide from the finished branch; the loop pushes and opens a **draft** PR | `pr/<NUM>.md`, `pr/<NUM>.test.md` |
| comment | the host comments on the ticket with the PR link, the gate results and the test guide, under "How to test", for a person or an agent to follow | |
| retro | `prompts/retro.md` over every transcript in `logs/` | `reports/retro.md` |

State lives outside the repo, in `~/.ralph/gtrack/map-<N>/` (change it with `RALPH_STATE`).

**Some screens need a prototype first.** A ticket whose Design section says "Prototype before
building" is built from a prototype a person has driven, not from the loop's guess at the
design. Run `/mattpocock-skills:prototype`, push its `prototype/` branch to origin, and name that
branch, with the verdict, in a comment on the ticket. `build` and `ticket` stop at such a ticket
until that branch exists on origin, and label it `needs-prototype` (change it with
`RALPH_PROTO_LABEL`) so the board shows it. The label comes off once the branch is there. A
comment may mention other `prototype/` paths too, such as the prototype's route: the loop tries
every one it finds, newest mention first, and builds from the first that is a branch on origin.

**A run tells you what it's waiting on.** `build` and `ticket` end with a "Waiting on you" block
listing each draft PR to review and the ticket the chain stopped at, with the step to take: a
missing prototype, a missing `ready-for-agent` label, a ticket assigned elsewhere, an open
blocker, or a failed build. They also post a macOS notification: "Waiting on you" when the chain
stopped early, "Stopped with an error" when the script itself failed, "Finished" otherwise. The
first time, macOS may ask you to allow notifications from Script Editor, which `osascript` posts
them as.

**The phone app is checked by a person.** The sandbox can't run iOS or Android, so the verify
step lists the phone checks still owed, and the PR body carries them.

## Trust boundary

An agent in a sandbox runs with every permission, so the loop never lets it write anything the
host will later execute:

- **Git.** Each sandbox works on a private clone (`sbx create --clone`), with the host repo
  mounted read-only. A hook or a config line planted in the clone's `.git` stays in the
  sandbox. The host takes the commits back with `git fetch sandbox-<name>`, which runs nothing
  from the other side, and only the host pushes.
- **State.** A sandbox can write `reports/` and `pr/` only. `logs/` and `context/` are mounted
  read-only, and `queue.tsv` never leaves the host. Everything read from GitHub that names a
  branch (numbers, slugs, `prototype/` branches) is validated before it is used. The host never
  opens a file in `pr/`: it reads the title and body through the sandbox, so a symlink planted
  there cannot point the host at its own files.
- **A public tracker.** Anyone can comment on a public issue, so the host passes a session only
  the issue's body and its owner's comments, and the prompts treat that text as the
  specification, never as instructions. The prototype pointer must likewise come from the owner.
- **No GitHub inside.** Sandboxes get no token. The host claims tickets, pushes, opens PRs and
  comments, as `RALPH_GH_USER`.
- **Clones need the main repository.** `--clone` refuses a worktree, so the loop clones the
  main checkout. Bases are passed to the clone as `ralph-base/<NUM>` branches, so a stale local
  `main` does not matter.

## Once per machine

```bash
scripts/ralph/build-template.sh   # PHP 8.4, Composer, Node 24, pnpm, agent-browser, Chromium → gtrack-ralph:1
```

You also need `sbx`, `jq`, and `gh` signed in as `RALPH_GH_USER` (default `simhen79`) with the
`project` scope for the board moves (`gh auth refresh -s project`).

## Running a map: the sequence

Run every command from the main checkout, on an up-to-date `main`.

1. **Chart the map** with `/wayfinder`. Build tickets need native "blocked by" links, Given/When/Then
   acceptance criteria and, for screens, a Design section.
2. **Prototype** any ticket whose Design section asks for it, and name the `prototype/` branch on it.
3. **Approve on GitHub:** add the `ready-for-agent` label to the tickets you want built.
4. **Check the queue:** `scripts/ralph/ralph.sh queue 1`. It prints the spec it found and the
   order it will build in.
5. **Build one ticket first:** `scripts/ralph/ralph.sh build 1 1`. Read its logs, reports and
   draft PR before trusting the loop with more.
6. **Build the rest:** `scripts/ralph/ralph.sh build 1`. The retro runs at the end.
7. **Review and merge the draft PRs,** bottom of the stack first; the loop never merges. Then
   record each resolution on the map as Wayfinder says (a resolution comment and a line in
   Decisions so far).
8. **Clean up:** `scripts/ralph/ralph.sh clean 1`

Check where things stand at any point with `scripts/ralph/ralph.sh status 1`.

## Building chosen tickets

```bash
scripts/ralph/ralph.sh ticket 22
scripts/ralph/ralph.sh ticket 66 67 60 47
```

Builds exactly those tickets, in the order given, through the same pipeline, then runs the
retro once. It works for tickets on a map and for ones with no map, such as a bug.

- **A list doesn't stop at the first problem.** A ticket that needs a prototype, is blocked or
  fails is listed under "Waiting on you", and the next ticket is built. Put a blocker before the
  tickets it blocks: a ticket stacks on a blocker's branch only once that branch is built.
- **Each ticket starts from `main`,** unless it stacks on a blocker, so unrelated tickets give
  separate draft PRs that merge in any order.

- **Running the command approves it.** The label does not matter, as long as the issue is open.
- **Spec:** the map's "Spec:" issue, as for a map build. With no map, the ticket itself is the
  whole spec. `RALPH_SPEC` (an issue number) overrides either.
- **Blockers:** it builds on `main` when every blocker is closed. When a blocker has an open
  draft PR from the loop, it stacks on that branch. It refuses while any other blocker is
  open, or when two blockers have unmerged loop branches.
- **Progress** is kept with the map's, in `~/.ralph/gtrack/map-<N>/`, so a later `build` of the
  map sees the ticket as done and stacks on it. A ticket with no map gets a folder of its own;
  use its number as the "map" for `status`, `retry`, `retro` and `clean`.

## Commands

Every command takes the map's issue number as its second argument, and keeps that map's state
apart in `~/.ralph/gtrack/map-<N>/`.

| Command | What it does |
|---|---|
| `queue <MAP>` | Reads the map's child issues from GitHub, with their state, labels, assignees and blocking links, finds the spec issue, and writes `queue.tsv` in blocking order. Shows the spec and what `build` would do. Stops when no spec is found. Changes no code; on GitHub it only moves the tickets the loop could start now to Selected For Development on the board. |
| `build <MAP> [max]` | Refreshes the queue (or reuses one read under 10 minutes ago, unless `RALPH_REFRESH=1`), then works down it. A closed ticket is skipped. An open ticket with the `ready-for-agent` label, unassigned, and with its prototype when its Design section asks for one, is built: claimed (assigned), set up, implemented, browser-checked when it has a web page, reviewed, gated by the loop, opened as a draft PR, and commented on. The chain stops at the first ticket that isn't ready, or that fails. `max` caps how many tickets this run builds. Tickets the loop already finished are skipped, so a second run carries on. Ends with the retro whenever it attempted a ticket. |
| `ticket <NUM>...` | Builds the tickets given, in order, each on its own, map or not, then runs the retro. See *Building chosen tickets*. |
| `retry <MAP> <NUM>...` | Lets `build` try a `failed` ticket again, or one stuck at `built`. Its assignment no longer matters, since the build itself claimed it. |
| `retro <MAP>` | Runs the retro over every transcript, gate log and report so far, and writes `reports/retro.md`. `build` already runs it; use this to run it again. |
| `status <MAP>` | Prints `queue.tsv` as last read. Changes nothing and does not call GitHub. |
| `clean <MAP>` | Removes the map's sandboxes (and their `sandbox-<name>` remotes) and the `ralph-base/*` and `ralph-proto/*` branches, and deletes local ticket branches whose PR has merged. Unmerged branches are kept. Safe to re-run: what is already gone is skipped. |

`queue.tsv` keeps what GitHub says about each ticket (state, label, assignee) beside the loop's
own progress, `LOCAL`:

| LOCAL | Meaning | Next step |
|---|---|---|
| `new` | Not started by the loop | Built when it's open, labelled `ready-for-agent` and unassigned |
| `built` | Gates green and commits fetched back; the PR step has not finished. Only seen when a run was interrupted there | `retry`, then `build`; the sandbox still has the commits |
| `pr-open` | Draft PR open, ticket commented | Review and merge it |
| `failed` | A phase failed, the gates went red, or a session gave up | Read `logs/<NUM>-<phase>-failed.md`, then `logs/` and `reports/`; fix the cause, `retry`, then `build` |
| `retry` | Released by `retry` | `build` |

Settings, as environment variables:

| Variable | Default | What it sets |
|---|---|---|
| `RALPH_SPEC` | the issue the map links as "Spec: ..." | Overrides the spec issue, by number |
| `RALPH_READY_LABEL` | `ready-for-agent` | The label that approves a ticket |
| `RALPH_GH_USER` | `simhen79` | The `gh` account the host claims, pushes, opens PRs and comments as |
| `RALPH_PROJECT` | `2` | The project board ("gtrack v1") whose Status the loop moves. Set it empty to turn board moves off |
| `RALPH_STATE` | `~/.ralph/gtrack` | Where each map's state folder lives |
| `RALPH_TEMPLATE` | `gtrack-ralph:1` | The sandbox template `build-template.sh` saved |
| `RALPH_MAX_TURNS` | `200` | The turn limit for each agent session |
| `RALPH_REFRESH` | unset | `1` makes `build` re-read GitHub even when `queue` ran under 10 minutes ago |

## Where progress is kept

| Where | Holds |
|---|---|
| **GitHub issues** | What to build (the map's tickets, their order, their approval label) and what the loop did (the assignee claim, then a comment with the PR link) |
| **Project board** | The `gtrack v1` board's Status, for people to look at. Each queue refresh moves every ticket the loop could start now (open, labelled `ready-for-agent`, unassigned, no open blocker) to Selected For Development; a claim moves it to In Progress, and the draft PR to In Review. A ticket not on the board is added. A failed move is logged and the run carries on. The PR body's `Closes #NUM` closes the ticket on merge, and the board's own workflow moves a closed item to Done. The loop never moves a ticket back, so one that loses its label or fails stays where it was |
| `queue.tsv` | The loop's own progress per ticket, the branch it made, and every `prototype/` path the ticket's comments name |
| `spec`, `context/` | The spec issue's number; the spec and each ticket as passed to the sessions |
| `reports/` | What each phase did, why a session was blocked, and `retro.md` |
| `pr/` | Each PR's title and body |
| `logs/` | Every session's transcript, plus the setup and gate logs. A session that did not complete leaves `<session>-failed.md` beside its transcript, and a retry keeps the earlier attempt's files under a timestamped name |
| Local branches | Each built ticket (`ralph/<NUM>-<slug>`), which the next ticket stacks on |
| GitHub PRs | Whether a ticket's PR has merged |

Every `build` re-reads GitHub, so closing a ticket skips it and labelling one approves it,
without touching the loop. Deleting the state folder loses only the loop's own progress: a
ticket it had built shows as `new` again, but stays assigned, so `build` stops at it until it is
unassigned.

## How the chain works

- **Stacked branches.** A ticket branches from the ticket before it, until that one merges.
  Its PR targets that branch and says so. The repo merges with merge commits, and GitHub
  retargets a stacked PR to `main` when the branch below it is deleted.
- **The chain stops at the first ticket that is neither ready nor finished, or that fails,**
  because everything after it would be built on top of it.

## Each sandbox's database

The sandbox has a Docker daemon of its own, so `sandbox-setup.sh` starts a private MariaDB 10.11
that no other ticket or chat can touch:

- `gtrack` is migrated and holds the two throwaway users, `ralph-golfer@example.test` and
  `ralph-admin@example.test`. `php artisan serve` and the browser check use it.
- `gtrack_test` is for Pest, which refreshes it on every run.

Mail goes to the log, so sign-in codes appear in `api/storage/logs/laravel.log`. The sandbox runs no Mailpit, so `sandbox-setup.sh` sets `MAIL_MAILER=log` over the Mailpit setting `.env.example` carries.
