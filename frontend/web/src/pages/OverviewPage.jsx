import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  Receipt,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Card from "../components/ui/Card";
import KpiCard from "../components/ui/KpiCard";
import Pill from "../components/ui/Pill";
import IconButton from "../components/ui/IconButton";
import Badge from "../components/ui/Badge";
import CategoryDot from "../components/ui/CategoryDot";
import SectionHeader from "../components/ui/SectionHeader";
import SpendTrendChart from "../components/charts/SpendTrendChart";
import CategoryDonut from "../components/charts/CategoryDonut";
import WelcomeHero from "../components/dashboard/WelcomeHero";
import Reveal from "../components/effects/Reveal";
import { StaggerGroup, StaggerItem } from "../components/effects/StaggerGroup";
import { usePageFilters } from "../context/usePageFilters";
import { useTransactions } from "../context/useTransactions";
import { ALL_MONTHS_SENTINEL } from "../context/pageFilters";
import useDocumentTitle from "../hooks/useDocumentTitle";
import {
  compareSelectedMonthToPrevious,
  dailyAverage,
  detectRecurring,
  previousMonthKey,
  topCategoryMoversForMonth,
  totalSpend,
} from "../utils/insights";
import {
  formatAmountSpend,
  formatCurrency,
  formatDate,
  formatMonth,
  formatPct,
} from "../utils/format";

function TopMerchantsList({ merchants }) {
  if (!merchants.length) {
    return (
      <p className="text-sm text-ink-500 dark:text-ink-400">No merchant activity in this period.</p>
    );
  }
  return (
    <div className="space-y-3">
      {merchants.slice(0, 5).map((m) => (
        <div
          key={m.merchant}
          className="flex items-center justify-between rounded-xl2 bg-[#f8fbff] px-4 py-3 dark:bg-ink-800/60"
        >
          <div className="flex items-center gap-3 min-w-0">
            <CategoryDot category={m.category} size={10} />
            <div className="min-w-0">
              <p className="truncate font-bold text-ink-900 dark:text-ink-50">{m.merchant}</p>
              <p className="text-xs text-ink-500 dark:text-ink-400">
                {m.count} {m.count === 1 ? "transaction" : "transactions"} · {m.category ?? "Other"}
              </p>
            </div>
          </div>
          <p className="tabular shrink-0 font-black text-ink-900 dark:text-ink-50">
            {formatCurrency(m.total)}
          </p>
        </div>
      ))}
    </div>
  );
}

function RecentTxStrip({ rows }) {
  if (!rows.length) {
    return <p className="text-sm text-ink-500 dark:text-ink-400">No transactions yet.</p>;
  }
  return (
    <div className="space-y-3">
      {rows.slice(0, 5).map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between rounded-xl2 bg-[#f8fbff] px-4 py-3 dark:bg-ink-800/60"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CategoryDot category={r.category} size={9} />
              <p className="truncate font-bold text-ink-900 dark:text-ink-50">
                {r.merchant_normalized}
              </p>
            </div>
            <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
              {formatDate(r.date)} · {r.category}
            </p>
          </div>
          <p className="tabular shrink-0 font-black text-ink-900 dark:text-ink-50">
            -{formatAmountSpend(r.amount)}
          </p>
        </div>
      ))}
    </div>
  );
}

function OverviewPage() {
  useDocumentTitle("Overview");
  const { transactions } = useTransactions();
  const { filtered, derived, filters } = usePageFilters("overview");
  const [activeCatIdx, setActiveCatIdx] = useState(null);

  const isAllMonths = filters.month === ALL_MONTHS_SENTINEL;
  const total = totalSpend(filtered);
  const mom = isAllMonths
    ? { deltaPct: null, deltaAbs: 0, current: null, previous: null }
    : compareSelectedMonthToPrevious(transactions, filters.month);
  const avgDaily = dailyAverage(filtered);
  const movers = isAllMonths ? [] : topCategoryMoversForMonth(transactions, filters.month);
  const recurring = detectRecurring(filtered);
  const topCategory = derived.categories[0];
  const annualizedRecurring = recurring.reduce((s, r) => s + r.annualized, 0);
  const recentTx = [...filtered].sort((a, b) => (b.date < a.date ? -1 : 1)).slice(0, 5);
  const priorMonthLabel = isAllMonths ? "" : formatMonth(previousMonthKey(filters.month));

  const thisWeek = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    const rows = filtered.filter((r) => {
      const d = new Date(r.date);
      return d >= start && d <= now;
    });
    const sum = rows.reduce((acc, r) => acc + Math.abs(r.amount), 0);
    return {
      count: rows.length,
      total: sum,
      avg: rows.length ? sum / rows.length : 0,
    };
  }, [filtered]);

  const momTone = mom.deltaPct == null ? "neutral" : mom.deltaPct < 0 ? "up" : "down";
  const momLabel = isAllMonths
    ? `Across ${derived.monthly.length || 0} months`
    : mom.deltaPct == null
      ? "No prior month to compare"
      : `${formatPct(mom.deltaPct)} vs ${priorMonthLabel}`;

  return (
    <section className="space-y-5 pt-2">
      <Reveal>
        <WelcomeHero />
      </Reveal>

      {/* KPI row */}
      <StaggerGroup className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StaggerItem>
          <KpiCard
            title="Total Spend"
            numericValue={total}
            formatNumeric={(n) => formatCurrency(n)}
            change={momLabel}
            changeTone={momTone}
            icon={Wallet}
            tint="bg-gradient-to-br from-blue-600 to-indigo-500"
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            title="Avg Daily"
            numericValue={avgDaily}
            formatNumeric={(n) => formatCurrency(n)}
            change={`Across ${derived.monthly.length || 0} months`}
            changeTone="neutral"
            icon={CreditCard}
            tint="bg-gradient-to-br from-emerald-500 to-teal-500"
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            title="Top Category"
            value={topCategory ? topCategory.category : "—"}
            change={topCategory ? formatCurrency(topCategory.total) : "—"}
            changeTone="neutral"
            icon={Receipt}
            tint="bg-gradient-to-br from-amber-400 to-orange-500"
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            title="Recurring / yr"
            numericValue={annualizedRecurring}
            formatNumeric={(n) => formatCurrency(n, { compact: true })}
            change={`${recurring.length} subscriptions`}
            changeTone="neutral"
            icon={Sparkles}
            tint="bg-gradient-to-br from-fuchsia-500 to-violet-500"
          />
        </StaggerItem>
      </StaggerGroup>

      <Reveal delay={0.05} className="grid gap-5 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-8">
          {/* Trend */}
          <Card>
            <SectionHeader
              eyebrow="Spend Trend"
              title="Monthly spend"
              action={<Pill>Last {derived.monthly.length} months</Pill>}
            />
            <div className="mt-6 rounded-xl2 bg-[#edf6ff] p-4 dark:bg-ink-800/60">
              <SpendTrendChart data={derived.monthly} height={260} />
            </div>
          </Card>

          {/* Movers / top categories */}
          <Card>
            <SectionHeader
              eyebrow={isAllMonths ? "All time" : "What changed"}
              title={
                isAllMonths ? "Top spending categories" : `Biggest movers vs ${priorMonthLabel}`
              }
              action={
                <Link to="/insights">
                  <IconButton variant="dark" aria-label="See all insights">
                    <ArrowUpRight size={16} />
                  </IconButton>
                </Link>
              }
            />
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {isAllMonths ? (
                derived.categories.length === 0 ? (
                  <p className="text-sm text-ink-500 dark:text-ink-400">
                    No category activity yet.
                  </p>
                ) : (
                  derived.categories.slice(0, 4).map((c) => {
                    const share = total ? (c.total / total) * 100 : 0;
                    return (
                      <div
                        key={c.category}
                        className="flex items-center justify-between rounded-xl2 bg-[#f8fbff] px-4 py-3 dark:bg-ink-800/60"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <CategoryDot category={c.category} size={10} />
                          <div className="min-w-0">
                            <p className="truncate font-bold text-ink-900 dark:text-ink-50">
                              {c.category}
                            </p>
                            <p className="text-xs text-ink-500 dark:text-ink-400">
                              {c.count} {c.count === 1 ? "transaction" : "transactions"}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="tabular font-black text-ink-900 dark:text-ink-50">
                            {formatCurrency(c.total)}
                          </p>
                          <p className="text-xs font-semibold text-ink-500 dark:text-ink-400">
                            {share.toFixed(1)}% of spend
                          </p>
                        </div>
                      </div>
                    );
                  })
                )
              ) : movers.length === 0 ? (
                <p className="text-sm text-ink-500 dark:text-ink-400">
                  No prior month data for {formatMonth(filters.month)}.
                </p>
              ) : (
                movers.slice(0, 4).map((m) => {
                  const up = m.deltaAbs >= 0;
                  return (
                    <div
                      key={m.category}
                      className="flex items-center justify-between rounded-xl2 bg-[#f8fbff] px-4 py-3 dark:bg-ink-800/60"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CategoryDot category={m.category} size={10} />
                        <div className="min-w-0">
                          <p className="truncate font-bold text-ink-900 dark:text-ink-50">
                            {m.category}
                          </p>
                          <p className="text-xs text-ink-500 dark:text-ink-400">
                            {formatCurrency(m.prev)} → {formatCurrency(m.current)}
                          </p>
                        </div>
                      </div>
                      <Badge tone={up ? "danger" : "success"}>
                        {up ? "+" : ""}
                        {formatPct(m.deltaPct)}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-5 xl:col-span-4">
          {/* Donut */}
          <Card>
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
            <div className="mt-6 flex items-center justify-center">
              <CategoryDonut
                data={derived.categories}
                total={total}
                activeIndex={activeCatIdx}
                onActiveChange={setActiveCatIdx}
              />
            </div>
            <div className="mt-6 grid gap-2">
              {derived.categories.slice(0, 5).map((c, i) => {
                const isActive = activeCatIdx === i;
                return (
                  <button
                    type="button"
                    key={c.category}
                    onMouseEnter={() => setActiveCatIdx(i)}
                    onMouseLeave={() => setActiveCatIdx(null)}
                    onFocus={() => setActiveCatIdx(i)}
                    onBlur={() => setActiveCatIdx(null)}
                    className={`flex items-center justify-between rounded-xl2 px-4 py-2.5 transition ${
                      isActive
                        ? "bg-brand-50 scale-[1.02] shadow-soft dark:bg-ink-800"
                        : "bg-[#f8fbff] dark:bg-ink-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CategoryDot category={c.category} size={10} />
                      <span className="truncate font-semibold text-ink-700 dark:text-ink-200">
                        {c.category}
                      </span>
                    </div>
                    <span className="tabular shrink-0 font-bold text-ink-900 dark:text-ink-50">
                      {formatCurrency(c.total, { compact: true })}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* This week tile */}
          <Card>
            <SectionHeader eyebrow="This Week" title="Last 7 days" />
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl2 bg-[#f8fbff] p-4 dark:bg-ink-800/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                  Count
                </p>
                <p className="tabular mt-1 text-xl font-black text-ink-900 dark:text-ink-50">
                  {thisWeek.count}
                </p>
              </div>
              <div className="rounded-xl2 bg-[#f8fbff] p-4 dark:bg-ink-800/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                  Total
                </p>
                <p className="tabular mt-1 text-xl font-black text-ink-900 dark:text-ink-50">
                  {formatCurrency(thisWeek.total, { compact: true })}
                </p>
              </div>
              <div className="rounded-xl2 bg-[#f8fbff] p-4 dark:bg-ink-800/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                  Avg
                </p>
                <p className="tabular mt-1 text-xl font-black text-ink-900 dark:text-ink-50">
                  {formatCurrency(thisWeek.avg, { compact: true })}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl2 bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">
              <CalendarDays size={16} />
              <span className="font-semibold">
                {thisWeek.count > 0
                  ? `Pace: ${formatCurrency(thisWeek.total / 7)} / day`
                  : "No spend recorded this week"}
              </span>
            </div>
          </Card>
        </div>
      </Reveal>

      <Reveal delay={0.05} className="grid gap-5 xl:grid-cols-2">
        {/* Top merchants */}
        <Card>
          <SectionHeader eyebrow="Top Merchants" title="Where you swipe most" />
          <div className="mt-6">
            <TopMerchantsList merchants={derived.merchants} />
          </div>
        </Card>

        {/* Recent activity */}
        <Card>
          <SectionHeader
            eyebrow="Recent Activity"
            title="Latest transactions"
            action={
              <Link to="/transactions">
                <IconButton variant="dark" aria-label="View all">
                  <ArrowUpRight size={16} />
                </IconButton>
              </Link>
            }
          />
          <div className="mt-6">
            <RecentTxStrip rows={recentTx} />
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.05}>
        {/* Spending highlights */}
        <Card variant="dark">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-ink-300">Highlights</p>
              <h3 className="mt-2 text-2xl font-black">At a glance</h3>
            </div>
            <TrendingUp className="text-emerald-400" />
          </div>
          <p className="mt-5 text-ink-300">
            {isAllMonths
              ? topCategory
                ? `${topCategory.category} is your largest category at ${formatCurrency(topCategory.total)} across all months. Pick a month above to see month-over-month changes.`
                : "Upload transactions to unlock spending insights."
              : movers.length > 0 && movers[0].deltaAbs > 0
                ? `${movers[0].category} spend rose ${formatPct(movers[0].deltaPct)} (${formatCurrency(
                    Math.abs(movers[0].deltaAbs),
                  )}) vs ${priorMonthLabel} — the biggest jump in that period.`
                : movers.length > 0
                  ? "Your category mix looks steady compared to the prior month."
                  : "Select a month with prior data to see how spending shifted."}
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl2 bg-white/10 px-4 py-4">
              <p className="text-sm text-ink-300">Worth a look</p>
              <p className="mt-1 font-semibold text-white">
                {recurring.length > 0
                  ? `You have ${recurring.length} recurring charge${recurring.length === 1 ? "" : "s"} (~${formatCurrency(annualizedRecurring, { compact: true })}/yr).`
                  : topCategory
                    ? `${topCategory.category} leads your spending at ${formatCurrency(topCategory.total, { compact: true })}.`
                    : "Import transactions to see where your money goes."}
              </p>
            </div>
            <Link to="/insights" className="block">
              <div className="flex h-full items-center justify-between rounded-xl2 bg-white/10 px-4 py-4 transition hover:bg-white/15">
                <div>
                  <p className="text-sm text-ink-300">Open insights</p>
                  <p className="mt-1 font-semibold text-white">
                    Explore movers, anomalies & nudges
                  </p>
                </div>
                <ArrowUpRight />
              </div>
            </Link>
          </div>
        </Card>
      </Reveal>
    </section>
  );
}

export default OverviewPage;
