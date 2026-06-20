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
  const neg = n < 0 ? "-" : "";
  const sign = signed && n > 0 ? "+" : "";
  const abs = Math.abs(n);
  return neg + sign + fmt.format(abs === 0 ? 0 : abs);
}

export function formatAmountSpend(amount) {
  // Spend rows are stored as negatives; show as positive currency.
  return formatCurrency(Math.abs(Number(amount ?? 0)));
}

export function formatPct(value, digits = 1) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function parseCalendarDate(iso, day = 1) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return new Date(`${iso}T12:00:00Z`);
  }
  if (/^\d{4}-\d{2}$/.test(iso)) {
    const paddedDay = String(day).padStart(2, "0");
    return new Date(`${iso}-${paddedDay}T12:00:00Z`);
  }
  return new Date(iso);
}

export function formatDate(iso, opts = { month: "short", day: "numeric" }) {
  if (!iso) return "";
  const d = parseCalendarDate(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
}

export function formatMonth(iso) {
  if (!iso) return "";
  const d = parseCalendarDate(iso, 1);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
}

export function monthKey(iso) {
  return (iso ?? "").slice(0, 7);
}
