import type { ReactNode } from "react";
import { motion } from "framer-motion";

type SectionCardProps = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function SectionCard({
  title,
  subtitle,
  action,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={[
        "rounded-[28px] border border-theme bg-surface-strong p-6 shadow-soft",
        className,
      ].join(" ")}
    >
      {(title || subtitle || action) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title ? (
              <h2 className="text-xl font-black tracking-tight text-primary-theme">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="mt-1 text-sm text-muted-theme">{subtitle}</p>
            ) : null}
          </div>

          {action ? <div>{action}</div> : null}
        </div>
      )}

      {children}
    </motion.section>
  );
}
