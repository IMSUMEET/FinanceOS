import { defineConfig, devices } from "@playwright/test";

const vercelUrl =
  process.env.VERCEL_PREVIEW_URL ??
  process.env.PLAYWRIGHT_WEB_URL ??
  "https://finance-os-git-feat-ai-reports-lambda-oblivion-labs.vercel.app";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "vercel-upload-debug.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  reporter: [["list"]],
  use: {
    baseURL: vercelUrl,
    trace: "on-first-retry",
    screenshot: "off",
    ...devices["Desktop Chrome"],
  },
});
