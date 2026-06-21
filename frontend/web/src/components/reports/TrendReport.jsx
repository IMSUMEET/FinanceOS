import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function TrendReport({ transactions }) {
  const [activeLines, setActiveLines] = useState({
    income: true,
    expenses: true,
    savings: true,
  });
  const [aggregation, setAggregation] = useState("monthly");
  const [showMovingAverage, setShowMovingAverage] = useState(false);

  // Parse transaction data
  const data = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    if (!sorted.length) return [];

    const groupMap = {};

    for (const t of sorted) {
      if (t.category === "Credit Card Payments") continue;

      let key = t.date; // daily default
      if (aggregation === "monthly") {
        key = t.date.substring(0, 7); // YYYY-MM
      } else if (aggregation === "yearly") {
        key = t.date.substring(0, 4); // YYYY
      } else if (aggregation === "weekly") {
        // Simple week number fallback
        const d = new Date(t.date);
        const startOfYear = new Date(d.getFullYear(), 0, 1);
        const pastDaysOfYear = (d.getTime() - startOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
        key = `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
      }

      if (!groupMap[key]) {
        groupMap[key] = { name: key, income: 0, expenses: 0 };
      }

      const amt = Number(t.amount || 0);
      if (amt > 0) {
        groupMap[key].income += amt;
      } else {
        groupMap[key].expenses += Math.abs(amt);
      }
    }

    const list = Object.entries(groupMap).map(([key, vals]) => {
      const savings = vals.income - vals.expenses;
      return {
        name: key,
        income: Math.round(vals.income),
        expenses: Math.round(vals.expenses),
        savings: Math.round(savings),
      };
    });

    // Calculate moving average for expenses if enabled
    if (showMovingAverage && list.length > 0) {
      for (let i = 0; i < list.length; i++) {
        let sum = 0;
        let count = 0;
        for (let j = Math.max(0, i - 2); j <= i; j++) {
          sum += list[j].expenses;
          count++;
        }
        list[i].expenseMovingAvg = Math.round(sum / count);
      }
    }

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [transactions, aggregation, showMovingAverage]);

  // Dynamic Month over Month Expense Insight
  const expenseMoMInsight = useMemo(() => {
    const monthlyList = Object.entries(
      transactions.reduce((acc, t) => {
        if (t.category === "Credit Card Payments" || t.amount >= 0) return acc;
        const m = t.date.substring(0, 7);
        acc[m] = (acc[m] ?? 0) + Math.abs(t.amount);
        return acc;
      }, {})
    ).sort((a, b) => a[0].localeCompare(b[0]));

    if (monthlyList.length < 2) return null;
    const [prev, cur] = monthlyList.slice(-2);
    const prevVal = prev[1];
    const curVal = cur[1];
    const diff = curVal - prevVal;
    const pct = ((diff / (prevVal || 1)) * 100).toFixed(0);

    if (diff > 0) {
      return `Expenses increased ${pct}% compared to previous month (${prev[0]} to ${cur[0]}).`;
    } else {
      return `Expenses decreased ${Math.abs(pct)}% compared to previous month (${prev[0]} to ${cur[0]}).`;
    }
  }, [transactions]);

  const handleToggleLine = (key) => {
    setActiveLines((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      {/* Chart Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 pb-3 dark:border-ink-800">
        <div>
          <h3 className="text-md font-bold text-ink-900 dark:text-ink-50">Monthly Income & Expenses Trends</h3>
          <p className="text-xs text-ink-500">Compare incoming cash vs spend velocity</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Toggles */}
          <div className="flex gap-2">
            <button
              onClick={() => handleToggleLine("income")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                activeLines.income
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-ink-100 text-ink-400 dark:bg-ink-900"
              }`}
            >
              Income
            </button>
            <button
              onClick={() => handleToggleLine("expenses")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                activeLines.expenses
                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                  : "bg-ink-100 text-ink-400 dark:bg-ink-900"
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => handleToggleLine("savings")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                activeLines.savings
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                  : "bg-ink-100 text-ink-400 dark:bg-ink-900"
              }`}
            >
              Savings
            </button>
          </div>

          {/* Aggregation Select */}
          <select
            value={aggregation}
            onChange={(e) => setAggregation(e.target.value)}
            className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs font-semibold dark:border-ink-850 dark:bg-ink-900 dark:text-ink-50"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>

          {/* Moving Average */}
          <label className="flex items-center gap-1.5 text-xs text-ink-600 dark:text-ink-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showMovingAverage}
              onChange={(e) => setShowMovingAverage(e.target.checked)}
              className="rounded border-ink-300 dark:border-ink-800"
            />
            Moving Avg
          </label>
        </div>
      </div>

      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} />
            <YAxis stroke="#888" fontSize={11} tickLine={false} />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Legend />
            {activeLines.income && (
              <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2.5} dot={false} name="Income" />
            )}
            {activeLines.expenses && (
              <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2.5} dot={false} name="Expenses" />
            )}
            {activeLines.savings && (
              <Line type="monotone" dataKey="savings" stroke="#3B82F6" strokeWidth={2.5} dot={false} name="Savings" />
            )}
            {showMovingAverage && activeLines.expenses && (
              <Line type="monotone" dataKey="expenseMovingAvg" stroke="#EC4899" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Moving Avg (Exp)" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {expenseMoMInsight ? (
        <div className="rounded-xl bg-brand-50/50 p-4.5 text-xs font-semibold text-brand-900 border border-brand-100 dark:bg-brand-950/20 dark:text-brand-300 dark:border-brand-950">
          💡 Trend Alert: {expenseMoMInsight}
        </div>
      ) : null}
    </div>
  );
}

export default TrendReport;
