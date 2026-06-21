import { summarizeTransactions } from "./analysisSummary";
import { detectRecurring, merchantBreakdown } from "./insights";

/** Compact summary for POST /api/coach/suggestions (matches backend CoachSummary). */
export function buildCoachSummary(transactions, { personalityLabel } = {}) {
  const base = summarizeTransactions(transactions);
  const recurring = detectRecurring(transactions);
  const recurringAnnualized = recurring.reduce((sum, row) => sum + row.annualized, 0);
  const topMerchants = merchantBreakdown(transactions)
    .slice(0, 5)
    .map((row) => ({ merchant: row.merchant, total: Math.round(row.total) }));

  const savingsRate =
    base.totalIncome > 0 ? Math.round((base.netCashFlow / base.totalIncome) * 1000) / 10 : 0;

  return {
    period: { start: base.dateRange.start, end: base.dateRange.end },
    totalTransactions: base.totalTransactions,
    totalIncome: Math.round(base.totalIncome),
    totalExpenses: Math.round(base.totalSpending),
    netCashFlow: Math.round(base.netCashFlow),
    savingsRate,
    topCategories: base.topCategories.map((row) => ({
      category: row.category,
      total: Math.round(row.total),
    })),
    topMerchants,
    recurringAnnualized: Math.round(recurringAnnualized),
    personalityLabel: personalityLabel ?? undefined,
  };
}

/** Local fallback when mock mode or API unavailable. */
export function fallbackCoachSuggestions(summary) {
  const topCat = summary.topCategories[0]?.category ?? "spending";
  return [
    {
      title: `Review ${topCat} spending`,
      message: `${topCat} is your largest category. Set a weekly check-in to stay on budget.`,
      impact: "high",
      estimatedMonthlySavings: Math.round(summary.totalExpenses * 0.05) || 25,
    },
    {
      title: "Audit recurring charges",
      message: "Cancel subscriptions you have not used in the last 30 days.",
      impact: "medium",
      estimatedMonthlySavings: summary.recurringAnnualized
        ? Math.round(summary.recurringAnnualized / 12 / 4)
        : 15,
    },
    {
      title: summary.netCashFlow >= 0 ? "Automate savings" : "Close the cash-flow gap",
      message:
        summary.netCashFlow >= 0
          ? "Schedule an automatic transfer to savings on payday."
          : "Pause discretionary purchases until expenses match income.",
      impact: summary.netCashFlow >= 0 ? "medium" : "high",
      estimatedMonthlySavings: 40,
    },
  ];
}
