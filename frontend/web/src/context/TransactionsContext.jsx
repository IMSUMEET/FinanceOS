import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import seed from "../data/mockTransactions";
import { monthKey } from "../utils/format";
import {
  categoryBreakdown,
  merchantBreakdown,
  monthlyByCategory,
  monthlyTotals,
} from "../utils/insights";
import {
  importTransactions,
  listTransactions,
  updateTransactionCategory,
  deleteTransaction,
  _replaceAllMock,
} from "../services/transactions";
import { USE_MOCK } from "../api/client";

export const ALL_MONTHS_SENTINEL = "ALL";
// eslint-disable-next-line react-refresh/only-export-components
export const TransactionsContext = createContext(null);

export function TransactionsProvider({ children }) {
  // Initial paint uses the seed for zero-flicker; the effect below re-hydrates
  // from the service layer so the same code path runs whether the backend is
  // mocked (USE_MOCK=true) or live (VITE_API_BASE_URL set).
  const [transactions, setTransactions] = useState(seed);
  const [filters, setFilters] = useState({
    month: ALL_MONTHS_SENTINEL,
    categories: [],
    search: "",
    amountMin: null,
    amountMax: null,
  });

  useEffect(() => {
    let cancelled = false;
    listTransactions()
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res?.rows) ? res.rows : [];
        if (rows.length) setTransactions(rows);
      })
      .catch((err) => {
        // Surface to console for dev — UI keeps working with the seed it already has.
        console.warn("[transactions] hydrate failed, using seed", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const months = useMemo(() => {
    const set = new Set(transactions.map((t) => monthKey(t.date)));
    return Array.from(set).filter(Boolean).sort();
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filters.month !== ALL_MONTHS_SENTINEL && monthKey(t.date) !== filters.month) {
        return false;
      }
      if (filters.categories.length && !filters.categories.includes(t.category)) {
        return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hay = `${t.merchant_normalized ?? ""} ${t.merchant_raw ?? ""} ${t.description ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const amt = Math.abs(Number(t.amount ?? 0));
      if (filters.amountMin != null && amt < filters.amountMin) return false;
      if (filters.amountMax != null && amt > filters.amountMax) return false;
      return true;
    });
  }, [transactions, filters]);

  const derived = useMemo(
    () => ({
      monthly: monthlyTotals(filtered),
      monthlyByCategory: monthlyByCategory(filtered),
      categories: categoryBreakdown(filtered),
      merchants: merchantBreakdown(filtered),
    }),
    [filtered],
  );

  const addMany = useCallback(async (rows) => {
    try {
      const res = await importTransactions({ rows });
      const stamped = Array.isArray(res?.rows) ? res.rows : [];
      setTransactions((prev) => [...prev, ...stamped]);
    } catch (err) {
      console.warn("[transactions] import failed", err);
    }
  }, []);

  const replaceAll = useCallback(async (rows) => {
    setTransactions(rows);
    if (USE_MOCK) {
      await _replaceAllMock(rows);
    }
  }, []);

  const updateCategory = useCallback(async (id, category) => {
    // Optimistic update so the UI feels instant.
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, category } : t)),
    );
    try {
      await updateTransactionCategory(id, category);
    } catch (err) {
      console.warn("[transactions] updateCategory failed", err);
    }
  }, []);

  const removeOne = useCallback(async (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTransaction(id);
    } catch (err) {
      console.warn("[transactions] delete failed", err);
    }
  }, []);

  const value = {
    ALL_MONTHS_SENTINEL,
    transactions,
    filtered,
    months,
    filters,
    setFilters,
    derived,
    addMany,
    replaceAll,
    updateCategory,
    removeOne,
  };

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}
