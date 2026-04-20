# ADR-0003: Tailwind Dark Mode via the `class` Strategy

- **Status**: Accepted
- **Date**: 2026-04-19
- **Deciders**: Akshay Borse

## Context

FinanceOS needs first-class dark mode. Many users will sit on the dashboard for long stretches — staring at a bright surface at night is genuinely uncomfortable.

Tailwind offers two dark-mode strategies:

- `media` — driven entirely by `prefers-color-scheme`. The user can't override.
- `class` — driven by a `dark` class on `<html>`. The app decides when it is on.

We needed a manual toggle (and a per-user preference), so the `media` strategy was a non-starter.

## Decision

We will use Tailwind's `class` strategy (`darkMode: 'class'` in [`tailwind.config.js`](../../frontend/web/tailwind.config.js)). The theme is owned by the [`useTheme`](../../frontend/web/src/hooks/useTheme.js) hook:

- Reads the user's saved preference from `localStorage`; falls back to `prefers-color-scheme` on first visit.
- Toggles `document.documentElement.classList` and persists the choice.
- Updates `<meta name="color-scheme">` so native form controls and scrollbars match.

To prevent a flash of incorrect theme (FOUC), `index.html` runs an inline script in `<head>` **before** React hydrates that applies the saved class to `<html>`.

Component authoring rule: every styled element must include both light and dark classes in the same `className`, paired so reviewers can spot mismatches:

```jsx
<div className="border border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-900/70" />
```

We added these tokens specifically for dark mode (see [`design/design-system.md`](../design/design-system.md)):

- `ink-950` (deepest neutral)
- `shadow-softDark`, `shadow-softLgDark`
- `bg-appFieldDark` (page surface)

## Consequences

Positive:

- Users can override system preference with a click; preference persists per device.
- All styling is colocated — no `media` queries, no CSS variables to thread through.
- FOUC is prevented before React mounts.

Negative:

- Every component needs its dark variant authored by hand. Mitigation: linked tokens, plus the `frontend-conventions` skill calls this out so AI assistants and humans both pair the variants.
- Doubled `className` strings can get long. Mitigation: prefer Tailwind's `dark:` prefix over conditional logic — it stays a single static string.

## Alternatives considered

- **`media` strategy** — no user override. Rejected.
- **CSS variables for color tokens** — works but loses Tailwind's IntelliSense and adds a layer to debug. Reconsider only if we add a third theme.
- **A heavier theming layer (e.g. `next-themes` equivalent)** — adds a dependency for what is currently ~30 lines in `useTheme`.

## References

- [`useTheme`](../../frontend/web/src/hooks/useTheme.js)
- [`tailwind.config.js`](../../frontend/web/tailwind.config.js)
- [`design/design-system.md`](../design/design-system.md)
- Tailwind docs on the [class strategy](https://tailwindcss.com/docs/dark-mode)
