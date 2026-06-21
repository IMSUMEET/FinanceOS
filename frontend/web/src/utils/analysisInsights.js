/** Normalize Lambda analysis `insights` payload for UI display. */
export function parseAnalysisInsights(latestAnalysis) {
  const insights = latestAnalysis?.insights;
  if (!insights || typeof insights !== "object") return null;

  return {
    summary: typeof insights.summary === "string" ? insights.summary : "",
    score: typeof insights.score === "number" ? insights.score : null,
    riskLevel: insights.riskLevel ?? null,
    observations: Array.isArray(insights.observations) ? insights.observations : [],
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

/** Top N Lambda recommendations for the AI suggestion cards. */
export function topAiRecommendations(recommendations, limit = 3) {
  if (!Array.isArray(recommendations)) return [];
  return recommendations.slice(0, limit);
}

/** Top N Lambda anomalies (prompt allows 0–2). */
export function topAiAnomalies(anomalies, limit = 2) {
  if (!Array.isArray(anomalies)) return [];
  return anomalies.slice(0, limit);
}
