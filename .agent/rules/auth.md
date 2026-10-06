---
trigger: model_decision
description: Read when implementing activation codes, PIN hashing (Argon2id), session cookies, device binding, lockout rules, or session middleware
globs: src/server/auth/**, src/middleware.ts
---

# Auth Rules

Controls identity, session, and device binding for the member app.

- **Activation code format.** Eight characters. Uppercase letters and digits. System generated. Reason: PRD FR-1.
- **Activation code storage.** Store only the hash. Show the plain code once at issue. Reason: PRD FR-1.
- **Activation code expiry.** Expire after seventy two hours or on first use, whichever comes first. Reason: PRD FR-2.
- **PIN storage.** Hash with Argon2id. Never store or log the plain PIN. Reason: PRD FR-3. Argon2id is slow and memory hungry, so guessing is expensive.
- **PIN length.** Four digits. Reason: PRD FR-3.
- **Privacy notice.** Show the notice before the PIN is set. Require acceptance. Reason: PRD FR-58. See `privacy.md` for the notice content.
- **Session cookie.** Issue one HTTP only cookie bound to a device ID. Reason: PRD FR-4. One member holds one active device binding at a time.
- **Second device.** Activating on a second device revokes the first session. Reason: PRD FR-4.
- **Re-link.** Requires a fresh activation code from the desk. No self service reset. No SMS. No email. Reason: PRD FR-5.
- **Remote re-link.** Staff may send a code to the member's registered WhatsApp number. Limit two per member per thirty days. Log the issuing staff ID and the reason. A third within thirty days requires the member to appear. Reason: PRD FR-5b.
- **Session lifetime.** Ninety days from last use. Refresh on each request. Reason: PRD FR-6.
- **Last seen update.** Every authenticated request updates `MemberSession.lastSeenAt`. Reason: the ninety day window is measured from last use, so last use must be accurate.
- **Session refresh.** Each authenticated response reissues the session cookie with a fresh expiry. Reason: PRD FR-6. Refreshes on each request.
- **PIN re-entry triggers.** After seven days of inactivity and immediately before any payment. Reason: PRD FR-6. `client.md` references these triggers.
- **Lockout.** Five consecutive wrong PINs lock the account for fifteen minutes. Ten wrong entries in twenty four hours revoke the session and require a fresh code. Reason: PRD FR-7.
- **Member ID source.** Read the member ID and effective tier only from the session. Never read a member ID from the request body. Reason: PRD FR-15 and AGENTS.md. This is R-1. `structure.md` and `ci.md` reference this rule.
- **Invalid code message.** Use the exact string in `copy.md`. Never say which part failed. Reason: PRD section 6.1.
- **Empty state.** A visitor with no session sees only the activation screen. Use the strings in `copy.md`. Reason: PRD section 6.1.
- **Staff and owner sessions.** Use a separate cookie name, a separate route, and a separate session table. Reason: PRD section 6.8 and 6.9. Staff and owner never open the member app.