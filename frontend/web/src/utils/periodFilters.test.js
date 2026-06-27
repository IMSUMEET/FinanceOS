import { describe, it, expect } from "vitest";
import {
  FLOW_PERIOD_ALL,
  FLOW_PERIOD_THIS_YEAR,
  FLOW_PERIOD_LAST_12,
  availableYears,
  filterTransactionsByPeriod,
  flowPeriodOptions,
} from "./periodFilters.js";

const rows = [
  { id: 1, date: "2026-03-01", amount: -10 },
  { id: 2, date: "2025-11-15", amount: -20 },
  { id: 3, date: "2024-06-01", amount: -5 },
];

describe("periodFilters (Arsenal-backed)", () => {
  it("returns all rows for ALL period", () => {
    expect(filterTransactionsByPeriod(rows, FLOW_PERIOD_ALL)).toHaveLength(3);
  });

  it("filters to this year", () => {
    const filtered = filterTransactionsByPeriod(rows, FLOW_PERIOD_THIS_YEAR);
    expect(filtered.every((r) => r.date.startsWith("2026"))).toBe(true);
  });

  it("filters to last 12 months", () => {
    const filtered = filterTransactionsByPeriod(rows, FLOW_PERIOD_LAST_12);
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.some((r) => r.date.startsWith("2024"))).toBe(false);
  });

  it("filters by year:YYYY token", () => {
    expect(filterTransactionsByPeriod(rows, "year:2025")).toHaveLength(1);
  });

  it("lists available years descending", () => {
    expect(availableYears(rows)).toEqual([2026, 2025, 2024]);
  });

  it("builds flow period options", () => {
    const options = flowPeriodOptions(rows);
    expect(options[0]).toEqual({ value: FLOW_PERIOD_ALL, label: "All time" });
    expect(options.some((o) => o.value === "year:2026")).toBe(true);
  });
});
