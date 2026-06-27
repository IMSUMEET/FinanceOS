import { defineConfig } from "vitest/config";

const threshold = 90;

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    reporters: ["default", ["junit", { outputFile: "coverage/junit.xml" }]],
    coverage: {
      provider: "v8",
      include: ["src/csvAnalyze.ts", "src/categorize.ts", "src/openrouter.ts"],
      exclude: ["src/lambda.ts", "src/local.ts", "src/index.ts"],
      reporter: ["text", "json-summary", "html", "lcov"],
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
