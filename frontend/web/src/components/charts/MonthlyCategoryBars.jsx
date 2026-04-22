import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency, formatMonth } from "../../utils/format";
import { useTheme } from "../../hooks/useTheme";

function TooltipBox({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-white/70 bg-white/95 px-4 py-2 shadow-soft backdrop-blur dark:border-ink-700 dark:bg-ink-900/95">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">{formatMonth(label)}</p>
      <p className="tabular mt-1 text-sm font-black text-ink-900 dark:text-ink-50">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

function MonthlyCategoryBars({ data, color = "#3b82f6", height = 220 }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gridStroke = isDark ? "#1e2a44" : "#e2e8f0";
  const tickFill = isDark ? "#64748b" : "#94a3b8";
  return (
    <div className="select-none" style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
          <Tooltip content={<TooltipBox />} cursor={{ fill: isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.06)" }} />
          <Bar dataKey="total" fill={color} radius={[10, 10, 0, 0]} barSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MonthlyCategoryBars;
