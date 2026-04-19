function Pill({ tone = "dark", className = "", children, ...rest }) {
  const tones = {
    dark: "bg-ink-900 text-white dark:bg-ink-100 dark:text-ink-900",
    brand: "bg-brand text-white shadow-brand",
    soft: "bg-white text-ink-700 border border-ink-200 dark:bg-ink-800 dark:text-ink-200 dark:border-ink-700",
    glass: "bg-white/70 text-ink-700 border border-white/70 backdrop-blur dark:bg-ink-800/70 dark:text-ink-200 dark:border-ink-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${tones[tone]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}

export default Pill;
