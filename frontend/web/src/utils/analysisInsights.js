/** Normalize Lambda analysis `insights` payload for UI display. */
export function parseAnalysisInsights(latestAnalysis) {
  if (!latestAnalysis || typeof latestAnalysis !== "object") return null;
  const insights = latestAnalysis.insights;
  if (!insights || typeof insights !== "object") return null;

  return {
    summary:
      typeof insights.summary === "string" ? insights.summary : insights.summary?.explanation || "",
    headline: insights.summary?.headline || "",
    financialDirection: insights.summary?.financialDirection || null,
    score: typeof insights.score === "number" ? insights.score : null,
    riskLevel: insights.riskLevel ?? null,
    observations: Array.isArray(insights.observations) ? insights.observations : [],
    spendingInsights: Array.isArray(insights.spendingInsights) ? insights.spendingInsights : [],
    savingsAnalysis:
      insights.savingsAnalysis && typeof insights.savingsAnalysis === "object"
        ? insights.savingsAnalysis
        : null,
    categoryInsights: Array.isArray(insights.categoryInsights) ? insights.categoryInsights : [],
    merchantInsights: Array.isArray(insights.merchantInsights) ? insights.merchantInsights : [],
    recurringInsights: Array.isArray(insights.recurringInsights) ? insights.recurringInsights : [],
    recommendations: Array.isArray(insights.recommendations) ? insights.recommendations : [],
    anomalies: Array.isArray(insights.anomalies) ? insights.anomalies : [],
    source: latestAnalysis?.aiStatus?.insights ?? null,
    mode: latestAnalysis?.mode ?? null,
  };
}

export function insightSourceLabel(source) {
  if (source === "static") return "Lambda 2 · AI analyzer";
  if (source === "openrouter") return "OpenRouter · ranked insights";
  if (source === "fallback") return "Lambda 2 · static fallback";
  return "Server analysis";
}

export function recommendationImpactTone(impact) {
  if (impact === "high") {
    return "border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200";
  }
  if (impact === "low") {
    return "border-ink-200 bg-ink-50/80 text-ink-700 dark:border-ink-700 dark:bg-ink-900/50 dark:text-ink-300";
  }
  return "border-brand-200 bg-brand-50/60 text-brand-800 dark:border-brand-900/50 dark:bg-brand-950/25 dark:text-brand-200";
}

export function observationSeverityTone(severity) {
  if (severity === "warning") return "warn";
  if (severity === "critical") return "danger";
  return "neutral";
}

/** Legacy titles from pre-merge static engine — fold into one card. */
const CATEGORY_REC_TITLE =
  /^(?:Where you spend most|Second-biggest category|Third-biggest category):\s*(.+)$/i;

function parseCategoryFromMessage(message) {
  const monthlyMatch = String(message ?? "").match(/\$([\d,]+)\/mo/);
  const pctMatch = String(message ?? "").match(/\((\d+)%/);
  return {
    monthlyAvg: monthlyMatch ? Number(monthlyMatch[1].replace(/,/g, "")) : 0,
    sharePct: pctMatch ? Number(pctMatch[1]) : 0,
  };
}

/** Merge separate top-category recommendation cards into one deduplicated card. */
export function dedupeCategoryRecommendations(recommendations) {
  if (!Array.isArray(recommendations) || recommendations.length === 0) return [];

  const categoryRecs = [];
  const other = [];

  for (const rec of recommendations) {
    if (CATEGORY_REC_TITLE.test(rec?.title ?? "")) {
      categoryRecs.push(rec);
    } else {
      other.push(rec);
    }
  }

  if (categoryRecs.length < 2) return recommendations;

  const breakdown = categoryRecs.map((rec) => {
    const label = String(rec.title).replace(CATEGORY_REC_TITLE, "$1").trim();
    const parsed = parseCategoryFromMessage(rec.message);
    return {
      label,
      monthlyAvg: rec.breakdown?.[0]?.monthlyAvg ?? parsed.monthlyAvg,
      sharePct: rec.breakdown?.[0]?.sharePct ?? parsed.sharePct,
    };
  });

  const combinedMonthly = breakdown.reduce((sum, row) => sum + row.monthlyAvg, 0);
  const combinedShare = breakdown.reduce((sum, row) => sum + row.sharePct, 0);
  const savings = categoryRecs.reduce((sum, rec) => sum + (rec.estimatedMonthlySavings || 0), 0);

  const merged = {
    title: "Trim your top spending categories",
    message:
      `These ${breakdown.length} categories total ~$${combinedMonthly.toLocaleString()}/mo (~${combinedShare}% of expenses). ` +
      `Cutting ~10% across them could save ~$${savings.toLocaleString()}/mo.`,
    impact: categoryRecs.some((rec) => rec.impact === "high") ? "high" : "medium",
    estimatedMonthlySavings: savings,
    breakdown,
  };

  return [merged, ...other];
}

/** Top N Lambda recommendations for the AI suggestion cards. */
export function topAiRecommendations(recommendations, limit = 3) {
  if (!Array.isArray(recommendations)) return [];
  return dedupeCategoryRecommendations(recommendations).slice(0, limit);
}

/** Top N Lambda anomalies (prompt allows 0–2). */
export function topAiAnomalies(anomalies, limit = 2) {
  if (!Array.isArray(anomalies)) return [];
  return anomalies.slice(0, limit);
}
