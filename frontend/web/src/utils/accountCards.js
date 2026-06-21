import { monthKey } from "./format";

const CARD_THEMES = {
  "Chase Credit Card": {
    gradient: "from-slate-800 via-slate-900 to-indigo-950",
    barGradient: "from-indigo-400 via-violet-500 to-purple-500",
    accent: "text-indigo-200",
    chip: "#c4b5fd",
    network: "VISA",
  },
  "Chase Checking": {
    gradient: "from-emerald-600 via-teal-700 to-emerald-900",
    barGradient: "from-emerald-400 via-teal-400 to-cyan-400",
    accent: "text-emerald-100",
    chip: "#fde68a",
    network: "DEBIT",
  },
  "Amex Blue Cash": {
    gradient: "from-sky-500 via-blue-600 to-indigo-800",
    barGradient: "from-sky-400 via-blue-400 to-indigo-400",
    accent: "text-sky-100",
    chip: "#fef08a",
    network: "AMEX",
  },
  "Venture X": {
    gradient: "from-zinc-800 via-neutral-900 to-amber-950",
    barGradient: "from-amber-400 via-orange-400 to-yellow-400",
    accent: "text-amber-100",
    chip: "#fcd34d",
    network: "VISA",
  },
  "Chase Amazon": {
    gradient: "from-orange-500 via-amber-600 to-orange-900",
    barGradient: "from-orange-400 via-amber-400 to-yellow-400",
    accent: "text-orange-100",
    chip: "#fef3c7",
    network: "VISA",
  },
  "Discover Card": {
    gradient: "from-orange-600 via-red-700 to-orange-950",
    barGradient: "from-orange-400 via-rose-400 to-red-500",
    accent: "text-orange-100",
    chip: "#fed7aa",
    network: "DISC",
  },
  "Costco Credit Card": {
    gradient: "from-red-600 via-red-800 to-red-950",
    barGradient: "from-red-400 via-rose-500 to-pink-500",
    accent: "text-red-100",
    chip: "#fecaca",
    network: "CITI",
  },
  default: {
    gradient: "from-violet-600 via-purple-700 to-fuchsia-900",
    barGradient: "from-violet-400 via-fuchsia-500 to-purple-500",
    accent: "text-violet-100",
    chip: "#e9d5ff",
    network: "CARD",
  },
};

export function accountKeyForTransaction(tx) {
  return tx.card_identity || tx.source || "Unknown";
}

export function themeForAccount(label) {
  return CARD_THEMES[label] ?? CARD_THEMES.default;
}

export function listAccountsFromTransactions(transactions) {
  const map = new Map();
  for (const tx of transactions) {
    const key = accountKeyForTransaction(tx);
    const entry = map.get(key) ?? { id: key, label: key, total: 0, count: 0 };
    entry.total += Math.abs(Number(tx.amount) || 0);
    entry.count += 1;
    map.set(key, entry);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export function listAccountsForPeriod(transactions, month = "ALL") {
  const rows =
    month && month !== "ALL"
      ? transactions.filter((t) => monthKey(t.date) === month)
      : transactions;
  return listAccountsFromTransactions(rows);
}

export function filterByAccount(transactions, accountId) {
  if (!accountId) return transactions;
  return transactions.filter((tx) => accountKeyForTransaction(tx) === accountId);
}

export function enrichAccountsFromTransactions(transactions) {
  const accounts = listAccountsFromTransactions(transactions);
  const grandTotal = accounts.reduce((sum, account) => sum + account.total, 0);
  const meta = new Map();

  for (const tx of transactions) {
    if (tx.category === "Credit Card Payments") continue;
    const key = accountKeyForTransaction(tx);
    const entry = meta.get(key) ?? { lastDate: null, categories: new Map() };
    if (!entry.lastDate || tx.date > entry.lastDate) entry.lastDate = tx.date;
    const category = tx.category || "Other";
    entry.categories.set(
      category,
      (entry.categories.get(category) ?? 0) + Math.abs(Number(tx.amount) || 0),
    );
    meta.set(key, entry);
  }

  return accounts.map((account) => {
    const details = meta.get(account.id) ?? { lastDate: null, categories: new Map() };
    let topCategory = null;
    let topCategoryTotal = 0;
    for (const [category, total] of details.categories) {
      if (total > topCategoryTotal) {
        topCategory = category;
        topCategoryTotal = total;
      }
    }

    return {
      ...account,
      sharePct: grandTotal > 0 ? (account.total / grandTotal) * 100 : 0,
      avgTxn: account.count > 0 ? account.total / account.count : 0,
      lastDate: details.lastDate,
      topCategory,
      topCategoryTotal,
    };
  });
}
