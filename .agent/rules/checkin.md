---
trigger: model_decision
description: Read when implementing or modifying F-3 check in, 4-digit daily code, operating hours check, or home screen attendance counter
---

# Check In Rules

Controls the F-3 check in flow.

- **Four digit daily code.** The code is four digits, set by staff, and written on the whiteboard at the desk. Reason: PRD FR-19. The code is typed inside the building.
- **One check in per day.** A member produces at most one `CheckIn` row per calendar day. A second attempt returns the already checked in string from `copy.md` and writes nothing. Reason: PRD FR-20.
- **Code rotation time.** The code rotates at 04:00 Africa/Lagos. Yesterday's code stops working then. A member arriving at eleven at night uses that day's code. Reason: PRD FR-21.
- **Opening hours only.** Accept check ins only between `Gym.opensMinute` and `Gym.closesMinute`. A check in at three in the morning is refused regardless of the code. Reason: PRD FR-19b.
- **No code set.** If no `CheckInCode` exists for today, block check in and return the no code string from `copy.md`. Reason: PRD section 6.5 empty state.
- **Wrong code.** Return the wrong code string from `copy.md`. Three wrong codes in five minutes triggers a sixty second wait. Reason: PRD section 6.5 error state.
- **Block past grace.** A member past grace cannot check in. Show the renewal amount and the pay button instead. Use the blocked string from `copy.md`. Reason: PRD FR-23b. A check in claims a visit the gym did not sell.
- **One tap after the code.** Check in is the only write with no confirmation dialog. Reason: PRD FR-23.
- **Counter updates on success.** Increment the home screen counter after the row is written. Reason: PRD section 6.5 step five. The counter is the habit.
- **Latency.** Check in must complete on a 2G connection in under three seconds. Reason: PRD acceptance criteria in section 6.5.
- **Network required.** Check in needs network and says so if unavailable. See `client.md`. Reason: PRD section 8.4. The server must write the row.
- **Endpoint.** The client posts to `POST /api/checkin`. Reason: PRD section 6.5 step two.
- **Row source.** A code typed check in writes `source = CODE`. Reason: PRD section 6.5 step four.
- **Manual check in.** Staff may record a manual check in with `source = MANUAL` and the staff ID recorded. Reason: PRD FR-22. This exists for dead phones.
- **Anomaly flags.** The owner review page flags any day where check ins exceed one hundred and fifty percent of that day of week's trailing four week average. It also flags any burst of more than ten check ins from distinct devices within sixty seconds. Reason: PRD FR-19c.
- **What the code does not do.** The code deters casual remote check in. It does not prevent a determined member from photographing the board and sharing it. Reason: PRD FR-19. M-2 is provisional until Gate A resolves.
- **No status change.** Check in does not write a `MembershipChange` row and does not change tier or expiry. Reason: `membership.md` owns tier and status rules.
- **No ledger entry.** Check in does not touch the ledger. Reason: `payments.md` owns the ledger.
- **No confirmation dialog.** One tap after the code is typed. Reason: PRD FR-23. The check in must be fast or the habit never forms.