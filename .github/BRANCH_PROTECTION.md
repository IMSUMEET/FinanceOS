# Main branch protection (90% coverage)

CI enforces **≥ 90%** coverage (lines, statements, functions, branches) on scoped modules in backend and frontend before build.

## GitHub rules (one-time setup)

1. Open **Settings → Rules → Rulesets** (or **Branches → Branch protection**).
2. Target branch: **`main`**.
3. Enable **Require status checks to pass before merging**.
4. Required checks:
   - `Coverage gate (90%)`
   - `Build` (optional if you only want coverage; build job already depends on coverage)
5. Recommended: **Require pull request before merging** for `main`.

## Local enforcement

- **`npm run build`** — runs coverage gate first, then typecheck + builds.
- **`npm run test:coverage`** — coverage only.
- **Git pre-push hook** — installed via `npm install` (`prepare` script). Runs `test:coverage` before every `git push`.

To reinstall hooks manually:

```bash
npm run setup:hooks
```

## Threshold source of truth

`scripts/coverage-threshold.mjs` (`COVERAGE_THRESHOLD = 90`), mirrored in:

- `backend/vitest.config.ts`
- `frontend/web/vitest.config.js`
- `scripts/coverage-report.mjs`
