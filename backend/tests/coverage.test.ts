import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  mergeAiCategories,
  getLocalCategoryHint,
  categorizeTransactionsWithOpenRouter,
  parseCsvToTransactions,
  aiApp,
} from "../src/aiAnalyzer.js";
import {
  mapToAllowedCategory,
  validateInsights,
  buildReportData,
  fallbackInsights,
  safeJsonParse,
} from "../src/openrouter.js";
import { categorize, normalizeMerchant } from "../src/categorize.js";

describe("mapToAllowedCategory", () => {
  const cases: [string, string][] = [
    ["Salary", "Income"],
    ["Paycheck deposit", "Income"],
    ["Rent payment", "Housing"],
    ["Mortgage", "Housing"],
    ["Starbucks coffee", "Food"],
    ["Groceries", "Food"],
    ["Uber ride", "Transportation"],
    ["Shell gas", "Transportation"],
    ["Amazon order", "Shopping"],
    ["Verizon bill", "Bills & Utilities"],
    ["Pharmacy", "Health"],
    ["Netflix subscription", "Entertainment"],
    ["Zelle transfer", "Transfers"],
    ["Misc", "Other"],
    ["", "Other"],
  ];

  for (const [input, expected] of cases) {
    it(`maps "${input}" to ${expected}`, () => {
      expect(mapToAllowedCategory(input)).toBe(expected);
    });
  }
});

describe("mergeAiCategories", () => {
  const baseTxn = {
    id: "txn_001",
    date: "2026-06-01",
    description: "Store",
    merchant: "Store",
    amount: -10,
    type: "expense",
    localCategory: "Food",
    localConfidence: 0.9,
  };

  it("prefers AI category when confidence is high", () => {
    const [merged] = mergeAiCategories(
      [baseTxn],
      [{ id: "txn_001", aiCategory: "Shopping", aiConfidence: 0.9, reason: "retail" }],
    );
    expect(merged.finalCategory).toBe("Shopping");
    expect(merged.categorySource).toBe("ai");
  });

  it("falls back to local category when AI confidence is low", () => {
    const [merged] = mergeAiCategories(
      [baseTxn],
      [{ id: "txn_001", aiCategory: "Shopping", aiConfidence: 0.5, reason: "unsure" }],
    );
    expect(merged.finalCategory).toBe("Food");
    expect(merged.categorySource).toBe("local");
  });

  it("uses fallback when neither AI nor local is confident", () => {
    const txn = { ...baseTxn, localConfidence: 0.5 };
    const [merged] = mergeAiCategories([txn], []);
    expect(merged.finalCategory).toBe("Other");
    expect(merged.categorySource).toBe("fallback");
  });

  it("rejects invalid AI categories", () => {
    const [merged] = mergeAiCategories(
      [baseTxn],
      [{ id: "txn_001", aiCategory: "InvalidCat", aiConfidence: 0.99, reason: "bad" }],
    );
    expect(merged.finalCategory).toBe("Food");
    expect(merged.categorySource).toBe("local");
  });
});

describe("getLocalCategoryHint extended", () => {
  it("maps payroll keywords from Other to Income", () => {
    const hint = getLocalCategoryHint({ merchant: "ADP", description: "payroll deposit" });
    expect(hint.category).toBe("Income");
  });

  it("maps housing keywords from Other to Housing", () => {
    const hint = getLocalCategoryHint({ merchant: "Landlord", description: "rent june" });
    expect(hint.category).toBe("Housing");
  });

  it("maps transfer keywords from Other to Transfers", () => {
    const hint = getLocalCategoryHint({ merchant: "Venmo", description: "payment to friend" });
    expect(hint.category).toBe("Transfers");
  });

  it("returns lower confidence for Other", () => {
    const hint = getLocalCategoryHint({ merchant: "Unknown Corp", description: "consulting" });
    expect(hint.confidence).toBe(0.5);
  });
});

describe("categorizeTransactionsWithOpenRouter", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns empty array when API key is missing", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    const result = await categorizeTransactionsWithOpenRouter([{ id: "txn_001" }]);
    expect(result).toEqual([]);
  });

  it("returns categorized transactions on success", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  categorizedTransactions: [
                    { id: "txn_001", aiCategory: "Food", aiConfidence: 0.9, reason: "grocery" },
                  ],
                }),
              },
            },
          ],
        }),
      }),
    );

    const result = await categorizeTransactionsWithOpenRouter([{ id: "txn_001" }]);
    expect(result).toHaveLength(1);
    expect(result[0].aiCategory).toBe("Food");
  });

  it("returns empty array on HTTP error", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const result = await categorizeTransactionsWithOpenRouter([{ id: "txn_001" }]);
    expect(result).toEqual([]);
  });

  it("returns empty array on empty response content", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: {} }] }),
      }),
    );
    const result = await categorizeTransactionsWithOpenRouter([{ id: "txn_001" }]);
    expect(result).toEqual([]);
  });
});

describe("parseCsvToTransactions edge cases", () => {
  it("skips rows with empty dates and empty rows", () => {
    const csv = "Date,Description,Amount\n,Missing date,-10\n2026-06-01,,0\n2026-06-02,Valid,-5";
    const txns = parseCsvToTransactions(csv);
    expect(txns).toHaveLength(2);
  });

  it("uses partial header hints and handles invalid amounts", () => {
    const csv = "Transaction Date,Merchant Name,Value\n2026-06-01,Shop,not-a-number";
    const txns = parseCsvToTransactions(csv);
    expect(txns[0].amount).toBe(0);
  });

  it("uses partial header hints and skips blank rows", () => {
    const csv =
      "Posted Date,Merchant Name,Transaction Amount\n" +
      "2026-06-01,Store,-12\n" +
      ",,\n" +
      "2026-06-02,Other,-3";
    const txns = parseCsvToTransactions(csv);
    expect(txns).toHaveLength(2);
    expect(txns[0].amount).toBe(-12);
  });

  it("falls back to the first column when no header hints match", () => {
    const csv = "Foo,Bar,Baz\n2026-06-01,Store,-5";
    const txns = parseCsvToTransactions(csv);
    expect(txns).toHaveLength(1);
    expect(txns[0].date).toBe("2026-06-01");
  });

  it("handles credit column when debit is zero", () => {
    const csv = "Date,Description,Debit,Credit\n2026-06-01,Refund,,20.00";
    const txns = parseCsvToTransactions(csv);
    expect(txns[0].amount).toBe(20);
  });
});

describe("categorize rule coverage", () => {
  const samples: [string, string][] = [
    ["Uber Eats", "Food"],
    ["Delta Airlines", "Travel"],
    ["Comcast Internet", "Bills & Utilities"],
    ["Steam Games", "Entertainment"],
  ];

  for (const [desc, cat] of samples) {
    it(`categorizes ${desc} as ${cat}`, () => {
      expect(categorize(desc, desc)).toBe(cat);
    });
  }

  it("handles null merchant and description", () => {
    expect(categorize(null as unknown as string, null as unknown as string)).toBe("Other");
  });
});

describe("normalizeMerchant edge cases", () => {
  it("title-cases words and handles empty tokens", () => {
    expect(normalizeMerchant("hello  world")).toBe("Hello World");
  });

  it("returns Unknown for whitespace-only result", () => {
    expect(normalizeMerchant("****")).toBe("Unknown");
  });
});

describe("validateInsights extended", () => {
  const report = buildReportData([]);

  it("returns fallback for null insights", () => {
    expect(validateInsights(null, report).score).toBe(50);
  });

  it("clamps invalid score and risk level", () => {
    const validated = validateInsights(
      {
        summary: "ok",
        score: 150,
        riskLevel: "extreme",
        observations: "bad",
        recommendations: "bad",
        anomalies: "bad",
      },
      report,
    );
    expect(validated.score).toBe(70);
    expect(validated.riskLevel).toBe("low");
    expect(Array.isArray(validated.observations)).toBe(true);
  });

  it("normalizes observation, recommendation, and anomaly items", () => {
    const validated = validateInsights(
      {
        summary: "Good",
        score: 80,
        riskLevel: "medium",
        observations: [{ title: 1, message: 2, severity: "bad", category: 3 }],
        recommendations: [{ title: 1, message: 2, impact: "bad", estimatedMonthlySavings: "x" }],
        anomalies: [{ title: 1, message: 2, severity: "bad", amount: "x" }],
      },
      report,
    );
    expect(validated.observations[0].title).toBe("Observation");
    expect(validated.recommendations[0].impact).toBe("medium");
    expect(validated.anomalies[0].amount).toBe(0);
  });
});

describe("safeJsonParse extended", () => {
  it("parses fenced json without language tag", () => {
    expect(safeJsonParse('```\n{"a":1}\n```')).toEqual({ a: 1 });
  });
});

describe("buildReportData edge cases", () => {
  it("handles income-only and transfer expense transactions", () => {
    const report = buildReportData([
      {
        id: "1",
        date: "2026-06-01",
        amount: 1000,
        type: "income",
        finalCategory: "Income",
        merchant: "Employer",
      },
      {
        id: "2",
        date: "2026-06-02",
        amount: -200,
        type: "expense",
        finalCategory: "Transfers",
        merchant: "Bank",
      },
      {
        id: "3",
        date: "2026-06-03",
        amount: -50,
        type: "expense",
        finalCategory: "Food",
        merchant: "Cafe",
      },
    ]);
    expect(report.totalIncome).toBe(1000);
    expect(report.totalExpenses).toBe(50);
    expect(report.savingsRate).toBe(95);
  });
});

describe("aiApp additional routes", () => {
  beforeEach(() => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("accepts raw text/csv body", async () => {
    const res = await aiApp.request("/", {
      method: "POST",
      headers: { "Content-Type": "text/csv" },
      body: "Date,Description,Amount\n2026-06-01,Store,-12.00",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.aiStatus.categorization).toBe("local");
  });

  it("accepts multipart file upload", async () => {
    const formData = new FormData();
    formData.append(
      "file",
      new File(["Date,Description,Amount\n2026-06-01,Cafe,-3.00"], "data.csv", {
        type: "text/csv",
      }),
    );

    const res = await aiApp.request("/", { method: "POST", body: formData });
    expect(res.status).toBe(200);
  });

  it("returns 400 when payload cannot be read", async () => {
    const res = await aiApp.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ invalid json",
    });
    expect(res.status).toBe(400);
  });

  it("processes large CSV batches with local categorization only", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("OPENROUTER_API_KEY", "mock-key");

    const rows = ["Date,Description,Amount"];
    for (let i = 1; i <= 45; i++) {
      rows.push(`2026-06-${String((i % 28) + 1).padStart(2, "0")},Store ${i},-${i}.00`);
    }

    const res = await aiApp.request("/", {
      method: "POST",
      headers: { "Content-Type": "text/csv" },
      body: rows.join("\n"),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.transactions.length).toBe(45);
    expect(body.aiStatus.categorization).toBe("local");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts multipart string file field", async () => {
    const formData = new FormData();
    formData.append("file", "Date,Description,Amount\n2026-06-01,Cafe,-3.00");

    const res = await aiApp.request("/", { method: "POST", body: formData });
    expect(res.status).toBe(200);
  });
});
