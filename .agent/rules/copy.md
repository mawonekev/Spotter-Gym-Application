---
trigger: model_decision
description: Read when writing or displaying user-visible copy, buttons, errors, status strings, or refusal sentences
globs: app/**, src/components/**, **/*.tsx
---

# Copy Rules

Controls all user visible text in Spotter.

- **Tone.** Plain English. Active voice. Short sentences. No jargon. Reason: the member persona has never asked for technical help and will not start now.
- **Refusal sentence for missing records.** Use exactly: "I do not have that in the gym's records." Nothing added. Reason: PRD FR-32. One sentence, no near answer.
- **Medical refusal sentence.** Use exactly: "I cannot answer questions about injuries or health. Please speak to NAME or your doctor." Replace NAME with the current desk officer. Reason: PRD FR-36.
- **Handoff button.** Label reads "Send this to NAME". Reason: PRD section 6.7 step two. The button names a person, not a place.
- **Money reporting.** Write "Our records show X naira outstanding for July." Never write "You owe X naira." Reason: PRD FR-18. The app reports, it does not rule.
- **Balance framing.** Every balance answer ends with "Correct as of DATE, based on payments recorded here." Reason: PRD FR-8b and FR-18. The date is not optional.
- **Stale cached balance.** Use exactly: "Open to refresh." Reason: PRD FR-8b. The figure is hidden until the member opens the app.
- **Card age.** When a card is past its review interval, prepend "This was last confirmed on DATE." Reason: PRD FR-14. Never hide the age of a record.
- **Activation screen title.** Use exactly: "Enter your activation code." Reason: PRD section 6.1 empty state. One instruction, no preamble.
- **Activation screen helper.** Use exactly: "Ask at the front desk or message the desk on WhatsApp." Reason: PRD section 6.1 empty state. Two options, no third.
- **Invalid code message.** Use exactly: "That code is not valid. Ask the front desk for a new one." Do not say which part failed. Reason: PRD section 6.1 error state.
- **Home screen check in counter.** Use exactly: "N days this month." Reason: PRD section 6.2. The counter is the habit.
- **Home screen new member.** Use exactly: "0 days this month." Do not show an error. Reason: PRD section 6.2 empty state.
- **Check in success.** Use exactly: "Checked in." Reason: PRD section 6.5 step five. One confirmation, no celebration.
- **Wrong check in code.** Use exactly: "That is not today's code. Check the board at the desk." Reason: PRD section 6.5 error state.
- **Already checked in.** Use exactly: "You are already checked in today." Reason: PRD FR-20.
- **No code set.** Use exactly: "The desk has not set today's code yet." Reason: PRD section 6.5 empty state.
- **Check in blocked past grace.** Use exactly: "Your membership has expired. Renew to check in." Then show the renewal amount and the pay button. Reason: PRD FR-23b.
- **Database error, private path.** Use exactly: "I cannot read your records right now." Then show the handoff. Never show zero. Reason: PRD section 6.4 error state.
- **Timeout or unreachable.** Use exactly: "I cannot reach the gym's records right now." Then show the handoff. Never fall back to general knowledge. Reason: PRD section 6.3 error state.
- **Empty attendance.** Use exactly: "No check ins recorded for MONTH." Reason: PRD section 6.4 empty state.
- **Empty payments.** Use exactly: "No payments recorded yet. Ask the front desk if you paid in cash." Reason: PRD section 6.4 empty state.
- **Payment pending.** Use exactly: "We are confirming a payment of AMOUNT from DATE." Reason: PRD FR-28. Shown at the top of the screen on reopen.
- **Payment initiation failure.** Use exactly: "Payment could not start. Try again or pay at the desk." Reason: PRD section 6.6 error state.
- **Payment confirmation timeout.** Use exactly: "The gym is confirming your payment. Check back in a minute." Reason: PRD section 6.6 step seven. Shown after ninety seconds of polling.
- **Receipt fields.** Show amount, date, reference, and channel. Reason: PRD FR-31. No other fields.
- **No em dashes.** Never use an em dash in user visible text. Reason: the answer prompt forbids them. Consistency across surfaces.