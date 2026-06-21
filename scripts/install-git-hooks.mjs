#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const gitDir = path.join(root, ".git");

if (!fs.existsSync(gitDir)) {
  console.log("install-git-hooks: skip (not a git repository)");
  process.exit(0);
}

const src = path.join(__dirname, "git-hooks", "pre-push");
const dest = path.join(gitDir, "hooks", "pre-push");

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);

try {
  fs.chmodSync(dest, 0o755);
} catch {
  /* Windows may ignore mode */
}

console.log("Installed git pre-push hook → runs npm run test:coverage before push");
