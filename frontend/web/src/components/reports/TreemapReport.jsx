import { useMemo } from "react";
import { Treemap, Tooltip } from "recharts";
import SafeResponsiveContainer from "../charts/SafeResponsiveContainer";

function TreemapReport({ transactions }) {
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

  const totalSpendVal = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0);
  }, [data]);

  const COLORS = ["#EF4444", "#F59E0B", "#3B82F6", "#EC4899", "#8B5CF6", "#10B981", "#6B7280"];

  const CustomizedContent = (props) => {
    const { root, depth, x, y, width, height, index, name, value, percentage } = props;
    if (depth !== 1 || width < 40 || height < 30) return null;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: COLORS[index % COLORS.length],
            stroke: "#fff",
            strokeWidth: 2,
            strokeOpacity: 1,
          }}
          className="hover:brightness-95 transition cursor-pointer"
        />
        <text
          x={x + width / 2}
          y={y + height / 2 - 4}
          textAnchor="middle"
          fill="#fff"
          fontSize={12}
          fontWeight="bold"
        >
          {name}
        </text>
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          fill="#fff"
          fontSize={10}
          opacity={0.9}
        >
          {percentage}%
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b border-ink-100 pb-3 dark:border-ink-800">
        <div>
          <h3 className="text-md font-bold text-ink-900 dark:text-ink-50">Spending Magnitude Treemap</h3>
          <p className="text-xs text-ink-500">Each rectangle represents proportional category outlay</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-500">Total Spending</p>
          <p className="text-lg font-black text-rose-500">${totalSpendVal.toLocaleString()}</p>
        </div>
      </div>

      <SafeResponsiveContainer className="h-[380px] w-full">
        <Treemap
            data={data}
            dataKey="value"
            stroke="#fff"
            fill="#8884d8"
            content={<CustomizedContent />}
          >
            <Tooltip
              formatter={(value, name, props) => [`$${value.toLocaleString()}`, "Amount"]}
            />
        </Treemap>
      </SafeResponsiveContainer>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7 pt-2">
        {data.map((item, idx) => (
          <div key={item.name} className="flex items-center gap-2 rounded-lg bg-ink-50 p-2 text-xs dark:bg-ink-900">
            <span className="h-3 w-3 shrink-0 rounded" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
            <div className="truncate">
              <p className="font-bold text-ink-800 dark:text-ink-200 truncate">{item.name}</p>
              <p className="text-ink-500 font-mono">${item.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TreemapReport;
