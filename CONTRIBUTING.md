# Contributing to FinanceOS

Read this file when joining the project or starting work after pulling `main`. For topic-specific conventions, see [`skills/`](skills/README.md).

## First-time setup (once per machine)

Install dependencies before editing code:

```bash
git pull origin main
npm install                    # repo root: Prettier, Husky, lint-staged
cd frontend/web && npm install
cd ../../backend && npm install
```

Without root `npm install`, Husky pre-commit formatting will not run.

Install the recommended VS Code extensions when prompted: **Prettier**, **ESLint**, and **EditorConfig** (see [`.vscode/extensions.json`](.vscode/extensions.json)). Format-on-save is configured in [`.vscode/settings.json`](.vscode/settings.json).

## Before opening a PR or pushing

From the **repo root**:

```bash
npm run ci
```

This runs Prettier check, frontend ESLint + build, and backend TypeScript typecheck — the same gates as GitHub Actions (`CI / check`).

Individual steps:

```bash
npm run format        # write formatted files
npm run format:check  # check only (CI uses this)
npm run lint          # frontend ESLint
npm run typecheck     # backend tsc --noEmit
```

On commit, Husky runs `lint-staged`, which auto-formats staged files with Prettier.

## Git and GitHub rules (enforced)

`main` is protected by the **Protect main** ruleset:

- **No direct pushes to `main`** — use a PR
- **`CI / check` must pass** before merge
- **No force push** or branch deletion on `main`

Typical workflow:

1. Create a feature branch from `main`
2. Make changes; Husky formats on commit (or run `npm run format`)
3. Run `npm run ci` locally before push
4. Open a PR to `main`; wait for CI to pass before merge

Details: [`.github/BRANCH_PROTECTION.md`](.github/BRANCH_PROTECTION.md)

## Skills by topic

| Topic | Guide |
| ----- | ----- |
| Local setup, formatting, CI, branch rules | [`skills/code-standards/SKILL.md`](skills/code-standards/SKILL.md) |
| Commit, push, open PR | [`skills/pr-workflow/SKILL.md`](skills/pr-workflow/SKILL.md) |
| React / Tailwind frontend | [`skills/frontend-conventions/SKILL.md`](skills/frontend-conventions/SKILL.md) |
| API contract / mock flag | [`skills/backend-contract/SKILL.md`](skills/backend-contract/SKILL.md) |
| UI component choice | [`skills/ui-components/SKILL.md`](skills/ui-components/SKILL.md) |
| Transactions, filters, charts | [`skills/spend-analyzer-flow/SKILL.md`](skills/spend-analyzer-flow/SKILL.md) |
| Profile gating | [`skills/profile-gating/SKILL.md`](skills/profile-gating/SKILL.md) |

## Repo layout

| Path | Purpose |
| ---- | ------- |
| `frontend/web/` | React + Vite app |
| `backend/` | Hono API (Lambda + local dev) |
| `package.json` (root) | Prettier, Husky, `npm run ci` |
| `.github/workflows/ci.yml` | PR checks |
| `skills/` | Project conventions and workflow guides |

## Do not

- Push directly to `main`
- Skip hooks (`git commit --no-verify`) to bypass formatting or lint
- Commit `.env` or secrets (only `.env.example` is tracked)
- Add vendor or tool branding to commit messages or PR descriptions
