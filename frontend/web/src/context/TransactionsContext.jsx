import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { monthKey } from "../utils/format";
import {
  categoryBreakdown,
  merchantBreakdown,
  monthlyByCategory,
  monthlyTotals,
} from "../utils/insights";
import {
  importTransactions,
  updateTransactionCategory,
  deleteTransaction,
  _replaceAllMock,
} from "../services/transactions";
import { USE_MOCK } from "../api/client";
import {
  ANALYSIS_STORAGE_KEY,
  UPLOAD_PROMPT_DISMISSED_KEY,
  clearLegacyAnalysisSessions,
  migrateSessionAnalysisToLocal,
} from "../constants/storage";
import { clearSeenAlerts } from "../utils/alerts";
import {
  ALL_MONTHS_SENTINEL,
  PAGE_KEYS,
  applyFiltersToRows,
  createInitialPageFilters,
} from "./pageFilters.js";

export { ALL_MONTHS_SENTINEL };
// eslint-disable-next-line react-refresh/only-export-components
export const TransactionsContext = createContext(null);

function readStoredAnalysis() {
  clearLegacyAnalysisSessions();
  migrateSessionAnalysisToLocal();
  try {
    const raw = localStorage.getItem(ANALYSIS_STORAGE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw);
    if (
      j?.status === "success" &&
      j?.origin === "import" &&
      Array.isArray(j.transactions) &&
      j.transactions.length > 0
    ) {
      return j;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return null;
}

function persistAnalysis(analysis) {
  try {
    localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(analysis));
  } catch {
    /* ignore quota errors */
  }
}

function buildDerived(filtered) {
  return {
    monthly: monthlyTotals(filtered),
    monthlyByCategory: monthlyByCategory(filtered),
    categories: categoryBreakdown(filtered),
    merchants: merchantBreakdown(filtered),
  };
}

export function TransactionsProvider({ children }) {
  const initialStored = readStoredAnalysis();
  const [transactions, setTransactions] = useState(() => {
    if (initialStored) return initialStored.transactions;
    return [];
  });
  const [restoredFromStorage, setRestoredFromStorage] = useState(Boolean(initialStored));
  const [pageFilters, setPageFiltersState] = useState(createInitialPageFilters);
  const [uploadPromptDismissed, setUploadPromptDismissed] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.removeItem(UPLOAD_PROMPT_DISMISSED_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const months = useMemo(() => {
    const set = new Set(transactions.map((t) => monthKey(t.date)));
    return Array.from(set).filter(Boolean).sort();
  }, [transactions]);

  const setPageFilters = useCallback((pageKey, updater) => {
    setPageFiltersState((prev) => {
      const current = prev[pageKey];
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...prev, [pageKey]: next };
    });
  }, []);

  const setAccountFilter = useCallback((accountId) => {
    setPageFiltersState((prev) => {
      const next = { ...prev };
      for (const key of PAGE_KEYS) {
        next[key] = { ...next[key], account: accountId || null };
      }
      return next;
    });
  }, []);

  const resetAllPageFilters = useCallback(() => {
    setPageFiltersState(createInitialPageFilters());
  }, []);

  const filteredByPage = useMemo(() => {
    const out = {};
    for (const key of PAGE_KEYS) {
      out[key] = applyFiltersToRows(transactions, pageFilters[key]);
    }
    return out;
  }, [transactions, pageFilters]);

  const derivedByPage = useMemo(() => {
    const out = {};
    for (const key of PAGE_KEYS) {
      out[key] = buildDerived(filteredByPage[key]);
    }
    return out;
  }, [filteredByPage]);

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
      const seen = new Set();
      const merged = [];

      for (const t of prev) {
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

      const updatedAnalysis = {
        ...analysis,
        origin: "import",
        transactions: stamped,
      };
      persistAnalysis(updatedAnalysis);
      clearSeenAlerts();

      return stamped;
    });

    setRestoredFromStorage(false);
  }, []);

  const dismissUploadPrompt = useCallback(() => {
    setUploadPromptDismissed(true);
  }, []);

  const resetUploadPrompt = useCallback(() => {
    setUploadPromptDismissed(false);
  }, []);

  const clearSessionAnalysis = useCallback(async () => {
    try {
      localStorage.removeItem(ANALYSIS_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    clearSeenAlerts();
    setTransactions([]);
    setUploadPromptDismissed(false);
    if (USE_MOCK) {
      await _replaceAllMock([]);
    }
    setRestoredFromStorage(false);
  }, []);

  const updateCategory = useCallback(async (id, category) => {
    setTransactions((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, category } : t));
      const stored = readStoredAnalysis();
      if (stored) {
        persistAnalysis({ ...stored, transactions: next, origin: "import" });
      }
      return next;
    });
    try {
      await updateTransactionCategory(id, category);
    } catch (err) {
      console.warn("[transactions] updateCategory failed", err);
    }
  }, []);

  const removeOne = useCallback(async (id) => {
    setTransactions((prev) => {
      const next = prev.filter((t) => t.id !== id);
      const stored = readStoredAnalysis();
      if (stored) {
        persistAnalysis({ ...stored, transactions: next, origin: "import" });
      }
      return next;
    });
    try {
      await deleteTransaction(id);
    } catch (err) {
      console.warn("[transactions] delete failed", err);
    }
  }, []);

  const value = {
    ALL_MONTHS_SENTINEL,
    transactions,
    pageFilters,
    setPageFilters,
    setAccountFilter,
    resetAllPageFilters,
    filteredByPage,
    derivedByPage,
    months,
    addMany,
    replaceAll,
    updateCategory,
    removeOne,
    applyAnalysisResult,
    clearSessionAnalysis,
    uploadPromptDismissed,
    dismissUploadPrompt,
    resetUploadPrompt,
    restoredFromStorage,
    /** @deprecated use restoredFromStorage */
    restoredFromSession: restoredFromStorage,
  };

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}
