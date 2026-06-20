import { describe, it, expect } from "vitest";
import { summarizeTransactions } from "./analysisSummary.js";

describe("summarizeTransactions", () => {
  it("summarizes income, spending, and top categories", () => {
    const txns = [
      { date: "2026-05-01", amount: 1000, category: "Income" },
      { date: "2026-06-01", amount: -200, category: "Food" },
      { date: "2026-06-02", amount: -100, category: "Shopping" },
      { date: "2026-06-03", amount: 500, category: "Credit Card Payments" },
    ];
    const summary = summarizeTransactions(txns);
    expect(summary.totalIncome).toBe(1000);
    expect(summary.totalSpending).toBe(300);
    expect(summary.netCashFlow).toBe(700);
    expect(summary.topCategories[0].category).toBe("Income");
    expect(summary.dateRange.start).toBe("2026-05-01");
    expect(summary.dateRange.end).toBe("2026-06-02");
  });

  it("handles empty transaction lists", () => {
    const summary = summarizeTransactions([]);
    expect(summary.totalTransactions).toBe(0);
    expect(summary.netCashFlow).toBe(0);
    expect(summary.dateRange.start).toBeNull();
  });

  it("ignores invalid dates when computing range", () => {
    const summary = summarizeTransactions([
      { date: "not-a-date", amount: -10, category: "Food" },
    ]);
    expect(summary.dateRange.start).toBeNull();
    expect(summary.totalSpending).toBe(10);
  });

  it("handles undefined amount in summary", () => {
    const summary = summarizeTransactions([
      { date: "2026-06-01", category: "Food" },
      { date: "2026-06-02", amount: -5, category: "Food" },
    ]);
    expect(summary.totalSpending).toBe(5);
  });
});
