import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";

function CountUp({
  value,
  duration = 1.1,
  format = (n) => n.toLocaleString(),
  className = "",
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  // Keep latest format/duration in refs so changing prop identity (e.g. inline
  // arrow on every parent render) doesn't restart the animation.
  const formatRef = useRef(format);
  const durationRef = useRef(duration);
  useEffect(() => {
    formatRef.current = format;
    durationRef.current = duration;
  }, [format, duration]);

  const [display, setDisplay] = useState(() => format(0));
  // Track the value we've already animated to; if it doesn't change, skip.
  const animatedToRef = useRef(null);

  useEffect(() => {
    if (!inView) return undefined;
    const target = Number.isFinite(Number(value)) ? Number(value) : 0;
    if (animatedToRef.current === target) {
      // Same target — make sure the display reflects the latest formatter
      // (in case formatting options changed) without re-running the animation.
      setDisplay(formatRef.current(target));
      return undefined;
    }
    const from = animatedToRef.current ?? 0;
    const controls = animate(from, target, {
      duration: durationRef.current,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(formatRef.current(v)),
      onComplete: () => {
        animatedToRef.current = target;
      },
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

export default CountUp;
