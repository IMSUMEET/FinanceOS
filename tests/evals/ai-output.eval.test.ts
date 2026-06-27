import { describe, it, expect } from "vitest";
import {
  validateCoachSuggestions,
  validateInsights,
  fallbackCoachSuggestions,
  buildReportData,
} from "../../backend/src/openrouter.js";

const summary = {
  period: { start: "2026-01-01", end: "2026-06-01" },
  totalTransactions: 5,
  totalIncome: 4000,
  totalExpenses: 2500,
  netCashFlow: 1500,
  savingsRate: 37.5,
  topCategories: [{ category: "Food", total: 600 }],
  topMerchants: [{ merchant: "Whole Foods", total: 200 }],
};

function sampleReportData() {
  return buildReportData([
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
  ]);
}

describe("AI evaluation — coach suggestions", () => {
  it("sanitizes invalid shapes while preserving string messages", () => {
    const hallucinated = [
      {
        title: "Cancel FakeCorp",
        message: "You spend $900/mo at FakeCorp which is not in your data.",
        impact: "high",
        estimatedMonthlySavings: 900,
      },
      { title: "A", message: "B", impact: "low", estimatedMonthlySavings: 5 },
      { title: "C", message: "D", impact: "medium", estimatedMonthlySavings: 10 },
    ];
    const validated = validateCoachSuggestions(hallucinated, summary);
    expect(validated).toHaveLength(3);
    expect(validated[0].impact).toBe("high");
    expect(validated[0].estimatedMonthlySavings).toBe(900);
  });

  it("sanitizes invalid JSON shapes to exactly 3 suggestions", () => {
    const validated = validateCoachSuggestions({ not: "array" }, summary);
    expect(validated).toHaveLength(3);
    expect(validated[0].title).toBeTruthy();
  });

  it("never returns duplicate recommendation titles from fallback", () => {
    const { suggestions } = fallbackCoachSuggestions(summary);
    const titles = suggestions.map((s) => s.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("sanitizes invalid impact enum to fallback values", () => {
    const raw = [
      { title: "T1", message: "M1", impact: "critical", estimatedMonthlySavings: 10 },
      { title: "T2", message: "M2", impact: "medium", estimatedMonthlySavings: 20 },
      { title: "T3", message: "M3", impact: "high", estimatedMonthlySavings: 30 },
    ];
    const validated = validateCoachSuggestions(raw, summary);
    expect(validated.every((s) => ["low", "medium", "high"].includes(s.impact))).toBe(true);
  });
});

describe("AI evaluation — static insights", () => {
  it("validates risk score within 0-100", () => {
    const reportData = sampleReportData();
    const insights = validateInsights(
      {
        summary: "Test summary",
        score: 150,
        riskLevel: "low",
        observations: [],
        recommendations: [],
        anomalies: [],
      },
      reportData,
    );
    expect(insights.score).toBeLessThanOrEqual(100);
    expect(insights.score).toBeGreaterThanOrEqual(0);
  });

  it("rejects invalid riskLevel values", () => {
    const reportData = sampleReportData();
    const insights = validateInsights(
      {
        summary: "Test",
        score: 50,
        riskLevel: "critical",
        observations: [],
        recommendations: [],
        anomalies: [],
      },
      reportData,
    );
    expect(["low", "medium", "high"]).toContain(insights.riskLevel);
  });

  it("caps recommendation count and validates impact enum", () => {
    const reportData = sampleReportData();
    const insights = validateInsights(
      {
        summary: "Test",
        score: 70,
        riskLevel: "medium",
        observations: [{ title: "O", message: "M", severity: "info" }],
        recommendations: Array.from({ length: 10 }, (_, i) => ({
          title: `R${i}`,
          message: "msg",
          impact: "invalid",
          estimatedMonthlySavings: 5,
        })),
        anomalies: [],
      },
      reportData,
    );
    expect(insights.recommendations.length).toBeLessThanOrEqual(3);
    for (const rec of insights.recommendations) {
      expect(["low", "medium", "high"]).toContain(rec.impact);
    }
  });
});
