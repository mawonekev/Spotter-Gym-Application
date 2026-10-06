---
trigger: model_decision
description: Read when writing or modifying GitHub Actions CI workflows and automated architectural grep assertions
globs: .github/workflows/**
---

# CI Rules

Controls the pipeline that gates every pull request.

- **Branch scope.** Run CI on every pull request targeting `main` and on every push to `main`. Reason: both paths reach production.
- **Required stages.** Run install, typecheck, lint, and test on every pull request. Reason: a broken build must fail before review.
- **Enforce the CardChunk write rule.** Fail if `cardChunk.create` or `cardChunk.update` appears anywhere. Reason: the rule lives in `retrieval.md`. The CI grep moves the failure to build time instead of production.
- **Enforce the private model rule.** Fail if any private model name appears under `src/server/retrieval/**`. The list is `Member`, `CheckIn`, `LedgerEntry`, `Payment`, `PaymentAttempt`, `MembershipChange`, `MemberSession`, `ActivationCode`, `QuestionLog`, `PrivateAccessLog`. Reason: the rule lives in `privacy.md` and `retrieval.md`. Private data must never be reachable from the vector search module.
- **Enforce the no Prisma in route handlers rule.** Fail if `prisma.` appears in any file under `app/api/**`. Reason: the rule lives in `structure.md`. All data access goes through `src/server/**`.
- **Enforce the no PIN logging rule.** Fail if `pin` appears in any log or error call. Reason: the rule lives in `auth.md`. The plain PIN is never stored or logged.
- **Enforce bound parameters.** Fail if a template literal containing `$queryRaw` or `$executeRaw` includes a variable. Reason: the rule lives in `retrieval.md`. All parameters must be bound.
- **No skipped tests.** Fail if a test file contains `it.skip` or `describe.skip` without a linked issue in a comment. Reason: skipped tests are silent failures.
- **Build must pass.** The Next.js production build must complete on every pull request. Reason: Vercel deploys from this build.
- **Failure behaviour.** A failed check blocks merge. Do not allow an override on `main`. Reason: an override defeats the gate.