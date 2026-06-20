# Deploy FinanceOS API (AWS CDK)

This CDK app defines **one stack** in `infra/bin/app.js`: the CloudFormation stack is named **`File-Processing`** (AWS does not allow spaces in stack names). The CDK construct id is **`FileProcessing`**. The stack deploys **exactly one Lambda function** (CSV analyze + health + all HTTP routes) behind **one API Gateway HTTP API** (not REST). There is **no VPC**, **no RDS**, **no DynamoDB**, **no S3 bucket resource for the app**, **no NAT Gateway**, **no SQS/SNS/EventBridge/Step Functions**, and **no provisioned concurrency**.

Runtime: **Node.js 20**. Lambda: **512 MB** memory, **15 s** timeout. **CloudWatch Logs** for the API Lambda use a **7-day** retention log group (implemented as an explicit `LogGroup` so CDK does not add a second “log retention” helper Lambda).

> **Bootstrap vs this stack:** `cdk bootstrap` creates an **account-level CDK toolkit** (including an S3 bucket for synthesized assets). That bucket is **not** defined in `backend-stack.js` and is not your application’s data store. This stack template does **not** create app databases or file-storage buckets.

The app code uses **Hono** with `hono/aws-lambda` (see `src/lambda.ts` and `src/index.ts`). If you were expecting Express + `serverless-http`, this project does not use Express; the same CDK pattern applies with a different handler entry.

## Stateless CSV analysis (no database, no S3)

- **POST `/api/analyze`**: `multipart/form-data` with one or more parts named **`files`**. Each part must be a `.csv` file **≤ 5 MB**. The Lambda reads bytes in memory only (no disk, no S3, no RDS). Logs record only high-level metadata (file count, sizes, outcome)—not file contents or transaction rows.
- **GET `/health`**: returns `{ "status": "ok" }`.
- **Frontend**: after a successful analyze response, the browser stores the **JSON result** in `sessionStorage` under `finance_os_latest_analysis` (not raw `File` blobs). Clearing the session or another device does not see that data—**no cross-device sync** and **no saved history** on the server.

### Current limitations

- No saved upload history on the server; re-upload to re-run analysis.
- **5 MB per file** cap (API Gateway / Lambda synchronous payload limits); larger exports need a future async + S3 design.
- Session cache only lasts for this browser tab/session until cleared or storage is wiped.
- `VITE_USE_MOCK=false` and a valid **`VITE_API_BASE_URL`** are required for the Import page to call the live API.

## Cost guardrails (manual)

- **AWS Budgets**: In the AWS console, create a **budget** and optional **alert** (e.g. email when forecasted or actual spend crosses a threshold). CDK does not create budgets for you.
- **Do not add** RDS, NAT Gateway, or other network-heavy resources until you need them—they dominate cost at small scale.
- Log retention is capped at **7 days** in this stack; avoid raising it unless you need longer retention for compliance.

## Prerequisites

1. **Install AWS CLI**  
   Follow: [Installing the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).

2. **Configure credentials**

   ```bash
   aws configure
   ```

   Set access key, secret, default region (e.g. `us-east-1`), and output format. Alternatively use environment variables or profiles your organization supports.

3. **Node.js** (v20+ recommended) for local `npm` and CDK.

### Bootstrap and IAM permissions

**`cdk bootstrap` must be run once per account/region.** It creates the `CDKToolkit` stack (S3 staging bucket, IAM roles for deployments, ECR repo, etc.). That step needs permission to create and manage those IAM roles.

If you use **AWS SSO “PowerUser”** (or similar) and bootstrap fails with `iam:GetRole` / `iam:DeleteRole` **AccessDenied**, either:

- Run **`cdk bootstrap --profile financeos-admin-amsborse-dev`** (or another admin-capable profile) once—needs **IAM + CloudFormation** scope (e.g. AdministratorAccess or an org-approved “CDK bootstrap” role), **or**
- Ask your cloud admin to bootstrap your AWS account in the target region for CDK v2, **or**
- Extend your permission set with the IAM actions CDK bootstrap requires (see [AWS CDK bootstrapping](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html)).

If a failed bootstrap left **`CDKToolkit` in `ROLLBACK_FAILED`**, delete that stack in the **CloudFormation** console (or have an admin clean it up) before retrying bootstrap.

If **`CDKToolkit` is in `DELETE_FAILED`** (common after a partial bootstrap/rollback), `cdk bootstrap` will error with _“can not be updated”_. Fix it before deploying:

1. Open **AWS Console → CloudFormation →** same **region** as your profile (e.g. `us-east-2`) → stack **`CDKToolkit`**.
2. Open the **Events** / **Resources** tab and note which resources failed to delete (often IAM roles named like `cdk-hnb659fds-*`).
3. In **IAM → Roles**, delete those stuck roles **if** CloudFormation no longer owns them (or use **CloudFormation → delete stack → retain resources** / skip failed resources per console guidance).
4. Retry **Delete stack** on `CDKToolkit` until the stack is **gone**.
5. Run **`npx cdk bootstrap --profile financeos-admin-amsborse-dev`** again, then **`npx cdk deploy --profile financeos-admin-amsborse-dev`**.

## Expected CDK resources (this stack only)

After `cdk synth` / `cdk deploy`, the stack should contain:

| Resource                                                                   | Purpose                                                                                                                                                                                         |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **One** `AWS::Lambda::Function`                                            | Runs the bundled Hono app (`src/lambda.ts` → handler `handler`; synthesized asset uses `index.handler`). Handles **GET `/health`**, **POST `/api/analyze`**, and all routes via HTTP API proxy. |
| **One** `AWS::ApiGatewayV2::Api` (+ default stage + routes + integrations) | **HTTP API** (not REST). Routes: **ANY /** and **ANY /{proxy+}** → same Lambda.                                                                                                                 |
| **IAM role** (+ inline policy) for the Lambda                              | `AWSLambdaBasicExecutionRole` so the function can write to CloudWatch Logs.                                                                                                                     |
| **`AWS::Logs::LogGroup`**                                                  | 7-day retention for the API Lambda logs.                                                                                                                                                        |
| **`AWS::Lambda::Permission`** (×2)                                         | Allow API Gateway to invoke the Lambda for `/` and `/{proxy+}`.                                                                                                                                 |
| **`AWS::CDK::Metadata`**                                                   | CDK metadata (optional; small).                                                                                                                                                                 |

**Not deployed by this stack:** RDS, DynamoDB, VPC, NAT Gateway, S3 (app buckets), SQS, SNS, EventBridge rules, Step Functions, extra Lambdas, REST API Gateway, or ElastiCache.

## CDK validation (before deploy)

From `backend/infra` (use `--profile financeos-admin-amsborse-dev` if that is the AWS CLI profile you configured):

```bash
cd backend/infra
npm install
npx cdk synth
npx cdk diff --profile financeos-admin-amsborse-dev
npx cdk deploy --profile financeos-admin-amsborse-dev
```

**Sanity checks after `cdk synth`:**

1. Open `cdk.out/FileProcessing.template.json` and confirm there is **only one** `"Type": "AWS::Lambda::Function"` (the API function).
2. Confirm there is **one** `"Type": "AWS::ApiGatewayV2::Api"` (HTTP API, not `AWS::ApiGateway::RestApi`).
3. Confirm there are **no** `AWS::RDS::*`, `AWS::DynamoDB::*`, `AWS::S3::Bucket` (app), `AWS::EC2::VPC`, `AWS::SQS::*`, `AWS::SNS::*`, `AWS::Events::Rule`, or `AWS::StepFunctions::StateMachine` resources.

**Handler and bundle:** `NodejsFunction` entry is `backend/src/lambda.ts`, which `export const handler = handle(app)`. Esbuild bundles dependencies (`hono`, `papaparse`, …) into a single asset; no separate “copy whole repo” step. **Secrets:** only `NODE_ENV` is set in the stack; do not put API keys in `environment`—use Secrets Manager / SSM when you add them.

**Local API behavior (no Lambda emulator required):** Run `npm run dev` in `backend/` and test **GET** `http://localhost:3001/health` and **POST** `http://localhost:3001/api/analyze` with `multipart/form-data` field **`files`** (same as production).

## Deploy steps

Run **[CDK validation](#cdk-validation-before-deploy)** first. From your machine:

1. Open a terminal and go to the infra app directory:

   ```bash
   cd backend/infra
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. **Bootstrap** the account/region once per environment (CDK toolkit; uses a bootstrap S3 bucket in the account—not an app resource from this stack):

   ```bash
   npx cdk bootstrap --profile financeos-admin-amsborse-dev
   ```

   Or: `npm run cdk:bootstrap` (uses your default CLI profile).

4. **Preview** changes:

   ```bash
   npx cdk diff --profile financeos-admin-amsborse-dev
   ```

5. **Deploy**:

   ```bash
   npx cdk deploy --profile financeos-admin-amsborse-dev
   ```

   Approve IAM capability prompts if shown. When finished, the **Outputs** section lists **ApiUrl** (your HTTP API base URL).

6. **Frontend (Vercel)**  
   In the Vercel project → **Settings → Environment Variables**: set **`VITE_API_BASE_URL`** to the stack output **ApiUrl** (no trailing slash). Set **`VITE_USE_MOCK`** to `false` so the Import page uses **POST `/api/analyze`**. Redeploy the frontend. See `frontend/web/.env.example` for local `.env.local` naming.

## Useful commands

| Script                  | Purpose                               |
| ----------------------- | ------------------------------------- |
| `npm run cdk:bootstrap` | `cdk bootstrap` (default CLI profile) |
| `npm run cdk:diff`      | `cdk diff` (default profile)          |
| `npm run cdk:deploy`    | `cdk deploy` (default profile)        |
| `npm run cdk:destroy`   | `cdk destroy` (default profile)       |

With a named profile (e.g. `financeos-admin-amsborse-dev`), prefer the `npx cdk … --profile financeos-admin-amsborse-dev` commands in the validation section above.

## Environment variables

Lambda environment variables are defined on the function in `infra/lib/backend-stack.js` (`environment` on `NodejsFunction`). Add keys there and run `npx cdk deploy --profile financeos-admin-amsborse-dev` (or `npm run cdk:deploy`) again. For secrets, prefer **AWS Secrets Manager** or **SSM Parameter Store** (wired in code later)—do not commit secrets to git.

Local development still uses `backend/.env.example` as a reference; the Lambda does not read `.env` files unless you add that logic.

## What is not included

- **No CI/CD** in this repo change set.
- **No database** infrastructure or migrations.
- **No** SAM template under `backend/infra`—this folder is CDK-only.

## Local API + frontend

**Backend only** (port 3001):

```bash
cd backend
npm install
npm run dev
```

Open `http://localhost:3001/health` (expect `{"status":"ok"}`).

**Frontend** (Vite, from repo root):

```bash
cd frontend/web
npm install
cp .env.example .env.local
# Set VITE_API_BASE_URL=http://localhost:3001 and VITE_USE_MOCK=false to exercise POST /api/analyze against local Hono.
npm run dev
```

## Deploying AI CSV Analyzer (financeos-ai-csv-analyzer)

The project includes a second stack **`FinanceOsAiCsvAnalyzerStack`** that deploys `financeos-ai-csv-analyzer` Lambda. This stack uses the OpenRouter API to perform LLM-based transaction categorization and financial insights summary.

### 1. Setting `OPENROUTER_API_KEY`
Before deploying, set `OPENROUTER_API_KEY` as an environment variable in your shell so CDK can pass it to the Lambda function:

```bash
# On Linux/macOS
export OPENROUTER_API_KEY="your-openrouter-key"

# On Windows (PowerShell)
$env:OPENROUTER_API_KEY="your-openrouter-key"

# On Windows (CMD)
set OPENROUTER_API_KEY="your-openrouter-key"
```

*Note: You can also specify `OPENROUTER_MODEL` (defaults to `openrouter/free`) and `APP_URL` (defaults to `https://financeos.app`).*

### 2. How to Deploy
Run the deploy script from the `backend` directory:
```bash
npm run deploy:ai-analyzer
```
*(Or directly from `backend/infra` by running `npm run deploy:ai-analyzer` / `npx cdk deploy FinanceOsAiCsvAnalyzerStack`)*

Once completed, CDK will print the **`AiAnalyzerUrl`** output (the Function URL).

### 3. How to Test with `curl`
You can test the deployed function URL or local endpoint by sending a raw CSV or a JSON payload containing the CSV content:

#### Option A: Sending JSON Payload
```bash
curl -X POST <FUNCTION_URL_OR_LOCALHOST> \
  -H "Content-Type: application/json" \
  -d '{"csv": "Date,Description,Amount\n2026-06-01,SAFEWAY #1234,-82.14\n2026-06-02,Direct Deposit,2500.00"}'
```

#### Option B: Sending Raw CSV Text
```bash
curl -X POST <FUNCTION_URL_OR_LOCALHOST> \
  -H "Content-Type: text/csv" \
  --data-binary "Date,Description,Amount
2026-06-01,SAFEWAY #1234,-82.14
2026-06-02,Direct Deposit,2500.00"
```

### 4. Example Response
```json
{
  "status": "success",
  "mode": "ai-categorization-ai-suggestions",
  "transactions": [
    {
      "id": "txn_001",
      "date": "2026-06-01",
      "description": "SAFEWAY #1234",
      "merchant": "Safeway",
      "amount": -82.14,
      "type": "expense",
      "localCategory": "Food",
      "localConfidence": 0.9,
      "aiCategory": "Food",
      "aiConfidence": 0.95,
      "finalCategory": "Food",
      "categorySource": "ai",
      "merchant_raw": "SAFEWAY #1234",
      "merchant_normalized": "Safeway",
      "currency": "USD",
      "category": "Food",
      "source": "csv-analyze",
      "card_identity": "Unknown",
      "created_at": "2026-06-01T12:00:00.000Z"
    },
    {
      "id": "txn_002",
      "date": "2026-06-02",
      "description": "Direct Deposit",
      "merchant": "Direct Deposit",
      "amount": 2500,
      "type": "income",
      "localCategory": "Income",
      "localConfidence": 0.9,
      "aiCategory": "Income",
      "aiConfidence": 0.95,
      "finalCategory": "Income",
      "categorySource": "ai",
      "merchant_raw": "Direct Deposit",
      "merchant_normalized": "Direct Deposit",
      "currency": "USD",
      "category": "Income",
      "source": "csv-analyze",
      "card_identity": "Unknown",
      "created_at": "2026-06-02T12:00:00.000Z"
    }
  ],
  "reportData": {
    "period": {
      "start": "2026-06-01",
      "end": "2026-06-02"
    },
    "totalTransactions": 2,
    "totalIncome": 2500,
    "totalExpenses": 82,
    "netCashFlow": 2418,
    "savingsRate": 96.72,
    "categoryTotals": {
      "Income": 2500,
      "Housing": 0,
      "Food": 82,
      "Transportation": 0,
      "Shopping": 0,
      "Bills & Utilities": 0,
      "Health": 0,
      "Entertainment": 0,
      "Transfers": 0,
      "Other": 0
    },
    "topMerchants": [
      {
        "merchant": "Safeway",
        "total": 82,
        "count": 1
      }
    ],
    "largestTransactions": [
      {
        "id": "txn_001",
        "date": "2026-06-01",
        "merchant": "Safeway",
        "amount": 82
      }
    ],
    "dailySpending": [
      {
        "date": "2026-06-01",
        "amount": 82
      }
    ],
    "monthlyTrend": [
      {
        "month": "2026-06",
        "income": 2500,
        "expenses": 82,
        "netCashFlow": 2418
      }
    ]
  },
  "insights": {
    "summary": "You had $2500 income, $82 expenses, and $2418 net cash flow during this period.",
    "score": 70,
    "riskLevel": "low",
    "observations": [
      {
        "title": "Net cash flow",
        "message": "Your net cash flow was $2418.",
        "severity": "info",
        "category": "Cash Flow"
      }
    ],
    "recommendations": [
      {
        "title": "Review top categories",
        "message": "Start by reviewing your largest spending categories.",
        "impact": "medium",
        "estimatedMonthlySavings": 0
      }
    ],
    "anomalies": []
  },
  "aiStatus": {
    "categorization": "success",
    "insights": "success"
  }
}
```

