#!/usr/bin/env bash
# Runs INSIDE a ticket's sandbox, after the review session; ralph.sh passes it in with the
# ticket's base ref as its one argument. These are the loop's own gates: it never takes a
# session's word that the build is green.
#
# ralph.sh also copies it to /tmp/gates.sh, and the implement and review sessions run that copy
# before they commit, with GATES_ALLOW_DIRTY=1 to skip the clean-tree check. A session and the
# loop then gate on exactly the same checks.
#
# The same checks as CI (.github/workflows/api.yml and mobile.yml): generated types up to date,
# the web typecheck and build, and the whole Pest suite against MariaDB; the phone's typecheck
# and Jest when apps/mobile or packages/types changed. Pint on the PHP the change touched.
# Then a clean tree.
set -euo pipefail

BASE="$1"
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT/api"

# types_state: what packages/types looks like in the working tree, tracked and untracked.
types_state() {
  { git -C "$ROOT" status --porcelain -- packages/types; git -C "$ROOT" diff -- packages/types; } | shasum
}

echo "types: php artisan typescript:transform"
before="$(types_state)"
php artisan typescript:transform >/dev/null
if [ "$(types_state)" != "$before" ]; then
  echo "Generated types were out of date; regenerated them. Commit packages/types:"
  git -C "$ROOT" status --porcelain -- packages/types
  exit 1
fi

echo "pint: the PHP files changed since $BASE"
vendor/bin/pint --test --diff="$BASE"

npm run typecheck
npm run build
vendor/bin/pest

if git -C "$ROOT" diff --name-only "$BASE" | grep -Eq '^(apps/mobile|packages/types)/'; then
  echo "mobile: typecheck and Jest"
  cd "$ROOT/apps/mobile"
  pnpm typecheck
  pnpm test
fi

cd "$ROOT"
[ -n "${GATES_ALLOW_DIRTY:-}" ] || test -z "$(git status --porcelain --untracked-files=no)" ||
  { echo "changes left uncommitted:"; git status --short --untracked-files=no; exit 1; }
