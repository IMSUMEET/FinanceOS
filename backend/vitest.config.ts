import { defineConfig } from "vitest/config";

const threshold = 100;

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/csvAnalyze.ts", "src/categorize.ts", "src/openrouter.ts"],
      exclude: ["src/lambda.ts", "src/local.ts", "src/index.ts"],
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "./coverage",
      thresholds: {
        statements: threshold,
        branches: threshold,
        functions: threshold,
        lines: threshold,
      },
    },
  },
});
