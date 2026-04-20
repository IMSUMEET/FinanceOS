---
name: frontend-conventions
description: >-
  React 19 + Vite + Tailwind CSS + framer-motion conventions used in the
  FinanceOS web app. Use when writing or reviewing any code under
  `frontend/web/src/`, adding a page, building a component, or styling something
  for both light and dark mode.
---

# Frontend Conventions

The frontend lives in [`frontend/web`](../../frontend/web) and is a Vite + React 19 + Tailwind v3 app. There is no TypeScript — all source is `.jsx` / `.js`. Run everything from `frontend/web`.

## Stack at a glance

- **Build**: Vite 7 (`npm run dev`, `npm run build`, `npm run preview`)
- **Routing**: `react-router-dom` v7, defined in [`src/App.jsx`](../../frontend/web/src/App.jsx)
- **Styling**: Tailwind v3 with `darkMode: 'class'` (see [`tailwind.config.js`](../../frontend/web/tailwind.config.js))
- **Animation**: `framer-motion`
- **Icons**: `lucide-react`
- **Charts**: `recharts`
- **Linting**: ESLint flat config (`npm run lint`)

## Hard rules

### 1. Always import `motion` as `Motion`

ESLint flags lowercase `motion` as unused when used as a JSX element. Always alias it:

```jsx
import { motion as Motion } from "framer-motion";

<Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />;
```

### 2. Render dynamic Lucide icons via `createElement`

When a component receives an icon component as a prop named `icon`, ESLint will complain about destructuring it as `Icon`. Instead:

```jsx
import { createElement } from "react";

function QuickAction({ icon, label }) {
  return (
    <button>
      {createElement(icon, { size: 16 })}
      {label}
    </button>
  );
}
```

For statically imported icons used directly, just render normally: `<Bell size={16} />`.

### 3. Every page sets its own document title

```jsx
import { useDocumentTitle } from "../hooks/useDocumentTitle";

function OverviewPage() {
  useDocumentTitle("Overview");
  // ...
}
```

The hook appends ` · FinanceOS` and restores the previous title on unmount.

### 4. Inputs use `focus-visible`, not `focus-within`

`focus-within` keeps the ring on after a value is selected (looks broken on selects). Always use `focus-visible` for ring styles, and call `e.currentTarget.blur()` on `<select>` change handlers when the menu doesn't auto-close. See [`src/components/ui/Select.jsx`](../../frontend/web/src/components/ui/Select.jsx).

### 5. Charts must not let the user select the surrounding pane

Add `select-none` to any chart wrapper and `pointer-events-none` to non-interactive overlays (sparklines, decorative SVGs). Without this, clicking a `recharts` tooltip selects the whole card.

## Tailwind tokens you should reuse

These come from [`tailwind.config.js`](../../frontend/web/tailwind.config.js). Prefer them over raw hex values.

- **Colors**: `ink-{50..950}` (neutrals), `brand-{50..900}` (blue), `accent-{400..600}` (purple), `category.*` (per-category palette)
- **Shadows**: `shadow-soft`, `shadow-softLg` for light mode; pair with `dark:shadow-softDark` / `dark:shadow-softLgDark` in dark mode
- **Radii**: `rounded-xl2` (28px), `rounded-xl3` (32px) for the soft-glass aesthetic
- **Backgrounds**: `bg-appField` (light), `dark:bg-appFieldDark` (dark) for full-page surfaces; `bg-brand`, `bg-brandSoft`, `bg-insight` for accent surfaces
- **Animation**: `animate-fadeIn` for simple appear; framer-motion for anything richer

## Dark mode pattern

Every styled element needs both halves. The repo standard is to put the dark variant immediately after each light class so reviewers can see them paired:

```jsx
<section className="rounded-xl2 border border-ink-100 bg-white shadow-soft dark:border-ink-800 dark:bg-ink-900/70 dark:shadow-softDark">
```

Never assume a parent already provides the dark surface — components are reused on multiple backgrounds.

## Folder map (`src/`)

| Folder | What lives here |
| --- | --- |
| `api/` | Thin fetch wrapper + endpoint registry (see `backend-contract` skill) |
| `services/` | Domain modules (`transactions`, `insights`, `profile`) — every UI data call goes through these |
| `context/` | React Context providers (currently `TransactionsContext`) |
| `hooks/` | Reusable hooks: `useProfile`, `useTheme`, `useDocumentTitle` |
| `components/ui/` | Generic primitives (Button, Card, Drawer, Select, IconButton, KpiCard, Skeleton, …) |
| `components/common/` | Project-specific primitives (Avatar, Logo, NavbarActions, …) |
| `components/layout/` | AppShell, Sidebar, Topbar, MobileNav, MobileFab |
| `components/charts/` | Recharts wrappers |
| `components/profile/` | ProfilePanel + sub-components |
| `pages/` | One file per route in [`App.jsx`](../../frontend/web/src/App.jsx) |
| `utils/` | Pure functions (formatting, categorization, insights, personality) |
| `data/` | Seed/mock data (only `mockTransactions.js` today) |
| `types/` | API contract: `schema.json` + `examples.json` + `README.md` |

## Before you commit

```bash
cd frontend/web
npm run lint
npm run build
```

Both must pass. See the `pr-workflow` skill for the rest.
