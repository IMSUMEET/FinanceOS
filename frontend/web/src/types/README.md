# FinanceOS API contract

Source of truth for the data shapes the web frontend expects from / sends to the backend. Use `schema.json` (JSON Schema draft 2020-12) for validation and code-gen, and `examples.json` for Postman / fixture seeding.

## Endpoints (v1)

| Method | Path                      | Request schema                          | Response schema                                          |
| ------ | ------------------------- | --------------------------------------- | -------------------------------------------------------- |
| GET    | `/transactions`           | query: `Filters`                        | `{ "rows": Transaction[] }`                              |
| POST   | `/transactions`           | `Transaction` (without `id`)            | `Transaction`                                            |
| PATCH  | `/transactions/:id`       | `Partial<Transaction>`                  | `Transaction`                                            |
| DELETE | `/transactions/:id`       | —                                       | `{ "ok": true }`                                         |
| POST   | `/transactions/import`    | `TransactionImport`                     | `{ "imported": number, "rows": Transaction[] }`          |
| GET    | `/insights/summary`       | query: `month`                          | `{ "total": Money, "monthly": MonthlyTotal[], "categories": CategoryBreakdown[], "merchants": MerchantBreakdown[] }` |
| GET    | `/insights/movers`        | query: `month`                          | `{ "movers": MoverEntry[] }`                             |
| GET    | `/insights/recurring`     | —                                       | `{ "items": RecurringMerchant[] }`                       |
| GET    | `/insights/anomalies`     | query: `month`                          | `{ "items": Anomaly[] }`                                 |
| GET    | `/notifications`          | —                                       | `{ "items": NotificationItem[] }`                        |
| POST   | `/notifications/:id/read` | —                                       | `NotificationItem`                                       |
| GET    | `/profile`                | —                                       | `Profile`                                                |
| PATCH  | `/profile`                | `Partial<Profile>`                      | `Profile`                                                |

## Conventions

- All money values are positive numbers in the user's base currency (USD for v1). Income / refunds appear as **negative** `amount` on `Transaction`.
- All dates are ISO-8601 (`YYYY-MM-DD` for calendar dates, RFC 3339 for instants).
- Pagination is not yet defined; v1 returns full result sets capped at 5,000 rows.
- The frontend treats `Filters.month === "ALL"` as "no month filter".
- The product is guest-accessible without authentication. Advanced features (AI coach, personalized recommendations) are unlocked only when `Profile.profileCompleted === true`.

## How to validate

```bash
npx ajv-cli validate -s schema.json#/$defs/Transaction -d sample.json
```

## How to consume from JS

```js
import { TYPE_NAMES } from "./index.js"; // JSDoc typedefs for editor intellisense
```

## Frontend integration layer

The web client never calls `fetch` directly. All HTTP traffic flows through:

```
src/api/client.js        ← thin fetch wrapper, reads VITE_API_BASE_URL
src/api/endpoints.js     ← the URL surface (single source of truth)
src/services/*.js        ← per-domain service modules (transactions, insights, profile)
```

Each service exports async functions that match the table above one-to-one.
While `VITE_USE_MOCK=true` (the default in `.env.example`) the services
short-circuit and return seeded data from `src/data/mockTransactions.js`, so
the UI can run end-to-end before any backend exists.

Backend handoff checklist:

1. Build endpoints to match `ENDPOINTS` exactly — paths, verbs, status codes.
2. Validate request/response payloads against the matching `$defs` block in
   `schema.json`.
3. Set `VITE_API_BASE_URL` in the deployment environment and unset
   `VITE_USE_MOCK`. The UI will swap from mock to live with no other change.

