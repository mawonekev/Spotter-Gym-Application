---
trigger: model_decision
description: Read before creating branches, committing changes, or opening pull requests
---

# Git Rules

Controls version control behaviour for the Spotter repository.

- **Branch names.** Use `main` for production and `feat/`, `fix/`, `chore/` prefixes for work. Reason: one developer plus an agent needs a predictable naming scheme so branches are not confused.
- **Commit messages.** Use one line in the imperative mood, under seventy two characters. Add a blank line and a body only when the change needs explanation. Reason: short messages keep the history readable at a glance.
- **One change per commit.** A commit touches one feature, one fix, or one refactor. Do not mix a fix and a feature in one commit. Reason: AGENTS.md requires one change at a time. A mixed commit cannot be reverted cleanly.
- **No force push to `main`.** Use a pull request even when working alone. Reason: CI checks must run before anything reaches production.
- **No generated files.** Never commit `.next/`, `node_modules/`, or the Prisma generated client. Reason: generated files churn the history and cause merge noise.
- **No secrets.** Never commit any file that holds a secret. See `env.md` for secret handling. Reason: a committed secret cannot be un-leaked.
- **Delete merged branches.** Remove local and remote branches after merge. Reason: stale branches hide which work is live.