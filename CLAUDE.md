# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Persistent Context

This project keeps two living docs, imported below so they load into every session automatically — read them before re-deriving anything from source that they already answer:

@PRD.md
@PROGRESS.md

`PRD.md` is the feature-by-feature spec reconstructed from the actual code (what's implemented, what's a gap, what's explicitly out of scope). `PROGRESS.md` is a running log of decisions and session-to-session state.

**All context for this project stays inside this repository — nothing is saved to the global `~/.claude/projects/*/memory/` auto-memory system.** Standing rules, corrections, and preferences that aren't a good fit for `PROGRESS.md`'s session log live in `docs/memory/` instead (see `docs/memory/MEMORY.md` for the index). If asked to "remember" something for this project, write it into `PROGRESS.md` or `docs/memory/`, not global memory.

**Update PROGRESS.md** when the user asks to save/checkpoint progress, or at the end of a meaningful chunk of work — see the "How to update this file" note at the top of PROGRESS.md for what belongs there. **Update PRD.md** whenever a change makes its description of a feature inaccurate (new endpoint, behavior change, a gap getting fixed) — it should always reflect current reality, not a point-in-time snapshot.

## Project

Tenovo is a multi-tenant SaaS platform (public architecture showcase) built on Next.js App Router, Prisma 7, PostgreSQL, Redis, BullMQ, and a TailAdmin-based UI. It intentionally demonstrates production SaaS patterns: tenant isolation, RBAC, background jobs, realtime notifications, and audit logging.

## Commands

```bash
npm run dev            # Next.js dev server
npm run build           # Production build
npm run start            # Start production build
npm run lint             # ESLint (eslint.config.mjs, flat config)

npm run worker:email     # Run the BullMQ email worker (tsx src/workers/email.worker.ts)
npm run realtime         # Run the Socket.IO realtime server (tsx src/realtime/socket-server.ts)

npx prisma generate       # Regenerate Prisma client (outputs to src/generated/prisma)
npx prisma migrate dev    # Create/apply a dev migration
docker compose up -d      # Start local Postgres + Redis
```

There is no test suite in this repo currently.

For local development you need three processes running: `npm run dev`, `npm run worker:email`, and `npm run realtime` (plus `docker compose up -d` for Postgres/Redis).

## Architecture

### Multi-tenancy

Every tenant-scoped record carries an `organizationId`. A user can belong to multiple organizations via `Membership` (role: `OWNER | ADMIN | MEMBER | VIEWER`, ranked in that order in `src/lib/permissions.ts`). The active org is tracked with the `tenovo_active_org_id` cookie.

- `src/lib/tenant.ts` — `getCurrentUser()`, `getCurrentMembership()` (resolves the active org from the cookie, falling back to the user's first membership), `getUserMemberships()`. Nearly every server component and API route starts by calling `getCurrentMembership()` and scoping all Prisma queries with `organizationId: membership.organizationId`.
- `src/lib/permissions.ts` — role-rank helpers (`hasRole`, `canManageOrganization`, `canManageProjects`, `canViewProjects`). API routes check these before mutating data; OWNER can never be demoted or removed (enforced in the membership route handlers, not at the schema level).
- Switching orgs (`POST /api/organizations/switch`) just verifies membership and rewrites the cookie — no server session state changes.

### Server → client context flow

`src/app/(admin)/layout.tsx` is a server component that resolves session, membership, and memberships, then hands them to a client `ClientLayout`, which wraps children in `AppProvider` (`src/context/AppContext.tsx`). Any client component can then call `useAppContext()` to get `{ user, membership, memberships }` without refetching.

### Auth

Auth.js v5 (`src/auth.ts` + `src/auth.config.ts`), Credentials provider only, Prisma adapter, JWT session strategy. Passwords hashed with bcryptjs (`src/lib/password.ts`).

Route protection is **not** in a `middleware.ts` file — Next 16 renamed the convention to `src/proxy.ts`. It wraps `auth()`, redirects unauthenticated users to `/signin` (except `/signin`, `/signup`, `/api/auth/*`, `/api/register`), and redirects authenticated users away from the public auth pages.

### Prisma

Prisma 7 with the `prisma-client` generator (not the classic `@prisma/client` generator) — client output goes to `src/generated/prisma` (gitignored, regenerate after any schema change). Import the client type from `@/generated/prisma/client` and enums from `@/generated/prisma/enums`; app code never imports directly from `@prisma/client`. `src/lib/prisma.ts` wires it up via `PrismaPg` (`@prisma/adapter-pg`) and the standard dev-mode `globalThis` singleton.

Schema is modular under `prisma/` — one model per file:
```
prisma/schema.prisma        # generator + datasource only
prisma/enums/role.prisma
prisma/models/*.prisma      # user, account, session, verification-token, organization, membership, project, audit-log
```
When adding a model or enum, add a new file rather than editing `schema.prisma` directly.

`prisma.config.ts` points at the `prisma/` directory (not a single schema file) and reads `DATABASE_URL` — this is the Prisma 7 config format, distinct from the old `schema.prisma`-only convention.

### Background jobs (BullMQ)

Flow: API route → producer function → Queue → separate worker process.

- Queues live in `src/queues/` (`email.queue.ts` defines the `Queue`, `queue-names.ts` centralizes queue name strings, `producers/*.ts` expose typed `enqueueX()` functions used by API routes).
- Workers live in `src/workers/` and run as standalone `tsx` processes (`npm run worker:email`), not inside the Next.js server — they get their own Docker container (`worker_email`) in production.
- Job payload types live in `src/types/*` (e.g. `organization-invitation-job-data.ts`) and are shared between producer and worker for type safety.
- Adding a new job type: add/extend a `Queue` in `src/queues/`, a typed producer function, a job-data type in `src/types/`, and a handler branch (matched on `job.name`) in the relevant worker.

### Realtime notifications

Flow: API route calls `publishNotification()` (`src/lib/realtime.ts`, publishes JSON to Redis channel `tenovo:notifications`) → the standalone Socket.IO server (`src/realtime/socket-server.ts`, run via `npm run realtime`) subscribes to that channel and re-emits `notification:new` to the room `organization:{organizationId}` → the client `RealtimeProvider` (`src/context/RealtimeProvider.tsx`) joins that room using the active org from `AppContext` and shows a `sonner` toast per notification.

The realtime server is a separate process/container (not part of the Next.js app) so it can scale independently; it uses `@socket.io/redis-adapter` for horizontal scaling across instances.

### API routes

Route handlers under `src/app/api/**/route.ts` follow a consistent shape: resolve membership via `getCurrentMembership()` → 401 if none → permission check via `src/lib/permissions.ts` → 403 if disallowed → Prisma query scoped by `organizationId` → for mutations, write an audit log via `createAuditLog()` (`src/lib/audit.ts`) and optionally `publishNotification()`. Follow this shape for new endpoints rather than introducing a different auth/response pattern.

Client-side, `src/lib/api.ts` exports a shared `axios` instance (`baseURL: "/api"`, credentials included, redirects to `/signin` on 401); `src/lib/api-error.ts` extracts a user-facing message from an axios/Error/unknown value. Use these instead of raw `fetch` in client components.

### Route groups

- `src/app/(admin)/` — authenticated dashboard shell (projects, team, audit-logs, jobs, plus the TailAdmin demo UI pages under `(others-pages)`/`(ui-elements)`/`(chart)`/`(tables)`). Layout enforces auth + membership and provides `AppContext`.
- `src/app/(full-width-pages)/` — `(auth)` sign-in/up and `(error-pages)`, outside the dashboard chrome.

### UI base

Built on the TailAdmin admin template (TailwindCSS v4, ApexCharts, FullCalendar, jVectorMap, react-dnd, Swiper). `src/components/` mirrors this: `ui/` for base primitives (button, modal, table, badge, avatar, dropdown, alert), feature folders (`ecommerce`, `calendar`, `charts`, `tables`, `form`) mostly still holding the template's demo content — the actual product features (projects, team, audit logs, jobs) live under their respective `src/app/(admin)/<feature>/` route folders rather than `src/components/`.

## Deployment

CI/CD is git-driven off the `deploy` branch (`.github/workflows/deploy.yml`): GitHub Actions builds the production env from repo secrets, SCPs to the VPS, and runs `docker-compose.prod.yml`, which brings up `app`, `realtime`, `worker_email`, `postgres`, `redis`, and a one-shot `migrate` service (`prisma migrate deploy`). Host Nginx reverse-proxies to `127.0.0.1:${APP_PORT}`; Postgres/Redis are not exposed publicly. See README.md for the full infra diagram.
