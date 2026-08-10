# Project Detail Page: About + Keywords Sidebar

Date: 2026-08-11
Status: Approved, ready for implementation planning

## Summary

Add a single-project detail page (`/projects/[projectId]`) with a GitHub-repo-style right sidebar ("About" card) showing the project's description and keywords. Includes full edit support (description + keywords), since neither currently exists for Projects beyond create. Closes part of PRD.md gap #1 (Projects has no update route).

## Scope

In scope:
- New `keywords String[]` field on `Project`.
- `GET`/`PATCH /api/projects/[projectId]`.
- New `projects/[projectId]` detail page with a two-column layout (main content + right "About" sidebar).
- Edit modal for description + keywords (comma-separated text input, rendered as `Badge` pills).
- `Projects.tsx` table rows link to the new detail page.

Out of scope (explicitly deferred, per user decisions during brainstorming):
- Website/link field, activity stats (stars/forks-style counts), or any other GitHub "About" sidebar elements beyond description + keywords.
- A dedicated tag/chip input component — keyword entry is a single comma-separated text field, split/trimmed/deduped client-side on submit.
- Project delete.
- Normalized `Keyword` model / join table — keywords are a plain `String[]` on `Project`.

## 1. Data model & API

- `prisma/models/project.prisma`: add `keywords String[] @default([])`. New migration via `npx prisma migrate dev`.
- `src/app/api/projects/[projectId]/route.ts` (new file):
  - `GET`: resolve membership (401 if none) → `canViewProjects` check (403) → `prisma.project.findFirst({ where: { id, organizationId } })` → 404 if not found (covers both "doesn't exist" and "belongs to another org" — never distinguish these in the response).
  - `PATCH`: resolve membership (401) → `canManageProjects` check (403, same level as `POST /api/projects`) → update `description`/`keywords`, scoped by `organizationId` in the `where` clause → write audit log `project.updated` (metadata: `{ description, keywords }`) → `publishNotification()` (type `success`, org room) → return updated project.
- `src/types/project.ts`: add `keywords: string[]`.

## 2. UI / pages

- `src/app/(admin)/projects/[projectId]/page.tsx` — server component. Resolves session/membership (redirect/401 per existing layout convention), fetches the project scoped by org, `notFound()` if missing, renders client `ProjectDetail.tsx` with the project + membership role.
- Layout: `grid grid-cols-1 lg:grid-cols-3 gap-6` — main content `lg:col-span-2`, sidebar `lg:col-span-1`. First left-content/right-sidebar split in this codebase (existing detail-style pages like Profile are single-column stacked cards).
  - Main column: project name (heading), created/updated dates.
  - Sidebar: bordered `rounded-2xl` "About" card (same card styling as `UserInfoCard`) containing the description text, keyword pills (`Badge` per keyword), and an "Edit" button gated on `canManageProjects`.
- Edit modal: reuses the existing `Modal` + `Label`/`Input` pattern (see `Team.tsx`, `UserInfoCard.tsx`). Fields: description `textarea`, keywords `Input` (pre-filled by joining current keywords with `, `). On submit: split on comma, trim, dedupe, drop empties, `PATCH` via the shared `axios` instance (`src/lib/api.ts`), surface errors via `api-error.ts`.
- `Projects.tsx`: project name cell becomes a `Link` to `/projects/${project.id}`.

## 3. Permissions, audit, error handling

- Tenant isolation: every query (page + both API methods) filters by `organizationId` sourced from `getCurrentMembership()`, never from the URL's `projectId` alone.
- AuthZ: no membership → 401; below required role → 403. `canViewProjects` for `GET`/page render, `canManageProjects` for `PATCH`.
- Audit log: `PATCH` writes `project.updated` (dot.case, consistent with the naming-cleanup direction noted in PRD.md gap #3) with metadata `{ description, keywords }`.
- Realtime: publish a notification on update, matching the create flow's shape (`type: "success"`).
- No other new fields (no website/link, no stats) — the sidebar shows only description + keywords per scope decision above.

## Open questions / risks

None outstanding — all scope questions were resolved during brainstorming (see decisions above).
