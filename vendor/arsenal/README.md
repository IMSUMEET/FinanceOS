# Vendored Arsenal packages

Pre-built npm tarballs for `@oblivion-labs-dev/arsenal-*@0.1.0`.

CI and Vercel install these via `scripts/ci-install.mjs` so FinanceOS does not need
GitHub Packages read access or a cross-repo checkout of the private Arsenal repo.

Regenerate after Arsenal changes:

```bash
cd Arsenal && pnpm run build
cd ../FinanceOS
node scripts/vendor-arsenal-pack.mjs
```
