#!/usr/bin/env bash
set -euo pipefail

REPO="${GITHUB_REPO:-Oblivion-Labs-Dev/FinanceOS}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RULESET_FILE="${SCRIPT_DIR}/../.github/rulesets/main-branch.json"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required. Install from https://cli.github.com/"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Run 'gh auth login' before applying rulesets."
  exit 1
fi

existing="$(gh api "repos/${REPO}/rulesets" --jq '.[].name' 2>/dev/null || true)"
if echo "${existing}" | grep -qx "Protect main"; then
  ruleset_id="$(gh api "repos/${REPO}/rulesets" --jq '.[] | select(.name == "Protect main") | .id')"
  echo "Updating existing ruleset (id=${ruleset_id})..."
  gh api "repos/${REPO}/rulesets/${ruleset_id}" --method PUT --input "${RULESET_FILE}"
else
  echo "Creating ruleset for ${REPO}..."
  gh api "repos/${REPO}/rulesets" --method POST --input "${RULESET_FILE}"
fi

echo "Done. Verify at: https://github.com/${REPO}/settings/rules"
