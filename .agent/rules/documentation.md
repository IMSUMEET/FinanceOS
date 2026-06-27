# Documentation Rules

## When to update docs

- New API endpoint → `schema.json`, `types/README.md`, `docs/quality/testing-strategy.md` if new test type
- Architecture change → `docs/quality/architecture.md`, ADR if significant
- New test layer → `tests/README.md`
- Agent workflow change → `.agent/` files

## Do NOT create docs unless

- User requested them, OR
- Required for quality system (this `.agent/` and `docs/quality/` structure)

## Format

- Complete sentences, markdown links for paths
- Keep docs close to code they describe
- ADRs for irreversible decisions (`docs/adr/`)

## Self-documenting code

Prefer clear names and tests over lengthy comments. Tests are living documentation for behavior.
