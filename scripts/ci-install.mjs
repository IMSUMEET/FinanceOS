#!/usr/bin/env node
/**
 * CI/Vercel install: build Arsenal from source and link via file: overrides.
 * Avoids GitHub Packages 403 when FinanceOS lacks read_package access.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARSENAL_REPO = "https://github.com/Oblivion-Labs-Dev/Arsenal.git";
const ARSENAL_REF = process.env.ARSENAL_REF || "feat/initial-monorepo";

const args = process.argv.slice(2);
const cloneArsenal = args.includes("--clone-arsenal");
const skipRoot = args.includes("--skip-root");
const prefixOnly = args.includes("--prefix")
  ? args[args.indexOf("--prefix") + 1]
  : null;

function resolveArsenalPath() {
  if (process.env.ARSENAL_PATH) {
    return path.resolve(process.env.ARSENAL_PATH);
  }
  for (const candidate of [path.join(root, "Arsenal"), path.join(root, "..", "Arsenal")]) {
    if (fs.existsSync(path.join(candidate, "packages/shared/package.json"))) {
      return candidate;
    }
  }
  return null;
}

function cloneArsenalRepo(target) {
  if (fs.existsSync(path.join(target, "packages/shared/package.json"))) {
    console.log(`Arsenal already present at ${target}`);
    return;
  }
  console.log(`Cloning Arsenal (${ARSENAL_REF}) to ${target}...`);
  execSync(`git clone --depth 1 --branch ${ARSENAL_REF} ${ARSENAL_REPO} "${target}"`, {
    stdio: "inherit",
  });
}

function buildArsenal(arsenalPath) {
  const packages = ["shared", "backend", "frontend"];
  const allBuilt = packages.every((name) =>
    fs.existsSync(path.join(arsenalPath, "packages", name, "dist", "index.js")),
  );
  if (allBuilt) {
    console.log(`Arsenal already built at ${arsenalPath}, skipping build.`);
    return;
  }

  console.log(`Building Arsenal at ${arsenalPath}...`);
  try {
    execSync("pnpm --version", { stdio: "ignore" });
  } catch {
    execSync("corepack enable", { stdio: "inherit" });
  }
  execSync("pnpm install --frozen-lockfile", { cwd: arsenalPath, stdio: "inherit" });
  execSync("pnpm run build", { cwd: arsenalPath, stdio: "inherit" });
}

function arsenalFileDep(baseDir, arsenalPath, pkg) {
  const rel = path.relative(baseDir, path.join(arsenalPath, "packages", pkg));
  return `file:${rel.split(path.sep).join("/")}`;
}

function installPrefix(prefix, arsenalPath) {
  const dir = path.join(root, prefix);
  const pkgPath = path.join(dir, "package.json");
  const original = fs.readFileSync(pkgPath, "utf8");
  const pkg = JSON.parse(original);

  const arsenalDeps = Object.keys(pkg.dependencies || {}).filter((name) =>
    name.startsWith("@oblivion-labs-dev/arsenal-"),
  );

  if (!arsenalDeps.length) {
    console.log(`Installing ${prefix}...`);
    execSync("npm install", { cwd: dir, stdio: "inherit" });
    return;
  }

  const overrides = { ...(pkg.overrides || {}) };
  for (const name of arsenalDeps) {
    const short = name.replace("@oblivion-labs-dev/arsenal-", "");
    pkg.dependencies[name] = arsenalFileDep(dir, arsenalPath, short);
  }

  pkg.overrides = overrides;
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  try {
    console.log(`Installing ${prefix} with local Arsenal file deps...`);
    execSync("npm install", { cwd: dir, stdio: "inherit" });
  } finally {
    fs.writeFileSync(pkgPath, original);
  }
}

function main() {
  let arsenalPath = resolveArsenalPath();
  if (!arsenalPath && cloneArsenal) {
    arsenalPath = path.join(root, "Arsenal");
    cloneArsenalRepo(arsenalPath);
  }
  if (!arsenalPath) {
    console.error(
      "Arsenal not found. Set ARSENAL_PATH, checkout to Arsenal/, or pass --clone-arsenal.",
    );
    process.exit(1);
  }

  buildArsenal(arsenalPath);

  if (!skipRoot) {
    console.log("Installing root dependencies...");
    execSync("npm ci", { cwd: root, stdio: "inherit" });
  }

  const prefixes = prefixOnly ? [prefixOnly] : ["backend", "frontend/web"];
  for (const prefix of prefixes) {
    installPrefix(prefix, arsenalPath);
  }
}

main();
