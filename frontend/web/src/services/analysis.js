import { API_BASE_URL, AI_ANALYZER_BASE_URL, USE_MOCK } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { summarizeTransactions } from "../utils/analysisSummary";

async function parseJsonResponse(res) {
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { message: text || "Invalid response" };
  }
  return body;
}

function throwIfNotOk(res, body) {
  if (res.ok) return;
  const message =
    (body && typeof body === "object" && (body.message || body.error)) ||
    `Request failed (${res.status})`;
  const err = new Error(message);
  err.status = res.status;
  err.body = body;
  throw err;
}

/** Resolve AI analyzer POST URL (Lambda 2 in prod; combined local server uses /api/ai-analyze). */
export function resolveAiAnalyzeUrl() {
  const base = AI_ANALYZER_BASE_URL;
  if (!base) {
    throw new Error(
      "Set VITE_AI_ANALYZER_URL to the FinanceOsAiCsvAnalyzerStack API Gateway URL.",
    );
  }
  if (API_BASE_URL && base === API_BASE_URL) {
    return `${base}${ENDPOINTS.aiAnalyze}`;
  }
  return `${base}/`;
}

export function normalizeAnalysisResponse(body) {
  if (!body || body.status !== "success") return body;

  if (body.summary) return body;

  if (body.reportData) {
    const rd = body.reportData;
    const topCategories = Object.entries(rd.categoryTotals || {})
      .map(([category, total]) => ({ category, total: Math.abs(Number(total) || 0) }))
      .filter((row) => row.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    return {
      ...body,
      summary: {
        totalTransactions: rd.totalTransactions ?? body.transactions?.length ?? 0,
        totalIncome: rd.totalIncome ?? 0,
        totalSpending: rd.totalExpenses ?? 0,
        netCashFlow: rd.netCashFlow ?? 0,
        topCategories,
        dateRange: {
          start: rd.period?.start ?? null,
          end: rd.period?.end ?? null,
        },
        mode: body.mode,
        aiStatus: body.aiStatus,
      },
    };
  }

  if (Array.isArray(body.transactions)) {
    return {
      ...body,
      summary: {
        ...summarizeTransactions(body.transactions),
        mode: body.mode,
        aiStatus: body.aiStatus,
      },
    };
  }

  return body;
}

/**
 * Lambda 1 — local rule-based categories + optional OpenRouter insights.
 * POST multipart CSVs. Do not use when USE_MOCK is true.
 */
export async function analyzeCsvFormData(formData) {
  if (USE_MOCK) {
    throw new Error("analyzeCsvFormData is not used in mock mode.");
  }

  const url = `${API_BASE_URL}${ENDPOINTS.analyze}`;
  const res = await fetch(url, {
    method: "POST",
    body: formData,
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });

  const body = await parseJsonResponse(res);
  throwIfNotOk(res, body);
  return normalizeAnalysisResponse(body);
}

/**
 * AI analyze — local categorization + static summary (OpenRouter coach suggestions are separate).
 * @param {string} csvText — combined CSV export
 */
export async function analyzeCsvWithLlm(csvText) {
  if (!AI_ANALYZER_BASE_URL) {
    throw new Error("AI analyzer URL is not configured (set VITE_AI_ANALYZER_URL).");
  }

  const url = resolveAiAnalyzeUrl();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/csv",
    },
    body: csvText,
  });

  const body = await parseJsonResponse(res);
  throwIfNotOk(res, body);
  return normalizeAnalysisResponse(body);
}

/**
 * Merge parsed upload rows into one CSV for the AI analyzer Lambda.
 * @param {{ parsedData: Record<string, unknown>[] }[]} pendingFiles
 */
export function buildCombinedCsvFromPendingFiles(pendingFiles) {
  const lines = ["Date,Description,Amount"];

  for (const pf of pendingFiles) {
    for (const row of pf.parsedData || []) {
      const keys = Object.keys(row);
      const lc = Object.fromEntries(keys.map((k) => [k.toLowerCase().trim(), k]));
      const dateKey =
        lc.date ||
        lc["transaction date"] ||
        lc["posted date"] ||
        keys.find((k) => k.toLowerCase().includes("date"));
      const descKey =
        lc.description ||
        lc.merchant ||
        lc.name ||
        keys.find((k) => /desc|merchant|name/i.test(k));
      const amtKey =
        lc.amount ||
        lc.debit ||
        lc.credit ||
        keys.find((k) => /amount|debit|credit|value/i.test(k));

      const date = String(row[dateKey] ?? "").trim();
      const description = String(row[descKey] ?? "").trim();
      let amount = row[amtKey];
      if (amount == null || amount === "") continue;
      if (!date && !description) continue;

      const escapedDesc = description.includes(",") ? `"${description.replace(/"/g, '""')}"` : description;
      lines.push(`${date},${escapedDesc},${amount}`);
    }
  }

  if (lines.length <= 1) {
    throw new Error("No rows found to send for LLM analysis.");
  }

  return lines.join("\n");
}
