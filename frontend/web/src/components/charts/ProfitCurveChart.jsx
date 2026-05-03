import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "../../utils/format";
import { useTheme } from "../../hooks/useTheme";

function TooltipBox({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-2xl border border-white/70 bg-white/95 px-4 py-3 shadow-soft backdrop-blur dark:border-ink-700 dark:bg-ink-900/95">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">Sale price</p>
      <p className="tabular mt-1 text-base font-black text-ink-900 dark:text-ink-50">{formatCurrency(d.salePrice)}</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">True profit</p>
      <p className="tabular mt-1 text-base font-black text-brand-700 dark:text-brand-300">
        {formatCurrency(d.profit, { signed: true })}
      </p>
    </div>
  );
}

function MarkerLegend({ label, value, tone }) {
  const border =
    tone === "brand"
      ? "border-brand-200/80 dark:border-brand-800/60"
      : tone === "accent"
        ? "border-accent-500/40 dark:border-accent-600/40"
        : "border-ink-200/80 dark:border-ink-600/60";
  return (
    <div className={`rounded-xl2 border bg-white/70 px-3 py-2 dark:bg-ink-900/50 ${border}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">{label}</p>
      <p className="tabular text-sm font-black text-ink-900 dark:text-ink-50">{value}</p>
    </div>
  );
}

/**
 * @param {object} props
 * @param {{ salePrice: number; profit: number }[]} props.data
 * @param {{ expected?: number|null; breakEven?: number|null; target?: number|null }} props.markers
 * @param {number} [props.height]
 */
function ProfitCurveChart({ data, markers = {}, height = 260 }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gridStroke = isDark ? "#1e2a44" : "#e2e8f0";
  const tickFill = isDark ? "#94a3b8" : "#64748b";
  const strokeExpected = "#2563eb";
  const strokeBreak = "#64748b";
  const strokeTarget = "#8b5cf6";

  if (!data?.length) {
    return <p className="text-sm text-ink-500 dark:text-ink-400">Add valid inputs to see the profit curve.</p>;
  }

  const { expected, breakEven, target } = markers;

  return (
    <div className="space-y-4">
      <div className="select-none" style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 12, right: 12, left: 4, bottom: 8 }}>
            <CartesianGrid strokeDasharray="4 6" stroke={gridStroke} vertical={false} />
            <XAxis
              dataKey="salePrice"
              tickFormatter={(v) => formatCurrency(v, { compact: true })}
              tick={{ fontSize: 11, fill: tickFill, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatCurrency(v, { compact: true })}
              tick={{ fontSize: 11, fill: tickFill, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<TooltipBox />} cursor={{ stroke: "#3b82f6", strokeWidth: 1, strokeDasharray: "3 3" }} />
            {breakEven != null && breakEven > 0 ? (
              <ReferenceLine x={breakEven} stroke={strokeBreak} strokeDasharray="4 4" strokeWidth={1.5} />
            ) : null}
            {expected != null && expected > 0 ? (
              <ReferenceLine x={expected} stroke={strokeExpected} strokeWidth={2} />
            ) : null}
            {target != null && target > 0 ? (
              <ReferenceLine x={target} stroke={strokeTarget} strokeDasharray="5 5" strokeWidth={1.5} />
            ) : null}
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, stroke: "#3b82f6", strokeWidth: 2, fill: isDark ? "#0b1326" : "#fff" }}
              isAnimationActive
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {expected != null && expected > 0 ? (
          <MarkerLegend label="Expected sale" value={formatCurrency(expected)} tone="brand" />
        ) : null}
        {breakEven != null && breakEven > 0 ? (
          <MarkerLegend label="Break-even" value={formatCurrency(breakEven)} tone="neutral" />
        ) : null}
        {target != null && target > 0 ? (
          <MarkerLegend label="Target-profit price" value={formatCurrency(target)} tone="accent" />
        ) : null}
      </div>
    </div>
  );
}

export default ProfitCurveChart;
