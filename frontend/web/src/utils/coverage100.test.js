import { describe, it, expect } from "vitest";
import { summarizeTransactions } from "./analysisSummary.js";
import { classifyPersonality } from "./personality.js";
import { computeHouseSale, buildInsightLines } from "./houseSaleCalculations.js";
import {
  calendarMonthsElapsed,
  computeRemainingBalance,
} from "./mortgageCalculations.js";
import {
  generateProfitCurveSeries,
  getHouseSaleNarrativeBullets,
} from "./houseSaleChartData.js";

const asOf = new Date("2024-06-01T12:00:00");

describe("coverage100 utils", () => {
  it("summarizeTransactions skips maxTs update for duplicate latest dates", () => {
    const summary = summarizeTransactions([
      { date: "2026-06-01", amount: -10, category: "Food" },
      { date: "2026-06-01", amount: -5, category: "Shopping" },
    ]);
    expect(summary.dateRange.end).toBe("2026-06-01");
    expect(summary.totalSpending).toBe(15);
  });

  it("classifyPersonality handles zero-spend transactions", () => {
    expect(classifyPersonality([{ date: "2026-06-01", amount: 0, category: "Food" }]).key).toBe(
      "balanced",
    );
  });

  it("computeHouseSale clamps invalid numeric inputs and skips roi when uninvested", () => {
    const clamped = computeHouseSale(
      {
        ...{
          purchasePrice: 500000,
          downPayment: 100000,
          purchaseDate: "2020-01-15",
          annualInterestRate: 6.5,
          loanTermYears: 30,
          expectedSalePrice: 650000,
          repairsImprovements: 0,
          annualPropertyTax: 6000,
          annualInsurance: 1200,
          monthlyHoa: 200,
          maintenanceTotal: 5000,
          targetProfit: 50000,
        },
        agentCommissionPct: -3,
        closingCostsPct: -2,
      },
      asOf,
      {},
    );
    expect(clamped.agentCommissionPct).toBe(0);
    expect(clamped.closingCostsPct).toBe(0);

    const result = computeHouseSale(
      {
        purchasePrice: Number.NaN,
        downPayment: Number.NaN,
        purchaseDate: "2020-01-15",
        annualInterestRate: 6.5,
        loanTermYears: 30,
        expectedSalePrice: Number.NaN,
        agentCommissionPct: 5,
        closingCostsPct: 2,
        repairsImprovements: Number.NaN,
        annualPropertyTax: 0,
        annualInsurance: 0,
        monthlyHoa: 0,
        maintenanceTotal: Number.NaN,
        targetProfit: Number.NaN,
      },
      asOf,
      { agentCommissionPct: "bad" },
    );
    expect(result.purchasePrice).toBe(0);
    expect(result.downPayment).toBe(0);
    expect(result.expectedSalePrice).toBe(0);
    expect(result.targetProfitInput).toBe(0);

    const noInvested = computeHouseSale(
      {
        purchasePrice: 500000,
        downPayment: 0,
        purchaseDate: "2020-01-15",
        annualInterestRate: 0,
        loanTermYears: 30,
        expectedSalePrice: 600000,
        agentCommissionPct: 5,
        closingCostsPct: 2,
        repairsImprovements: 0,
        annualPropertyTax: 0,
        annualInsurance: 0,
        monthlyHoa: 0,
        maintenanceTotal: 0,
        targetProfit: 0,
      },
      asOf,
      {},
    );
    expect(noInvested.totalInvested).toBe(0);
    expect(noInvested.roiPercent).toBeNull();
    expect(noInvested.cashReturnedMultiple).toBeNull();
  });

  it("buildInsightLines skips break-even comparison when expected sale price is zero", () => {
    const lines = buildInsightLines({
      isValidModel: true,
      validationErrors: [],
      sellingCostBlocked: false,
      netProceeds: 1000,
      trueProfit: 500,
      totalInvested: 100000,
      expectedSalePrice: 0,
      breakEvenSalePrice: 600000,
    });
    expect(lines.some((line) => line.includes("break-even"))).toBe(false);
  });

  it("calendarMonthsElapsed and remaining balance handle invalid inputs", () => {
    expect(calendarMonthsElapsed("2020-01-01", new Date())).toBe(0);
    expect(calendarMonthsElapsed(new Date("2025-01-01"), new Date("2020-01-01"))).toBe(0);
    expect(computeRemainingBalance(Number.NaN, 6, 360, 12)).toBe(0);
  });

  it("generateProfitCurveSeries handles falsy expected sale price", () => {
    const { points } = generateProfitCurveSeries({
      expectedSalePrice: 0,
      sellingCostRate: 0.07,
      remainingBalance: 300000,
      totalInvested: 150000,
      pointCount: 3,
    });
    expect(points).toHaveLength(3);
  });

  it("getHouseSaleNarrativeBullets skips break-even guidance when target is unknown", () => {
    const lines = getHouseSaleNarrativeBullets({
      isValidModel: true,
      netProceeds: 10000,
      trueProfit: 5000,
      expectedSalePrice: 650000,
      breakEvenSalePrice: null,
    });
    expect(lines.some((line) => line.includes("break-even"))).toBe(false);
  });
});
