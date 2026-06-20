import { describe, it, expect } from "vitest";
import {
  calculateProfitAtSalePrice,
  generateProfitCurveSeries,
  buildLoanCompositionDonutData,
  getHouseSaleNarrativeBullets,
  snapTargetProfitSlider,
} from "./houseSaleChartData.js";

describe("houseSaleChartData", () => {
  const params = {
    sellingCostRate: 0.07,
    remainingBalance: 300000,
    totalInvested: 150000,
  };

  it("calculates profit at a sale price", () => {
    const profit = calculateProfitAtSalePrice(650000, params);
    expect(Number.isFinite(profit)).toBe(true);
    expect(calculateProfitAtSalePrice("bad", params)).toBe(0);
    expect(calculateProfitAtSalePrice(650000, { ...params, sellingCostRate: 1 })).toBe(0);
  });

  it("generates a profit curve series", () => {
    const { points, start, end } = generateProfitCurveSeries({
      expectedSalePrice: 650000,
      targetSalePrice: 700000,
      ...params,
      pointCount: 5,
    });
    expect(points).toHaveLength(5);
    expect(end).toBeGreaterThan(start);
  });

  it("returns empty curve when selling costs are invalid", () => {
    const result = generateProfitCurveSeries({
      expectedSalePrice: 650000,
      sellingCostRate: 1,
      remainingBalance: 300000,
      totalInvested: 150000,
    });
    expect(result.points).toEqual([]);
  });

  it("builds loan composition donut data with fallback", () => {
    expect(buildLoanCompositionDonutData(100, 50, 200)).toHaveLength(3);
    expect(buildLoanCompositionDonutData(0, 0, 0)).toEqual([{ category: "—", total: 1 }]);
  });

  it("returns narrative bullets for valid and invalid models", () => {
    expect(getHouseSaleNarrativeBullets({ isValidModel: false })).toEqual([]);

    const negativeProceeds = getHouseSaleNarrativeBullets({
      isValidModel: true,
      netProceeds: -1000,
      trueProfit: -2000,
      expectedSalePrice: 500000,
      breakEvenSalePrice: 600000,
    });
    expect(negativeProceeds[0]).toContain("bring cash");

    const aboveBreakEven = getHouseSaleNarrativeBullets({
      isValidModel: true,
      netProceeds: 10000,
      trueProfit: 5000,
      expectedSalePrice: 650000,
      breakEvenSalePrice: 600000,
    });
    expect(aboveBreakEven.some((line) => line.includes("above break-even"))).toBe(true);

    const belowBreakEven = getHouseSaleNarrativeBullets({
      isValidModel: true,
      netProceeds: 10000,
      trueProfit: -1000,
      expectedSalePrice: 550000,
      breakEvenSalePrice: 600000,
    });
    expect(belowBreakEven.some((line) => line.includes("more in sale price"))).toBe(true);
  });

  it("extends curve range when start equals end", () => {
    const { points, end } = generateProfitCurveSeries({
      expectedSalePrice: Number.POSITIVE_INFINITY,
      targetSalePrice: Number.POSITIVE_INFINITY,
      sellingCostRate: 0.07,
      remainingBalance: 300000,
      totalInvested: 150000,
      pointCount: 3,
    });
    expect(points.length).toBe(3);
    expect(end).toBe(Number.POSITIVE_INFINITY);
  });

  it("returns zero profit for invalid selling cost rate", () => {
    expect(calculateProfitAtSalePrice(650000, { ...params, sellingCostRate: Number.NaN })).toBe(0);
  });

  it("snaps target profit slider values", () => {
    expect(snapTargetProfitSlider(12345)).toBe(10000);
    expect(snapTargetProfitSlider("bad")).toBe(0);
    expect(snapTargetProfitSlider(999999, { max: 100000 })).toBe(100000);
  });
});
