---
name: spend-analyzer-flow
description: >-
  How transactions, filters, charts and insights wire together in FinanceOS.
  Covers TransactionsContext, the insights utils, and chart conventions. Use
  when adding a new analytic, building a chart, changing how filters work, or
  surfacing a new insight in the UI.
---

# Spend Analyzer Flow

Every analytic in FinanceOS reads from a single source: the `TransactionsContext`. Filters, computed insights, and chart components all derive from it.

## Data flow

```
mockTransactions.js   ──hydrate──▶  TransactionsContext (state + filters)
services/transactions  ──fetch───▶          │
                                            ▼
                              utils/insights, utils/personality
                                            │
                                            ▼
                          pages (Overview / Insights / Categories)
                                            │
                                            ▼
                              charts + KpiCards + tables
```

Read [`src/context/TransactionsContext.jsx`](../../frontend/web/src/context/TransactionsContext.jsx) and [`src/context/useTransactions.js`](../../frontend/web/src/context/useTransactions.js) before adding anything new.

## Where things live

| Concern | File |
| --- | --- |
| State + mutations | [`context/TransactionsContext.jsx`](../../frontend/web/src/context/TransactionsContext.jsx) |
| Hook for consumers | [`context/useTransactions.js`](../../frontend/web/src/context/useTransactions.js) |
| Mock seed | [`data/mockTransactions.js`](../../frontend/web/src/data/mockTransactions.js) |
| Fetch + persistence layer | [`services/transactions.js`](../../frontend/web/src/services/transactions.js), [`services/insights.js`](../../frontend/web/src/services/insights.js) |
| Pure computation | [`utils/insights.js`](../../frontend/web/src/utils/insights.js), [`utils/personality.js`](../../frontend/web/src/utils/personality.js) |
| Number / date formatting | [`utils/format.js`](../../frontend/web/src/utils/format.js) |
| Categorization rules | [`utils/categorize.js`](../../frontend/web/src/utils/categorize.js), [`utils/categories.js`](../../frontend/web/src/utils/categories.js) |
| Charts | [`components/charts/`](../../frontend/web/src/components/charts) |

## Conventions

### 1. Filters live in context, not in the URL

The current month / category filters are stored in `TransactionsContext` and shared by every page. If you add a filter, add it to the context — don't duplicate filter state in a page.

The "all months" sentinel is exported as `ALL_MONTHS_SENTINEL` from the context. Use it instead of magic strings.

### 2. Computation lives in `utils/`, not in components

A page or chart should never iterate transactions to compute a number. Extract a pure function in `utils/insights.js` and unit-test-friendly. Examples to follow: `totalSpend`, `detectRecurring`, `topCategories`.

This keeps charts dumb (just render data) and lets the same insight be shown in multiple places.

### 3. Charts must not capture text selection

Add `select-none` to the wrapper and `pointer-events-none` to anything decorative:

```jsx
<div className="select-none">
  <ResponsiveContainer width="100%" height={240}>
    <LineChart data={data}>{/* ... */}</LineChart>
  </ResponsiveContainer>
</div>
```

### 4. Charts read theme from a hook, not from `prefers-color-scheme`

Axis / grid colors must use `useTheme()` so they update instantly when the user toggles the theme:

```jsx
const { theme } = useTheme();
const axis = theme === "dark" ? "#94a3b8" : "#64748b";
```

### 5. Hover should not re-trigger KPI animations

`KpiCard` uses `CountUp`. If you wrap it with a hover state (e.g. for the donut chart highlighting a slice), do **not** re-key the KPI on hover — `CountUp` already handles re-renders correctly, and re-keying triggers the count animation from zero. See the `ui-components` skill for the rule.

## Adding a new insight

1. Add a pure function in `utils/insights.js` — input is an array of transactions, output is the insight shape.
2. Add an example output to `src/types/examples.json` and a `$defs` entry in `src/types/schema.json`.
3. Add a service function in `services/insights.js` with both `USE_MOCK` branch and live `apiClient` branch.
4. Surface it in the relevant page (`OverviewPage`, `InsightsPage`, etc.) using existing primitives (`Card`, `KpiCard`, etc.).
5. If it requires a new endpoint, follow the `backend-contract` skill end-to-end.
