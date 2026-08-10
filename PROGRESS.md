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
- Dependency vulnerabilities: triaged and fully cleared 2026-08-11 — `npm audit` was 26, now **0**. Fixed: `next-auth`/`@auth/core`/`@auth/prisma-adapter` critical Auth.js advisories and `next` 16.2.4→16.2.11 (`957cd27`); transitive dev/build deps (`postcss`, `svgo`, `js-yaml`, `brace-expansion`, `axios`, `form-data`, `prisma` 7.8.0→7.9.1, `hono`/`@hono/node-server`) via `npm audit fix` (`b0aac2f`); `swiper` removed outright rather than force-upgraded, since it wasn't imported by any component — only its CSS class names were targeted in `globals.css` for styling, no actual `@import` of the package (`be03a1d`). GitHub Dependabot's UI may lag behind and still show the old count until it re-scans.
- `swiper` and `swiper`-derived carousel CSS class rules in `src/app/globals.css` are now dead styling (harmless, targets elements that don't exist) — left in place since removing template CSS wasn't asked for; worth a cleanup pass if `globals.css` ever gets tidied up.
- GitHub repo metadata (`jsoftsol/Tenovo`) is set as of 2026-08-11: About panel description, homepage `https://tenovo.jsoftsol.com`, and 20 topics (nextjs, react, typescript, prisma, postgresql, redis, bullmq, tailwindcss, socketio, authjs, rbac, multi-tenant, saas, saas-boilerplate, audit-log, background-jobs, realtime, docker, nginx, portfolio-project) — applied via `gh repo edit`, not stored in the codebase.
- `LICENSE` copyright line now reads `Copyright (c) 2026 Ammad Sarfraz` — previously the unmodified TailAdmin template notice (`Copyright (c) 2023 TailAdmin`), replaced outright rather than kept alongside a second line (`35f9a26`).

## Session Log

### 2026-08-11 (cont'd 8)
- Verified the GitHub About panel/topics/license went live as expected via `gh repo view` — description, homepage, MIT license, and all 20 topics confirmed on `jsoftsol/Tenovo`.
- User asked about keeping the `LICENSE` copyright year current "going forward" (static year vs. `-present` range vs. CI automation) — after discussion, decided no change needed; year stays a plain `2026`.

### 2026-08-11 (cont'd 7)
- User asked for the GitHub repo's right-side "About" sidebar to be filled in — initially misread this as a request to build an in-app project detail page with an About/keywords panel; ran a full brainstorming pass (spec written to `docs/superpowers/specs/2026-08-11-project-about-keywords-design.md`, committed) before the user corrected the misunderstanding. Removed that spec afterward (`5234cfb`) since it didn't reflect the actual ask.
- Drafted and applied the real ask via `gh repo edit`: description, homepage (`https://tenovo.jsoftsol.com`), and 20 topics on `jsoftsol/Tenovo`. Verified with `gh repo view --json description,homepageUrl,repositoryTopics`. This is GitHub-side repo config, not a codebase change — no commit for it.
- Fixed `LICENSE`: the copyright line was still the unmodified TailAdmin template notice (`Copyright (c) 2023 TailAdmin`) despite Tenovo substantially incorporating that MIT-licensed template UI. Flagged the MIT attribution nuance (outright replace vs. add a second copyright line for the original work) — user chose outright replace with `Copyright (c) 2026 Ammad Sarfraz`. Committed (`35f9a26`) and pushed to `origin/master`.

### 2026-08-11 (cont'd 6)
- Removed the `swiper` npm package (`npm uninstall swiper`) — confirmed via `git diff` that only `package.json`/`package-lock.json` changed, no source edits needed since nothing imports it. Verified with `tsc --noEmit`, `eslint`, and `next build` — all clean, `npm audit` now reports 0 vulnerabilities. Committed and pushed as `be03a1d`. This closes out the dependency-vulnerability triage started earlier in the session.

### 2026-08-11 (cont'd 5)
- Ran `npm audit fix` for the remaining non-breaking advisories: 48 packages added/60 changed/6 removed, `package-lock.json` only (all within existing `package.json` semver ranges — nothing needed bumping there). Notably pulled `prisma`/`@prisma/client`/`@prisma/adapter-pg` up to `7.9.1`; re-ran `npx prisma generate` afterward since the generated client output (`src/generated/prisma`, gitignored) needs to match. Verified with `tsc --noEmit`, `eslint`, and `next build` — all clean. Committed and pushed as `b0aac2f`. Only `swiper`'s critical advisory remains, unresolved on purpose (see Current State).

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
