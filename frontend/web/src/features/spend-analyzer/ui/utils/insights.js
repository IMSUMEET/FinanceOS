import { formatMonthLabel } from "./format.js";

export function topEntryByTotal(rows, nameKey) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  let best = null;
  for (const r of rows) {
    const v = Math.abs(Number(r.total) || 0);
    const name = r[nameKey];
    if (!best || v > best.value) best = { name, value: v };
  }
  return best;
}

/**
 * Build 2–4 human-sounding insight strings from analytics snapshots.
 */
export function buildSmartInsights({
  categoryBreakdown,
  merchantBreakdown,
  monthlyData,
  prevCategoryBreakdown,
  comparisonMode,
}) {
  const out = [];

  const topCat = topEntryByTotal(categoryBreakdown, "category");
  const topMer = topEntryByTotal(merchantBreakdown, "merchant");
  if (topCat?.name) {
    out.push(`${topCat.name} leads your spending in this view — worth a second look.`);
  }

  const months = Array.isArray(monthlyData) ? [...monthlyData].sort((a, b) => a.month.localeCompare(b.month)) : [];
  if (months.length >= 2) {
    const a = months[months.length - 2];
    const b = months[months.length - 1];
    const da = Math.abs(Number(a.total) || 0);
    const db = Math.abs(Number(b.total) || 0);
    if (da > 0 && db > da * 1.2) {
      out.push(`Spending jumped in ${formatMonthLabel(b.month)} compared to the prior month.`);
    } else if (db < da * 0.85 && da > 0) {
      out.push(`You spent less in ${formatMonthLabel(b.month)} than the month before — nice restraint.`);
    }
  }

  if (
    comparisonMode &&
    Array.isArray(prevCategoryBreakdown) &&
    prevCategoryBreakdown.length &&
    Array.isArray(categoryBreakdown)
  ) {
    const prevMap = new Map(prevCategoryBreakdown.map((c) => [c.category, Math.abs(Number(c.total) || 0)]));
    const curMap = new Map(categoryBreakdown.map((c) => [c.category, Math.abs(Number(c.total) || 0)]));
    let biggestShift = null;
    for (const [cat, cv] of curMap) {
      const pv = prevMap.get(cat) ?? 0;
      const delta = cv - pv;
      if (pv > 0 && Math.abs(delta) > biggestShift?.abs) {
        biggestShift = { cat, delta, abs: Math.abs(delta) };
      }
    }
    if (biggestShift && biggestShift.delta > 0) {
      out.push(`${biggestShift.cat} increased versus the prior period — that drove most of the change.`);
    }
  }

  const merTop = Array.isArray(merchantBreakdown) ? [...merchantBreakdown] : [];
  merTop.sort((a, b) => Math.abs(Number(b.total) || 0) - Math.abs(Number(a.total) || 0));
  if (merTop.length >= 2) {
    const first = merTop[0]?.merchant;
    const second = merTop[1]?.merchant;
    if (first && second) {
      out.push(`Your top merchants right now are ${first} and ${second}.`);
    }
  }

  if (Array.isArray(monthlyData) && monthlyData.length >= 3) {
    const totals = monthlyData.map((m) => Math.abs(Number(m.total) || 0));
    const mean = totals.reduce((s, v) => s + v, 0) / totals.length;
    const max = Math.max(...totals);
    if (mean > 0 && max > mean * 1.4) {
      out.push(`One month stands out above your usual run rate — check what clustered then.`);
    }
  }

  const uniq = [...new Set(out)];
  return uniq.slice(0, 4);
}

export function pickHeroInsight(insights, fallback) {
  if (Array.isArray(insights) && insights.length > 0) return insights[0];
  return fallback;
}
