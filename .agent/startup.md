# Agent Startup — FinanceOS

Read this file at the **start of every agent session** before making changes.

## 1. Orient

- Monorepo: `backend/` (Hono Lambda API), `frontend/web/` (Vite React), `tests/` (cross-cutting), `Arsenal/` (shared packages at repo sibling)
- Contract: `frontend/web/src/types/schema.json` + `examples.json`
- Quality gate: `.agent/rules/build-quality-gate.md`

## 2. Before coding

1. Read `.agent/rules/common.md` and the rule file matching your task type
2. Check `.agent/checklists/` for feature / bugfix / refactor
3. Run `npm run typecheck` if touching backend TypeScript
4. Identify which test layer your change needs (see `.agent/rules/testing.md`)

## 3. Commands

```bash
npm test                  # unit tests (backend + frontend)
npm run test:cross        # contracts, golden, evals, integration
npm run test:e2e          # Playwright
npm run test:quality      # full gate (local, slow)
npm run quality:report    # HTML dashboard
```

## 4. Non-negotiables

- **Never fix a bug without a regression test**
- **Never skip the quality gate before claiming done**
- **Never commit** `coverage/`, `quality-reports/`, `playwright-report/`
- Match existing code style; reuse Arsenal packages for shared logic
- Minimize scope — only change what the task requires

## 5. Where things live

| Concern             | Location                           |
| ------------------- | ---------------------------------- |
| Agent rules         | `.agent/rules/`                    |
| Checklists          | `.agent/checklists/`               |
| Testing strategy    | `docs/quality/testing-strategy.md` |
| Architecture        | `docs/quality/architecture.md`     |
| Backend unit tests  | `backend/tests/`                   |
| Frontend unit tests | `frontend/web/src/utils/*.test.js` |
| E2E                 | `tests/e2e/`                       |
| Fixtures            | `tests/fixtures/`                  |
| Golden expected     | `tests/golden/expected/`           |

## 6. Mock vs live

- Frontend default: `VITE_USE_MOCK=true` — no backend required for UI dev
- E2E UI tests run in mock mode
- Live OpenRouter tests tagged `@live` — never run in CI by default
