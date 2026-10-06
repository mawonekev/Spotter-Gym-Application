---
trigger: model_decision
description: Read when implementing F-4 payments, Paystack integration, webhook signature verification, ledger entries, or canonical balance calculation
globs: src/server/payments/**, app/api/payments/**
---

# Payments Rules

Controls Paystack integration, ledger, and balance.

- **Paystack only.** All transactions, signatures, and webhooks use Paystack. Reason: PRD section 5.
- **Initiation.** The client posts to `POST /api/payments/initiate` with a client generated idempotency key and the purpose. Reason: PRD section 6.6 step three.
- **Attempt row.** Create a `PaymentAttempt` with status PENDING, a unique reference, and the purpose. Then initialise the gateway transaction. Reason: PRD section 6.6 step four.
- **Idempotency.** The idempotency key is unique in the database. A repeated tap returns the existing attempt. Reason: PRD FR-26. Two rapid taps must produce one gateway transaction.
- **Webhook is the only success signal.** Never mark a payment successful from the browser redirect. The redirect is a hint. Reason: PRD FR-24.
- **Webhook signature.** Verify the gateway signature before any database write. An unverified webhook is logged and discarded. Reason: PRD FR-25.
- **Webhook transaction.** In one database transaction: mark the attempt SUCCESS, create a `Payment`, create a `LedgerEntry`, and if the purpose is RENEWAL, apply the extension rule in `membership.md`. Reason: PRD section 6.6 step six and FR-24b. Money and access must never disagree.
- **Duplicate webhook.** If the webhook arrives for an attempt already marked SUCCESS, return 200 and change nothing. Reason: the gateway may retry. A second write would double the ledger entry.
- **Ledger sign convention.** `amountKobo` is positive when it increases what she owes: `OPENING_BALANCE` and `CHARGE`. It is negative when it reduces what she owes: `PAYMENT`, and `ADJUSTMENT` in either direction. Reason: PRD section 8.5.
- **Canonical balance.** `balance_kobo = SUM(LedgerEntry.amountKobo) WHERE memberId = :id`. Positive means she owes. This formula lives in exactly one function. Reason: PRD FR-17b. Every balance display calls it. No other definition of balance exists.
- **Pending never means expired.** A member with a PENDING attempt keeps access for twenty four hours from the attempt. Reason: PRD FR-27.
- **Lost network.** The attempt stays PENDING. On reopening, show the pending attempt at the top with the string in `copy.md`. Reason: PRD FR-28.
- **Abandoned.** An attempt still PENDING after twenty four hours is marked ABANDONED by the nightly sweep. Never mark FAILED without gateway confirmation. Reason: PRD FR-29. See `jobs.md`.
- **No stored balance.** Never add a balance column to any model. Reason: `schema.md` owns the schema rule.
- **Partial payments.** Out of scope for version one. A payment either covers the full renewal amount or the full arrears amount. Reason: PRD section 5.2. Partial payments would require a new purpose enum value.
- **No card storage.** Never store card details. Never touch money. Funds settle from the gateway into the gym's own bank account. Reason: PRD FR-30.
- **Receipts.** Every successful payment produces a receipt with amount, date, reference, and channel. Use the fields in `copy.md`. Receipts survive expiry and cancellation. Reason: PRD FR-31.
- **Cash and transfer entry.** Record on the same calendar day the payment is received, measured in Africa/Lagos. Reason: PRD FR-47b. This is a staffing commitment. Balance answers do not go live until the desk demonstrates fourteen consecutive days of same day entry.
- **Immutable payments.** Cash and transfer payments cannot be deleted. In app payments cannot be edited or deleted by anyone, including the owner. Mistakes are corrected with an offsetting `ADJUSTMENT` entry that stays visible. Reason: PRD FR-47 and FR-50.
- **Amounts.** Read renewal amounts from `MembershipPlan`. Read arrears from the canonical balance function. Never parse the prices card. Reason: PRD FR-24c.
- **Failure at initiation.** Mark the attempt FAILED with the reason recorded. Show the message in `copy.md`. Reason: PRD section 6.6 error state.