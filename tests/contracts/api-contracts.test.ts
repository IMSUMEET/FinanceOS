import { describe, it, expect } from "vitest";
import { loadExamples, validateDef } from "../helpers/schema-validator.js";

describe("API contract — schema.json examples", () => {
  const examples = loadExamples();

  it("validates Transaction example", () => {
    validateDef("Transaction", examples.Transaction);
  });

  it("validates TransactionImport example", () => {
    validateDef("TransactionImport", examples.TransactionImport);
  });

  it("validates Profile example", () => {
    validateDef("Profile", examples.Profile);
  });

  it("validates Personality example", () => {
    validateDef("Personality", examples.Personality);
  });

  it("validates Filters example", () => {
    validateDef("Filters", examples.Filters);
  });

  it("validates NotificationItem example", () => {
    validateDef("NotificationItem", examples.NotificationItem);
  });

  it("validates MonthlyTotal example", () => {
    validateDef("MonthlyTotal", examples.MonthlyTotal);
  });

  it("validates CategoryBreakdown example", () => {
    validateDef("CategoryBreakdown", examples.CategoryBreakdown);
  });
});

describe("API contract — live Lambda responses", () => {
  it("GET /health matches health contract", async () => {
    const { app } = await import("../../backend/src/index.js");
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });
  });

  it("GET / matches service metadata contract", async () => {
    const { app } = await import("../../backend/src/index.js");
    const res = await app.request("/");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      ok: true,
      service: "finance-os-api",
    });
  });

  it("POST /api/analyze error envelope has status and code", async () => {
    const { app } = await import("../../backend/src/index.js");
    const res = await app.request("/api/analyze", { method: "POST" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.status).toBe("error");
    expect(typeof body.code).toBe("string");
    expect(typeof body.message).toBe("string");
  });

  it("POST /api/coach/suggestions success envelope", async () => {
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
    expect(body.suggestions).toHaveLength(3);
    for (const s of body.suggestions) {
      expect(s).toMatchObject({
        title: expect.any(String),
        message: expect.any(String),
        impact: expect.stringMatching(/^(low|medium|high)$/),
        estimatedMonthlySavings: expect.any(Number),
      });
    }
  });
});
