export function formatMonthLabel(ym) {
  if (!ym || typeof ym !== "string" || ym.length < 7) return ym ?? "—";
  const [y, m] = ym.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  if (Number.isNaN(d.getTime())) return ym;
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export function formatMoney(n) {
  const x = Number(n) || 0;
  return x < 0 ? `-$${Math.abs(x).toFixed(2)}` : `$${x.toFixed(2)}`;
}

export function formatPercentChange(current, previous) {
  const c = Number(current);
  const p = Number(previous);
  if (!Number.isFinite(c) || !Number.isFinite(p) || p === 0) return null;
  return ((c - p) / Math.abs(p)) * 100;
}

export function formatSignedPercent(pct) {
  if (pct == null || Number.isNaN(pct)) return "—";
  const rounded = Math.abs(pct) >= 10 ? pct.toFixed(0) : pct.toFixed(1);
  const sign = pct > 0 ? "+" : "";
  return `${sign}${rounded}%`;
}
