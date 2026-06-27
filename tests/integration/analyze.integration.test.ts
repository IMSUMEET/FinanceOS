import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFixture } from "../helpers/schema-validator.js";

describe("Integration — analyze pipeline", () => {
  beforeEach(() => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("end-to-end: CSV upload → transactions → report → static insights", async () => {
    const { app } = await import("../../backend/src/index.js");
    const csv = readFixture("sample-chase.csv");
    const formData = new FormData();
    formData.append("files", new File([csv], "sample-chase.csv", { type: "text/csv" }));

    const res = await app.request("/api/analyze", { method: "POST", body: formData });
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.status).toBe("success");
    expect(body.transactions.length).toBeGreaterThan(0);
    expect(body.reportData.totalIncome).toBeGreaterThan(0);
    expect(body.insights.summary).toMatch(/income|spend|cash/i);
    expect(body.aiStatus).toBe("static");
  });

  it("end-to-end: coach suggestions with fixture summary", async () => {
    const { app } = await import("../../backend/src/index.js");
    const summary = (await import("../fixtures/coach-summary.json", { assert: { type: "json" } }))
      .default;

    const res = await app.request("/api/coach/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(["fallback", "openrouter"]).toContain(body.source);
    expect(body.suggestions).toHaveLength(3);
  });
});

describe("Integration — failure handling", () => {
  it("returns structured error for invalid coach payload", async () => {
    const { app } = await import("../../backend/src/index.js");
    const res = await app.request("/api/coach/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("MISSING_SUMMARY");
  });

  it("returns structured error for oversize upload", async () => {
    const { app } = await import("../../backend/src/index.js");
    const formData = new FormData();
    formData.append(
      "files",
      new File([new ArrayBuffer(6 * 1024 * 1024)], "large.csv", { type: "text/csv" }),
    );
    const res = await app.request("/api/analyze", { method: "POST", body: formData });
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body.code).toBe("FILE_TOO_LARGE");
  });
});
