# gtrack API and web app

Laravel 12 on PHP 8.4, with Inertia v3, React 19 and `@heroui/react`. This folder sits outside the pnpm workspace and has its own npm lockfile.

## Local development

```sh
docker run -d --name gtrack-mariadb -e MARIADB_ROOT_PASSWORD=password -p 3306:3306 mariadb:10.11
docker exec gtrack-mariadb mariadb -uroot -ppassword -e 'CREATE DATABASE gtrack; CREATE DATABASE gtrack_test'
cp .env.example .env && php artisan key:generate && php artisan migrate
npm install && npm run dev
```

## Testing conventions

- Tests are Pest feature tests that call the app the way a client does, and run against a real MariaDB 10.11 database (`gtrack_test`), never SQLite.
- Every feature test refreshes the database.
- Ids are UUIDv7 from `HasUuids`, except Games and Drills, which use text ULIDs.
- Each model has a factory. Name factory states after glossary terms (`GLOSSARY.md` at the repo root).
- `golfer()` creates a golfer to act as.
- Every golfer-data endpoint gets an `assertGolferIsolation()` test: a second golfer can neither see nor change the first golfer's record.

## Operations

- `php artisan ops:status` shows when the scheduler heartbeat and the queue check last ran.
- `php artisan ops:queue-check` dispatches a job that a queue worker records.

Deploys run from GitHub Actions on every merge to `main`: tests, build, rsync to the server, then migrate, optimize and `queue:restart`.
