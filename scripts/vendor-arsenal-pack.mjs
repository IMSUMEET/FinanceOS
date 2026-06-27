#!/usr/bin/env node
/**
 * Pack Arsenal packages for vendor/arsenal with npm-compatible dependency specs.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "vendor/arsenal");
const sourceRoot =
  process.env.ARSENAL_PATH ||
  (fs.existsSync(path.join(root, "..", "Arsenal"))
    ? path.join(root, "..", "Arsenal")
    : path.join(root, "Arsenal"));

const packages = [
  {
    dir: "shared",
    name: "@oblivion-labs-dev/arsenal-shared",
    deps: { zod: "^3.24.2" },
  },
  {
    dir: "backend",
    name: "@oblivion-labs-dev/arsenal-backend",
    deps: {
      "@oblivion-labs-dev/arsenal-shared": "^0.1.0",
      zod: "^3.24.2",
    },
  },
  {
    dir: "frontend",
    name: "@oblivion-labs-dev/arsenal-frontend",
    deps: { "@oblivion-labs-dev/arsenal-shared": "^0.1.0" },
    peerDependencies: { react: ">=18" },
  },
];

fs.mkdirSync(outDir, { recursive: true });

for (const pkg of packages) {
  const srcDir = path.join(sourceRoot, "packages", pkg.dir);
  if (!fs.existsSync(path.join(srcDir, "dist/index.js"))) {
    console.error(`Missing built dist for ${pkg.name}. Run pnpm run build in Arsenal first.`);
    process.exit(1);
  }

  const stageDir = fs.mkdtempSync(path.join(os.tmpdir(), "arsenal-pack-"));
  try {
    fs.cpSync(srcDir, stageDir, { recursive: true });
    const pkgJson = JSON.parse(fs.readFileSync(path.join(stageDir, "package.json"), "utf8"));
    pkgJson.dependencies = pkg.deps;
    if (pkg.peerDependencies) {
      pkgJson.peerDependencies = pkg.peerDependencies;
    }
    delete pkgJson.devDependencies;
    fs.writeFileSync(path.join(stageDir, "package.json"), `${JSON.stringify(pkgJson, null, 2)}\n`);

    const before = fs.readdirSync(outDir);
    execSync("npm pack", { cwd: stageDir, stdio: "inherit" });
    const created = fs.readdirSync(stageDir).find((f) => f.endsWith(".tgz"));
    if (!created) {
      throw new Error(`npm pack did not produce a tarball for ${pkg.name}`);
    }
    const target = path.join(outDir, created);
    fs.copyFileSync(path.join(stageDir, created), target);
    console.log(`Wrote ${target}`);
    for (const file of fs.readdirSync(outDir)) {
      if (file.endsWith(".tgz") && !packages.some((p) => file.includes(p.dir))) {
        // keep only latest set; remove stale names if any
      }
    }
  } finally {
    fs.rmSync(stageDir, { recursive: true, force: true });
  }
}

console.log(`\nPacked ${packages.length} packages into ${outDir}`);
