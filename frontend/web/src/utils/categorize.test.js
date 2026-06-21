import { describe, it, expect } from "vitest";
import { categorize, normalizeMerchant } from "./categorize.js";

describe("categorize", () => {
  it("matches each major rule bucket", () => {
    expect(categorize("Netflix", "")).toBe("Subscriptions");
    expect(categorize("Whole Foods", "")).toBe("Groceries");
    expect(categorize("Chevron", "")).toBe("Gas");
    expect(categorize("Uber Eats", "")).toBe("Food");
    expect(categorize("Uber", "")).toBe("Transport");
    expect(categorize("Delta flight", "")).toBe("Travel");
    expect(categorize("Starbucks", "")).toBe("Food");
    expect(categorize("Amazon", "")).toBe("Shopping");
    expect(categorize("Steam", "")).toBe("Entertainment");
    expect(categorize("Verizon", "")).toBe("Utilities");
    expect(categorize("Thank you autopay", "")).toBe("Credit Card Payments");
    expect(categorize("Refund credit", "")).toBe("Payments");
  });

  it("returns Other when nothing matches", () => {
    expect(categorize("Consulting LLC", "services")).toBe("Other");
  });

  it("handles nullish merchant and description", () => {
    expect(categorize(null, null)).toBe("Other");
  });
});

describe("normalizeMerchant", () => {
  it("cleans noisy merchant strings", () => {
    expect(normalizeMerchant("STARBUCKS #1234")).toBe("Starbucks");
    expect(normalizeMerchant("UBER *EATS 99882")).toBe("Uber");
  });

  it("returns Unknown for empty input", () => {
    expect(normalizeMerchant("")).toBe("Unknown");
    expect(normalizeMerchant("****")).toBe("Unknown");
  });

  it("title-cases multi-word names", () => {
    expect(normalizeMerchant("whole  foods")).toBe("Whole Foods");
  });
});
