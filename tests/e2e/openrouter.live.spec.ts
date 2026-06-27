import fs from "node:fs/promises";
import path from "node:path";
import { test, expect } from "@playwright/test";

const sampleCsvPath = path.resolve("tests/e2e/fixtures/sample.csv");

test.describe("OpenRouter live @live", () => {
  test.beforeAll(() => {
    test.skip(
      !process.env.OPENROUTER_API_KEY,
      "Set OPENROUTER_API_KEY to run live OpenRouter tests",
    );
    test.skip(
      process.env.OPENROUTER_LIVE !== "1",
      "Set OPENROUTER_LIVE=1 to run live OpenRouter tests",
    );
  });

  test("POST /api/ai-analyze/ returns local categorization and static insights", async ({
    request,
  }) => {
    const csv = await fs.readFile(sampleCsvPath, "utf8");

    const res = await request.post("/api/ai-analyze", {
      headers: { "Content-Type": "text/csv" },
      data: csv,
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();

    expect(body.status).toBe("success");
    expect(body.aiStatus.categorization).toBe("local");
    expect(body.aiStatus.insights).toBe("static");
    expect(body.insights.summary.length).toBeGreaterThan(20);
    expect(body.insights.summary).toContain("income");
    expect(typeof body.insights.score).toBe("number");
  });
});
