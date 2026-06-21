import { describe, it, expect, vi, beforeEach } from "vitest";

describe("index CSV parse error path", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns CSV_PARSE_ERROR when analyzeCsvBuffers throws parse error", async () => {
    vi.doMock("../src/csvAnalyze.js", () => ({
      analyzeCsvBuffers: vi.fn().mockRejectedValue(new Error("CSV_PARSE_ERROR: bad file")),
      MAX_CSV_BYTES: 5 * 1024 * 1024,
      isCsvFileName: (name: string) => /\.(csv|xlsx|xls)$/i.test(name),
    }));

    const { app } = await import("../src/index.js");
    const formData = new FormData();
    formData.append("files", new File(["bad"], "data.csv", { type: "text/csv" }));

    const res = await app.request("/api/analyze", { method: "POST", body: formData });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("CSV_PARSE_ERROR");
  });
});

describe("index generic analyze failure path", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns ANALYZE_FAILED for generic analyze errors", async () => {
    vi.doMock("../src/csvAnalyze.js", () => ({
      analyzeCsvBuffers: vi.fn().mockRejectedValue(new Error("boom")),
      MAX_CSV_BYTES: 5 * 1024 * 1024,
      isCsvFileName: (name: string) => /\.(csv|xlsx|xls)$/i.test(name),
    }));

    const { app } = await import("../src/index.js");
    const formData = new FormData();
    formData.append("files", new File(["x"], "data.csv", { type: "text/csv" }));

    const res = await app.request("/api/analyze", { method: "POST", body: formData });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe("ANALYZE_FAILED");
  });
});
