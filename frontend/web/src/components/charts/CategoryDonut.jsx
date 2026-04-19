import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from "recharts";
import { categoryColor } from "../../utils/categories";
import { formatCurrency } from "../../utils/format";

function ActiveShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: "drop-shadow(0 6px 14px rgba(15, 23, 42, 0.18))" }}
      />
    </g>
  );
}

function CategoryDonut({
  data,
  total,
  label = "Total Spent",
  size = 224,
  activeIndex,
  onActiveChange,
}) {
  const safeData = data?.length ? data : [{ category: "—", total: 1 }];
  const sum = total ?? safeData.reduce((acc, d) => acc + (d.total ?? 0), 0);
  const active = activeIndex != null ? safeData[activeIndex] : null;
  const share = active && sum > 0 ? (active.total / sum) * 100 : null;

  function setActive(idx) {
    onActiveChange?.(idx);
  }

  return (
    <div className="relative mx-auto select-none" style={{ width: size, height: size }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={safeData}
            dataKey="total"
            nameKey="category"
            innerRadius="65%"
            outerRadius="100%"
            paddingAngle={2}
            stroke="none"
            isAnimationActive={false}
            activeIndex={activeIndex ?? -1}
            activeShape={ActiveShape}
            onMouseLeave={() => setActive(null)}
          >
            {safeData.map((d, i) => (
              <Cell
                key={d.category}
                fill={d.category === "—" ? "#e5e7eb" : categoryColor(d.category)}
                onMouseEnter={() => setActive(i)}
                style={{ cursor: "pointer", outline: "none" }}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        {active ? (
          <>
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
              {active.category}
            </p>
            <p className="tabular mt-1 text-2xl font-black text-ink-900 dark:text-ink-50">
              {formatCurrency(active.total, { compact: true })}
            </p>
            {share != null ? (
              <p className="tabular mt-0.5 text-xs font-bold text-brand-600 dark:text-brand-300">
                {share.toFixed(1)}%
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="tabular text-3xl font-black text-ink-900 dark:text-ink-50">
              {formatCurrency(sum, { compact: true })}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
              {label}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default CategoryDonut;
