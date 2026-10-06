---
trigger: model_decision
description: Read when configuring environment variables, database URLs (pooled vs direct), or API secrets
globs: .env, .env.example, .env.local
---

# Environment Rules

Controls environment variables and secrets.

- **Required variables.** Define `DATABASE_URL`, `DIRECT_URL`, `TEST_DATABASE_URL`, `GEMINI_API_KEY`, `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, `SESSION_SECRET`, and `NODE_ENV`. Reason: PRD section 8.1 names the database variables. The others are required by the stack.
- **Pooled connection.** `DATABASE_URL` must use the Neon pooled endpoint with `pgbouncer=true&connection_limit=1`. Reason: PRD section 8.1. Without pooling, serverless functions exhaust connections against a suspended compute.
- **Unpooled connection.** `DIRECT_URL` must use the Neon unpooled endpoint. Use it only for Prisma Migrate. Reason: PRD section 8.1. Migrations need a direct connection.
- **No variable is optional in production.** The app must fail to start if any required variable is missing. Reason: a missing webhook secret means unverified payments are accepted.
- **Example file.** Keep `.env.example` with every required variable name and no values. Commit it. Reason: a new environment can be set up without reading the code.
- **Local files.** Keep `.env.local` for development. Never commit any `.env` file. Reason: a committed secret cannot be un-leaked.
- **No default values for secrets.** Never write a fallback like `process.env.KEY || "test"`. Reason: a fallback secret in production is a silent hole.
- **Test mode for Paystack.** Use Paystack test keys until Gate C resolves. Reason: PRD Gate C. Live payments cannot start until the gym has a verified business account.
- **Rotate on leak.** If any secret is exposed, rotate it before the next deploy. Reason: a leaked Paystack secret can move money.