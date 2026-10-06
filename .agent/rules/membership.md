---
trigger: model_decision
description: Read when dealing with member tiers (BASIC, PREMIUM), derived status calculation, grace periods, plan duration extensions, or tier-based access
---

# Membership Rules

Controls tier, status, and plan rules.

- **Two tiers.** `BASIC` and `PREMIUM`. Reason: PRD section 8.5.
- **Status is derived, never stored.** Compute from `expiryDate`, `Gym.graceDays`, and `cancelledAt`. Values are ACTIVE, GRACE, EXPIRED, CANCELLED. Reason: PRD FR-51. One function, `effectiveStatus(member, gym, now)`. Nothing can drift.
- **Effective tier.** Returns the stored tier while ACTIVE or GRACE. Returns `BASIC` once EXPIRED or CANCELLED. Reason: PRD FR-52.
- **Effective tier is the only retrieval input.** Pass only `effectiveTier` to the tier filter. Reason: `retrieval.md` owns the tier filter rule.
- **Tier access table.** Apply the table in PRD section 6.10 exactly. BASIC members see timetable, prices, rules, access hours, guest policy, pause and cancellation terms. PREMIUM adds written training plans and trainer guidance. EXPIRED and CANCELLED see the BASIC set plus their own history, receipts, and the pay button, but no check in. Reason: PRD FR-52 and FR-53b.
- **Grace period.** Three days after expiry. Nothing changes during grace. Reason: PRD FR-53.
- **Grace period of zero.** If `Gym.graceDays` is zero, the member moves straight from ACTIVE to EXPIRED at expiry. Reason: the derived status function must handle a zero value without a special case.
- **Expired member rights.** Keep full history, receipts, timetable, price list, and the pay button. Only block check in. Reason: PRD FR-53b.
- **Renewal extension.** On a confirmed `RENEWAL` payment, extend `expiryDate` by the plan's `durationDays`. Count from the later of today and the current `expiryDate`. Write a `MembershipChange` row with the old value, the new value, and the payment reference as the reason. Use Africa/Lagos for today. Reason: PRD FR-24b. `payments.md` implements this inside the webhook transaction.
- **Cash renewal.** A cash or transfer payment marked as a renewal applies the same extension rule. Reason: PRD FR-47c.
- **Plan amounts.** Read renewal amounts and durations only from `MembershipPlan`. Never parse the prices card. Reason: PRD FR-24c. The prices card is prose for humans.
- **Manual tier or expiry edit.** Write a `MembershipChange` row on every change. Reason: PRD FR-46.
- **Check in block.** A member past grace cannot check in. Show the renewal amount and the pay button instead. Use the string in `copy.md`. Reason: PRD FR-23b.