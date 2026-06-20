import { describe, it, expect, vi, afterEach } from "vitest";
import {
  buildReportData,
  validateInsights,
  generateInsightsWithOpenRouter,
  fallbackInsights,
  mapToAllowedCategory,
  safeJsonParse,
} from "../src/openrouter.js";

describe("mapToAllowedCategory", () => {
  it("maps health and payment-related strings", () => {
    expect(mapToAllowedCategory("medical clinic")).toBe("Health");
    expect(mapToAllowedCategory("internal payment")).toBe("Transfers");
  });
});

describe("buildReportData branch coverage", () => {
  it("handles empty transactions and zero-income savings rate", () => {
    const report = buildReportData([]);
    expect(report.savingsRate).toBe(0);
    expect(report.period.start).toBe("");
  });

  it("uses finalCategory and merchant fallbacks", () => {
    const report = buildReportData([
      {
        id: "1",
        date: "2026-06-01",
        amount: -25,
        type: "expense",
        finalCategory: "Food",
        merchant: "",
        merchant_normalized: "",
      },
    ]);
    expect(report.topMerchants[0]?.merchant).toBe("Unknown");
    expect(report.totalExpenses).toBe(25);
  });

  it("sorts monthly trend, reuses merchant totals, and uses localCategory fallback", () => {
    const report = buildReportData([
      { id: "1", date: "2026-07-15", amount: 1000, type: "income", finalCategory: "Income", merchant: "Employer" },
      { id: "2", date: "2026-06-01", amount: -40, type: "expense", localCategory: "Food", merchant: "Cafe" },
      { id: "3", date: "2026-06-10", amount: -10, type: "expense", merchant: "Cafe" },
      { id: "4", date: "2026-07-20", amount: undefined, type: "expense", merchant: "Store" },
    ]);
    expect(report.monthlyTrend).toHaveLength(2);
    expect(report.monthlyTrend[0]?.month).toBe("2026-06");
    expect(report.monthlyTrend[1]?.month).toBe("2026-07");
    expect(report.topMerchants.find((m) => m.merchant === "Cafe")?.count).toBe(2);
  });
});

describe("validateInsights branch coverage", () => {
  it("falls back for NaN score values", () => {
    const report = buildReportData([]);
    const validated = validateInsights({ summary: "ok", score: Number.NaN, riskLevel: "low" }, report);
    expect(validated.score).toBe(70);
  });

  it("preserves valid observation and recommendation string fields", () => {
    const report = buildReportData([]);
    const validated = validateInsights(
      {
        summary: "ok",
        score: 75,
        riskLevel: "high",
        observations: [{
          title: "Spending",
          message: "High food spend",
          severity: "warning",
          category: "Food",
        }],
        recommendations: [{
          title: "Cut dining",
          message: "Cook more",
          impact: "high",
          estimatedMonthlySavings: 120,
        }],
        anomalies: [{
          title: "Large charge",
          message: "Unusual",
          severity: "critical",
          amount: 500,
        }],
      },
      report,
    );
    expect(validated.observations[0]?.title).toBe("Spending");
    expect(validated.recommendations[0]?.impact).toBe("high");
    expect(validated.anomalies[0]?.amount).toBe(500);
  });
});

describe("generateInsightsWithOpenRouter branch coverage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("handles fetch network failures", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "mock-key");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const report = buildReportData([]);
    const insights = await generateInsightsWithOpenRouter(report);
    expect(insights.summary).toContain("You had $");
  });

  it("uses custom model and app url env vars", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "mock-key");
    vi.stubEnv("OPENROUTER_MODEL", "custom/model");
    vi.stubEnv("APP_URL", "https://example.test");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              summary: "All good",
              score: 80,
              riskLevel: "low",
              observations: [],
              recommendations: [],
              anomalies: [],
            }),
          },
        }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const insights = await generateInsightsWithOpenRouter(buildReportData([]));
    expect(insights.summary).toBe("All good");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toContain("custom/model");
  });
});

describe("fallbackInsights", () => {
  it("returns structured defaults", () => {
    const report = buildReportData([
      { id: "1", date: "2026-06-01", amount: 100, type: "income", finalCategory: "Income", merchant: "Job" },
    ]);
    const insights = fallbackInsights(report);
    expect(insights.observations[0]?.category).toBe("Cash Flow");
    expect(insights.recommendations[0]?.impact).toBe("medium");
  });
});

describe("safeJsonParse branch coverage", () => {
  it("ignores malformed markdown fences", () => {
    expect(safeJsonParse("```not-json```")).toBeNull();
  });
});
