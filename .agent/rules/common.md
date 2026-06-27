# Common Agent Rules

## Principles

1. **Test-first mindset** — consider tests before implementation
2. **Minimal diffs** — solve the problem, don't refactor adjacent code
3. **Reuse Arsenal** — shared formatters, hooks, storage live in `Arsenal/packages/`
4. **Contract-driven** — API shapes must align with `schema.json`
5. **Self-validating** — every change strengthens the quality system

## Repository map

```
FinanceOS/
├── backend/          Active Hono API (Lambda 1 + routes)
├── frontend/web/     React SPA
├── tests/            Cross-cutting test suites
├── scripts/          Build, coverage, quality gate
├── docs/quality/     QE documentation
└── .agent/           Agent operating manual (this folder)
```

## Communication

- Be precise about which package you changed
- Cite code with `startLine:endLine:path` format
- Report test counts and gate status when finishing

## Forbidden

- Committing generated reports or coverage
- Disabling quality checks to "make CI pass"
- Adding features without tests (see `testing.md`)
- Force-pushing to `main`

## Skills

Legacy agent skills remain in `skills/` — prefer `.agent/rules/` for new work.
