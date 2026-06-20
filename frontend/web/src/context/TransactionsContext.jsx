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
import { ANALYSIS_SESSION_KEY } from "../constants/sessionAnalysis";

export const ALL_MONTHS_SENTINEL = "ALL";
// eslint-disable-next-line react-refresh/only-export-components
export const TransactionsContext = createContext(null);

function readStoredAnalysis() {
  try {
    const raw = sessionStorage.getItem(ANALYSIS_SESSION_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw);
    if (j?.status === "success" && Array.isArray(j.transactions)) return j;
  } catch {
    /* ignore corrupt session */
  }
  return null;
}

export function TransactionsProvider({ children }) {
  const initialStored = readStoredAnalysis();
  const [transactions, setTransactions] = useState(() => {
    if (initialStored) return initialStored.transactions;
    return USE_MOCK ? seed : [];
  });
  const [restoredFromSession, setRestoredFromSession] = useState(Boolean(initialStored));
  const [filters, setFilters] = useState({
    month: ALL_MONTHS_SENTINEL,
    categories: [],
    search: "",
    amountMin: null,
    amountMax: null,
  });

  useEffect(() => {
    let cancelled = false;
    if (readStoredAnalysis()) return;
    if (!USE_MOCK) return;
    listTransactions()
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res?.rows) ? res.rows : [];
        if (rows.length) setTransactions(rows);
      })
      .catch((err) => {
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

  const applyFilters = useCallback(
    (rows, { includeCategories = true } = {}) =>
      rows.filter((t) => {
        if (filters.month !== ALL_MONTHS_SENTINEL && monthKey(t.date) !== filters.month) {
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
          const hay = `${t.merchant_normalized ?? ""} ${t.merchant_raw ?? ""} ${t.description ?? ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        const amt = Math.abs(Number(t.amount ?? 0));
        if (filters.amountMin != null && amt < filters.amountMin) return false;
        if (filters.amountMax != null && amt > filters.amountMax) return false;
        return true;
      }),
    [filters],
  );

  const filtered = useMemo(
    () => applyFilters(transactions),
    [transactions, applyFilters],
  );

  const scopeFiltered = useMemo(
    () => applyFilters(transactions, { includeCategories: false }),
    [transactions, applyFilters],
  );

  const derived = useMemo(
    () => ({
      monthly: monthlyTotals(filtered),
      monthlyByCategory: monthlyByCategory(filtered),
      categories: categoryBreakdown(filtered),
      merchants: merchantBreakdown(filtered),
    }),
    [filtered],
  );

  const categoryDerived = useMemo(
    () => ({
      monthly: monthlyTotals(scopeFiltered),
      monthlyByCategory: monthlyByCategory(scopeFiltered),
      categories: categoryBreakdown(scopeFiltered),
      merchants: merchantBreakdown(scopeFiltered),
    }),
    [scopeFiltered],
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

  const applyAnalysisResult = useCallback(async (analysis) => {
    if (!analysis || analysis.status !== "success" || !Array.isArray(analysis.transactions)) return;
    
    setTransactions((prev) => {
      const isSeed = prev.length === seed.length && prev.every((t, i) => t.merchant_raw === seed[i].merchant_raw && t.amount === seed[i].amount);
      const baseList = isSeed ? [] : prev;
      
      const seen = new Set();
      const merged = [];
      
      for (const t of baseList) {
        const key = `${t.date}|${t.merchant_raw}|${t.amount}|${t.card_identity || ""}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(t);
        }
      }
      
      for (const t of analysis.transactions) {
        const key = `${t.date}|${t.merchant_raw}|${t.amount}|${t.card_identity || ""}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(t);
        }
      }
      
      let nextId = 1;
      const stamped = merged.map((t) => ({ ...t, id: nextId++ }));
      
      if (USE_MOCK) {
        _replaceAllMock(stamped).catch(console.error);
      }
      
      const updatedAnalysis = { ...analysis, transactions: stamped };
      try {
        sessionStorage.setItem(ANALYSIS_SESSION_KEY, JSON.stringify(updatedAnalysis));
      } catch {
        // ignore
      }
      
      return stamped;
    });
    
    setRestoredFromSession(false);
  }, []);

  const clearSessionAnalysis = useCallback(async () => {
    try {
      sessionStorage.removeItem(ANALYSIS_SESSION_KEY);
    } catch {
      /* ignore */
    }
    if (USE_MOCK) {
      await replaceAll(seed);
    } else {
      setTransactions([]);
    }
    setRestoredFromSession(false);
  }, [replaceAll]);

  const updateCategory = useCallback(async (id, category) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, category } : t)));
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
    scopeFiltered,
    months,
    filters,
    setFilters,
    derived,
    categoryDerived,
    addMany,
    replaceAll,
    updateCategory,
    removeOne,
    applyAnalysisResult,
    clearSessionAnalysis,
    restoredFromSession,
  };

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}
