# Architecture Rules

## System overview

FinanceOS is a **guest-first** spend analyzer:

- **Frontend:** React 19 + Vite + Tailwind (dark mode via `class`)
- **Backend:** Hono on AWS Lambda (single stack: health, analyze, coach, ai-analyze)
- **Shared:** `@oblivion-labs-dev/arsenal-*` packages (file dependencies)

## Data flow

```
CSV upload → parse (csvAnalyze) → categorize → buildReportData
           → generateStaticInsights → JSON response
```

AI path (Lambda 2): OpenRouter categorization + insights with fallback to static.

## Boundaries

| Layer    | Owns                                      | Does NOT own                               |
| -------- | ----------------------------------------- | ------------------------------------------ |
| Arsenal  | Formatters, hooks, fetch, storage helpers | Pages, routes, FinanceOS-specific insights |
| Backend  | CSV parsing, categorization, API routes   | Frontend UI, mock data                     |
| Frontend | UI, mock services, client-side analysis   | Server persistence (guest mode)            |

## Contract

- Source of truth: `frontend/web/src/types/schema.json`
- ADR: `docs/adr/0002-schema-json-as-api-contract.md`
- Contract tests: `tests/contracts/`

## Adding an API endpoint

1. Update `schema.json` + `examples.json`
2. Implement in `backend/src/`
3. Add contract test + integration test
4. Add E2E if user-facing
5. Update `frontend/web/src/types/README.md`

## Deployment

- Backend CDK: `backend/infra/`
- Frontend: Vercel (`vercel.json`)
- See `backend/README-deploy.md`

Full diagram: `docs/quality/architecture.md`
