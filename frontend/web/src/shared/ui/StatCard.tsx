import { motion } from "framer-motion";
import type { ReactNode } from "react";

type StatCardTone = "accent" | "blue" | "teal" | "amber" | "neutral";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: StatCardTone;
};

const toneClasses: Record<StatCardTone, string> = {
  accent: "bg-accent-soft",
  blue: "bg-blue-soft",
  teal: "bg-teal-soft",
  amber: "bg-amber-soft",
  neutral: "bg-surface-strong",
};

export default function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={[
        "rounded-[28px] border border-theme p-6 shadow-soft",
        toneClasses[tone],
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-secondary-theme">{label}</p>
          <p className="mt-3 text-4xl font-black tracking-tight text-primary-theme">
            {value}
          </p>
          {hint ? (
            <p className="mt-2 text-sm text-secondary-theme">{hint}</p>
          ) : null}
        </div>

        {icon ? <div className="text-3xl">{icon}</div> : null}
      </div>
    </motion.div>
  );
}
