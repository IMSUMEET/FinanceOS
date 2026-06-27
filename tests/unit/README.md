# Unit Tests

FinanceOS unit tests are split by package for speed and ownership clarity.

## Backend

Location: `backend/tests/`

```bash
npm --prefix backend test
npm --prefix backend run test:coverage
```

Coverage scope: `csvAnalyze.ts`, `categorize.ts`, `openrouter.ts` (90% threshold).

## Frontend

Location: co-located `frontend/web/src/utils/*.test.js`

```bash
npm --prefix frontend/web test
npm --prefix frontend/web run test:coverage
```

Coverage scope: formatters, categorization, analysis summaries, mortgage/house-sale calculators, personality.

## Arsenal (shared library)

Location: `../Arsenal/packages/*/src/**/*.test.ts`

Run from Arsenal root: `pnpm test` or per-package `npx vitest run`.

## When to add unit tests

- Pure functions (formatters, filters, calculations)
- Validation helpers
- Edge cases and branch coverage
- Regression tests for fixed bugs

See `.agent/rules/testing.md`.
