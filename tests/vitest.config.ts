import path from "node:path";
import { defineConfig } from "vitest/config";

const root = path.resolve(__dirname, "..");

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "tests/contracts/**/*.test.ts",
      "tests/golden/**/*.test.ts",
      "tests/evals/**/*.test.ts",
      "tests/integration/**/*.test.ts",
    ],
    reporters: ["default", ["junit", { outputFile: "quality-reports/junit-cross-cutting.xml" }]],
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@backend": path.join(root, "backend/src"),
    },
  },
});
