import { motion } from "framer-motion";
import GlassCard from "../../../shared/ui/GlassCard";

const recentActivity = [
  {
    title: "Pizza party",
    amount: "$48.20",
    meta: "Split with friends",
    emoji: "🍕",
  },
  { title: "Netflix", amount: "$15.49", meta: "Renews soon", emoji: "🎬" },
  {
    title: "Loan payment",
    amount: "$2,000",
    meta: "Progress unlocked",
    emoji: "🎯",
  },
  { title: "Coffee run", amount: "$8.70", meta: "Tiny happiness", emoji: "☕" },
];

const statCards = [
  {
    title: "You are owed",
    value: "$482",
    note: "Nice. Go collect it 😌",
    tone: "bg-accent-soft",
    emoji: "🫶",
  },
  {
    title: "Monthly spending",
    value: "$1,284",
    note: "Looking very healthy",
    tone: "bg-blue-soft",
    emoji: "🌈",
  },
  {
    title: "Subscriptions",
    value: "$89",
    note: "6 active right now",
    tone: "bg-teal-soft",
    emoji: "🎉",
  },
  {
    title: "Loan progress",
    value: "31%",
    note: "Boss level in progress",
    tone: "bg-amber-soft",
    emoji: "🏆",
  },
];

const bars = [42, 68, 54, 90, 72, 110, 84, 120];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="hero-sheen relative overflow-hidden rounded-[36px] border border-theme p-8 shadow-elevated"
      >
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-accent">
            Your fun money HQ
          </p>

          <h1 className="mt-4 text-5xl font-black tracking-tight text-primary-theme leading-[1.05]">
            Money management
            <br />
            that feels calm and exciting.
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-secondary-theme">
            Track shared expenses, subscriptions, loans, and insights in one
            soothing workspace that feels premium instead of stressful.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button className="rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--color-accent-hover)]">
              Add Expense ✨
            </button>

            <button className="rounded-2xl border border-theme bg-surface-strong px-5 py-3 text-sm font-bold text-primary-theme transition hover:bg-surface">
              Explore Insights 🪄
            </button>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: index * 0.04 }}
            className={`${card.tone} rounded-[28px] border border-theme p-6 shadow-soft`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-secondary-theme">
                  {card.title}
                </p>
                <p className="mt-3 text-4xl font-black tracking-tight text-primary-theme">
                  {card.value}
                </p>
                <p className="mt-2 text-sm text-secondary-theme">{card.note}</p>
              </div>
              <div className="text-3xl">{card.emoji}</div>
            </div>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <GlassCard title="Spending vibe" subtitle="A softer monthly view">
          <div className="flex h-72 items-end gap-4 pt-4">
            {bars.map((value, index) => (
              <div
                key={months[index]}
                className="flex flex-1 flex-col items-center justify-end gap-3"
              >
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: value * 1.6 }}
                  transition={{ duration: 0.55, delay: index * 0.05 }}
                  className="bar-fill w-full rounded-t-[20px] shadow-soft"
                />
                <span className="text-xs font-semibold text-muted-theme">
                  {months[index]}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="Recent fun" subtitle="Your latest activity">
          <div className="space-y-4">
            {recentActivity.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.28, delay: index * 0.04 }}
                className="flex items-center justify-between rounded-[22px] border border-theme bg-surface p-4 shadow-soft"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted text-2xl">
                    {item.emoji}
                  </div>
                  <div>
                    <p className="font-bold text-primary-theme">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-theme">{item.meta}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-primary-theme">
                  {item.amount}
                </p>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
