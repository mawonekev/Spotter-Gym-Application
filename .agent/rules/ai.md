---
trigger: always_on
---

# AI Rules

Controls every model call and the rules that run before them.

- **Rules layer.** `src/server/router/rules.ts` runs before any network call. Reason: `structure.md` owns the path. This file owns the content.
- **Pattern list.** Match case insensitively on word boundaries. Categories and patterns:
  - MEDICAL: injur, pain, hurt, ache, sprain, strain, physio, doctor, hospital, medication, diet, calorie, supplement, protein, creatine, steroid, pregnan, asthma, diabet, blood pressure.
  - OTHER_MEMBER: any registered member's first or last name, plus her attendance, his attendance, someone else, another member, who else, did NAME.
  - DOOR_ACCESS: can I get in, will my card work, let me in, open the door, am I allowed in right now.
  - MONEY_DECISION: refund, waive, waiver, discount, free month, cancel my, reduce my fee.
  - STAFF_CONDUCT: rude, complain about, report the, the staff was, she was rude, he was rude.
  Reason: PRD section 7.3. The member name list loads from the database and refreshes hourly. A member's own name never triggers the rule.
- **Pattern hit behaviour.** A pattern hit refuses immediately, writes `REFUSED_POLICY`, and makes no model call. Reason: PRD section 7.3. A probabilistic classifier is not enforcement.
- **Router model.** Use `gemini-2.5-flash` for classification. Return JSON only. Use the exact shape in PRD section 7.4. Reason: the shape is the contract. Do not add fields.
- **Router prompt.** Use the system prompt in PRD section 7.4 verbatim. Replace `{{TODAY}}` with the current date. Reason: the prompt is tuned. Do not rewrite it.
- **Invalid router JSON.** If the model returns anything that does not parse to the required shape, treat the intent as `UNCLEAR`. Reason: a malformed response must not crash the request.
- **No router retry.** Do not retry the router call on failure. Return the error state and the handoff. Reason: the stage budget in PRD section 7.9 does not allow a second call.
- **Date validation.** Validate returned dates in code against a five year window. Anything outside becomes `UNCLEAR`. Reason: PRD section 7.4.
- **Tapped questions skip the router.** A tapped suggested question carries a fixed intent and skips the model call. Reason: PRD section 7.9. This saves latency and tokens.
- **Embedding model.** Use Google `text-embedding-004` via the Gemini API. Dimensions are 768. Reason: PRD section 7.1.
- **Embed at approval time.** Embed cards when a version is approved. Never embed per request. Reason: PRD section 7.1. Per request embedding wastes quota.
- **Answer model.** Use `gemini-2.5-flash`. Use the system prompt in PRD section 7.7 verbatim. Temperature is zero. Reason: PRD section 7.8. Temperature zero reduces invented figures.
- **Answer prompt source.** Pass only `{{CARD_CHUNKS}}` and `{{QUESTION}}`. Never pass private rows. Reason: PRD section 7.6. A model that never touches a figure cannot garble one.
- **Grounding check.** Extract every digit sequence from the answer after stripping commas, colons, full stops and currency symbols. Extract the same from the card chunks and the question. Every digit in the answer must appear in one of those two sets. Reason: PRD section 7.7.
- **On mismatch, discard.** Do not attempt to repair. Return the no answer response, write `BLOCKED_UNGROUNDED`, and show the handoff. Reason: PRD section 7.7.
- **Similarity threshold.** See `retrieval.md`. This file does not repeat the value.
- **Stage budgets.** Rules layer 50 ms. Router 3 s. Embedding 2 s. Vector query 1 s. Answer 5 s. Hard ceiling 11 s. On ceiling, return the error state and the handoff. Reason: PRD section 7.9.
- **Model interface.** Keep both models behind one module that exports two functions: `embed(text)` and `generate(prompt, input)`. Reason: PRD section 7.1. Free tiers change. Swapping must cost an hour.