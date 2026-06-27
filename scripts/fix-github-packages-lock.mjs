#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cache = path.join(root, ".pack-cache");

const packages = [
  {
    name: "@oblivion-labs-dev/arsenal-shared",
    tgz: "oblivion-labs-dev-arsenal-shared-0.1.0.tgz",
    deps: { zod: "^3.24.2" },
  },
  {
    name: "@oblivion-labs-dev/arsenal-backend",
    tgz: "oblivion-labs-dev-arsenal-backend-0.1.0.tgz",
    deps: {
      "@oblivion-labs-dev/arsenal-shared": "^0.1.0",
      zod: "^3.24.2",
    },
  },
  {
    name: "@oblivion-labs-dev/arsenal-frontend",
    tgz: "oblivion-labs-dev-arsenal-frontend-0.1.0.tgz",
    deps: {
      "@oblivion-labs-dev/arsenal-shared": "^0.1.0",
    },
    peerDependencies: { react: ">=18" },
  },
];

function packMeta(tgzPath) {
  const json = execSync(`npm pack "${tgzPath}" --json`, {
    cwd: path.dirname(tgzPath),
    encoding: "utf8",
  });
  const [meta] = JSON.parse(json);
  fs.unlinkSync(path.join(path.dirname(tgzPath), meta.filename));
  return meta;
}

const registryEntries = Object.fromEntries(
  packages.map((pkg) => {
    const meta = packMeta(path.join(cache, pkg.tgz));
    const entry = {
      version: meta.version,
      resolved: `https://npm.pkg.github.com/download/${pkg.name}/${meta.version}/${meta.shasum}`,
      integrity: meta.integrity,
    };
    if (pkg.deps) entry.dependencies = pkg.deps;
    if (pkg.peerDependencies) entry.peerDependencies = pkg.peerDependencies;
    return [`node_modules/${pkg.name}`, entry];
  }),
);

function patchLock(lockPath, packageNames) {
  const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));

  for (const key of Object.keys(lock.packages)) {
    if (key.includes("Arsenal/packages") || key.includes(".pack-cache")) {
      delete lock.packages[key];
    }
  }

  for (const name of packageNames) {
    delete lock.packages[`node_modules/${name}`];
  }

  for (const [key, entry] of Object.entries(registryEntries)) {
    if (packageNames.some((n) => key.endsWith(n))) {
      lock.packages[key] = entry;
    }
  }

  fs.writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
  console.log(`Patched ${lockPath}`);
}

patchLock(path.join(root, "backend/package-lock.json"), [
  "@oblivion-labs-dev/arsenal-backend",
  "@oblivion-labs-dev/arsenal-shared",
]);

patchLock(path.join(root, "frontend/web/package-lock.json"), [
  "@oblivion-labs-dev/arsenal-frontend",
  "@oblivion-labs-dev/arsenal-shared",
]);
