export const FLOW_PERIOD_ALL = "ALL";
export const FLOW_PERIOD_LAST_12 = "LAST_12";
export const FLOW_PERIOD_THIS_YEAR = "THIS_YEAR";

export function availableYears(transactions) {
  const set = new Set();
  for (const t of transactions) {
    const y = new Date(t.date).getFullYear();
    if (!Number.isNaN(y)) set.add(y);
  }
  return Array.from(set).sort((a, b) => b - a);
}

export function filterTransactionsByPeriod(transactions, period) {
  if (!period || period === FLOW_PERIOD_ALL) return transactions;

  const now = new Date();

  if (period === FLOW_PERIOD_THIS_YEAR) {
    const y = now.getFullYear();
    return transactions.filter((t) => new Date(t.date).getFullYear() === y);
  }

  if (period === FLOW_PERIOD_LAST_12) {
    const cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - 12);
    return transactions.filter((t) => new Date(t.date) >= cutoff);
  }

  if (period.startsWith("year:")) {
    const y = Number(period.slice(5));
    if (!Number.isNaN(y)) {
      return transactions.filter((t) => new Date(t.date).getFullYear() === y);
    }
  }

  return transactions;
}

export function flowPeriodOptions(transactions) {
  const years = availableYears(transactions);
  return [
    { value: FLOW_PERIOD_ALL, label: "All time" },
    { value: FLOW_PERIOD_THIS_YEAR, label: "This year" },
    { value: FLOW_PERIOD_LAST_12, label: "Last 12 months" },
    ...years.map((y) => ({ value: `year:${y}`, label: String(y) })),
  ];
}
