RETRO for the Ralph run over map #{{MAP}}. You are the last step of an unattended loop: nobody
will answer a question, so never ask one, and change no file except the one named below.

The sessions to look back on are the transcripts in `{{STATE}}/logs/`
(`<NUM>-<phase>.jsonl`, one per agent session: implement, verify, review, pr). An earlier
attempt at a phase is kept as `<NUM>-<phase>.<timestamp>.jsonl`, and a session that did not
complete left `<name>-failed.md` beside its transcript. Next to them are the gate and setup
logs, and the reports in `{{STATE}}/reports/`. Read across every ticket, not just one, because
a mistake that repeats is what an environment change can fix. Look hardest at time lost to
setup, gates that went red, review findings the build should never have produced, and blocked
runs.

Write the candidates, in order of severity, to `{{STATE}}/reports/retro.md`. Name each change
as a concrete edit to `CLAUDE.md`, a skill, a prompt in `scripts/ralph/prompts/`, a gate in
`scripts/ralph/gates.sh`, or the rest of `scripts/ralph/`.

End your reply with <promise>COMPLETE</promise>.
