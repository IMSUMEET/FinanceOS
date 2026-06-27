# Coverage

## Threshold

**90%** minimum on all metrics:

- Statements
- Branches
- Functions
- Lines

Configured in `scripts/coverage-threshold.mjs`.

## Scoped files

### Backend (`backend/vitest.config.ts`)

Included: `csvAnalyze.ts`, `categorize.ts`, `openrouter.ts`

Excluded: `index.ts`, `lambda.ts`, `local.ts`, `aiAnalyzer.ts`

### Frontend (`frontend/web/vitest.config.js`)

Included: formatters, categories, categorize, analysisSummary, mortgage/house-sale calculators, personality

Excluded: `csvParser.js` (tested separately), `*.test.js`

## Reports

After `npm run test:coverage`:

| Format       | Location                                                          |
| ------------ | ----------------------------------------------------------------- |
| HTML         | `backend/coverage/index.html`, `frontend/web/coverage/index.html` |
| JSON summary | `*/coverage/coverage-summary.json`                                |
| lcov         | `*/coverage/lcov.info`                                            |
| junit        | `*/coverage/junit.xml`                                            |

Combined dashboard: `npm run quality:report` → `quality-reports/dashboard.html`

## Changed-files coverage

PR reports include coverage on files changed in the PR. Parsed from lcov + git diff in `scripts/generate-quality-report.ts`.

## Never commit

- `coverage/` directories
- `quality-reports/` (except `history.json` is gitignored too)

## Raising coverage

1. Open HTML report
2. Sort by lowest line coverage
3. Add tests for uncovered branches
4. Re-run `npm run test:coverage`

## CI

Coverage gate runs in `.github/workflows/quality-gate.yml` before build.
