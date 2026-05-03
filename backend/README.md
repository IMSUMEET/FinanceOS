# FinanceOS API (Hono, AWS Lambda)

Minimal API for the first Lambda deploy: **GET `/health`** only. No database, S3, or auth in this build.

## Layout

```text
backend/
  src/
    index.ts    # Hono app + /health
    lambda.ts   # AWS Lambda entry (hono/aws-lambda)
    local.ts    # Local dev server
  dist/
    lambda.js   # Created by `npm run build` (CJS bundle for Lambda)
  package.json
  tsconfig.json
```

## Prereqs

- Node.js 22+
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- AWS credentials configured (`aws configure` or environment)

## Install and verify

```bash
cd backend
npm install
npm run typecheck
npm run build
```

This writes **`dist/lambda.js`**, which the SAM template expects (`CodeUri: ../backend/dist`, `Handler: lambda.handler`).

## Local dev

```bash
npm run dev
```

Open **http://localhost:3001/health** — expected:

```json
{
  "ok": true,
  "service": "finance-os-api"
}
```

## Deploy (SAM)

**1.** Build the Lambda bundle (from `backend`):

```bash
npm run build
```

**2.** From **`infra`**, build and deploy the stack:

```bash
cd ../infra
sam build -t template.yaml
sam deploy --guided
```

- Point **CodeUri** is `../backend/dist` (relative to the template’s directory); `sam build` zips that folder.
- On success, note **Outputs** → **ApiUrl** (or use `aws cloudformation describe-stacks`).

## Test the deployed API

Replace the URL with your **ApiUrl** output:

```bash
curl https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/health
```

Expected:

```json
{
  "ok": true,
  "service": "finance-os-api"
}
```

## Frontend (Vercel)

Set the Vite base URL to your API (see `frontend/web/.env.example`):

```bash
VITE_API_BASE_URL=https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com
VITE_USE_MOCK=false
```

CORS: the SAM template allows `http://localhost:5173`, `http://localhost:3000`, and `*` (covers all Vercel deployment URLs; tighten for production if needed—API Gateway does not support `https://*.vercel.app` as a pattern in CORS).

## Older Python backend

A prior FastAPI version may live under `../../archive/python-backend` if you still have the archive; this tree is the supported Lambda path.
