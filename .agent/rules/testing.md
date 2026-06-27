# Testing Rules

## When tests are required

### Finance logic (calculations, categorization, summaries)

**Required:** Unit · Golden · Edge cases · Regression

Locations: `backend/tests/`, `frontend/web/src/utils/`, `tests/golden/`

### API (routes, Lambda handlers)

**Required:** Contract · Integration · Failure handling · E2E for critical paths

Locations: `tests/contracts/`, `tests/integration/`, `tests/e2e/`, `backend/tests/`

### AI prompts (OpenRouter, coach, insights)

**Required:** Schema validation · Hallucination prevention · Output validation · Evaluation dataset

Locations: `tests/evals/`, `backend/tests/openrouter.test.ts`

Checks:

- No fake merchants/categories not in summary
- Valid JSON shapes
- Risk score 0–100
- Exactly 3 coach suggestions
- Non-negative savings estimates

### UI (pages, navigation, theme)

**Required:** Playwright · Empty states · Loading · Errors · Accessibility basics

Locations: `tests/e2e/ui.spec.ts`

Visual regression: capture screenshots in Playwright when UI changes are significant.

### Shared library (Arsenal)

**Required:** Unit · Integration · Consumer compatibility

Locations: `Arsenal/packages/*/src/**/*.test.ts`, `frontend/web/src/utils/arsenal-deps.test.js`

## Regression protection

```
Every bug fixed  →  Must receive a regression test
Every prod issue →  Permanent regression test
```

Choose the **lowest layer** that catches the bug:

1. Unit (pure function)
2. Golden (deterministic I/O)
3. Contract (schema)
4. Integration (API pipeline)
5. E2E (user-visible)

## Commands

```bash
npm test                      # unit
npm run test:contracts        # schema + envelopes
npm run test:golden           # snapshot outputs
npm run test:integration      # API pipelines
npm run test:evals            # AI validation
npm run test:e2e              # Playwright
UPDATE_GOLDEN=1 npm run test:golden   # refresh golden files
```

## Coverage

- Minimum **90%** on scoped files (see `docs/quality/coverage.md`)
- CI fails if any metric drops below threshold
- Changed-files coverage reported in PR comment

## Adding a new test

1. Pick the layer (see above)
2. Add fixture to `tests/fixtures/` if needed
3. For golden: add expected JSON under `tests/golden/expected/`
4. Run locally, then full gate

See `docs/quality/testing-strategy.md` for full guide.
