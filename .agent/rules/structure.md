---
trigger: model_decision
description: Read before creating any new file. folder or route, or when deciding where a module belongs
---

# Structure Rules

Controls the folder layout and import boundaries for Spotter.

- **Folder map.** Use only these paths:
  - `app/api/**` for route handlers.
  - `app/**` for Next.js App Router member pages and layouts.
  - `src/components/**` for member-facing UI components.
  - `src/server/auth/session.ts` for session reads.
  - `src/server/router/rules.ts` for the deterministic never answer layer.
  - `src/server/retrieval/search.ts` for tier filtered vector search.
  - `src/server/retrieval/index-card.ts` for CardChunk raw SQL.
  - `src/server/private/*.ts` for private record queries.
  - `src/lib/types/**` for shared TypeScript types.
  - `src/lib/constants/**` for shared constants.
  Reason: AGENTS.md names the server paths. client.md and copy.md govern the UI layer. Do not invent other server paths.
- **Route handlers call services.** A handler in `app/api/**` parses input, calls a function in `src/server/**`, and returns a response. It never touches the database directly. Reason: AGENTS.md forbids it. The CI grep in `ci.md` enforces it.
- **Session reads.** Read the session cookie only in `src/server/auth/session.ts`. Reason: `auth.md` owns the session rule. This file states the boundary only.
- **Rules layer.** `src/server/router/rules.ts` runs before any model call. Reason: `ai.md` owns the rules layer content. This file states the path only.
- **Retrieval module.** `src/server/retrieval/search.ts` accepts a query embedding and an effective tier. It never accepts a member ID. Reason: `retrieval.md` owns the retrieval rule. This file states the boundary only.
- **Private module.** Every exported function in `src/server/private/*.ts` takes the session member ID as its first argument. Reason: `privacy.md` owns the private data rules. This file states the boundary only.
- **Import direction.** `app/api/**` may import from `src/server/**`. `src/server/**` may not import from `app/**`. Reason: server code must not depend on route handlers.
- **No cross import between private and retrieval.** `src/server/private/*.ts` never imports from `src/server/retrieval/`, and the reverse is also forbidden. Reason: PRD section 9.3. The CI grep in `ci.md` enforces it.
- **Shared types.** Put types used by both server and client in `src/lib/types/**`. Reason: one location avoids drift between the two sides.
- **Shared constants.** Put values used by both server and client in `src/lib/constants/**`. Reason: one location avoids two copies of the same number.
- **One owner per rule.** If a rule lives in another file, reference it. Do not repeat it here.