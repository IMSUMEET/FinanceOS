# Build Quality Gate

Every PR must pass the full quality gate. **No exceptions.**

## Pipeline (strict order)

```
TypeScript
  ↓
ESLint
  ↓
Unit Tests
  ↓
Coverage (90% threshold)
  ↓
Contract Tests
  ↓
Golden Tests
  ↓
Integration Tests
  ↓
Playwright (api-mock + ui)
  ↓
AI Evaluation Tests
  ↓
Build
```

Note: AI evals run after Playwright in CI workflow; local `test:quality` script runs evals before Playwright for faster API feedback — CI workflow order matches the canonical list above.

## Local commands

```bash
npm run test:quality     # full gate
npm run quality:report   # generate dashboard after coverage exists
```

## CI

- Workflow: `.github/workflows/quality-gate.yml`
- PR comment: `.github/workflows/pr-report.yml`
- Artifacts: `quality-reports/` (HTML, JSON, lcov, junit)

## Failure policy

If any step fails:

1. Fix the root cause
2. Add regression test if applicable
3. Re-run full gate
4. Never merge with failing checks

## Generated outputs (never commit)

- `coverage/`
- `quality-reports/`
- `playwright-report/`
- `test-results/`

## Thresholds

- Coverage: 90% lines, statements, functions, branches
- See `scripts/coverage-threshold.mjs`
