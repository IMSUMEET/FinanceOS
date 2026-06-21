import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import SafeResponsiveContainer from "../charts/SafeResponsiveContainer";

function CategoryReport({ transactions }) {
  const [selectedCat, setSelectedCat] = useState(null);

  const data = useMemo(() => {
    const expenseTx = transactions.filter(t => t.amount < 0 && t.category !== "Credit Card Payments");
    const totalSpent = expenseTx.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const expenseMap = {};
    for (const t of expenseTx) {
      expenseMap[t.category] = (expenseMap[t.category] ?? 0) + Math.abs(t.amount);
    }

    return Object.entries(expenseMap).map(([cat, total]) => ({
      name: cat,
      value: Math.round(total),
      percentage: totalSpent > 0 ? ((total / totalSpent) * 100).toFixed(1) : 0,
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const COLORS = ["#EF4444", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6", "#10B981", "#6B7280", "#06B6D4"];

  const handleSliceClick = (data, index) => {
    setSelectedCat(selectedCat === data.name ? null : data.name);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b border-ink-100 pb-3 dark:border-ink-800">
        <div>
          <h3 className="text-md font-bold text-ink-900 dark:text-ink-50">Category Breakdown</h3>
          <p className="text-xs text-ink-500">Interactive donut chart of category distribution</p>
        </div>
        {selectedCat && (
          <button
            onClick={() => setSelectedCat(null)}
            className="text-xs font-semibold text-rose-500 hover:underline"
          >
            Clear selection
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6">
        <SafeResponsiveContainer className="h-[300px] w-full md:w-[45%]">
          <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                onClick={handleSliceClick}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke={selectedCat === entry.name ? "#000" : "none"}
                    strokeWidth={2}
                    className="cursor-pointer hover:opacity-90 transition"
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
          </PieChart>
        </SafeResponsiveContainer>

        {/* Legend table */}
        <div className="flex-1 w-full max-h-[300px] overflow-y-auto pr-2">
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            {data.map((item, index) => {
              const active = selectedCat === null || selectedCat === item.name;
              return (
                <div
                  key={item.name}
                  onClick={() => setSelectedCat(selectedCat === item.name ? null : item.name)}
                  className={`flex items-center justify-between py-2.5 px-2 rounded-lg cursor-pointer transition ${
                    active ? "hover:bg-ink-50 dark:hover:bg-ink-900" : "opacity-40"
                  } ${selectedCat === item.name ? "bg-brand-50/50 dark:bg-brand-950/20 font-bold" : ""}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-ink-850 dark:text-ink-200">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-bold text-ink-900 dark:text-ink-50">
                      ${item.value.toLocaleString()}
                    </span>
                    <span className="text-xs text-ink-500 dark:text-ink-400 ml-2">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoryReport;
