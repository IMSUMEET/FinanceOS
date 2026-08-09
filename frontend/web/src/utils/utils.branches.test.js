import { describe, it, expect } from "vitest";
import { classifyPersonality } from "./personality.js";
import { categoryColor, categoryTint } from "./categories.js";
import { categorize, normalizeMerchant } from "./categorize.js";
import { computeHouseSale, buildInsightLines } from "./houseSaleCalculations.js";
import { summarizeTransactions } from "./analysisSummary.js";

describe("remaining utils branch coverage", () => {
  it("covers categorize and normalizeMerchant nullish paths", () => {
    expect(categorize(undefined, undefined)).toBe("Other");
    expect(normalizeMerchant(null)).toBe("Unknown");
  });

  it("covers category color and tint fallbacks", () => {
    expect(categoryColor("Housing")).toBe("#8b5cf6");
    expect(categoryTint("Unknown Category")).toBe(categoryTint("Other"));
  });

  it("covers personality balanced path when no archetype matches", () => {
    const txns = [
      { date: "2026-06-17T12:00:00", amount: -10, category: "Food" },
      { date: "2026-06-18T12:00:00", amount: -10, category: "Shopping" },
      { date: "2026-06-19T12:00:00", amount: -10, category: "Transport" },
      { date: "2026-06-20T12:00:00", amount: -10, category: "Entertainment" },
      { date: "2026-06-21T12:00:00", amount: -10, category: "Utilities" },
    ];
    expect(classifyPersonality(txns).key).toBe("balanced");
  });

  it("covers house sale validation branches for optional form negatives", () => {
    const result = computeHouseSale(
      {
        purchasePrice: 500000,
        downPayment: 100000,
        purchaseDate: "2020-01-15",
        annualInterestRate: 6.5,
        loanTermYears: 30,
        expectedSalePrice: 650000,
        agentCommissionPct: 5,
        closingCostsPct: 2,
        repairsImprovements: 0,
        annualPropertyTax: 0,
        annualInsurance: 0,
        monthlyHoa: 0,
        maintenanceTotal: 0,
        targetProfit: 0,
      },
      new Date("2024-06-01T12:00:00"),
      { agentCommissionPct: -1, closingCostsPct: -2 },
    );
    expect(result.validationErrors.length).toBeGreaterThan(0);
    expect(
      buildInsightLines({ ...result, sellingCostBlocked: true, validationErrors: [] })[0],
    ).toContain("100%");
  });

  it("covers analysis summary income branch", () => {
    const summary = summarizeTransactions([
      { date: "2026-06-01", amount: 50, category: "Income" },
      { date: "2026-06-02", amount: -10, category: "Food" },
    ]);
    expect(summary.totalIncome).toBe(50);
    expect(summary.totalSpending).toBe(10);
  });
});
