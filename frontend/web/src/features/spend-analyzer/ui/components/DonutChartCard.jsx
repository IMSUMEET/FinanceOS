import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, Sector } from "recharts";
import { DONUT_COLORS } from "../constants/chartTheme.js";
import { formatMoney } from "../utils/format.js";

function renderActiveShape(props) {
  return <Sector {...props} outerRadius={(props?.outerRadius ?? 100) + 6} />;
}

export default function DonutChartCard({ title, data, onSegmentClick, formatValue }) {
  const fmt = formatValue ?? ((v) => `$${Number(v).toFixed(2)}`);
  const [activeIndex, setActiveIndex] = useState(-1);
  const total = useMemo(
    () => (Array.isArray(data) ? data.reduce((sum, item) => sum + (Number(item.value) || 0), 0) : 0),
    [data],
  );
  const center = activeIndex >= 0 ? data?.[activeIndex] : null;

  return (
    <div className={`analysisCard analysisCardPad donutInteractive ${onSegmentClick ? "chartInteractive" : ""}`}>
      <div className="analysisCardHeader">
        <h3 className="analysisCardTitle">{title}</h3>
        {onSegmentClick && <div className="chartHint">Click a slice to explore</div>}
      </div>
      <div className="donutWrap">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart margin={{ left: 4, right: 4 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={100}
              paddingAngle={2}
              strokeWidth={0}
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(-1)}
              onClick={(slice) => {
                const name = slice?.name ?? slice?.payload?.name;
                if (name) onSegmentClick?.(name);
              }}
              style={{ cursor: onSegmentClick ? "pointer" : "default" }}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                  fillOpacity={activeIndex === -1 || activeIndex === i ? 1 : 0.35}
                />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [fmt(v), "Spend"]} contentStyle={{ borderRadius: 10, border: "1px solid #eceff3" }} />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ fontSize: 12, color: "var(--color-text-muted)" }}
              formatter={(value) => <span className="donutLegendLabel">{value}</span>}
            />
            <text x="50%" y="46%" textAnchor="middle" className="donutCenterPrimary">
              {center?.name ?? "Total spend"}
            </text>
            <text x="50%" y="56%" textAnchor="middle" className="donutCenterSecondary">
              {center ? formatMoney(center.value) : formatMoney(total)}
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
