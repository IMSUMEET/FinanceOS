import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CreditCard, Receipt, Sparkles, Wallet } from "lucide-react";
import Card from "../components/ui/Card";
import KpiCard from "../components/ui/KpiCard";
import IconButton from "../components/ui/IconButton";
import CategoryBadge from "../components/ui/CategoryBadge";
import SectionHeader from "../components/ui/SectionHeader";
import CategoryDonut from "../components/charts/CategoryDonut";
import WelcomeHero from "../components/dashboard/WelcomeHero";
import AccountCardStack from "../components/dashboard/AccountCardStack";
import MoneyFlowSection from "../components/dashboard/MoneyFlowSection";
import Reveal from "../components/effects/Reveal";
import { StaggerGroup, StaggerItem } from "../components/effects/StaggerGroup";
import { usePageFilters } from "../context/usePageFilters";
import { useTransactions } from "../context/useTransactions";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { filterByAccount, enrichAccountsFromTransactions } from "../utils/accountCards";
import {
  compareMonthOverMonth,
  dailyAverage,
  detectRecurring,
  totalSpend,
  monthlyTotals,
  monthlyByCategory,
  categoryBreakdown,
  merchantBreakdown,
} from "../utils/insights";
import { formatCurrency, formatMonth, formatPct } from "../utils/format";

function buildOverviewDerived(rows) {
  return {
    monthly: monthlyTotals(rows),
    monthlyByCategory: monthlyByCategory(rows),
    categories: categoryBreakdown(rows),
    merchants: merchantBreakdown(rows),
  };
}

function OverviewPage() {
  useDocumentTitle("Overview");
  const { transactions, setAccountFilter } = useTransactions();
  const { filters } = usePageFilters("overview");
  const [activeCatIdx, setActiveCatIdx] = useState(null);

  const accounts = useMemo(() => enrichAccountsFromTransactions(transactions), [transactions]);
  const scopedRows = useMemo(
    () => filterByAccount(transactions, filters.account),
    [transactions, filters.account],
  );
  const derived = useMemo(() => buildOverviewDerived(scopedRows), [scopedRows]);

  const total = totalSpend(scopedRows);
  const mom = compareMonthOverMonth(scopedRows);
  const avgDaily = dailyAverage(scopedRows);
  const recurring = detectRecurring(scopedRows);
  const topCategory = derived.categories[0];
  const annualizedRecurring = recurring.reduce((s, r) => s + r.annualized, 0);
  const priorMonthLabel =
    mom.previous?.month != null ? formatMonth(mom.previous.month) : "prior month";

  const momTone = mom.deltaPct == null ? "neutral" : mom.deltaPct < 0 ? "up" : "down";
  const momLabel =
    mom.deltaPct == null
      ? `Across ${derived.monthly.length || 0} months`
      : `${formatPct(mom.deltaPct)} vs ${priorMonthLabel}`;

  const scopedTxnCount = scopedRows.filter((row) => row.category !== "Credit Card Payments").length;
  const uniqueSpendDays = new Set(
    scopedRows.filter((row) => row.category !== "Credit Card Payments").map((row) => row.date),
  ).size;
  const cardFilterNote = filters.account
    ? "Filtered to the selected card."
    : "Includes all imported cards.";

  const kpiTooltips = {
    totalSpend: {
      meaning:
        "All spending from your uploaded statements — outflows only, not income or card payments.",
      calculation: `Sum of ${scopedTxnCount.toLocaleString()} transactions. ${cardFilterNote} The change line compares your last two months with data.`,
    },
    avgDaily: {
      meaning:
        "Typical spend on days when you actually made a purchase — a pacing number, not a calendar average.",
      calculation: `${formatCurrency(total)} total spend ÷ ${uniqueSpendDays.toLocaleString()} days with activity. ${cardFilterNote}`,
    },
    topCategory: {
      meaning: "Where most of your money went — the category with the highest total spend.",
      calculation: topCategory
        ? `"${topCategory.category}" leads at ${formatCurrency(topCategory.total)} (${topCategory.count} txns). ${cardFilterNote}`
        : `Categories ranked by total spend. ${cardFilterNote}`,
    },
    recurring: {
      meaning:
        "Estimated yearly cost of subscriptions and other merchants that charge you on a regular schedule.",
      calculation:
        recurring.length > 0
          ? `${recurring.length} merchant${recurring.length === 1 ? "" : "s"} seen in 3+ months at steady amounts, averaged and ×12. ${cardFilterNote}`
          : `Needs 3+ months of similar charges to detect a pattern. ${cardFilterNote}`,
    },
  };

  return (
    <section className="space-y-5 pt-2">
      <Reveal>
        <div
          className={
            accounts.length > 0
              ? "grid gap-5 lg:grid-cols-[1fr_minmax(280px,360px)] lg:items-stretch"
              : ""
          }
        >
          <WelcomeHero compactGraphic={accounts.length > 0} fillHeight={accounts.length > 0} />
          {accounts.length > 0 ? (
            <AccountCardStack
              layout="sidebar"
              accounts={accounts}
              selectedAccount={filters.account}
              onSelectAccount={setAccountFilter}
            />
          ) : null}
        </div>
      </Reveal>

      {/* KPI row */}
      <StaggerGroup className="grid gap-5 overflow-visible pb-2 md:grid-cols-2 xl:grid-cols-4">
        <StaggerItem className="overflow-visible">
          <KpiCard
            title="Total Spend"
            numericValue={total}
            formatNumeric={(n) => formatCurrency(n)}
            change={momLabel}
            changeTone={momTone}
            icon={Wallet}
            tint="bg-gradient-to-br from-teal-500 to-emerald-600 shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.15),inset_2px_2px_4px_rgba(255,255,255,0.2)]"
            tooltip={kpiTooltips.totalSpend}
          />
        </StaggerItem>
        <StaggerItem className="overflow-visible">
          <KpiCard
            title="Avg Daily"
            numericValue={avgDaily}
            formatNumeric={(n) => formatCurrency(n)}
            change={`Across ${derived.monthly.length || 0} months`}
            changeTone="neutral"
            icon={CreditCard}
            tint="bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.15),inset_2px_2px_4px_rgba(255,255,255,0.2)]"
            tooltip={kpiTooltips.avgDaily}
          />
        </StaggerItem>
        <StaggerItem className="overflow-visible">
          <KpiCard
            title="Top Category"
            value={topCategory ? topCategory.category : "—"}
            change={topCategory ? formatCurrency(topCategory.total) : "—"}
            changeTone="neutral"
            icon={Receipt}
            tint="bg-gradient-to-br from-amber-400 to-orange-500 shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.15),inset_2px_2px_4px_rgba(255,255,255,0.2)]"
            tooltip={kpiTooltips.topCategory}
          />
        </StaggerItem>
        <StaggerItem className="overflow-visible">
          <KpiCard
            title="Recurring / yr"
            numericValue={annualizedRecurring}
            formatNumeric={(n) => formatCurrency(n, { compact: true })}
            change={`${recurring.length} subscriptions`}
            changeTone="neutral"
            icon={Sparkles}
            tint="bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.15),inset_2px_2px_4px_rgba(255,255,255,0.2)]"
            tooltip={kpiTooltips.recurring}
          />
        </StaggerItem>
      </StaggerGroup>

      <MoneyFlowSection
        transactions={transactions}
        selectedAccount={filters.account}
        onSelectAccount={setAccountFilter}
      />

      <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
        <Card className="flex h-full flex-col">
          <SectionHeader
            eyebrow="Category Split"
            title="Where money goes"
            action={
              <Link to="/categories">
                <IconButton variant="dark" aria-label="View categories">
                  <ArrowUpRight size={16} />
                </IconButton>
              </Link>
            }
          />
          <div className="mt-6 flex flex-1 flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex shrink-0 justify-center sm:w-[220px]">
              <CategoryDonut
                data={derived.categories}
                total={total}
                activeIndex={activeCatIdx}
                onActiveChange={setActiveCatIdx}
                size={200}
              />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              {derived.categories.length === 0 ? (
                <p className="text-sm text-ink-500 dark:text-ink-400">No category activity yet.</p>
              ) : (
                derived.categories.slice(0, 5).map((c, i) => {
                  const isActive = activeCatIdx === i;
                  return (
                    <button
                      type="button"
                      key={c.category}
                      onMouseEnter={() => setActiveCatIdx(i)}
                      onMouseLeave={() => setActiveCatIdx(null)}
                      onFocus={() => setActiveCatIdx(i)}
                      onBlur={() => setActiveCatIdx(null)}
                      className={`flex w-full items-center justify-between rounded-xl2 px-4 py-2.5 transition ${
                        isActive
                          ? "surface-muted scale-[1.01] shadow-soft ring-1 ring-brand-200/60 dark:ring-brand-800/40"
                          : "surface-muted"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <CategoryBadge category={c.category} size="md" />
                      </div>
                      <span className="tabular shrink-0 text-base font-bold text-ink-900 dark:text-ink-50">
                        {formatCurrency(c.total, { compact: true })}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </Card>

        <Card className="flex h-full flex-col">
          <SectionHeader
            eyebrow="Categories"
            title="Top spending categories"
            action={
              <Link to="/insights">
                <IconButton variant="dark" aria-label="See all insights">
                  <ArrowUpRight size={16} />
                </IconButton>
              </Link>
            }
          />
          <div className="mt-6 flex flex-1 flex-col gap-3">
            {derived.categories.length === 0 ? (
              <p className="text-sm text-ink-500 dark:text-ink-400">No category activity yet.</p>
            ) : (
              derived.categories.slice(0, 5).map((c) => {
                const share = total ? (c.total / total) * 100 : 0;
                return (
                  <div
                    key={c.category}
                    className="surface-muted flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <CategoryBadge category={c.category} size="md" />
                      <p className="text-sm text-ink-500 dark:text-ink-400">
                        {c.count} {c.count === 1 ? "transaction" : "transactions"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="tabular text-base font-black text-ink-900 dark:text-ink-50">
                        {formatCurrency(c.total)}
                      </p>
                      <p className="text-sm font-semibold text-ink-500 dark:text-ink-400">
                        {share.toFixed(1)}% of spend
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}

export default OverviewPage;
