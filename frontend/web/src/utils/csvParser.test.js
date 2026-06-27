import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import {
  detectFormat,
  parseRows,
  validateCsvFiles,
  pickColumn,
  parseToIsoDateString,
  parseExcelDate,
  sheetToRows,
  stampIds,
  buildMockAnalysisFromRows,
  MAX_FILE_BYTES,
  COLUMN_HINTS,
} from "./csvParser.js";

describe("detectFormat extended", () => {
  it("detects additional card formats", () => {
    expect(
      detectFormat(["Appears On Your Statement As", "Reference", "Extended Details"], "Amex"),
    ).toBe("amex_credit_card");
    expect(detectFormat(["Date", "Description", "Amount"], "My Amex Card")).toBe(
      "amex_credit_card",
    );
    expect(detectFormat(["Status", "Debit", "Credit", "Description"])).toBe("citi_credit_card");
    expect(detectFormat(["Location", "Category", "Date", "Description", "Amount"])).toBe(
      "playstation_credit_card",
    );
    expect(detectFormat(["Trans. Date", "Post Date", "Description", "Amount", "Category"])).toBe(
      "discover_credit_card",
    );
    expect(
      detectFormat(
        ["Transaction Date", "Post Date", "Category", "Description", "Amount"],
        "Chase Amazon",
      ),
    ).toBe("chase_amazon");
  });
});

describe("pickColumn", () => {
  it("finds exact and partial header matches", () => {
    const headers = ["Posting Date", "Merchant Name", "Amount"];
    expect(pickColumn(headers, COLUMN_HINTS.date)).toBe("Posting Date");
    expect(pickColumn(headers, ["missing"])).toBe("Posting Date");
  });
});

describe("parseToIsoDateString", () => {
  it("normalizes slash, iso, and parsed fallback dates", () => {
    expect(parseToIsoDateString("6/5/2026")).toBe("2026-06-05");
    expect(parseToIsoDateString("2026/6/5")).toBe("2026-06-05");
    expect(parseToIsoDateString("2026-06-05T12:00:00Z")).toBe("2026-06-05");
    expect(parseToIsoDateString("not-a-date")).toBe("not-a-date");
  });
});

describe("parseExcelDate", () => {
  it("converts excel serial numbers to ISO dates", () => {
    expect(parseExcelDate(45292)).toBe("2024-01-01");
  });
});

describe("sheetToRows", () => {
  it("extracts rows from a worksheet with a header row", () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["junk"],
      ["Posting Date", "Description", "Amount"],
      ["06/15/2026", "Store", -10],
    ]);
    const rows = sheetToRows(ws);
    expect(rows).toHaveLength(1);
    expect(rows[0].Description).toBe("Store");
  });

  it("converts numeric excel dates while building rows", () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Posting Date", "Description", "Amount"],
      [45292, "Store", -10],
    ]);
    const rows = sheetToRows(ws);
    expect(rows[0]["Posting Date"]).toBe("2024-01-01");
  });

  it("falls back to first non-empty row when no header match exists", () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["alpha", "beta"],
      ["gamma", "delta"],
    ]);
    const rows = sheetToRows(ws);
    expect(rows).toHaveLength(1);
  });

  it("returns empty rows when workbook has no usable content", () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["", ""],
      ["", ""],
    ]);
    expect(sheetToRows(ws)).toEqual([]);
  });

  it("returns empty array for blank sheets", () => {
    const ws = XLSX.utils.aoa_to_sheet([]);
    expect(sheetToRows(ws)).toEqual([]);
  });
});

describe("parseRows extended", () => {
  it("parses citi debit/credit rows", () => {
    const rows = [{ Date: "06/15/2026", Description: "Store", Debit: "10.00", Credit: "" }];
    const { mapped } = parseRows(rows, "citi_credit_card");
    expect(mapped[0].amount).toBe(-10);
    expect(mapped[0].card_identity).toContain("Citi");
  });

  it("parses chase amazon rows", () => {
    const rows = [
      {
        "Transaction Date": "06/15/2026",
        Description: "Store",
        Amount: "-10.00",
        Category: "Shopping",
      },
    ];
    const { mapped } = parseRows(rows, "chase_amazon");
    expect(mapped[0].card_identity).toBe("Chase Amazon");
  });

  it("labels citi files as costco when filename matches", () => {
    const rows = [{ Date: "06/15/2026", Description: "Store", Debit: "10.00", Credit: "" }];
    const { mapped } = parseRows(rows, "citi_credit_card", "costco-statement.csv");
    expect(mapped[0].card_identity).toBe("Costco Credit Card");
  });

  it("parses unknown formats using sign heuristics", () => {
    const rows = [{ Date: "06/15/2026", Description: "Store", Amount: "12.00" }];
    const positive = parseRows(rows, "unknown");
    expect(positive.mapped[0].amount).toBe(-12);
    const negative = parseRows(
      [{ Date: "06/15/2026", Description: "Refund", Amount: "-12.00" }],
      "unknown",
    );
    expect(negative.mapped[0].amount).toBe(-12);
  });

  it("parses capital one credit as positive income-like amount", () => {
    const rows = [
      { "Transaction Date": "06/15/2026", Description: "Refund", Debit: "", Credit: "15.00" },
    ];
    const { mapped } = parseRows(rows, "capital_one_credit_card");
    expect(mapped[0].amount).toBe(15);
  });

  it("parses amex and discover as negative spend", () => {
    const amex = parseRows(
      [{ Date: "06/15/2026", Description: "Store", Amount: "12.00" }],
      "amex_credit_card",
    );
    expect(amex.mapped[0].amount).toBe(-12);

    const discover = parseRows(
      [{ "Trans. Date": "06/15/2026", Description: "Store", Amount: "12.00" }],
      "discover_credit_card",
    );
    expect(discover.mapped[0].amount).toBe(-12);
  });

  it("handles playstation payment category as positive amount", () => {
    const rows = [
      { Date: "06/15/2026", Description: "Payment", Amount: "100", Category: "Payment" },
    ];
    const { mapped } = parseRows(rows, "playstation_credit_card");
    expect(mapped[0].amount).toBe(100);
    expect(mapped[0].category).toBe("Credit Card Payments");
  });

  it("treats playstation spend as negative", () => {
    const rows = [{ Date: "06/15/2026", Description: "Game", Amount: "20", Category: "Purchase" }];
    const { mapped } = parseRows(rows, "playstation_credit_card");
    expect(mapped[0].amount).toBe(-20);
  });

  it("returns empty mapped rows for empty input", () => {
    expect(parseRows([], "chase_checking")).toEqual({ mapped: [], mapping: null });
  });

  it("throws descriptive errors for invalid rows", () => {
    expect(() =>
      parseRows([{ Date: "", Description: "Store", Amount: "1" }], "chase_checking", "file.csv"),
    ).toThrow(/Missing date value/);
    expect(() =>
      parseRows([{ Date: "06/15/2026", Description: "", Amount: "1" }], "chase_checking"),
    ).toThrow(/Missing merchant description/);
    expect(() =>
      parseRows([{ Date: "06/15/2026", Description: "Store", Amount: "bad" }], "chase_checking"),
    ).toThrow(/Invalid amount value/);
    expect(() =>
      parseRows(
        [{ Date: "06/15/2026", Description: "Store", Debit: "", Credit: "" }],
        "citi_credit_card",
      ),
    ).toThrow(/Missing or invalid amount/);
  });
});

describe("validateCsvFiles extended", () => {
  it("flags empty file lists", () => {
    expect(validateCsvFiles([]).ok).toBe(false);
  });

  it("approves xlsx files under size limit", () => {
    expect(validateCsvFiles([{ name: "data.xlsx", size: 1000 }]).ok).toBe(true);
  });

  it("exports max file bytes constant", () => {
    expect(MAX_FILE_BYTES).toBe(5 * 1024 * 1024);
  });
});

describe("stampIds", () => {
  it("stamps ids and created_at timestamps", () => {
    const stamped = stampIds([{ date: "2026-06-01", amount: -10 }]);
    expect(stamped[0].id).toBe(1);
    expect(stamped[0].created_at).toContain("2026-06-01");
  });
});

describe("buildMockAnalysisFromRows", () => {
  it("builds mock analysis payload", () => {
    const rows = [{ date: "2026-06-01", amount: -10, category: "Food" }];
    const analysis = buildMockAnalysisFromRows(rows, [{ name: "data.csv" }]);
    expect(analysis.status).toBe("success");
    expect(analysis.transactions).toHaveLength(1);
    expect(analysis.insights[0]).toContain("mock mode");
  });
});
