import { describe, it, expect } from "vitest";
import {
  calendarMonthsElapsed,
  computeMonthlyPayment,
  computeRemainingBalance,
  computeMortgageSummary,
} from "./mortgageCalculations.js";

describe("calendarMonthsElapsed", () => {
  it("returns month difference between dates", () => {
    const purchase = new Date("2020-01-15T12:00:00");
    const asOf = new Date("2022-07-01T12:00:00");
    expect(calendarMonthsElapsed(purchase, asOf)).toBe(30);
  });

  it("returns 0 for invalid asOf date", () => {
    expect(calendarMonthsElapsed(new Date("2020-01-01"), new Date("invalid"))).toBe(0);
  });
});

describe("computeMonthlyPayment", () => {
  it("computes amortized payment with interest", () => {
    const payment = computeMonthlyPayment(300000, 6, 360);
    expect(payment).toBeGreaterThan(1700);
    expect(payment).toBeLessThan(1900);
  });

  it("handles zero-rate loans", () => {
    expect(computeMonthlyPayment(120000, 0, 120)).toBe(1000);
  });

  it("returns 0 for invalid inputs", () => {
    expect(computeMonthlyPayment(-1, 6, 360)).toBe(0);
    expect(computeMonthlyPayment(100000, 6, 0)).toBe(0);
  });
});

describe("computeRemainingBalance", () => {
  it("decreases balance over time with interest", () => {
    const balance = computeRemainingBalance(300000, 6, 360, 60);
    expect(balance).toBeGreaterThan(0);
    expect(balance).toBeLessThan(300000);
  });

  it("handles zero-rate amortization", () => {
    expect(computeRemainingBalance(120000, 0, 120, 12)).toBe(108000);
  });

  it("returns 0 for invalid term length", () => {
    expect(computeRemainingBalance(100000, 6, 0, 12)).toBe(0);
  });
});

describe("computeMortgageSummary", () => {
  it("returns a full mortgage snapshot", () => {
    const summary = computeMortgageSummary({
      purchasePrice: 500000,
      downPayment: 100000,
      purchaseDate: new Date("2020-01-15T12:00:00"),
      annualInterestRateApr: 6.5,
      loanTermYears: 30,
      asOf: new Date("2024-06-01T12:00:00"),
    });

    expect(summary.originalLoanAmount).toBe(400000);
    expect(summary.monthlyPayment).toBeGreaterThan(0);
    expect(summary.monthsElapsed).toBeGreaterThan(0);
    expect(summary.principalPaidDown).toBeGreaterThan(0);
    expect(summary.remainingBalance).toBeLessThan(summary.originalLoanAmount);
  });

  it("handles zero loan term years", () => {
    const summary = computeMortgageSummary({
      purchasePrice: 500000,
      downPayment: 100000,
      purchaseDate: new Date("2020-01-15T12:00:00"),
      annualInterestRateApr: 6.5,
      loanTermYears: 0,
      asOf: new Date("2024-06-01T12:00:00"),
    });
    expect(summary.monthsElapsed).toBe(0);
    expect(summary.monthlyPayment).toBe(0);
  });
});
