---
trigger: model_decision
description: Read when writing or changing a test
---

# Testing Rules

Controls test content and coverage for Spotter.

- **Test types.** Write unit tests for pure functions, integration tests for database and API routes, and end to end tests for the five features. Reason: each type catches a different class of failure.
- **Coverage reporting.** Report line coverage on `src/server/**`. Do not block a merge on a coverage number. Reason: a hard floor encourages tests that raise the number without testing behaviour.
- **Test file location.** Place tests next to the file under test with a `.test.ts` suffix. Reason: colocation makes the missing test obvious.
- **No mocked Prisma in integration tests.** Use a real test database with the same schema. Reason: mocked queries hide the SQL and filter bugs that FR-11 and FR-15 exist to prevent.
- **Test database.** Use a separate database from development and production. Read the URL from `TEST_DATABASE_URL`. Reason: one wrong connection string destroys live records.
- **Test isolation.** Reset the test database between test files. Do not rely on test order. Reason: shared state produces flaky tests that hide real failures.
- **Mock external calls.** Mock the Gemini API and the Paystack API in all tests. Reason: tests must run without network and without spending free tier quota.
- **Fixture rules.** Every fixture uses the member ID `test_member_001` unless the test is about cross member access. Reason: the cross member test must be the only place a second ID appears.
- **Required test cases.** Cover the acceptance criteria in PRD sections 6.3 to 6.7. Do not invent new criteria. Reason: those criteria are the contract.
- **No test touches production.** Read the database URL from the test environment only. Reason: one wrong connection string destroys live records.