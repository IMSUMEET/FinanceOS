import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency, formatMonth } from "../../utils/format";
import { useTheme } from "../../hooks/useTheme";

function TooltipBox({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-white/70 bg-white/95 px-4 py-3 shadow-soft backdrop-blur dark:border-ink-700 dark:bg-ink-900/95">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
        {formatMonth(label)}
      </p>
      <p className="tabular mt-1 text-base font-black text-ink-900 dark:text-ink-50">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

function SpendTrendChart({ data, height = 240 }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gridStroke = isDark ? "#1e2a44" : "#e2e8f0";
  const tickFill = isDark ? "#64748b" : "#94a3b8";
  const dotFill = isDark ? "#0b1326" : "#fff";
  return (
    <div className="select-none" style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 6" stroke={gridStroke} vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            tick={{ fontSize: 12, fill: tickFill, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => formatCurrency(v, { compact: true })}
            tick={{ fontSize: 12, fill: tickFill, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<TooltipBox />} cursor={{ stroke: "#3b82f6", strokeWidth: 1, strokeDasharray: "3 3" }} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#3b82f6"
            strokeWidth={3}
            fill="url(#trendFill)"
            activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 3, fill: dotFill }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SpendTrendChart;
