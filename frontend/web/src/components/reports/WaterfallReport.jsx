import { useMemo } from "react";

function WaterfallReport({ transactions }) {
  const data = useMemo(() => {
    const incomeTx = transactions.filter(t => t.amount > 0 && t.category !== "Credit Card Payments");
    const expenseTx = transactions.filter(t => t.amount < 0 && t.category !== "Credit Card Payments");

    const totalIncome = incomeTx.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTx.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const expenseMap = {};
    for (const t of expenseTx) {
      expenseMap[t.category] = (expenseMap[t.category] ?? 0) + Math.abs(t.amount);
    }

    const categories = Object.entries(expenseMap)
      .map(([name, val]) => ({ name, val }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 5); // Take top 5 expense categories

    const topExpSum = categories.reduce((sum, c) => sum + c.val, 0);
    const otherExp = totalExpenses - topExpSum;

    if (otherExp > 0) {
      categories.push({ name: "Other Expenses", val: otherExp });
    }

    // Build waterfall steps
    const steps = [];
    // 1. Income (start)
    steps.push({
      name: "Total Income",
      val: totalIncome,
      type: "income",
      start: 0,
      end: totalIncome,
    });

    let current = totalIncome;
    categories.forEach((cat) => {
      const start = current;
      const end = current - cat.val;
      steps.push({
        name: cat.name,
        val: -cat.val,
        type: "expense",
        start,
        end,
      });
      current = end;
    });

    // Final Savings
    steps.push({
      name: "Remaining Savings",
      val: current,
      type: "savings",
      start: 0,
      end: current,
    });

    return steps;
  }, [transactions]);

  const maxVal = useMemo(() => {
    if (!data.length) return 100;
    return Math.max(...data.map(d => Math.max(d.start, d.end)));
  }, [data]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-md font-bold text-ink-900 dark:text-ink-50">Cash Flow Waterfall</h3>
        <p className="text-xs text-ink-500">Deconstructing gross income down to remaining net savings</p>
      </div>

      <div className="relative w-full overflow-x-auto">
        <div className="min-w-[600px] flex flex-col gap-3 py-4">
          {data.map((step, idx) => {
            const isSavings = step.type === "savings";
            const isIncome = step.type === "income";

            // Calculate width and offsets percentages
            const barStart = (Math.min(step.start, step.end) / maxVal) * 100;
            const barEnd = (Math.max(step.start, step.end) / maxVal) * 100;
            const barWidth = Math.max(barEnd - barStart, 1.5);

            let barColor = "bg-rose-500";
            if (isIncome) barColor = "bg-emerald-500";
            if (isSavings) barColor = "bg-brand";

            return (
              <div key={idx} className="flex items-center text-xs">
                <div className="w-32 shrink-0 font-semibold truncate text-ink-850 dark:text-ink-200" title={step.name}>
                  {step.name}
                </div>
                <div className="flex-1 relative h-7 bg-ink-50/50 rounded-lg overflow-hidden dark:bg-ink-900/35">
                  <div
                    className={`absolute h-full rounded-md transition-all duration-500 ${barColor}`}
                    style={{
                      left: `${barStart}%`,
                      width: `${barWidth}%`,
                    }}
                  />
                  <span
                    className="absolute text-[10px] font-black text-ink-900 dark:text-white pointer-events-none"
                    style={{
                      left: `${Math.max(0, barStart + (barWidth / 2) - 3)}%`,
                      top: "22%",
                    }}
                  >
                    {step.val > 0 ? `+$${step.val.toFixed(0)}` : `-$${Math.abs(step.val).toFixed(0)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default WaterfallReport;
