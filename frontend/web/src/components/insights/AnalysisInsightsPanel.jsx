import { useState, useMemo } from "react";
import { Sparkles, Bot, Lightbulb, AlertTriangle, RefreshCw, Check } from "lucide-react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import SectionHeader from "../ui/SectionHeader";
import AISuggestionCard, { AI_SUGGESTION_THEMES } from "./AISuggestionCard";
import AIInsightCard from "./AIInsightCard";
import AIAnomalyCard, { AIAnomalyEmptyState } from "./AIAnomalyCard";
import { useTransactions } from "../../context/useTransactions";
import {
  parseAnalysisInsights,
  insightSourceLabel,
  topAiRecommendations,
  topAiAnomalies,
} from "../../utils/analysisInsights";

import { CATEGORIES } from "../../utils/categories";
import CategoryBadge from "../ui/CategoryBadge";
import { formatAmountSpend, formatCurrency, formatDate } from "../../utils/format";

function AiCategoryGroupList() {
  const { transactions, updateCategory } = useTransactions();
  const [selectedGroup, setSelectedGroup] = useState(null);

  const groups = useMemo(() => {
    const map = {};
    for (const t of transactions) {
      const cat = t.aiCategory || t.category || "Other";
      if (!map[cat]) map[cat] = [];
      map[cat].push(t);
    }
    return Object.entries(map)
      .map(([cat, list]) => ({
        category: cat,
        count: list.length,
        total: list.reduce((s, x) => s + Math.abs(x.amount || 0), 0),
        items: list,
      }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  if (!transactions || transactions.length === 0) {
    return (
      <Card padding="md">
        <p className="text-sm text-ink-500 dark:text-ink-400">
          No transactions loaded for AI grouping.
        </p>
      </Card>
    );
  }

  const activeGroupData = groups.find((g) => g.category === selectedGroup) || groups[0];

  return (
    <Card padding="md" className="space-y-4">
      {/* Category group pill selector */}
      <div className="flex flex-wrap gap-2">
        {groups.map((g) => {
          const isSelected = activeGroupData?.category === g.category;
          return (
            <button
              key={g.category}
              type="button"
              onClick={() => setSelectedGroup(g.category)}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                isSelected
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-surface-muted text-ink-700 hover:bg-purple-500/10 dark:text-ink-200"
              }`}
            >
              <span>{g.category}</span>
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] dark:bg-white/10">
                {g.count} txns · {formatCurrency(g.total, { compact: true })}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected category group transaction list */}
      {activeGroupData ? (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black uppercase tracking-wider text-ink-700 dark:text-ink-200 flex items-center gap-2">
              <CategoryBadge category={activeGroupData.category} />
              <span>
                {activeGroupData.category} ({activeGroupData.count} transactions)
              </span>
            </h4>
            <span className="text-xs font-bold text-ink-500 dark:text-ink-400">
              Total: {formatCurrency(activeGroupData.total)}
            </span>
          </div>

          <div className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-white dark:bg-ink-900/50">
            {activeGroupData.items.slice(0, 10).map((tx) => (
              <div
                key={tx.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm hover:bg-surface-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-ink-900 dark:text-ink-50 truncate">
                      {tx.merchant || tx.merchant_raw || tx.description}
                    </p>
                    {tx.aiCategory && (
                      <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-300">
                        <Sparkles size={10} /> AI
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-500 dark:text-ink-400">
                    {formatDate(tx.date)} · {tx.card_identity || tx.source}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <p className="tabular font-black text-ink-900 dark:text-ink-50">
                    -${formatAmountSpend(tx.amount)}
                  </p>

                  <select
                    value={tx.category || "Other"}
                    onChange={(e) => updateCategory(tx.id, e.target.value)}
                    className="rounded-lg border border-border-subtle bg-white px-2 py-1 text-xs font-semibold text-ink-800 shadow-sm focus:border-purple-500 focus:outline-none dark:bg-ink-800 dark:text-ink-100"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            {activeGroupData.items.length > 10 && (
              <div className="p-2.5 text-center text-xs font-semibold text-ink-500 dark:text-ink-400">
                + {activeGroupData.items.length - 10} more transactions in this category
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function AiRecategorizeButton() {
  const { runAiAnalysis } = useTransactions();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleRun = async () => {
    if (loading || !runAiAnalysis) return;
    setLoading(true);
    setDone(false);
    try {
      await runAiAnalysis();
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      console.warn("[AI Analysis] Error running analysis:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleRun}
      disabled={loading}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-purple-500/40 bg-purple-500/10 px-4 text-xs font-bold text-purple-700 shadow-sm transition hover:bg-purple-500/20 active:scale-[0.98] dark:border-purple-400/40 dark:bg-purple-500/20 dark:text-purple-100 dark:hover:bg-purple-500/30"
    >
      {loading ? (
        <RefreshCw size={14} className="animate-spin text-purple-600 dark:text-purple-200" />
      ) : done ? (
        <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Sparkles size={14} className="text-purple-600 dark:text-purple-300" />
      )}
      <span>
        {loading ? "Categorizing..." : done ? "AI Categories Applied!" : "Recategorize with AI"}
      </span>
    </button>
  );
}

function AnalysisInsightsPanel({ latestAnalysis }) {
  const insights = parseAnalysisInsights(latestAnalysis);
  const suggestions = topAiRecommendations(insights?.recommendations ?? [], 3);
  const anomalies = topAiAnomalies(insights?.anomalies ?? [], 2);
  const observations = insights?.observations?.slice(0, 5) ?? [];

  const sourceLabel = insightSourceLabel(insights?.source);

  return (
    <div className="space-y-5">
      <Card
        className="rounded-xl3 border border-purple-200/80 bg-white text-ink-900 shadow-soft dark:border-white/10 dark:bg-gradient-to-br dark:from-[#121c2c] dark:via-[#09101d] dark:to-[#070b14] dark:text-white dark:shadow-dark"
        padding="md"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-white/10 dark:text-white">
                <Bot size={18} />
              </span>
              <p className="text-xs font-bold uppercase tracking-widest text-purple-700 dark:text-white/70">
                AI Insights & Categorization
              </p>
            </div>
            <h2 className="mt-3 text-2xl font-black text-ink-900 md:text-3xl dark:text-white">
              AI Insights & Action Plan
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-700 dark:text-white/75">
              {insights?.summary ??
                "AI-powered root cause analysis and automated categorizations for your connected accounts and statements."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AiRecategorizeButton />
            {insights ? (
              <>
                <Badge tone="brand">
                  <Sparkles size={12} className="mr-1 inline" />
                  {sourceLabel}
                </Badge>
                {insights.score != null ? (
                  <Badge
                    tone={
                      insights.score >= 70 ? "success" : insights.score >= 50 ? "warn" : "danger"
                    }
                  >
                    Score {insights.score}
                  </Badge>
                ) : null}
                {insights.riskLevel ? (
                  <Badge
                    tone={
                      insights.riskLevel === "high"
                        ? "danger"
                        : insights.riskLevel === "medium"
                          ? "warn"
                          : "success"
                    }
                  >
                    Risk {insights.riskLevel}
                  </Badge>
                ) : null}
              </>
            ) : null}
          </div>
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
              suggestions[0]?.breakdown?.length > 1
                ? "md:grid-cols-2"
                : "md:grid-cols-2 lg:grid-cols-3"
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

        {/* AI Grouped Transactions Section */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center gap-2 px-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Bot size={16} />
            </span>
            <div>
              <h3 className="text-lg font-black text-ink-900 dark:text-ink-50">
                AI Transaction Groups & Recategorization
              </h3>
              <p className="text-xs text-ink-500 dark:text-ink-400">
                Review transactions grouped by AI suggested categories and select your preferred
                category.
              </p>
            </div>
          </div>
          <AiCategoryGroupList />
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
              <AlertTriangle size={16} />
            </span>
            <div>
              <h3 className="text-lg font-black text-ink-900 dark:text-ink-50">Unusual activity</h3>
              <p className="text-xs text-ink-500 dark:text-ink-400">
                One-off events that differ from normal transaction size — not repeated in findings
                above.
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
