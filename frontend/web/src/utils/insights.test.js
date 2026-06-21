import { describe, it, expect } from "vitest";
import {
  categoryBreakdown,
  compareMonthOverMonth,
  detectRecurring,
  weekdayVsWeekend,
  topAnomalies,
  monthlyTotals,
  merchantBreakdown,
  monthlyByCategory,
  topCategoryMovers,
  dailyAverage,
  totalSpend,
} from "./insights.js";

describe("categoryBreakdown", () => {
  it("should sum amounts by category and sort descending", () => {
    const transactions = [
      { amount: -20, category: "Food" },
      { amount: -30, category: "Food" },
      { amount: -100, category: "Groceries" },
      { amount: 50, category: "Credit Card Payments" }, // ignored
    ];
    const result = categoryBreakdown(transactions);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ category: "Groceries", total: 100, count: 1 });
    expect(result[1]).toEqual({ category: "Food", total: 50, count: 2 });
  });
});

describe("compareMonthOverMonth", () => {
  it("should calculate correct delta between months", () => {
    const transactions = [
      { date: "2026-05-10", amount: -100.0, category: "Food" },
      { date: "2026-06-10", amount: -150.0, category: "Food" },
    ];
    const result = compareMonthOverMonth(transactions);
    expect(result.previous?.total).toBe(100);
    expect(result.current?.total).toBe(150);
    expect(result.deltaAbs).toBe(50);
    expect(result.deltaPct).toBe(50);
  });
});

describe("detectRecurring", () => {
  it("should detect recurring transactions over 3+ months with steady amounts", () => {
    const transactions = [
      { date: "2026-04-01", amount: -15.0, merchant_normalized: "Netflix", category: "Subscriptions" },
      { date: "2026-05-01", amount: -15.0, merchant_normalized: "Netflix", category: "Subscriptions" },
      { date: "2026-06-01", amount: -15.0, merchant_normalized: "Netflix", category: "Subscriptions" },
    ];
    const result = detectRecurring(transactions);
    expect(result).toHaveLength(1);
    expect(result[0]?.merchant).toBe("Netflix");
    expect(result[0]?.avg).toBe(15.0);
  });
});

describe("weekdayVsWeekend", () => {
  it("should split spend correctly between weekday and weekend", () => {
    const transactions = [
      { date: "2026-06-21T12:00:00", amount: -100.0, category: "Food" }, // Sunday (weekend)
      { date: "2026-06-17T12:00:00", amount: -150.0, category: "Food" }, // Wednesday (weekday)
    ];
    const result = weekdayVsWeekend(transactions);
    expect(result.weekend).toBe(100);
    expect(result.weekday).toBe(150);
    expect(result.weekendPct).toBe(40);
    expect(result.weekdayPct).toBe(60);
  });
});

describe("topAnomalies", () => {
  it("should flag single outliers vs merchant median", () => {
    const transactions = [
      { amount: -10.0, merchant_normalized: "Starbucks", category: "Food" },
      { amount: -10.0, merchant_normalized: "Starbucks", category: "Food" },
      { amount: -10.0, merchant_normalized: "Starbucks", category: "Food" },
      { amount: -50.0, merchant_normalized: "Starbucks", category: "Food" }, // outlier
    ];
    const result = topAnomalies(transactions);
    expect(result).toHaveLength(1);
    expect(result[0]?.merchant_normalized).toBe("Starbucks");
    expect(result[0]?.amount).toBe(-50.0);
    expect(result[0]?.ratio).toBe(5);
  });
});

describe("monthlyTotals", () => {
  it("aggregates spend by month and skips credit card payments", () => {
    const txns = [
      { date: "2026-05-01", amount: -100, category: "Food" },
      { date: "2026-06-01", amount: -50, category: "Food" },
      { date: "2026-06-02", amount: 200, category: "Credit Card Payments" },
    ];
    const totals = monthlyTotals(txns);
    expect(totals).toHaveLength(2);
    expect(totals[1].total).toBe(50);
  });
});

describe("merchantBreakdown", () => {
  it("groups by normalized merchant name", () => {
    const txns = [
      { amount: -20, merchant_normalized: "Starbucks", category: "Food" },
      { amount: -30, merchant_raw: "Whole Foods", category: "Groceries" },
    ];
    const result = merchantBreakdown(txns);
    expect(result).toHaveLength(2);
    expect(result.find((row) => row.merchant === "Starbucks").total).toBe(20);
  });
});

describe("monthlyByCategory", () => {
  it("returns per-month category totals", () => {
    const txns = [
      { date: "2026-06-01", amount: -20, category: "Food" },
      { date: "2026-06-02", amount: -30, category: "Shopping" },
    ];
    const result = monthlyByCategory(txns);
    expect(result[0].Food).toBe(20);
    expect(result[0].Shopping).toBe(30);
  });
});

describe("compareMonthOverMonth edge cases", () => {
  it("returns null deltas with fewer than two months", () => {
    const txns = [{ date: "2026-06-01", amount: -10, category: "Food" }];
    const result = compareMonthOverMonth(txns);
    expect(result.deltaPct).toBeNull();
    expect(result.previous).toBeNull();
  });
});

describe("topCategoryMovers", () => {
  it("returns empty when fewer than two months exist", () => {
    expect(topCategoryMovers([{ date: "2026-06-01", amount: -10, category: "Food" }])).toEqual([]);
  });

  it("ranks category swings between months", () => {
    const txns = [
      { date: "2026-05-01", amount: -100, category: "Food" },
      { date: "2026-06-01", amount: -200, category: "Food" },
      { date: "2026-05-02", amount: -50, category: "Shopping" },
      { date: "2026-06-02", amount: -10, category: "Shopping" },
    ];
    const movers = topCategoryMovers(txns);
    expect(movers[0].category).toBe("Food");
    expect(movers[0].deltaAbs).toBe(100);
  });
});

describe("dailyAverage and totalSpend", () => {
  it("computes spend averages and totals", () => {
    const txns = [
      { date: "2026-06-01", amount: -40, category: "Food" },
      { date: "2026-06-01", amount: -10, category: "Food" },
      { date: "2026-06-02", amount: -50, category: "Food" },
      { date: "2026-06-03", amount: 100, category: "Credit Card Payments" },
    ];
    expect(totalSpend(txns)).toBe(100);
    expect(dailyAverage(txns)).toBe(50);
    expect(dailyAverage([])).toBe(0);
  });
});
