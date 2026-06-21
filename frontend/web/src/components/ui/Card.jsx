import { motion as Motion } from "framer-motion";

function Card({
  variant = "glass",
  padding = "md",
  hover = false,
  className = "",
  children,
  ...rest
}) {
  const base = "transition-all duration-300";
  const variants = {
    glass: "rounded-xl3 clay-card-light",
    solid: "rounded-xl3 clay-card-light",
    inset: "rounded-xl2 clay-input-light",
    dark: "rounded-xl3 border-white/10 bg-insight text-white shadow-dark dark:border-ink-700",
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
