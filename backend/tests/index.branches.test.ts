import { describe, it, expect, vi, beforeEach } from "vitest";

function successAnalyzePayload(transactions: Record<string, unknown>[]) {
  return {
    status: "success" as const,
    analysisId: "test-analysis",
    createdAt: new Date().toISOString(),
    files: [{ fileName: "data.csv", rowCount: transactions.length, detectedFormat: "chase_checking" as const }],
    summary: {
      totalTransactions: transactions.length,
      totalIncome: 0,
      totalSpending: 10,
      netCashFlow: -10,
      topCategories: [],
      dateRange: { start: "2026-06-01", end: "2026-06-01" },
    },
    transactions,
    insights: ["ok"],
  };
}

describe("index branch coverage via mocks", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("maps sparse transactions and reports static ai status", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "mock-key");
    vi.doMock("../src/csvAnalyze.js", () => ({
      analyzeCsvBuffers: vi.fn().mockResolvedValue(
        successAnalyzePayload([
          {
            id: 1,
            date: "2026-06-01",
            amount: -10,
            category: "Other",
            merchant_raw: "Raw Merchant",
            merchant_normalized: "",
            description: "",
          },
        ]),
      ),
      MAX_CSV_BYTES: 5 * 1024 * 1024,
      isCsvFileName: (name: string) => /\.(csv|xlsx|xls)$/i.test(name),
    }));

    const { app } = await import("../src/index.js");
    const formData = new FormData();
    formData.append("files", new File(["x"], "data.csv", { type: "text/csv" }));

    const res = await app.request("/api/analyze", { method: "POST", body: formData });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.transactions[0].merchant).toBe("Unknown");
    expect(body.transactions[0].description).toBe("Raw Merchant");
    expect(body.transactions[0].localConfidence).toBe(0.5);
    expect(body.aiStatus).toBe("static");
    vi.unstubAllEnvs();
  });

  it("handles non-error throwables from analyzeCsvBuffers", async () => {
    vi.doMock("../src/csvAnalyze.js", () => ({
      analyzeCsvBuffers: vi.fn().mockRejectedValue("plain failure"),
      MAX_CSV_BYTES: 5 * 1024 * 1024,
      isCsvFileName: (name: string) => /\.(csv|xlsx|xls)$/i.test(name),
    }));

    const { app } = await import("../src/index.js");
    const formData = new FormData();
    formData.append("files", new File(["x"], "data.csv", { type: "text/csv" }));

    const res = await app.request("/api/analyze", { method: "POST", body: formData });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe("ANALYZE_FAILED");
  });

  it("preserves provided transaction metadata fields", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    vi.doMock("../src/csvAnalyze.js", () => ({
      analyzeCsvBuffers: vi.fn().mockResolvedValue(
        successAnalyzePayload([
          {
            id: 7,
            date: "2026-06-01",
            amount: -10,
            category: "Food",
            description: "Cafe",
            merchant_raw: "Cafe",
            merchant_normalized: "Cafe",
            currency: "EUR",
            source: "unit-test",
            card_identity: "Test Card",
            created_at: "2026-06-01T12:00:00.000Z",
          },
        ]),
      ),
      MAX_CSV_BYTES: 5 * 1024 * 1024,
      isCsvFileName: (name: string) => /\.(csv|xlsx|xls)$/i.test(name),
    }));
    vi.doMock("../src/openrouter.js", async (importOriginal) => {
      const actual = await importOriginal<typeof import("../src/openrouter.js")>();
      return actual;
    });

    const { app } = await import("../src/index.js");
    const formData = new FormData();
    formData.append("files", new File(["x"], "data.csv", { type: "text/csv" }));
    const res = await app.request("/api/analyze", { method: "POST", body: formData });
    const body = await res.json();
    expect(body.transactions[0].currency).toBe("EUR");
    expect(body.transactions[0].card_identity).toBe("Test Card");
    expect(body.transactions[0].localConfidence).toBe(0.9);
    vi.unstubAllEnvs();
  });

  it("maps description-only transactions using merchant fallbacks", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    vi.doMock("../src/csvAnalyze.js", () => ({
      analyzeCsvBuffers: vi.fn().mockResolvedValue(
        successAnalyzePayload([
          {
            id: 2,
            date: "2026-06-01",
            amount: -10,
            category: "Food",
            description: "Only Description",
          },
        ]),
      ),
      MAX_CSV_BYTES: 5 * 1024 * 1024,
      isCsvFileName: (name: string) => /\.(csv|xlsx|xls)$/i.test(name),
    }));
    vi.doMock("../src/openrouter.js", async (importOriginal) => {
      const actual = await importOriginal<typeof import("../src/openrouter.js")>();
      return actual;
    });

    const { app } = await import("../src/index.js");
    const formData = new FormData();
    formData.append("files", new File(["x"], "data.csv", { type: "text/csv" }));
    const res = await app.request("/api/analyze", { method: "POST", body: formData });
    const body = await res.json();
    expect(body.transactions[0].merchant).toBe("Unknown");
    expect(body.transactions[0].description).toBe("Only Description");
    vi.unstubAllEnvs();
  });
});
