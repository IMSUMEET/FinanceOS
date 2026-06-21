import { Sparkles, Bot, Lightbulb, AlertTriangle } from "lucide-react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import SectionHeader from "../ui/SectionHeader";
import AISuggestionCard, { AI_SUGGESTION_THEMES } from "./AISuggestionCard";
import AIInsightCard from "./AIInsightCard";
import AIAnomalyCard, { AIAnomalyEmptyState } from "./AIAnomalyCard";
import {
  parseAnalysisInsights,
  insightSourceLabel,
  topAiRecommendations,
  topAiAnomalies,
} from "../../utils/analysisInsights";

function AnalysisInsightsPanel({ latestAnalysis }) {
  const insights = parseAnalysisInsights(latestAnalysis);
  const suggestions = topAiRecommendations(insights?.recommendations ?? [], 3);
  const anomalies = topAiAnomalies(insights?.anomalies ?? [], 2);
  const observations = insights?.observations?.slice(0, 5) ?? [];

  const sourceLabel = insightSourceLabel(insights?.source);

  return (
    <div className="space-y-5">
      <Card variant="dark" padding="md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
                <Bot size={18} />
              </span>
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">Spend analysis</p>
            </div>
            <h2 className="mt-3 text-2xl font-black text-white md:text-3xl">
              {insights ? "Root-cause insights from your CSV" : "Waiting for your first analysis"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/75">
              {insights?.summary ??
                "Upload a CSV with AI analysis on the Import page. Each finding covers a unique root cause — no duplicate category or merchant cards."}
            </p>
          </div>
          {insights ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">
                <Sparkles size={12} className="mr-1 inline" />
                {sourceLabel}
              </Badge>
              {insights.score != null ? (
                <Badge tone={insights.score >= 70 ? "success" : insights.score >= 50 ? "warn" : "danger"}>
                  Score {insights.score}
                </Badge>
              ) : null}
              {insights.riskLevel ? (
                <Badge
                  tone={
                    insights.riskLevel === "high" ? "danger" : insights.riskLevel === "medium" ? "warn" : "success"
                  }
                >
                  Risk {insights.riskLevel}
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>
      </Card>

      {insights && observations.length > 0 ? (
        <Card padding="md">
          <SectionHeader
            eyebrow="Priority order"
            title="Key findings"
            subtitle="One card per root cause — concentration, trend, merchant, then patterns."
          />
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {observations.map((item, idx) => (
              <li key={`${item.title}-${idx}`} className="list-none">
                <AIInsightCard observation={item} index={idx} />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="relative isolate space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
              <Lightbulb size={16} />
            </span>
            <div>
              <h3 className="text-lg font-black text-ink-900 dark:text-ink-50">Action plan</h3>
              <p className="text-xs text-ink-500 dark:text-ink-400">
                One card per root cause — categories merged, then merchant and cash-flow actions.
              </p>
            </div>
          </div>

          {suggestions[0]?.breakdown?.length > 1 ? (
            <AISuggestionCard
              index={0}
              theme={AI_SUGGESTION_THEMES[0]}
              suggestion={suggestions[0]}
              featured
            />
          ) : null}

          <div
            className={`grid gap-4 ${
              suggestions[0]?.breakdown?.length > 1 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {(suggestions[0]?.breakdown?.length > 1 ? [1, 2] : [0, 1, 2]).map((cardIndex) => (
              <AISuggestionCard
                key={`action-${cardIndex}`}
                index={cardIndex}
                theme={AI_SUGGESTION_THEMES[cardIndex] ?? AI_SUGGESTION_THEMES[0]}
                suggestion={suggestions[cardIndex]}
                placeholder={!suggestions[cardIndex]}
              />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
              <AlertTriangle size={16} />
            </span>
            <div>
              <h3 className="text-lg font-black text-ink-900 dark:text-ink-50">Unusual activity</h3>
              <p className="text-xs text-ink-500 dark:text-ink-400">
                One-off events that differ from normal transaction size — not repeated in findings above.
              </p>
            </div>
          </div>
          <div className={`grid gap-4 ${anomalies.length > 1 ? "md:grid-cols-2" : ""}`}>
            {insights && anomalies.length > 0 ? (
              anomalies.map((item, idx) => (
                <AIAnomalyCard key={`${item.title}-${idx}`} anomaly={item} index={idx} />
              ))
            ) : (
              <AIAnomalyEmptyState />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AnalysisInsightsPanel;
