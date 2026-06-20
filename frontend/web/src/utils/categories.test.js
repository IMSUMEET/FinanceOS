import { describe, it, expect } from "vitest";
import { categoryColor, categoryTint, CATEGORIES } from "./categories.js";

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
});
