#!/usr/bin/env bash
# Runs INSIDE a ticket's sandbox; ralph.sh passes it in before the first agent session, with
# the path of the sandbox's private clone (sbx create --clone) as its one argument.
#
# Gives the ticket its own MariaDB 10.11 (the sandbox has a private Docker daemon, so nothing is
# shared with the host or with another ticket), with two databases:
#   gtrack       migrated, with two throwaway users, for `php artisan serve` and the browser check
#   gtrack_test  empty, for Pest, which refreshes it on every run (api/phpunit.xml)
# Then the same installs as CI, and api/.env with mail going to the log, so sign-in codes land
# in api/storage/logs/laravel.log. Safe to re-run: each step either is idempotent or checks first.
set -euo pipefail

CHECKOUT="$1"
cd "$CHECKOUT"

# The credentials are api/.env.example's and api/phpunit.xml's local defaults.
if ! docker ps --format '{{.Names}}' | grep -qx gtrack-mariadb; then
  docker rm -f gtrack-mariadb >/dev/null 2>&1 || true
  docker run -d --name gtrack-mariadb -p 3306:3306 -e MARIADB_ROOT_PASSWORD=password mariadb:10.11 >/dev/null
fi
for _ in $(seq 1 60); do
  docker exec gtrack-mariadb healthcheck.sh --connect --innodb_initialized >/dev/null 2>&1 && break
  sleep 2
done
docker exec gtrack-mariadb mariadb -uroot -ppassword \
  -e 'CREATE DATABASE IF NOT EXISTS gtrack; CREATE DATABASE IF NOT EXISTS gtrack_test;'

# The sandbox's egress proxy resets the odd long download (ECONNRESET), so retry.
retry() { for attempt in 1 2 3; do "$@" && return 0; [ "$attempt" -lt 3 ] || return 1; done; }

cd api
retry composer install --no-interaction --no-progress
if [ ! -f .env ]; then
  cp .env.example .env
  php artisan key:generate
fi
php artisan migrate --force
retry npm ci --no-audit --no-fund
npm run build

cd "$CHECKOUT"
corepack enable pnpm
retry pnpm install --frozen-lockfile

# Two users the browser check signs in as, past first sign-in. The marker lives outside the
# checkout so it can never be committed.
SEEDED="$HOME/.ralph-seeded"
if [ ! -f "$SEEDED" ]; then
  (cd api && php artisan tinker --execute '
    foreach (["ralph-golfer@example.test" => ["golfer"], "ralph-admin@example.test" => ["admin", "golfer"]] as $email => $roles) {
        $user = App\Models\User::firstOrCreate(["email" => $email]);
        $user->syncRoles($roles);
        Illuminate\Support\Facades\DB::table("settings")->insertOrIgnore([
            "id" => (string) Illuminate\Support\Str::uuid7(),
            "user_id" => $user->id,
            "fallback_handicap_index" => "18.0",
            "created_at" => now(),
            "updated_at" => now(),
        ]);
    }')
  touch "$SEEDED"
fi
