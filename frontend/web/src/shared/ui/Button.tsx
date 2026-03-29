import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white hover:bg-[var(--color-accent-hover)] shadow-soft",
  secondary:
    "bg-surface-strong text-primary-theme border border-theme hover:bg-surface",
  ghost:
    "bg-transparent text-secondary-theme hover:bg-surface-muted border border-transparent",
};

export default function Button({
  children,
  variant = "primary",
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {leftIcon ? <span className="text-base">{leftIcon}</span> : null}
      <span>{children}</span>
      {rightIcon ? <span className="text-base">{rightIcon}</span> : null}
    </button>
  );
}
