# ADR-0001: Guest-First Profile Model

- **Status**: Accepted
- **Date**: 2026-04-19
- **Deciders**: Akshay Borse

## Context

FinanceOS is a personal-finance tool. The single most valuable interaction is *"upload my statement, see where my money goes"*. Forcing users through a sign-up flow before they can do that loses most of them.

At the same time, several planned features genuinely need a stable user identity: an AI coach that personalises advice over time, server-side budget alerts, multi-device sync. Those features will eventually require an account.

We needed a model that gives both: zero-friction first use, and a clear path to deeper features for users who want them.

## Decision

We will ship a **guest-first** product. Every core feature works without authentication. Profile creation is optional and only required to unlock features that genuinely need a user identity (initially: the AI coach and personalised recommendations).

Concretely:

- Client identity is held in `localStorage` (key: `financeos.profile.v4`) by [`useProfile`](../../frontend/web/src/hooks/useProfile.js).
- A user is considered to have a profile only when `profileCompleted === true` **and** both `name` and `handle` are non-empty. The hook exposes this as `hasProfile`.
- Gated features render a placeholder with an inline call-to-action that opens the profile drawer (no separate auth page).
- Default to free. Only gate features that genuinely depend on a user identity (see the [`profile-gating`](../../skills/profile-gating/SKILL.md) skill for the matrix).

## Consequences

Positive:

- Users land on the dashboard and immediately see value with mock data; the upload flow upgrades it to their data.
- We avoid building an auth system before we need one.
- Marketing pages can deep-link directly to features.

Negative:

- We carry a "guest" state through the UI forever; every component that surfaces profile data has to handle both shapes.
- Local-only profiles do not survive a browser reset — accepted today, will need server-side sync once the backend ships real auth.
- Some PMs / analysts will want a hard sign-up wall for funnel metrics; we have to push back on that.

Second-order:

- The same `useProfile` hook will eventually back a server-side profile. The hook's public surface (`profile`, `updateProfile`, `hasProfile`, `displayName`) is intentionally narrow so consumers don't break when the implementation swaps.

## Alternatives considered

- **Auth wall on first visit** — highest funnel cost, hides the product. Rejected.
- **Anonymous server-side accounts on first load** — defers the problem rather than solving it; we still need the backend to ship before we can show anything. Rejected for v1.
- **Free trial with a timer** — same friction as an auth wall, with extra UX complexity. Rejected.

## References

- [`profile-gating`](../../skills/profile-gating/SKILL.md) skill
- [`design/profile-tab.md`](../design/profile-tab.md)
- [`frontend/web/src/hooks/useProfile.js`](../../frontend/web/src/hooks/useProfile.js)
- [`frontend/web/src/components/profile/ProfilePanel.jsx`](../../frontend/web/src/components/profile/ProfilePanel.jsx)
