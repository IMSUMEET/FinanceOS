import { describe, it, expect } from "vitest";
import { classifyPersonality, AVATAR_VARIANTS } from "./personality.js";

describe("classifyPersonality", () => {
  it("returns balanced for empty input", () => {
    expect(classifyPersonality([]).key).toBe("balanced");
    expect(classifyPersonality(null).key).toBe("balanced");
  });

  it("detects subscriber archetype", () => {
    const txns = [];
    for (const month of ["2026-04", "2026-05", "2026-06"]) {
      txns.push({ date: `${month}-01`, amount: -15, category: "Subscriptions", merchant_normalized: "Netflix" });
    }
    for (let i = 0; i < 20; i++) {
      txns.push({ date: "2026-06-10", amount: -5, category: "Food", merchant_normalized: "Cafe" });
    }
    expect(classifyPersonality(txns).key).toBe("subscriber");
  });

  it("detects foodie archetype", () => {
    const txns = [
      ...Array.from({ length: 8 }, () => ({ date: "2026-06-01", amount: -40, category: "Food" })),
      ...Array.from({ length: 2 }, () => ({ date: "2026-06-02", amount: -10, category: "Shopping" })),
    ];
    expect(classifyPersonality(txns).key).toBe("foodie");
  });

  it("detects shopper archetype", () => {
    const txns = [
      ...Array.from({ length: 8 }, () => ({ date: "2026-06-01", amount: -50, category: "Shopping" })),
      ...Array.from({ length: 2 }, () => ({ date: "2026-06-02", amount: -10, category: "Food" })),
    ];
    expect(classifyPersonality(txns).key).toBe("shopper");
  });

  it("detects traveler archetype", () => {
    const txns = [
      ...Array.from({ length: 8 }, () => ({ date: "2026-06-01", amount: -60, category: "Travel" })),
      ...Array.from({ length: 2 }, () => ({ date: "2026-06-02", amount: -10, category: "Food" })),
    ];
    expect(classifyPersonality(txns).key).toBe("traveler");
  });

  it("detects weekender archetype", () => {
    const categories = ["Food", "Shopping", "Transport", "Entertainment", "Utilities", "Travel"];
    const txns = [];
    for (const category of categories) {
      txns.push({ date: "2026-06-21T12:00:00", amount: -30, category, merchant_normalized: category });
      txns.push({ date: "2026-06-22T12:00:00", amount: -30, category, merchant_normalized: `${category}-2` });
      txns.push({ date: "2026-06-17T12:00:00", amount: -5, category, merchant_normalized: `${category}-weekday` });
    }
    expect(classifyPersonality(txns).key).toBe("weekender");
  });

  it("detects traveler archetype for Gas spending", () => {
    const txns = [
      ...Array.from({ length: 8 }, () => ({ date: "2026-06-01", amount: -60, category: "Gas" })),
      ...Array.from({ length: 2 }, () => ({ date: "2026-06-02", amount: -10, category: "Food" })),
    ];
    expect(classifyPersonality(txns).key).toBe("traveler");
  });

  it("detects traveler archetype for Transport spending", () => {
    const txns = [
      ...Array.from({ length: 8 }, () => ({ date: "2026-06-01", amount: -60, category: "Transport" })),
      ...Array.from({ length: 2 }, () => ({ date: "2026-06-02", amount: -10, category: "Food" })),
    ];
    expect(classifyPersonality(txns).key).toBe("traveler");
  });

  it("falls back to balanced when no dominant category matches", () => {
    const txns = [
      ...Array.from({ length: 8 }, () => ({ date: "2026-06-03", amount: -50, category: "Entertainment" })),
      ...Array.from({ length: 2 }, () => ({ date: "2026-06-04", amount: -10, category: "Food" })),
    ];
    expect(classifyPersonality(txns).key).toBe("balanced");
  });

  it("exports avatar variants", () => {
    expect(AVATAR_VARIANTS).toContain("blue");
  });
});
