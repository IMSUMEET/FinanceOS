import {
  OPENROUTER_DEFAULT_BASE_URL,
  OPENROUTER_CHAT_COMPLETIONS_PATH,
  mapToAllowedCategory,
} from "@oblivion-labs-dev/arsenal-shared";
import { safeJsonParse } from "@oblivion-labs-dev/arsenal-backend";
import {
  endpointLabel,
  isOpenRouterTimeoutError,
  logOpenRouter,
  logOpenRouterResponse,
  openRouterErrorMessage,
  readOpenRouterErrorBody,
} from "./openrouterLog.js";

export { mapToAllowedCategory, safeJsonParse };

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

export interface EnrichedFinancialSummary {
  period: { start: string; end: string };
  monthCount: number;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  savingsRate: number;
  averageMonthlySpend: number;
  categoryPercentages: Record<string, number>;
  merchantPercentages: Record<string, number>;
  monthOverMonthChange: {
    previousMonth: string;
    currentMonth: string;
    previousExpenses: number;
    currentExpenses: number;
    expenseDelta: number;
    expenseDeltaPct: number | null;
  } | null;
  spendingTrendDirection: "up" | "down" | "flat" | "unknown";
  topCategory: {
    category: string;
    periodTotal: number;
    monthlyAvg: number;
    sharePct: number;
  } | null;
  topMerchant: {
    merchant: string;
    periodTotal: number;
    monthlyAvg: number;
    sharePct: number;
    count: number;
  } | null;
  highestTransaction: {
    id: string;
    merchant: string;
    date: string;
    amount: number;
  } | null;
  topCategories: {
    category: string;
    periodTotal: number;
    monthlyAvg: number;
    sharePct: number;
  }[];
  topMerchants: {
    merchant: string;
    total: number;
    count: number;
    sharePct: number;
    monthlyAvg: number;
  }[];
}

export interface InsightsGenerationResult {
  insights: AIInsights;
  source: "openrouter" | "fallback";
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
  breakdown?: { label: string; monthlyAvg: number; sharePct: number }[];
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
  process.env.OPENROUTER_API_URL ??
  `${OPENROUTER_DEFAULT_BASE_URL}${OPENROUTER_CHAT_COMPLETIONS_PATH}`;

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
    "Other",
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

function monthlyFromPeriod(total: number, monthCount: number): number {
  return Math.round(total / Math.max(1, monthCount));
}

/** Pre-computed aggregates for LLM + static insights (percentages, trends, tops). */
export function buildEnrichedFinancialSummary(reportData: ReportData): EnrichedFinancialSummary {
  const monthCount = reportMonthCount(reportData);
  const expenseBase = reportData.totalExpenses > 0 ? reportData.totalExpenses : 1;

  const categoryPercentages: Record<string, number> = {};
  const topCategoryRows = spendingCategories(reportData.categoryTotals).slice(0, 8);
  for (const [category, total] of topCategoryRows) {
    categoryPercentages[category] = Math.round((total / expenseBase) * 100);
  }

  const merchantPercentages: Record<string, number> = {};
  const topMerchantRows = reportData.topMerchants.slice(0, 10);
  for (const row of topMerchantRows) {
    merchantPercentages[row.merchant] = Math.round((row.total / expenseBase) * 100);
  }

  const topCategories = topCategoryRows.map(([category, total]) => ({
    category,
    periodTotal: Math.round(total),
    monthlyAvg: monthlyFromPeriod(total, monthCount),
    sharePct: categoryPercentages[category] ?? 0,
  }));

  const topMerchants = topMerchantRows.map((row) => ({
    merchant: row.merchant,
    total: row.total,
    count: row.count,
    sharePct: merchantPercentages[row.merchant] ?? 0,
    monthlyAvg: monthlyFromPeriod(row.total, monthCount),
  }));

  const monthOverMonthChange = computeMonthOverMonthChange(reportData.monthlyTrend);
  const spendingTrendDirection = computeSpendingTrendDirection(monthOverMonthChange);

  const topCategory = topCategories[0] ?? null;
  const topMerchantRow = topMerchants[0];
  const topMerchant = topMerchantRow
    ? {
        merchant: topMerchantRow.merchant,
        periodTotal: topMerchantRow.total,
        monthlyAvg: topMerchantRow.monthlyAvg,
        sharePct: topMerchantRow.sharePct,
        count: topMerchantRow.count,
      }
    : null;

  const expenseTxns = reportData.largestTransactions.filter((t) => t.amount > 0);
  const highest = expenseTxns[0] ?? reportData.largestTransactions[0];
  const highestTransaction = highest
    ? {
        id: highest.id,
        merchant: highest.merchant,
        date: highest.date,
        amount: Math.abs(highest.amount),
      }
    : null;

  return {
    period: reportData.period,
    monthCount,
    totalIncome: reportData.totalIncome,
    totalExpenses: reportData.totalExpenses,
    netCashFlow: reportData.netCashFlow,
    savingsRate: reportData.savingsRate,
    averageMonthlySpend: monthlyFromPeriod(reportData.totalExpenses, monthCount),
    categoryPercentages,
    merchantPercentages,
    monthOverMonthChange,
    spendingTrendDirection,
    topCategory,
    topMerchant,
    highestTransaction,
    topCategories,
    topMerchants,
  };
}

function computeMonthOverMonthChange(
  monthlyTrend: ReportData["monthlyTrend"],
): EnrichedFinancialSummary["monthOverMonthChange"] {
  const months = monthlyTrend.filter((m) => m.expenses > 0);
  if (months.length < 2) return null;
  const prev = months[months.length - 2]!;
  const curr = months[months.length - 1]!;
  const expenseDelta = curr.expenses - prev.expenses;
  const expenseDeltaPct =
    prev.expenses > 0 ? Number(((expenseDelta / prev.expenses) * 100).toFixed(1)) : null;
  return {
    previousMonth: prev.month,
    currentMonth: curr.month,
    previousExpenses: prev.expenses,
    currentExpenses: curr.expenses,
    expenseDelta,
    expenseDeltaPct,
  };
}

function computeSpendingTrendDirection(
  mom: EnrichedFinancialSummary["monthOverMonthChange"],
): EnrichedFinancialSummary["spendingTrendDirection"] {
  if (!mom || mom.expenseDeltaPct == null) return "unknown";
  if (mom.expenseDeltaPct > 5) return "up";
  if (mom.expenseDeltaPct < -5) return "down";
  return "flat";
}

/** Deduplication and grouping rules injected into the spend-analyzer LLM prompt. */
export const INSIGHT_DEDUPLICATION_AND_GROUPING_RULES = `DEDUPLICATION AND INSIGHT GROUPING RULES

Before generating observations, recommendations, and anomalies:

1. Identify root causes first.

Examples of root causes:
- High restaurant spending
- High subscription spending
- Large one-time purchase
- Spending increase month-over-month
- Heavy concentration in one merchant
- Low savings rate

2. Create ONLY ONE insight card per root cause.

BAD:
- Dining spending is high
- Restaurants are your largest category
- Food spending increased this month

GOOD:
- Dining spending is the largest discretionary expense category and increased compared to previous months.

3. Merge related evidence into a single card.

Example — instead of three separate cards about Uber Eats, DoorDash, and restaurants, create one:
"Food delivery and restaurant spending represent a significant share of total expenses, driven by Uber Eats and DoorDash."

4. Observations, recommendations, and anomalies must each focus on DIFFERENT findings.
If an observation already discusses a spending category, do not create another observation for the same category.

5. Maximum repetition rule:
The same merchant, category, trend, or transaction may appear in only ONE primary insight card unless it is required as supporting evidence.

6. Prioritize insights in this order (stop once major unique insights are covered):
- Largest spending concentration
- Largest trend change
- Largest merchant concentration
- Largest transaction anomaly
- Recurring spending patterns

7. Recommendation uniqueness:
Each recommendation must address a different action.
Never split top spending categories into separate recommendation cards — merge the top 2–3 categories into ONE card with a breakdown list, then use other actions (merchant, trend, cash-flow) for remaining recommendations.

BAD:
- Reduce restaurant spending
- Eat out less
- Limit food delivery

GOOD:
- Reduce restaurant spending
- Review recurring subscriptions
- Set a monthly discretionary spending cap

8. Anomaly uniqueness:
An anomaly should represent a unique unusual event.

BAD:
- Amazon purchase was large
- Amazon spending was unusually high
- Amazon was your top merchant

GOOD:
- Single Amazon purchase of $X exceeded normal transaction size.

9. Final validation before output:
For every card ask: "Does this represent a unique financial insight that is not already covered by another card?"
- If NO: merge it into the existing card.
- If YES: keep it.

Never create more than one observation, recommendation, or anomaly for the same category, merchant, transaction, or trend. Merge related findings into the most comprehensive card.`;

/** LLM prompt with ranked insight instructions + enriched payload. */
export function buildInsightsLlmPrompt(enriched: EnrichedFinancialSummary): string {
  return `You are FinanceOS spend analyzer. Analyze enrichedFinancialSummary and return ONLY valid JSON.
No markdown. No explanation.

Use enrichedFinancialSummary as the sole source of truth.
Do not invent merchants, categories, dollar amounts, or percentages.

${INSIGHT_DEDUPLICATION_AND_GROUPING_RULES}

Output structure and counts:
- summary: one concise paragraph synthesizing the top unique root causes (no repeated points).
- observations: 3 to 5 items, each covering a different root cause. Apply deduplication rules strictly.
- recommendations: exactly 3 items, each a different action on a different root cause. Ordered highest to lowest impact.
- anomalies: 0 to 2 items. Only unique unusual events (typically highestTransaction vs averageMonthlySpend). Do not repeat category/merchant/trend cards.
- score: 0 to 100. riskLevel: low | medium | high.

When ordering observations, follow insight priority:
1. Largest spending concentration (topCategory + categoryPercentages)
2. Largest trend change (spendingTrendDirection + monthOverMonthChange)
3. Largest merchant concentration (topMerchant + merchantPercentages)
4. Largest transaction anomaly (highestTransaction)
5. Recurring spending patterns (repeat merchants/counts)

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

Additional rules:
- Reference specific categoryPercentages and merchantPercentages in messages.
- estimatedMonthlySavings must be realistic (typically 5–15% of the relevant monthly category or merchant spend).
- Run final validation (rule 9) on every card before returning JSON.

enrichedFinancialSummary:
${JSON.stringify(enriched, null, 2)}`;
}

/** @deprecated alias — use buildEnrichedFinancialSummary */
export function buildStaticInsightsContext(reportData: ReportData): EnrichedFinancialSummary {
  return buildEnrichedFinancialSummary(reportData);
}

/** Human-readable rules + JSON input (logged when static fallback runs). */
export function buildStaticInsightsPrompt(reportData: ReportData): string {
  const enriched = buildEnrichedFinancialSummary(reportData);
  return (
    "FinanceOS static insights fallback (no LLM). Produce exactly 3 recommendations from enrichedFinancialSummary.\n\n" +
    buildInsightsLlmPrompt(enriched)
  );
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
  const monthly = monthlyFromPeriod(periodTotal, monthCount);
  const savings = savingsFromMonthlyCut(monthly);
  const rankLabel =
    rank === 1
      ? "Where you spend most"
      : rank === 2
        ? "Second-biggest category"
        : "Third-biggest category";

  return {
    title: `${rankLabel}: ${category}`,
    message: `${category} averaged $${monthly.toLocaleString()}/mo (${sharePct}% of your expenses). Trimming this category by about 10% would free up ~$${savings}/mo.`,
    impact: rank === 1 && sharePct >= 25 ? "high" : "medium",
    estimatedMonthlySavings: savings,
  };
}

/** One recommendation card for the top 2–3 categories (deduplicated root cause). */
function buildMergedCategoryRecommendation(
  enriched: EnrichedFinancialSummary,
): RecommendationItem | null {
  const rows = enriched.topCategories.slice(0, 3);
  if (rows.length === 0) return null;

  const combinedMonthly = rows.reduce((sum, row) => sum + row.monthlyAvg, 0);
  const combinedShare = rows.reduce((sum, row) => sum + row.sharePct, 0);
  const savings = savingsFromMonthlyCut(combinedMonthly);
  const breakdown = rows.map((row) => ({
    label: row.category,
    monthlyAvg: row.monthlyAvg,
    sharePct: row.sharePct,
  }));

  if (rows.length === 1) {
    const row = rows[0]!;
    return {
      title: `Where you spend most: ${row.category}`,
      message: `${row.category} averaged $${row.monthlyAvg.toLocaleString()}/mo (${row.sharePct}% of expenses). Trimming by ~10% would free up ~$${savingsFromMonthlyCut(row.monthlyAvg)}/mo.`,
      impact: row.sharePct >= 25 ? "high" : "medium",
      estimatedMonthlySavings: savingsFromMonthlyCut(row.monthlyAvg),
      breakdown,
    };
  }

  return {
    title: "Trim your top spending categories",
    message:
      `These ${rows.length} categories total ~$${combinedMonthly.toLocaleString()}/mo (~${combinedShare}% of expenses). ` +
      `Cutting ~10% across them could save ~$${savings.toLocaleString()}/mo.`,
    impact: combinedShare >= 50 || (rows[0]?.sharePct ?? 0) >= 25 ? "high" : "medium",
    estimatedMonthlySavings: savings,
    breakdown,
  };
}

function buildTrendRecommendation(enriched: EnrichedFinancialSummary): RecommendationItem | null {
  const mom = enriched.monthOverMonthChange;
  if (!mom || enriched.spendingTrendDirection !== "up") return null;

  const monthlyDelta = monthlyFromPeriod(Math.abs(mom.expenseDelta), enriched.monthCount);
  const savings = Math.max(10, Math.round(monthlyDelta * 0.25));

  return {
    title: "Reverse the spending uptick",
    message:
      `Expenses rose from $${mom.previousExpenses.toLocaleString()} (${mom.previousMonth}) to ` +
      `$${mom.currentExpenses.toLocaleString()} (${mom.currentMonth}). Hold discretionary categories flat next month to claw back ~$${savings.toLocaleString()}/mo.`,
    impact: "high",
    estimatedMonthlySavings: savings,
  };
}

function buildMerchantSpendRecommendation(
  merchant: string,
  periodTotal: number,
  count: number,
  monthCount: number,
): RecommendationItem {
  const monthly = monthlyFromPeriod(periodTotal, monthCount);
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
  const enriched = buildEnrichedFinancialSummary(reportData);
  const monthCount = enriched.monthCount;
  const candidates: RecommendationItem[] = [];

  const mergedCategory = buildMergedCategoryRecommendation(enriched);
  if (mergedCategory) candidates.push(mergedCategory);

  const trendRec = buildTrendRecommendation(enriched);
  if (trendRec) candidates.push(trendRec);

  if (enriched.topMerchant) {
    candidates.push(
      buildMerchantSpendRecommendation(
        enriched.topMerchant.merchant,
        enriched.topMerchant.periodTotal,
        enriched.topMerchant.count,
        monthCount,
      ),
    );
  }

  candidates.push(
    buildCashFlowRecommendation(
      reportData,
      monthCount,
      enriched.topCategory?.category ?? "discretionary",
    ),
  );

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
      message:
        "Re-run AI analysis after adding another month of transactions for sharper category comparisons.",
      impact: "low",
      estimatedMonthlySavings: 0,
    });
  }

  return unique.slice(0, 3);
}

export function generateStaticInsights(reportData: ReportData): AIInsights {
  const { totalTransactions, period } = reportData;

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
          message:
            "Use the Import page AI analyzer to generate three personalized savings suggestions.",
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

  const enriched = buildEnrichedFinancialSummary(reportData);
  const {
    totalIncome,
    totalExpenses,
    netCashFlow,
    savingsRate,
    monthCount,
    topCategory,
    topMerchant,
    monthOverMonthChange,
    spendingTrendDirection,
    highestTransaction,
    averageMonthlySpend,
  } = enriched;

  const topCatName = topCategory?.category ?? "Spending";
  const topCatShare = topCategory?.sharePct ?? 0;

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
    (topCategory
      ? `Your biggest category is ${topCatName} at ~$${topCategory.monthlyAvg.toLocaleString()}/mo (${topCatShare}% of spend).`
      : `Top spending category: ${topCatName}.`);

  const observations: ObservationItem[] = [];

  const topCatRows = enriched.topCategories.slice(0, 3);
  if (topCatRows.length > 0) {
    const combinedMonthly = topCatRows.reduce((sum, row) => sum + row.monthlyAvg, 0);
    const combinedShare = topCatRows.reduce((sum, row) => sum + row.sharePct, 0);
    const categoryList = topCatRows
      .map((row) => `${row.category} (${row.sharePct}%, ~$${row.monthlyAvg.toLocaleString()}/mo)`)
      .join("; ");

    observations.push({
      title: topCatRows.length === 1 ? `Largest category: ${topCatName}` : "Spending concentration",
      message:
        topCatRows.length === 1
          ? `${topCatName} accounts for ${topCatShare}% of expenses (~$${topCategory!.monthlyAvg.toLocaleString()}/mo).`
          : `Your top ${topCatRows.length} categories — ${categoryList} — total ~$${combinedMonthly.toLocaleString()}/mo (~${combinedShare}% of expenses).`,
      severity: combinedShare >= 60 || topCatShare >= 40 ? "warning" : "info",
      category: topCatName,
    });
  }

  if (topMerchant) {
    observations.push({
      title: `Largest merchant: ${topMerchant.merchant}`,
      message: `${topMerchant.merchant} is ${topMerchant.sharePct}% of spend (~$${topMerchant.monthlyAvg.toLocaleString()}/mo, ${topMerchant.count} transaction(s)).`,
      severity: "info",
      category: topCatName,
    });
  }

  if (monthOverMonthChange) {
    const pctLabel =
      monthOverMonthChange.expenseDeltaPct != null
        ? `${monthOverMonthChange.expenseDeltaPct > 0 ? "+" : ""}${monthOverMonthChange.expenseDeltaPct}%`
        : "n/a";
    observations.push({
      title: "Spending trend",
      message: `Expenses ${spendingTrendDirection === "up" ? "rose" : spendingTrendDirection === "down" ? "fell" : "held steady"} from $${monthOverMonthChange.previousExpenses.toLocaleString()} (${monthOverMonthChange.previousMonth}) to $${monthOverMonthChange.currentExpenses.toLocaleString()} (${monthOverMonthChange.currentMonth}), ${pctLabel} month-over-month.`,
      severity: spendingTrendDirection === "up" ? "warning" : "info",
      category: "Trend",
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

  observations.push({
    title: "Activity",
    message: `${totalTransactions} transaction(s) across ${monthCount} month(s); ~$${averageMonthlySpend.toLocaleString()}/mo average spend.`,
    severity: "info",
    category: "General",
  });

  const recommendations = buildSpendingRecommendations(reportData);

  const anomalies: AnomalyItem[] = [];
  if (
    highestTransaction &&
    averageMonthlySpend > 0 &&
    highestTransaction.amount >= averageMonthlySpend * 1.5
  ) {
    anomalies.push({
      title: "Large expense",
      message: `${highestTransaction.merchant} on ${highestTransaction.date} was $${highestTransaction.amount.toLocaleString()}, well above your ~$${averageMonthlySpend.toLocaleString()}/mo average.`,
      severity: "warning",
      amount: highestTransaction.amount,
    });
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

export function validateInsights(insights: any, reportData: ReportData): AIInsights {
  const fallback = fallbackInsights(reportData);
  if (!insights || typeof insights !== "object") {
    return fallback;
  }

  const summary = typeof insights.summary === "string" ? insights.summary : fallback.summary;
  let score = typeof insights.score === "number" ? insights.score : fallback.score;
  if (score < 0 || score > 100 || isNaN(score)) score = 70;

  const riskLevel = ["low", "medium", "high"].includes(insights.riskLevel)
    ? insights.riskLevel
    : "low";

  const observations = Array.isArray(insights.observations)
    ? insights.observations.map((o: any) => ({
        title: typeof o?.title === "string" ? o.title : "Observation",
        message: typeof o?.message === "string" ? o.message : "",
        severity: ["info", "warning", "critical"].includes(o?.severity) ? o.severity : "info",
        category: typeof o?.category === "string" ? o.category : "General",
      }))
    : fallback.observations;

  const recommendations = Array.isArray(insights.recommendations)
    ? insights.recommendations.map((r: any) => ({
        title: typeof r?.title === "string" ? r.title : "Recommendation",
        message: typeof r?.message === "string" ? r.message : "",
        impact: ["low", "medium", "high"].includes(r?.impact) ? r.impact : "medium",
        estimatedMonthlySavings:
          typeof r?.estimatedMonthlySavings === "number" ? r.estimatedMonthlySavings : 0,
        breakdown: Array.isArray(r?.breakdown)
          ? r.breakdown.map((b: any) => ({
              label: typeof b?.label === "string" ? b.label : "Category",
              monthlyAvg: typeof b?.monthlyAvg === "number" ? b.monthlyAvg : 0,
              sharePct: typeof b?.sharePct === "number" ? b.sharePct : 0,
            }))
          : undefined,
      }))
    : fallback.recommendations;

  const paddedRecommendations = recommendations.slice(0, 3);
  while (paddedRecommendations.length < 3) {
    paddedRecommendations.push(fallback.recommendations[paddedRecommendations.length]!);
  }

  const anomalies = Array.isArray(insights.anomalies)
    ? insights.anomalies.map((a: any) => ({
        title: typeof a?.title === "string" ? a.title : "Anomaly",
        message: typeof a?.message === "string" ? a.message : "",
        severity: ["info", "warning", "critical"].includes(a?.severity) ? a.severity : "info",
        amount: typeof a?.amount === "number" ? a.amount : 0,
      }))
    : [];

  return {
    summary,
    score,
    riskLevel,
    observations,
    recommendations: paddedRecommendations,
    anomalies,
  };
}

export async function generateInsightsWithOpenRouter(
  reportData: ReportData,
): Promise<InsightsGenerationResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "openrouter/free";
  const appUrl = process.env.APP_URL || "https://financeos.app";
  const enriched = buildEnrichedFinancialSummary(reportData);

  if (!apiKey) {
    logOpenRouter("openrouter_skipped", {
      operation: "insights",
      reason: "missing_api_key",
      model,
      outcome: "fallback",
    });
    return { insights: fallbackInsights(reportData), source: "fallback" };
  }

  logOpenRouter("openrouter_start", {
    operation: "insights",
    model,
    endpoint: endpointLabel(OPENROUTER_CHAT_COMPLETIONS_URL),
    transactionCount: reportData.totalTransactions,
  });

  const startedAt = Date.now();
  const failInsights = (fields: Record<string, unknown>): InsightsGenerationResult => {
    logOpenRouter("openrouter_failure", {
      operation: "insights",
      model,
      durationMs: Date.now() - startedAt,
      outcome: "fallback",
      ...fields,
    });
    return { insights: fallbackInsights(reportData), source: "fallback" };
  };

  const prompt = buildInsightsLlmPrompt(enriched);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 18000);

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
        model: model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
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
    return { insights, source: "openrouter" };
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
      estimatedMonthlySavings:
        summary.netCashFlow >= 0 ? 50 : Math.round(summary.totalExpenses * 0.08) || 40,
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
      title: typeof item.title === "string" ? item.title : (fallback[idx]?.title ?? "Suggestion"),
      message: typeof item.message === "string" ? item.message : (fallback[idx]?.message ?? ""),
      impact: ["low", "medium", "high"].includes(item.impact)
        ? item.impact
        : (fallback[idx]?.impact ?? "medium"),
      estimatedMonthlySavings:
        typeof item.estimatedMonthlySavings === "number"
          ? item.estimatedMonthlySavings
          : (fallback[idx]?.estimatedMonthlySavings ?? 0),
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

    const suggestions = validateCoachSuggestions(
      (parsed as { suggestions?: unknown }).suggestions,
      summary,
    );
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
