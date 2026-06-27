#!/usr/bin/env node
/**
 * CI/Vercel install: link Arsenal via vendored tarballs or a local checkout.
 * Vendored tarballs avoid GitHub Packages 403 and private-repo checkout in CI.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARSENAL_REPO = "https://github.com/Oblivion-Labs-Dev/Arsenal.git";
const ARSENAL_REF = process.env.ARSENAL_REF || "feat/initial-monorepo";
const VENDOR_DIR = path.join(root, "vendor/arsenal");
const VENDOR_PACKAGES = {
  "@oblivion-labs-dev/arsenal-shared": "oblivion-labs-dev-arsenal-shared-0.1.0.tgz",
  "@oblivion-labs-dev/arsenal-backend": "oblivion-labs-dev-arsenal-backend-0.1.0.tgz",
  "@oblivion-labs-dev/arsenal-frontend": "oblivion-labs-dev-arsenal-frontend-0.1.0.tgz",
};

const args = process.argv.slice(2);
const cloneArsenal = args.includes("--clone-arsenal");
const skipRoot = args.includes("--skip-root");
const prefixOnly = args.includes("--prefix")
  ? args[args.indexOf("--prefix") + 1]
  : null;

function hasVendorTarballs() {
  return Object.values(VENDOR_PACKAGES).every((tgz) =>
    fs.existsSync(path.join(VENDOR_DIR, tgz)),
  );
}

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

function toFileDep(baseDir, targetPath) {
  const rel = path.relative(baseDir, targetPath);
  return `file:${rel.split(path.sep).join("/")}`;
}

function arsenalDep(baseDir, name, arsenalPath, useVendor) {
  if (useVendor) {
    return toFileDep(baseDir, path.join(VENDOR_DIR, VENDOR_PACKAGES[name]));
  }
  const short = name.replace("@oblivion-labs-dev/arsenal-", "");
  return toFileDep(baseDir, path.join(arsenalPath, "packages", short));
}

function installPrefix(prefix, arsenalPath, useVendor) {
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

  if (useVendor) {
    const overrides = { ...(pkg.overrides || {}) };
    for (const [name] of Object.entries(VENDOR_PACKAGES)) {
      overrides[name] = arsenalDep(dir, name, arsenalPath, true);
    }
    pkg.overrides = overrides;
  }

  for (const name of arsenalDeps) {
    pkg.dependencies[name] = arsenalDep(dir, name, arsenalPath, useVendor);
  }

  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  try {
    console.log(`Installing ${prefix} with local Arsenal deps...`);
    execSync("npm install", { cwd: dir, stdio: "inherit" });
  } finally {
    fs.writeFileSync(pkgPath, original);
  }
}

function main() {
  const useVendor = hasVendorTarballs();
  let arsenalPath = null;

  if (useVendor) {
    console.log("Using vendored Arsenal tarballs from vendor/arsenal/");
  } else {
    arsenalPath = resolveArsenalPath();
    if (!arsenalPath && cloneArsenal) {
      arsenalPath = path.join(root, "Arsenal");
      cloneArsenalRepo(arsenalPath);
    }
    if (!arsenalPath) {
      console.error(
        "Arsenal not found. Commit vendor/arsenal tarballs, set ARSENAL_PATH, or pass --clone-arsenal.",
      );
      process.exit(1);
    }
    buildArsenal(arsenalPath);
  }

  if (!skipRoot) {
    console.log("Installing root dependencies...");
    execSync("npm ci", { cwd: root, stdio: "inherit" });
  }

  const prefixes = prefixOnly ? [prefixOnly] : ["backend", "frontend/web"];
  for (const prefix of prefixes) {
    installPrefix(prefix, arsenalPath, useVendor);
  }
}

main();
