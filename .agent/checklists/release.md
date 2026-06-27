# Release Checklist

- [ ] `main` quality gate green
- [ ] `docs/CHANGELOG.md` updated
- [ ] Version bumps if applicable
- [ ] `npm run build:check` passes
- [ ] E2E smoke pass (`npm run test:e2e`)
- [ ] Deploy docs reviewed (`backend/README-deploy.md`)
- [ ] No `@live` tests required for release (mock gate sufficient)
