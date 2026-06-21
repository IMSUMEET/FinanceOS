import { createElement, useId, useState } from "react";
import { Info } from "lucide-react";
import Card from "./Card";
import CountUp from "../effects/CountUp";

function KpiCard({
  title,
  value,
  numericValue,
  formatNumeric,
  change,
  changeTone = "up",
  icon,
  tint,
  tooltip,
}) {
  const tooltipId = useId();
  const [hovered, setHovered] = useState(false);
  const toneClass =
    changeTone === "down"
      ? "text-rose-500 dark:text-rose-400"
      : changeTone === "neutral"
        ? "text-ink-500 dark:text-ink-400"
        : "text-emerald-500 dark:text-emerald-400";

  const showTooltip = Boolean(tooltip && hovered);

  return (
    <div
      className={`relative h-full ${showTooltip ? "z-30" : "z-0"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Card
        padding="md"
        aria-describedby={showTooltip ? tooltipId : undefined}
        className={[
          "h-full transition-shadow duration-200",
          showTooltip ? "shadow-soft dark:shadow-softDark" : "",
          tooltip ? "cursor-help" : "",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-ink-500 dark:text-ink-400">{title}</p>
              {tooltip ? (
                <span
                  className={[
                    "inline-flex items-center gap-1 rounded-full bg-ink-100/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-500 transition-opacity duration-200 dark:bg-ink-800/80 dark:text-ink-400",
                    showTooltip ? "opacity-100" : "opacity-0",
                  ].join(" ")}
                >
                  <Info size={10} aria-hidden />
                  Details
                </span>
              ) : null}
            </div>
            <h3 className="tabular mt-3 text-3xl font-black tracking-tight text-ink-900 dark:text-ink-50">
              {numericValue != null && typeof formatNumeric === "function" ? (
                <CountUp value={numericValue} format={formatNumeric} />
              ) : (
                value
              )}
            </h3>
            {change ? <p className={`mt-2 text-sm font-semibold ${toneClass}`}>{change}</p> : null}
          </div>

          {icon ? (
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tint ?? "bg-brand"}`}
            >
              {createElement(icon, { size: 20, className: "text-white" })}
            </div>
          ) : null}
        </div>
      </Card>

      {tooltip ? (
        <div
          id={tooltipId}
          role="tooltip"
          aria-hidden={!showTooltip}
          className={[
            "pointer-events-none absolute left-0 right-0 top-[calc(100%+0.65rem)]",
            "transition-all duration-200 ease-out",
            showTooltip ? "scale-100 opacity-100" : "scale-[0.98] opacity-0",
          ].join(" ")}
        >
          <div className="relative rounded-xl2 border border-ink-200/80 bg-white/95 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur-md dark:border-ink-600/80 dark:bg-ink-900/95 dark:shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
            <div
              className="absolute -top-1.5 left-8 h-3 w-3 rotate-45 border-l border-t border-ink-200/80 bg-white/95 dark:border-ink-600/80 dark:bg-ink-900/95"
              aria-hidden
            />
            <p className="text-sm font-semibold leading-snug text-ink-900 dark:text-ink-50">
              {tooltip.meaning}
            </p>
            <div className="my-3 h-px bg-ink-200/80 dark:bg-ink-700" />
            <p className="text-xs leading-relaxed text-ink-600 dark:text-ink-300">
              <span className="font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                Calculation ·{" "}
              </span>
              {tooltip.calculation}
            </p>
          </div>
        </div>
      ) : null}

      {tooltip ? (
        <span className="sr-only">
          {tooltip.meaning} {tooltip.calculation}
        </span>
      ) : null}
    </div>
  );
}

export default KpiCard;
