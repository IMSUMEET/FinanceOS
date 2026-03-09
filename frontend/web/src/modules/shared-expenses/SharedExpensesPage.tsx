import { motion } from "framer-motion";
import GlassCard from "../../components/GlassCard";

export default function SharedExpensesPage() {
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
          Shared Expenses 🍕
        </h1>
        <p className="mt-2 text-secondary-theme">
          Keep group spending fun, clear, and simple.
        </p>
      </motion.div>

      <GlassCard
        title="Coming soon"
        subtitle="This will become your better Splitwise"
      >
        <div className="bg-card-blue text-secondary-theme flex h-56 items-center justify-center rounded-[28px] border border-theme text-lg font-semibold">
          Beautiful shared expense flows live here ✨
        </div>
      </GlassCard>
    </div>
  );
}
