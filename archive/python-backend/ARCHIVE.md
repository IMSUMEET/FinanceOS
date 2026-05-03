# Archived Python (FastAPI) backend

This folder preserves the pre�Node.js backend (FastAPI, SQLite) that lived under `backend/` before the Lambda-ready Node/TypeScript stack.

- `app/` � FastAPI application
- `requirements.txt` � Python dependencies
- `Dockerfile` � former uvicorn image
- `tests/` � test skeleton

The previous API included:

- `GET /health` � health check
- `GET /transactions` � list with query filters
- `POST /upload` and `POST /transactions/upload` � CSV upload (parsing, categorization, SQLite storage)
- `GET /analytics/*` � category, merchant, monthly breakdowns

The Node backend implements a new import flow (S3 presign, complete) and will grow toward the same data model on PostgreSQL (see `backend/src/db/schema.ts`).
