import { motion as Motion } from "framer-motion";

function Reveal({
  children,
  delay = 0,
  y = 16,
  duration = 0.45,
  className = "",
  once = true,
}) {
  return (
    <Motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </Motion.div>
  );
}

export default Reveal;
