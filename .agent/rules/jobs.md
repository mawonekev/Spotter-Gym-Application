---
trigger: model_decision
description: Read when configuring scheduled cron jobs (04:00 daily code rotation and 03:00 nightly sweep in Africa/Lagos)
globs: src/jobs/**
---

# Jobs Rules

Controls scheduled work.

- **Exactly two cron jobs.** Do not add a third. Reason: PRD section 8.1. Status is derived, so no transition job is needed. See `membership.md`.
- **Timezone.** All cron times are Africa/Lagos. Reason: the gym operates in one timezone and the daily code rotates on local time.
- **Daily code job.** Runs at 04:00 local time. Generates tomorrow's four digit `CheckInCode`. Reason: PRD FR-21. The code rotates at four in the morning, so yesterday's code stops working then.
- **Nightly sweep job.** Runs at 03:00 local time. Reason: PRD section 8.1. It runs before the daily code job so the sweep finishes first.
- **Sweep step one.** Mark any `PaymentAttempt` still PENDING after twenty four hours as ABANDONED. Never mark FAILED without gateway confirmation. Reason: PRD FR-29. The money may have moved.
- **Sweep step two.** Run the `PrivateAccessLog` assertion defined in `privacy.md`. Surface any mismatch on the owner review page and to the developer. Reason: PRD FR-16b. This is the detector behind G-5.
- **Sweep step three.** Compute the counts for the weekly review page. Wrong answer reports, unanswered questions, blocked ungrounded answers, abandoned attempts, cards past review interval, check in anomalies, and any access log mismatch. Reason: PRD FR-49.
- **No scheduled status change.** Do not write a job that moves members between ACTIVE, GRACE, EXPIRED, or CANCELLED. Reason: `membership.md` owns the derived status rule.
- **No notifications.** Do not write a job that sends anything to a member. Reason: PRD section 5.2. Version one sends nothing.
- **Daily code failure.** If the daily code job fails, log the failure and do not retry after 04:00. Reason: a late code change confuses members who already saw the board.
- **Sweep failure.** If the nightly sweep fails, log the failure and retry once after thirty minutes. If the retry fails, surface it on the owner review page. Reason: a missed sweep leaves abandoned attempts unmarked and the access log assertion unrun.