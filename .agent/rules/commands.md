---
trigger: always_on
description: whenever the agent needs to run commands
---

# Commands

Controls the runnable commands for Spotter.

- **Install.** `npm install`. Reason: the project uses npm. Do not add a second package manager.
- **Dev server.** `npm run dev`. Reason: one command starts the Next.js dev server.
- **Build.** `npm run build`. Reason: this is the command CI and Vercel run.
- **Typecheck.** `npm run typecheck`. Reason: TypeScript errors must be caught before build.
- **Lint.** `npm run lint`. Reason: CI runs this. Local runs catch issues before push.
- **Design tokens.** `npm run tokens`. Reason: compiles `tokens.json` to `tokens.css` using `convert-tokens-to-css.js`.
- **Test, full suite.** `npm run test`. Reason: one command runs everything.
- **Test, watch mode.** `npm run test:watch`. Reason: development needs a rerun on change.
- **Test, single file.** `npm run test -- path/to/file.test.ts`. Reason: running one file is faster during development.
- **Prisma migrate, local.** `npx prisma migrate dev`. Reason: creates a migration and applies it to the local database.
- **Prisma migrate, production.** `npx prisma migrate deploy`. Reason: applies pending migrations without creating new ones. Never run `migrate dev` against production.
- **Prisma generate.** `npx prisma generate`. Reason: the client must be regenerated after every schema change.
- **Prisma studio.** `npx prisma studio`. Reason: inspect rows during development without writing a script.
- **Test database reset.** `npm run test:reset`. Reason: drops and recreates the test schema. Required between test runs. See `testing.md`.
- **Seed.** `npm run seed`. Loads one gym, one owner, one desk officer, one BASIC member, one PREMIUM member, and one membership plan per tier. Reason: this is the minimum needed to run every feature locally.
- **Raw SQL for CardChunk.** No command. All CardChunk writes go through `src/server/retrieval/index-card.ts`. Reason: PRD section 10.6.