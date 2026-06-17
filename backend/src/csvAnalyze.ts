import Papa from "papaparse";
import { categorize, normalizeMerchant } from "./categorize.js";

export const MAX_CSV_BYTES = 5 * 1024 * 1024;

export type DetectedFormat = "chase_credit_card" | "chase_checking" | "amex_credit_card" | "chase_amazon" | "unknown";

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

function detectFormat(headers: string[], name: string = ""): DetectedFormat {
  const lc = headers.map((h) => String(h).toLowerCase().trim());
  const joined = lc.join("|");
  const has = (s: string) => joined.includes(s);

  if (has("appears on your statement as") && has("reference") && has("extended details")) {
    return "amex_credit_card";
  }

  if (has("transaction date") && has("post date") && has("category")) {
    if (name.toLowerCase().includes("amazon")) {
      return "chase_amazon";
    }
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
  card_identity?: string;
  created_at: string;
};

function parseToIsoDateString(dateStr: string): string {
  const match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const [_, month, day, year] = match;
    const paddedMonth = month!.padStart(2, "0");
    const paddedDay = day!.padStart(2, "0");
    return `${year}-${paddedMonth}-${paddedDay}`;
  }
  const matchIso = dateStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (matchIso) {
    const [_, year, month, day] = matchIso;
    const paddedMonth = month!.padStart(2, "0");
    const paddedDay = day!.padStart(2, "0");
    return `${year}-${paddedMonth}-${paddedDay}`;
  }
  const parsed = Date.parse(dateStr);
  if (Number.isFinite(parsed)) {
    return new Date(parsed).toISOString().split("T")[0]!;
  }
  return dateStr;
}

function mapRows(
  rows: Record<string, unknown>[],
  format: DetectedFormat
): {
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
    const rawDate = String(r[mapping.date] ?? "").trim();
    if (!rawDate || !merchantRaw) continue;
    const date = parseToIsoDateString(rawDate);

    let amount = rawAmount;
    if (format === "amex_credit_card") {
      amount = -rawAmount;
    } else if (format === "chase_checking" || format === "chase_credit_card" || format === "chase_amazon") {
      amount = rawAmount;
    } else {
      amount = rawAmount > 0 ? -rawAmount : rawAmount;
    }

    const category = categorize(merchantNorm, merchantRaw);
    let card_identity = "Unknown";
    if (format === "amex_credit_card") card_identity = "Amex Blue Cash";
    else if (format === "chase_checking") card_identity = "Chase Checking";
    else if (format === "chase_credit_card") card_identity = "Chase Credit Card";
    else if (format === "chase_amazon") card_identity = "Chase Amazon";

    mapped.push({
      date,
      merchant_raw: merchantRaw,
      merchant_normalized: merchantNorm,
      description: merchantRaw,
      amount,
      currency: "USD",
      category,
      source: "csv-analyze",
      card_identity,
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
    const fmt = detectFormat(headers, name);
    const { mapped } = mapRows(rows, fmt);
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
