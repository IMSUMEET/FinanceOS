import { Sparkles, Bot } from "lucide-react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import SectionHeader from "../ui/SectionHeader";
import AISuggestionCard, { AI_SUGGESTION_THEMES } from "./AISuggestionCard";
import {
  parseAnalysisInsights,
  observationSeverityTone,
  topAiRecommendations,
} from "../../utils/analysisInsights";

function AnalysisInsightsPanel({ latestAnalysis }) {
  const insights = parseAnalysisInsights(latestAnalysis);
  const suggestions = topAiRecommendations(insights?.recommendations ?? [], 3);

  const sourceLabel =
    insights?.source === "static"
      ? "Lambda 2 · AI analyzer"
      : insights?.source === "openrouter"
        ? "OpenRouter"
        : "Server analysis";

  return (
    <div className="space-y-5">
      <Card variant="dark" padding="md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
                <Bot size={18} />
              </span>
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">AI suggestions</p>
            </div>
            <h2 className="mt-3 text-2xl font-black text-white md:text-3xl">
              {insights ? "Your personalized action plan" : "Waiting for your first analysis"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-white/75">
              {insights?.summary ??
                "Upload a CSV with AI analysis on the Import page. Lambda returns three tailored recommendations based on your spending."}
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

      <div className="grid gap-5 md:grid-cols-3">
        {AI_SUGGESTION_THEMES.map((theme, index) => (
          <AISuggestionCard
            key={theme.header}
            index={index}
            theme={theme}
            suggestion={suggestions[index]}
            placeholder={!suggestions[index]}
          />
        ))}
      </div>

      {insights && insights.observations.length > 0 ? (
        <Card padding="md">
          <SectionHeader eyebrow="From your analysis" title="What we noticed" />
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {insights.observations.slice(0, 3).map((item, idx) => (
              <li
                key={`${item.title}-${idx}`}
                className="rounded-xl2 border border-ink-100 bg-[#f8fbff] px-4 py-3 dark:border-ink-800 dark:bg-ink-800/60"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-ink-900 dark:text-ink-50">{item.title}</p>
                  {item.severity ? (
                    <Badge tone={observationSeverityTone(item.severity)}>{item.severity}</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">{item.message}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

export default AnalysisInsightsPanel;
