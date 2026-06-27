import fs from "node:fs/promises";
import path from "node:path";
import { test, expect } from "@playwright/test";

const sampleCsvPath = path.resolve("tests/e2e/fixtures/sample.csv");

test.describe("Lambda 1 — CSV analyze API", () => {
  test("GET /health returns ok", async ({ request }) => {
    const res = await request.get("/health");
    expect(res.ok()).toBeTruthy();
    await expect(res.json()).resolves.toEqual({ status: "ok" });
  });

  test("GET / returns service metadata", async ({ request }) => {
    const res = await request.get("/");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.service).toBe("finance-os-api");
  });

  test("POST /api/analyze accepts multipart CSV and returns report", async ({ request }) => {
    const buffer = await fs.readFile(sampleCsvPath);

    const res = await request.post("/api/analyze", {
      multipart: {
        files: {
          name: "sample.csv",
          mimeType: "text/csv",
          buffer,
        },
      },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();

    expect(body.status).toBe("success");
    expect(body.mode).toBe("local-categorization-static-suggestions");
    expect(body.transactions.length).toBeGreaterThan(0);
    expect(body.reportData).toBeTruthy();
    expect(body.insights).toBeTruthy();
    expect(body.aiStatus).toBe("static");
    expect(body.insights.summary).toContain("income");
  });

  test("POST /api/analyze rejects non-multipart requests", async ({ request }) => {
    const res = await request.post("/api/analyze", {
      headers: { "Content-Type": "application/json" },
      data: { csv: "Date,Description,Amount\n2026-01-01,Test,-1" },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("INVALID_CONTENT_TYPE");
  });
});
