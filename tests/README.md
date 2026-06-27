# FinanceOS Test Suite

Centralized cross-cutting tests live here. Package-specific unit tests remain co-located for fast feedback.

## Layout

| Directory            | Purpose                                                                | Runner               |
| -------------------- | ---------------------------------------------------------------------- | -------------------- |
| `tests/unit/`        | Index — points to `backend/tests/` and `frontend/web/src/**/*.test.js` | Vitest (per package) |
| `tests/integration/` | End-to-end API pipelines via Hono `app.request()`                      | Root Vitest          |
| `tests/contracts/`   | JSON Schema + live response envelope validation                        | Root Vitest          |
| `tests/golden/`      | Deterministic output snapshots (CSV → analyze, report data)            | Root Vitest          |
| `tests/evals/`       | AI output validation (hallucination, schema, risk score)               | Root Vitest          |
| `tests/e2e/`         | Playwright browser + API tests                                         | Playwright           |
| `tests/fixtures/`    | Shared CSV/JSON fixtures                                               | —                    |

## Commands

```bash
npm run test                 # backend + frontend unit tests
npm run test:cross           # contracts + golden + evals + integration
npm run test:e2e             # Playwright (api-mock + ui)
npm run test:quality         # full quality gate (local)
npm run quality:report       # HTML dashboard + JSON summary
```

## Update golden files

```bash
UPDATE_GOLDEN=1 npm run test:golden
```

Commit updated files under `tests/golden/expected/` when outputs change intentionally.

## Regression rule

Every bug fix **must** add a test in the most appropriate layer:

1. Unit (pure logic)
2. Golden (deterministic I/O)
3. Contract (schema/envelope)
4. Integration (multi-step API)
5. E2E (user-visible behavior)

See [docs/quality/testing-strategy.md](../docs/quality/testing-strategy.md).
