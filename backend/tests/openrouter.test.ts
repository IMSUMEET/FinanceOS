import { describe, it, expect, vi, afterEach } from "vitest";
import {
  buildReportData,
  validateInsights,
  generateInsightsWithOpenRouter,
  generateStaticInsights,
  buildStaticInsightsPrompt,
  buildEnrichedFinancialSummary,
  buildInsightsLlmPrompt,
  fallbackInsights,
  mapToAllowedCategory,
  safeJsonParse,
  fallbackCoachSuggestions,
  validateCoachSuggestions,
  generateCoachSuggestionsWithOpenRouter,
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

  it("pads recommendations to exactly three items", () => {
    const report = buildReportData([
      { id: "1", date: "2026-06-01", amount: 1000, type: "income", finalCategory: "Income", merchant: "Job" },
      { id: "2", date: "2026-06-02", amount: -50, type: "expense", finalCategory: "Food", merchant: "Cafe" },
    ]);
    const validated = validateInsights(
      {
        summary: "ok",
        score: 60,
        riskLevel: "low",
        recommendations: [{ title: "Only one", message: "Trim food", impact: "medium", estimatedMonthlySavings: 5 }],
      },
      report,
    );
    expect(validated.recommendations).toHaveLength(3);
    expect(validated.recommendations[0]?.title).toBe("Only one");
  });

  it("preserves recommendation breakdown arrays from LLM output", () => {
    const report = buildReportData([
      { id: "1", date: "2026-06-01", amount: 1000, type: "income", finalCategory: "Income", merchant: "Job" },
      { id: "2", date: "2026-06-02", amount: -500, type: "expense", finalCategory: "Food", merchant: "Cafe" },
      { id: "3", date: "2026-06-03", amount: -300, type: "expense", finalCategory: "Transportation", merchant: "Shell" },
    ]);
    const validated = validateInsights(
      {
        summary: "ok",
        score: 60,
        riskLevel: "low",
        recommendations: [
          {
            title: "Trim your top spending categories",
            message: "Combined trim",
            impact: "high",
            estimatedMonthlySavings: 80,
            breakdown: [
              { label: "Food", monthlyAvg: 500, sharePct: 62 },
              { label: "Transportation", monthlyAvg: 300, sharePct: 38 },
            ],
          },
        ],
      },
      report,
    );
    expect(validated.recommendations[0]?.breakdown).toHaveLength(2);
    expect(validated.recommendations[0]?.breakdown?.[0]?.label).toBe("Food");
  });

  it("normalizes invalid breakdown entries from LLM output", () => {
    const report = buildReportData([
      { id: "1", date: "2026-06-01", amount: 1000, type: "income", finalCategory: "Income", merchant: "Job" },
    ]);
    const validated = validateInsights(
      {
        summary: "ok",
        score: 60,
        riskLevel: "low",
        recommendations: [
          {
            title: "Trim categories",
            message: "Combined",
            impact: "medium",
            estimatedMonthlySavings: 10,
            breakdown: [{ label: 42, monthlyAvg: "x", sharePct: "y" }, null],
          },
        ],
      },
      report,
    );
    expect(validated.recommendations[0]?.breakdown?.[0]?.label).toBe("Category");
    expect(validated.recommendations[0]?.breakdown?.[0]?.monthlyAvg).toBe(0);
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
    expect(insights.insights.summary).toContain("No transactions");
    expect(insights.source).toBe("fallback");
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
    expect(insights.insights.summary).toBe("All good");
    expect(insights.source).toBe("openrouter");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toContain("custom/model");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toContain("enrichedFinancialSummary");
  });
});

describe("generateStaticInsights", () => {
  it("builds a deterministic summary from reportData", () => {
    const report = buildReportData([
      { id: "1", date: "2026-06-01", amount: 3200, type: "income", finalCategory: "Income", merchant: "Employer" },
      { id: "2", date: "2026-06-02", amount: -42.5, type: "expense", finalCategory: "Food", merchant: "Whole Foods" },
      { id: "3", date: "2026-06-03", amount: -120, type: "expense", finalCategory: "Transportation", merchant: "Shell" },
      { id: "4", date: "2026-06-04", amount: -80, type: "expense", finalCategory: "Shopping", merchant: "Amazon" },
    ]);
    const insights = generateStaticInsights(report);
    expect(insights.summary).toContain("income");
    expect(insights.summary).toContain("Transportation");
    expect(insights.observations.length).toBeGreaterThan(0);
    expect(insights.recommendations).toHaveLength(3);
    expect(insights.recommendations[0]?.title).toMatch(/Trim your top spending categories|Where you spend most/);
    expect(insights.recommendations[0]?.breakdown?.length).toBeGreaterThan(0);
    expect(insights.recommendations[0]?.estimatedMonthlySavings).toBeLessThan(200);
    expect(insights.score).toBeGreaterThan(0);
  });

  it("merges top categories and adds trend recommendation when spending rises", () => {
    const report = buildReportData([
      { id: "1", date: "2026-01-01", amount: 5000, type: "income", finalCategory: "Income", merchant: "Employer" },
      { id: "2", date: "2026-01-05", amount: -900, type: "expense", finalCategory: "Food", merchant: "Grocer" },
      { id: "3", date: "2026-01-10", amount: -600, type: "expense", finalCategory: "Transportation", merchant: "Shell" },
      { id: "4", date: "2026-02-05", amount: -1200, type: "expense", finalCategory: "Food", merchant: "Grocer" },
      { id: "5", date: "2026-02-10", amount: -900, type: "expense", finalCategory: "Transportation", merchant: "Shell" },
      { id: "6", date: "2026-02-12", amount: -300, type: "expense", finalCategory: "Shopping", merchant: "Amazon" },
    ]);
    const insights = generateStaticInsights(report);
    expect(insights.recommendations[0]?.title).toBe("Trim your top spending categories");
    expect(insights.recommendations[0]?.breakdown?.length).toBe(3);
    expect(insights.recommendations.some((r) => r.title === "Reverse the spending uptick")).toBe(true);
    expect(insights.observations[0]?.title).toBe("Spending concentration");
  });

  it("uses cash-flow and savings recommendations for distinct actions", () => {
    const deficit = buildReportData([
      { id: "1", date: "2026-06-01", amount: 1000, type: "income", finalCategory: "Income", merchant: "Job" },
      { id: "2", date: "2026-06-02", amount: -800, type: "expense", finalCategory: "Food", merchant: "Cafe" },
      { id: "3", date: "2026-06-03", amount: -600, type: "expense", finalCategory: "Transportation", merchant: "Shell" },
    ]);
    const deficitInsights = generateStaticInsights(deficit);
    expect(deficitInsights.recommendations.some((r) => r.title === "Close the cash-flow gap")).toBe(true);

    const lowSavings = buildReportData([
      { id: "1", date: "2026-06-01", amount: 5000, type: "income", finalCategory: "Income", merchant: "Job" },
      { id: "2", date: "2026-06-02", amount: -4800, type: "expense", finalCategory: "Food", merchant: "Cafe" },
    ]);
    const lowSavingsInsights = generateStaticInsights(lowSavings);
    expect(lowSavingsInsights.recommendations.some((r) => r.title === "Grow your savings rate")).toBe(true);

    const healthy = buildReportData([
      { id: "1", date: "2026-06-01", amount: 5000, type: "income", finalCategory: "Income", merchant: "Job" },
      { id: "2", date: "2026-06-02", amount: -2000, type: "expense", finalCategory: "Food", merchant: "Cafe" },
      { id: "3", date: "2026-06-03", amount: -500, type: "expense", finalCategory: "Shopping", merchant: "Amazon" },
    ]);
    expect(generateStaticInsights(healthy).recommendations.some((r) => r.title === "Set monthly category caps")).toBe(
      true,
    );
  });

  it("buildStaticInsightsPrompt includes category ranks and month count", () => {
    const report = buildReportData([
      { id: "1", date: "2026-01-01", amount: 5000, type: "income", finalCategory: "Income", merchant: "Employer" },
      { id: "2", date: "2026-01-05", amount: -900, type: "expense", finalCategory: "Food", merchant: "Grocer" },
      { id: "3", date: "2026-02-05", amount: -900, type: "expense", finalCategory: "Food", merchant: "Grocer" },
    ]);
    const prompt = buildStaticInsightsPrompt(report);
    expect(prompt).toContain("enrichedFinancialSummary");
    expect(prompt).toContain("categoryPercentages");
    expect(prompt).toContain("DEDUPLICATION AND INSIGHT GROUPING RULES");
    expect(prompt).toContain("Create ONLY ONE insight card per root cause");
    expect(prompt).toContain("Food");
  });

  it("buildEnrichedFinancialSummary pre-computes percentages and trend fields", () => {
    const report = buildReportData([
      { id: "1", date: "2026-01-01", amount: 5000, type: "income", finalCategory: "Income", merchant: "Employer" },
      { id: "2", date: "2026-01-05", amount: -900, type: "expense", finalCategory: "Food", merchant: "Grocer" },
      { id: "3", date: "2026-02-05", amount: -1200, type: "expense", finalCategory: "Food", merchant: "Grocer" },
      { id: "4", date: "2026-02-10", amount: -300, type: "expense", finalCategory: "Transportation", merchant: "Shell" },
    ]);
    const enriched = buildEnrichedFinancialSummary(report);
    expect(enriched.categoryPercentages.Food).toBeGreaterThan(0);
    expect(enriched.topCategory?.category).toBe("Food");
    expect(enriched.topMerchant?.merchant).toBe("Grocer");
    expect(enriched.averageMonthlySpend).toBeGreaterThan(0);
    expect(enriched.monthOverMonthChange?.expenseDelta).toBeGreaterThan(0);
    expect(enriched.spendingTrendDirection).toBe("up");
    expect(enriched.highestTransaction?.amount).toBe(1200);
  });

  it("computes flat and down spending trend directions", () => {
    const flatReport = buildReportData([
      { id: "1", date: "2026-01-01", amount: 5000, type: "income", finalCategory: "Income", merchant: "Employer" },
      { id: "2", date: "2026-01-05", amount: -1000, type: "expense", finalCategory: "Food", merchant: "Grocer" },
      { id: "3", date: "2026-02-05", amount: -1020, type: "expense", finalCategory: "Food", merchant: "Grocer" },
    ]);
    expect(buildEnrichedFinancialSummary(flatReport).spendingTrendDirection).toBe("flat");

    const downReport = buildReportData([
      { id: "1", date: "2026-01-01", amount: 5000, type: "income", finalCategory: "Income", merchant: "Employer" },
      { id: "2", date: "2026-01-05", amount: -1500, type: "expense", finalCategory: "Food", merchant: "Grocer" },
      { id: "3", date: "2026-02-05", amount: -900, type: "expense", finalCategory: "Food", merchant: "Grocer" },
    ]);
    expect(buildEnrichedFinancialSummary(downReport).spendingTrendDirection).toBe("down");
  });

  it("flags large expense anomalies in static insights", () => {
    const report = buildReportData([
      { id: "1", date: "2026-05-01", amount: 3000, type: "income", finalCategory: "Income", merchant: "Employer" },
      { id: "2", date: "2026-05-02", amount: -40, type: "expense", finalCategory: "Food", merchant: "Cafe" },
      { id: "3", date: "2026-06-01", amount: 3000, type: "income", finalCategory: "Income", merchant: "Employer" },
      { id: "4", date: "2026-06-02", amount: -50, type: "expense", finalCategory: "Food", merchant: "Cafe" },
      { id: "5", date: "2026-06-03", amount: -2500, type: "expense", finalCategory: "Shopping", merchant: "Electronics" },
    ]);
    const insights = generateStaticInsights(report);
    expect(insights.anomalies.length).toBeGreaterThan(0);
    expect(insights.anomalies[0]?.amount).toBe(2500);
  });

  it("buildInsightsLlmPrompt includes deduplication rules", () => {
    const report = buildReportData([
      { id: "1", date: "2026-06-01", amount: 1000, type: "income", finalCategory: "Income", merchant: "Job" },
    ]);
    const prompt = buildInsightsLlmPrompt(buildEnrichedFinancialSummary(report));
    expect(prompt).toContain("Recommendation uniqueness");
  });

  it("returns empty-state defaults", () => {
    const insights = generateStaticInsights(buildReportData([]));
    expect(insights.summary).toContain("No transactions");
    expect(insights.score).toBe(50);
  });
});

describe("fallbackInsights", () => {
  it("delegates to generateStaticInsights", () => {
    const report = buildReportData([
      { id: "1", date: "2026-06-01", amount: 100, type: "income", finalCategory: "Income", merchant: "Job" },
    ]);
    const insights = fallbackInsights(report);
    expect(insights.observations[0]?.category).toBeTruthy();
    expect(insights.recommendations[0]?.impact).toBeTruthy();
  });
});

describe("safeJsonParse branch coverage", () => {
  it("ignores malformed markdown fences", () => {
    expect(safeJsonParse("```not-json```")).toBeNull();
  });
});

describe("coach suggestions", () => {
  const sampleSummary = {
    period: { start: "2026-01-01", end: "2026-06-01" },
    totalTransactions: 12,
    totalIncome: 5000,
    totalExpenses: 3200,
    netCashFlow: 1800,
    savingsRate: 36,
    topCategories: [{ category: "Food", total: 800 }],
    topMerchants: [{ merchant: "Whole Foods", total: 400 }],
    recurringAnnualized: 600,
    personalityLabel: "Balanced Builder",
  };

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
  });

  it("returns three fallback suggestions", () => {
    const result = fallbackCoachSuggestions(sampleSummary);
    expect(result.suggestions).toHaveLength(3);
    expect(result.source).toBe("fallback");
  });

  it("pads validateCoachSuggestions to three items", () => {
    const suggestions = validateCoachSuggestions(
      [{ title: "One", message: "Do it", impact: "high", estimatedMonthlySavings: 10 }],
      sampleSummary,
    );
    expect(suggestions).toHaveLength(3);
    expect(suggestions[0]?.title).toBe("One");
  });

  it("calls OpenRouter for coach suggestions when key is set", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "mock-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                suggestions: [
                  { title: "A", message: "First", impact: "high", estimatedMonthlySavings: 50 },
                  { title: "B", message: "Second", impact: "medium", estimatedMonthlySavings: 30 },
                  { title: "C", message: "Third", impact: "low", estimatedMonthlySavings: 10 },
                ],
              }),
            },
          }],
        }),
      }),
    );

    const result = await generateCoachSuggestionsWithOpenRouter(sampleSummary);
    expect(result.source).toBe("openrouter");
    expect(result.suggestions[0]?.title).toBe("A");
  });

  it("skips OpenRouter without api key", async () => {
    const result = await generateCoachSuggestionsWithOpenRouter(sampleSummary);
    expect(result.source).toBe("fallback");
  });

  it("falls back when coach response JSON is invalid", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "mock-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "not-json" } }],
        }),
      }),
    );
    const result = await generateCoachSuggestionsWithOpenRouter(sampleSummary);
    expect(result.source).toBe("fallback");
    expect(result.suggestions).toHaveLength(3);
  });

  it("falls back when coach response content is empty", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "mock-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "" } }],
        }),
      }),
    );
    const result = await generateCoachSuggestionsWithOpenRouter(sampleSummary);
    expect(result.source).toBe("fallback");
  });
});
