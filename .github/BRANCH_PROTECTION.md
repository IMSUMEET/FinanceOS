# Branch protection and code standards

This repo uses shared formatting, lint checks, and GitHub rulesets so everyone contributes the same way.

## Local setup

1. Install dependencies at the repo root (installs Prettier, Husky, and lint-staged):

   ```bash
   npm install
   cd frontend/web && npm install
   cd ../../backend && npm install
   ```

2. Install the recommended VS Code extensions when prompted (Prettier, ESLint, EditorConfig).

3. Format on save is enabled via `.vscode/settings.json`. You can also run:

   ```bash
   npm run format        # write formatted files
   npm run format:check  # CI-style check only
   npm run lint          # frontend ESLint
   npm run typecheck     # backend TypeScript
   npm run ci            # full local CI pipeline
   ```

## Pre-commit hook

After `npm install` at the repo root, Husky runs `lint-staged`, which auto-formats staged files with Prettier before each commit.

## CI

The [CI workflow](workflows/ci.yml) runs on every pull request to `main`:

- Prettier format check
- Frontend ESLint
- Frontend production build
- Backend TypeScript typecheck

## GitHub rulesets (branch protection)

The **Protect main** ruleset is active on `Oblivion-Labs-Dev/FinanceOS`. Verify at: https://github.com/Oblivion-Labs-Dev/FinanceOS/settings/rules

Ruleset definition: [`.github/rulesets/main-branch.json`](rulesets/main-branch.json)

To re-apply or update after editing the JSON (repo admin):

```bash
./scripts/apply-github-rulesets.sh
```

Optional: target a fork or different org repo:

```bash
GITHUB_REPO=your-org/your-fork ./scripts/apply-github-rulesets.sh
```

The **Protect main** ruleset:

- Requires pull requests before merging to `main` (direct pushes blocked)
- **Requires the `check` job to pass before merge** — merge is blocked until GitHub Actions CI succeeds; branch must be up to date with `main`
- Blocks force pushes and branch deletion

Adjust review requirements in `main-branch.json` if you want mandatory approvals (set `required_approving_review_count` to `1` or higher).

## See also

- [`CONTRIBUTING.md`](../CONTRIBUTING.md) — local setup and workflow for all contributors
- [`skills/code-standards/SKILL.md`](../skills/code-standards/SKILL.md) — formatting, CI, and branch rules in detail
