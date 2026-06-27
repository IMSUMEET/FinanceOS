#!/usr/bin/env node
/**
 * FinanceOS Quality Gate — runs every check in strict order.
 * Any failure exits non-zero. No exceptions.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

const steps = [
  { name: "TypeScript", cmd: "npm run typecheck", cwd: root },
  { name: "ESLint", cmd: "npm run lint", cwd: root },
  { name: "Unit Tests", cmd: "npm test", cwd: root },
  { name: "Coverage", cmd: "npm run test:coverage", cwd: root },
  { name: "Contract Tests", cmd: "npm run test:contracts", cwd: root },
  { name: "Golden Tests", cmd: "npm run test:golden", cwd: root },
  { name: "Integration Tests", cmd: "npm run test:integration", cwd: root },
  { name: "Playwright", cmd: "npx playwright test --project=api-mock --project=ui", cwd: root },
  { name: "AI Evaluation Tests", cmd: "npm run test:evals", cwd: root },
  { name: "Build", cmd: "npm run build:check", cwd: root },
];

function runStep(step: { name: string; cmd: string; cwd: string }) {
  console.log(`\n${BOLD}▶ ${step.name}${RESET}`);
  const started = Date.now();
  const result = spawnSync(step.cmd, {
    cwd: step.cwd,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, CI: process.env.CI ?? "1" },
  });
  const durationMs = Date.now() - started;
  const ok = result.status === 0;
  console.log(
    ok
      ? `${GREEN}✓ ${step.name} (${(durationMs / 1000).toFixed(1)}s)${RESET}`
      : `${RED}✗ ${step.name} FAILED${RESET}`,
  );
  return { ...step, ok, durationMs };
}

console.log(`${BOLD}╔══════════════════════════════════════════╗${RESET}`);
console.log(`${BOLD}║       FinanceOS Quality Gate             ║${RESET}`);
console.log(`${BOLD}╚══════════════════════════════════════════╝${RESET}`);

fs.mkdirSync(path.join(root, "quality-reports"), { recursive: true });

const results = [];
for (const step of steps) {
  const result = runStep(step);
  results.push(result);
  if (!result.ok) {
    fs.writeFileSync(
      path.join(root, "quality-reports", "gate-results.json"),
      JSON.stringify({ passed: false, results, failedAt: step.name }, null, 2),
    );
    console.error(`\n${RED}${BOLD}Quality gate failed at: ${step.name}${RESET}\n`);
    process.exit(1);
  }
}

fs.writeFileSync(
  path.join(root, "quality-reports", "gate-results.json"),
  JSON.stringify({ passed: true, results }, null, 2),
);

console.log(`\n${GREEN}${BOLD}✓ Quality gate passed — all ${steps.length} steps.${RESET}\n`);
