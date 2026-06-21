import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { categoryColor, categoryEmoji } from "../../utils/categories";
import { formatCurrency } from "../../utils/format";
import { useTheme } from "../../hooks/useTheme";

function CategoryDonut({
  data,
  total,
  label = "Total Spent",
  size = 224,
  activeIndex,
  onActiveChange,
}) {
  const { theme } = useTheme();
  const emptySliceColor = theme === "dark" ? "#475569" : "#e5e7eb";
  const safeData = data?.length ? data : [{ category: "—", total: 1 }];
  const sum = total ?? safeData.reduce((acc, d) => acc + (d.total ?? 0), 0);
  const active = activeIndex != null ? safeData[activeIndex] : null;
  const share = active && sum > 0 ? (active.total / sum) * 100 : null;

  function setActive(idx) {
    onActiveChange?.(idx);
  }

  return (
    <div className="relative mx-auto min-w-0 select-none" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
            onMouseLeave={() => setActive(null)}
          >
            {safeData.map((d, i) => {
              const isActive = activeIndex === i;
              const hasSelection = activeIndex != null;
              const fill = d.category === "—" ? emptySliceColor : categoryColor(d.category);
              return (
                <Cell
                  key={d.category}
                  fill={fill}
                  fillOpacity={hasSelection ? (isActive ? 1 : 0.35) : 0.88}
                  stroke={isActive ? fill : "transparent"}
                  strokeWidth={isActive ? 2 : 0}
                  onMouseEnter={() => setActive(i)}
                  style={{
                    cursor: "pointer",
                    outline: "none",
                    transition: "fill-opacity 0.15s ease",
                  }}
                />
              );
            })}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        {active ? (
          <>
            <span className="text-2xl leading-none" aria-hidden>
              {categoryEmoji(active.category)}
            </span>
            <p className="mt-1 truncate text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
              {active.category}
            </p>
            <p className="tabular mt-1 text-xl font-black text-ink-900 dark:text-ink-50">
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
