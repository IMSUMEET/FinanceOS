import { describe, it, expect } from "vitest";
import { categorize, normalizeMerchant } from "../src/categorize.js";

describe("categorize", () => {
  it("should categorize subscriptions correctly", () => {
    expect(categorize("Netflix", "Netflix subscription")).toBe("Subscriptions");
    expect(categorize("Spotify", "")).toBe("Subscriptions");
    expect(categorize("Apple.com/Bill", "")).toBe("Subscriptions");
  });

  it("should categorize groceries correctly", () => {
    expect(categorize("Whole Foods", "")).toBe("Groceries");
    expect(categorize("Trader Joe's", "")).toBe("Groceries");
    expect(categorize("Costco Whse", "")).toBe("Groceries");
  });

  it("should categorize gas correctly", () => {
    expect(categorize("Chevron", "")).toBe("Gas");
    expect(categorize("Shell Gas Station", "")).toBe("Gas");
  });

  it("should default to Other if no match", () => {
    expect(categorize("Random Corp", "Consulting services")).toBe("Other");
  });
});

describe("normalizeMerchant", () => {
  it("should clean merchant name format", () => {
    expect(normalizeMerchant("STARBUCKS #1234")).toBe("Starbucks");
    expect(normalizeMerchant("UBER *EATS 99882")).toBe("Uber");
  });

  it("should handle empty or null values gracefully", () => {
    expect(normalizeMerchant("")).toBe("Unknown");
    expect(normalizeMerchant("****")).toBe("Unknown");
  });

  it("preserves empty word tokens while title-casing", () => {
    expect(normalizeMerchant("a  b")).toBe("A B");
  });
});
