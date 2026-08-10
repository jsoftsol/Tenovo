# Project overview

Tenovo (`D:\Documents\Nextjs\Tenovo`) is a multi-tenant SaaS **architecture showcase** portfolio project — Next.js App Router, Prisma 7, PostgreSQL, Redis, BullMQ, Auth.js v5, TailAdmin UI. Not a commercial product: no billing, no real email delivery, no paying customers.

The repo has three living docs that are the source of truth and should be read before re-exploring the codebase from scratch:
- `CLAUDE.md` — dev commands + architecture reference, auto-loaded by Claude Code every session.
- `PRD.md` — feature-by-feature spec reverse-engineered from actual code, including known gaps vs the README's claims (e.g. Projects API only supports Create+List despite README calling it "CRUD").
- `PROGRESS.md` — running session log + current-state snapshot.

`CLAUDE.md` imports `PRD.md` and `PROGRESS.md` via `@` syntax so both load automatically every session. See [doc-workflow.md](doc-workflow.md) for how these are meant to be kept up to date.
