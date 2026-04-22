# Design System

The FinanceOS visual language is "soft glass": pastel surfaces, generous radii, restrained motion, dual-mode by default. The implementation lives in [`frontend/web/tailwind.config.js`](../../frontend/web/tailwind.config.js) and [`frontend/web/src/index.css`](../../frontend/web/src/index.css).

## Tokens

### Color

| Token | Use |
| --- | --- |
| `ink-50 → ink-950` | Neutrals. `ink-50/100/200` are light surfaces, `ink-700/800/900/950` are dark surfaces. `ink-950` (#080f1e) is the deepest background, used by `appFieldDark`. |
| `brand-50 → brand-900` | Primary blue. `brand-600` is the canonical CTA, `brand-50/100` are subtle backgrounds, `brand-200/300` are borders for soft callouts. |
| `accent-400/500/600` | Purple, used in gradients with brand. |
| `category.{food, groceries, gas, transport, shopping, entertainment, travel, utilities, subscriptions, other}` | Per-category palette. Always reach for these instead of inventing new chart colors. |

### Shadow

- `shadow-soft` / `shadow-softLg` — light-mode card depth
- `shadow-softDark` / `shadow-softLgDark` — dark-mode equivalents (paired in the same `className`)
- `shadow-brand` — for accent CTAs
- `shadow-ring` — focus ring

### Radius

- `rounded-xl2` (28px) — cards, panels, drawer
- `rounded-xl3` (32px) — hero blocks, the largest surfaces
- `rounded-2xl` (Tailwind default 16px) — buttons, pills

### Background images

- `bg-appField` — the page surface, light mode
- `dark:bg-appFieldDark` — the page surface, dark mode
- `bg-brand`, `bg-brandSoft` — brand gradient blocks
- `bg-insight` — dark insight cards (used regardless of theme for emphasis)

### Typography

- Family: Inter (loaded once in `index.html`), system-ui fallback
- Page H1: `text-2xl md:text-3xl font-black`
- Card title: `text-lg md:text-xl font-bold`
- Section eyebrow: `text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400`
- Tabular numerics: a `.tabular` class is used on KPIs so digits don't shift width while animating

### Motion

- All transitional motion uses `framer-motion`, imported as `motion as Motion`
- Standard easing: `[0.22, 1, 0.36, 1]` (custom ease-out)
- Spring used by `Drawer` and similar slide-in panels: `{ type: "spring", stiffness: 320, damping: 36 }`
- Hover micro-interactions are CSS only (Tailwind `hover:`)
- Respect `prefers-reduced-motion` — the effects components fall back to instant transitions

## Component catalogue

These are the primitives every page composes. See the [`ui-components`](../../skills/ui-components/SKILL.md) skill for the *when to use which* matrix, and read the source for full props.

| Component | Path | Notes |
| --- | --- | --- |
| `Button` | `components/ui/Button.jsx` | Primary / secondary / ghost variants |
| `IconButton` | `components/ui/IconButton.jsx` | Square 36px target, requires `aria-label` |
| `Card` | `components/ui/Card.jsx` | Base surface, dual-mode |
| `KpiCard` | `components/ui/KpiCard.jsx` | Wraps `CountUp`, used on dashboard |
| `Drawer` | `components/ui/Drawer.jsx` | Right-side sheet, portaled to `document.body` |
| `Select` | `components/ui/Select.jsx` | Native select styled as a pill, optional `leadingIcon` |
| `Skeleton` | `components/ui/Skeleton.jsx` | Loading placeholder |
| `Avatar` | `components/common/Avatar.jsx` | DiceBear-backed, deterministic from `seed` |
| `Logo` | `components/common/Logo.jsx` | App mark + name, dark-mode aware |
| `NavbarActions` | `components/common/NavbarActions.jsx` | Notifications + settings + profile pill |
| `ThemeToggle` | `components/common/ThemeToggle.jsx` | Light / dark switch |
| `CountUp` | `components/effects/CountUp.jsx` | Counts to a value once per change, never on hover |
| `Reveal`, `StaggerGroup` | `components/effects/` | Enter animations |

## Dark mode

All components ship with both light and dark styles in the same `className` string:

```jsx
<div className="rounded-xl2 border border-ink-100 bg-white shadow-soft dark:border-ink-800 dark:bg-ink-900/70 dark:shadow-softDark" />
```

The user can toggle theme from the profile drawer (or any place that calls `useTheme().toggleTheme()`). Initial theme is loaded by an inline script in `index.html` to prevent FOUC. The `<meta name="color-scheme">` tag is updated in sync so the browser chrome (scrollbar, form controls) matches.

See [ADR-0003](../adr/0003-tailwind-dark-mode-class-strategy.md) for the rationale.

## Accessibility baseline

- Every interactive element has a focus-visible ring (`shadow-ring` or Tailwind `ring-*`)
- Drawers trap focus and close on `Escape`
- Icons-only buttons require `aria-label`
- Color is never the sole signal — pair with text or an icon
- Charts include a screen-reader text fallback in their wrapper card

## Extending

When adding a new visual pattern:

1. Reach for an existing token first. New tokens require a CHANGELOG entry.
2. New shared components belong in `components/ui/` (generic) or `components/common/` (FinanceOS-specific).
3. Update this doc with the new token / component in the same PR.
