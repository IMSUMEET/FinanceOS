import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseCsvToTransactions, getLocalCategoryHint, mergeAiCategories, aiApp } from "../src/aiAnalyzer.js";
import { buildReportData, fallbackInsights, safeJsonParse, validateInsights, generateInsightsWithOpenRouter } from "../src/openrouter.js";

describe("CSV Parser (Lambda 2)", () => {
  it("should parse amount column and detect type correctly", () => {
    const csv = "Date,Description,Amount\n2026-06-01,Safeway,-82.14\n2026-06-02,Payroll,2500.00";
    const txns = parseCsvToTransactions(csv);
    expect(txns).toHaveLength(2);
    
    expect(txns[0].amount).toBe(-82.14);
    expect(txns[0].type).toBe("expense");
    expect(txns[0].merchant).toBe("Safeway");
    
    expect(txns[1].amount).toBe(2500.00);
    expect(txns[1].type).toBe("income");
    expect(txns[1].merchant).toBe("Payroll");
  });

  it("should parse debit/credit columns", () => {
    const csv = "Date,Description,Debit,Credit\n2026-06-01,Safeway,82.14,\n2026-06-02,Refund,,15.00";
    const txns = parseCsvToTransactions(csv);
    expect(txns).toHaveLength(2);
    
    expect(txns[0].amount).toBe(-82.14);
    expect(txns[0].type).toBe("expense");
    
    expect(txns[1].amount).toBe(15.00);
    expect(txns[1].type).toBe("income");
  });

  it("should handle missing merchant / normalize name", () => {
    const csv = "Date,Description,Amount\n2026-06-01,,-10.00";
    const txns = parseCsvToTransactions(csv);
    expect(txns).toHaveLength(1);
    expect(txns[0].merchant).toBe("Unknown");
  });

  it("returns empty array for empty row csv content", () => {
    expect(parseCsvToTransactions("")).toEqual([]);
    expect(parseCsvToTransactions("\n\n\n")).toEqual([]);
  });
});

describe("Local Category Hint", () => {
  it("should categorize hints correctly", () => {
    const testCases = [
      { desc: "SAFEWAY #1234", expected: "Food" },
      { desc: "SHELL OIL", expected: "Transportation" },
      { desc: "PAYROLL ADADP", expected: "Income" },
      { desc: "RENT APARTMENT", expected: "Housing" },
      { desc: "NETFLIX.COM", expected: "Entertainment" },
      { desc: "ZELLE TO BOB", expected: "Transfers" }
    ];

    for (const tc of testCases) {
      const txn = { merchant: tc.desc, description: tc.desc };
      const hint = getLocalCategoryHint(txn);
      expect(hint.category).toBe(tc.expected);
    }
  });
});

describe("Report Data Computation", () => {
  it("computes reportData totals correctly and excludes transfers from expenses", () => {
    const transactions = [
      {
        id: "txn_001",
        date: "2026-06-01",
        merchant: "Employer",
        amount: 3000,
        type: "income",
        finalCategory: "Income"
      },
      {
        id: "txn_002",
        date: "2026-06-02",
        merchant: "Safeway",
        amount: -100,
        type: "expense",
        finalCategory: "Food"
      },
      {
        id: "txn_003",
        date: "2026-06-03",
        merchant: "Credit Card Payment",
        amount: -500,
        type: "expense",
        finalCategory: "Transfers"
      }
    ];

    const report = buildReportData(transactions);
    expect(report.totalIncome).toBe(3000);
    expect(report.totalExpenses).toBe(100); 
    expect(report.netCashFlow).toBe(2900);
    expect(report.savingsRate).toBe(96.67);
    
    expect(report.categoryTotals["Income"]).toBe(3000);
    expect(report.categoryTotals["Food"]).toBe(100);
    expect(report.categoryTotals["Transfers"]).toBe(500);

    const allowedCategories = [
      "Income", "Housing", "Food", "Transportation", "Shopping",
      "Bills & Utilities", "Health", "Entertainment", "Transfers", "Other"
    ];
    for (const cat of allowedCategories) {
      expect(report.categoryTotals).toHaveProperty(cat);
    }
  });
});

describe("AI Fallback and Parsing Safety", () => {
  beforeEach(() => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("handles missing api key and returns fallback insights", () => {
    const reportData = buildReportData([
      { id: "txn_001", date: "2026-06-01", amount: -50, type: "expense", finalCategory: "Food" }
    ]);
    const insights = fallbackInsights(reportData);
    expect(insights.summary).toContain("You had $0 income, $50 expenses");
    expect(insights.score).toBe(70);
  });

  it("safeJsonParse removes markdown fences and handles invalid JSON", () => {
    const validMarkdown = "```json\n{\"summary\": \"Great job\"}\n```";
    expect(safeJsonParse(validMarkdown)).toEqual({ summary: "Great job" });

    const extraText = "Here is the response: {\"summary\": \"Okay\"} and some extra.";
    expect(safeJsonParse(extraText)).toEqual({ summary: "Okay" });

    expect(safeJsonParse("invalid json text")).toBeNull();
  });

  it("validateInsights uses default fallback if parsing yields corrupted fields", () => {
    const reportData = buildReportData([]);
    const badInsights = {
      summary: 123,
      score: "one hundred",
      riskLevel: "danger",
      observations: "none"
    };

    const validated = validateInsights(badInsights, reportData);
    expect(typeof validated.summary).toBe("string");
    expect(validated.score).toBe(70);
    expect(validated.riskLevel).toBe("low");
  });
});

describe("OpenRouter Integration Mocks", () => {
  beforeEach(() => {
    vi.stubEnv("OPENROUTER_API_KEY", "mock-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("calls fetch completions and parses results correctly", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              summary: "Excellent financial health",
              score: 95,
              riskLevel: "low",
              observations: [],
              recommendations: [],
              anomalies: []
            })
          }
        }
      ]
    };

    const globalFetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });
    vi.stubGlobal("fetch", globalFetchMock);

    const report = buildReportData([]);
    const result = await generateInsightsWithOpenRouter(report);
    expect(result.summary).toBe("Excellent financial health");
    expect(result.score).toBe(95);
    expect(globalFetchMock).toHaveBeenCalledOnce();
  });

  it("gracefully falls back on OpenRouter fetch error status", async () => {
    const globalFetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });
    vi.stubGlobal("fetch", globalFetchMock);

    const report = buildReportData([]);
    const result = await generateInsightsWithOpenRouter(report);
    expect(result.summary).toContain("You had $0 income");
  });

  it("handles empty choice content from fetch", async () => {
    const globalFetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [] })
    });
    vi.stubGlobal("fetch", globalFetchMock);
    const report = buildReportData([]);
    const result = await generateInsightsWithOpenRouter(report);
    expect(result.summary).toContain("You had $0 income");
  });

  it("handles unparseable json response content from fetch", async () => {
    const globalFetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "invalid-json" } }] })
    });
    vi.stubGlobal("fetch", globalFetchMock);
    const report = buildReportData([]);
    const result = await generateInsightsWithOpenRouter(report);
    expect(result.summary).toContain("You had $0 income");
  });
});

describe("aiApp Hono Routing (Lambda 2)", () => {
  beforeEach(() => {
    vi.stubEnv("OPENROUTER_API_KEY", "mock-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns CORS headers on OPTIONS preflight request", async () => {
    const res = await aiApp.request("/", {
      method: "OPTIONS"
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("access-control-allow-methods")).toBe("POST,OPTIONS");
  });

  it("returns error on empty POST body", async () => {
    const res = await aiApp.request("/", {
      method: "POST",
      body: ""
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.message).toContain("Empty CSV");
  });

  it("returns error on unparseable CSV content", async () => {
    const res = await aiApp.request("/", {
      method: "POST",
      headers: { "Content-Type": "text/csv" },
      body: "\n\n"
    });
    expect(res.status).toBe(400);
  });

  it("handles JSON payload containing csv field", async () => {
    const mockCatResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              categorizedTransactions: [
                { id: "txn_001", aiCategory: "Food", aiConfidence: 0.95, reason: "grocery store" }
              ]
            })
          }
        }
      ]
    };

    const mockInsightsResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              summary: "Good savings",
              score: 85,
              riskLevel: "low",
              observations: [],
              recommendations: [],
              anomalies: []
            })
          }
        }
      ]
    };

    let fetchCallCount = 0;
    const globalFetchMock = vi.fn().mockImplementation(async () => {
      fetchCallCount++;
      return {
        ok: true,
        json: async () => (fetchCallCount === 1 ? mockCatResponse : mockInsightsResponse)
      };
    });
    vi.stubGlobal("fetch", globalFetchMock);

    const res = await aiApp.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: "Date,Description,Amount\n2026-06-01,Safeway,-10.00" })
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.transactions[0].finalCategory).toBe("Food");
    expect(body.insights.summary).toBe("Good savings");
  });
});
