# Testing Strategy

FinanceOS uses a **layered testing pyramid** designed for AI agents and human contributors.

## Layers

| Layer       | Tool         | Location                                    | Purpose                                |
| ----------- | ------------ | ------------------------------------------- | -------------------------------------- |
| Unit        | Vitest       | `backend/tests/`, `frontend/web/src/utils/` | Pure logic, fast feedback              |
| Golden      | Vitest       | `tests/golden/`                             | Deterministic I/O snapshots            |
| Contract    | Vitest + AJV | `tests/contracts/`                          | Schema + API envelope validation       |
| Integration | Vitest       | `tests/integration/`                        | Multi-step API pipelines               |
| Eval        | Vitest       | `tests/evals/`                              | AI output validation                   |
| E2E         | Playwright   | `tests/e2e/`                                | Browser + HTTP against running servers |

## Quality gate order

See `.agent/rules/build-quality-gate.md`.

## Adding tests

### Unit test (backend)

```typescript
// backend/tests/myFeature.test.ts
import { describe, it, expect } from "vitest";
```

### Unit test (frontend)

```javascript
// frontend/web/src/utils/myUtil.test.js
import { describe, it, expect } from "vitest";
```

### Golden test

1. Add fixture to `tests/fixtures/`
2. Add expected output to `tests/golden/expected/`
3. Or run `UPDATE_GOLDEN=1 npm run test:golden` to regenerate

### Contract test

Validate against `schema.json` `$defs` or live API envelopes in `tests/contracts/`.

### E2E test

Add spec to `tests/e2e/` — use `tests/e2e/helpers/ui.ts` for UI setup.

## Regression rule

**Never fix a bug without adding a test.**

Every production incident gets a permanent test in the appropriate layer.

## Debugging failures

| Failure  | Action                                                               |
| -------- | -------------------------------------------------------------------- |
| Unit     | Read stack trace; run single file with `npx vitest run path/to/test` |
| Golden   | Diff expected vs actual; update fixture or fix regression            |
| Contract | Check `schema.json` vs response shape                                |
| E2E      | `npx playwright test --debug`; check `playwright-report/`            |
| Coverage | Open `coverage/index.html`; add tests for red lines                  |

## Fixtures

Shared fixtures: `tests/fixtures/`

- `sample-chase.csv` — Chase bank export format
- `sample-simple.csv` — minimal 3-column CSV
- `coach-summary.json` — coach API input

## CI vs local

- CI runs full gate including Playwright with `CI=1` (fresh servers)
- Local dev can reuse running servers (`reuseExistingServer`)

## Related

- [Coverage](./coverage.md)
- [Architecture](./architecture.md)
- `.agent/rules/testing.md`
