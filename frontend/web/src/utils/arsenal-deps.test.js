import { describe, it, expect } from "vitest";
import { cn } from "@oblivion-labs/arsenal-frontend";
import { formatCurrency } from "@oblivion-labs/arsenal-shared";

describe("Arsenal dependency wiring", () => {
  it("imports cn from @oblivion-labs/arsenal-frontend", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });

  it("imports formatters from @oblivion-labs/arsenal-shared", () => {
    expect(formatCurrency(10)).toBe("$10.00");
  });
});
