---
trigger: model_decision
description: Read when working with Prisma schema, database models, migrations, Unsupported vector column, or constraints
globs: prisma/schema.prisma, migrations/**
---

# Schema Rules

Controls the Prisma schema and model names.

- **Source of truth.** Use the schema in PRD section 8.5 verbatim. Do not rename models, fields, or enums. Reason: the PRD is the contract. Renaming breaks cross references throughout the document.
- **Model names.** Gym, MembershipPlan, Staff, DeskShift, Member, MemberSession, ActivationCode, Card, CardVersion, CardChunk, CheckInCode, CheckIn, LedgerEntry, Payment, PaymentAttempt, MembershipChange, PrivateAccessLog, QuestionLog, WrongAnswerReport, AnswerAudit, Handoff. Reason: PRD section 8.5.
- **Enum values.** Use the exact values in PRD section 8.5. Tier has BASIC and PREMIUM. CardStatus has DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, RETIRED. QuestionOutcome has six values. RefusalReason has five values. Reason: the values are referenced throughout the PRD and the rules layer.
- **Datasource.** Set `url` to `env("DATABASE_URL")` and `directUrl` to `env("DIRECT_URL")`. Add the `vector` extension. Reason: PRD section 8.5. See `env.md`.
- **CardChunk embedding column.** Declare as `Unsupported("vector(768)")?`. Reason: PRD section 8.5 and 10.6. Prisma has no native vector type.
- **CardChunk constraint.** The migration adds `CHECK (embedding IS NOT NULL)`. Reason: `ci.md` owns the enforcement grep. This file states the column shape only.
- **Money fields.** Use `Int` for all kobo fields. Do not use `BigInt`. Reason: PRD appendix B item 20. Amounts fit in a 32 bit integer at the gym's volumes.
- **No status column on Member.** Do not add a stored status field. Reason: `membership.md` owns the derived status rule.
- **No balance column anywhere.** Never add a balance field to any model. Reason: `payments.md` owns the canonical balance rule.
- **Unique constraints.** Keep `Member.memberNumber` unique per gym. Keep `CardChunk.cardVersionId` plus `chunkIndex` unique. Keep `CheckIn.memberId` plus `checkInDate` unique. Keep `PaymentAttempt.idempotencyKey` unique. Keep `CheckInCode.gymId` plus `forDate` unique. Reason: PRD section 8.5. These enforce business rules at the database level.
- **Relations.** Keep cascade delete on `CardChunk` to `CardVersion`. Reason: PRD section 8.5. Deleting a version must not orphan chunks.
- **Migration naming.** Name every migration with a timestamp prefix and a short description. Example: `20260916_add_card_chunk_constraint`. Reason: the name is the only index of what changed and when.
- **No edit to an applied migration.** Never edit a migration after it has been applied to production. Write a new migration. Reason: applied migrations are the schema history.
- **Raw SQL for CardChunk.** See `retrieval.md`. This file does not repeat the read and write rules.