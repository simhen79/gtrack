WRITE THE PR for ticket #{{NUM}}. You are one step of an unattended loop: nobody will answer a
question, so never ask one. Do not push, and do not open the PR: the loop does both after you
finish.

The branch is `{{BRANCH}}`, and the PR will target `{{BASE_BRANCH}}`.

1. Call the Skill tool with `pr`. If it says the skill is unknown, stop and end your reply with
   <promise>BLOCKED</promise>: never write the body without it. Its evidence is the diff `git diff {{BASE}}...HEAD` and the
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
4. Write the test guide to `{{STATE}}/pr/{{NUM}}.test.md`. The build is finished and its gates
   have passed, so write it from the branch as it is now (`git diff {{BASE}}...HEAD`, the
   reports and the gates log), not from the plan. The loop posts it on issue #{{NUM}} under a
   "How to test" heading, for a person or an agent who has not read the diff to follow
   straight away. Don't start it with a heading. Cover, in this order:
   - what changed, in a sentence or two;
   - how to get it: check out `{{BRANCH}}` and start the app locally as `CLAUDE.md`'s Local
     development section says, naming any migration, seeder or command this change needs;
   - who to sign in as (a golfer or an admin) and any data to create first;
   - numbered steps for each acceptance criterion: where to go (a URL, screen or command),
     what to do, and what to expect, including the widths and the light and dark themes to
     check on a screen;
   - anything the verify report says a person still owes, such as phone checks.
   Add no AI attribution here either.

End your reply with <promise>COMPLETE</promise>.
