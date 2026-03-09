import { motion } from "framer-motion";
import GlassCard from "../../components/GlassCard";

export default function LoansPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-muted-theme">
          Module
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-primary-theme">
          Loans 🎯
        </h1>
        <p className="mt-2 text-secondary-theme">
          Make payoff progress feel visible and motivating.
        </p>
      </motion.div>

      <GlassCard
        title="Coming soon"
        subtitle="Principal, interest, and payoff progress"
      >
        <div className="bg-card-amber text-secondary-theme flex h-56 items-center justify-center rounded-[28px] border border-theme text-lg font-semibold">
          Loan progress HQ goes here ✨
        </div>
      </GlassCard>
    </div>
  );
}
