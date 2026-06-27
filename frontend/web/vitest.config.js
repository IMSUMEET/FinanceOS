import { defineConfig } from "vitest/config";

const threshold = 90;

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["src/test/setup.js"],
    reporters: ["default", ["junit", { outputFile: "coverage/junit.xml" }]],
    coverage: {
      provider: "v8",
      include: [
        "src/utils/format.js",
        "src/utils/categories.js",
        "src/utils/categorize.js",
        "src/utils/analysisSummary.js",
        "src/utils/mortgageCalculations.js",
        "src/utils/houseSaleCalculations.js",
        "src/utils/houseSaleChartData.js",
        "src/utils/personality.js",
      ],
      exclude: ["src/utils/**/*.test.js", "src/utils/csvParser.js"],
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
