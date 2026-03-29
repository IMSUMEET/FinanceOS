import type { ReactNode } from "react";

type BadgeTone = "default" | "accent" | "success" | "warning";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  default: "bg-surface-muted text-secondary-theme border border-theme",
  accent: "bg-accent-soft text-accent border border-transparent",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  warning: "bg-amber-50 text-amber-700 border border-amber-100",
};

export default function Badge({ children, tone = "default" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold",
        toneClasses[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}
