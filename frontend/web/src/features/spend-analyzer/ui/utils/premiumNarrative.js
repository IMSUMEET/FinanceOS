import { formatMoney, formatMonthLabel } from "./format.js";

function abs(n) {
  return Math.abs(Number(n) || 0);
}

function sumTotals(rows) {
  if (!Array.isArray(rows)) return 0;
  return rows.reduce((s, r) => s + abs(r?.total), 0);
}

function mapByName(rows, nameKey) {
  const m = new Map();
  if (!Array.isArray(rows)) return m;
  for (const r of rows) {
    const name = r?.[nameKey];
    if (!name) continue;
    m.set(name, r?.total ?? 0);
  }
  return m;
}

function percentChange(cur, prev) {
  const c = Number(cur);
  const p = Number(prev);
  if (!Number.isFinite(c) || !Number.isFinite(p) || p === 0) return null;
  return ((c - p) / Math.abs(p)) * 100;
}

function includesAny(haystack, needles) {
  if (!haystack) return false;
  const t = String(haystack).toLowerCase();
  return needles.some((n) => t.includes(n));
}

function parseCreatedHour(createdAt) {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.getHours();
}

function getTxnsSorted(transactions) {
  const safe = Array.isArray(transactions) ? transactions : [];
  return [...safe].sort((a, b) => {
    const ad = a?.created_at ? new Date(a.created_at).getTime() : null;
    const bd = b?.created_at ? new Date(b.created_at).getTime() : null;
    if (Number.isFinite(ad) && Number.isFinite(bd)) return bd - ad;
    // fallback: lexical date ordering (YYYY-MM-DD) is ok
    return String(b?.date || "").localeCompare(String(a?.date || ""));
  });
}

export function classifySpendingPersonality({ categoryBreakdown, transactions }) {
  const total = sumTotals(categoryBreakdown);
  const cats = Array.isArray(categoryBreakdown) ? categoryBreakdown : [];

  const subTotal = cats
    .filter((c) => includesAny(c?.category, ["subscription", "subscriptions"]))
    .reduce((s, c) => s + abs(c?.total), 0);

  const groceryTotal = cats
    .filter((c) => includesAny(c?.category, ["groc", "market", "supermarket"]))
    .reduce((s, c) => s + abs(c?.total), 0);

  const deliveryTotal = cats
    .filter((c) => includesAny(c?.category, ["delivery", "dining", "restaurant", "food", "uber", "doordash"]))
    .reduce((s, c) => s + abs(c?.total), 0);

  const weekendShare = (() => {
    const sorted = getTxnsSorted(transactions).slice(0, 25);
    if (!sorted.length) return 0;
    let w = 0;
    for (const t of sorted) {
      const dt = t?.date ? new Date(t.date + "T12:00:00") : null;
      if (!dt || Number.isNaN(dt.getTime())) continue;
      const day = dt.getDay(); // 0 Sun ... 6 Sat
      if (day === 0 || day === 6) w += 1;
    }
    return w / Math.max(1, sorted.length);
  })();

  const subShare = total > 0 ? subTotal / total : 0;
  const groceryShare = total > 0 ? groceryTotal / total : 0;
  const deliveryShare = total > 0 ? deliveryTotal / total : 0;

  if (subShare >= 0.12) {
    return { label: "Subscription Heavy", tone: "indigo", message: "This month, you lean on recurring spend." };
  }
  if (weekendShare >= 0.42) {
    return { label: "Weekend Spiker", tone: "amber", message: "Your spend concentrates on weekends." };
  }
  if (groceryShare >= 0.35) {
    return { label: "Bulk Optimizer", tone: "emerald", message: "Your grocery pattern looks intentional and clustered." };
  }
  if (deliveryShare >= 0.35) {
    return { label: "Convenience Spender", tone: "amber", message: "Convenience spend is driving your totals this month." };
  }

  return { label: "Balanced Planner", tone: "indigo", message: "Your spending is steady — the best wins are small optimizations." };
}

export function buildBehavioralInsights(transactions) {
  const sorted = getTxnsSorted(transactions);
  if (!sorted.length) return [];

  const hourFromTxn = (t) => parseCreatedHour(t?.created_at);
  const isFood = (t) =>
    includesAny(t?.category, ["food", "dining", "restaurant", "coffee", "bar", "snack"]) ||
    includesAny(t?.merchant_normalized, ["doordash", "ubereats", "uber", "grubhub"]) ||
    includesAny(t?.merchant_raw, ["doordash", "ubereats", "uber"]);

  const foodTxns = sorted.filter(isFood).slice(0, 10);
  if (foodTxns.length >= 5) {
    const last5 = foodTxns.slice(0, 5);
    let after9 = 0;
    let ok = 0;
    for (const t of last5) {
      const h = hourFromTxn(t);
      if (h == null) continue;
      ok += 1;
      if (h >= 21) after9 += 1;
    }
    if (ok >= 3) {
      return [
        {
          key: "food-after-9pm",
          tone: "amber",
          icon: "☾",
          text: `${after9} of your last 5 food orders happened after 9PM.`,
          hint: "Evening habits are the easiest to adjust.",
        },
      ];
    }
  }

  // Grocery repeat visits in the last 7 days (based on max date in current transaction slice)
  const maxDate = sorted[0]?.date;
  const maxDt = maxDate ? new Date(maxDate + "T12:00:00") : null;
  if (maxDt && !Number.isNaN(maxDt.getTime())) {
    const start = new Date(maxDt);
    start.setDate(start.getDate() - 6);
    const end = new Date(maxDt);

    const isGrocery = (t) => includesAny(t?.category, ["groc", "market", "supermarket"]);
    const groceryTxns = sorted.filter((t) => {
      if (!t?.date) return false;
      const d = new Date(t.date + "T12:00:00");
      if (!d || Number.isNaN(d.getTime())) return false;
      return d >= start && d <= end && isGrocery(t);
    });

    const counts = new Map();
    for (const t of groceryTxns) {
      const name = t?.merchant_normalized || t?.merchant_raw || "Unknown";
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 4) {
      return [
        {
          key: "grocery-repeat",
          tone: "indigo",
          icon: "↻",
          text: `You visited ${top[0]} ${top[1]} times in the last 7 days.`,
          hint: "Consolidating trips can cut the “convenience” tax.",
        },
      ];
    }
  }

  // Frequency vs average order size (last 7 days vs previous 7 days)
  if (sorted.length >= 8) {
    const dates = sorted.map((t) => t?.date).filter(Boolean);
    if (dates.length >= 2) {
      const maxD = new Date(Math.max(...dates.map((d) => new Date(d + "T12:00:00").getTime())));
      const curStart = new Date(maxD);
      curStart.setDate(curStart.getDate() - 6);

      const prevEnd = new Date(curStart);
      prevEnd.setDate(prevEnd.getDate() - 1);

      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - 6);

      const absAmt = (t) => abs(t?.amount);
      const curWindow = sorted.filter((t) => {
        const d = t?.date ? new Date(t.date + "T12:00:00") : null;
        return d && d >= curStart && d <= maxD;
      });
      const prevWindow = sorted.filter((t) => {
        const d = t?.date ? new Date(t.date + "T12:00:00") : null;
        return d && d >= prevStart && d <= prevEnd;
      });

      if (curWindow.length >= 4 && prevWindow.length >= 4) {
        const avgCur = curWindow.reduce((s, t) => s + absAmt(t), 0) / curWindow.length;
        const avgPrev = prevWindow.reduce((s, t) => s + absAmt(t), 0) / prevWindow.length;

        if (curWindow.length > prevWindow.length * 1.2 && avgCur < avgPrev * 0.9) {
          return [
            {
              key: "freq-downsize",
              tone: "emerald",
              icon: "◎",
              text: `Your average order size dropped, but frequency increased.`,
              hint: "You’re buying more often; small caps matter.",
            },
          ];
        }
      }
    }
  }

  return [
    {
      key: "behavioral-generic",
      tone: "indigo",
      icon: "✦",
      text: "Your spending has a pattern — small shifts create outsized impact.",
      hint: "Open the drill panel for the biggest levers.",
    },
  ];
}

export function buildPredictionInsight({ monthlyData }) {
  const months = Array.isArray(monthlyData) ? [...monthlyData].sort((a, b) => a.month.localeCompare(b.month)) : [];
  if (months.length < 2) return null;

  const a = months[months.length - 2];
  const b = months[months.length - 1];
  const prev = abs(a?.total);
  const cur = abs(b?.total);
  if (prev <= 0 || cur <= 0) return null;

  const pct = ((cur - prev) / prev) * 100;
  const predicted = cur * (cur / prev); // carry forward recent momentum

  const pctText = Math.abs(pct) >= 10 ? `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%` : `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

  return {
    key: "prediction",
    tone: "indigo",
    icon: "↗",
    shortText: `At this pace, you’ll spend about ${formatMoney(predicted)} next month.`,
    text: `At this pace, you’ll spend about ${formatMoney(predicted)} next month (${pctText} vs last).`,
    hint: "You can change this by targeting the top 1–2 drivers.",
  };
}

export function buildActionSuggestion({ transactions, categoryBreakdown, prevCategoryBreakdown }) {
  const sorted = getTxnsSorted(transactions);
  const last7 = (() => {
    if (!sorted.length) return [];
    const maxDate = sorted[0]?.date;
    const maxDt = maxDate ? new Date(maxDate + "T12:00:00") : null;
    if (!maxDt || Number.isNaN(maxDt.getTime())) return [];
    const start = new Date(maxDt);
    start.setDate(start.getDate() - 6);
    return sorted.filter((t) => {
      const d = t?.date ? new Date(t.date + "T12:00:00") : null;
      return d && d >= start && d <= maxDt;
    });
  })();

  const isDelivery = (t) =>
    includesAny(t?.merchant_normalized, ["doordash", "ubereats", "uber eats", "uber", "grubhub", "instacart"]) ||
    includesAny(t?.category, ["delivery"]);

  const deliveryTxns = last7.filter(isDelivery);
  if (deliveryTxns.length >= 3) {
    const avg = deliveryTxns.reduce((s, t) => s + abs(t?.amount), 0) / deliveryTxns.length;
    const savings = avg * 2 * 4; // “cut 2 orders/week”
    return {
      key: "suggest-delivery",
      tone: "amber",
      text: `Cut 2 delivery orders/week to save about ${formatMoney(savings)}/month.`,
      hint: "Start with the next 2 weeks — then reassess.",
    };
  }

  // Fallback: biggest positive category delta
  const prevMap = mapByName(prevCategoryBreakdown, "category");
  const curCats = Array.isArray(categoryBreakdown) ? categoryBreakdown : [];

  let best = null;
  for (const c of curCats) {
    const name = c?.category;
    if (!name) continue;
    const cur = abs(c?.total);
    const prev = abs(prevMap.get(name) || 0);
    if (prev <= 0) continue;
    const d = cur - prev;
    const pct = percentChange(cur, prev);
    if (pct == null) continue;
    if (d > 0 && (!best || d > best.abs)) best = { name, pct, abs: d };
  }

  if (best) {
    const curAmt = abs(curCats.find((x) => x?.category === best.name)?.total);
    const savings = curAmt * 0.1; // 10% trim of the biggest driver
    const isGroc = includesAny(best.name, ["groc", "market", "supermarket"]);
    return {
      key: "suggest-category",
      tone: isGroc ? "emerald" : "amber",
      text: isGroc
        ? `Combine grocery trips to trim ${best.name} by ~10% and save about ${formatMoney(savings)} in the next month.`
        : `Trim ${best.name} by ~10% and save about ${formatMoney(savings)} in the next month.`,
      hint: "This keeps changes realistic and measurable.",
    };
  }

  return {
    key: "suggest-generic",
    tone: "indigo",
    text: "Pick your top 1 driver, then change just one behavior for two weeks. That’s how you win fast.",
    hint: "The drill panel shows the exact transactions to target.",
  };
}

export function buildWhatChangedItems({
  categoryBreakdown,
  prevCategoryBreakdown,
  merchantBreakdown,
  prevMerchantBreakdown,
  dateFrom,
  dateTo,
}) {
  const curTotal = sumTotals(categoryBreakdown);
  const prevTotal = sumTotals(prevCategoryBreakdown);
  const delta = curTotal - prevTotal;

  const compareLabel = dateFrom && dateTo ? "vs prior period" : "vs last month";

  const curMer = Array.isArray(merchantBreakdown) ? merchantBreakdown : [];
  const prevMerMap = mapByName(prevMerchantBreakdown, "merchant");

  const curMerWithDelta = curMer
    .map((m) => {
      const name = m?.merchant;
      const c = abs(m?.total);
      const p = abs(prevMerMap.get(name) || 0);
      return { name, cur: c, prev: p, delta: c - p, pct: percentChange(c, p) };
    })
    .filter((x) => x.name && x.prev > 0);

  curMerWithDelta.sort((a, b) => b.delta - a.delta);
  const driverMer = curMerWithDelta[0]?.name || null;

  const curCats = Array.isArray(categoryBreakdown) ? categoryBreakdown : [];
  const prevCatsMap = mapByName(prevCategoryBreakdown, "category");
  const catDelta = curCats
    .map((c) => {
      const name = c?.category;
      const cur = abs(c?.total);
      const prev = abs(prevCatsMap.get(name) || 0);
      return { name, cur, prev, delta: cur - prev, pct: percentChange(cur, prev) };
    })
    .filter((x) => x.name && x.prev > 0);

  catDelta.sort((a, b) => b.delta - a.delta);
  const driverCat = catDelta[0]?.name || null;

  const line1 = (() => {
    if (delta === 0) return null;
    const amtText = `${delta >= 0 ? "+" : "-"}${formatMoney(abs(delta))}`;
    const driver = driverMer || driverCat;
    const tone = delta >= 0 ? "amber" : "emerald";
    if (!driver) return null;
    return {
      key: "changed-total-driver",
      tone,
      delta: amtText.replace("$", ""), // keep it compact
      text: `${amtText} ${compareLabel} — mostly ${delta >= 0 ? "driven by" : "held back by"} ${driver}.`,
      drill: {
        type: driverMer ? "merchant" : "category",
        value: driverMer ? driverMer : driverCat,
      },
    };
  })();

  // subscription-ish
  const subCats = catDelta.filter((x) => includesAny(x.name, ["subscription", "subscriptions"]));
  subCats.sort((a, b) => (b.pct ?? -Infinity) - (a.pct ?? -Infinity));
  const subTop = subCats.find((x) => x.pct != null);
  const line2 = subTop
    ? {
        key: "changed-subscriptions",
        tone: (subTop.pct ?? 0) >= 0 ? "amber" : "emerald",
        delta: `${subTop.pct >= 0 ? "+" : ""}${(subTop.pct ?? 0).toFixed(0)}%`,
        text: `Subscriptions moved ${subTop.pct >= 0 ? "up" : "down"} ${Math.abs(subTop.pct).toFixed(0)}% ${compareLabel}.`,
        drill: { type: "category", value: subTop.name },
      }
    : null;

  // groceries + dining
  const grocery = [...catDelta].filter((x) => includesAny(x.name, ["groc", "market", "supermarket"]));
  grocery.sort((a, b) => a.delta - b.delta); // most negative first
  const groceryTopDown = grocery[0] || null;

  const dining = [...catDelta].filter((x) => includesAny(x.name, ["dine", "restaurant", "food"]));
  dining.sort((a, b) => b.delta - a.delta); // most positive first
  const diningTopUp = dining[0] || null;

  const line3 = (() => {
    if (groceryTopDown?.name && diningTopUp?.name) {
      return {
        key: "changed-groc-dining",
        tone: diningTopUp.delta >= 0 ? "amber" : "emerald",
        delta: "",
        text: `Groceries dipped but dining increased — you’re shifting spend ${compareLabel}.`,
        drill: { type: "category", value: diningTopUp.name },
      };
    }
    if (catDelta.length >= 2) {
      const biggestDown = [...catDelta].sort((a, b) => a.delta - b.delta)[0];
      const biggestUp = [...catDelta].sort((a, b) => b.delta - a.delta)[0];
      if (biggestDown?.name && biggestUp?.name) {
        return {
          key: "changed-up-down",
          tone: biggestUp.delta >= 0 ? "amber" : "emerald",
          delta: "",
          text: `${biggestDown.name} dropped while ${biggestUp.name} increased ${compareLabel}.`,
          drill: { type: "category", value: biggestUp.name },
        };
      }
    }
    return null;
  })();

  const raw = [line1, line2, line3].filter(Boolean);

  return raw.map((it) => ({
    key: it.key,
    tone: it.tone,
    delta: it.delta,
    text: it.text,
    drill: it.drill,
  }));
}

