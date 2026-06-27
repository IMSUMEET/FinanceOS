import { test, expect } from "@playwright/test";

const coachSummary = {
  period: { start: "2026-01-01", end: "2026-06-01" },
  totalTransactions: 5,
  totalIncome: 4000,
  totalExpenses: 2500,
  netCashFlow: 1500,
  savingsRate: 37.5,
  topCategories: [{ category: "Food", total: 600 }],
  topMerchants: [{ merchant: "Cafe", total: 200 }],
};

test.describe("Coach suggestions API", () => {
  test("POST /api/coach/suggestions returns three suggestions", async ({ request }) => {
    const res = await request.post("/api/coach/suggestions", {
      data: { summary: coachSummary },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();

    expect(body.status).toBe("success");
    expect(body.suggestions).toHaveLength(3);
    expect(body.suggestions[0]).toMatchObject({
      title: expect.any(String),
      message: expect.any(String),
      impact: expect.stringMatching(/^(low|medium|high)$/),
      estimatedMonthlySavings: expect.any(Number),
    });
    expect(["openrouter", "fallback"]).toContain(body.source);
  });

  test("POST /api/coach/suggestions rejects missing summary", async ({ request }) => {
    const res = await request.post("/api/coach/suggestions", {
      data: {},
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("MISSING_SUMMARY");
  });

  test("POST /api/coach/suggestions rejects invalid JSON body", async ({ request }) => {
    const res = await request.fetch("/api/coach/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ not valid json",
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("INVALID_JSON");
  });
});
