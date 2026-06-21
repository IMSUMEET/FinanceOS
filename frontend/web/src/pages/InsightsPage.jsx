import { createElement } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  Repeat,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import NoDataYet from "../components/common/NoDataYet";
import MonthFilterSelect from "../components/filters/MonthFilterSelect";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import CategoryBadge from "../components/ui/CategoryBadge";
import SectionHeader from "../components/ui/SectionHeader";
import { usePageFilters } from "../context/usePageFilters";
import { useTransactions } from "../context/useTransactions";
import { ALL_MONTHS_SENTINEL } from "../context/pageFilters";
import useDocumentTitle from "../hooks/useDocumentTitle";
import {
  compareSelectedMonthToPrevious,
  detectRecurring,
  previousMonthKey,
  topAnomalies,
  topCategoryMoversForMonth,
  weekdayVsWeekend,
} from "../utils/insights";
import {
  formatAmountSpend,
  formatCurrency,
  formatDate,
  formatMonth,
  formatPct,
} from "../utils/format";

function NarrativeCard({ icon, eyebrow, title, body, tone = "neutral", children }) {
  const tones = {
    neutral: "from-blue-600 to-indigo-500",
    warn: "from-amber-400 to-orange-500",
    danger: "from-rose-500 to-red-600",
    success: "from-emerald-500 to-teal-500",
  };
  return (
    <Card className="h-full">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-white bg-gradient-to-br ${tones[tone]}`}
          >
            {createElement(icon, { size: 18 })}
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">
              {eyebrow}
            </p>
            <h3 className="mt-0.5 text-lg font-black text-ink-900 dark:text-ink-50">{title}</h3>
          </div>
        </div>
      </div>
      {body ? <p className="mt-4 text-sm text-ink-600 dark:text-ink-300">{body}</p> : null}
      {children}
    </Card>
  );
}

function InsightsPage() {
  useDocumentTitle("Insights");
  const { transactions } = useTransactions();
  const { filtered, filters } = usePageFilters("insights");

  if (transactions.length === 0) {
    return (
      <section className="space-y-5 pt-2">
        <NoDataYet
          title="No insights yet"
          description="Import bank statements to unlock spending trends, recurring charges, and anomaly detection."
        />
      </section>
    );
  }

  const isAllMonths = filters.month === ALL_MONTHS_SENTINEL;
  const mom = isAllMonths
    ? { deltaPct: null, deltaAbs: 0, current: null, previous: null }
    : compareSelectedMonthToPrevious(transactions, filters.month);
  const movers = isAllMonths ? [] : topCategoryMoversForMonth(transactions, filters.month);
  const recurring = detectRecurring(filtered);
  const anomalies = topAnomalies(filtered, 5);
  const week = weekdayVsWeekend(filtered);
  const priorMonthLabel = isAllMonths ? "" : formatMonth(previousMonthKey(filters.month));

  const annualizedRecurring = recurring.reduce((s, r) => s + r.annualized, 0);
  const momCopy = isAllMonths
    ? "Use the month filter above to compare spending vs the prior month."
    : mom.deltaPct == null
      ? `No data for the month before ${formatMonth(filters.month)}.`
      : `You spent ${formatCurrency(Math.abs(mom.deltaAbs))} ${
          mom.deltaAbs >= 0 ? "more" : "less"
        } in ${formatMonth(filters.month)} than ${priorMonthLabel} (${formatPct(mom.deltaPct)}).`;

  return (
    <section className="space-y-5 pt-2">
      <div className="flex justify-end">
        <MonthFilterSelect pageKey="insights" />
      </div>
      <Card variant="dark">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-ink-300">Spending summary</p>
            <h2 className="mt-2 text-2xl font-black md:text-3xl">
              {isAllMonths
                ? "All months in view"
                : mom.deltaPct == null
                  ? "Build a baseline"
                  : mom.deltaAbs >= 0
                    ? `Spend up ${formatPct(mom.deltaPct)} in ${formatMonth(filters.month)}`
                    : `Spend down ${formatPct(mom.deltaPct)} in ${formatMonth(filters.month)}`}
            </h2>
            <p className="mt-2 text-ink-300 max-w-2xl">{momCopy}</p>
          </div>
          {mom.deltaAbs >= 0 ? (
            <TrendingUp className="text-rose-300" size={32} />
          ) : (
            <TrendingDown className="text-emerald-300" size={32} />
          )}
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <NarrativeCard
          icon={Activity}
          eyebrow="Movers"
          title={isAllMonths ? "Month-over-month" : "Biggest swings"}
          tone={movers[0]?.deltaAbs > 0 ? "danger" : "success"}
          body={
            isAllMonths
              ? "Pick a month above to see which categories moved most vs the prior month."
              : `Categories that moved most in ${formatMonth(filters.month)} vs ${priorMonthLabel}.`
          }
        >
          <div className="mt-4 space-y-3">
            {movers.length === 0 ? (
              <p className="text-sm text-ink-500 dark:text-ink-400">No comparison available yet.</p>
            ) : (
              movers.slice(0, 4).map((m) => (
                <div
                  key={m.category}
                  className="surface-muted flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryBadge category={m.category} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-bold text-ink-900 dark:text-ink-50">
                        {m.category}
                      </p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">
                        {formatCurrency(m.prev)} → {formatCurrency(m.current)}
                      </p>
                    </div>
                  </div>
                  <Badge tone={m.deltaAbs >= 0 ? "danger" : "success"}>
                    {formatPct(m.deltaPct)}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </NarrativeCard>

        <NarrativeCard
          icon={Repeat}
          eyebrow="Subscriptions"
          title="Recurring charges"
          tone="warn"
          body={`We detected ${recurring.length} recurring merchants — ${formatCurrency(
            annualizedRecurring,
            { compact: true },
          )} annualized.`}
        >
          <div className="mt-4 space-y-3">
            {recurring.length === 0 ? (
              <p className="text-sm text-ink-500 dark:text-ink-400">
                Add a few months of data to surface subscriptions.
              </p>
            ) : (
              recurring.slice(0, 5).map((r) => (
                <div
                  key={r.merchant}
                  className="surface-muted flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryBadge category={r.category} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-bold text-ink-900 dark:text-ink-50">
                        {r.merchant}
                      </p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">
                        ~{formatCurrency(r.avg)} / month · {r.cadence} months seen
                      </p>
                    </div>
                  </div>
                  <Badge tone="brand">{formatCurrency(r.annualized, { compact: true })}/yr</Badge>
                </div>
              ))
            )}
          </div>
        </NarrativeCard>

        <NarrativeCard
          icon={AlertTriangle}
          eyebrow="Anomalies"
          title="Unusually large charges"
          tone="danger"
          body="Single transactions that ran 2× or more above the merchant's normal amount."
        >
          <div className="mt-4 space-y-3">
            {anomalies.length === 0 ? (
              <p className="text-sm text-ink-500 dark:text-ink-400">
                Nothing unusual stands out. Nice.
              </p>
            ) : (
              anomalies.map((a) => (
                <div
                  key={a.id}
                  className="surface-muted flex items-center justify-between px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink-900 dark:text-ink-50">
                      {a.merchant_normalized}
                    </p>
                    <p className="text-xs text-ink-500 dark:text-ink-400">
                      {formatDate(a.date)} · usual ~{formatCurrency(a.median)}
                    </p>
                  </div>
                  <p className="tabular shrink-0 font-black text-rose-600 dark:text-rose-400">
                    -{formatAmountSpend(a.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </NarrativeCard>

        <NarrativeCard
          icon={CalendarClock}
          eyebrow="When you spend"
          title="Weekday vs weekend"
          body={`Weekends are ${week.weekendPct.toFixed(
            0,
          )}% of your spend — adjust the lens via filters above.`}
        >
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="surface-muted p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                Weekday
              </p>
              <p className="tabular mt-1 text-2xl font-black text-ink-900 dark:text-ink-50">
                {formatCurrency(week.weekday, { compact: true })}
              </p>
              <p className="text-xs font-semibold text-ink-500 dark:text-ink-400">
                {week.weekdayPct.toFixed(0)}%
              </p>
            </div>
            <div className="surface-muted p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                Weekend
              </p>
              <p className="tabular mt-1 text-2xl font-black text-ink-900 dark:text-ink-50">
                {formatCurrency(week.weekend, { compact: true })}
              </p>
              <p className="text-xs font-semibold text-ink-500 dark:text-ink-400">
                {week.weekendPct.toFixed(0)}%
              </p>
            </div>
          </div>
        </NarrativeCard>

        <NarrativeCard
          icon={TrendingUp}
          eyebrow="Quick nudge"
          title="One change, big lift"
          tone="success"
          body={
            recurring[0]
              ? `Cancelling ${recurring[0].merchant} alone would save ${formatCurrency(
                  recurring[0].annualized,
                )} per year.`
              : "Once we see a few recurring charges, we'll show specific cancellation savings."
          }
        />
      </div>
    </section>
  );
}

export default InsightsPage;
