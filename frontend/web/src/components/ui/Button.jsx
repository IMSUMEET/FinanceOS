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
      "bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-brand border border-brand-300/30 shadow-[inset_-3px_-3px_6px_rgba(0,0,0,0.15),inset_3px_3px_6px_rgba(255,255,255,0.25)] hover:brightness-105 active:scale-98",
    dark: "clay-btn-dark text-white hover:brightness-105 active:scale-98",
    ghost:
      "clay-btn-light text-ink-700 dark:text-ink-200 hover:text-brand-600 dark:hover:text-brand-300 active:scale-98",
    soft: "clay-btn-light text-ink-700 dark:text-ink-200 active:scale-98",
    danger:
      "bg-gradient-to-br from-rose-400 to-rose-600 text-white border border-rose-300/30 shadow-[inset_-3px_-3px_6px_rgba(0,0,0,0.15),inset_3px_3px_6px_rgba(255,255,255,0.25)] hover:brightness-105 active:scale-98",
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
