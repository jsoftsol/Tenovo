# Tenovo — Progress Log

Persistent working memory for this project, loaded automatically every session via CLAUDE.md. Two parts: **Current State** (kept up to date in place — overwrite, don't accumulate) and **Session Log** (append-only, newest entry on top).

## How to update this file

- **When to update**: whenever the user says something like "save progress", "checkpoint", "log this", or at the natural end of a meaningful chunk of work (a feature landed, a decision was made, a bug was root-caused). Don't update for trivial one-line fixes or mid-task exploration.
- **What to write**: what changed and why, decisions made (and rejected alternatives, briefly), and what's next. Skip anything already obvious from `git log`/`git diff` — this file is for context git can't carry (intent, open questions, things tried that didn't work).
- **Current State**: rewrite the relevant bullet(s) in place so it always reflects *now*, not a history of how it got there.
- **Session Log**: prepend a new dated entry (`## YYYY-MM-DD`). Keep entries to a few bullets — this is a log, not a diary.
- If PRD.md's description of a feature becomes inaccurate because of work done, update PRD.md itself (not just this log) and note that you did so here.

## Current State

- Core product surface is implemented and matches PRD.md section 4, except the gaps listed in PRD.md §7.
- Admin shell nav/header has been trimmed to only the real product pages (Dashboard, Projects, Audit Logs, Team, Jobs) — TailAdmin's demo pages (Calendar, Forms, Tables, Charts, UI Elements, Authentication demo links) are no longer in the sidebar, though the routes/components still exist under `src/app/(admin)/`. Logo is now the Tenovo mark + wordmark, not the TailAdmin stock logo.
- No open feature work in progress as of the last entry below.
- Local dev requires 3 processes (`npm run dev`, `npm run worker:email`, `npm run realtime`) plus `docker compose up -d` for Postgres/Redis.
- No automated tests exist in the repo yet.
- GitHub Dependabot is flagging 19 vulnerabilities (11 high, 7 moderate, 1 low) on the default branch as of 2026-08-11 — not yet triaged.

## Session Log

### 2026-08-11 (cont'd)
- Reviewed pre-existing uncommitted changes to `AppHeader.tsx`/`AppSidebar.tsx` (rebrand to Tenovo logo, removal of TailAdmin demo nav items and the header search bar). Verified with `tsc --noEmit` and `eslint` — clean after removing 7 now-unused icon/`SidebarWidget` imports left behind in `AppSidebar.tsx`. Committed and pushed (`f7d9c65` rebrand, `c3540e1` docs) to `origin/master`.
- Committed and pushed the `CLAUDE.md`/`PRD.md`/`PROGRESS.md` docs added earlier this session.

### 2026-08-11
- Reverse-engineered the codebase and authored the initial documentation set: `CLAUDE.md` (architecture/dev-command reference for Claude Code), `PRD.md` (feature-by-feature spec reconstructed from the actual API routes/UI, including gaps vs the README's claims), and this `PROGRESS.md`.
- Notable findings captured in PRD.md §7: Projects API only supports Create+List (README calls it "CRUD"), `GET /api/jobs` looks unused/duplicated with the server-rendered `Jobs.tsx`, audit-log action strings aren't consistently dot.case, team "invite" requires the invitee to already have an account.
- No code changes made this session — documentation only.
