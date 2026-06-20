#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const PACKAGES = [
  { label: "Backend", dir: "backend", accent: "\x1b[36m" },
  { label: "Frontend", dir: "frontend/web", accent: "\x1b[35m" },
];

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";

function bar(pct, width = 24) {
  const filled = Math.round((pct / 100) * width);
  const color = pct >= 100 ? GREEN : pct >= 90 ? GREEN : pct >= 75 ? YELLOW : RED;
  return `${color}${"█".repeat(filled)}${DIM}${"░".repeat(Math.max(0, width - filled))}${RESET}`;
}

function fmtPct(pct) {
  const color = pct >= 100 ? GREEN : pct >= 90 ? GREEN : pct >= 75 ? YELLOW : RED;
  return `${color}${pct.toFixed(1).padStart(5)}%${RESET}`;
}

function readSummary(packageDir) {
  const summaryPath = path.join(root, packageDir, "coverage", "coverage-summary.json");
  if (!fs.existsSync(summaryPath)) return null;
  return JSON.parse(fs.readFileSync(summaryPath, "utf8"));
}

function runCoverage({ label, dir }) {
  console.log(`\n${BOLD}${DIM}▶ Running ${label} tests with coverage…${RESET}`);
  const result = spawnSync("npm", ["test", "--", "--coverage"], {
    cwd: path.join(root, dir),
    stdio: "inherit",
    shell: true,
  });
  return result.status === 0;
}

function printPackageReport({ label, accent }, summary) {
  const total = summary.total;
  const metrics = [
    ["Lines", total.lines.pct],
    ["Statements", total.statements.pct],
    ["Functions", total.functions.pct],
    ["Branches", total.branches.pct],
  ];

  console.log(`\n${accent}${BOLD}  ${label}${RESET}`);
  console.log(`  ${"─".repeat(52)}`);

  for (const [name, pct] of metrics) {
    console.log(`  ${name.padEnd(12)} ${bar(pct)} ${fmtPct(pct)}`);
  }

  const files = Object.entries(summary)
    .filter(([key]) => key !== "total")
    .map(([file, data]) => ({ file: path.basename(file), pct: data.lines.pct }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 5);

  if (files.length) {
    console.log(`\n  ${DIM}Lowest line coverage:${RESET}`);
    for (const { file, pct } of files) {
      console.log(`    ${file.padEnd(28)} ${fmtPct(pct)}`);
    }
  }
}

function printHeader() {
  console.log(`\n${BOLD}╔══════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}║${RESET}           ${BOLD}FinanceOS Coverage Report${RESET}                 ${BOLD}║${RESET}`);
  console.log(`${BOLD}║${RESET}           ${DIM}minimum threshold: 100% all metrics${RESET}     ${BOLD}║${RESET}`);
  console.log(`${BOLD}╚══════════════════════════════════════════════════════╝${RESET}`);
}

function printFooter(allPassed, summaries) {
  const overall = summaries.map((s) => s.summary.total);
  const avg = (key) =>
    overall.reduce((sum, t) => sum + t[key].pct, 0) / overall.length;

  console.log(`\n${BOLD}  Overall (package average)${RESET}`);
  console.log(`  ${"─".repeat(52)}`);
  console.log(`  Lines        ${bar(avg("lines"))} ${fmtPct(avg("lines"))}`);
  console.log(`  Statements   ${bar(avg("statements"))} ${fmtPct(avg("statements"))}`);
  console.log(`  Functions    ${bar(avg("functions"))} ${fmtPct(avg("functions"))}`);
  console.log(`  Branches     ${bar(avg("branches"))} ${fmtPct(avg("branches"))}`);

  console.log(`\n  ${DIM}HTML reports:${RESET}`);
  for (const { dir } of PACKAGES) {
    console.log(`    ${path.join(dir, "coverage", "index.html")}`);
  }

  if (allPassed) {
    console.log(`\n${GREEN}${BOLD}  ✓ All packages meet the 100% coverage threshold.${RESET}\n`);
  } else {
    console.log(`\n${RED}${BOLD}  ✗ Coverage below threshold or tests failed.${RESET}\n`);
    process.exit(1);
  }
}

printHeader();

const results = [];
for (const pkg of PACKAGES) {
  const ok = runCoverage(pkg);
  const summary = readSummary(pkg.dir);
  results.push({ pkg, ok, summary });
}

const allPassed = results.every((r) => r.ok && r.summary);
if (!allPassed) {
  console.error(`\n${RED}Coverage run failed.${RESET}`);
  process.exit(1);
}

for (const { pkg, summary } of results) {
  printPackageReport(pkg, summary);
}

printFooter(true, results);
