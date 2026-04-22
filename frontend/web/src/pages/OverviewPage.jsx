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
import { useTransactions } from "../context/useTransactions";
import useDocumentTitle from "../hooks/useDocumentTitle";
import {
  compareMonthOverMonth,
  dailyAverage,
  detectRecurring,
  topCategoryMovers,
  totalSpend,
} from "../utils/insights";
import { formatAmountSpend, formatCurrency, formatDate, formatPct } from "../utils/format";

function TopMerchantsList({ merchants }) {
  if (!merchants.length) {
    return <p className="text-sm text-ink-500 dark:text-ink-400">No merchant activity in this period.</p>;
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
          <p className="tabular shrink-0 font-black text-ink-900 dark:text-ink-50">{formatCurrency(m.total)}</p>
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
              <p className="truncate font-bold text-ink-900 dark:text-ink-50">{r.merchant_normalized}</p>
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
  const { filtered, derived } = useTransactions();
  const [activeCatIdx, setActiveCatIdx] = useState(null);

  const total = totalSpend(filtered);
  const mom = compareMonthOverMonth(filtered);
  const avgDaily = dailyAverage(filtered);
  const movers = topCategoryMovers(filtered);
  const recurring = detectRecurring(filtered);
  const topCategory = derived.categories[0];
  const annualizedRecurring = recurring.reduce((s, r) => s + r.annualized, 0);
  const recentTx = [...filtered]
    .sort((a, b) => (b.date < a.date ? -1 : 1))
    .slice(0, 5);

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
  const momLabel =
    mom.deltaPct == null
      ? "First period"
      : `${formatPct(mom.deltaPct)} vs last month`;

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

          {/* Movers */}
          <Card>
            <SectionHeader
              eyebrow="What changed"
              title="Biggest category movers vs last month"
              action={
                <Link to="/insights">
                  <IconButton variant="dark" aria-label="See all insights">
                    <ArrowUpRight size={16} />
                  </IconButton>
                </Link>
              }
            />
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {movers.length === 0 ? (
                <p className="text-sm text-ink-500 dark:text-ink-400">Need at least 2 months of data to compare.</p>
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
                          <p className="truncate font-bold text-ink-900 dark:text-ink-50">{m.category}</p>
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
        {/* Insight engine */}
        <Card variant="dark">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-ink-300">Insight Engine</p>
              <h3 className="mt-2 text-2xl font-black">Smart observation</h3>
            </div>
            <TrendingUp className="text-emerald-400" />
          </div>
          <p className="mt-5 text-ink-300">
            {movers.length > 0 && movers[0].deltaAbs > 0
              ? `${movers[0].category} spend rose ${formatPct(movers[0].deltaPct)} (${formatCurrency(
                  Math.abs(movers[0].deltaAbs),
                )}) compared to last month — the biggest jump in your portfolio.`
              : "Your spend looks steady this month. Use the Insights tab for deeper breakdowns."}
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl2 bg-white/10 px-4 py-4">
              <p className="text-sm text-ink-300">Suggested action</p>
              <p className="mt-1 font-semibold text-white">
                Cap dining spend for the next 2 weeks and review recurring charges.
              </p>
            </div>
            <Link to="/insights" className="block">
              <div className="flex h-full items-center justify-between rounded-xl2 bg-white/10 px-4 py-4 transition hover:bg-white/15">
                <div>
                  <p className="text-sm text-ink-300">Open insights</p>
                  <p className="mt-1 font-semibold text-white">Explore movers, anomalies & nudges</p>
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
