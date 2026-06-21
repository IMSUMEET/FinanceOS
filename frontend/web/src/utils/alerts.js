import { detectRecurring, topAnomalies, topCategoryMovers } from "./insights";
import { formatAmountSpend, formatCurrency, formatPct } from "./format";
import { ALERTS_SEEN_KEY } from "../constants/storage";

export function readSeenAlertIds() {
  try {
    const raw = localStorage.getItem(ALERTS_SEEN_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function markAlertsSeen(ids) {
  if (!ids?.length) return;
  const seen = readSeenAlertIds();
  for (const id of ids) seen.add(id);
  try {
    localStorage.setItem(ALERTS_SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    /* ignore */
  }
}

export function clearSeenAlerts() {
  try {
    localStorage.removeItem(ALERTS_SEEN_KEY);
  } catch {
    /* ignore */
  }
}

export function buildAlerts(transactions) {
  const items = [];
  const movers = topCategoryMovers(transactions);
  if (movers.length) {
    const [m] = movers;
    items.push({
      id: `mover-${m.category}`,
      icon: m.deltaAbs >= 0 ? "up" : "down",
      tone: m.deltaAbs >= 0 ? "warn" : "good",
      title: `${m.category} ${m.deltaAbs >= 0 ? "up" : "down"} ${formatPct(Math.abs(m.deltaPct))}`,
      body: `${formatCurrency(m.prev)} → ${formatCurrency(m.current)} vs last month.`,
      to: "/insights",
    });
  }
  const anomalies = topAnomalies(transactions, 1);
  if (anomalies.length) {
    const a = anomalies[0];
    items.push({
      id: `anomaly-${a.id}`,
      icon: "spark",
      tone: "warn",
      title: `Unusual charge at ${a.merchant_normalized}`,
      body: `${formatAmountSpend(a.amount)} — ${a.ratio.toFixed(1)}× the typical amount.`,
      to: "/transactions",
    });
  }
  const recurring = detectRecurring(transactions).slice(0, 1);
  if (recurring.length) {
    const r = recurring[0];
    items.push({
      id: `recur-${r.merchant}`,
      icon: "spark",
      tone: "info",
      title: `${r.merchant} runs every month`,
      body: `Roughly ${formatCurrency(r.avg)} per month — ${formatCurrency(r.annualized)} a year.`,
      to: "/insights",
    });
  }
  return items;
}

export function unreadAlertCount(transactions) {
  const seen = readSeenAlertIds();
  return buildAlerts(transactions).filter((a) => !seen.has(a.id)).length;
}
