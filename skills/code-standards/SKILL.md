---
name: code-standards
description: >-
  FinanceOS local dev setup, Prettier formatting, Husky pre-commit hooks,
  npm run ci, and main branch protection rules. Use when starting work in
  this repo, after git clone or git pull, when formatting or lint fails, or
  when the user asks how to enforce code standards.
---

# Code standards

FinanceOS uses shared formatting and CI so every contributor produces consistent code.

## One-time setup per machine

Run after clone or when pulling `main` for the first time after standards were merged:

```bash
git pull origin main
npm install                    # repo root — required for Husky + Prettier
cd frontend/web && npm install
cd ../../backend && npm install
```

Root `npm install` runs the `prepare` script, which installs Husky. The pre-commit hook at [`.husky/pre-commit`](../../.husky/pre-commit) runs `lint-staged`, which formats staged files with Prettier.

Editor setup (VS Code):

- Extensions: Prettier, ESLint, EditorConfig ([`.vscode/extensions.json`](../../.vscode/extensions.json))
- Format on save: enabled in [`.vscode/settings.json`](../../.vscode/settings.json)

## Formatting config

| File                                                                   | Role                                                   |
| ---------------------------------------------------------------------- | ------------------------------------------------------ |
| [`.prettierrc`](../../.prettierrc)                                     | Prettier options (semicolons, double quotes, 100 cols) |
| [`.prettierignore`](../../.prettierignore)                             | Ignores `node_modules`, `dist`, `archive`, lockfiles   |
| [`.editorconfig`](../../.editorconfig)                                 | Basic editor defaults (2-space indent, LF, UTF-8)      |
| [`frontend/web/eslint.config.js`](../../frontend/web/eslint.config.js) | ESLint + `eslint-config-prettier` (no rule conflicts)  |

## Commands (always from repo root unless noted)

```bash
npm run format        # Prettier --write on the whole repo
npm run format:check  # Prettier --check (CI gate)
npm run lint          # frontend/web ESLint
npm run typecheck     # backend tsc --noEmit
npm run ci            # format:check + lint + frontend build + typecheck
```

Run `npm run ci` before push or opening a PR. Fix failures locally — do not disable hooks or skip checks.

## What runs automatically

| Trigger         | Action                                                                      |
| --------------- | --------------------------------------------------------------------------- |
| `git commit`    | Husky → lint-staged → Prettier on staged files                              |
| VS Code save    | Prettier format (if extension installed)                                    |
| PR to `main`    | GitHub Actions [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) |
| Merge to `main` | Blocked until `CI / check` passes                                           |

## Branch protection (GitHub)

The **Protect main** ruleset is active on `Oblivion-Labs-Dev/FinanceOS`:

- Pull requests required (no direct pushes to `main`)
- Required status check: `CI / check`
- Force push and branch deletion blocked on `main`

Contributors should:

1. Branch from `main` (e.g. `feat/short-description`)
2. Never push to `main` directly
3. Open a PR and ensure CI is green

Ruleset definition: [`.github/rulesets/main-branch.json`](../../.github/rulesets/main-branch.json)

Repo admins can re-apply or update rules with:

```bash
./scripts/apply-github-rulesets.sh
```

Human-readable notes: [`.github/BRANCH_PROTECTION.md`](../../.github/BRANCH_PROTECTION.md)

## Checklist (every session)

1. Confirm root `node_modules` exists (if not, run setup above)
2. Work on a feature branch, not `main`
3. Before commit: staged files will auto-format via Husky
4. Before push/PR: `npm run ci` from repo root
5. Open PR to `main`; do not merge until `CI / check` is green

## Related guides

- Commits and PRs: [`skills/pr-workflow/SKILL.md`](../pr-workflow/SKILL.md)
- Entry point: [`CONTRIBUTING.md`](../../CONTRIBUTING.md)
