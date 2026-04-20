---
name: ui-components
description: >-
  When and how to use FinanceOS shared UI primitives — Card, KpiCard, Drawer,
  Select, IconButton, Avatar, CountUp. Covers the gotchas (drawer must be
  portaled, CountUp must not re-animate on hover, Select must be fully
  clickable). Use when building or reviewing any visual component in
  `frontend/web/src/`.
---

# UI Components

All shared UI lives under [`frontend/web/src/components/`](../../frontend/web/src/components). Reach for these primitives **before** writing custom markup.

## Pick the right primitive

| You want... | Use | From |
| --- | --- | --- |
| A surface (panel / section) | `Card` | `components/ui/Card` |
| A KPI tile with a number that animates in | `KpiCard` | `components/ui/KpiCard` |
| Side sheet (profile, filters, details) | `Drawer` | `components/ui/Drawer` |
| Inline icon-only action | `IconButton` | `components/ui/IconButton` |
| Primary / secondary text button | `Button` | `components/ui/Button` |
| Native dropdown styled like the app | `Select` | `components/ui/Select` |
| Loading state | `Skeleton` | `components/ui/Skeleton` |
| User avatar (deterministic, static) | `Avatar` | `components/common/Avatar` |
| Number that counts up on first paint | `CountUp` | `components/effects/CountUp` |
| Slide / fade in on enter | `Reveal`, `StaggerGroup` | `components/effects/` |

## Hard-won rules

### Drawer must be portaled

`Drawer` already calls `createPortal(node, document.body)`. **Do not** render its content inside another portal or inside any element that uses `filter:`, `transform:`, or `backdrop-filter:` — those create a containing block and clip `position: fixed`. The Topbar and AppShell both use filters, which is why portaling is mandatory.

If you make a new sheet-style component, follow the same recipe:
- Render via portal to `document.body`
- Lock `body.style.overflow` while open
- Sticky header inside the panel
- Reset `contentRef.current.scrollTop = 0` on open
- `overscrollBehavior: 'contain'` on the scroll container
- Focus-trap with Escape-to-close

See [`src/components/ui/Drawer.jsx`](../../frontend/web/src/components/ui/Drawer.jsx).

### Select must be fully clickable

The native `<select>` should fill the entire pill. The chevron is decorative (`pointer-events-none`). `Select` accepts a `leadingIcon` prop:

```jsx
import { Calendar } from "lucide-react";

<Select value={month} onChange={setMonth} leadingIcon={Calendar}>
  <option value="all">All months</option>
  {/* ... */}
</Select>
```

Don't reach for headless dropdown libraries unless you actually need search / multi-select — `Select` with native `<option>` is keyboard-accessible for free.

### CountUp must not re-animate on every render

`CountUp` keeps `format` and `duration` in refs and tracks the last value with `animatedToRef`. The animation only restarts when `value` actually changes. Bug to avoid: passing an inline `format={(n) => …}` without memoization is fine — the ref handling absorbs that — but **don't** reset the component's `key` based on hover or selection.

```jsx
<CountUp value={total} format={(n) => formatCurrency(n)} duration={800} />
```

### Avatar is a deterministic image, not a face SVG

`Avatar` renders a DiceBear PNG/SVG keyed by `seed`. Two identical seeds always render the same avatar. Use the user's display name as the seed so guest mode (`"Guest user"`) and signed-in mode produce different art:

```jsx
<Avatar
  seed={hasProfile ? displayName : "Guest user"}
  variant={profile.avatarVariant}
  size={40}
  alt={hasProfile ? displayName : "Guest user"}
/>
```

The old custom `MiniFace` component was deleted — don't reintroduce a hand-drawn face.

### IconButton vs Button

- `IconButton` for toolbar/header actions where a tooltip + icon is enough. Always pass `aria-label`.
- `Button` for primary actions that have visible text labels.

### Card composition

`Card` is just a styled wrapper. For a card with header + body, compose:

```jsx
<Card>
  <SectionHeader title="Recurring" subtitle="Detected from history" />
  <div className="mt-4">{/* body */}</div>
</Card>
```

Don't add extra `bg-white` or shadow inside a `Card` — it already provides them in both themes.

## Dark mode

Every component listed here already supports dark mode. When you add new ones, follow the pattern in the `frontend-conventions` skill: pair each light class with its `dark:` variant in the same `className`.
