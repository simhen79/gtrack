BROWSER CHECK for ticket #{{NUM}}. You are one step of an unattended loop: nobody will answer a
question, so never ask one. If you cannot continue, write the reason to
`{{STATE}}/reports/{{NUM}}-blocked.md` and end your reply with <promise>BLOCKED</promise>.

The work on `{{BRANCH}}` in `{{CHECKOUT}}` is built and committed. Confirm the web pages work
in the running app. The ticket is `{{STATE}}/context/{{NUM}}.md`.

1. Start the app with `/tmp/dev-server.sh start`. It rebuilds the front end, then returns once
   http://localhost:8000 answers, or fails with the tail of its log.
2. Drive the pages with the `agent-browser` command (`agent-browser --help` lists its verbs:
   open, snapshot, click, fill, screenshot). Exercise what the ticket's acceptance criteria
   describe, at a desktop width (1280px) and a phone width (390px), in light and dark.
3. Sign in at http://localhost:8000/login as one of the two users the sandbox setup made, both
   past first sign-in:
   - `ralph-golfer@example.test`, a golfer
   - `ralph-admin@example.test`, an admin and golfer
   Mail goes to the log, so the 6-digit code is the newest one in
   `api/storage/logs/laravel.log`. For a first-sign-in flow, create a fresh golfer with
   `php artisan tinker` in `api/`.
4. When this ticket causes a server error, a console error, a broken render, or a page that
   departs from `docs/design-system/README.md`, fix it on `{{BRANCH}}`. Where the behaviour can
   be tested, add a Pest feature test first. Then run `GATES_ALLOW_DIRTY=1 bash /tmp/gates.sh
   {{BASE}}`, and commit as `CLAUDE.md` says. Leave problems this ticket did not cause alone,
   and list them.
5. The phone app cannot run here. When the ticket changes `apps/mobile`, list what a person
   must check on a device instead.
6. Close the browser sessions, then `/tmp/dev-server.sh stop`. Never kill a process by name or
   by pattern: this session's own command line holds this prompt, so a pattern such as
   `artisan serve` kills it.
7. Append to `{{STATE}}/reports/{{NUM}}-verify.md`: what you checked, as whom, at which widths
   and themes, what you saw, what you fixed, what you left, and the phone checks a person
   still owes.

End your reply with <promise>COMPLETE</promise>.
