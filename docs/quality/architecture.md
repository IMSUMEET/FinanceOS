# Quality Architecture

## Engineering system

FinanceOS is designed as a **self-validating workspace**:

```
Code change
    ↓
Quality Gate (CI + local)
    ↓
Reports (JSON, HTML, PR comment)
    ↓
Artifacts (coverage, junit, lcov, dashboard)
```

## Components

| Component           | Path                                 | Role                            |
| ------------------- | ------------------------------------ | ------------------------------- |
| Quality gate script | `scripts/quality-gate.mjs`           | Orchestrates all checks locally |
| Report generator    | `scripts/generate-quality-report.ts` | Dashboard + PR markdown         |
| Agent manual        | `.agent/`                            | Guides AI agents                |
| Test suites         | `tests/`                             | Cross-cutting validation        |
| Workflows           | `.github/workflows/`                 | CI enforcement                  |

## Application architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  React SPA  │────▶│  Hono API    │────▶│ OpenRouter  │
│ frontend/web│     │ backend/     │     │  (optional) │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │
       └──── Arsenal ───────┘
         shared packages
```

## API surface (implemented)

| Route                         | Lambda | Tests                          |
| ----------------------------- | ------ | ------------------------------ |
| GET `/health`                 | 1      | unit, contract, e2e            |
| POST `/api/analyze`           | 1      | unit, golden, integration, e2e |
| POST `/api/coach/suggestions` | 1      | unit, contract, eval, e2e      |
| POST `/api/ai-analyze`        | 2      | unit, integration, e2e         |

## Contract flow

1. `schema.json` defines DTOs
2. `examples.json` provides valid instances
3. `tests/contracts/` validates examples + live envelopes
4. Frontend `types/README.md` documents consumer expectations

## Regression model

```
Bug report → Reproduce → Regression test → Fix → Gate passes
```

Tests are permanent — never delete without replacing coverage.

## Related docs

- `docs/architecture/overview.md` — product architecture
- `docs/adr/0002-schema-json-as-api-contract.md`
- `.agent/rules/architecture.md`
