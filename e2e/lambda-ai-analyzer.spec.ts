import fs from "node:fs/promises";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { fetchOpenRouterMockRequests } from "./helpers/openrouter-mock.js";

const sampleCsvPath = path.resolve("e2e/fixtures/sample.csv");

test.describe("Lambda 2 — AI analyzer API", () => {
  test("POST /api/ai-analyze categorizes CSV and returns static insights", async ({ request }) => {
    const csv = await fs.readFile(sampleCsvPath, "utf8");

    const res = await request.post("/api/ai-analyze", {
      headers: { "Content-Type": "text/csv" },
      data: csv,
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();

    expect(body.status).toBe("success");
    expect(body.mode).toBe("ai-categorization-static-suggestions");
    expect(body.transactions).toHaveLength(3);
    expect(body.aiStatus.categorization).toBe("success");
    expect(body.aiStatus.insights).toBe("static");

    const foodTxn = body.transactions.find(
      (t: { description: string }) => t.description.includes("Whole Foods"),
    );
    expect(foodTxn?.finalCategory ?? foodTxn?.category).toBe("Food");

    expect(body.insights.summary).toContain("income");
    expect(typeof body.insights.score).toBe("number");
  });

  test("POST /api/ai-analyze accepts JSON body with csv field", async ({ request }) => {
    const csv = await fs.readFile(sampleCsvPath, "utf8");

    const res = await request.post("/api/ai-analyze", {
      headers: { "Content-Type": "application/json" },
      data: { csv },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.transactions.length).toBe(3);
  });

  test("POST /api/ai-analyze rejects empty CSV", async ({ request }) => {
    const res = await request.post("/api/ai-analyze", {
      headers: { "Content-Type": "text/csv" },
      data: "   ",
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/empty/i);
  });
});

test.describe("OpenRouter integration (mocked)", () => {
  test("backend calls OpenRouter for categorization only", async ({ request }) => {
    const csv = await fs.readFile(sampleCsvPath, "utf8");

    const before = await fetchOpenRouterMockRequests();
    const startCount = before.count;

    const res = await request.post("/api/ai-analyze", {
      headers: { "Content-Type": "text/csv" },
      data: csv,
    });
    expect(res.ok()).toBeTruthy();

    const after = await fetchOpenRouterMockRequests();
    expect(after.count - startCount).toBe(1);

    const newBodies = after.bodies.slice(startCount);
    const prompts = newBodies.map((raw) => {
      const parsed = JSON.parse(raw) as { messages?: { content?: string }[] };
      return parsed.messages?.[0]?.content ?? "";
    });

    expect(prompts.some((p) => p.includes("transaction categorization engine"))).toBe(true);
    expect(prompts.some((p) => p.includes("reportData"))).toBe(false);
  });
});
