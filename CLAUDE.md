# gtrack

A golf practice app: golfers log Rounds with Strokes Gained and get Practice Sessions that adapt to them, on iOS, Android and the web.

## Sources of truth

- **Spec:** [Spec: Golf practice app v1](https://github.com/simhen79/gtrack/issues/17) wins wherever code, tickets or docs disagree.
- **Vocabulary:** `GLOSSARY.md`. Use its terms exactly, capitalised, in code, tests and UI copy.
- **Plan:** the Wayfinder map, [Map: Golf practice app v1](https://github.com/simhen79/gtrack/issues/1). Build slices are its child issues, each with Given/When/Then criteria.
- **Design:** read `docs/design-system/README.md` before building or restyling any screen, web or phone. `docs/design-brief.md` explains the app to designers.
- **Decisions:** ADRs in `docs/adr/`.

## Layout

- `api/`: Laravel 12 with Inertia and React for the web, plus the JSON API the phone uses. It has its own npm lockfile and sits **outside** the pnpm workspace, so run its commands from `api/`.
- `apps/mobile/`: the Expo app. Read `apps/mobile/AGENTS.md` before touching Expo or React Native APIs.
- `packages/design/`: design-system helpers both apps import, such as `formatSG` from `docs/design-system/code/sg.ts`. The web reaches it through an alias in `api/vite.config.ts` and `api/tsconfig.json`, as it does `packages/types`.
- `packages/types/`: TypeScript generated from the laravel-data DTOs in `api/app/Data`. Regenerate it with `php artisan typescript:transform` in `api/` after changing a DTO, and commit the result: CI fails on drift.

## Golfer-owned data

- Models holding a golfer's data use `BelongsToGolfer`. Its scope reads `CurrentGolfer` and throws when none is set (fail closed). Requests set it in middleware; jobs, tinker and test setup set it themselves.
- An arch test treats every model as golfer-owned unless `api/tests/Arch/GolferOwnedTest.php` lists it as shared.
- Golfer-owned tables cascade from `users`, and detail tables cascade from their parent; `api/tests/Arch/GolferDeletionTest.php` checks the schema and lists the exceptions.
- Every golfer-data endpoint gets an `assertGolferIsolation` test. A second golfer sees a 404, never a 403.

## Tests

- Pest feature tests through HTTP (Inertia props, JSON responses) against a real MariaDB test database, one per acceptance criterion, written first. There are no unit tests of domain services and no browser tests.
- Helpers in `api/tests/Pest.php`: `golfer()` and `admin()` are signed up and have settings, `newGolfer()` is at first sign-in, `signInWithCode()` goes through the real email-code flow.

## Local development

- Mail goes to Mailpit (`docker compose up -d` in `api/`), so sign-in codes appear in the inbox at http://localhost:8025 (or `MAILPIT_UI_PORT` in `api/.env`). Ralph's sandboxes run no Mailpit and keep mail in `api/storage/logs/laravel.log`.
- The CSS files in `docs/design-system/code/` are generated from `tokens.json`, but the generator isn't in the repo yet: change `tokens.json` and the CSS together.
- The mail theme (`api/resources/views/vendor/mail/html/themes/gtrack.css` and the dark-mode block in `layout.blade.php`) copies its colours from `tokens.json` by hand: change them with it too.

## GitHub

Run `gh` as the `simhen79` account, scoped to each command: `GH_TOKEN=$(gh auth token --user simhen79) gh …`.
