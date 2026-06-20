import { describe, it, expect, vi } from "vitest";

vi.mock("papaparse", async (importOriginal) => {
  const Papa = await importOriginal<typeof import("papaparse")>();
  return {
    default: {
      ...Papa.default,
      parse: vi.fn((text: string, options?: unknown) => {
        if (text.includes("MOCK_NO_DATA")) {
          return { data: undefined, errors: [] };
        }
        if (text.includes("MOCK_ERRORS")) {
          return { data: [], errors: [{ type: "Quotes", code: "MissingQuotes", message: "err" }] };
        }
        if (text.includes("MOCK_NO_ERRORS")) {
          return { data: [], errors: undefined };
        }
        return Papa.default.parse(text, options as Parameters<typeof Papa.default.parse>[1]);
      }),
    },
  };
});

import { analyzeCsvBuffers } from "../src/csvAnalyze.js";

describe("analyzeCsvBuffers Papa edge cases", () => {
  it("handles undefined Papa parse data", async () => {
    const result = await analyzeCsvBuffers([
      { name: "mock.csv", buffer: new TextEncoder().encode("MOCK_NO_DATA").buffer },
    ]);
    expect(result.transactions).toEqual([]);
  });

  it("throws when Papa reports errors on empty rows", async () => {
    await expect(
      analyzeCsvBuffers([{ name: "bad.csv", buffer: new TextEncoder().encode("MOCK_ERRORS").buffer }]),
    ).rejects.toThrow("CSV_PARSE_ERROR:bad.csv");
  });

  it("accepts empty rows when Papa reports no errors", async () => {
    const result = await analyzeCsvBuffers([
      { name: "empty.csv", buffer: new TextEncoder().encode("MOCK_NO_ERRORS").buffer },
    ]);
    expect(result.transactions).toEqual([]);
  });
});
