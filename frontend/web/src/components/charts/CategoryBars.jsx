import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { categoryColor } from "../../utils/categories";
import { formatCurrency } from "../../utils/format";
import { useTheme } from "../../hooks/useTheme";

function TooltipBox({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-2xl border border-white/70 bg-white/95 px-4 py-2 shadow-soft backdrop-blur dark:border-ink-700 dark:bg-ink-900/95">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">{d.category}</p>
      <p className="tabular mt-1 text-sm font-black text-ink-900 dark:text-ink-50">{formatCurrency(d.total)}</p>
    </div>
  );
}

function CategoryBars({ data, height = 260 }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tickFill = isDark ? "#cbd5e1" : "#475569";
  return (
    <div className="select-none" style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart layout="vertical" data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="category"
            tick={{ fontSize: 12, fill: tickFill, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            width={104}
          />
          <Tooltip content={<TooltipBox />} cursor={{ fill: isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.06)" }} />
          <Bar dataKey="total" radius={[10, 10, 10, 10]} barSize={16}>
            {data.map((d) => (
              <Cell key={d.category} fill={categoryColor(d.category)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CategoryBars;
