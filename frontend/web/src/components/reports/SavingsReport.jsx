import { useMemo } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import SafeResponsiveContainer from "../charts/SafeResponsiveContainer";

function SavingsReport({ transactions }) {
  const data = useMemo(() => {
    // Group income vs expenses by month
    const monthsMap = {};
    for (const t of transactions) {
      if (t.category === "Credit Card Payments") continue;
      const m = t.date.substring(0, 7);
      if (!monthsMap[m]) monthsMap[m] = { month: m, income: 0, expenses: 0 };
      if (t.amount > 0) {
        monthsMap[m].income += t.amount;
      } else {
        monthsMap[m].expenses += Math.abs(t.amount);
      }
    }

    const list = Object.entries(monthsMap)
      .map(([m, val]) => {
        const saved = val.income > val.expenses ? val.income - val.expenses : 0;
        const rate = val.income > 0 ? (saved / val.income) * 100 : 0;
        return {
          month: m,
          saved: Math.round(saved),
          rate: Math.round(rate),
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate cumulative savings
    let runningTotal = 0;
    list.forEach((item) => {
      runningTotal += item.saved;
      item.cumulative = runningTotal;
    });

    return list;
  }, [transactions]);

  const stats = useMemo(() => {
    if (!data.length) return { avgRate: 0, bestMonth: "N/A", worstMonth: "N/A", currentRate: 0 };

    const rates = data.map((item) => item.rate);
    const avgRate = rates.reduce((sum, r) => sum + r, 0) / rates.length;
    const currentRate = data[data.length - 1]?.rate ?? 0;

    let bestVal = -Infinity;
    let bestMonth = "";
    let worstVal = Infinity;
    let worstMonth = "";

    data.forEach((item) => {
      if (item.saved > bestVal) {
        bestVal = item.saved;
        bestMonth = item.month;
      }
      if (item.saved < worstVal) {
        worstVal = item.saved;
        worstMonth = item.month;
      }
    });

    return {
      avgRate: Math.round(avgRate),
      bestMonth,
      worstMonth,
      currentRate: Math.round(currentRate),
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* KPI block */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-ink-150 p-4 dark:border-ink-850 bg-white dark:bg-ink-900/60 shadow-sm">
          <p className="text-xs text-ink-500">Average Savings Rate</p>
          <p className="text-2xl font-black text-brand">{stats.avgRate}%</p>
        </div>
        <div className="rounded-xl border border-ink-150 p-4 dark:border-ink-850 bg-white dark:bg-ink-900/60 shadow-sm">
          <p className="text-xs text-ink-500">Current Month Rate</p>
          <p className="text-2xl font-black text-emerald-500">{stats.currentRate}%</p>
        </div>
        <div className="rounded-xl border border-ink-150 p-4 dark:border-ink-850 bg-white dark:bg-ink-900/60 shadow-sm">
          <p className="text-xs text-ink-500">Best Month</p>
          <p className="text-xl font-bold text-ink-800 dark:text-ink-200">{stats.bestMonth}</p>
        </div>
        <div className="rounded-xl border border-ink-150 p-4 dark:border-ink-850 bg-white dark:bg-ink-900/60 shadow-sm">
          <p className="text-xs text-ink-500">Worst Month</p>
          <p className="text-xl font-bold text-ink-850 dark:text-ink-200">{stats.worstMonth}</p>
        </div>
      </div>

      <div>
        <h3 className="text-md font-bold text-ink-900 dark:text-ink-50">
          Savings Rate & Accumulation
        </h3>
        <p className="text-xs text-ink-500">
          Dual chart plotting monthly saved cash vs overall savings rate
        </p>
      </div>

      <SafeResponsiveContainer className="h-[320px] w-full">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" stroke="#888" fontSize={10} />
          <YAxis stroke="#888" fontSize={10} />
          <Tooltip />
          <Bar dataKey="saved" fill="#3B82F6" name="Amount Saved ($)" radius={[4, 4, 0, 0]} />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="#10B981"
            strokeWidth={2.5}
            name="Savings Rate (%)"
          />
        </ComposedChart>
      </SafeResponsiveContainer>
    </div>
  );
}

export default SavingsReport;
