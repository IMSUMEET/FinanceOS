import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  normalizeAnalyzeSnapshot,
  readFixture,
  readGoldenExpected,
  writeGoldenExpected,
} from "../helpers/schema-validator.js";

const UPDATE_GOLDEN = process.env.UPDATE_GOLDEN === "1";

describe("Golden — CSV analyze (Chase export)", () => {
  beforeEach(() => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("POST /api/analyze matches golden snapshot for sample-chase.csv", async () => {
    const { app } = await import("../../backend/src/index.js");
    const csv = readFixture("sample-chase.csv");
    const formData = new FormData();
    formData.append("files", new File([csv], "sample-chase.csv", { type: "text/csv" }));

    const res = await app.request("/api/analyze", { method: "POST", body: formData });
    expect(res.status).toBe(200);
    const body = await res.json();
    const snapshot = normalizeAnalyzeSnapshot(body);

    if (UPDATE_GOLDEN) {
      writeGoldenExpected("analyze-chase-sample.json", snapshot);
    }

    const expected = readGoldenExpected<typeof snapshot>("analyze-chase-sample.json");
    expect(snapshot).toEqual(expected);
  });
});

describe("Golden — report data & insights", () => {
  it("buildReportData produces stable totals for fixture transactions", async () => {
    const { buildReportData, generateStaticInsights } =
      await import("../../backend/src/openrouter.js");
    const rows = [
      {
        date: "2026-06-01",
        merchant: "Whole Foods",
        amount: -42.5,
        type: "expense",
        finalCategory: "Food",
      },
      {
        date: "2026-06-02",
        merchant: "Payroll",
        amount: 3200,
        type: "income",
        finalCategory: "Income",
      },
      {
        date: "2026-06-03",
        merchant: "Netflix",
        amount: -15.99,
        type: "expense",
        finalCategory: "Entertainment",
      },
    ];
    const report = buildReportData(rows);
    expect(report.totalIncome).toBe(3200);
    expect(report.totalExpenses).toBe(58);
    expect(report.netCashFlow).toBe(3142);
    expect(report.savingsRate).toBeCloseTo(98.2, 1);

    const insights = generateStaticInsights(report);
    expect(insights.score).toBeGreaterThan(0);
    expect(insights.riskLevel).toMatch(/^(low|medium|high)$/);
    expect(insights.observations.length).toBeGreaterThan(0);
    expect(insights.recommendations.length).toBeGreaterThan(0);
  });

  it("fallback coach suggestions match golden shape", async () => {
    const { fallbackCoachSuggestions } = await import("../../backend/src/openrouter.js");
    const summary = (await import("../fixtures/coach-summary.json", { assert: { type: "json" } }))
      .default;
    const result = fallbackCoachSuggestions(summary);
    expect(result.suggestions).toHaveLength(3);
    expect(result.source).toBe("fallback");
    const impacts = result.suggestions.map((s) => s.impact).sort();
    expect(impacts.every((i) => ["low", "medium", "high"].includes(i))).toBe(true);
  });
});
