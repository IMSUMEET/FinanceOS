# Profile Tab Redesign

The profile drawer is the primary surface for the guest-first profile model (see [ADR-0001](../adr/0001-guest-first-profile-model.md)). It went through a full redesign on **2026-04-19** after several rounds of UX feedback. This doc captures the final shape and the reasoning so we don't regress.

## Where it lives

- Trigger: profile pill in [`components/common/NavbarActions.jsx`](../../frontend/web/src/components/common/NavbarActions.jsx)
- Drawer shell: [`components/ui/Drawer.jsx`](../../frontend/web/src/components/ui/Drawer.jsx)
- Content: [`components/profile/ProfilePanel.jsx`](../../frontend/web/src/components/profile/ProfilePanel.jsx)

## Structure (top to bottom)

1. **Hero banner** — gradient strip + circular Avatar + role pill (`FinanceOS Member` or `Guest access`) + display name + personality badge.
2. **Condensed stats** — three pills: total spend, transaction count, annualised recurring spend. Compact format so the whole hero fits at the top of the panel without scrolling on a phone.
3. **Profile-creation form** *(guest only)* — first name + last name inputs; submit sets `profileCompleted: true` and unlocks gated features.
4. **Profile details** — email (derived), region, plan, average monthly spend.
5. **Quick actions** — 2-column grid: theme toggle, switch avatar, export CSV, reset data, sign out. The AI coach action was deliberately removed; it's surfaced where it belongs (Insights page).

## Key UX decisions

### Drawer is portaled to `document.body`

Earlier versions of the drawer were clipped because an ancestor (`Topbar`) had `backdrop-filter`, which creates a containing block for `position: fixed`. The fix was to render the drawer through `createPortal(node, document.body)`. This is non-negotiable — any new sheet should follow the same pattern. See the [`ui-components`](../../skills/ui-components/SKILL.md) skill for the full recipe.

### Sticky header + scroll reset

- The drawer header (title + close button) is `sticky top-0` so the user can always close.
- On open, `contentRef.current.scrollTop = 0` resets scroll. This avoids the user landing in the middle of the panel after closing-and-reopening.
- `overscrollBehavior: 'contain'` on the scroll container so scrolling past the bottom doesn't bounce the page underneath.
- The drawer width is `max-w-lg` so the form fields breathe on desktop.

### Custom scrollbar

The native scrollbar was nearly invisible on the soft-glass surface. `index.css` adds a `.drawer-scroll` class that gives it a thin pill-shaped thumb in both themes.

### Static, deterministic avatar

`Avatar` renders a DiceBear PNG seeded by the user's display name, so the same seed always produces the same image. The previous animated `MiniFace` SVG was removed — it added motion noise and didn't survive the redesign. The hero banner is the only place that shows the avatar at large size; the navbar pill shows a smaller copy of the same avatar.

### `CountUp` doesn't re-animate on hover

Hovering the donut chart on the dashboard would re-key the KPIs and replay the count-up. `CountUp` now stores `format` and `duration` in refs and tracks the last animated value with `animatedToRef`, so it only animates when `value` actually changes. Don't reintroduce a `key` prop based on hover state.

## Guest vs member states

| Element | Guest | Member |
| --- | --- | --- |
| Role pill | "Guest access" | "FinanceOS Member" |
| Display name | "Create your profile" | `<First> <Last>` |
| Personality badge | "Unlock AI coach" | computed from `classifyPersonality()` |
| Email row | "—" | derived from name + handle |
| Plan row | "Guest" | "FinanceOS Pro" |
| Profile-creation form | shown | hidden |
| Footer note | "Create your profile to enable AI coach…" | "Advanced AI coach features are enabled…" |

The mapping is computed inline in `ProfilePanel` from `useProfile().hasProfile`. Keep the same one-liner instead of branching across two component trees — the diff between the two states is small.

## Future work

- Real avatar upload (replace DiceBear seed with uploaded URL when present)
- Email verification when the backend lands
- Per-device theme override (currently device-global via `localStorage`)
- Settings sub-pages (notifications, privacy) — likely a `SettingsDrawer` component reusing the same shell
