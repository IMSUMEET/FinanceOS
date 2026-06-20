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

export function fallbackInsights(reportData: ReportData): AIInsights {
  return {
    summary: `You had $${reportData.totalIncome} income, $${reportData.totalExpenses} expenses, and $${reportData.netCashFlow} net cash flow during this period.`,
    score: 70,
    riskLevel: "low",
    observations: [
      {
        title: "Net cash flow",
        message: `Your net cash flow was $${reportData.netCashFlow}.`,
        severity: "info",
        category: "Cash Flow",
      },
    ],
    recommendations: [
      {
        title: "Review top categories",
        message: "Start by reviewing your largest spending categories.",
        impact: "medium",
        estimatedMonthlySavings: 0,
      },
    ],
    anomalies: [],
  };
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
  if (!apiKey) {
    console.warn("OPENROUTER_API_KEY is missing, using fallback insights.");
    return fallbackInsights(reportData);
  }

  const model = process.env.OPENROUTER_MODEL || "openrouter/free";
  const appUrl = process.env.APP_URL || "https://financeos.app";

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
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
      throw new Error(`OpenRouter HTTP error: ${res.status}`);
    }

    const resJson: any = await res.json();
    const content = resJson?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from OpenRouter");
    }

    const parsed = safeJsonParse(content);
    if (!parsed) {
      throw new Error("Failed to parse JSON response from AI");
    }

    return validateInsights(parsed, reportData);
  } catch (e: any) {
    clearTimeout(timeoutId);
    console.error("OpenRouter insights generation failed:", e.message || e);
    return fallbackInsights(reportData);
  }
}
