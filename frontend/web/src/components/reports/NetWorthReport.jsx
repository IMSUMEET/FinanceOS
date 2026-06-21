import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function NetWorthReport({ transactions }) {
  const [timeRange, setTimeRange] = useState("all");

  const data = useMemo(() => {
    // Starting balance reference point
    const BASE_ASSETS = 35000;
    const BASE_LIABILITIES = 10000;

    // Group cumulative changes by date
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    const dates = Array.from(new Set(sorted.map((t) => t.date))).sort();

    // Map date to day net flow
    const dayFlow = {};
    for (const t of sorted) {
      if (t.category === "Credit Card Payments") continue;
      const amt = Number(t.amount || 0);
      dayFlow[t.date] = (dayFlow[t.date] ?? 0) + amt;
    }

    let runningFlow = 0;
    const list = dates.map(d => {
      runningFlow += (dayFlow[d] ?? 0);
      const assets = BASE_ASSETS + (runningFlow > 0 ? runningFlow * 0.8 : 0);
      const liabilities = BASE_LIABILITIES + (runningFlow < 0 ? Math.abs(runningFlow) * 0.6 : 0);
      const netWorth = assets - liabilities;

      return {
        date: d,
        assets: Math.round(assets),
        liabilities: Math.round(liabilities),
        netWorth: Math.round(netWorth),
      };
    });

    // Apply timeRange filter
    if (timeRange === "1M") return list.slice(-30);
    if (timeRange === "3M") return list.slice(-90);
    if (timeRange === "6M") return list.slice(-180);
    if (timeRange === "1Y") return list.slice(-365);
    return list;
  }, [transactions, timeRange]);

  const stats = useMemo(() => {
    if (!data.length) return { current: 0, growth: 0, max: 0, min: 0 };
    const current = data[data.length - 1]?.netWorth ?? 0;
    const start = data[0]?.netWorth ?? 0;
    const diff = current - start;
    const growth = start > 0 ? ((diff / start) * 100).toFixed(1) : 0;

    const values = data.map((d) => d.netWorth);
    return {
      current,
      growth,
      max: Math.max(...values),
      min: Math.min(...values),
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* KPI block */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-ink-150 p-4 dark:border-ink-850 bg-white dark:bg-ink-900/60 shadow-sm">
          <p className="text-xs text-ink-500">Current Net Worth</p>
          <p className="text-2xl font-black text-brand">${stats.current.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-ink-150 p-4 dark:border-ink-850 bg-white dark:bg-ink-900/60 shadow-sm">
          <p className="text-xs text-ink-500">Growth Rate (In period)</p>
          <p className="text-2xl font-black text-emerald-500">{stats.growth > 0 ? `+${stats.growth}%` : `${stats.growth}%`}</p>
        </div>
        <div className="rounded-xl border border-ink-150 p-4 dark:border-ink-850 bg-white dark:bg-ink-900/60 shadow-sm">
          <p className="text-xs text-ink-500">Peak Net Worth</p>
          <p className="text-xl font-bold text-ink-850 dark:text-ink-200">${stats.max.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-ink-150 p-4 dark:border-ink-850 bg-white dark:bg-ink-900/60 shadow-sm">
          <p className="text-xs text-ink-500">Lowest Net Worth</p>
          <p className="text-xl font-bold text-ink-850 dark:text-ink-200">${stats.min.toLocaleString()}</p>
        </div>
      </div>

      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 pb-3 dark:border-ink-800">
        <div>
          <h3 className="text-md font-bold text-ink-900 dark:text-ink-50">Assets vs Liabilities Timeline</h3>
          <p className="text-xs text-ink-500">Net worth value derived from accumulated savings changes</p>
        </div>
        <div className="flex items-center gap-1.5 bg-ink-50 p-1 rounded-xl dark:bg-ink-900">
          {["1M", "3M", "6M", "1Y", "all"].map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold uppercase ${
                timeRange === r ? "bg-brand text-white shadow" : "text-ink-500 hover:text-ink-900"
              }`}
            >
              {r === "all" ? "All Time" : r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={data}>
            <XAxis dataKey="date" stroke="#888" fontSize={10} />
            <YAxis stroke="#888" fontSize={10} />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Area type="monotone" dataKey="netWorth" stroke="#6366F1" fillOpacity={0.15} fill="#6366F1" name="Net Worth ($)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default NetWorthReport;
