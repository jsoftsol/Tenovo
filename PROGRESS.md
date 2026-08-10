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
- Node version is pinned via `.nvmrc` and `package.json` `engines` to `25.2.1`, matching the `node:25-alpine` used in `DockerFile` (production had no dev-side pin before 2026-08-11).
- Dependency vulnerabilities: triaged 2026-08-11. **Fixed**: `next-auth` (beta.31→beta.32), `@auth/core` (0.41.2→0.41.3, via bumping `@auth/prisma-adapter` to 2.11.3 so both packages dedupe to the patched copy instead of installing two), `next` (16.2.4→16.2.11) — see commit `957cd27`. **Still open**: the rest of `npm audit`'s ~20 remaining issues, mostly transitive dev/build deps (`postcss`, `svgo`, `js-yaml`, `brace-expansion`, `axios`, `form-data`, `hono`/`@hono/node-server` via `@prisma/dev`) — auto-fixable via `npm audit fix`, not yet applied. `swiper` still has an unfixed critical prototype-pollution advisory; it's unused in app code (only its CSS is referenced in `globals.css`) so the recommendation stands to remove the dependency rather than force-upgrade it.

## Session Log

### 2026-08-11 (cont'd 4)
- Applied the `next-auth`/`next` security fixes flagged earlier. Bumping `next-auth` to beta.32 alone left a second, older `@auth/core@0.41.2` installed at the top level (still vulnerable) because `@auth/prisma-adapter@2.11.2` pins that range independently — had to also bump the adapter to `2.11.3` to get both packages deduped onto the patched `@auth/core@0.41.3`. Worth remembering: a transitive-dep security fix isn't done just because the direct package you bumped resolves correctly — check `npm ls <transitive-pkg>` for duplicate copies. Verified with `tsc --noEmit`, `eslint`, and a full `next build` (Turbopack, 16.2.11) — all clean. Committed and pushed as `957cd27`. Remaining audit items (transitive dev deps + `swiper`) are still open, see Current State.

### 2026-08-11 (cont'd 3)
- User asked to strip all Claude/Co-Authored-By attribution from git commits, retroactively and going forward. Scanned full history (99 commits): only 5 had a Claude trailer, all from this session and all ahead of the `deploy` branch's tip (confirmed via `git merge-base`), so only `master` needed touching. Two older commits (`05fab45`, `a512666`) had a `Co-authored-by` trailer too, but attributed to GitHub Copilot, not Claude — left as-is. Rewrote the 5 messages with `git filter-branch --msg-filter` scoped to `c85015a..master`, verified file contents were untouched (tree diff empty), then `git push --force-with-lease origin master`. Cleaned up the local `refs/original` backup ref afterward. Commit hashes changed: `f7d9c65`→`a97fa73`, `c3540e1`→`bc07482`, `234f7aa`→`7b8ac74`, `836bbee`→`7f3bc74`, `df7189a`→`a575278` (content identical, message trailer removed). All hash references below updated to match. Going forward, no AI attribution gets added to commits in this repo — see the memory note `feedback_tenovo_no_ai_attribution` for the standing rule.

### 2026-08-11 (cont'd 2)
- Answered "what Node version does this expect" — no `.nvmrc`/`engines` existed; `DockerFile` targets `node:25-alpine` in all stages. Added `.nvmrc` (`25.2.1`) and `package.json` `engines.node` (`^25.2.1`) to make that explicit for local dev. Committed and pushed (`7f3bc74`).
- Triaged the 19 GitHub Dependabot alerts plus a fuller local `npm audit` (26 total). Identified `next-auth`/`@auth/core` critical advisories (fail-open auth check, email homoglyph bypass) as highest priority — fixable by a non-breaking bump to `next-auth@5.0.0-beta.32`. `next` bump to `16.2.11` also non-breaking. `swiper`'s critical advisory is moot since the package isn't actually imported anywhere (dead TailAdmin leftover) — recommend removing it instead of forcing a breaking major bump. **Not yet applied** — pending go-ahead to run the upgrades and re-verify (typecheck/lint/smoke test).

### 2026-08-11 (cont'd)
- Reviewed pre-existing uncommitted changes to `AppHeader.tsx`/`AppSidebar.tsx` (rebrand to Tenovo logo, removal of TailAdmin demo nav items and the header search bar). Verified with `tsc --noEmit` and `eslint` — clean after removing 7 now-unused icon/`SidebarWidget` imports left behind in `AppSidebar.tsx`. Committed and pushed (`a97fa73` rebrand, `bc07482` docs) to `origin/master`.
- Committed and pushed the `CLAUDE.md`/`PRD.md`/`PROGRESS.md` docs added earlier this session.

### 2026-08-11
- Reverse-engineered the codebase and authored the initial documentation set: `CLAUDE.md` (architecture/dev-command reference for Claude Code), `PRD.md` (feature-by-feature spec reconstructed from the actual API routes/UI, including gaps vs the README's claims), and this `PROGRESS.md`.
- Notable findings captured in PRD.md §7: Projects API only supports Create+List (README calls it "CRUD"), `GET /api/jobs` looks unused/duplicated with the server-rendered `Jobs.tsx`, audit-log action strings aren't consistently dot.case, team "invite" requires the invitee to already have an account.
- No code changes made this session — documentation only.
