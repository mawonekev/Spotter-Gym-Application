---
name: add-private-answer
description: Add a new intent the app can answer from a member's own private records.
---

1. Confirm the new intent is not already covered by PRIVATE_ATTENDANCE, PRIVATE_BALANCE, or PRIVATE_MEMBERSHIP.
2. Add the new intent name to the router prompt's fixed JSON shape.
3. Write the handler as a new exported function in src/server/private/*.ts, with the session member ID as its first argument, per structure.md and privacy.md.
4. Confirm the handler writes a PrivateAccessLog row before it returns any data, per privacy.md.
5. Confirm the handler never calls the embedding or vector search path, per structure.md and retrieval.md.
6. Render the answer from a code template. Confirm no model call renders any number in the answer.
7. If the answer includes a money figure, confirm it uses the reporting template, not a ruling statement, per ai.md and copy.md.
8. Write the empty state for the intent: what the member sees when there is nothing to report.
9. Write the error state for the intent: what the member sees when the query fails, and confirm it never returns a zero in place of an error.
10. Confirm every acceptance criterion for the new intent is checked, per testing.md and PRD section 6, before reporting the task done.