# FinanceOS Skills

Short, focused guides that capture how we build FinanceOS. Each one is a quick read for anyone new to the project.

Treat each `SKILL.md` as authoritative for its topic when working in this repo.

## Format

Each skill lives in its own folder with a single `SKILL.md` file:

```
skills/
  <skill-name>/
    SKILL.md
```

`SKILL.md` uses YAML frontmatter (`name`, `description`) followed by markdown:

```markdown
---
name: my-skill
description: >-
  One-paragraph summary that explains what the skill covers AND when to
  use it. Start with the topic, end with trigger phrases ("use when ...").
---

# My Skill

...content...
```

The `description` is the most important field — write it in the form _"X. Use when Y."_

## Skills in this repo

| Skill                                                     | What it covers                                                                |
| --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [`frontend-conventions`](./frontend-conventions/SKILL.md) | React 19 + Vite + Tailwind + framer-motion patterns used across the web app   |
| [`backend-contract`](./backend-contract/SKILL.md)         | The schema-first FE/BE contract (`schema.json`, services, `VITE_USE_MOCK`)    |
| [`ui-components`](./ui-components/SKILL.md)               | When to use which component (Card, Drawer, Select, KpiCard, CountUp, Avatar)  |
| [`spend-analyzer-flow`](./spend-analyzer-flow/SKILL.md)   | How transactions, filters, insights and charts wire together                  |
| [`profile-gating`](./profile-gating/SKILL.md)             | Guest-first model: gating advanced features behind `hasProfile`               |
| [`code-standards`](./code-standards/SKILL.md)             | Local setup (`npm install`), Prettier, Husky, `npm run ci`, branch protection |
| [`pr-workflow`](./pr-workflow/SKILL.md)                   | Lint, build, commit style and PR template                                     |

## Adding a new skill

1. Create `skills/<kebab-case-name>/SKILL.md`.
2. Fill in YAML frontmatter with a `name` and a `description` that ends with a trigger sentence.
3. Keep the body short (≤ 200 lines). Prefer concrete code snippets, file paths, and "do this / not this" pairs over prose.
4. Link to the relevant source files using repo-relative paths.
5. Add a row to the table above and link it from any other skill it relates to.
