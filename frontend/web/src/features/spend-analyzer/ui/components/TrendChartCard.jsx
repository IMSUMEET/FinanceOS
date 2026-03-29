import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { CHART_MUTED } from "../constants/chartTheme.js";
import { formatMonthLabel } from "../utils/format.js";

export default function TrendChartCard({ title, monthlyData, onBarClick }) {
  const totals = (monthlyData ?? []).map((d) => Math.abs(Number(d.total) || 0));
  const mean = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
  const maxVal = totals.length ? Math.max(...totals) : 0;
  const spikeIdx = totals.length ? totals.indexOf(maxVal) : -1;

  const data = (monthlyData ?? []).map((d, i) => ({
    ...d,
    displayTotal: Math.abs(Number(d.total) || 0),
    isSpike: i === spikeIdx && maxVal > mean * 1.15 && mean > 0,
  }));

  return (
    <div className="analysisCard analysisCardPad trendChartCard">
      <div className="analysisCardHeader">
        <h3 className="analysisCardTitle">{title}</h3>
        {onBarClick && <div className="chartHint">Click a bar to explore</div>}
      </div>
      <p className="analysisCardSub">Higher bars are easy to scan; the strongest month is subtly highlighted.</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart className="trendChart" data={data} margin={{ top: 12, right: 8, left: 4, bottom: 8 }}>
          <CartesianGrid stroke={CHART_MUTED.grid} vertical={false} strokeDasharray="4 4" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: CHART_MUTED.axis }}
            tickFormatter={(m) => formatMonthLabel(m)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: CHART_MUTED.axis }}
            tickFormatter={(v) => `$${v}`}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            labelFormatter={(m) => formatMonthLabel(m)}
            formatter={(v) => [`$${Number(v).toFixed(2)}`, "Total"]}
            contentStyle={{ borderRadius: 10, border: `1px solid ${CHART_MUTED.tooltipBorder}` }}
          />
          {mean > 0 && <ReferenceLine y={mean} stroke={CHART_MUTED.barMuted} strokeDasharray="4 4" />}
          <Bar
            dataKey="displayTotal"
            radius={[6, 6, 0, 0]}
            maxBarSize={48}
            animationDuration={650}
            animationBegin={70}
            animationEasing="ease-out"
            onClick={(d) => {
              const m = d?.payload?.month ?? d?.month;
              if (m) onBarClick?.(m);
            }}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.isSpike ? CHART_MUTED.anomaly : CHART_MUTED.bar} cursor={onBarClick ? "pointer" : "default"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
