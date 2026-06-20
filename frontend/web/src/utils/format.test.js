import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatAmountSpend,
  formatPct,
  formatDate,
  formatMonth,
  monthKey,
} from "./format.js";

describe("format helpers", () => {
  describe("formatCurrency", () => {
    it("formats standard USD positive/negative numbers", () => {
      expect(formatCurrency(123.45)).toContain("$123.45");
      expect(formatCurrency(-82.14)).toContain("-$82.14");
    });

    it("handles compact option", () => {
      expect(formatCurrency(1200000, { compact: true })).toContain("$1.2M");
    });

    it("handles signed option and zero values", () => {
      expect(formatCurrency(50, { signed: true })).toContain("+$50.00");
      expect(formatCurrency(0)).toContain("$0.00");
      expect(formatCurrency(null)).toContain("$0.00");
    });
  });

  describe("formatAmountSpend", () => {
    it("converts negatives to positive formatted currency", () => {
      expect(formatAmountSpend(-100)).toContain("$100.00");
      expect(formatAmountSpend(100)).toContain("$100.00");
    });

    it("handles null amount", () => {
      expect(formatAmountSpend(null)).toContain("$0.00");
    });
  });

  describe("formatPct", () => {
    it("appends percent sign and sign prefix", () => {
      expect(formatPct(5.42)).toBe("+5.4%");
      expect(formatPct(-10.15)).toBe("-10.2%");
      expect(formatPct(null)).toBe("—");
      expect(formatPct(Number.NaN)).toBe("—");
      expect(formatPct(0)).toBe("0.0%");
    });
  });

  describe("formatDate", () => {
    it("formats date strings or passes through invalid", () => {
      expect(formatDate("2026-06-20")).toContain("Jun 20");
      expect(formatDate("")).toBe("");
      expect(formatDate("invalid-date")).toBe("invalid-date");
    });
  });

  describe("formatMonth", () => {
    it("formats year-month strings", () => {
      expect(formatMonth("2026-06")).toContain("Jun 26");
      expect(formatMonth("")).toBe("");
      expect(formatMonth("invalid")).toBe("invalid");
    });
  });

  describe("monthKey", () => {
    it("extracts month prefix key", () => {
      expect(monthKey("2026-06-20")).toBe("2026-06");
      expect(monthKey(null)).toBe("");
    });
  });
});
