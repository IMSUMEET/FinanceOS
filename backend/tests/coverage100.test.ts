import { describe, it, expect, vi, afterEach } from "vitest";
import * as XLSX from "xlsx";
import {
  mapRows,
  sheetToRows,
  analyzeCsvBuffers,
  isCsvFileName,
  buildSummary,
} from "../src/csvAnalyze.js";
import {
  buildReportData,
  safeJsonParse,
  generateInsightsWithOpenRouter,
} from "../src/openrouter.js";

describe("coverage100 csvAnalyze", () => {
  it("mapRows handles missing field values and playstation without category column", () => {
    expect(() =>
      mapRows(
        [{ "Transaction Date": undefined, Description: "Store", Amount: "-5" } as Record<string, unknown>],
        "chase_credit_card",
      ),
    ).toThrow(/Missing date value/);

    const psNoCategory = mapRows(
      [{ Date: "06/15/2026", Description: "Game", Amount: "20.00", Location: "PSN" }],
      "playstation_credit_card",
    );
    expect(psNoCategory.mapped[0]?.amount).toBe(-20);

    expect(() =>
      mapRows([{ Date: "", Description: "Store", Amount: "1" }], "unknown", ""),
    ).toThrow(/Error at line 2:/);

    expect(() =>
      mapRows([{ Date: "06/15/2026", Description: undefined, Amount: "-5" } as Record<string, unknown>], "unknown"),
    ).toThrow(/Missing merchant description/);
  });

  it("mapRows covers citi/capital one missing columns and playstation payment paths", () => {
    expect(() =>
      mapRows(
        [{ Date: "06/15/2026", Description: "Store", Amount: "1" }],
        "citi_credit_card",
      ),
    ).toThrow(/Missing or invalid amount/);

    expect(() =>
      mapRows(
        [{ "Transaction Date": "06/15/2026", Description: "Store", Amount: "1" }],
        "capital_one_credit_card",
      ),
    ).toThrow(/Missing or invalid amount/);

    const psPayment = mapRows(
      [{ Date: "06/15/2026", Description: "Payment", Amount: "50.00", Category: "Payment" }],
      "playstation_credit_card",
    );
    expect(psPayment.mapped[0]?.amount).toBe(50);

    const psDefaultCategory = mapRows(
      [{ Date: "06/15/2026", Description: "Game", Amount: "20.00", Category: "Purchase" }],
      "playstation_credit_card",
      "ps.csv",
    );
    expect(psDefaultCategory.mapped[0]?.amount).toBe(-20);

    const unknownPositive = mapRows(
      [{ Date: "06/15/2026", Description: "Refund", Amount: "25.00" }],
      "unknown",
    );
    expect(unknownPositive.mapped[0]?.amount).toBe(-25);

    const unknownNegative = mapRows(
      [{ Date: "06/15/2026", Description: "Store", Amount: "-12.00" }],
      "unknown",
    );
    expect(unknownNegative.mapped[0]?.amount).toBe(-12);
  });

  it("mapRows labels citi non-costco files as Citi Reward+", () => {
    const { mapped } = mapRows(
      [{ Status: "Posted", Date: "06/15/2026", Description: "Store", Debit: "10.00", Credit: "" }],
      "citi_credit_card",
      "rewards.csv",
    );
    expect(mapped[0]?.card_identity).toBe("Citi Reward+");
  });

  it("buildSummary handles empty category, missing amount, and duplicate dates", () => {
    const summary = buildSummary([
      { amount: undefined as unknown as number, date: "not-a-date", category: "" },
      { amount: -10, date: "2026-06-01", category: "Food" },
      { amount: -5, date: "2026-06-01", category: "Food" },
    ]);
    expect(summary.topCategories.some((c) => c.category === "Other")).toBe(true);
    expect(summary.totalSpending).toBe(15);
    expect(summary.dateRange.end).toBe("2026-06-01");
  });

  it("sheetToRows skips null headers and non-array rows", () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Posting Date", null, "Description", "Amount"],
      ["06/15/2026", null, "Store", -10],
    ]);
    expect(sheetToRows(ws)).toHaveLength(1);

    const headerScan = XLSX.utils.aoa_to_sheet([
      ["Posting Date", "Description", "Amount"],
      ["06/15/2026", "Store", "-5"],
    ]);
    const headerSpy = vi.spyOn(XLSX.utils, "sheet_to_json").mockReturnValueOnce([
      "not-an-array",
      ["Posting Date", "Description", "Amount"],
      ["06/15/2026", "Store", "-5"],
    ] as unknown as ReturnType<typeof XLSX.utils.sheet_to_json>);
    expect(sheetToRows(headerScan)).toHaveLength(1);
    headerSpy.mockRestore();

    const nullCellSpy = vi.spyOn(XLSX.utils, "sheet_to_json").mockReturnValueOnce([
      ["Posting Date", null, "Description", "Amount"],
      ["06/15/2026", "Store", "-5"],
    ] as unknown as ReturnType<typeof XLSX.utils.sheet_to_json>);
    expect(sheetToRows(XLSX.utils.aoa_to_sheet([["x"]]))).toHaveLength(1);
    nullCellSpy.mockRestore();

    const ws2 = XLSX.utils.aoa_to_sheet([
      ["Posting Date", null, "Description", "Amount"],
      [45292, null, "Store", -10],
    ]);
    const rows = sheetToRows(ws2);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.Description).toBe("Store");

    const dataWs = XLSX.utils.aoa_to_sheet([
      ["Posting Date", "Description", "Amount"],
      ["06/15/2026", "Store", "-5"],
    ]);
    const spy = vi.spyOn(XLSX.utils, "sheet_to_json").mockReturnValueOnce([
      ["Posting Date", "Description", "Amount"],
      "not-an-array",
      ["06/15/2026", "Store", "-5"],
    ] as unknown as ReturnType<typeof XLSX.utils.sheet_to_json>);
    expect(sheetToRows(dataWs)).toHaveLength(1);
    spy.mockRestore();
  });

  it("analyzeCsvBuffers handles zero net cash flow and missing categories", async () => {
    const balancedCsv =
      "Details,Posting Date,Description,Amount,Type,Balance\r\n" +
      "DEBIT,06/15/2026,Store,-50.00,DEBIT,50.00\r\n" +
      "CREDIT,06/16/2026,Payroll,50.00,CREDIT,100.00\r\n";
    const result = await analyzeCsvBuffers([
      { name: "a.csv", buffer: new TextEncoder().encode(balancedCsv).buffer },
      { name: "b.csv", buffer: new TextEncoder().encode(balancedCsv).buffer },
    ]);
    expect(result.insights.some((line) => line.includes("2 file"))).toBe(true);
    expect(result.insights.some((line) => line.includes("negative"))).toBe(false);
    expect(result.insights.some((line) => line.includes("positive"))).toBe(false);
  });

  it("analyzeCsvBuffers reads .xls workbooks", async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { "Posting Date": "06/15/2026", Description: "CAFE", Amount: "-4.00", Type: "DEBIT", Balance: "100", Details: "DEBIT" },
      ]),
      "Sheet1",
    );
    const buffer = XLSX.write(wb, { type: "array", bookType: "xls" });
    const result = await analyzeCsvBuffers([{ name: "legacy.xls", buffer }]);
    expect(result.transactions.length).toBeGreaterThan(0);
  });

  it("isCsvFileName accepts csv, xlsx, and xls", () => {
    expect(isCsvFileName("data.CSV")).toBe(true);
    expect(isCsvFileName("book.xlsx")).toBe(true);
    expect(isCsvFileName("legacy.xls")).toBe(true);
    expect(isCsvFileName("notes.txt")).toBe(false);
  });
});

describe("coverage100 openrouter", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("buildReportData reuses monthly buckets and custom categories", () => {
    const report = buildReportData([
      { id: "1", date: "2026-06-01", amount: 500, type: "income", finalCategory: "Income", merchant: "A" },
      { id: "2", date: "2026-06-15", amount: 300, type: "income", finalCategory: "CustomCat", merchant: "B" },
      { id: "3", date: "2026-06-02", amount: -100, type: "expense", finalCategory: "Food", merchant: "Cafe" },
      { id: "4", date: "2026-07-01", amount: -200, type: "expense", finalCategory: "Food", merchant: "Cafe" },
      { id: "5", date: "2026-07-02", amount: -50, type: "expense", finalCategory: "Food", merchant: "Shop" },
    ]);
    expect(report.monthlyTrend[0]?.month).toBe("2026-06");
    expect(report.dailySpending.length).toBeGreaterThan(1);
    expect(report.largestTransactions[0]?.amount).toBeGreaterThan(report.largestTransactions[1]?.amount ?? 0);
    expect(report.categoryTotals.CustomCat).toBe(300);
  });

  it("safeJsonParse keeps content when markdown fence does not match", () => {
    expect(safeJsonParse("```\nnot closed")).toBeNull();
  });

  it("generateInsightsWithOpenRouter handles timeout abort", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "mock-key");
    const originalSetTimeout = globalThis.setTimeout;
    vi.spyOn(globalThis, "setTimeout").mockImplementation((handler, delay, ...args) => {
      if (delay === 25000) {
        queueMicrotask(() => (handler as (...a: unknown[]) => void)(...args));
        return 1 as unknown as ReturnType<typeof setTimeout>;
      }
      return originalSetTimeout(handler, delay, ...args);
    });

    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
          });
        }),
      ),
    );

    const insights = await generateInsightsWithOpenRouter(buildReportData([]));
    expect(insights.score).toBe(70);
  });

  it("generateInsightsWithOpenRouter handles non-Error rejections", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "mock-key");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue("plain failure"));
    const insights = await generateInsightsWithOpenRouter(buildReportData([]));
    expect(insights.summary).toContain("You had $");
  });
});
