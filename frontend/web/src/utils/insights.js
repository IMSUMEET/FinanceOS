import { monthKey } from "./format";

const sumSpend = (rows) =>
  rows.reduce((s, r) => s + Math.abs(Number(r.amount ?? 0)), 0);

export function monthlyTotals(transactions) {
  const map = new Map();
  for (const t of transactions) {
    const key = monthKey(t.date);
    if (!key) continue;
    const cur = map.get(key) ?? { month: key, total: 0, count: 0 };
    cur.total += Math.abs(Number(t.amount ?? 0));
    cur.count += 1;
    map.set(key, cur);
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export function categoryBreakdown(transactions) {
  const map = new Map();
  for (const t of transactions) {
    const cat = t.category || "Other";
    const cur = map.get(cat) ?? { category: cat, total: 0, count: 0 };
    cur.total += Math.abs(Number(t.amount ?? 0));
    cur.count += 1;
    map.set(cat, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export function merchantBreakdown(transactions) {
  const map = new Map();
  for (const t of transactions) {
    const m = t.merchant_normalized || t.merchant_raw || "Unknown";
    const cur = map.get(m) ?? {
      merchant: m,
      total: 0,
      count: 0,
      category: t.category,
    };
    cur.total += Math.abs(Number(t.amount ?? 0));
    cur.count += 1;
    map.set(m, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export function monthlyByCategory(transactions) {
  // Returns: [{ month, [cat]: total, ... }]
  const map = new Map();
  for (const t of transactions) {
    const m = monthKey(t.date);
    if (!m) continue;
    const cur = map.get(m) ?? { month: m };
    const cat = t.category || "Other";
    cur[cat] = (cur[cat] ?? 0) + Math.abs(Number(t.amount ?? 0));
    map.set(m, cur);
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export function compareMonthOverMonth(transactions) {
  const totals = monthlyTotals(transactions);
  if (totals.length < 2) {
    return { current: totals[0] ?? null, previous: null, deltaPct: null, deltaAbs: 0 };
  }
  const [previous, current] = totals.slice(-2);
  const deltaAbs = current.total - previous.total;
  const deltaPct = previous.total > 0 ? (deltaAbs / previous.total) * 100 : null;
  return { current, previous, deltaPct, deltaAbs };
}

export function topCategoryMovers(transactions) {
  // Compare last full month to one before, return categories with the biggest swings.
  const months = monthlyByCategory(transactions);
  if (months.length < 2) return [];
  const [prev, cur] = months.slice(-2);
  const cats = new Set([
    ...Object.keys(prev).filter((k) => k !== "month"),
    ...Object.keys(cur).filter((k) => k !== "month"),
  ]);
  const movers = [];
  for (const c of cats) {
    const a = prev[c] ?? 0;
    const b = cur[c] ?? 0;
    const deltaAbs = b - a;
    const deltaPct = a > 0 ? (deltaAbs / a) * 100 : b > 0 ? 100 : 0;
    movers.push({ category: c, prev: a, current: b, deltaAbs, deltaPct });
  }
  return movers.sort((a, b) => Math.abs(b.deltaAbs) - Math.abs(a.deltaAbs));
}

export function detectRecurring(transactions) {
  // Merchants that show up in 3+ distinct months with similar amounts → likely subscriptions.
  const byMerchant = new Map();
  for (const t of transactions) {
    const key = t.merchant_normalized || t.merchant_raw || "Unknown";
    const m = monthKey(t.date);
    const cur = byMerchant.get(key) ?? { merchant: key, months: new Set(), amounts: [], category: t.category };
    cur.months.add(m);
    cur.amounts.push(Math.abs(Number(t.amount ?? 0)));
    byMerchant.set(key, cur);
  }
  const out = [];
  for (const v of byMerchant.values()) {
    if (v.months.size < 3) continue;
    const avg = v.amounts.reduce((s, x) => s + x, 0) / v.amounts.length;
    const variance =
      v.amounts.reduce((s, x) => s + (x - avg) ** 2, 0) / v.amounts.length;
    const stdev = Math.sqrt(variance);
    if (avg === 0) continue;
    if (stdev / avg <= 0.35) {
      out.push({
        merchant: v.merchant,
        category: v.category,
        cadence: v.months.size,
        avg,
        annualized: avg * 12,
      });
    }
  }
  return out.sort((a, b) => b.annualized - a.annualized);
}

export function weekdayVsWeekend(transactions) {
  let weekday = 0;
  let weekend = 0;
  for (const t of transactions) {
    if (!t.date) continue;
    const d = new Date(t.date);
    const day = d.getDay();
    const amt = Math.abs(Number(t.amount ?? 0));
    if (day === 0 || day === 6) weekend += amt;
    else weekday += amt;
  }
  const total = weekday + weekend;
  return {
    weekday,
    weekend,
    weekdayPct: total ? (weekday / total) * 100 : 0,
    weekendPct: total ? (weekend / total) * 100 : 0,
  };
}

export function topAnomalies(transactions, n = 5) {
  // Single-transaction outliers vs that merchant's median.
  const byMerchant = new Map();
  for (const t of transactions) {
    const k = t.merchant_normalized || t.merchant_raw || "Unknown";
    const cur = byMerchant.get(k) ?? { merchant: k, items: [] };
    cur.items.push(t);
    byMerchant.set(k, cur);
  }
  const flagged = [];
  for (const v of byMerchant.values()) {
    if (v.items.length < 3) continue;
    const amounts = v.items.map((x) => Math.abs(Number(x.amount ?? 0))).sort((a, b) => a - b);
    const median = amounts[Math.floor(amounts.length / 2)];
    if (!median) continue;
    const max = v.items.reduce(
      (best, t) => (Math.abs(t.amount) > Math.abs(best.amount) ? t : best),
      v.items[0],
    );
    const ratio = Math.abs(max.amount) / median;
    if (ratio >= 2) {
      flagged.push({ ...max, median, ratio });
    }
  }
  return flagged.sort((a, b) => b.ratio - a.ratio).slice(0, n);
}

export function dailyAverage(transactions) {
  if (!transactions.length) return 0;
  const dates = new Set(transactions.map((t) => t.date));
  const total = sumSpend(transactions);
  return total / Math.max(dates.size, 1);
}

export function totalSpend(transactions) {
  return sumSpend(transactions);
}
