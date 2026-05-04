import Papa from "papaparse";
import { categorize, normalizeMerchant } from "./categorize.js";

export const MAX_CSV_BYTES = 5 * 1024 * 1024;

export type DetectedFormat = "chase_credit_card" | "chase_checking" | "unknown";

const COLUMN_HINTS = {
  date: ["date", "posted", "transaction date", "trans date", "posting date"],
  merchant: ["merchant", "description", "name", "details"],
  amount: ["amount", "debit", "value", "amt"],
};

function pickColumn(headers: string[], hints: string[]): string {
  const lc = headers.map((h) => String(h).toLowerCase().trim());
  for (const hint of hints) {
    const idx = lc.findIndex((h) => h === hint);
    if (idx !== -1) return headers[idx]!;
  }
  for (const hint of hints) {
    const idx = lc.findIndex((h) => h.includes(hint));
    if (idx !== -1) return headers[idx]!;
  }
  return headers[0]!;
}

function detectFormat(headers: string[]): DetectedFormat {
  const lc = headers.map((h) => String(h).toLowerCase().trim());
  const joined = lc.join("|");
  const has = (s: string) => joined.includes(s);
  if (has("transaction date") && has("post date") && has("category")) {
    return "chase_credit_card";
  }
  if (
    (has("posting date") && has("balance") && has("type")) ||
    (has("details") && has("posting date") && has("balance") && has("status"))
  ) {
    return "chase_checking";
  }
  return "unknown";
}

function parseAmount(raw: unknown): number | null {
  const n = Number(String(raw ?? "").replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export type AnalyzedTransaction = {
  date: string;
  merchant_raw: string;
  merchant_normalized: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  source: string;
  created_at: string;
};

function mapRows(rows: Record<string, unknown>[]): {
  mapped: AnalyzedTransaction[];
  mapping: { date: string; merchant: string; amount: string } | null;
} {
  if (!rows.length) return { mapped: [], mapping: null };
  const headers = Object.keys(rows[0]!);
  const mapping = {
    date: pickColumn(headers, COLUMN_HINTS.date),
    merchant: pickColumn(headers, COLUMN_HINTS.merchant),
    amount: pickColumn(headers, COLUMN_HINTS.amount),
  };
  const mapped: AnalyzedTransaction[] = [];
  for (const r of rows) {
    const rawAmount = parseAmount(r[mapping.amount]);
    if (rawAmount === null) continue;
    const merchantRaw = String(r[mapping.merchant] ?? "").trim();
    const merchantNorm = normalizeMerchant(merchantRaw);
    const date = String(r[mapping.date] ?? "").trim();
    if (!date || !merchantRaw) continue;
    const amount = rawAmount > 0 ? -rawAmount : rawAmount;
    const category = categorize(merchantNorm, merchantRaw);
    mapped.push({
      date,
      merchant_raw: merchantRaw,
      merchant_normalized: merchantNorm,
      description: merchantRaw,
      amount,
      currency: "USD",
      category,
      source: "csv-analyze",
      created_at: new Date(`${date}T12:00:00Z`).toISOString(),
    });
  }
  return { mapped, mapping };
}

function parseIsoDate(d: string): number | null {
  const t = Date.parse(d);
  return Number.isFinite(t) ? t : null;
}

function buildSummary(transactions: Pick<AnalyzedTransaction, "amount" | "date" | "category">[]) {
  let totalIncome = 0;
  let totalSpending = 0;
  const catMap = new Map<string, { category: string; total: number; count: number }>();
  let start: string | null = null;
  let end: string | null = null;
  let minTs = Infinity;
  let maxTs = -Infinity;

  for (const t of transactions) {
    const amt = Number(t.amount ?? 0);
    if (amt > 0) totalIncome += amt;
    else totalSpending += Math.abs(amt);

    const cat = t.category || "Other";
    const cur = catMap.get(cat) ?? { category: cat, total: 0, count: 0 };
    cur.total += Math.abs(amt);
    cur.count += 1;
    catMap.set(cat, cur);

    const ts = parseIsoDate(t.date);
    if (ts !== null) {
      if (ts < minTs) {
        minTs = ts;
        start = t.date;
      }
      if (ts > maxTs) {
        maxTs = ts;
        end = t.date;
      }
    }
  }

  const topCategories = Array.from(catMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const netCashFlow = totalIncome - totalSpending;

  return {
    totalTransactions: transactions.length,
    totalIncome,
    totalSpending,
    netCashFlow,
    topCategories,
    dateRange: { start, end },
  };
}

function buildInsights(summary: ReturnType<typeof buildSummary>, fileCount: number): string[] {
  const out: string[] = [];
  out.push(`Analyzed ${fileCount} file(s) with ${summary.totalTransactions} transactions.`);
  if (summary.topCategories[0]) {
    const top = summary.topCategories[0]!;
    out.push(`Highest spend category: ${top.category} (${top.total.toFixed(2)} total).`);
  }
  if (summary.netCashFlow < 0) {
    out.push("Net cash flow is negative for this upload (more outflows than inflows).");
  } else if (summary.netCashFlow > 0) {
    out.push("Net cash flow is positive for this upload.");
  }
  return out;
}

export type AnalyzedTransactionWithId = AnalyzedTransaction & { id: number };

export type AnalyzeSuccessBody = {
  status: "success";
  analysisId: string;
  createdAt: string;
  files: { fileName: string; rowCount: number; detectedFormat: DetectedFormat }[];
  summary: ReturnType<typeof buildSummary>;
  transactions: AnalyzedTransactionWithId[];
  insights: string[];
};

export async function analyzeCsvBuffers(inputs: { name: string; text: string }[]): Promise<AnalyzeSuccessBody> {
  const analysisId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const fileMetas: AnalyzeSuccessBody["files"] = [];
  const allTx: AnalyzedTransactionWithId[] = [];
  let nextId = 1;

  for (const { name, text } of inputs) {
    const result = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
    });
    const rows = result.data ?? [];
    if (!rows.length && (result.errors?.length ?? 0) > 0) {
      throw new Error(`CSV_PARSE_ERROR:${name}`);
    }
    const headers = rows.length ? Object.keys(rows[0]!) : [];
    const fmt = detectFormat(headers);
    const { mapped } = mapRows(rows);
    for (const t of mapped) {
      allTx.push({ ...t, id: nextId++ });
    }
    fileMetas.push({
      fileName: name,
      rowCount: mapped.length,
      detectedFormat: fmt,
    });
  }

  const summary = buildSummary(allTx);
  const insights = buildInsights(summary, inputs.length);

  return {
    status: "success",
    analysisId,
    createdAt,
    files: fileMetas,
    summary,
    transactions: allTx,
    insights,
  };
}

export function isCsvFileName(name: string): boolean {
  return name.toLowerCase().endsWith(".csv");
}
