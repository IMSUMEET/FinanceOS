import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { app } from "../src/index.js";

describe("backend routes", () => {
  beforeEach(() => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });
  it("should return root info", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      ok: true,
      service: "finance-os-api",
      hint: "POST /api/analyze (multipart CSV) or GET /health.",
    });
  });

  it("should return health status", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });
  });

  it("should validate content type on POST /api/analyze", async () => {
    const res = await app.request("/api/analyze", {
      method: "POST",
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.code).toBe("INVALID_CONTENT_TYPE");
  });

  it("should return error if no files are uploaded", async () => {
    const formData = new FormData();
    const res = await app.request("/api/analyze", {
      method: "POST",
      body: formData,
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.code).toBe("MISSING_FILES");
  });

  it("should return error for invalid file type extensions", async () => {
    const formData = new FormData();
    const file = new File(["dummy content"], "data.txt", { type: "text/plain" });
    formData.append("files", file);

    const res = await app.request("/api/analyze", {
      method: "POST",
      body: formData,
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.code).toBe("INVALID_FILE_TYPE");
  });

  it("should return error for invalid mime types", async () => {
    const formData = new FormData();
    const file = new File(["dummy content"], "data.csv", { type: "image/png" });
    formData.append("files", file);

    const res = await app.request("/api/analyze", {
      method: "POST",
      body: formData,
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.code).toBe("INVALID_FILE_TYPE");
  });

  it("should return error for too large file sizes", async () => {
    const formData = new FormData();
    // 6MB file
    const file = new File([new ArrayBuffer(6 * 1024 * 1024)], "large.csv", { type: "text/csv" });
    formData.append("files", file);

    const res = await app.request("/api/analyze", {
      method: "POST",
      body: formData,
    });
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.code).toBe("FILE_TOO_LARGE");
  });

  it("should parse files successfully and return JSON response", async () => {
    const csvContent =
      "Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #\r\n" +
      "DEBIT,06/15/2026,STARBUCKS,-4.50,DEBIT,1200.00,\r\n";
    const formData = new FormData();
    const file = new File([csvContent], "data.csv", { type: "text/csv" });
    formData.append("files", file);

    const res = await app.request("/api/analyze", {
      method: "POST",
      body: formData,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.mode).toBe("local-categorization-ai-suggestions");
    expect(body.transactions).toHaveLength(1);
    expect(body.transactions[0].merchant).toBe("Starbucks");
    expect(body.reportData.totalExpenses).toBe(5); // Rounded
  });

  it("returns error on complete failure to read body", async () => {
    const res = await app.request("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data; boundary=invalid-boundary"
      },
      body: "invalid-multipart-body"
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.code).toBe("MULTIPART_READ_FAILED");
  });

  it("should parse an array of uploaded files", async () => {
    const formData = new FormData();
    const file1 = new File(["Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #\r\nDEBIT,06/15/2026,STARBUCKS,-4.50,DEBIT,1200.00,\r\n"], "data1.csv", { type: "text/csv" });
    const file2 = new File(["Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #\r\nDEBIT,06/16/2026,WHOLE FOODS,-10.00,DEBIT,1190.00,\r\n"], "data2.csv", { type: "text/csv" });
    formData.append("files", file1);
    formData.append("files", file2);

    const res = await app.request("/api/analyze", {
      method: "POST",
      body: formData,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.transactions).toHaveLength(2);
  });

  it("should accept Excel mime type application/vnd.ms-excel", async () => {
    const formData = new FormData();
    const file = new File(["Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #\r\nDEBIT,06/15/2026,STARBUCKS,-4.50,DEBIT,1200.00,\r\n"], "data.xls", { type: "application/vnd.ms-excel" });
    formData.append("files", file);

    const res = await app.request("/api/analyze", {
      method: "POST",
      body: formData,
    });
    expect(res.status).toBe(200);
  });

  it("accepts additional csv mime types and array file fields", async () => {
    const csv =
      "Details,Posting Date,Description,Amount,Type,Balance\r\n" +
      "DEBIT,06/15/2026,STARBUCKS,-4.50,DEBIT,1200.00\r\n";

    for (const type of ["application/csv", "application/octet-stream", "text/plain"]) {
      const formData = new FormData();
      formData.append("files", new File([csv], "data.csv", { type }));
      const res = await app.request("/api/analyze", { method: "POST", body: formData });
      expect(res.status).toBe(200);
    }

    const formData = new FormData();
    const file = new File([csv], "data.csv", { type: "text/csv" });
    formData.append("files[]", file);
    const res = await app.request("/api/analyze", { method: "POST", body: formData });
    expect(res.status).toBe(200);
  });

  it("accepts xlsx uploads with spreadsheet mime type", async () => {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        {
          Details: "DEBIT",
          "Posting Date": "06/15/2026",
          Description: "STARBUCKS",
          Amount: "-4.50",
          Type: "DEBIT",
          Balance: "1200.00",
        },
      ]),
      "Sheet1",
    );
    const bytes = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const formData = new FormData();
    formData.append(
      "files",
      new File([bytes], "data.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );
    const res = await app.request("/api/analyze", { method: "POST", body: formData });
    expect(res.status).toBe(200);
  });

  it("reports ai success when insights are not fallback", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "mock-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                summary: "Custom insight",
                score: 88,
                riskLevel: "low",
                observations: [],
                recommendations: [],
                anomalies: [],
              }),
            },
          }],
        }),
      }),
    );

    const csvContent =
      "Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #\r\n" +
      "DEBIT,06/15/2026,STARBUCKS,-4.50,DEBIT,1200.00,\r\n";
    const formData = new FormData();
    formData.append("files", new File([csvContent], "data.csv", { type: "text/csv" }));

    const res = await app.request("/api/analyze", { method: "POST", body: formData });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.aiStatus).toBe("success");
    expect(body.insights.summary).toBe("Custom insight");
  });

  it("returns coach suggestions from POST /api/coach/suggestions", async () => {
    const res = await app.request("/api/coach/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: {
          period: { start: "2026-01-01", end: "2026-06-01" },
          totalTransactions: 5,
          totalIncome: 4000,
          totalExpenses: 2500,
          netCashFlow: 1500,
          savingsRate: 37.5,
          topCategories: [{ category: "Food", total: 600 }],
          topMerchants: [{ merchant: "Cafe", total: 200 }],
        },
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.suggestions).toHaveLength(3);
  });

  it("rejects coach suggestions without summary", async () => {
    const res = await app.request("/api/coach/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});
