# FinanceOS Skills

This folder collects **Agent Skills** — short, focused guides that teach an AI coding assistant (Cursor, Claude, Copilot, etc.) how we build FinanceOS. They are also useful for new humans joining the project: each one is a 2-minute read that captures a real convention used in the codebase.

If you are an AI agent, treat each `SKILL.md` as authoritative for its topic and prefer it over your priors when working in this repo.

## Format

Each skill lives in its own folder with a single `SKILL.md` file:

```
skills/
  <skill-name>/
    SKILL.md
```

`SKILL.md` follows the Cursor convention: YAML frontmatter (`name`, `description`) followed by markdown.

```markdown
---
name: my-skill
description: >-
  One-paragraph summary that explains what the skill teaches AND when the
  agent should reach for it. Start with the topic, end with trigger phrases
  ("use when ...").
---

# My Skill

...content...
```

The `description` is the most important field — it is what an agent reads to decide whether to load the full skill, so write it in the form *"X. Use when Y."*.

## Skills in this repo

| Skill | What it covers |
| --- | --- |
| [`frontend-conventions`](./frontend-conventions/SKILL.md) | React 19 + Vite + Tailwind + framer-motion patterns used across the web app |
| [`backend-contract`](./backend-contract/SKILL.md) | The schema-first FE/BE contract (`schema.json`, services, `VITE_USE_MOCK`) |
| [`ui-components`](./ui-components/SKILL.md) | When to use which component (Card, Drawer, Select, KpiCard, CountUp, Avatar) |
| [`spend-analyzer-flow`](./spend-analyzer-flow/SKILL.md) | How transactions, filters, insights and charts wire together |
| [`profile-gating`](./profile-gating/SKILL.md) | Guest-first model: gating advanced features behind `hasProfile` |
| [`pr-workflow`](./pr-workflow/SKILL.md) | Lint, build, commit style and PR template |

## Adding a new skill

1. Create `skills/<kebab-case-name>/SKILL.md`.
2. Fill in YAML frontmatter with a `name` and a `description` that ends with a trigger sentence.
3. Keep the body short (≤ 200 lines). Prefer concrete code snippets, file paths, and "do this / not this" pairs over prose.
4. Link to the relevant source files using repo-relative paths so an agent can `Read` them on demand.
5. Add a row to the table above and link it from any other skill it relates to.

## Auto-discovery (optional)

Cursor auto-loads skills from `~/.cursor/skills/` (personal) and `.cursor/skills/` (project). If you want this folder to be auto-discovered by Cursor as well, symlink it:

```bash
mkdir -p .cursor && ln -s ../skills .cursor/skills
```

We deliberately keep the source of truth at the repo root so non-Cursor tools and humans can find it without knowing about `.cursor/`.
