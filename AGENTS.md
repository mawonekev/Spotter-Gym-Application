# Spotter

## Description

Spotter is a web app one gym gives to its four hundred members. It answers questions using only the gym's own records, lets a member check in, shows her own attendance and balance, and lets her pay her subscription. A confirmed payment extends her membership immediately with no staff action required. When records hold no answer, Spotter returns "I do not have that in the gym's records." For medical questions, it returns "I cannot answer questions about injuries or health. Please speak to NAME or your doctor." Both options hand off to the named front desk officer on duty by name.

## Who uses it

- **Member.** The only user of the member-facing app. She asks questions, checks in, views her own records, and pays.
- **Staff.** Two front desk officers. They draft cards for approval, set the daily check in code, issue activation codes, and record manual check ins. They use separate staff screens, a separate login, and never open the member app.
- **Owner.** Approves cards, maintains the member list and membership plans, records cash and transfer payments, and runs the weekly review and answer audit. Uses separate owner screens, a separate login, and never opens the member app.

## One thing the agent must do well

Ground every member-facing answer only in the gym's own approved records, and refuse cleanly to the named desk officer when there is no matching record or the question is on the never answer list. Never let an answer state a figure, time, or rule that is not present in a source record.

## Defined scope for the MVP

Five features, per the PRD:

- **F-1 Ask about the gym.** Answers from approved shared cards the member's effective tier allows, with a report control on every answer.
- **F-2 My records.** Answers from her own private records, fetched by her exact member ID, with a report control on every answer.
- **F-3 Check in.** A four-digit daily code typed inside the building during operating hours; enforces 1 check-in per day and blocks members past grace.
- **F-4 Pay.** Renewal or arrears via Paystack, extending membership automatically inside the verified webhook database transaction.
- **F-5 Ask the desk.** Names the officer on duty and opens WhatsApp with the question pre typed.

Owner and staff screens are input surfaces, not member-facing features.

## Not in scope for the MVP

- Class booking and capacity management
- Push notifications, reminders, or nudges
- Trainer chat or member-to-staff messaging inside the app
- Progress tracking, weight logs, or body metrics
- Referrals, streaks, or leaderboards
- Door access control
- Multi-gym support
- A native Android app

## Stack

- Next.js
- TypeScript
- Prisma
- PostgreSQL
- PGVector
- Paystack for payments
- Gemini free tier for AI models

Paystack is the required payment gateway for all transactions, signatures, and webhooks.

## Folder map

Only paths the PRD names directly. Do not invent others.

- `app/api/**` — route handlers. Must never call the Prisma client directly.
- `app/**` — Next.js App Router member pages and layouts.
- `src/components/**` — member-facing UI components.
- `src/server/auth/session.ts` — the only place the session cookie is read; source of member ID and effective tier.
- `src/server/router/rules.ts` — the deterministic never-answer rules layer, runs before any model call.
- `src/server/retrieval/search.ts` — the tier-filtered vector search over shared cards.
- `src/server/retrieval/index-card.ts` — raw SQL module for indexing and updating CardChunk embeddings.
- `src/server/private/*.ts` — private record SQL queries; every function takes session member ID as first argument, logs to PrivateAccessLog, and NEVER uses vector search or embeddings.
- `src/lib/types/**` — shared TypeScript types.
- `src/lib/constants/**` — shared constants.

## How to work in this codebase

- Make one change at a time.
- Ask before adding a package or dependency.
- Access PostgreSQL via Prisma for standard models, but execute raw SQL (`$executeRaw`/`$queryRaw`) via `src/server/retrieval/index-card.ts` for all `CardChunk` vector operations.
- List your assumptions at the end of every response.
- Stop and ask when the PRD is silent about something, rather than guessing.

## Where the detailed rules live

The PRD (`spotter-prd-v2.md`) is the source of truth for anything not covered above, including:

- The Prisma schema and every model name: PRD section 8.5.
- The never-answer word patterns: enforced in `src/server/router/rules.ts`, listed in PRD section 7.3.
- The similarity threshold for retrieval: PRD section 7.5.
- Model names and free tier limits: PRD section 7.1.
- Prices, plan amounts, and hosting costs: PRD section 11.
- Environment variable names and database connection settings (`DATABASE_URL` pooled, `DIRECT_URL` unpooled): PRD section 8.1.
- Stage latency budgets and 11-second hard ceiling: PRD section 7.9.
- Runtime check FR-11b: Refuse all member questions automatically if fewer than 30 APPROVED cards exist in the database.

Do not hardcode any of the above from memory. Read the named section before writing code that depends on it.

## Definitions

- **Tier.** An enum with two values, BASIC and PREMIUM. Controls which shared cards a member's questions can retrieve.
- **Effective tier.** The tier actually used for retrieval. Equals the member's stored tier while her status is ACTIVE or GRACE, and drops to BASIC once her status is EXPIRED or CANCELLED.
- **Effective status.** A derived value, never stored: ACTIVE, GRACE, EXPIRED, or CANCELLED, computed from expiry date, grace days, and cancellation date.
- **Canonical balance.** Computed as `balance_kobo = SUM(LedgerEntry.amountKobo) WHERE memberId = :id`. Never stored as a database column.
- **Grounding check.** Validates that all digit sequences in a generated shared answer exist in the source card or question, returning `BLOCKED_UNGROUNDED` if verification fails.
- **Card.** A staff-drafted, owner-approved piece of shared gym information (timetable, prices, rules, and similar), gated by a minimum tier.
- **Chunk.** A piece of an approved card's body, stored with an embedding, used for similarity search. Private data is never chunked or embedded.
- **Record.** The gym's own held information, shared (cards) or private (a member's own attendance and payments), that every answer must be grounded in.
- **Handoff.** Routing an unanswered, refused, or blocked question to the named desk officer via a pre-filled WhatsApp message.

---

## Self check

**Under 180 lines.** Pass. This file is under the limit measured at time of writing.

**No invented facts.** Pass. Every feature, role, scope item, definition, and stack choice above traces directly to the PRD.

---

## Open questions

*(None at present; payment gateway conflicts resolved in alignment with PRD specifications).*
