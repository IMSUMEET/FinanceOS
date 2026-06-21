#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COVERAGE_THRESHOLD } from "./coverage-threshold.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

function run(label, command, args, cwd = root) {
  console.log(`\n${BOLD}${DIM}▶ ${label}${RESET}`);
  const result = spawnSync(command, args, { cwd, stdio: "inherit", shell: true });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`\n${BOLD}FinanceOS build${RESET}`);

run(`Coverage gate (${COVERAGE_THRESHOLD}%)`, "node", ["scripts/coverage-report.mjs"], root);
run("Backend typecheck", "npm", ["run", "typecheck"], path.join(root, "backend"));
run("Backend bundle", "npm", ["run", "build"], path.join(root, "backend"));
run("Frontend production build", "npm", ["run", "build"], path.join(root, "frontend/web"));

console.log(`\n${GREEN}${BOLD}✓ Build complete — all checks passed.${RESET}\n`);
