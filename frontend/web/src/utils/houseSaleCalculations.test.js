import { describe, it, expect } from "vitest";
import { computeHouseSale, buildInsightLines } from "./houseSaleCalculations.js";

const validRaw = {
  purchasePrice: 500000,
  downPayment: 100000,
  purchaseDate: "2020-01-15",
  annualInterestRate: 6.5,
  loanTermYears: 30,
  expectedSalePrice: 650000,
  agentCommissionPct: 5,
  closingCostsPct: 2,
  repairsImprovements: 10000,
  annualPropertyTax: 6000,
  annualInsurance: 1200,
  monthlyHoa: 200,
  maintenanceTotal: 5000,
  targetProfit: 50000,
};

const asOf = new Date("2024-06-01T12:00:00");

describe("computeHouseSale", () => {
  it("computes a valid profitable sale model", () => {
    const result = computeHouseSale(validRaw, asOf, validRaw);
    expect(result.isValidModel).toBe(true);
    expect(result.canComputePriceTargets).toBe(true);
    expect(result.breakEvenSalePrice).toBeGreaterThan(0);
    expect(result.targetSalePrice).toBeGreaterThan(result.breakEvenSalePrice);
    expect(result.roiPercent).not.toBeNull();
  });

  it("collects validation errors for bad inputs", () => {
    const result = computeHouseSale(
      {
        ...validRaw,
        purchasePrice: 0,
        downPayment: -1,
        loanTermYears: 0,
        expectedSalePrice: -100,
        purchaseDate: "",
      },
      asOf,
      { agentCommissionPct: -1, closingCostsPct: -2 },
    );

    expect(result.isValidModel).toBe(false);
    expect(result.validationErrors.length).toBeGreaterThan(3);
    expect(result.errors.some((e) => e.includes("100%"))).toBe(false);
  });

  it("blocks projections when selling costs exceed 100%", () => {
    const result = computeHouseSale(
      { ...validRaw, agentCommissionPct: 80, closingCostsPct: 30 },
      asOf,
      { agentCommissionPct: 80, closingCostsPct: 30 },
    );
    expect(result.sellingCostBlocked).toBe(true);
    expect(result.isValidModel).toBe(false);
  });

  it("rejects future purchase dates", () => {
    const result = computeHouseSale(
      { ...validRaw, purchaseDate: "2099-01-01" },
      asOf,
      validRaw,
    );
    expect(result.validationErrors.some((e) => e.includes("future"))).toBe(true);
  });

  it("rejects invalid purchase date strings", () => {
    const result = computeHouseSale(
      { ...validRaw, purchaseDate: "not-a-date" },
      asOf,
      validRaw,
    );
    expect(result.validationErrors.some((e) => e.includes("not valid"))).toBe(true);
  });

  it("rejects down payment above purchase price and negative interest", () => {
    const highDown = computeHouseSale(
      { ...validRaw, downPayment: 600000 },
      asOf,
      validRaw,
    );
    expect(highDown.validationErrors.some((e) => e.includes("exceed"))).toBe(true);

    const negativeRate = computeHouseSale(
      { ...validRaw, annualInterestRate: -1 },
      asOf,
      validRaw,
    );
    expect(negativeRate.validationErrors.some((e) => e.includes("Interest rate"))).toBe(true);
  });

  it("handles zero invested cash insight path", () => {
    const result = computeHouseSale(validRaw, asOf, validRaw);
    const zeroInvested = {
      ...result,
      isValidModel: true,
      validationErrors: [],
      sellingCostBlocked: false,
      totalInvested: 0,
      trueProfit: 1000,
      netProceeds: 1000,
      expectedSalePrice: 650000,
      breakEvenSalePrice: 600000,
    };
    expect(buildInsightLines(zeroInvested).some((line) => line.includes("no ownership cash"))).toBe(true);
  });
});

describe("buildInsightLines", () => {
  it("returns guidance when selling costs are blocked", () => {
    const lines = buildInsightLines({
      sellingCostBlocked: true,
      validationErrors: [],
    });
    expect(lines[0]).toContain("100%");
  });

  it("returns validation guidance for invalid models", () => {
    const lines = buildInsightLines({
      isValidModel: false,
      validationErrors: ["bad input"],
    });
    expect(lines[0]).toContain("Fix the highlighted inputs");
  });

  it("describes profitable and unprofitable outcomes", () => {
    const profitable = buildInsightLines({
      isValidModel: true,
      validationErrors: [],
      sellingCostBlocked: false,
      netProceeds: 10000,
      trueProfit: 5000,
      totalInvested: 100000,
      expectedSalePrice: 650000,
      breakEvenSalePrice: 600000,
    });
    expect(profitable[0]).toContain("profitable");

    const unprofitable = buildInsightLines({
      isValidModel: true,
      validationErrors: [],
      sellingCostBlocked: false,
      netProceeds: -1000,
      trueProfit: -2000,
      totalInvested: 100000,
      expectedSalePrice: 500000,
      breakEvenSalePrice: 600000,
    });
    expect(unprofitable[0]).toContain("negative");
    expect(unprofitable.some((line) => line.includes("break-even"))).toBe(true);
  });

  it("returns guidance when model is invalid without validation errors", () => {
    const lines = buildInsightLines({
      isValidModel: false,
      validationErrors: [],
      sellingCostBlocked: false,
    });
    expect(lines[0]).toContain("Check your inputs");
  });

  it("describes cash-at-closing but not truly profitable scenario", () => {
    const lines = buildInsightLines({
      isValidModel: true,
      validationErrors: [],
      sellingCostBlocked: false,
      netProceeds: 1000,
      trueProfit: -500,
      totalInvested: 100000,
      expectedSalePrice: 650000,
      breakEvenSalePrice: 700000,
    });
    expect(lines[0]).toContain("not truly profitable");
    expect(lines.some((line) => line.includes("break-even sale price"))).toBe(true);
  });

  it("notes when expected price is near break-even", () => {
    const lines = buildInsightLines({
      isValidModel: true,
      validationErrors: [],
      sellingCostBlocked: false,
      netProceeds: 1000,
      trueProfit: 500,
      totalInvested: 100000,
      expectedSalePrice: 650200,
      breakEvenSalePrice: 650000,
    });
    expect(lines.some((line) => line.includes("very close"))).toBe(true);
  });
});
