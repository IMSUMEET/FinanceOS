import { categoryBreakdown } from "./insights";

/**
 * Build the same summary shape as POST /api/analyze (for mock-mode client analysis).
 */
export function summarizeTransactions(transactions) {
  let totalIncome = 0;
  let totalSpending = 0;
  let start = null;
  let end = null;
  let minTs = Infinity;
  let maxTs = -Infinity;

  for (const t of transactions) {
    if (t.category === "Credit Card Payments") continue;
    const amt = Number(t.amount ?? 0);
    if (amt > 0) totalIncome += amt;
    else totalSpending += Math.abs(amt);
    const ts = Date.parse(t.date);
    if (Number.isFinite(ts)) {
      if (ts < minTs) {
        minTs = ts;
        start = t.date;
      }
      if (ts > maxTs) {
        maxTs = ts;
        end = t.date;
      }
    }
  }

  const topCategories = categoryBreakdown(transactions).slice(0, 8);
  const netCashFlow = totalIncome - totalSpending;

  return {
    totalTransactions: transactions.length,
    totalIncome,
    totalSpending,
    netCashFlow,
    topCategories,
    dateRange: { start, end },
  };
}
