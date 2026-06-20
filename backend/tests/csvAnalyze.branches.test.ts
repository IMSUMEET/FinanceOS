import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import {
  detectFormat,
  mapRows,
  pickColumn,
  parseAmount,
  parseToIsoDateString,
  sheetToRows,
  COLUMN_HINTS,
} from "../src/csvAnalyze.js";

describe("csvAnalyze branch helpers", () => {
  it("pickColumn uses partial header matches and first-column fallback", () => {
    const headers = ["Foo", "Merchant Name", "Bar"];
    expect(pickColumn(headers, COLUMN_HINTS.merchant)).toBe("Merchant Name");
    expect(pickColumn(headers, ["missing-hint"])).toBe("Foo");
  });

  it("parseAmount accepts numeric and invalid values", () => {
    expect(parseAmount(12.5)).toBe(12.5);
    expect(parseAmount("$1,234.50")).toBe(1234.5);
    expect(parseAmount("bad")).toBeNull();
  });

  it("parseToIsoDateString handles slash, iso, and fallback parsing", () => {
    expect(parseToIsoDateString("6/5/2026")).toBe("2026-06-05");
    expect(parseToIsoDateString("2026/6/5")).toBe("2026-06-05");
    expect(parseToIsoDateString("2026-06-05T12:00:00Z")).toBe("2026-06-05");
    expect(parseToIsoDateString("not-a-date")).toBe("not-a-date");
  });

  it("detectFormat covers remaining card variants", () => {
    expect(
      detectFormat(["Date", "Description", "Amount", "Appears On Your Statement As", "Reference", "Extended Details"]),
    ).toBe("amex_credit_card");
    expect(detectFormat(["Date", "Description", "Amount"], "my-amex.csv")).toBe("amex_credit_card");
    expect(detectFormat(["Details", "Posting Date", "Description", "Amount", "Balance", "Status"])).toBe(
      "chase_checking",
    );
  });

  it("mapRows throws for missing merchant and invalid dates", () => {
    expect(() =>
      mapRows([{ Date: "", Description: "Store", Amount: "1" }], "chase_checking"),
    ).toThrow(/Missing date value/);
    expect(() =>
      mapRows([{ Date: "06/15/2026", Description: "", Amount: "1" }], "chase_checking"),
    ).toThrow(/Missing merchant description/);
    expect(() =>
      mapRows([{ Date: "bad-date", Description: "Store", Amount: "1" }], "chase_checking"),
    ).toThrow(/Invalid date value/);
    expect(() =>
      mapRows([{ Date: "06/15/2026", Description: "Store", Amount: "bad" }], "chase_checking"),
    ).toThrow(/Invalid amount value/);
  });

  it("mapRows handles chase amazon and playstation spend branches", () => {
    const amazon = mapRows(
      [{ "Transaction Date": "06/15/2026", Description: "Store", Amount: "-10.00", Category: "Shopping" }],
      "chase_amazon",
    );
    expect(amazon.mapped[0]?.card_identity).toBe("Chase Amazon");

    const psSpend = mapRows(
      [{ Date: "06/15/2026", Description: "Game", Amount: "20.00", Category: "Purchase" }],
      "playstation_credit_card",
    );
    expect(psSpend.mapped[0]?.amount).toBe(-20);
  });

  it("sheetToRows uses fallback header detection and excel serial dates", () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["alpha", "beta"],
      ["Posting Date", "Description", "Amount"],
      [45292, "Store", -10],
      ["", "", ""],
    ]);
    const rows = sheetToRows(ws);
    expect(rows[0]?.["Posting Date"]).toBe("2024-01-01");
    expect(rows).toHaveLength(1);

    const blank = sheetToRows(XLSX.utils.aoa_to_sheet([]));
    expect(blank).toEqual([]);

    const fallback = sheetToRows(XLSX.utils.aoa_to_sheet([["gamma", "delta"], ["a", "b"]]));
    expect(fallback).toHaveLength(1);
  });

  it("parseToIsoDateString parses natural language dates", () => {
    expect(parseToIsoDateString("June 15, 2026")).toBe("2026-06-15");
  });

  it("mapRows returns empty mapping for empty input", () => {
    expect(mapRows([], "unknown")).toEqual({ mapped: [], mapping: null });
  });

  it("sheetToRows returns empty when no usable rows exist", () => {
    const ws = XLSX.utils.aoa_to_sheet([["", ""], [null, null]]);
    expect(sheetToRows(ws)).toEqual([]);
  });
});
