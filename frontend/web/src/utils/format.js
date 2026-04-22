const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const usdShort = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCurrency(value, { compact = false, signed = false } = {}) {
  const n = Number(value ?? 0);
  const fmt = compact ? usdShort : usd;
  const sign = signed && n > 0 ? "+" : "";
  return sign + fmt.format(Math.abs(n) === 0 ? 0 : n);
}

export function formatAmountSpend(amount) {
  // Spend rows are stored as negatives; show as positive currency.
  return formatCurrency(Math.abs(Number(amount ?? 0)));
}

export function formatPct(value, digits = 1) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

export function formatDate(iso, opts = { month: "short", day: "numeric" }) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", opts);
}

export function formatMonth(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}-01`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function monthKey(iso) {
  return (iso ?? "").slice(0, 7);
}
