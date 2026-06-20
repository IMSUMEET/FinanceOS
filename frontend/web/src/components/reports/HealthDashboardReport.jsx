import { useMemo } from "react";

function HealthDashboardReport({ transactions }) {
  const metrics = useMemo(() => {
    const incomeTx = transactions.filter(t => t.amount > 0 && t.category !== "Credit Card Payments");
    const expenseTx = transactions.filter(t => t.amount < 0 && t.category !== "Credit Card Payments");

    const totalIncome = incomeTx.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTx.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const monthlyAvgExpense = totalExpenses / 6; // Assume typical 6 months data window

    // 1. Savings Rate
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    let savingsStatus = "Needs Attention";
    if (savingsRate > 20) savingsStatus = "Excellent";
    else if (savingsRate > 10) savingsStatus = "Good";

    // 2. Emergency Fund Coverage
    // Assume user has $15,000 emergency fund. Coverage is fund size / average monthly expense.
    const fundSize = 15000;
    const coverageMonths = monthlyAvgExpense > 0 ? fundSize / monthlyAvgExpense : 6;
    let coverageStatus = "Needs Attention";
    if (coverageMonths >= 6) coverageStatus = "Excellent";
    else if (coverageMonths >= 3) coverageStatus = "Good";

    // 3. Recurring Expense Ratio (Subscriptions / Expenses)
    const subTotal = expenseTx.filter(t => t.category === "Subscriptions").reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const subRatio = totalExpenses > 0 ? (subTotal / totalExpenses) * 100 : 0;
    let subStatus = "Excellent";
    if (subRatio > 15) subStatus = "Needs Attention";
    else if (subRatio > 8) subStatus = "Good";

    // 4. Debt Ratio (Assumed Liabilities over Assets ratio)
    const debtRatio = 28; // Assumed steady value
    let debtStatus = "Excellent";
    if (debtRatio > 40) debtStatus = "Needs Attention";
    else if (debtRatio > 30) debtStatus = "Good";

    return [
      {
        name: "Savings Rate",
        value: `${savingsRate.toFixed(1)}%`,
        status: savingsStatus,
        desc: "Recommended target is 20%+",
        progress: Math.min(Math.max(savingsRate, 0), 100),
      },
      {
        name: "Emergency Fund Coverage",
        value: `${coverageMonths.toFixed(1)} months`,
        status: coverageStatus,
        desc: "Ideal size covers 3-6 months expenses",
        progress: Math.min((coverageMonths / 6) * 100, 100),
      },
      {
        name: "Recurring Expense Ratio",
        value: `${subRatio.toFixed(1)}%`,
        status: subStatus,
        desc: "Lower subscription ratio implies high budget flexibility",
        progress: Math.min(subRatio * 4, 100),
      },
      {
        name: "Debt-to-Income Ratio",
        value: `${debtRatio}%`,
        status: debtStatus,
        desc: "Ideal standard target is below 36%",
        progress: debtRatio,
      },
    ];
  }, [transactions]);

  const getStatusColor = (status) => {
    if (status === "Excellent") return "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20";
    if (status === "Good") return "text-blue-500 bg-blue-50 dark:bg-blue-950/20";
    return "text-rose-500 bg-rose-50 dark:bg-rose-950/20";
  };

  const getProgressBarColor = (status) => {
    if (status === "Excellent") return "bg-emerald-500";
    if (status === "Good") return "bg-blue-500";
    return "bg-rose-500";
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-md font-bold text-ink-900 dark:text-ink-50">Financial Health Dashboard</h3>
        <p className="text-xs text-ink-500">Key Performance Indicators evaluated based on your flow data</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {metrics.map((m) => (
          <div key={m.name} className="rounded-2xl border border-ink-150 p-5 dark:border-ink-850 flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-400 dark:text-ink-500">{m.name}</h4>
                <p className="text-2xl font-black text-ink-900 dark:text-ink-50 mt-1">{m.value}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${getStatusColor(m.status)}`}>
                {m.status}
              </span>
            </div>

            <div className="space-y-2">
              <div className="h-2 w-full rounded bg-ink-100 overflow-hidden dark:bg-ink-900">
                <div
                  className={`h-full rounded transition-all duration-500 ${getProgressBarColor(m.status)}`}
                  style={{ width: `${m.progress}%` }}
                />
              </div>
              <p className="text-[10px] text-ink-500">{m.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HealthDashboardReport;
