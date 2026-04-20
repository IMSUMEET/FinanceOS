# Frontend Architecture

The web app lives in [`frontend/web`](../../frontend/web). Run everything from that directory.

```
frontend/web/
├── index.html
├── tailwind.config.js          # darkMode: 'class', tokens
├── vite.config.js
├── eslint.config.js
├── .env.example                # VITE_API_BASE_URL, VITE_USE_MOCK
├── public/                     # static assets, favicon
└── src/
    ├── App.jsx                 # routes
    ├── main.jsx                # ReactDOM.createRoot, providers
    ├── index.css               # Tailwind directives, scrollbar styles
    ├── api/
    │   ├── client.js           # fetch wrapper, USE_MOCK guard, ApiError
    │   └── endpoints.js        # ENDPOINTS registry
    ├── services/
    │   ├── index.js
    │   ├── transactions.js     # list, import, updateCategory, remove (+ mock)
    │   ├── insights.js         # summary, movers, recurring, anomalies (+ mock)
    │   └── profile.js          # get, update (+ localStorage mock)
    ├── context/
    │   ├── TransactionsContext.jsx
    │   └── useTransactions.js
    ├── hooks/
    │   ├── useDocumentTitle.js
    │   ├── useProfile.js       # localStorage-backed, hasProfile, displayName
    │   └── useTheme.js         # class strategy, system preference, FOUC fix
    ├── pages/
    │   ├── OverviewPage.jsx
    │   ├── TransactionsPage.jsx
    │   ├── CategoriesPage.jsx  # also handles /categories/:name
    │   ├── InsightsPage.jsx
    │   ├── UploadPage.jsx
    │   └── NotFoundPage.jsx
    ├── components/
    │   ├── ui/                 # Button, Card, Drawer, Select, IconButton, KpiCard, Skeleton, …
    │   ├── common/             # Avatar, Logo, NavbarActions, ThemeToggle, …
    │   ├── layout/             # AppShell, Sidebar, Topbar, MobileNav, MobileFab
    │   ├── charts/             # SpendTrendChart, CategoryDonut, CategoryBars, …
    │   ├── effects/            # CountUp, Reveal, StaggerGroup
    │   ├── dashboard/          # dashboard-only widgets
    │   ├── hero/               # WelcomeHero, HeroVisual
    │   ├── profile/            # ProfilePanel + sub-components
    │   └── upload/             # CSV upload UI
    ├── utils/
    │   ├── format.js           # currency, dates, monthKey
    │   ├── insights.js         # totalSpend, detectRecurring, …
    │   ├── personality.js      # AVATAR_VARIANTS, classifyPersonality
    │   ├── categories.js
    │   └── categorize.js       # heuristic merchant → category
    ├── data/
    │   └── mockTransactions.js
    ├── types/
    │   ├── schema.json         # JSON Schema — source of truth
    │   ├── examples.json
    │   ├── index.js            # JSDoc typedefs
    │   └── README.md           # backend hand-off
    └── styles/                 # additional CSS partials (currently empty placeholder)
```

## Routing

All routes are declared in one place: [`src/App.jsx`](../../frontend/web/src/App.jsx).

| Path | Page |
| --- | --- |
| `/` | `OverviewPage` |
| `/transactions` | `TransactionsPage` |
| `/categories` | `CategoriesPage` |
| `/categories/:name` | `CategoriesPage` (drilled-in view) |
| `/insights` | `InsightsPage` |
| `/upload` | `UploadPage` |
| `*` | `NotFoundPage` |

Every page sets its title via `useDocumentTitle`.

## State

There is no Redux / Zustand. Two layers cover everything we need today:

- **Server-ish state**: `TransactionsContext` holds transactions + filters. It hydrates via `services/transactions.listTransactions()` on mount and exposes optimistic mutations.
- **Client preferences**: `useProfile` and `useTheme` are tiny hooks that wrap `localStorage` with a subscriber set so multiple components stay in sync.

If you find yourself adding a third state layer, check whether it actually needs Context — most things should be derived state computed from transactions inside `utils/insights.js`.

## Theming

Tailwind class strategy (`darkMode: 'class'`). `useTheme` toggles `document.documentElement.classList` and writes the choice to `localStorage`. The `index.html` `<head>` runs an inline script before React mounts to set the class from storage / system preference, preventing a flash of light content (FOUC). See [ADR-0003](../adr/0003-tailwind-dark-mode-class-strategy.md).

Tokens live in [`tailwind.config.js`](../../frontend/web/tailwind.config.js):

- `ink-{50..950}` — neutrals (note `ink-950` exists for the deepest dark surface)
- `brand-{50..900}` — primary blue
- `accent-{400..600}` — purple accent
- `category.*` — per-category palette
- Shadows: `soft`, `softLg`, `softDark`, `softLgDark`, `brand`, `ring`, `dark`
- Background images: `appField` / `appFieldDark` (page surfaces), `brand`, `brandSoft`, `insight`
- Radii: `xl2` (28px), `xl3` (32px)

## Animation

`framer-motion` (always imported as `motion as Motion` to satisfy lint), plus a Tailwind `animate-fadeIn` utility for cheap entrances. Reduce-motion users get static UI via `prefers-reduced-motion` checks in the relevant effect components.

## Build + lint

```bash
cd frontend/web
npm install
npm run dev
npm run lint
npm run build
```

See the [`pr-workflow`](../../skills/pr-workflow/SKILL.md) skill for the full local check list.
