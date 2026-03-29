/** Last calendar day of YYYY-MM as YYYY-MM-DD */
export function lastDayOfMonth(ym) {
  if (!ym || typeof ym !== "string") return "";
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return "";
  const d = new Date(y, m, 0);
  return d.toISOString().slice(0, 10);
}

/** Add days to YYYY-MM-DD string */
export function addDays(isoDate, days) {
  const d = new Date(isoDate + "T12:00:00");
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Inclusive day count between two YYYY-MM-DD dates */
export function daysBetweenInclusive(from, to) {
  const a = new Date(from + "T12:00:00");
  const b = new Date(to + "T12:00:00");
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.round((b - a) / 86400000) + 1;
}

/**
 * When user sets date range: previous period of equal length ending day before start.
 * When unset: derive last two months from monthly aggregates (YYYY-MM strings).
 */
export function computeComparisonWindow(dateFrom, dateTo, monthlyRows) {
  if (dateFrom && dateTo) {
    const n = daysBetweenInclusive(dateFrom, dateTo);
    if (n < 1) return null;
    const prevTo = addDays(dateFrom, -1);
    const prevFrom = addDays(prevTo, -(n - 1));
    return {
      mode: "range",
      current: { date_from: dateFrom, date_to: dateTo },
      previous: { date_from: prevFrom, date_to: prevTo },
    };
  }
  const sorted = Array.isArray(monthlyRows)
    ? [...monthlyRows].filter((r) => r?.month).sort((a, b) => a.month.localeCompare(b.month))
    : [];
  if (sorted.length < 2) return null;
  const last = sorted[sorted.length - 1].month;
  const prev = sorted[sorted.length - 2].month;
  return {
    mode: "months",
    current: { date_from: `${last}-01`, date_to: lastDayOfMonth(last), monthKey: last },
    previous: { date_from: `${prev}-01`, date_to: lastDayOfMonth(prev), monthKey: prev },
  };
}

export function getLastMonthKey(monthlyRows) {
  const sorted = Array.isArray(monthlyRows)
    ? [...monthlyRows].filter((r) => r?.month).sort((a, b) => a.month.localeCompare(b.month))
    : [];
  if (!sorted.length) return null;
  return sorted[sorted.length - 1].month;
}
