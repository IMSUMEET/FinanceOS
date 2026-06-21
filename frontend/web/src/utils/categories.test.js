import { describe, it, expect } from "vitest";
import {
  categoryColor,
  categoryTint,
  categoryPillStyle,
  categoryDisplayLabel,
  categoryEmoji,
  CATEGORIES,
} from "./categories.js";

describe("categories", () => {
  it("exports the expected category list", () => {
    expect(CATEGORIES).toContain("Food");
    expect(CATEGORIES).toContain("Other");
  });

  it("returns mapped colors and falls back to Other", () => {
    expect(categoryColor("Food")).toBe("#f97316");
    expect(categoryColor("Unknown")).toBe(categoryColor("Other"));
  });

  it("returns mapped tints and falls back to Other", () => {
    expect(categoryTint("Groceries")).toContain("emerald");
    expect(categoryTint("Unknown")).toBe(categoryTint("Other"));
  });

  it("returns pill styles with fuzzy match fallback", () => {
    expect(categoryPillStyle("Food & Dining")).toBeTruthy();
    expect(categoryPillStyle("Unknown")).toBe(categoryPillStyle("Other"));
    expect(categoryPillStyle(null)).toBe(categoryPillStyle("Other"));
  });

  it("returns display labels with abbreviations", () => {
    expect(categoryDisplayLabel("Food & Dining")).toBe("DINING");
    expect(categoryDisplayLabel("Groceries")).toBe("GROCERIES");
    expect(categoryDisplayLabel("—")).toBe("OTHER");
    expect(categoryDisplayLabel(null)).toBe("OTHER");
  });

  it("returns emojis with fuzzy match fallback", () => {
    expect(categoryEmoji("Food & Dining")).toBeTruthy();
    expect(categoryEmoji("Unknown")).toBe(categoryEmoji("Other"));
    expect(categoryEmoji("—")).toBe("📊");
  });
});
