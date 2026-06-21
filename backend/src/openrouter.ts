import {
  endpointLabel,
  isOpenRouterTimeoutError,
  logOpenRouter,
  logOpenRouterResponse,
  openRouterErrorMessage,
  readOpenRouterErrorBody,
} from "./openrouterLog.js";

export interface ReportData {
  period: {
    start: string;
    end: string;
  };
  totalTransactions: number;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  savingsRate: number;
  categoryTotals: Record<string, number>;
  topMerchants: { merchant: string; total: number; count: number }[];
  largestTransactions: { id: string; date: string; merchant: string; amount: number }[];
  dailySpending: { date: string; amount: number }[];
  monthlyTrend: { month: string; income: number; expenses: number; netCashFlow: number }[];
}

export interface InsightItem {
  title: string;
  message: string;
}

export interface ObservationItem extends InsightItem {
  severity: "info" | "warning" | "critical";
  category: string;
}

export interface RecommendationItem extends InsightItem {
  impact: "low" | "medium" | "high";
  estimatedMonthlySavings: number;
}

export interface AnomalyItem extends InsightItem {
  severity: "info" | "warning" | "critical";
  amount: number;
}

export interface AIInsights {
  summary: string;
  score: number;
  riskLevel: "low" | "medium" | "high";
  observations: ObservationItem[];
  recommendations: RecommendationItem[];
  anomalies: AnomalyItem[];
}

/** Override with OPENROUTER_API_URL in tests (Playwright mock server). */
export const OPENROUTER_CHAT_COMPLETIONS_URL =
  process.env.OPENROUTER_API_URL ?? "https://openrouter.ai/api/v1/chat/completions";

export function mapToAllowedCategory(cat: string): string {
  const c = (cat || "").toLowerCase().trim();
  if (c.includes("income") || c.includes("salary") || c.includes("paycheck")) return "Income";
  if (c.includes("housing") || c.includes("rent") || c.includes("mortgage") || c.includes("repairs")) return "Housing";
  if (c.includes("food") || c.includes("dining") || c.includes("groceries") || c.includes("restaurant") || c.includes("coffee") || c.includes("starbucks") || c.includes("sweetgreen")) return "Food";
  if (c.includes("transport") || c.includes("gas") || c.includes("car") || c.includes("ride") || c.includes("uber") || c.includes("lyft") || c.includes("fuel") || c.includes("chevron") || c.includes("shell")) return "Transportation";
  if (c.includes("shopping") || c.includes("amazon") || c.includes("target") || c.includes("walmart") || c.includes("retail")) return "Shopping";
  if (c.includes("bill") || c.includes("utility") || c.includes("utilities") || c.includes("verizon") || c.includes("internet") || c.includes("phone")) return "Bills & Utilities";
  if (c.includes("health") || c.includes("medical") || c.includes("pharmacy")) return "Health";
  if (c.includes("entertainment") || c.includes("subscription") || c.includes("subscriptions") || c.includes("netflix") || c.includes("spotify") || c.includes("movie") || c.includes("game")) return "Entertainment";
  if (c.includes("transfer") || c.includes("payments") || c.includes("payment") || c.includes("payup")) return "Transfers";
  return "Other";
}

export function buildReportData(transactions: any[]): ReportData {
  const allowedCategories = [
    "Income",
    "Housing",
    "Food",
    "Transportation",
    "Shopping",
    "Bills & Utilities",
    "Health",
    "Entertainment",
    "Transfers",
    "Other"
  ];

  const dates = transactions.map((t) => t.date).sort();
  const start = dates[0] || "";
  const end = dates[dates.length - 1] || "";

  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryTotals: Record<string, number> = {};
  allowedCategories.forEach((cat) => {
    categoryTotals[cat] = 0;
  });

  const merchantTotals: Record<string, { total: number; count: number }> = {};
  const dailyFlow: Record<string, number> = {};
  const monthlyFlow: Record<string, { income: number; expenses: number }> = {};

  transactions.forEach((t) => {
    const amt = Number(t.amount || 0);
    const cat = t.finalCategory || t.localCategory || "Other";
    const isTransfers = cat === "Transfers";

    if (t.type === "income") {
      const positiveAmt = Math.abs(amt);
      totalIncome += positiveAmt;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + positiveAmt;

      const m = t.date.substring(0, 7);
      if (!monthlyFlow[m]) monthlyFlow[m] = { income: 0, expenses: 0 };
      monthlyFlow[m].income += positiveAmt;
    } else {
      const positiveAmt = Math.abs(amt);
      if (!isTransfers) {
        totalExpenses += positiveAmt;
      }
      categoryTotals[cat] = (categoryTotals[cat] || 0) + positiveAmt;

      // Group merchant
      const mName = t.merchant || t.merchant_normalized || "Unknown";
      if (!merchantTotals[mName]) merchantTotals[mName] = { total: 0, count: 0 };
      merchantTotals[mName].total += positiveAmt;
      merchantTotals[mName].count += 1;

      // Group daily spending
      dailyFlow[t.date] = (dailyFlow[t.date] || 0) + positiveAmt;

      // Group monthly trend
      const m = t.date.substring(0, 7);
      if (!monthlyFlow[m]) monthlyFlow[m] = { income: 0, expenses: 0 };
      if (!isTransfers) {
        monthlyFlow[m].expenses += positiveAmt;
      }
    }
  });

  const netCashFlow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0;

  const topMerchants = Object.entries(merchantTotals)
    .map(([merchant, v]) => ({ merchant, total: Math.round(v.total), count: v.count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const largestTransactions = transactions
    .filter((t) => t.type === "expense")
    .map((t) => ({
      id: t.id,
      date: t.date,
      merchant: t.merchant || t.merchant_normalized || "Unknown",
      amount: Math.round(Math.abs(t.amount)),
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  const dailySpending = Object.entries(dailyFlow)
    .map(([date, amount]) => ({ date, amount: Math.round(amount) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const monthlyTrend = Object.entries(monthlyFlow)
    .map(([month, v]) => ({
      month,
      income: Math.round(v.income),
      expenses: Math.round(v.expenses),
      netCashFlow: Math.round(v.income - v.expenses),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    period: { start, end },
    totalTransactions: transactions.length,
    totalIncome: Math.round(totalIncome),
    totalExpenses: Math.round(totalExpenses),
    netCashFlow: Math.round(netCashFlow),
    savingsRate: Number(savingsRate.toFixed(2)),
    categoryTotals,
    topMerchants,
    largestTransactions,
    dailySpending,
    monthlyTrend,
  };
}

const SPENDING_CATEGORY_EXCLUDE = new Set(["Income", "Transfers", "Credit Card Payments"]);

export function reportMonthCount(reportData: ReportData): number {
  const months = reportData.monthlyTrend?.length ?? 0;
  if (months > 0) return months;
  if (reportData.period.start && reportData.period.end) {
    const start = new Date(`${reportData.period.start}T00:00:00Z`);
    const end = new Date(`${reportData.period.end}T00:00:00Z`);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end >= start) {
      return Math.max(
        1,
        (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
          (end.getUTCMonth() - start.getUTCMonth()) +
          1,
      );
    }
  }
  return 1;
}

function spendingCategories(categoryTotals: Record<string, number>) {
  return Object.entries(categoryTotals)
    .filter(([category, total]) => total > 0 && !SPENDING_CATEGORY_EXCLUDE.has(category))
    .sort((a, b) => b[1] - a[1]);
}

/** Compact summary passed to the static insights rules (logged as the effective prompt input). */
export function buildStaticInsightsContext(reportData: ReportData) {
  const monthCount = reportMonthCount(reportData);
  const topCategories = spendingCategories(reportData.categoryTotals).slice(0, 5).map(([category, total]) => ({
    category,
    periodTotal: Math.round(total),
    monthlyAvg: Math.round(total / monthCount),
    sharePct:
      reportData.totalExpenses > 0 ? Math.round((total / reportData.totalExpenses) * 100) : 0,
  }));

  return {
    period: reportData.period,
    monthCount,
    totalIncome: reportData.totalIncome,
    totalExpenses: reportData.totalExpenses,
    netCashFlow: reportData.netCashFlow,
    savingsRate: reportData.savingsRate,
    topCategories,
    topMerchants: reportData.topMerchants.slice(0, 5),
  };
}

/** Human-readable rules + JSON input (logged to CloudWatch as staticInsightsPrompt). */
export function buildStaticInsightsPrompt(reportData: ReportData): string {
  const ctx = buildStaticInsightsContext(reportData);
  return (
    "FinanceOS static insights engine (no LLM). Produce exactly 3 recommendations:\n" +
    "1) Biggest spending category — monthly avg, % of expenses, ~10% savings target\n" +
    "2) Second-biggest category (or top merchant if only one category dominates)\n" +
    "3) Cash-flow or merchant-specific save opportunity\n" +
    "Use only amounts from financialSummary. Savings must be monthly USD.\n\n" +
    `financialSummary:\n${JSON.stringify(ctx, null, 2)}`
  );
}

function monthlyFromPeriod(total: number, monthCount: number): number {
  return Math.round(total / Math.max(1, monthCount));
}

function savingsFromMonthlyCut(monthlyAmount: number, cutPct = 0.1): number {
  return Math.max(5, Math.round(monthlyAmount * cutPct));
}

function buildCategorySpendRecommendation(
  category: string,
  periodTotal: number,
  sharePct: number,
  monthCount: number,
  rank: 1 | 2 | 3,
): RecommendationItem {
  const monthly = monthlyFromPeriod( periodTotal, monthCount);
  const savings = savingsFromMonthlyCut(monthly);
  const rankLabel =
    rank === 1 ? "Where you spend most" : rank === 2 ? "Second-biggest category" : "Third-biggest category";

  return {
    title: `${rankLabel}: ${category}`,
    message: `${category} averaged $${monthly.toLocaleString()}/mo (${sharePct}% of your expenses). Trimming this category by about 10% would free up ~$${savings}/mo.`,
    impact: rank === 1 && sharePct >= 25 ? "high" : "medium",
    estimatedMonthlySavings: savings,
  };
}

function buildMerchantSpendRecommendation(
  merchant: string,
  periodTotal: number,
  count: number,
  monthCount: number,
): RecommendationItem {
  const monthly = monthlyFromPeriod( periodTotal, monthCount);
  const savings = savingsFromMonthlyCut(monthly, 0.15);

  return {
    title: `Repeat spend: ${merchant}`,
    message: `${merchant} appears ${count} time(s) for ~$${monthly.toLocaleString()}/mo. Compare alternatives or cut one recurring visit to save.`,
    impact: "medium",
    estimatedMonthlySavings: savings,
  };
}

function buildCashFlowRecommendation(
  reportData: ReportData,
  monthCount: number,
  topCategoryName: string,
): RecommendationItem {
  const monthlyGap = monthlyFromPeriod(Math.abs(reportData.netCashFlow), monthCount);
  const monthlyExpenses = monthlyFromPeriod(reportData.totalExpenses, monthCount);
  const monthlyIncome = monthlyFromPeriod(reportData.totalIncome, monthCount);

  if (reportData.netCashFlow < 0) {
    return {
      title: "Close the cash-flow gap",
      message: `Spending exceeded income by ~$${monthlyGap.toLocaleString()}/mo. Start by reducing ${topCategoryName} and other discretionary categories.`,
      impact: "high",
      estimatedMonthlySavings: Math.max(10, Math.round(monthlyExpenses * 0.05)),
    };
  }

  if (reportData.savingsRate < 15 && reportData.totalIncome > 0) {
    const saveTarget = Math.max(10, Math.round(monthlyIncome * 0.05));
    return {
      title: "Grow your savings rate",
      message: `You kept ${reportData.savingsRate.toFixed(1)}% of income. Automate ~$${saveTarget.toLocaleString()}/mo to savings each payday.`,
      impact: "high",
      estimatedMonthlySavings: saveTarget,
    };
  }

  return {
    title: "Set monthly category caps",
    message: `Track ${topCategoryName} and your next-largest categories with monthly budgets so overspending shows up early.`,
    impact: "low",
    estimatedMonthlySavings: Math.max(5, Math.round(monthlyExpenses * 0.03)),
  };
}

function buildSpendingRecommendations(reportData: ReportData): RecommendationItem[] {
  const monthCount = reportMonthCount(reportData);
  const topCats = spendingCategories(reportData.categoryTotals);
  const candidates: RecommendationItem[] = [];

  for (let i = 0; i < Math.min(3, topCats.length); i++) {
    const [category, total] = topCats[i]!;
    const sharePct =
      reportData.totalExpenses > 0 ? Math.round((total / reportData.totalExpenses) * 100) : 0;
    candidates.push(
      buildCategorySpendRecommendation(category, total, sharePct, monthCount, (i + 1) as 1 | 2 | 3),
    );
  }

  const topMerchant = reportData.topMerchants[0];
  if (topMerchant && candidates.length < 3) {
    candidates.push(
      buildMerchantSpendRecommendation(
        topMerchant.merchant,
        topMerchant.total,
        topMerchant.count,
        monthCount,
      ),
    );
  }

  if (candidates.length < 3) {
    candidates.push(
      buildCashFlowRecommendation(reportData, monthCount, topCats[0]?.[0] ?? "discretionary"),
    );
  }

  const seen = new Set<string>();
  const unique: RecommendationItem[] = [];
  for (const item of candidates) {
    if (seen.has(item.title)) continue;
    seen.add(item.title);
    unique.push(item);
  }

  while (unique.length < 3) {
    unique.push({
      title: "Review your import",
      message: "Re-run AI analysis after adding another month of transactions for sharper category comparisons.",
      impact: "low",
      estimatedMonthlySavings: 0,
    });
  }

  return unique.slice(0, 3);
}

export function generateStaticInsights(reportData: ReportData): AIInsights {
  const {
    totalIncome,
    totalExpenses,
    netCashFlow,
    savingsRate,
    totalTransactions,
    categoryTotals,
    topMerchants,
    largestTransactions,
    period,
    monthlyTrend,
  } = reportData;

  if (!totalTransactions) {
    return {
      summary: "No transactions to summarize yet.",
      score: 50,
      riskLevel: "low",
      observations: [
        {
          title: "No data",
          message: "Upload transactions to generate a spending summary.",
          severity: "info",
          category: "General",
        },
      ],
      recommendations: [
        {
          title: "Upload transactions",
          message: "Import a CSV to unlock category and cash-flow insights.",
          impact: "medium",
          estimatedMonthlySavings: 0,
        },
        {
          title: "Run AI analysis",
          message: "Use the Import page AI analyzer to generate three personalized savings suggestions.",
          impact: "low",
          estimatedMonthlySavings: 0,
        },
        {
          title: "Compare categories",
          message: "After import, Insights will rank where you spend most and where to trim.",
          impact: "low",
          estimatedMonthlySavings: 0,
        },
      ],
      anomalies: [],
    };
  }

  const topCategories = spendingCategories(categoryTotals);
  const topCat = topCategories[0];
  const topCatName = topCat?.[0] ?? "Spending";
  const topCatTotal = topCat?.[1] ?? 0;
  const topCatShare = totalExpenses > 0 ? Math.round((topCatTotal / totalExpenses) * 100) : 0;
  const monthCount = reportMonthCount(reportData);

  const score =
    totalIncome <= 0
      ? Math.max(35, Math.min(65, 50 - Math.round(totalExpenses / 100)))
      : Math.min(100, Math.max(0, Math.round(40 + savingsRate * 0.6)));

  const riskLevel: "low" | "medium" | "high" =
    netCashFlow < 0 ? "high" : savingsRate < 10 ? "medium" : "low";

  const periodLabel =
    period.start && period.end ? `${period.start} to ${period.end}` : "this period";

  const summary =
    `From ${periodLabel}, you recorded $${totalIncome.toLocaleString()} income and ` +
    `$${totalExpenses.toLocaleString()} expenses (${netCashFlow >= 0 ? "+" : ""}$${netCashFlow.toLocaleString()}). ` +
    `Savings rate: ${savingsRate.toFixed(1)}%. ` +
    (topCat
      ? `Your biggest category is ${topCatName} at ~$${monthlyFromPeriod(topCatTotal, monthCount).toLocaleString()}/mo (${topCatShare}% of spend).`
      : `Top spending category: ${topCatName}.`);

  const observations: ObservationItem[] = [];

  if (totalExpenses > 0 && topCat) {
    observations.push({
      title: `${topCatName} spending`,
      message: `${topCatName} accounts for ${topCatShare}% of expenses (~$${monthlyFromPeriod(topCatTotal, monthCount).toLocaleString()}/mo).`,
      severity: topCatShare >= 40 ? "warning" : "info",
      category: topCatName,
    });
  }

  if (topCategories[1]) {
    const [name, total] = topCategories[1];
    const share = totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0;
    observations.push({
      title: `${name} spending`,
      message: `${name} is your #2 category at ~$${monthlyFromPeriod(total, monthCount).toLocaleString()}/mo (${share}%).`,
      severity: "info",
      category: name,
    });
  }

  if (totalIncome > 0) {
    observations.push({
      title: "Savings rate",
      message: `You kept ${savingsRate.toFixed(1)}% of income after expenses.`,
      severity: savingsRate < 10 ? "warning" : "info",
      category: "Savings",
    });
  }

  if (topMerchants[0]) {
    observations.push({
      title: "Top merchant",
      message:
        `${topMerchants[0].merchant} had ${topMerchants[0].count} transaction(s), ~$${monthlyFromPeriod(topMerchants[0].total, monthCount).toLocaleString()}/mo.`,
      severity: "info",
      category: topCatName,
    });
  }

  observations.push({
    title: "Activity",
    message: `${totalTransactions} transaction(s) across ${monthCount} month(s) in this analysis.`,
    severity: "info",
    category: "General",
  });

  const recommendations = buildSpendingRecommendations(reportData);

  const expenseCount = Math.max(1, largestTransactions.filter((t) => t.amount < 0).length);
  const avgExpense = totalExpenses / expenseCount;
  const anomalies: AnomalyItem[] = [];
  for (const txn of largestTransactions) {
    if (txn.amount >= 0 || avgExpense <= 0) continue;
    if (Math.abs(txn.amount) <= avgExpense * 2.5) continue;
    anomalies.push({
      title: "Large expense",
      message:
        `${txn.merchant} on ${txn.date} was $${Math.abs(txn.amount).toLocaleString()}, above typical spend.`,
      severity: "warning",
      amount: Math.abs(txn.amount),
    });
    if (anomalies.length >= 3) break;
  }

  return {
    summary,
    score,
    riskLevel,
    observations: observations.slice(0, 5),
    recommendations: recommendations.slice(0, 3),
    anomalies,
  };
}

/** @deprecated Use generateStaticInsights — kept for validateInsights fallback paths. */
export function fallbackInsights(reportData: ReportData): AIInsights {
  return generateStaticInsights(reportData);
}

export function safeJsonParse(text: string): any {
  try {
    let clean = text.trim();
    // Strip markdown JSON block if present
    if (clean.startsWith("```")) {
      const match = clean.match(/^(?:```[a-zA-Z]*\n?)([\s\S]*?)(?:\n?```)$/);
      if (match && match[1]) {
        clean = match[1].trim();
      }
    }
    return JSON.parse(clean);
  } catch (e) {
    // Try to extract json from text if extra characters exist
    try {
      const startIdx = text.indexOf("{");
      const endIdx = text.lastIndexOf("}");
      if (startIdx !== -1 && endIdx !== -1) {
        const sliced = text.slice(startIdx, endIdx + 1);
        return JSON.parse(sliced);
      }
    } catch {
      // ignore
    }
    return null;
  }
}

export function validateInsights(insights: any, reportData: ReportData): AIInsights {
  const fallback = fallbackInsights(reportData);
  if (!insights || typeof insights !== "object") {
    return fallback;
  }

  const summary = typeof insights.summary === "string" ? insights.summary : fallback.summary;
  let score = typeof insights.score === "number" ? insights.score : fallback.score;
  if (score < 0 || score > 100 || isNaN(score)) score = 70;

  const riskLevel = ["low", "medium", "high"].includes(insights.riskLevel) ? insights.riskLevel : "low";

  const observations = Array.isArray(insights.observations) ? insights.observations.map((o: any) => ({
    title: typeof o?.title === "string" ? o.title : "Observation",
    message: typeof o?.message === "string" ? o.message : "",
    severity: ["info", "warning", "critical"].includes(o?.severity) ? o.severity : "info",
    category: typeof o?.category === "string" ? o.category : "General",
  })) : fallback.observations;

  const recommendations = Array.isArray(insights.recommendations) ? insights.recommendations.map((r: any) => ({
    title: typeof r?.title === "string" ? r.title : "Recommendation",
    message: typeof r?.message === "string" ? r.message : "",
    impact: ["low", "medium", "high"].includes(r?.impact) ? r.impact : "medium",
    estimatedMonthlySavings: typeof r?.estimatedMonthlySavings === "number" ? r.estimatedMonthlySavings : 0,
  })) : fallback.recommendations;

  const anomalies = Array.isArray(insights.anomalies) ? insights.anomalies.map((a: any) => ({
    title: typeof a?.title === "string" ? a.title : "Anomaly",
    message: typeof a?.message === "string" ? a.message : "",
    severity: ["info", "warning", "critical"].includes(a?.severity) ? a.severity : "info",
    amount: typeof a?.amount === "number" ? a.amount : 0,
  })) : [];

  return {
    summary,
    score,
    riskLevel,
    observations,
    recommendations,
    anomalies,
  };
}

export async function generateInsightsWithOpenRouter(reportData: ReportData): Promise<AIInsights> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "openrouter/free";
  const appUrl = process.env.APP_URL || "https://financeos.app";

  if (!apiKey) {
    logOpenRouter("openrouter_skipped", {
      operation: "insights",
      reason: "missing_api_key",
      model,
      outcome: "fallback",
    });
    return fallbackInsights(reportData);
  }

  logOpenRouter("openrouter_start", {
    operation: "insights",
    model,
    endpoint: endpointLabel(OPENROUTER_CHAT_COMPLETIONS_URL),
    transactionCount: reportData.totalTransactions,
  });

  const startedAt = Date.now();
  const failInsights = (fields: Record<string, unknown>) => {
    logOpenRouter("openrouter_failure", {
      operation: "insights",
      model,
      durationMs: Date.now() - startedAt,
      outcome: "fallback",
      ...fields,
    });
    return fallbackInsights(reportData);
  };

  const prompt = `You are FinanceOS AI, a practical personal finance analyst.

Analyze the reportData and return ONLY valid JSON.
No markdown. No explanation.

Use reportData as the source of truth.
Do not invent merchants, categories, or numbers.

Return schema:
{
  "summary": "string",
  "score": 0,
  "riskLevel": "low | medium | high",
  "observations": [
    {
      "title": "string",
      "message": "string",
      "severity": "info | warning | critical",
      "category": "string"
    }
  ],
  "recommendations": [
    {
      "title": "string",
      "message": "string",
      "impact": "low | medium | high",
      "estimatedMonthlySavings": 0
    }
  ],
  "anomalies": [
    {
      "title": "string",
      "message": "string",
      "severity": "info | warning | critical",
      "amount": 0
    }
  ]
}

Rules:
- Return 3 to 5 observations.
- Return 2 to 4 recommendations.
- Return 0 to 3 anomalies.
- score must be 0 to 100.
- riskLevel must be low, medium, or high.
- estimatedMonthlySavings must be a number.
- amount must be a number.
- Keep messages short and practical.

reportData:
${JSON.stringify(reportData, null, 2)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": appUrl,
        "X-OpenRouter-Title": "FinanceOS",
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorBody = await readOpenRouterErrorBody(res);
      return failInsights({
        status: res.status,
        error: `HTTP ${res.status}`,
        errorBody: errorBody || undefined,
      });
    }

    const resJson: any = await res.json();
    const content = resJson?.choices?.[0]?.message?.content;
    logOpenRouterResponse("insights", {
      status: res.status,
      resJson,
      content: typeof content === "string" ? content : "",
      durationMs: Date.now() - startedAt,
    });
    if (!content) {
      return failInsights({ status: res.status, error: "empty_response" });
    }

    const parsed = safeJsonParse(content);
    if (!parsed) {
      return failInsights({
        status: res.status,
        error: "invalid_json",
        contentLength: content.length,
      });
    }

    const insights = validateInsights(parsed, reportData);
    logOpenRouter("openrouter_success", {
      operation: "insights",
      model,
      status: res.status,
      durationMs: Date.now() - startedAt,
      score: insights.score,
      riskLevel: insights.riskLevel,
      observationCount: insights.observations.length,
      outcome: "success",
    });
    return insights;
  } catch (e: unknown) {
    clearTimeout(timeoutId);
    return failInsights({
      error: openRouterErrorMessage(e),
      timedOut: isOpenRouterTimeoutError(e),
    });
  }
}

/** Compact summary sent from the profile coach UI. */
export interface CoachSummary {
  period: { start: string | null; end: string | null };
  totalTransactions: number;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  savingsRate: number;
  topCategories: { category: string; total: number }[];
  topMerchants: { merchant: string; total: number }[];
  recurringAnnualized?: number;
  personalityLabel?: string;
}

export interface CoachSuggestion {
  title: string;
  message: string;
  impact: "low" | "medium" | "high";
  estimatedMonthlySavings: number;
}

export interface CoachSuggestionsResult {
  suggestions: CoachSuggestion[];
  source: "openrouter" | "fallback";
}

export function fallbackCoachSuggestions(summary: CoachSummary): CoachSuggestionsResult {
  const topCat = summary.topCategories[0]?.category ?? "spending";
  const topMerchant = summary.topMerchants[0]?.merchant;
  const suggestions: CoachSuggestion[] = [
    {
      title: `Review ${topCat} spending`,
      message: `${topCat} is your largest category. Set a monthly cap and track weekly to stay on target.`,
      impact: "high",
      estimatedMonthlySavings: Math.round(summary.totalExpenses * 0.05) || 25,
    },
    {
      title: "Audit recurring charges",
      message:
        summary.recurringAnnualized && summary.recurringAnnualized > 0
          ? `You have about $${Math.round(summary.recurringAnnualized)} in annual recurring spend. Cancel unused subscriptions.`
          : "Review subscriptions and autopay charges you no longer use.",
      impact: "medium",
      estimatedMonthlySavings: summary.recurringAnnualized
        ? Math.round(summary.recurringAnnualized / 12 / 4)
        : 15,
    },
    {
      title: summary.netCashFlow >= 0 ? "Grow your savings rate" : "Close the cash-flow gap",
      message:
        summary.netCashFlow >= 0
          ? `Net cash flow is positive ($${summary.netCashFlow}). Automate transfers to savings on payday.`
          : `Expenses exceed income by $${Math.abs(summary.netCashFlow)}. Trim discretionary ${topCat} purchases first.`,
      impact: summary.netCashFlow >= 0 ? "medium" : "high",
      estimatedMonthlySavings: summary.netCashFlow >= 0 ? 50 : Math.round(summary.totalExpenses * 0.08) || 40,
    },
  ];

  if (topMerchant && topMerchant !== "Unknown") {
    suggestions[0] = {
      title: `Optimize ${topMerchant} spend`,
      message: `${topMerchant} is a top merchant. Look for cheaper alternatives or bundle discounts.`,
      impact: "medium",
      estimatedMonthlySavings: Math.round((summary.topMerchants[0]?.total ?? 0) * 0.1) || 20,
    };
  }

  return { suggestions: suggestions.slice(0, 3), source: "fallback" };
}

export function validateCoachSuggestions(raw: unknown, summary: CoachSummary): CoachSuggestion[] {
  const fallback = fallbackCoachSuggestions(summary).suggestions;
  if (!Array.isArray(raw)) return fallback;

  const parsed: CoachSuggestion[] = raw
    .filter((item) => item && typeof item === "object")
    .map((item: any, idx) => ({
      title: typeof item.title === "string" ? item.title : fallback[idx]?.title ?? "Suggestion",
      message: typeof item.message === "string" ? item.message : fallback[idx]?.message ?? "",
      impact: ["low", "medium", "high"].includes(item.impact) ? item.impact : fallback[idx]?.impact ?? "medium",
      estimatedMonthlySavings:
        typeof item.estimatedMonthlySavings === "number"
          ? item.estimatedMonthlySavings
          : fallback[idx]?.estimatedMonthlySavings ?? 0,
    }))
    .slice(0, 3);

  while (parsed.length < 3) {
    parsed.push(fallback[parsed.length] ?? fallback[0]!);
  }
  return parsed;
}

export async function generateCoachSuggestionsWithOpenRouter(
  summary: CoachSummary,
): Promise<CoachSuggestionsResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "openrouter/free";
  const appUrl = process.env.APP_URL || "https://financeos.app";

  if (!apiKey) {
    logOpenRouter("openrouter_skipped", {
      operation: "coach_suggestions",
      reason: "missing_api_key",
      model,
      outcome: "fallback",
    });
    return fallbackCoachSuggestions(summary);
  }

  logOpenRouter("openrouter_start", {
    operation: "coach_suggestions",
    model,
    endpoint: endpointLabel(OPENROUTER_CHAT_COMPLETIONS_URL),
    transactionCount: summary.totalTransactions,
  });

  const startedAt = Date.now();
  const failCoach = (fields: Record<string, unknown>) => {
    logOpenRouter("openrouter_failure", {
      operation: "coach_suggestions",
      model,
      durationMs: Date.now() - startedAt,
      outcome: "fallback",
      ...fields,
    });
    return fallbackCoachSuggestions(summary);
  };

  const prompt = `You are FinanceOS AI Coach. Analyze the financial summary and return ONLY valid JSON.
No markdown. No explanation.

Use the summary as the source of truth. Do not invent merchants, categories, or dollar amounts.

Return schema:
{
  "suggestions": [
    {
      "title": "string",
      "message": "string",
      "impact": "low | medium | high",
      "estimatedMonthlySavings": 0
    }
  ]
}

Rules:
- Return exactly 3 suggestions, ordered from highest to lowest impact.
- Each message must be one practical sentence the user can act on this week.
- estimatedMonthlySavings must be a realistic non-negative number in USD.
- Tie at least one suggestion to the top spending category or merchant when present.

financialSummary:
${JSON.stringify(summary, null, 2)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": appUrl,
        "X-OpenRouter-Title": "FinanceOS",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorBody = await readOpenRouterErrorBody(res);
      return failCoach({
        status: res.status,
        error: `HTTP ${res.status}`,
        errorBody: errorBody || undefined,
      });
    }

    const resJson: any = await res.json();
    const content = resJson?.choices?.[0]?.message?.content;
    logOpenRouterResponse("coach_suggestions", {
      status: res.status,
      resJson,
      content: typeof content === "string" ? content : "",
      durationMs: Date.now() - startedAt,
    });
    if (!content) {
      return failCoach({ status: res.status, error: "empty_response" });
    }

    const parsed = safeJsonParse(content);
    if (!parsed) {
      return failCoach({
        status: res.status,
        error: "invalid_json",
        contentLength: content.length,
      });
    }

    const suggestions = validateCoachSuggestions(parsed.suggestions, summary);
    logOpenRouter("openrouter_success", {
      operation: "coach_suggestions",
      model,
      status: res.status,
      durationMs: Date.now() - startedAt,
      suggestionCount: suggestions.length,
      outcome: "success",
    });
    return { suggestions, source: "openrouter" };
  } catch (e: unknown) {
    clearTimeout(timeoutId);
    return failCoach({
      error: openRouterErrorMessage(e),
      timedOut: isOpenRouterTimeoutError(e),
    });
  }
}
