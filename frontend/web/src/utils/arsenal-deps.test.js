import { describe, it, expect } from "vitest";
import { cn } from "@oblivion-labs-dev/arsenal-frontend";
import { formatCurrency } from "@oblivion-labs-dev/arsenal-shared";

describe("Arsenal dependency wiring", () => {
  it("imports cn from @oblivion-labs-dev/arsenal-frontend", () => {
    expect(cn("a", "c")).toBe("a c");
  });

  it("imports formatters from @oblivion-labs-dev/arsenal-shared", () => {
    expect(formatCurrency(10)).toBe("$10.00");
  });
});
