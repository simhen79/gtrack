WRITE THE PR for ticket #{{NUM}}. You are one step of an unattended loop: nobody will answer a
question, so never ask one. Do not push, and do not open the PR: the loop does both after you
finish.

The branch is `{{BRANCH}}`, and the PR will target `{{BASE_BRANCH}}`.

1. Call the Skill tool with `pr`. Its evidence is the diff `git diff {{BASE}}...HEAD` and the
   reports in `{{STATE}}/reports/` for #{{NUM}} (build, verify, review), plus
   `{{STATE}}/logs/{{NUM}}-gates.log`. The ticket is `{{STATE}}/context/{{NUM}}.md`.
2. Write the title to `{{STATE}}/pr/{{NUM}}.title` as one line: the ticket's title or a plain
   imperative sentence close to it, as the repo's other PRs are titled.
3. Write the body to `{{STATE}}/pr/{{NUM}}.md`. Its first line is `Closes #{{NUM}}`. When
   `{{BASE_BRANCH}}` is not `main`, add one line saying that this PR is stacked on
   `{{BASE_BRANCH}}`, which must merge first; GitHub retargets it to `main` when that branch is
   deleted. Include the gate results, anything the reviews left unfixed, and any phone checks
   the verify report says a person still owes. Add no AI attribution: no "Generated with"
   footer and no links to Claude or Anthropic.

End your reply with <promise>COMPLETE</promise>.
