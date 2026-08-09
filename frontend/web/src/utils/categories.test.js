import { describe, it, expect } from "vitest";
import {
  categoryColor,
  categoryTint,
  categoryPillStyle,
  categoryDisplayLabel,
  categoryEmoji,
  CATEGORIES,
  EXPENSE_CATEGORIES,
} from "./categories.js";

describe("categories", () => {
  it("exports the expected category list", () => {
    expect(EXPENSE_CATEGORIES).toHaveLength(10);
    expect(CATEGORIES.length).toBeGreaterThan(10);
    expect(CATEGORIES).toContain("Food");
    expect(CATEGORIES).toContain("Housing");
    expect(CATEGORIES).toContain("Salary");
    expect(CATEGORIES).toContain("Other");
  });

  it("returns mapped colors and falls back to Other", () => {
    expect(categoryColor("Food")).toBe("#f97316");
    expect(categoryColor("Unknown")).toBe(categoryColor("Other"));
  });

  it("returns mapped tints and falls back to Other", () => {
    expect(categoryTint("Housing")).toContain("violet");
    expect(categoryTint("Unknown")).toBe(categoryTint("Other"));
  });

  it("returns pill styles with fuzzy match fallback", () => {
    expect(categoryPillStyle("Transportation")).toBeTruthy();
    expect(categoryPillStyle("Unknown")).toBe(categoryPillStyle("Other"));
    expect(categoryPillStyle(null)).toBe(categoryPillStyle("Other"));
  });

  it("returns display labels with abbreviations", () => {
    expect(categoryDisplayLabel("Transportation")).toBe("TRANSPORT");
    expect(categoryDisplayLabel("—")).toBe("OTHER");
    expect(categoryDisplayLabel(null)).toBe("OTHER");
  });

  it("returns emojis with fuzzy match fallback", () => {
    expect(categoryEmoji("Housing")).toBe("🏠");
    expect(categoryEmoji("Unknown")).toBe(categoryEmoji("Other"));
    expect(categoryEmoji("—")).toBe("📊");
  });
});
