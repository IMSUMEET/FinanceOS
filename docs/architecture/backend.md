# Backend Architecture

The backend lives in [`backend/`](../../backend) and is a FastAPI app served against SQLite (file at `backend/spend.db`). It is organised feature-first.

```
backend/
├── Dockerfile
├── requirements.txt
├── spend.db                    # SQLite, auto-created on startup
├── app/
│   ├── main.py                 # FastAPI() + middleware + router includes
│   ├── core/                   # cross-cutting helpers (currently slim)
│   ├── shared/
│   │   ├── config.py           # CORS_ORIGINS, env config
│   │   ├── database.py         # init_db, session helpers
│   │   └── routers/
│   │       └── health.py
│   ├── features/
│   │   ├── __init__.py
│   │   └── spend_analyzer/
│   │       ├── routers/
│   │       │   ├── transactions.py
│   │       │   └── analytics.py
│   │       ├── services/
│   │       └── modules/
│   ├── routers/                # legacy folder, prefer features/<x>/routers
│   └── services/               # legacy folder, prefer features/<x>/services
└── tests/
```

## App entry

[`app/main.py`](../../backend/app/main.py):

- Creates the FastAPI app
- Installs CORS middleware from `app.shared.config.CORS_ORIGINS`
- On startup: `init_db()` then `seed_dummy_if_empty()` so the DB is non-empty for local dev
- Includes routers: `health`, `transactions`, `analytics`

## Feature-first layout

New work belongs under `app/features/<feature>/`:

```
features/<feature>/
├── routers/      # FastAPI routers, mounted from main.py
├── services/     # business logic, no FastAPI imports
└── modules/      # ORM models / schemas / pure helpers scoped to the feature
```

The legacy top-level `app/routers/` and `app/services/` folders exist for backwards compatibility — do not add to them.

## Endpoint plan (frontend ↔ backend mapping)

The frontend already publishes the URL surface in [`frontend/web/src/api/endpoints.js`](../../frontend/web/src/api/endpoints.js). The backend should mount routes that satisfy the same paths and the shapes in [`frontend/web/src/types/schema.json`](../../frontend/web/src/types/schema.json).

| Frontend `ENDPOINTS.*` | Backend feature | Status |
| --- | --- | --- |
| `transactions.list`, `transactions.create`, `transactions.update`, `transactions.remove` | `features/spend_analyzer/routers/transactions.py` | partial — extend to cover the contract |
| `transactions.importBatch` | `features/spend_analyzer/routers/transactions.py` | TODO |
| `insights.summary`, `insights.movers`, `insights.recurring`, `insights.anomalies` | `features/spend_analyzer/routers/analytics.py` | partial — implement four insight endpoints |
| `notifications.list`, `notifications.markRead` | TODO — new feature `notifications/` | not started |
| `profile.get`, `profile.update` | TODO — new feature `account/` or `profile/` | not started |

## Workflow when adding an endpoint

1. Check / extend [`frontend/web/src/types/schema.json`](../../frontend/web/src/types/schema.json) for the shape.
2. Check that the frontend already references the endpoint in `ENDPOINTS`. If not, add it there first.
3. Create the route in `app/features/<feature>/routers/<file>.py`.
4. Mount it in `app/main.py` via `app.include_router(...)`.
5. Add a Pydantic response model that matches the schema; mismatch is a contract bug.
6. Add a test in `backend/tests/`.
7. Update [`frontend/web/src/types/README.md`](../../frontend/web/src/types/README.md) if anything in the contract changed.

## Persistence

Today: SQLite via the helpers in `app/shared/database.py`. The mock provider on the frontend lets us iterate without committing to a schema yet. Once endpoints are real, swapping SQLite for Postgres is a config change inside `app/shared/`.

## Local dev

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Then in `frontend/web/.env.local`:

```
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK=false
```

## Tests

```bash
cd backend
pytest -q
```
