import { monthKey } from "./format";

const CARD_THEMES = {
  // Chase
  "Chase Checking": {
    gradient: "from-blue-700 via-blue-800 to-slate-900",
    barGradient: "from-blue-400 via-cyan-400 to-teal-400",
    accent: "text-blue-200",
    chip: "#fde68a",
    network: "DEBIT",
  },
  "Chase Sapphire": {
    gradient: "from-blue-900 via-indigo-950 to-slate-950",
    barGradient: "from-sky-400 via-indigo-400 to-blue-500",
    accent: "text-sky-200",
    chip: "#bfdbfe",
    network: "VISA",
  },
  "Chase Amazon": {
    gradient: "from-slate-800 via-zinc-900 to-neutral-950",
    barGradient: "from-amber-400 via-orange-400 to-yellow-500",
    accent: "text-amber-200",
    chip: "#fde047",
    network: "VISA",
  },
  "Chase Freedom": {
    gradient: "from-cyan-700 via-blue-900 to-slate-950",
    barGradient: "from-cyan-400 via-teal-400 to-sky-400",
    accent: "text-cyan-200",
    chip: "#a5f3fc",
    network: "VISA",
  },
  // Capital One
  "Venture X": {
    gradient: "from-zinc-900 via-neutral-950 to-slate-900",
    barGradient: "from-amber-400 via-orange-400 to-yellow-400",
    accent: "text-amber-200",
    chip: "#fcd34d",
    network: "VISA",
  },
  "Capital One 360": {
    gradient: "from-rose-800 via-red-900 to-slate-950",
    barGradient: "from-red-400 via-rose-400 to-orange-400",
    accent: "text-rose-200",
    chip: "#fecdd3",
    network: "DEBIT",
  },
  // Amex
  "Amex Blue Cash": {
    gradient: "from-sky-600 via-blue-700 to-indigo-900",
    barGradient: "from-sky-400 via-blue-400 to-indigo-400",
    accent: "text-sky-100",
    chip: "#93c5fd",
    network: "AMEX",
  },
  // Citi
  "Costco Credit Card": {
    gradient: "from-red-700 via-red-900 to-slate-950",
    barGradient: "from-red-400 via-rose-500 to-pink-500",
    accent: "text-red-200",
    chip: "#fecaca",
    network: "VISA",
  },
  "Citi Strata": {
    gradient: "from-sky-800 via-slate-900 to-blue-950",
    barGradient: "from-sky-300 via-cyan-400 to-blue-400",
    accent: "text-sky-200",
    chip: "#bae6fd",
    network: "MASTERCARD",
  },
  // Discover
  "Discover Card": {
    gradient: "from-orange-600 via-amber-700 to-orange-950",
    barGradient: "from-orange-400 via-amber-400 to-yellow-500",
    accent: "text-orange-200",
    chip: "#fed7aa",
    network: "DISCOVER",
  },
  // PlayStation / Sony
  "PlayStation Card": {
    gradient: "from-indigo-800 via-blue-900 to-slate-950",
    barGradient: "from-blue-400 via-indigo-400 to-purple-500",
    accent: "text-indigo-200",
    chip: "#c7d2fe",
    network: "VISA",
  },
  default: {
    gradient: "from-slate-800 via-indigo-950 to-slate-950",
    barGradient: "from-indigo-400 via-purple-400 to-violet-500",
    accent: "text-indigo-200",
    chip: "#e9d5ff",
    network: "CARD",
  },
};

export function accountKeyForTransaction(tx) {
  return tx.card_identity || tx.source || "Unknown";
}

export function themeForAccount(label = "") {
  const l = label.toLowerCase();
  if (CARD_THEMES[label]) return CARD_THEMES[label];
  if (l.includes("venture")) return CARD_THEMES["Venture X"];
  if (l.includes("chase") && l.includes("checking")) return CARD_THEMES["Chase Checking"];
  if (l.includes("amazon")) return CARD_THEMES["Chase Amazon"];
  if (l.includes("sapphire")) return CARD_THEMES["Chase Sapphire"];
  if (l.includes("freedom")) return CARD_THEMES["Chase Freedom"];
  if (l.includes("amex") || l.includes("blue cash")) return CARD_THEMES["Amex Blue Cash"];
  if (l.includes("costco")) return CARD_THEMES["Costco Credit Card"];
  if (l.includes("strata") || l.includes("citi")) return CARD_THEMES["Citi Strata"];
  if (l.includes("discover")) return CARD_THEMES["Discover Card"];
  if (l.includes("playstation") || l.includes("sony")) return CARD_THEMES["PlayStation Card"];
  if (l.includes("capital one") || l.includes("360")) return CARD_THEMES["Capital One 360"];
  return CARD_THEMES.default;
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
