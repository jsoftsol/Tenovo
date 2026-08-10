# No AI attribution in commits

Do not add "Co-Authored-By: Claude..." (or any AI-attribution trailer) to git commit messages in this repo — this overrides the default commit-message convention. If a commit is made and it slips in anyway, offer to strip it.

**Why:** explicit instruction (2026-08-11): "i dont want coauthor and claude in git commits not in previous nor in future, remove any reference." Acted on retroactively too — rewrote the 5 commits from that session that had the trailer (`f7d9c65`, `c3540e1`→`bc07482`, `234f7aa`→`7b8ac74`, `836bbee`→`7f3bc74`, `df7189a`→`a575278`) via `git filter-branch --msg-filter`, scoped to `c85015a..master` only, then `git push --force-with-lease origin master`. Two older commits (`05fab45`, `a512666`) also had a `Co-authored-by` trailer but attributed to GitHub Copilot, not Claude — left untouched since the request was Claude-specific.

**How to apply:** plain commit messages, no trailer, for every future commit in this repo. If asked to fix history again, check `deploy` branch's relationship to `master` first (`git merge-base`/`git rev-list --left-right --count`) before rewriting — last time the affected commits happened to all be ahead of `deploy`'s tip, so only `master` needed a force-push, but that won't always be true.
