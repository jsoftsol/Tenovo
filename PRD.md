# Tenovo — Product Requirements Document

Reverse-engineered from the current codebase (not a pre-written spec). This describes what the product actually does today, plus explicitly-flagged gaps and roadmap items. Update this file when a feature's behavior changes — see PROGRESS.md for the change log.

## 1. Product Summary

Tenovo is a multi-tenant SaaS **architecture showcase** (not a commercial product) demonstrating production SaaS engineering patterns: tenant isolation, RBAC, background job processing, realtime notifications, and audit logging, on a Next.js/Prisma/PostgreSQL/Redis stack. The UI shell is TailAdmin; only a subset of TailAdmin's pages hold real product logic — the rest (charts, calendar, form-elements demos, ui-elements gallery) are template filler, still wired into the sidebar nav.

Primary audience: engineers/recruiters evaluating the codebase as a portfolio piece. There are no paying customers, no billing, and no real email delivery.

## 2. Users & Roles

A `User` can hold a `Membership` in multiple `Organization`s. Role is per-membership, not global. Roles, ranked highest to lowest (`src/lib/permissions.ts`):

| Role | Rank | Can view projects | Can manage projects | Can manage org (team, roles) |
|--------|----|----|----|----|
| OWNER | 4 | yes | yes | yes |
| ADMIN | 3 | yes | yes | yes |
| MEMBER | 2 | yes | yes | no |
| VIEWER | 1 | yes | no | no |

Hard rules enforced in API route handlers (not in the schema):
- The user who registers becomes `OWNER` of the organization created at signup.
- An `OWNER` membership's role can never be changed (`PATCH /api/memberships/:id` rejects it).
- An `OWNER` membership can never be removed (`DELETE /api/memberships/:id` rejects it).
- A user cannot remove their own membership via the team UI.
- There is currently no way to transfer ownership or add a second OWNER.

## 3. Domain Model

```
User ──< Membership >── Organization ──< Project
  │            (role)         │
  │                           ├──< AuditLog >── User (optional, SetNull on delete)
  └──< AuditLog (author, optional)
User ──< Account, Session   (Auth.js/NextAuth tables)
```

- `User` — id, name, email (unique), emailVerified, image, password (bcrypt hash, nullable — only Credentials provider is wired up so it's always set today).
- `Organization` — id, name, slug (unique, auto-generated as `slugified-name-<5 random chars>` at signup).
- `Membership` — join table, unique on `(userId, organizationId)`, carries `role: Role`.
- `Project` — id, organizationId, name, description (nullable). No status/owner/other fields.
- `AuditLog` — id, organizationId, userId (nullable), action (free-text string), entity (free-text string), entityId (nullable), metadata (JSON), createdAt. No `updatedAt` — logs are append-only.
- `Role` enum — `OWNER | ADMIN | MEMBER | VIEWER`.
- `Account`, `Session`, `VerificationToken` — standard Auth.js/Prisma-adapter tables, not used for anything beyond credentials/JWT sessions today (no OAuth providers configured, no email verification flow wired up despite the `emailVerified` field existing).

Full schema lives in `prisma/models/*.prisma` (one file per model) — see CLAUDE.md for the modular-schema convention.

## 4. Feature Specs

### 4.1 Authentication & Onboarding — implemented
- `POST /api/register`: name, email, password (min 8 chars), organizationName. Creates `User` + `Organization` + `OWNER` `Membership` in one transaction-like nested-write. Returns 409 if email already exists.
- Sign-in: Auth.js Credentials provider, email+password checked against bcrypt hash, JWT session (`src/auth.ts`).
- Route protection: `src/proxy.ts` (Next.js 16's `middleware.ts` replacement) gates all routes except `/signin`, `/signup`, `/api/auth/*`, `/api/register`.
- **Not implemented**: password reset / forgot-password, email verification, OAuth providers, invite-driven signup (see 4.5 gap below).

### 4.2 Organizations & Tenant Switching — implemented
- A user's active organization is tracked via the `tenovo_active_org_id` httpOnly cookie, defaulting to their oldest membership if unset or invalid.
- `POST /api/organizations/switch`: verifies the caller has a membership in the target org, then overwrites the cookie. No server-side "current org" state beyond the cookie.
- Switching organizations changes the scope of every tenant-scoped query (projects, team, audit logs, dashboard stats) on next navigation/request.
- **Not implemented**: creating additional organizations from within the app (only signup creates one), leaving an organization, deleting an organization.

### 4.3 RBAC — implemented
- Enforced server-side in every mutating API route via `hasRole`/`canManageOrganization`/`canManageProjects`/`canViewProjects` (`src/lib/permissions.ts`), and mirrored client-side to hide controls the user isn't allowed to use (e.g. `Team.tsx` hides Add/Remove/role-select for non-ADMIN/OWNER viewers).
- No route currently gates on `canViewProjects`-only distinctions beyond the projects list; VIEWER effectively sees the same dashboard as everyone, just without mutation controls.

### 4.4 Projects — partially implemented
- `GET /api/projects` — list, tenant-scoped, requires ≥VIEWER.
- `POST /api/projects` — create, requires ≥MEMBER; writes an audit log (`project.created`) and publishes a realtime notification.
- **Gap vs README**: the README describes "Tenant-scoped CRUD" for projects, but there is no `PATCH`/`DELETE`/`[projectId]` route, and the `Projects.tsx` UI has no edit or delete affordance. Only Create + List exist today.

### 4.5 Team Management — implemented, with a signup gap
- `GET /api/memberships` — list current org's members (with user name/email/image), any authenticated member.
- `POST /api/memberships` — add a member by email; requires the email to belong to an **already-registered** `User` (returns 404 "User must be registered before adding to this organization" otherwise). Requires ≥ADMIN. Writes audit log `membership.created` and enqueues an invitation email job.
- `PATCH /api/memberships/:id` — change role to ADMIN/MEMBER/VIEWER; requires ≥ADMIN; rejects targeting an OWNER.
- `DELETE /api/memberships/:id` — remove a member; requires ≥ADMIN; rejects targeting an OWNER or self.
- **Gap**: there's no invite-by-email flow for people without an account yet — the queued "invitation email" job just logs to console (no real provider) and doesn't carry a signup link. Effectively, team members must self-register with the target email first, then an admin adds them.

### 4.6 Audit Logging — implemented
- `GET /api/audit-logs` — last 50 logs for the active org, newest first, with author name/email joined in.
- Logged today: `project.created`, `membership.created`, `membership role updated` (note: inconsistent naming — spaces vs dots — vs `membership.removed`), `membership.removed`.
- Audit logs are append-only and tenant-scoped; there is no UI or API to filter/search/export them beyond the most-recent-50 view.

### 4.7 Queue / Jobs Monitoring — implemented
- Server-rendered `Jobs.tsx` page and a parallel `GET /api/jobs` route both compute the same thing independently (waiting/active/completed/failed/delayed counts + last 20 jobs across all statuses) directly against the BullMQ `email` queue via `queues.email.getJobs(...)`. The API route appears unused by any current client component — likely scaffolding for a future client-refresh feature.
- Job status is derived client-side from job fields (`failedReason` → FAILED, `finishedOn` → COMPLETED, `processedOn` → ACTIVE, else WAITING) rather than BullMQ's own state API.
- Only one queue exists (`email`). `src/queues/queue-names.ts` / `src/queues/index.ts` are structured so adding a queue means: new `Queue` instance, add to `QUEUE_NAMES`, register in `queues` map, add a producer, add a worker.

### 4.8 Realtime Notifications — implemented
- Currently the only realtime event is "project created" (see 4.4). `publishNotification()` is generic (`title`, `message`, `type: success|error|...`, `organizationId`, `createdAt`) and could be called from any route.
- Delivery: API route → Redis pub/sub (`tenovo:notifications`) → standalone Socket.IO server → room `organization:{id}` → client toast (`sonner`) via `RealtimeProvider`.
- Client joins/leaves the room based on the *active* org from `AppContext`; if the user switches orgs, `RealtimeProvider` re-runs its effect (keyed on `organization.id`) to leave the old room and join the new one.

### 4.9 Dashboard — implemented
- `GET /api/dashboard/stats` — counts of projects, members, audit logs for the active org, plus role and org identity. Used for the admin dashboard's summary cards (ecommerce-style widgets inherited from the TailAdmin template).

### 4.10 TailAdmin Template Surface — present but not product features
Routes under `(others-pages)`, `(ui-elements)`, `(chart)`, `(tables)`, `(forms)`, `calendar`, `profile`, `blank` are the TailAdmin starter template's demo content (buttons, badges, modals, form elements, chart examples, calendar, a static profile page). They're reachable via the sidebar but hold no Tenovo-specific business logic. Treat them as UI component inventory, not as product surface, unless a task specifically asks to build on top of one.

## 5. Non-Functional Requirements

- **Tenant isolation**: every Prisma query touching tenant data must filter by `organizationId` sourced from `getCurrentMembership()` — never from a client-supplied value. See CLAUDE.md's API route convention.
- **AuthZ before AuthN-adjacent logic**: every mutating route checks membership existence (401) then role (403) before touching Prisma.
- **Auditability**: state-changing actions on Projects and Memberships write an audit log in the same request. New mutating features should follow this pattern unless explicitly transient.
- **Horizontal scalability (demonstrated, not load-tested)**: realtime server and BullMQ workers are separate stateless-ish processes/containers coordinating through Redis, specifically to demonstrate this pattern — don't collapse them back into the Next.js server.
- **No automated test suite** exists; correctness currently rests on manual verification and TypeScript's strict mode.

## 6. Explicitly Out of Scope (per README's "Future Roadmap")

Real email provider integration, queue retry dashboard, WebSocket notification center (beyond current toast), billing, AI task queues, activity feed, file uploads, S3/Wasabi storage, rate limiting, monitoring/observability, CI/CD improvements, Kubernetes, blue/green deploys, centralized logging, automated backups, distributed websocket scaling beyond the current Redis adapter.

## 7. Known Gaps / Inconsistencies (for future work, not yet actioned)

1. Projects has no update/delete despite being called "CRUD" in README — decide whether to implement or correct the docs.
2. `GET /api/jobs` duplicates `Jobs.tsx`'s server-side logic and appears unused by any client — either wire up client-side polling/refresh or remove.
3. Audit log action strings are inconsistent (`membership role updated` vs `membership.removed`, `project.created`) — should standardize on dot.case.
4. Team invite flow requires the invitee to already have a Tenovo account; the "invitation" is really just an add-to-org action. A real invite-by-email flow (pending membership + signup link) is not built.
5. `emailVerified` field exists on `User` but no verification flow sets or checks it.
6. No way to create a second organization or leave/delete one from the app.
