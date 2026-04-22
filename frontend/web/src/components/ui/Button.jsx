import { createElement } from "react";

function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  className = "",
  children,
  ...rest
}) {
  const sizes = {
    sm: "h-9 px-3 text-sm rounded-full",
    md: "h-11 px-5 text-sm rounded-full",
    lg: "h-12 px-6 text-base rounded-full",
  };
  const variants = {
    primary:
      "bg-brand text-white shadow-brand hover:brightness-110 active:brightness-95",
    dark:
      "bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-900/95 dark:bg-ink-100 dark:text-ink-900 dark:hover:bg-white",
    ghost:
      "border border-ink-200 bg-white text-ink-700 hover:bg-ink-100 hover:text-brand-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-ink-700 dark:hover:text-brand-300",
    soft:
      "bg-white/70 border border-white/70 text-ink-700 backdrop-blur hover:bg-white dark:bg-ink-800/70 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800",
    danger:
      "bg-rose-500 text-white hover:bg-rose-600",
  };

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {icon ? createElement(icon, { size: 16 }) : null}
      {children}
      {iconRight ? createElement(iconRight, { size: 16 }) : null}
    </button>
  );
}

export default Button;
