import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Upload } from "lucide-react";
import { motion as Motion } from "framer-motion";
import HeroCharacter from "./HeroCharacter";
import CountUp from "../effects/CountUp";
import { useTransactions } from "../../context/useTransactions";
import { useProfile } from "../../hooks/useProfile";
import { compareMonthOverMonth, totalSpend } from "../../utils/insights";
import { classifyPersonality } from "../../utils/personality";
import { formatCurrency, formatPct } from "../../utils/format";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Hey night owl";
}

function WelcomeHero() {
  const { filtered, transactions } = useTransactions();
  const { profile, hasProfile } = useProfile();
  const total = totalSpend(filtered);
  const mom = compareMonthOverMonth(transactions);
  const personality = classifyPersonality(transactions);

  const momLabel =
    mom.deltaPct == null
      ? "First period of data"
      : `${formatPct(mom.deltaPct)} vs last month`;
  const momTone =
    mom.deltaPct == null
      ? "text-white/80"
      : mom.deltaPct < 0
        ? "text-emerald-200"
        : "text-amber-200";

  return (
    <section className="relative overflow-hidden rounded-xl3 bg-brand text-white shadow-brand">
      {/* Decorative blurred blobs */}
      <div className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-1/3 h-72 w-72 rounded-full bg-violet-300/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="relative grid gap-6 p-6 md:p-8 lg:grid-cols-[1.2fr_1fr] lg:gap-4 lg:p-10">
        {/* Left: copy + CTAs */}
        <Motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col justify-center"
        >
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
            <Sparkles size={12} /> Your spend snapshot
          </span>

          <h1 className="mt-4 text-3xl font-black leading-tight md:text-4xl lg:text-5xl">
            {greeting()}, {hasProfile ? profile.name : "there"}.
          </h1>
          <p className="mt-2 max-w-md text-sm text-white/80 md:text-base">
            Here's how your money moved this period — broken down, demystified, and ready to act on.
          </p>

          <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Filtered total spend
              </p>
              <p className="tabular mt-1 text-4xl font-black md:text-5xl">
                <CountUp value={total} format={(n) => formatCurrency(n)} />
              </p>
              <p className={`mt-1 text-sm font-semibold ${momTone}`}>{momLabel}</p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold backdrop-blur">
              <span aria-hidden>{personality.emoji}</span>
            {hasProfile ? personality.label : "Guest mode"}
            </span>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/transactions"
              className="group inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-brand-700 shadow-soft transition hover:bg-ink-50"
            >
              View transactions
              <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/upload"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              <Upload size={16} />
              Import CSV
            </Link>
          </div>
        </Motion.div>

        {/* Right: floating character */}
        <Motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="relative flex items-center justify-center"
        >
          <div className="absolute h-64 w-64 rounded-full bg-white/15 blur-2xl md:h-80 md:w-80" />
          <HeroCharacter
            variant={profile.avatarVariant}
            size={300}
            className="relative drop-shadow-[0_18px_28px_rgba(15,23,42,0.25)]"
          />
        </Motion.div>
      </div>
    </section>
  );
}

export default WelcomeHero;
