---
name: add-shared-card-type
description: Add a new CardCategory that the app can store, approve, and serve as a shared answer.
---

1. Search the CardCategory enum in the Prisma schema for the proposed name. If it already exists, stop.
2. Ask before editing the schema, per schema.md and AGENTS.md.
3. Add the new value to the CardCategory enum. Change nothing else in the schema in this step.
4. Confirm the new category is gated by minTier the same way every other category is, per membership.md.
5. Confirm chunking for the new category follows the PRD's chunking rule for card length and blank-line splitting.
6. Confirm indexing a card in the new category adds no new paid service or model call, per ai.md and retrieval.md.
7. Create one card in the new category with status DRAFT. Do not set it to APPROVED in this step.
8. Confirm the draft card cannot be retrieved by any member question, per membership.md and retrieval.md, since only APPROVED cards enter search.
9. Route the card through approval so it becomes indexed and searchable, per the reindexing sequence in the PRD.
10. Confirm every acceptance criterion for the new category is checked, per testing.md and PRD section 6, before reporting the task done.