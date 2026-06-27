# Git Rules

## Commits

- Only commit when user explicitly asks
- Message focuses on **why**, 1–2 sentences
- Never commit secrets, `.env`, or generated reports

## Branches

- Feature branches off `main`
- PR required for merge to `main`

## Hooks

- **Pre-commit:** Prettier via lint-staged
- **Pre-push:** Coverage gate (`scripts/git-hooks/pre-push`)

## Safety

- No force-push to `main`
- No `--no-verify` unless user explicitly requests
- No amending pushed commits unless user requests

## PR requirements

See `.agent/checklists/pr.md` and `.github/workflows/quality-gate.yml`
