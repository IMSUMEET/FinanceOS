import { useMemo } from "react";

const BUDGET_DEFAULTS = {
  Groceries: 500,
  Food: 400,
  Subscriptions: 80,
  Travel: 1000,
  Gas: 150,
  Utilities: 300,
  Transport: 200,
  Shopping: 600,
  Entertainment: 250,
  Other: 300,
};

function BudgetReport({ transactions }) {
  const budgetList = useMemo(() => {
    const expenseTx = transactions.filter(t => t.amount < 0 && t.category !== "Credit Card Payments");

    const categorySpend = {};
    for (const t of expenseTx) {
      categorySpend[t.category] = (categorySpend[t.category] ?? 0) + Math.abs(t.amount);
    }

    return Object.entries(BUDGET_DEFAULTS).map(([cat, budget]) => {
      const actual = Math.round(categorySpend[cat] ?? 0);
      const variance = actual - budget;
      const percent = budget > 0 ? (actual / budget) * 100 : 0;
      const isOver = actual > budget;

      return {
        category: cat,
        budget,
        actual,
        variance,
        percent,
        isOver,
      };
    }).sort((a, b) => b.actual - a.actual);
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-md font-bold text-ink-900 dark:text-ink-50">Budget vs Actual Spend</h3>
        <p className="text-xs text-ink-500">Highlighting areas under budget (green) vs over budget (red)</p>
      </div>

      <div className="space-y-4">
        {budgetList.map((item) => (
          <div key={item.category} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-ink-850 dark:text-ink-200">{item.category}</span>
              <div className="flex items-center gap-2">
                <span className="text-ink-500 font-mono">Actual: ${item.actual} / Budget: ${item.budget}</span>
                <span className={`font-bold ${item.isOver ? "text-rose-500" : "text-emerald-500"}`}>
                  {item.isOver ? `+${item.percent.toFixed(0)}%` : `${item.percent.toFixed(0)}%`}
                </span>
              </div>
            </div>

            {/* Custom Horizontal Progress Bar */}
            <div className="relative h-6 w-full rounded-lg bg-ink-100 overflow-hidden dark:bg-ink-900">
              <div
                className={`h-full rounded-lg transition-all duration-500 ${
                  item.isOver ? "bg-rose-500" : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(item.percent, 100)}%` }}
              />
              {/* Show thin overflow budget bar if actual is over budget */}
              {item.isOver && (
                <div 
                  className="absolute top-0 bottom-0 right-0 bg-rose-600/30 animate-pulse"
                  style={{ left: `${Math.min(100, (item.budget / item.actual) * 100)}%` }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BudgetReport;
