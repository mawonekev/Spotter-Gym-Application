---
trigger: model_decision
description: Read when building client or UI components, managing Next.js server vs client components, data fetching, loading states, or offline caching
globs: app/**, src/components/**, src/client/**, frontend/**
---

# Client Rules

Controls the boundary between server and client code in Next.js.

- **Default to server components.** Mark a component `"use client"` only when it needs state, effects, or browser APIs. Reason: server components keep the bundle small, which matters for the member's data cost.
- **Data fetching.** Fetch on the server in route handlers under `app/api/**` or in server components. Never fetch member data from the client. Reason: the session cookie is the only source of member ID. See `auth.md`.
- **No Prisma in client code.** Client components never import the Prisma client. Reason: it cannot run in the browser and it would leak the schema.
- **Service worker scope.** Cache the app shell, the eight suggested questions, and the last status payload only. Never cache answers. Reason: PRD section 8.4. A stale price answer is the failure this product exists to prevent.
- **Check in needs network.** Show a clear message if the network is unavailable. Reason: PRD section 8.4. Check in requires the server to write a row.
- **One request on open.** The home screen makes at most one network request on open. Reason: PRD FR-10. This keeps sixteen opens a month under one naira of data.
- **Cached balance rule.** A cached balance older than twenty four hours must hide the figure and show the stale balance string from `copy.md`. Reason: PRD FR-8b. A stale money figure with no date is the exact failure the product prevents.
- **Payment polling.** Poll the payment attempt for up to ninety seconds, then stop and show the confirmation timeout string from `copy.md`. Reason: PRD section 6.6 step seven.
- **PIN re-entry.** Prompt for the PIN on the triggers defined in `auth.md`. Reason: auth.md owns the triggers.
- **Loading states.** Show a working state after two seconds. Reason: PRD section 7.9. A silent screen reads as a broken app.
- **Error boundaries.** Wrap each route segment in an error boundary that shows the handoff control. Reason: an unhandled render error must not strand the member on a blank screen.
- **No browser storage of the session token.** Store only the device ID. The session lives in an HTTP-only cookie. Reason: a token in local storage is readable by any script on the page.