function Badge({ tone = "neutral", className = "", children }) {
  const tones = {
    neutral: "bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200",
    brand: "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200",
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
    warn: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
    danger: "bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200",
    dark: "bg-ink-900 text-white dark:bg-ink-100 dark:text-ink-900",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone] ?? tones.neutral} ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;
