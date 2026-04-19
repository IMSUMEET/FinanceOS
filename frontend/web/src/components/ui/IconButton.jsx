function IconButton({
  variant = "soft",
  size = "md",
  className = "",
  children,
  ...rest
}) {
  const sizes = {
    sm: "h-9 w-9",
    md: "h-11 w-11",
    lg: "h-12 w-12",
  };
  const variants = {
    soft:
      "group relative border border-ink-200 bg-white text-ink-600 hover:bg-ink-100 hover:text-brand-600 active:scale-95 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-ink-700 dark:hover:text-brand-300",
    dark: "bg-ink-900 text-white hover:bg-ink-800 dark:bg-ink-950 dark:hover:bg-ink-900",
    brand: "bg-brand text-white shadow-brand hover:brightness-110",
  };

  return (
    <button
      type="button"
      className={`flex items-center justify-center rounded-full transition ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {variant === "soft" ? (
        <span className="absolute inset-0 rounded-full bg-brand-500/0 transition group-hover:bg-brand-500/10" />
      ) : null}
      <span className="relative z-10 flex items-center justify-center">{children}</span>
    </button>
  );
}

export default IconButton;
