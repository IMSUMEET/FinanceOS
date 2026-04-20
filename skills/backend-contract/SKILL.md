---
name: backend-contract
description: >-
  How the FinanceOS frontend talks to the backend through a schema-first
  contract with a swappable mock provider. Use when adding or changing an API
  endpoint, wiring a new service, defining request/response shapes, or
  switching between mock and live data.
---

# Backend Contract

We treat the **API contract** as the source of truth, not the backend code. The frontend ships with a fully working mock provider so the UI is never blocked on the backend, and the backend implements the same shapes the frontend already consumes.

## The four pillars

```
frontend/web/src/
├── types/
│   ├── schema.json     # JSON Schema — single source of truth for shapes
│   ├── examples.json   # Concrete examples that satisfy the schema
│   ├── index.js        # JSDoc typedefs for IDE autocomplete
│   └── README.md       # Hand-off doc for backend engineers
├── api/
│   ├── client.js       # Thin fetch wrapper, USE_MOCK guard
│   └── endpoints.js    # Centralized URL registry
└── services/
    ├── index.js        # Barrel
    ├── transactions.js # listTransactions, importTransactions, ...
    ├── insights.js     # getSummary, getMovers, getRecurring, getAnomalies
    └── profile.js      # getProfile, updateProfile
```

UI code **must not** call `fetch` directly. It must call a service. Services branch on `USE_MOCK` before reaching `apiClient.request`.

## The mock switch

Two Vite env vars in [`frontend/web/.env.example`](../../frontend/web/.env.example) drive everything:

```
VITE_API_BASE_URL=
VITE_USE_MOCK=true
```

The rule (from [`src/api/client.js`](../../frontend/web/src/api/client.js)):

```js
export const USE_MOCK =
  String(RAW_MOCK).toLowerCase() === "true" || API_BASE_URL === "";
```

So the default behaviour with no env file is mock mode. Set both `VITE_API_BASE_URL` and `VITE_USE_MOCK=false` to hit a real backend.

If `apiClient.request` is ever called while `USE_MOCK` is true it throws — that's intentional. It means a service forgot to short-circuit.

## Adding a new endpoint

Do all four in the same PR:

1. **Schema** — add or extend the relevant `$defs` entry in [`src/types/schema.json`](../../frontend/web/src/types/schema.json) and add an example to [`src/types/examples.json`](../../frontend/web/src/types/examples.json).
2. **Endpoint** — register the path in [`src/api/endpoints.js`](../../frontend/web/src/api/endpoints.js):
   ```js
   export const ENDPOINTS = {
     budgets: {
       list: "/budgets",
       update: (id) => `/budgets/${encodeURIComponent(id)}`,
     },
   };
   ```
3. **Service** — add a function in `src/services/<domain>.js` with both branches:
   ```js
   import { apiClient, USE_MOCK } from "../api/client";
   import { ENDPOINTS } from "../api/endpoints";

   export async function listBudgets(query) {
     if (USE_MOCK) return _mockListBudgets(query);
     return apiClient.get(ENDPOINTS.budgets.list, { query });
   }
   ```
4. **Backend handoff** — update [`src/types/README.md`](../../frontend/web/src/types/README.md) so backend engineers see the new contract.

## Mutation pattern (optimistic updates)

See [`src/context/TransactionsContext.jsx`](../../frontend/web/src/context/TransactionsContext.jsx). The contract is:

1. Apply the change to local state immediately.
2. Fire the service call.
3. On failure, roll back local state and surface a toast (TODO: real toast system).

Don't introduce a global `loading` flag for fetches that are mostly instantaneous in mock mode — it forced UI flicker and was removed during the backend skeleton work. Add per-call loading state in the component if you actually need it.

## Request / response style

- Money is a positive number in the user's base currency. Income / refunds are **negative on transactions only**.
- Dates are ISO `YYYY-MM-DD`. Timestamps are full ISO 8601.
- Months are `YYYY-MM` (`Month` def in `schema.json`).
- IDs are opaque strings (UUIDs in the live backend, deterministic strings in mock).
- Errors come back as `{ "message": "...", "code": "..." }`. The client throws an `ApiError` with `status` and `body`.
