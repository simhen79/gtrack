#!/usr/bin/env bash
# Starts and stops the web app inside a Ralph sandbox, for the browser check.
#
#   /tmp/dev-server.sh start [NAME=value ...]   e.g. start APP_DEBUG=false
#   /tmp/dev-server.sh stop
#
# ralph.sh copies it to /tmp/dev-server.sh in the sandbox before the browser check, because a
# stacked ticket's branch may predate it.
#
# `start` rebuilds the front end (`npm run build`), so the page shows the branch as committed,
# then runs `php artisan serve` on port 8000. The server runs in a process group of its own,
# whose id is kept in /tmp/gtrack-dev.pgid, and `stop` kills exactly that group. A session must
# never kill by name or pattern: its own command line holds its prompt, which mentions
# `php artisan serve`. A NAME=value given to `start` is in the process environment, so it wins
# over api/.env.
set -euo pipefail

API="$(git rev-parse --show-toplevel)/api"
PGID_FILE=/tmp/gtrack-dev.pgid
LOG=/tmp/gtrack-dev.log
URL=http://localhost:8000/login

up() { [ "$(curl -s -o /dev/null -w '%{http_code}' "$URL" || true)" != 000 ]; }
alive() { [ -s "$PGID_FILE" ] && kill -0 -- "-$(cat "$PGID_FILE")" 2>/dev/null; }

launch() {
  rm -f "$PGID_FILE"
  # setsid -f always forks, so the PID that `sh` writes is the new group's leader.
  (cd "$API" && setsid -f sh -c 'echo $$ > '"$PGID_FILE"'; exec env "$@" php artisan serve --host 127.0.0.1 --port 8000' sh "$@" > "$LOG" 2>&1)
  for _ in 1 2 3 4 5 6 7 8 9 10; do [ -s "$PGID_FILE" ] && return 0; sleep 0.2; done
  echo "dev-server: the server did not start" >&2
  return 1
}

start() {
  if alive; then echo "dev-server: already running (group $(cat "$PGID_FILE")); stop it first" >&2; exit 1; fi
  (cd "$API" && npm run build) > /tmp/gtrack-build.log 2>&1 ||
    { echo "dev-server: npm run build failed; last lines of /tmp/gtrack-build.log:" >&2; tail -n 40 /tmp/gtrack-build.log >&2; exit 1; }
  launch "$@"
  for _ in $(seq 1 60); do
    if up; then echo "dev-server: up on $URL (group $(cat "$PGID_FILE"))"; return 0; fi
    alive || break
    sleep 1
  done
  echo "dev-server: not answering on $URL; last lines of $LOG:" >&2
  tail -n 40 "$LOG" >&2
  stop || true
  exit 1
}

stop() {
  if ! alive; then echo "dev-server: not running"; rm -f "$PGID_FILE"; return 0; fi
  kill -- "-$(cat "$PGID_FILE")" 2>/dev/null || true
  for _ in $(seq 1 30); do
    if ! up && ! alive; then rm -f "$PGID_FILE"; echo "dev-server: stopped"; return 0; fi
    sleep 1
  done
  kill -KILL -- "-$(cat "$PGID_FILE")" 2>/dev/null || true
  rm -f "$PGID_FILE"
  echo "dev-server: stopped (forced)"
}

case "${1:-}" in
  start) shift; start "$@" ;;
  stop) stop ;;
  *) sed -n '4,5p' "$0" >&2; exit 2 ;;
esac
