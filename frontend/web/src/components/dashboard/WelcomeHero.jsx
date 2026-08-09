import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, RefreshCw, Check } from "lucide-react";
import { motion as Motion } from "framer-motion";
import { useMemo, useState } from "react";
import ClayWalletGraphic from "./ClayWalletGraphic";
import CountUp from "../effects/CountUp";
import { useTransactions } from "../../context/useTransactions";
import { monthlyTotals } from "../../utils/insights";
import { formatCurrency, formatMonth } from "../../utils/format";

function HeroAiRecategorizeButton() {
  const { runAiAnalysis } = useTransactions();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    if (loading || !runAiAnalysis) return;
    setLoading(true);
    try {
      await runAiAnalysis();
      navigate("/insights");
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
      className="group inline-flex h-11 items-center gap-2 rounded-full border border-purple-500/40 bg-purple-500/10 px-5 text-sm font-bold text-purple-700 shadow-sm transition hover:bg-purple-500/20 active:scale-[0.98] dark:border-purple-400/40 dark:bg-purple-500/20 dark:text-purple-200 dark:hover:bg-purple-500/30"
    >
      {loading ? (
        <RefreshCw size={16} className="animate-spin text-purple-600 dark:text-purple-300" />
      ) : (
        <Sparkles size={16} className="text-purple-600 dark:text-purple-300" />
      )}
      <span>{loading ? "Running AI Analysis..." : "Run AI Analysis"}</span>
    </button>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Hey night owl";
}

function buildHeroSnapshot(transactions) {
  const monthly = monthlyTotals(transactions);
  if (!monthly.length) return null;

  const latest = monthly[monthly.length - 1];
  const monthCount = monthly.length;
  const txnCount = transactions.filter((t) => t.category !== "Credit Card Payments").length;
  const monthLabel = formatMonth(latest.month);

  return {
    label: monthCount > 1 ? `Latest month · ${monthLabel}` : `${monthLabel} spending`,
    amount: latest.total,
    context:
      monthCount > 1
        ? `${txnCount.toLocaleString()} transactions across ${monthCount} months of your statements`
        : `${latest.count} transactions in your first imported month`,
  };
}

function WelcomeHero({ compactGraphic = false, fillHeight = false }) {
  const { transactions } = useTransactions();
  const hasData = transactions.length > 0;
  const snapshot = useMemo(() => buildHeroSnapshot(transactions), [transactions]);
  const graphicSize = compactGraphic ? 280 : 320;

  return (
    <Motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={[
        "relative overflow-hidden rounded-xl3 border border-brand-200/60 bg-gradient-to-br from-teal-50 via-white to-sky-50 text-ink-900 shadow-soft",
        "dark:border-white/10 dark:from-[#121c2c] dark:via-[#09101d] dark:to-[#070b14] dark:text-white dark:shadow-dark",
        fillHeight ? "h-full" : "",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full bg-teal-400/15 blur-[80px] dark:bg-teal-500/10" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-brand-400/10 blur-[90px] dark:bg-brand-500/15" />

      <div className="relative grid h-full min-h-[22rem] gap-6 p-6 md:p-8 lg:grid-cols-[1.25fr_minmax(220px,1fr)] lg:items-center lg:gap-8 lg:p-9">
        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-200/80 bg-white/75 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-700 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-white">
            <Sparkles size={12} className="text-brand-600 dark:text-brand-300" />
            Personal finance, simplified
          </span>

          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-ink-900 md:text-4xl lg:text-[2.35rem] dark:text-white">
            {hasData ? `${greeting()} — manage your money.` : "Take control of your finances."}
          </h1>
          <p className="mt-2 max-w-lg text-sm text-ink-600 md:text-base dark:text-slate-300">
            {hasData
              ? "See spending across cards, spot trends, and make smarter decisions from your bank exports."
              : "Upload bank statements to track spending, categorize transactions, and understand where your money goes."}
          </p>

          {hasData && snapshot ? (
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-slate-400">
                {snapshot.label}
              </p>
              <p className="tabular mt-1 text-4xl font-black tracking-tight text-ink-900 md:text-5xl dark:text-white">
                <CountUp value={snapshot.amount} format={(n) => formatCurrency(n)} />
              </p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-600 dark:text-slate-300">
                {snapshot.context}
              </p>
            </div>
          ) : null}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to={hasData ? "/transactions" : "/upload"}
              className="group inline-flex h-11 items-center gap-2 rounded-full border border-brand-300/30 bg-gradient-to-br from-brand-400 to-brand-600 px-5 text-sm font-bold text-white shadow-brand transition hover:brightness-105 active:scale-[0.98]"
            >
              {hasData ? "View transactions" : "Import statements"}
              <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
            </Link>

            {hasData && <HeroAiRecategorizeButton />}
          </div>
        </div>

        <Motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="relative hidden h-full min-h-0 lg:flex lg:items-center lg:justify-center"
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute h-64 w-64 rounded-full bg-brand-400/15 blur-3xl dark:bg-brand-500/10" />
            <ClayWalletGraphic
              size={graphicSize}
              className="relative drop-shadow-[0_20px_32px_rgba(15,23,42,0.12)] dark:drop-shadow-[0_24px_38px_rgba(0,0,0,0.4)]"
            />
          </div>
        </Motion.div>
      </div>
    </Motion.section>
  );
}

export default WelcomeHero;
