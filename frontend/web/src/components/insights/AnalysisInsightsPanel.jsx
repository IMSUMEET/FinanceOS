import { useState, useMemo, useEffect } from "react";
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
  const { transactions, updateCategory, createMerchantRule, latestAnalysis } = useTransactions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isFlipping, setIsFlipping] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState(null);

  // Reset deck index to 0 whenever AI analysis is re-run or latestAnalysis updates
  useEffect(() => {
    setCurrentIndex(0);
    setSelectedCategory("");
    setSelectedItemIds(null);
  }, [latestAnalysis]);

  // Group unverified transactions by exact normalized merchant / description key (e.g. "Costco Gas" separate from "Costco")
  const merchantGroups = useMemo(() => {
    const map = {};
    for (const t of transactions || []) {
      if (t.manual_override) continue;
      const rawDesc = (t.description || t.merchant_raw || t.merchant || "Other").trim();
      const key = (t.merchant_normalized || rawDesc).trim();

      // Separate "Costco Gas" or distinct description variants into their own card deck group
      const finalGroupKey =
        rawDesc.toLowerCase().includes("gas") && !key.toLowerCase().includes("gas")
          ? `${key} Gas`
          : key;

      if (!map[finalGroupKey]) {
        map[finalGroupKey] = {
          merchantKey: finalGroupKey,
          items: [],
          proposedCategory: t.aiCategory || t.category || "Other",
          totalAmount: 0,
        };
      }
      map[finalGroupKey].items.push(t);
      map[finalGroupKey].totalAmount += Math.abs(t.amount || 0);
    }
    return Object.values(map).sort((a, b) => b.items.length - a.items.length);
  }, [transactions]);

  const activeGroup = merchantGroups[currentIndex % Math.max(1, merchantGroups.length)];

  // Initialize selectedItemIds to all items in current activeGroup
  const activeItemIds = useMemo(() => {
    return activeGroup?.items.map((i) => i.id) || [];
  }, [activeGroup]);

  const effectiveSelectedIds = selectedItemIds !== null ? selectedItemIds : activeItemIds;

  const toggleItemSelection = (id) => {
    setSelectedItemIds((prev) => {
      const current = prev !== null ? prev : activeItemIds;
      if (current.includes(id)) {
        return current.filter((x) => x !== id);
      } else {
        return [...current, id];
      }
    });
  };

  const toggleSelectAll = () => {
    if (effectiveSelectedIds.length === activeItemIds.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(activeItemIds);
    }
  };

  const handleApproveGroup = (categoryOverride) => {
    if (!activeGroup) return;
    const catToSave =
      categoryOverride || selectedCategory || activeGroup.proposedCategory || "Other";
    const itemsToApprove = activeGroup.items.filter((item) =>
      effectiveSelectedIds.includes(item.id),
    );

    if (itemsToApprove.length === 0) return;

    setIsFlipping(true);
    setTimeout(() => {
      // 1. Create permanent merchant rule if all items in merchant group are being approved
      if (itemsToApprove.length === activeGroup.items.length) {
        createMerchantRule({
          merchantKey: activeGroup.merchantKey,
          category: catToSave,
          source: "manual",
        });
      } else {
        // 2. Update selected individual items
        for (const item of itemsToApprove) {
          updateCategory(item.id, catToSave);
        }
      }

      setCurrentIndex((prev) => prev + 1);
      setSelectedCategory("");
      setSelectedItemIds(null);
      setIsFlipping(false);
    }, 250);
  };

  const handleSkipGroup = () => {
    if (!activeGroup) return;
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setSelectedCategory("");
      setSelectedItemIds(null);
      setIsFlipping(false);
    }, 250);
  };

  if (!merchantGroups || merchantGroups.length === 0) {
    return (
      <Card padding="md" className="text-center py-8">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
          <Check size={24} />
        </span>
        <p className="text-base font-bold text-ink-900 dark:text-white">
          All merchant groups approved!
        </p>
        <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
          No remaining unverified cards in deck.
        </p>
      </Card>
    );
  }

  const remainingGroups = merchantGroups.length;
  const currentCardNumber = (currentIndex % remainingGroups) + 1;

  return (
    <Card padding="md" className="space-y-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-black uppercase tracking-wider text-ink-800 dark:text-ink-100 flex items-center gap-2">
            <span>Bulk Group Recategorizer</span>
            <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-300">
              Group {currentCardNumber} of {remainingGroups}
            </span>
          </h4>
          <p className="text-xs text-ink-500 dark:text-ink-400">
            Select line items via checkbox and approve them together. Skip pushes the group to the
            back.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSkipGroup}
            className="rounded-xl border border-border-subtle bg-surface-muted px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-border-subtle dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
          >
            Skip Group →
          </button>
        </div>
      </div>

      {/* Card Deck Animation Container */}
      <div className="relative min-h-[320px] w-full max-w-2xl mx-auto perspective-1000 py-2">
        {/* Shadow Stack Cards Behind */}
        <div className="absolute inset-x-4 top-4 h-72 rounded-2xl border border-border-subtle bg-surface-muted/40 scale-95 opacity-50 dark:border-ink-800 dark:bg-ink-900/40 pointer-events-none" />
        <div className="absolute inset-x-2 top-2 h-72 rounded-2xl border border-border-subtle bg-surface-muted/70 scale-98 opacity-75 dark:border-ink-800 dark:bg-ink-900/60 pointer-events-none" />

        {/* Active Group Card */}
        {activeGroup ? (
          <div
            className={`relative flex flex-col justify-between rounded-2xl border-2 border-purple-500/30 bg-white p-6 shadow-2xl transition-all duration-300 dark:border-purple-400/30 dark:bg-ink-900 ${
              isFlipping
                ? "scale-90 opacity-0 -translate-y-6 rotate-3"
                : "scale-100 opacity-100 translate-y-0 rotate-0"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-black text-purple-600 dark:text-purple-300 uppercase">
                    {effectiveSelectedIds.length} of {activeGroup.items.length} Selected
                  </span>
                </div>
                <h3 className="text-2xl font-black text-ink-900 dark:text-white mt-1 truncate max-w-md">
                  {activeGroup.merchantKey}
                </h3>
                <p className="text-xs font-semibold text-ink-500 dark:text-ink-400 mt-0.5">
                  Total group spend: {formatCurrency(activeGroup.totalAmount)}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-bold text-purple-600 dark:text-purple-300 hover:underline"
              >
                {effectiveSelectedIds.length === activeItemIds.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            {/* List Preview of Transactions in Group with Checkboxes */}
            <div className="my-4 max-h-40 overflow-y-auto space-y-2 rounded-xl bg-surface-muted/50 p-3 dark:bg-ink-800/40 text-xs border border-border-subtle dark:border-ink-800">
              {activeGroup.items.map((item, idx) => {
                const rawNum = Number(item.amount || 0);
                const desc =
                  `${item.description || ""} ${item.merchant || ""} ${item.merchant_raw || ""}`.toLowerCase();
                const isExplicitIncome =
                  item.transaction_type === "income" ||
                  item.category === "Income" ||
                  item.category === "Refund" ||
                  /zelle\s+(payment\s+from|from|credit|received|deposit)/i.test(desc) ||
                  /payroll|edipayment|direct\s+deposit|salary|wages|employer/i.test(desc);

                const formattedPrice = formatCurrency(Math.abs(rawNum));
                const isChecked = effectiveSelectedIds.includes(item.id);

                return (
                  <div
                    key={item.id || idx}
                    onClick={() => toggleItemSelection(item.id)}
                    className={`flex items-center justify-between font-semibold p-1.5 rounded-lg cursor-pointer transition ${
                      isChecked
                        ? "bg-purple-500/10 dark:bg-purple-950/30"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleItemSelection(item.id)}
                        className="h-4 w-4 rounded border-border-subtle text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <span className="truncate max-w-xs text-ink-800 dark:text-ink-100">
                        {formatDate(item.date)} · {item.description || item.merchant_raw}
                      </span>
                    </div>
                    <span
                      className={`font-mono font-bold shrink-0 ${isExplicitIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                    >
                      {isExplicitIncome ? `+${formattedPrice}` : `-${formattedPrice}`}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mb-3 rounded-xl bg-purple-500/10 p-3 dark:bg-purple-950/30 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  Proposed Group Category
                </p>
                <p className="text-sm font-black text-purple-900 dark:text-purple-100 mt-0.5">
                  {activeGroup.proposedCategory}
                </p>
              </div>
              <button
                type="button"
                disabled={effectiveSelectedIds.length === 0}
                onClick={() => handleApproveGroup(activeGroup.proposedCategory)}
                className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-purple-700 disabled:opacity-50"
              >
                Approve {effectiveSelectedIds.length} Selected
              </button>
            </div>

            {/* Category Override Selector & Bulk Actions */}
            <div className="flex items-center gap-2 pt-1">
              <select
                value={selectedCategory || activeGroup.proposedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 rounded-xl border border-border-subtle bg-white px-3 py-2 text-xs font-bold text-ink-900 shadow-sm focus:border-purple-500 focus:outline-none dark:bg-ink-800 dark:text-white dark:border-ink-700"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={effectiveSelectedIds.length === 0}
                onClick={() => handleApproveGroup()}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
              >
                Save Selected ({effectiveSelectedIds.length})
              </button>

              <button
                type="button"
                onClick={handleSkipGroup}
                className="rounded-xl border border-border-subtle bg-surface-muted px-3 py-2 text-xs font-bold text-ink-700 hover:bg-border-subtle dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200"
              >
                Skip
              </button>
            </div>
          </div>
        ) : null}
      </div>
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
        {loading ? "Running Analysis..." : done ? "AI Analysis Complete!" : "Run AI Analysis"}
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
                      insights.riskLevel === "critical"
                        ? "danger"
                        : insights.riskLevel === "high"
                          ? "danger"
                          : insights.riskLevel === "medium"
                            ? "warn"
                            : "success"
                    }
                  >
                    Risk: {insights.riskLevel}
                  </Badge>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Savings Trend Analysis */}
      {insights?.savingsAnalysis ? (
        <Card padding="md" className="space-y-3 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-ink-900 dark:text-white flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                <TrendingUp size={16} />
              </span>
              <span>Savings Analysis</span>
            </h3>
            <Badge
              tone={
                insights.savingsAnalysis.trend === "up"
                  ? "success"
                  : insights.savingsAnalysis.trend === "down"
                    ? "danger"
                    : "brand"
              }
            >
              Trend: {insights.savingsAnalysis.trend}
            </Badge>
          </div>
          <p className="text-sm leading-relaxed text-ink-700 dark:text-ink-200">
            {insights.savingsAnalysis.message}
          </p>
          <div className="flex flex-wrap gap-4 pt-1 text-xs font-bold text-ink-600 dark:text-ink-300">
            <span>
              Current Savings: {formatCurrency(insights.savingsAnalysis.currentSavings)} (
              {insights.savingsAnalysis.currentSavingsRate}%)
            </span>
            {insights.savingsAnalysis.previousSavings != null ? (
              <span>
                Previous Period: {formatCurrency(insights.savingsAnalysis.previousSavings)} (
                {insights.savingsAnalysis.previousSavingsRate}%)
              </span>
            ) : null}
          </div>
        </Card>
      ) : null}

      {/* Spending Insights Section */}
      {insights && insights.spendingInsights.length > 0 ? (
        <Card padding="md">
          <SectionHeader
            eyebrow="Spending changes"
            title="Spending Insights"
            subtitle="Specific root causes and historical spending deltas identified by Qwen AI."
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {insights.spendingInsights.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-border-subtle bg-surface-muted/40 p-3.5 space-y-1.5 dark:border-ink-800 dark:bg-ink-900/40"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-ink-900 dark:text-white">{item.title}</h4>
                  <Badge
                    tone={
                      item.impact === "high"
                        ? "danger"
                        : item.impact === "medium"
                          ? "warn"
                          : "brand"
                    }
                  >
                    {item.impact} impact
                  </Badge>
                </div>
                <p className="text-xs text-ink-700 dark:text-ink-300">{item.message}</p>
                {Array.isArray(item.evidence) && item.evidence.length > 0 ? (
                  <ul className="list-disc pl-4 text-[11px] text-ink-500 dark:text-ink-400 space-y-0.5 pt-1">
                    {item.evidence.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Key Findings Section */}
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

      {/* Category & Merchant Insights */}
      {insights &&
      (insights.categoryInsights.length > 0 || insights.merchantInsights.length > 0) ? (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.categoryInsights.length > 0 ? (
            <Card padding="md">
              <h3 className="text-sm font-black uppercase tracking-wider text-ink-700 dark:text-ink-200 mb-3">
                Category Insights
              </h3>
              <div className="space-y-2.5">
                {insights.categoryInsights.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-surface-muted/50 dark:bg-ink-800/40 text-xs"
                  >
                    <div>
                      <p className="font-bold text-ink-900 dark:text-white">{c.category}</p>
                      <p className="text-ink-600 dark:text-ink-300 mt-0.5">{c.message}</p>
                    </div>
                    <Badge tone={c.importance === "high" ? "danger" : "brand"}>
                      {c.importance}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {insights.merchantInsights.length > 0 ? (
            <Card padding="md">
              <h3 className="text-sm font-black uppercase tracking-wider text-ink-700 dark:text-ink-200 mb-3">
                Merchant Insights
              </h3>
              <div className="space-y-2.5">
                {insights.merchantInsights.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-surface-muted/50 dark:bg-ink-800/40 text-xs"
                  >
                    <div>
                      <p className="font-bold text-ink-900 dark:text-white">{m.merchant}</p>
                      <p className="text-ink-600 dark:text-ink-300 mt-0.5">{m.message}</p>
                    </div>
                    <Badge tone={m.importance === "high" ? "danger" : "brand"}>
                      {m.importance}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      ) : null}

      {/* Recurring Insights Section */}
      {insights && insights.recurringInsights.length > 0 ? (
        <Card padding="md">
          <SectionHeader
            eyebrow="Subscription audit"
            title="Recurring Expenses Insights"
            subtitle="Recurring charges identified for review and potential savings."
          />
          <div className="mt-3 divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-white dark:border-ink-800 dark:bg-ink-900/50">
            {insights.recurringInsights.map((r, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-center justify-between gap-3 p-3 text-xs"
              >
                <div>
                  <p className="font-bold text-ink-900 dark:text-white">{r.merchant}</p>
                  <p className="text-ink-600 dark:text-ink-300">{r.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-purple-600 dark:text-purple-300">
                    ~{formatCurrency(r.estimatedMonthlyCost)}/mo
                  </span>
                  {r.reviewRecommended ? <Badge tone="warn">Review Recommended</Badge> : null}
                </div>
              </div>
            ))}
          </div>
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
