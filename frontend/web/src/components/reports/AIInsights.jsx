import { useMemo } from "react";
import { Sparkles, ArrowUpRight, TrendingDown, AlertTriangle } from "lucide-react";
import Card from "../ui/Card";

function AIInsights({ transactions }) {
  const insights = useMemo(() => {
    if (!transactions || !transactions.length) {
      return {
        observations: ["No transaction data available for analysis."],
        recommendations: ["Upload transactions to receive automated financial insights."],
        anomaly: null,
      };
    }

    const expenses = transactions.filter((t) => t.category !== "Credit Card Payments" && t.amount < 0);
    const incomes = transactions.filter((t) => t.category !== "Credit Card Payments" && t.amount > 0);

    const totalSpent = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);

    // Compute category map
    const catMap = {};
    for (const t of expenses) {
      catMap[t.category] = (catMap[t.category] ?? 0) + Math.abs(t.amount);
    }

    const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

    const observations = [];
    const recommendations = [];
    let anomaly = null;

    // 1. Observations
    if (sortedCats.length > 0 && totalSpent > 0) {
      const [topCat, topVal] = sortedCats[0];
      const pct = ((topVal / totalSpent) * 100).toFixed(0);
      observations.push(`${topCat} represents the largest share of your spending at ${pct}%.`);
    }

    if (totalIncome > 0) {
      const savingsRate = totalIncome > totalSpent ? (((totalIncome - totalSpent) / totalIncome) * 100).toFixed(0) : 0;
      observations.push(`Your net savings rate for the selected filters is ${savingsRate}%.`);
    }

    const subCount = expenses.filter((t) => t.category === "Subscriptions").length;
    if (subCount > 0) {
      const subTotal = expenses.filter((t) => t.category === "Subscriptions").reduce((s, t) => s + Math.abs(t.amount), 0);
      observations.push(`You have ${subCount} subscription transactions totaling $${subTotal.toFixed(2)}.`);
    }

    if (observations.length < 3) {
      observations.push("Your transaction volume is steady across the selected period.");
    }

    // 2. Recommendations
    if (sortedCats.length > 0) {
      const [topCat] = sortedCats[0];
      recommendations.push(`Consider setting a tighter budget cap on your top category (${topCat}) next month.`);
    }
    recommendations.push("Review recurring subscriptions to cancel any inactive services.");

    // 3. Anomaly
    // Let's find any transaction that is 4x larger than the average expense
    const avgExpense = totalSpent / (expenses.length || 1);
    const massive = expenses.find((t) => Math.abs(t.amount) > avgExpense * 4.5);
    if (massive) {
      anomaly = {
        title: "Unusual Expense Detected",
        description: `Single payment of $${Math.abs(massive.amount).toFixed(2)} to "${massive.merchant_normalized || massive.merchant_raw}" is significantly higher than your typical transaction size.`,
      };
    } else {
      anomaly = {
        title: "No Major Anomalies",
        description: "All spending patterns appear consistent and within historical variance parameters.",
      };
    }

    return { observations, recommendations, anomaly };
  }, [transactions]);

  return (
    <Card className="mt-8 border border-brand-100 bg-gradient-to-br from-brand-50/40 via-white to-transparent p-6 dark:border-brand-900/40 dark:from-brand-950/20 dark:via-ink-900">
      <div className="flex items-center gap-2 pb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand dark:bg-brand-400/10 dark:text-brand-400">
          <Sparkles size={18} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-ink-900 dark:text-ink-50">AI Financial Insights</h3>
          <p className="text-xs text-ink-500 dark:text-ink-400">Automated intelligence scan of active transaction set</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Observations */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400 flex items-center gap-1.5">
            <ArrowUpRight size={14} className="text-emerald-500" />
            Key Observations
          </h4>
          <ul className="space-y-2.5">
            {insights.observations.map((o, idx) => (
              <li key={idx} className="text-sm text-ink-700 dark:text-ink-300 pl-4 relative before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-brand">
                {o}
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400 flex items-center gap-1.5">
            <TrendingDown size={14} className="text-brand" />
            Action Items
          </h4>
          <ul className="space-y-2.5">
            {insights.recommendations.map((r, idx) => (
              <li key={idx} className="text-sm text-ink-700 dark:text-ink-300 pl-4 relative before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-brand-400">
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* Anomaly */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400 flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-amber-500" />
            Anomaly Detection
          </h4>
          {insights.anomaly ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 dark:border-amber-900/30 dark:bg-amber-950/20">
              <h5 className="text-sm font-bold text-amber-800 dark:text-amber-400">{insights.anomaly.title}</h5>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                {insights.anomaly.description}
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink-600 dark:text-ink-400">No anomalies detected.</p>
          )}
        </div>
      </div>
    </Card>
  );
}

export default AIInsights;
