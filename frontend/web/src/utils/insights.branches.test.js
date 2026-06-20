import { describe, it, expect } from "vitest";
import {
  compareMonthOverMonth,
  topCategoryMovers,
  detectRecurring,
  topAnomalies,
  monthlyTotals,
  categoryBreakdown,
  merchantBreakdown,
  monthlyByCategory,
  weekdayVsWeekend,
} from "./insights.js";

describe("insights branch coverage", () => {
  it("handles month-over-month with zero previous total", () => {
    const txns = [
      { date: "2026-05-01", amount: -0, category: "Food" },
      { date: "2026-06-01", amount: -100, category: "Food" },
    ];
    const result = compareMonthOverMonth(txns);
    expect(result.deltaPct).toBeNull();
  });

  it("handles category movers when previous category total was zero", () => {
    const txns = [
      { date: "2026-05-01", amount: -0, category: "Food" },
      { date: "2026-06-01", amount: -100, category: "Food" },
      { date: "2026-06-02", amount: -50, category: "Shopping" },
    ];
    const movers = topCategoryMovers(txns);
    expect(movers.some((m) => m.category === "Food" && m.deltaPct === 100)).toBe(true);
  });

  it("skips recurring merchants with high variance or zero average", () => {
    const volatile = [
      { date: "2026-04-01", amount: -10, merchant_normalized: "Spotify", category: "Subscriptions" },
      { date: "2026-05-01", amount: -50, merchant_normalized: "Spotify", category: "Subscriptions" },
      { date: "2026-06-01", amount: -10, merchant_normalized: "Spotify", category: "Subscriptions" },
    ];
    expect(detectRecurring(volatile)).toEqual([]);

    const zeroAvg = [
      { date: "2026-04-01", amount: -0, merchant_normalized: "Free", category: "Other" },
      { date: "2026-05-01", amount: -0, merchant_normalized: "Free", category: "Other" },
      { date: "2026-06-01", amount: -0, merchant_normalized: "Free", category: "Other" },
    ];
    expect(detectRecurring(zeroAvg)).toEqual([]);
  });

  it("skips anomalies when sample size is too small or median is zero", () => {
    expect(topAnomalies([
      { amount: -10, merchant_normalized: "OneOff", category: "Food" },
      { amount: -20, merchant_normalized: "OneOff", category: "Food" },
    ])).toEqual([]);

    expect(topAnomalies([
      { amount: -0, merchant_normalized: "Zero", category: "Food" },
      { amount: -0, merchant_normalized: "Zero", category: "Food" },
      { amount: -0, merchant_normalized: "Zero", category: "Food" },
    ])).toEqual([]);
  });

  it("skips rows without month keys and defaults missing categories", () => {
    expect(monthlyTotals([{ date: "", amount: -10, category: "Food" }])).toEqual([]);
    expect(categoryBreakdown([{ amount: -10, category: null }])).toEqual([
      { category: "Other", total: 10, count: 1 },
    ]);
    expect(merchantBreakdown([{ amount: -10, category: "Food" }])).toEqual([
      { merchant: "Unknown", total: 10, count: 1, category: "Food" },
    ]);
    expect(monthlyByCategory([{ date: "", amount: -10, category: "Food" }])).toEqual([]);
  });

  it("ignores credit card payments across aggregations", () => {
    const txns = [{ date: "2026-06-01", amount: -100, category: "Credit Card Payments" }];
    expect(monthlyTotals(txns)).toEqual([]);
    expect(categoryBreakdown(txns)).toEqual([]);
    expect(weekdayVsWeekend(txns).weekday).toBe(0);
  });

  it("limits anomalies to requested count and ignores low ratios", () => {
    const txns = [
      { amount: -10, merchant_normalized: "Store", category: "Food" },
      { amount: -11, merchant_normalized: "Store", category: "Food" },
      { amount: -12, merchant_normalized: "Store", category: "Food" },
      { amount: -13, merchant_normalized: "Store", category: "Food" },
      { amount: -14, merchant_normalized: "Store", category: "Food" },
      { amount: -15, merchant_normalized: "Store", category: "Food" },
    ];
    expect(topAnomalies(txns, 2)).toHaveLength(0);
  });

  it("skips weekday spend when dates are missing and finds true anomalies", () => {
    expect(weekdayVsWeekend([{ amount: -10, category: "Food" }]).weekday).toBe(0);

    const txns = [
      { amount: -10, merchant_normalized: "Store", category: "Food" },
      { amount: -10, merchant_normalized: "Store", category: "Food" },
      { amount: -10, merchant_normalized: "Store", category: "Food" },
      { amount: -40, merchant_normalized: "Store", category: "Food" },
    ];
    const anomalies = topAnomalies(txns, 1);
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].ratio).toBeGreaterThanOrEqual(2);
  });
});
