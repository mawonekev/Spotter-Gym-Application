---
name: ship-a-change
description: Take one finished code change from working code to an opened pull request.
---

1. List every acceptance criterion for the change and mark each one checked or failing, per testing.md and PRD section 6.
2. Stop if any criterion is failing. Do not proceed to step 3 until all are checked.
3. List every action taken during the change that cannot be cleanly undone, per schema.md, commands.md, and AGENTS.md.
4. Confirm each irreversible action was asked about before it ran. If one was not, flag it now.
5. Confirm no schema migration ran without being asked about first, per schema.md and commands.md.
6. Run the CI checks named in the PRD's enforcement table before opening the pull request.
7. Write the pull request description: what changed, and which rules files the change touches.
8. List every assumption made during the change in the pull request description.
9. Open the pull request.