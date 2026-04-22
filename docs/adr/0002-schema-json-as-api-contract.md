# ADR-0002: `schema.json` as the API Contract, with a Mock Provider Switch

- **Status**: Accepted
- **Date**: 2026-04-19
- **Deciders**: Akshay Borse

## Context

The frontend and backend are being built by different people (and different time zones). Without a shared contract, every endpoint becomes a back-and-forth: the frontend stubs a shape, the backend ships a slightly different shape, the frontend adapts, repeat.

We also wanted the frontend to be runnable end-to-end **without** the backend running. That meant a mock data provider was non-optional.

## Decision

We will treat [`frontend/web/src/types/schema.json`](../../frontend/web/src/types/schema.json) as the single source of truth for all request and response shapes. Both sides of the wire must agree with it.

Concrete rules:

- All endpoint paths are registered in [`frontend/web/src/api/endpoints.js`](../../frontend/web/src/api/endpoints.js).
- All HTTP traffic goes through [`frontend/web/src/api/client.js`](../../frontend/web/src/api/client.js); the UI never calls `fetch` directly.
- Each domain has a service module under [`frontend/web/src/services/`](../../frontend/web/src/services) that branches on `USE_MOCK`. In mock mode it returns local fixtures; in live mode it calls `apiClient`.
- The flag is `VITE_USE_MOCK`. With no `VITE_API_BASE_URL` set, mock mode is the default — local dev "just works".
- Adding or changing an endpoint requires updating `schema.json`, `examples.json`, `endpoints.js`, the service module, and [`frontend/web/src/types/README.md`](../../frontend/web/src/types/README.md) **in the same PR**.

## Consequences

Positive:

- The frontend can ship features the backend hasn't built yet. The mock layer is explicit, not a forgotten stub.
- Backend engineers have one document to read instead of grepping the React code.
- Switching between mock and live data is a single env-var change.
- Optimistic mutations are easy because the service layer hides the difference.

Negative:

- The contract can drift if reviewers don't enforce the "update everything in one PR" rule. Mitigation: PR template asks "Backend impact?" explicitly.
- Two implementations of every endpoint (mock + live) until the backend is complete. Mitigation: mock implementations are intentionally tiny and reuse the same fixtures.
- JSON Schema is verbose. Accepted — the explicitness pays off when handing over to backend engineers.

## Alternatives considered

- **OpenAPI / Swagger generated from the backend** — requires the backend to exist first, and forces the frontend to wait. Rejected for v1; we may regenerate from a backend `openapi.json` later as a verification step.
- **TypeScript types as the contract** — we don't use TypeScript in this repo (separate decision), and types alone don't validate runtime payloads.
- **MSW (Mock Service Worker)** — adds a service worker layer for what we can do with a function-level branch. Reconsider when we want to mock at the network layer for tests.

## References

- [`backend-contract`](../../skills/backend-contract/SKILL.md) skill
- [`architecture/backend.md`](../architecture/backend.md)
- [`frontend/web/src/types/README.md`](../../frontend/web/src/types/README.md)
