import { describe, it, expect } from "vitest";
import { categorize, normalizeMerchant } from "../src/categorize.js";

describe("categorize", () => {
  it("should categorize subscriptions under Bills & Utilities", () => {
    expect(categorize("Netflix", "Netflix subscription")).toBe("Bills & Utilities");
    expect(categorize("Spotify", "")).toBe("Bills & Utilities");
    expect(categorize("Apple.com/Bill", "")).toBe("Bills & Utilities");
  });

  it("should categorize groceries under Food", () => {
    expect(categorize("Whole Foods", "")).toBe("Food");
    expect(categorize("Trader Joe's", "")).toBe("Food");
    expect(categorize("Costco Whse", "")).toBe("Food");
  });

  it("should categorize gas under Transportation", () => {
    expect(categorize("Chevron", "")).toBe("Transportation");
    expect(categorize("Shell Gas Station", "")).toBe("Transportation");
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
