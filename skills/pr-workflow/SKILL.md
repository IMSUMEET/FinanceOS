---
name: pr-workflow
description: >-
  How to commit and ship changes in FinanceOS — required local checks,
  commit-message style, and the PR template. Use when the user asks you to
  commit, push, or open a pull request, or before any change is considered
  done.
---

# PR Workflow

## Before every commit

Run the frontend gate from `frontend/web`:

```bash
cd frontend/web
npm run lint
npm run build
```

Both must pass. If you only touched `backend/`, also run the backend tests:

```bash
cd backend
pytest -q
```

If you only touched docs / skills, you can skip the build but still run lint if the change touched any code config.

## Commit-message style

Use the conventional-commits prefix that best fits:

| Prefix | When |
| --- | --- |
| `feat:` | New user-visible feature |
| `fix:` | Bug fix |
| `chore:` | Tooling, config, deps |
| `refactor:` | No behaviour change |
| `docs:` | `docs/`, `skills/`, READMEs |
| `style:` | Formatting, no logic change |
| `test:` | Tests only |
| `perf:` | Performance change |

Subject is imperative, ≤ 72 chars, no trailing period:

```
feat: gate AI coach behind a completed profile
```

Use a body when the *why* isn't obvious from the diff. Reference issues with `Closes #123` in the footer.

## Branching

- `main` is protected. Never push directly to it.
- Branch names: `<author>/<short-slug>` (e.g. `akshay/profile-drawer-portal`).
- Rebase on `main` before opening the PR if it's been more than a day or two.

## Opening the PR

Use the GitHub CLI from the repo root once `gh` is installed and authenticated:

```bash
gh pr create --base main --title "<conventional title>" --body "$(cat <<'EOF'
## Summary

- one bullet per meaningful change

## Screenshots

(before / after if visual)

## Test plan

- [ ] `cd frontend/web && npm run lint`
- [ ] `cd frontend/web && npm run build`
- [ ] manual: <flows you exercised>

## Backend impact

(none / new endpoint registered in api/endpoints.js / schema.json updated)
EOF
)"
```

## Things to never do

- Never push to `main` (protected).
- Never `git push --force` to a shared branch.
- Never disable hooks (`--no-verify`) or skip lint to "just get it in".
- Never commit `.env` or anything under `frontend/web/.env*` other than `.env.example`.
- Never update `git config` from a script — it's per-developer.

## Things to always do

- Update [`docs/CHANGELOG.md`](../../docs/CHANGELOG.md) for any user-visible change.
- If a contract changed, update both [`src/types/schema.json`](../../frontend/web/src/types/schema.json) and [`src/types/README.md`](../../frontend/web/src/types/README.md).
- If a convention changed, update or add the matching `skills/<topic>/SKILL.md`.
- Add a screenshot for visual changes.
