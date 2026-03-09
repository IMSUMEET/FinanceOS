import type { ReactNode } from "react";
import { motion } from "framer-motion";

type GlassCardProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export default function GlassCard({
  title,
  subtitle,
  children,
  className = "",
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
      className={[
        "rounded-[28px] border border-theme bg-surface-strong p-6 shadow-soft",
        className,
      ].join(" ")}
    >
      {(title || subtitle) && (
        <div className="mb-5">
          {title && (
            <h3 className="text-xl font-black tracking-tight text-primary-theme">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-muted-theme">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </motion.div>
  );
}
