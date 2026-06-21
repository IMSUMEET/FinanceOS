import { describe, it, expect } from "vitest";
import { buildCoachSummary, fallbackCoachSuggestions } from "./coachSummary.js";

const rows = [
  { date: "2026-04-01", amount: -50, category: "Food", merchant_normalized: "Cafe" },
  { date: "2026-04-15", amount: 2000, category: "Income", merchant_normalized: "Payroll" },
  { date: "2026-05-01", amount: -30, category: "Food", merchant_normalized: "Cafe" },
];

describe("buildCoachSummary", () => {
  it("builds compact summary for coach API", () => {
    const summary = buildCoachSummary(rows, { personalityLabel: "Saver" });
    expect(summary.totalTransactions).toBe(3);
    expect(summary.topCategories.length).toBeGreaterThan(0);
    expect(summary.personalityLabel).toBe("Saver");
  });
});

describe("fallbackCoachSuggestions", () => {
  it("returns three local suggestions", () => {
    const summary = buildCoachSummary(rows);
    const suggestions = fallbackCoachSuggestions(summary);
    expect(suggestions).toHaveLength(3);
    expect(suggestions[0]?.title).toBeTruthy();
  });
});
