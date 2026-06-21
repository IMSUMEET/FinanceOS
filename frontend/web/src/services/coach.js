import { API_BASE_URL, USE_MOCK } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { buildCoachSummary, fallbackCoachSuggestions } from "../utils/coachSummary";
import { ANALYSIS_STORAGE_KEY } from "../constants/storage";

function readStoredRecommendations() {
  try {
    const raw = localStorage.getItem(ANALYSIS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const recs = parsed?.insights?.recommendations;
    if (!Array.isArray(recs) || !recs.length) return null;
    return recs.slice(0, 3).map((row) => ({
      title: row.title ?? "Suggestion",
      message: row.message ?? "",
      impact: row.impact ?? "medium",
      estimatedMonthlySavings: row.estimatedMonthlySavings ?? 0,
    }));
  } catch {
    return null;
  }
}

/**
 * Fetch top 3 AI coach suggestions for the profile panel.
 * @param {import("../types").Transaction[]} transactions
 * @param {{ personalityLabel?: string, preferFresh?: boolean }} [opts]
 */
export async function getCoachSuggestions(transactions, { personalityLabel, preferFresh = false } = {}) {
  if (!transactions?.length) {
    return { suggestions: [], source: "empty" };
  }

  const summary = buildCoachSummary(transactions, { personalityLabel });

  if (!preferFresh) {
    const cached = readStoredRecommendations();
    if (cached?.length) {
      return { suggestions: cached, source: "analysis" };
    }
  }

  if (USE_MOCK) {
    return { suggestions: fallbackCoachSuggestions(summary), source: "fallback" };
  }

  const res = await fetch(`${API_BASE_URL}${ENDPOINTS.coach.suggestions}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ summary }),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (body && typeof body === "object" && (body.message || body.error)) ||
      `Coach suggestions failed (${res.status})`;
    throw new Error(message);
  }

  const suggestions = Array.isArray(body?.suggestions) ? body.suggestions.slice(0, 3) : [];
  return {
    suggestions: suggestions.length ? suggestions : fallbackCoachSuggestions(summary),
    source: body?.source ?? "fallback",
  };
}
