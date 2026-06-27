# Agent Completion — FinanceOS

Run this checklist **before marking any task complete**.

## Validation (required)

Execute in order; all must pass:

```bash
npm run typecheck
npm run lint
npm test
npm run test:cross
npm run test:e2e
npm run build:check
npm run quality:report
```

For large changes, run the full gate:

```bash
npm run test:quality
```

## Documentation

- [ ] Updated relevant docs if behavior changed
- [ ] Added/updated tests per `.agent/rules/testing.md`
- [ ] Regression test added for every bug fix
- [ ] Golden files updated intentionally (`UPDATE_GOLDEN=1 npm run test:golden`) if outputs changed

## PR readiness

- [ ] No secrets or `.env` files staged
- [ ] No generated artifacts staged (`coverage/`, `quality-reports/`)
- [ ] Follows `.agent/checklists/pr.md`
- [ ] Commit message explains **why**, not just what

## Report to user

Summarize:

1. What changed and why
2. Test layers added/updated
3. Quality gate result
4. Any follow-up items (if unavoidable)

Do not claim completion if any validation step failed.
