# FinanceOS Docs

Living documentation for the FinanceOS product, frontend, and backend. These docs grow with the codebase — every PR that ships a user-visible change or a contract change should update something here.

If you're new, read in this order:

1. [`architecture/overview.md`](./architecture/overview.md) — one-page system view
2. [`architecture/frontend.md`](./architecture/frontend.md) — how the web app is laid out
3. [`architecture/backend.md`](./architecture/backend.md) — backend skeleton and how the contract drives it
4. [`design/design-system.md`](./design/design-system.md) — colors, motion, components
5. [`adr/`](./adr) — accepted architectural decisions

For coding conventions an AI assistant should follow, see [`../skills/`](../skills).

## Layout

```
docs/
├── README.md                  # this file
├── CHANGELOG.md               # Keep-a-Changelog format, append to it
├── architecture/
│   ├── overview.md
│   ├── frontend.md
│   └── backend.md
├── design/
│   ├── design-system.md
│   └── profile-tab.md
└── adr/
    ├── 0000-template.md
    ├── 0001-guest-first-profile-model.md
    ├── 0002-schema-json-as-api-contract.md
    └── 0003-tailwind-dark-mode-class-strategy.md
```

## Iteration rules

These rules are enforced by reviewers, not by tooling — please follow them.

- **User-visible change?** Append a line to [`CHANGELOG.md`](./CHANGELOG.md) under the `Unreleased` section.
- **Contract change?** Update both [`frontend/web/src/types/schema.json`](../frontend/web/src/types/schema.json) and the relevant `architecture/*.md` doc in the same PR.
- **New architectural decision?** Add a new ADR (copy [`adr/0000-template.md`](./adr/0000-template.md), use the next number). **Never edit an `Accepted` ADR** — supersede it with a new one and set the old one's status to `Superseded by ADR-XXXX`.
- **New convention or "always do this"?** Add or update the matching skill under [`../skills/`](../skills) too, so AI assistants pick it up.
- **New page / major component?** Update [`architecture/frontend.md`](./architecture/frontend.md) and add a screenshot to the design doc if it has UX implications.

## ADR naming

`docs/adr/NNNN-kebab-case-title.md`, where `NNNN` is a zero-padded sequential number starting at `0001`. The template lives at [`adr/0000-template.md`](./adr/0000-template.md). The format is Michael Nygard's: Status / Context / Decision / Consequences.
