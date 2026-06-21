import { useState, useMemo } from "react";

function HeatmapReport({ transactions }) {
  const [viewMonths, setViewMonths] = useState(3); // Default to last 3 months

  const metrics = useMemo(() => {
    const expenseTx = transactions.filter(t => t.amount < 0 && t.category !== "Credit Card Payments");

    // Group by date
    const dateMap = {};
    let maxExpense = 0;
    let maxDate = "";
    let weekendSum = 0;
    let weekdaySum = 0;
    let weekendCount = 0;
    let weekdayCount = 0;

    for (const t of expenseTx) {
      const amt = Math.abs(t.amount);
      dateMap[t.date] = (dateMap[t.date] ?? 0) + amt;

      const d = new Date(t.date);
      const day = d.getDay();
      if (day === 0 || day === 6) {
        weekendSum += amt;
        weekendCount++;
      } else {
        weekdaySum += amt;
        weekdayCount++;
      }
    }

    // Find max spending day
    Object.entries(dateMap).forEach(([date, sum]) => {
      if (sum > maxExpense) {
        maxExpense = sum;
        maxDate = date;
      }
    });

    return {
      dateMap,
      maxExpense,
      maxDate,
      avgWeekend: weekendCount > 0 ? weekendSum / weekendCount : 0,
      avgWeekday: weekdayCount > 0 ? weekdaySum / weekdayCount : 0,
    };
  }, [transactions]);

  // Generate grid days for the selected view range
  const gridData = useMemo(() => {
    const today = new Date("2026-06-20"); // Fixed reference today date to match context
    const daysToShow = viewMonths * 30;

    const list = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const spent = metrics.dateMap[dateStr] ?? 0;

      // Color tier class based on spend vs max spend
      let tier = "bg-ink-100 dark:bg-ink-900";
      if (spent > 0) {
        const ratio = spent / (metrics.maxExpense || 1);
        if (ratio < 0.25) tier = "bg-rose-100 dark:bg-rose-950/40 text-rose-900";
        else if (ratio < 0.5) tier = "bg-rose-300 dark:bg-rose-900/60";
        else if (ratio < 0.75) tier = "bg-rose-500 text-white";
        else tier = "bg-rose-700 text-white font-bold";
      }

      list.push({
        date: dateStr,
        spent,
        tier,
        dayOfWeek: d.getDay(),
      });
    }

    return list;
  }, [viewMonths, metrics]);

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 pb-3 dark:border-ink-800">
        <div>
          <h3 className="text-md font-bold text-ink-900 dark:text-ink-50">Daily Spending Heatmap</h3>
          <p className="text-xs text-ink-500">Visualizing calendar spend intensity (Rose color tiers)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMonths(1)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
              viewMonths === 1 ? "bg-brand text-white" : "bg-ink-100 dark:bg-ink-900 text-ink-500"
            }`}
          >
            Last Month
          </button>
          <button
            onClick={() => setViewMonths(3)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
              viewMonths === 3 ? "bg-brand text-white" : "bg-ink-100 dark:bg-ink-900 text-ink-500"
            }`}
          >
            Last 3 Months
          </button>
          <button
            onClick={() => setViewMonths(12)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
              viewMonths === 12 ? "bg-brand text-white" : "bg-ink-100 dark:bg-ink-900 text-ink-500"
            }`}
          >
            Last Year
          </button>
        </div>
      </div>

      {/* Grid container */}
      <div className="flex flex-wrap gap-1 py-4 justify-center">
        {gridData.map((day) => (
          <div
            key={day.date}
            className={`h-7 w-7 rounded flex items-center justify-center text-[8px] cursor-pointer transition select-none ${day.tier}`}
            title={`${day.date}: $${day.spent.toFixed(2)} spent`}
          >
            {new Date(day.date).getDate()}
          </div>
        ))}
      </div>

      {/* Grid legend / footer insights */}
      <div className="grid gap-4 md:grid-cols-3 pt-3 border-t border-ink-100 dark:border-ink-800">
        <div className="rounded-xl border border-ink-150 p-4.5 dark:border-ink-850">
          <p className="text-xs text-ink-500">Most Expensive Day</p>
          <p className="text-md font-black text-rose-500">
            {metrics.maxDate ? `${metrics.maxDate} ($${metrics.maxExpense.toFixed(0)})` : "N/A"}
          </p>
        </div>
        <div className="rounded-xl border border-ink-150 p-4.5 dark:border-ink-850">
          <p className="text-xs text-ink-500">Weekday Average</p>
          <p className="text-md font-black text-ink-800 dark:text-ink-200">
            ${metrics.avgWeekday.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-ink-150 p-4.5 dark:border-ink-850">
          <p className="text-xs text-ink-500">Weekend Average</p>
          <p className="text-md font-black text-ink-800 dark:text-ink-200">
            ${metrics.avgWeekend.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default HeatmapReport;
