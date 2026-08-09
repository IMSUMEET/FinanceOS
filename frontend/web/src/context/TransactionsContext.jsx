import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { monthKey } from "../utils/format";
import { matchTransfersAndClassify } from "../utils/transferMatcher.js";
import { CLASSIFICATION_TYPES } from "../utils/classification.js";
import { categorize } from "../utils/categorize.js";
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
    if (!analysis || !Array.isArray(analysis.transactions) || analysis.transactions.length === 0) {
      localStorage.removeItem(ANALYSIS_STORAGE_KEY);
      localStorage.removeItem(LEGACY_SESSION_ANALYSIS_KEY);
      localStorage.removeItem("finance_os_latest_analysis");
    } else {
      localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(analysis));
    }
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
  const [latestAnalysis, setLatestAnalysis] = useState(initialStored);
  const [restoredFromStorage, setRestoredFromStorage] = useState(Boolean(initialStored));
  const [pageFilters, setPageFiltersState] = useState(createInitialPageFilters);
  const [uploadPromptDismissed, setUploadPromptDismissed] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.removeItem(UPLOAD_PROMPT_DISMISSED_KEY);
    } catch {
      /* ignore */
    }

    // Auto-sync transactions for connected Plaid institutions on app start
    async function autoSyncPlaidConnections() {
      try {
        const { fetchConnections, syncConnection } = await import("../api/plaid.js");

        // 1. First load any existing transactions stored on backend disk
        try {
          const storedRes = await fetch("/api/plaid/transactions");
          if (storedRes.ok) {
            const storedData = await storedRes.json();
            if (Array.isArray(storedData.transactions) && storedData.transactions.length > 0) {
              applyAnalysisResult({
                status: "success",
                origin: "import",
                transactions: storedData.transactions,
              });
            }
          }
        } catch {
          /* ignore stored fetch failure */
        }

        // 2. Perform incremental sync for connected accounts
        const connData = await fetchConnections();
        if (Array.isArray(connData.connections) && connData.connections.length > 0) {
          for (const conn of connData.connections) {
            if (conn.status === "connected") {
              try {
                let res = await syncConnection(conn.id);
                const txnsToLoad =
                  Array.isArray(res.allStored) && res.allStored.length > 0
                    ? res.allStored
                    : res.added;
                if (Array.isArray(txnsToLoad) && txnsToLoad.length > 0) {
                  applyAnalysisResult({
                    status: "success",
                    origin: "import",
                    transactions: txnsToLoad,
                  });
                }
              } catch (e) {
                console.warn(
                  `[TransactionsContext] Auto-sync failed for ${conn.institutionName}:`,
                  e,
                );
              }
            }
          }
        }
      } catch (err) {
        console.warn("[TransactionsContext] Failed to load Plaid connections for auto-sync:", err);
      }
    }

    autoSyncPlaidConnections();
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

  const [manualNotTransfers, setManualNotTransfersState] = useState([]);
  const [manualMatches, setManualMatchesState] = useState([]);
  const [accountNicknames, setAccountNicknames] = useState(() => {
    try {
      const saved = localStorage.getItem("finance_os_account_nicknames");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const renameAccount = useCallback((oldKey, newName) => {
    if (!oldKey || !newName) return;
    setAccountNicknames((prev) => {
      const next = { ...prev, [oldKey]: newName.trim() };
      try {
        localStorage.setItem("finance_os_account_nicknames", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // Process transactions through automatic classification & transfer matching engine and apply custom nicknames
  const classifiedResult = useMemo(() => {
    const matched = matchTransfersAndClassify(transactions, [], {
      manualNotTransfers,
      manualMatches,
    });

    const renamed = matched.transactions.map((tx) => {
      const originalKey = tx.card_identity || tx.source;
      if (originalKey && accountNicknames[originalKey]) {
        return { ...tx, card_identity: accountNicknames[originalKey] };
      }
      return tx;
    });

    return {
      transactions: renamed,
      matches: matched.matches,
    };
  }, [transactions, manualNotTransfers, manualMatches, accountNicknames]);

  const processedTransactions = classifiedResult.transactions;
  const transferMatches = classifiedResult.matches;

  const filteredByPage = useMemo(() => {
    const out = {};
    for (const key of PAGE_KEYS) {
      out[key] = applyFiltersToRows(processedTransactions, pageFilters[key]);
    }
    return out;
  }, [processedTransactions, pageFilters]);

  const derivedByPage = useMemo(() => {
    // Return a Proxy object that computes buildDerived on demand for the requested page key
    const cache = {};
    return new Proxy(
      {},
      {
        get(target, key) {
          if (key in cache) return cache[key];
          if (PAGE_KEYS.includes(key) && filteredByPage[key]) {
            cache[key] = buildDerived(filteredByPage[key]);
            return cache[key];
          }
          return undefined;
        },
      },
    );
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

    let nextAnalysis = null;
    setTransactions((prev) => {
      const seen = new Set();
      const merged = [];

      for (const t of prev) {
        const key = t.externalTransactionId
          ? `ext:${t.externalTransactionId}`
          : `${t.date}|${t.merchant_raw}|${t.amount}|${t.card_identity || ""}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(t);
        }
      }

      for (const t of analysis.transactions) {
        const key = t.externalTransactionId
          ? `ext:${t.externalTransactionId}`
          : `${t.date}|${t.merchant_raw}|${t.amount}|${t.card_identity || ""}`;
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
      nextAnalysis = updatedAnalysis;
      persistAnalysis(updatedAnalysis);
      clearSeenAlerts();

      return stamped;
    });

    if (nextAnalysis) setLatestAnalysis(nextAnalysis);
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
      localStorage.removeItem(LEGACY_SESSION_ANALYSIS_KEY);
      localStorage.removeItem("finance_os_latest_analysis");
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
    clearSeenAlerts();
    setLatestAnalysis(null);
    setTransactions([]);
    setUploadPromptDismissed(false);
    if (USE_MOCK) {
      await _replaceAllMock([]);
    }
    setRestoredFromStorage(false);
  }, []);

  const runAiAnalysis = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:11434/api/tags");
      if (!res.ok) {
        throw new Error("Ollama is not responding");
      }
    } catch {
      alert(
        "Local Ollama model is not running! Please start Ollama in your terminal using: 'ollama run qwen3:8b'",
      );
      return;
    }

    setTransactions((prev) => {
      const next = prev.map((tx) => {
        const aiCategory = categorize(
          tx.merchant || tx.merchant_normalized || tx.description,
          tx.description,
        );
        return {
          ...tx,
          aiCategory,
          // Update category if user hasn't manually overridden it
          category: tx.category || aiCategory,
        };
      });
      const stored = readStoredAnalysis();
      if (stored) {
        persistAnalysis({ ...stored, transactions: next, origin: "import" });
      }
      return next;
    });
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
    renameAccount,
    accountNicknames,
    addMany,
    replaceAll,
    updateCategory,
    runAiAnalysis,
    removeOne,
    applyAnalysisResult,
    clearSessionAnalysis,
    latestAnalysis,
    uploadPromptDismissed,
    dismissUploadPrompt,
    resetUploadPrompt,
    restoredFromStorage,
    /** @deprecated use restoredFromStorage */
    restoredFromSession: restoredFromStorage,
  };

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}
