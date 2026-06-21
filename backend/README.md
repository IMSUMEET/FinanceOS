# FinanceOS API (Hono, AWS Lambda)

Stateless API for Lambda: **GET `/`**, **GET `/health`**, **POST `/api/analyze`** (multipart CSV, in-memory only). No database, S3, or auth in this build.

## Layout

```text
backend/
  src/
    index.ts       # Hono routes: /, /health, POST /api/analyze
    categorize.ts  # Merchant rules (aligned with frontend)
    csvAnalyze.ts    # CSV parse + summary (Papa Parse, in-memory)
    lambda.ts        # AWS Lambda entry (hono/aws-lambda)
    local.ts    # Local dev server
  dist/
    lambda.js   # Optional: `npm run build` (CJS); CDK bundles from `src/` via NodejsFunction
  infra/
    bin/app.js           # CDK app entry
    lib/backend-stack.js # Stack: Lambda + HTTP API
    package.json
    cdk.json
  package.json
  tsconfig.json
  README-deploy.md       # Step-by-step AWS deploy
```

## Prereqs

- Node.js 20+
- [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html) (installed via `backend/infra` `npm install`)
- AWS credentials configured (`aws configure` or environment)

## Install and verify

```bash
cd backend
npm install
npm run typecheck
```

Optional manual bundle (not required for CDK deploy):

```bash
npm run build
```

## Local dev

```bash
npm run dev
```

Open **http://localhost:3001/** and **http://localhost:3001/health**.

Run the web app with mock mode off so uploads hit this server:

```bash
# frontend/web/.env.local
VITE_API_BASE_URL=http://localhost:3001
VITE_USE_MOCK=false
```

Then `cd frontend/web && npm run dev` (http://localhost:5173). CORS allows the Vite dev origin.

## Deploy (AWS CDK)

See **[README-deploy.md](./README-deploy.md)** for full steps (`cd backend/infra`, `npm install`, `cdk bootstrap`, `cdk deploy`, Vercel env).

## Test the deployed API

Replace the URL with the **ApiUrl** output from `cdk deploy`:

```bash
curl https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/health
```

Expected:

```json
{
  "status": "ok"
}
```

## Frontend (Vercel)

Set the Vite base URL to your API (see `frontend/web/.env.example`):

```bash
VITE_API_BASE_URL=https://YOUR_FILE_PROCESSING_API.execute-api.YOUR_REGION.amazonaws.com
VITE_AI_ANALYZER_URL=https://YOUR_AI_ANALYZER_API.execute-api.YOUR_REGION.amazonaws.com
VITE_USE_MOCK=false
```

- **Lambda 1** (`VITE_API_BASE_URL`): local CSV analyze + coach suggestions.
- **Lambda 2** (`VITE_AI_ANALYZER_URL`): AI analysis button only (`POST /` on the dedicated stack).

CORS: the CDK stack allows `http://localhost:5173`, `http://localhost:3000`, and `*` (covers Vercel preview URLs; tighten for production if needed).

## Older Python backend

A prior FastAPI version may live under `../../archive/python-backend` if you still have the archive; this tree is the supported Lambda path.
