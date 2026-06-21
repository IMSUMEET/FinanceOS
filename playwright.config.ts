import { defineConfig } from "@playwright/test";

const apiBaseURL = process.env.PLAYWRIGHT_API_URL ?? "http://127.0.0.1:3001";
const useLiveOpenRouter = process.env.OPENROUTER_LIVE === "1";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  globalSetup: useLiveOpenRouter ? undefined : "./e2e/global-setup.ts",
  globalTeardown: useLiveOpenRouter ? undefined : "./e2e/global-teardown.ts",
  use: {
    baseURL: apiBaseURL,
  },
  webServer: {
    command: "npm run dev",
    cwd: "./backend",
    url: `${apiBaseURL}/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: useLiveOpenRouter
      ? { ...process.env }
      : {
          ...process.env,
          OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? "playwright-mock-key",
          OPENROUTER_API_URL:
            process.env.OPENROUTER_API_URL ?? "http://127.0.0.1:19999/v1/chat/completions",
        },
  },
  projects: [
    {
      name: "api-mock",
      testMatch: /.*\.spec\.ts/,
      grepInvert: /@live/,
    },
    {
      name: "openrouter-live",
      testMatch: /.*\.spec\.ts/,
      grep: /@live/,
    },
  ],
});
