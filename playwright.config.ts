import { defineConfig, devices } from "@playwright/test";

const apiBaseURL = process.env.PLAYWRIGHT_API_URL ?? "http://127.0.0.1:3001";
const webBaseURL = process.env.PLAYWRIGHT_WEB_URL ?? "http://127.0.0.1:5173";
const useLiveOpenRouter = process.env.OPENROUTER_LIVE === "1";

const backendEnv = useLiveOpenRouter
  ? { ...process.env }
  : {
      ...process.env,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? "playwright-mock-key",
      OPENROUTER_API_URL:
        process.env.OPENROUTER_API_URL ?? "http://127.0.0.1:19999/v1/chat/completions",
    };

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  globalSetup: useLiveOpenRouter ? undefined : "./tests/e2e/global-setup.ts",
  globalTeardown: useLiveOpenRouter ? undefined : "./tests/e2e/global-teardown.ts",
  webServer: [
    {
      command: "npm run dev",
      cwd: "./backend",
      url: `${apiBaseURL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: backendEnv,
    },
    {
      command: "npm run dev:e2e",
      cwd: "./frontend/web",
      url: webBaseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        ...process.env,
        E2E: "1",
        VITE_USE_MOCK: "true",
        VITE_API_BASE_URL: "",
        VITE_AI_ANALYZER_URL: "",
      },
    },
  ],
  projects: [
    {
      name: "api-mock",
      testMatch: [/lambda-.*\.spec\.ts/, /api-.*\.spec\.ts/],
      grepInvert: /@live/,
      use: { baseURL: apiBaseURL },
    },
    {
      name: "ui",
      testMatch: /ui.*\.spec\.ts/,
      use: {
        baseURL: webBaseURL,
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "openrouter-live",
      testMatch: /.*\.spec\.ts/,
      grep: /@live/,
      use: { baseURL: apiBaseURL },
    },
  ],
});
