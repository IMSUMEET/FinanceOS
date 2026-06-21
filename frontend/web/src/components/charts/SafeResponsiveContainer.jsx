import { useEffect, useRef, useState } from "react";
import { ResponsiveContainer } from "recharts";

/**
 * Defers Recharts until the wrapper has measurable size (avoids width/height -1 warnings).
 */
function SafeResponsiveContainer({ height, className = "", style, children }) {
  const ref = useRef(null);
  const [size, setSize] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const width = el.clientWidth;
      const measuredHeight = typeof height === "number" ? height : el.clientHeight;
      if (width > 0 && measuredHeight > 0) {
        setSize((prev) =>
          prev?.width === width && prev?.height === measuredHeight
            ? prev
            : { width, height: measuredHeight },
        );
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [height]);

  const wrapperStyle = {
    width: "100%",
    ...(typeof height === "number" ? { height } : null),
    ...style,
  };

  return (
    <div ref={ref} className={`min-h-0 min-w-0 ${className}`} style={wrapperStyle}>
      {size ? (
        <ResponsiveContainer width={size.width} height={size.height}>
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}

export default SafeResponsiveContainer;
