---
name: profile-gating
description: >-
  FinanceOS uses a guest-first model — every core feature works without
  authentication, and only "advanced" features (AI coach, personalised
  recommendations) require a completed profile. Use when adding a new feature
  that should be gated, when touching the profile UI, or when the user is
  asking about login/auth.
---

# Profile Gating (Guest-First)

FinanceOS does **not** have an authentication wall. The product decision is captured in [`docs/adr/0001-guest-first-profile-model.md`](../../docs/adr/0001-guest-first-profile-model.md). Anyone can land on the app and analyse spending immediately. Profiles unlock advanced features.

## The contract

The single source of truth is the `useProfile` hook at [`src/hooks/useProfile.js`](../../frontend/web/src/hooks/useProfile.js):

```js
const { profile, updateProfile, cycleAvatar, hasProfile, displayName } = useProfile();
```

- `hasProfile` is a boolean — true only when `profileCompleted` is true **and** both `name` and `handle` are non-empty.
- `displayName` is `"<name> <handle>"` when `hasProfile`, otherwise `"Guest user"`.
- Persistence is `localStorage` under `financeos.profile.v4`. Bump the key (`v5`, …) if you change the shape in a backward-incompatible way.

## What's free vs gated

| Feature | Guest | Profile required |
| --- | --- | --- |
| Upload CSV / view transactions | yes | — |
| Categories, totals, trends | yes | — |
| Spend Analyzer charts + insights | yes | — |
| Export CSV | yes | — |
| Personalised AI coach | — | yes |
| Personalised recommendations / narratives | — | yes |
| Saved budgets, alerts (future) | — | yes |

**Default to free.** If you are unsure whether a new feature should be gated, leave it free. Only gate features that genuinely depend on a stable user identity (anything we'd persist server-side per user, or anything that calls a paid API on the user's behalf).

## How to gate something

```jsx
import { useProfile } from "../hooks/useProfile";

function AICoachPanel() {
  const { hasProfile } = useProfile();

  if (!hasProfile) {
    return (
      <Card>
        <SectionHeader
          title="Unlock the AI coach"
          subtitle="Create your profile to get personalised suggestions"
        />
        <Button onClick={openProfileDrawer}>Create profile</Button>
      </Card>
    );
  }

  return <RealAICoach />;
}
```

Two rules:

1. **Don't hide the feature** — show its placeholder with a clear path to unlock it. The user should always know what they'd gain.
2. **Open the profile drawer** as the unlock action, not a separate page. The form lives in [`src/components/profile/ProfilePanel.jsx`](../../frontend/web/src/components/profile/ProfilePanel.jsx).

## Where the gating already shows up

- [`components/common/NavbarActions.jsx`](../../frontend/web/src/components/common/NavbarActions.jsx) — profile pill says "Create your profile" when guest, the user's name when not.
- [`components/profile/ProfilePanel.jsx`](../../frontend/web/src/components/profile/ProfilePanel.jsx) — shows a profile-creation form for guests, full profile for members.
- [`pages/InsightsPage.jsx`](../../frontend/web/src/pages/InsightsPage.jsx) — the AI coach narrative card switches copy based on `hasProfile`.

## When the backend lands

The mock `services/profile.js` persists to `localStorage`. When the backend ships:

- `getProfile()` will return the server profile
- `updateProfile(patch)` will PATCH it
- `useProfile` should still expose the same `hasProfile` / `displayName` shape — components read from those, not from raw fields

The `USE_MOCK` switch in [`api/client.js`](../../frontend/web/src/api/client.js) handles the swap. See the `backend-contract` skill.
