---
name: trace-a-question
description: Walk one logged question backwards from QuestionLog to find why it got a wrong or missing answer.
---

1. Find the QuestionLog row by its ID, or by member and askedAt timestamp.
2. Read the row's outcome column.
3. If outcome is REFUSED_POLICY, read refusedBy. RULES means the pattern list in ai.md matched. MODEL means the router classified it as REFUSED_POLICY.
4. If outcome is NO_ANSWER, read topScore and compare it against the similarity threshold in retrieval.md.
5. If outcome is BLOCKED_UNGROUNDED, read answerText and compare its digit sequences against the source cardVersionIds, per the grounding check in ai.md.
6. If outcome is ANSWERED_SHARED, compare tierAtAsk against the minTier of each card in cardVersionIds, per membership.md.
7. If outcome is ANSWERED_PRIVATE, find the matching PrivateAccessLog row by questionLogId's member and timestamp, and confirm sessionMemberId equals targetMemberId, per privacy.md and structure.md.
8. If outcome is ERROR, read latencyMs and compare it against the stage budgets in the PRD.
9. State the finding as: outcome category, the specific cause found, and the rules file or PRD section that governs it.