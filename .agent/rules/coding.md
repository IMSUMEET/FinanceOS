# Coding Rules

## Style

- Match surrounding code — naming, imports, error shapes
- Backend: TypeScript, Hono, `{ status, code, message }` error envelopes
- Frontend: JavaScript (JSX), thin wrappers over Arsenal
- Prettier enforced via lint-staged

## Imports

- Backend Arsenal: `@oblivion-labs-dev/arsenal-backend`, `@oblivion-labs-dev/arsenal-shared`
- Frontend Arsenal: `@oblivion-labs-dev/arsenal-frontend`, `@oblivion-labs-dev/arsenal-shared`
- Use `.js` extension in backend TS imports for ESM

## Error handling

API errors must return:

```json
{ "status": "error", "code": "SNAKE_CASE", "message": "Human-readable" }
```

## Types

- Backend: strict TypeScript (`npm run typecheck`)
- Frontend: JSDoc + schema.json for contracts
- Shared types in Arsenal packages when reused

## Comments

Only for non-obvious business logic. Code should be self-explanatory.

## Scope

- Do not refactor unrelated files
- Do not add abstractions for one-time use
- Do not over-engineer error handling for impossible paths
