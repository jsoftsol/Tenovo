# Doc workflow

For the Tenovo project, maintain context in repo-committed files rather than relying on re-exploring the codebase or on ad-hoc conversational memory: `CLAUDE.md` (architecture/commands), `PRD.md` (feature spec + known gaps), `PROGRESS.md` (session log, append-only, plus an in-place "Current State" summary). `CLAUDE.md` imports the other two via `@PRD.md` / `@PROGRESS.md` so they load automatically every session.

**Why:** explicit ask — "create prd claude md and memories files that will be updated every time we save progress and will be loaded automatically for every session... this way we will keep context short and will always have all the required information." The goal is to avoid re-reverse-engineering the codebase each session. Later reinforced (2026-08-11): everything must live in the repo, nothing saved globally — see [project-overview.md](project-overview.md).

**How to apply:**
- When the user says "save progress" / "checkpoint" (in this project), update `PROGRESS.md`: rewrite the "Current State" section in place, prepend a new dated entry to the session log. Don't log trivial one-line fixes.
- When a code change makes `PRD.md`'s description of a feature stale (new endpoint, behavior change, a listed gap getting fixed), update `PRD.md` itself, not just the log.
- New feedback/decisions/preferences worth remembering go straight into `PROGRESS.md` (or a new file under `docs/memory/` for standalone standing rules) — never into the global auto-memory system for this project.
