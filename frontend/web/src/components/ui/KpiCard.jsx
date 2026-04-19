import { createElement } from "react";
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
}) {
  const toneClass =
    changeTone === "down"
      ? "text-rose-500 dark:text-rose-400"
      : changeTone === "neutral"
        ? "text-ink-500 dark:text-ink-400"
        : "text-emerald-500 dark:text-emerald-400";

  return (
    <Card padding="md" hover>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-500 dark:text-ink-400">{title}</p>
          <h3 className="tabular mt-3 text-3xl font-black text-ink-900 dark:text-ink-50">
            {numericValue != null && typeof formatNumeric === "function" ? (
              <CountUp value={numericValue} format={formatNumeric} />
            ) : (
              value
            )}
          </h3>
          {change ? (
            <p className={`mt-2 text-sm font-semibold ${toneClass}`}>{change}</p>
          ) : null}
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
  );
}

export default KpiCard;
