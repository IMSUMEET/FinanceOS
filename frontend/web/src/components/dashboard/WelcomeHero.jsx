import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion as Motion } from "framer-motion";
import { useMemo } from "react";
import ClayWalletGraphic from "./ClayWalletGraphic";
import CountUp from "../effects/CountUp";
import { useTransactions } from "../../context/useTransactions";
import { monthlyTotals } from "../../utils/insights";
import { formatCurrency, formatMonth } from "../../utils/format";

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
        "relative overflow-hidden rounded-xl3 border border-white/10 bg-gradient-to-br from-[#121c2c] via-[#09101d] to-[#070b14] text-white shadow-dark",
        fillHeight ? "h-full" : "",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full bg-teal-500/10 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-brand-500/15 blur-[90px]" />

      <div className="relative grid h-full min-h-[22rem] gap-6 p-6 md:p-8 lg:grid-cols-[1.25fr_minmax(220px,1fr)] lg:items-center lg:gap-8 lg:p-9">
        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur">
            <Sparkles size={12} className="text-brand-300" />
            Personal finance, simplified
          </span>

          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight md:text-4xl lg:text-[2.35rem]">
            {hasData ? `${greeting()} — manage your money.` : "Take control of your finances."}
          </h1>
          <p className="mt-2 max-w-lg text-sm text-slate-300 md:text-base">
            {hasData
              ? "See spending across cards, spot trends, and make smarter decisions from your bank exports."
              : "Upload bank statements to track spending, categorize transactions, and understand where your money goes."}
          </p>

          {hasData && snapshot ? (
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {snapshot.label}
              </p>
              <p className="tabular mt-1 text-4xl font-black tracking-tight text-white md:text-5xl">
                <CountUp value={snapshot.amount} format={(n) => formatCurrency(n)} />
              </p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-300">
                {snapshot.context}
              </p>
            </div>
          ) : null}

          <div className="mt-7">
            <Link
              to={hasData ? "/transactions" : "/upload"}
              className="group inline-flex h-11 items-center gap-2 rounded-full border border-brand-300/30 bg-gradient-to-br from-brand-400 to-brand-600 px-5 text-sm font-bold text-white shadow-brand transition hover:brightness-105 active:scale-[0.98]"
            >
              {hasData ? "View transactions" : "Import statements"}
              <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <Motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="relative hidden h-full min-h-0 lg:flex lg:items-center lg:justify-center"
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
            <ClayWalletGraphic
              size={graphicSize}
              className="relative drop-shadow-[0_24px_38px_rgba(0,0,0,0.4)]"
            />
          </div>
        </Motion.div>
      </div>
    </Motion.section>
  );
}

export default WelcomeHero;
