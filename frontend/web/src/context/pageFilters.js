import { monthKey } from "../utils/format";

export const ALL_MONTHS_SENTINEL = "ALL";

export const PAGE_KEYS = ["overview", "transactions", "categories", "insights"];

function accountKeyForRow(tx) {
  return tx.card_identity || tx.source || "Unknown";
}

export function createDefaultPageFilters() {
  return {
    month: ALL_MONTHS_SENTINEL,
    account: null,
    categories: [],
    search: "",
    amountMin: null,
    amountMax: null,
  };
}

export function createInitialPageFilters() {
  return Object.fromEntries(PAGE_KEYS.map((key) => [key, createDefaultPageFilters()]));
}

export function pathnameToPageKey(pathname) {
  if (pathname === "/transactions") return "transactions";
  if (pathname.startsWith("/categories")) return "categories";
  if (pathname === "/insights") return "insights";
  return "overview";
}

export function applyFiltersToRows(rows, filters, { includeCategories = true } = {}) {
  return rows.filter((t) => {
    if (filters.month !== ALL_MONTHS_SENTINEL && monthKey(t.date) !== filters.month) {
      return false;
    }
    if (filters.account && accountKeyForRow(t) !== filters.account) {
      return false;
    }
    if (
      includeCategories &&
      filters.categories.length &&
      !filters.categories.includes(t.category)
    ) {
      return false;
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const hay =
        `${t.merchant_normalized ?? ""} ${t.merchant_raw ?? ""} ${t.description ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    const amt = Math.abs(Number(t.amount ?? 0));
    if (filters.amountMin != null && amt < filters.amountMin) return false;
    if (filters.amountMax != null && amt > filters.amountMax) return false;
    return true;
  });
}
