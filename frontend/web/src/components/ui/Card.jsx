import { motion as Motion } from "framer-motion";

function Card({
  variant = "glass",
  padding = "md",
  hover = false,
  className = "",
  children,
  ...rest
}) {
  const base = "border transition-shadow";
  const variants = {
    glass:
      "rounded-xl3 border-white/60 bg-white/75 shadow-soft backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/70 dark:shadow-softDark",
    solid:
      "rounded-xl3 border-ink-200/70 bg-white shadow-soft dark:border-ink-800 dark:bg-ink-900 dark:shadow-softDark",
    inset:
      "rounded-xl2 border-transparent bg-[#f6f9ff] dark:bg-ink-800/50",
    dark:
      "rounded-xl3 border-white/10 bg-insight text-white shadow-dark dark:border-ink-800",
    bare: "rounded-xl2 border-transparent bg-transparent",
  };
  const padders = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-7",
  };

  const cls = `${base} ${variants[variant] ?? variants.glass} ${padders[padding] ?? padders.md} ${className}`;

  if (hover) {
    return (
      <Motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className={cls}
        {...rest}
      >
        {children}
      </Motion.div>
    );
  }

  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}

export default Card;
