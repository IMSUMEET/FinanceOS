# Changelog

All notable user-visible changes to FinanceOS are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The project does not use semantic versioning yet — entries are grouped by date until the first tagged release.

## [Unreleased]

### Added

- `skills/` folder at the repo root with six seed Agent Skills capturing the conventions used in FinanceOS (frontend, backend contract, UI components, spend-analyzer flow, profile gating, PR workflow).
- `docs/` folder with architecture overview, frontend and backend notes, design system, profile-tab redesign rationale, and the first three ADRs.

## 2026-04-19

### Added

- Guest-first profile model. Core features (transactions, categories, charts, export) work without an account. AI coach and personalised recommendations require a completed profile created from the profile drawer. Persisted in `localStorage` under `financeos.profile.v4`.
- Backend-ready data layer: thin fetch wrapper at [`frontend/web/src/api/client.js`](../frontend/web/src/api/client.js), endpoint registry at [`frontend/web/src/api/endpoints.js`](../frontend/web/src/api/endpoints.js), domain services in [`frontend/web/src/services/`](../frontend/web/src/services), JSON-Schema contract in [`frontend/web/src/types/schema.json`](../frontend/web/src/types/schema.json) with examples and a backend hand-off README.
- Mock provider switch driven by `VITE_USE_MOCK` and `VITE_API_BASE_URL` (see [`frontend/web/.env.example`](../frontend/web/.env.example)). Defaults to mock when no API URL is set.
- Full dark mode (Tailwind class strategy) with theme toggle, system-preference detection, and FOUC prevention. New tokens: `ink-950`, `softDark`, `softLgDark`, `appFieldDark`.
- 404 page at [`frontend/web/src/pages/NotFoundPage.jsx`](../frontend/web/src/pages/NotFoundPage.jsx).
- `useDocumentTitle` hook so every route sets its own title.

### Changed

- Profile drawer redesigned with a hero banner, condensed stats, profile-creation form for guests, and a quick-actions grid (theme toggle, avatar cycle, CSV export, reset, sign out).
- `Drawer` is now portaled to `document.body` to escape ancestor CSS filters that previously clipped it.
- `Select` is fully clickable across the whole pill (text + chevron) and accepts a `leadingIcon` prop. Focus styling switched from `focus-within` to `focus-visible` so the ring clears after selection.
- `Avatar` now uses the open-source DiceBear API (static, deterministic) instead of the previous custom face SVG.
- `Logo` text is visible in dark mode.
- `KpiCard` no longer re-runs the count-up animation on hover (CountUp tracks the last animated value via a ref).

### Removed

- Custom `MiniFace` SVG avatar component.

## 2026-04-05

### Added

- Initial monorepo scaffolding: `frontend/web` (Vite + React + Tailwind) and `backend/` (FastAPI skeleton with SQLite), plus `infra/` and `docker-compose.yml`.
