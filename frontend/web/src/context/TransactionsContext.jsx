import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { monthKey } from "../utils/format";
import { matchTransfersAndClassify } from "../utils/transferMatcher.js";
import { CLASSIFICATION_TYPES } from "../utils/classification.js";
import { categorize, mapCanonicalCategory } from "../utils/categorize.js";
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

    let merchantRules = {};
    try {
      const rawRules = localStorage.getItem("finance_os_merchant_rules");
      if (rawRules) merchantRules = JSON.parse(rawRules);
    } catch {
      /* ignore */
    }

    const renamed = matched.transactions.map((tx) => {
      let updatedTx = { ...tx };
      const mKey = (
        tx.merchant_normalized ||
        tx.merchant ||
        tx.merchant_raw ||
        tx.description ||
        ""
      )
        .trim()
        .toLowerCase();

      // Manual merchant rules from localStorage permanently take priority over AI & rule classifications
      if (!updatedTx.manual_override && merchantRules[mKey]) {
        updatedTx.category = merchantRules[mKey];
        updatedTx.category_source = "manual";
        updatedTx.manual_override = true;
      }

      const desc =
        `${tx.description || ""} ${tx.merchant || ""} ${tx.merchant_raw || ""}`.toLowerCase();
      const isPayrollOrDeposit = /payroll|edipayment|direct\s+deposit|salary|wages|employer/i.test(
        desc,
      );

      if (
        /zelle\s+(payment\s+from|from|credit|received|deposit)/i.test(desc) ||
        isPayrollOrDeposit
      ) {
        updatedTx.amount = Math.abs(Number(tx.amount || 0));
        updatedTx.transaction_type = "income";
        updatedTx.type = "income";
        if (!updatedTx.manual_override) {
          updatedTx.category =
            updatedTx.category === "Other" || updatedTx.category === "Income" || !updatedTx.category
              ? "Salary"
              : updatedTx.category;
        }
      } else if (/zelle\s+(payment\s+to|to|sent)/i.test(desc)) {
        updatedTx.amount = -Math.abs(Number(tx.amount || 0));
        if (updatedTx.type !== "expense") updatedTx.type = "expense";
      } else if (!updatedTx.transaction_type || updatedTx.transaction_type === "income") {
        if (tx.category !== "Income" && tx.category !== "Refund" && !desc.includes("refund")) {
          updatedTx.transaction_type = "expense";
          updatedTx.type = "expense";
        }
      }

      // Enforce exact 10 canonical categories across all transaction records unless manually overridden
      if (!updatedTx.manual_override) {
        const mappedCat = mapCanonicalCategory(updatedTx.category);
        if (mappedCat !== "Other") {
          updatedTx.category = mappedCat;
        } else {
          updatedTx.category = categorize(
            updatedTx.merchant || updatedTx.merchant_normalized || updatedTx.description,
            updatedTx.description,
          );
        }
      }

      const originalKey = updatedTx.card_identity || updatedTx.source;
      if (originalKey && accountNicknames[originalKey]) {
        return { ...updatedTx, card_identity: accountNicknames[originalKey] };
      }
      return updatedTx;
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

    // Filter unresolved transactions for Qwen categorization (avoid re-sending resolved/manual)
    const unresolved = transactions.filter(
      (t) =>
        !t.manual_override &&
        (t.transaction_type === "other" ||
          t.category === "Other" ||
          !t.classification_confidence ||
          t.classification_confidence < 0.7),
    );

    let proposalsMap = new Map();
    if (unresolved.length > 0) {
      try {
        const catRes = await fetch("/api/ai/categorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactions: unresolved }),
        });
        if (catRes.ok) {
          const catData = await catRes.json();
          if (Array.isArray(catData.proposals)) {
            for (const p of catData.proposals) {
              proposalsMap.set(p.id, p);
            }
          }
        }
      } catch (e) {
        console.warn("[TransactionsContext] Batch AI categorization API failed, using rules:", e);
      }
    }

    setTransactions((prev) => {
      const next = prev.map((tx) => {
        if (tx.manual_override) return tx;

        const prop = proposalsMap.get(tx.id);
        if (prop) {
          const conf = Number(prop.confidence ?? 0);
          const aiType = prop.transaction_type || "other";
          const aiCat = prop.category || "Other";
          const aiSub = prop.subcategory || null;

          if (conf >= 0.7) {
            return {
              ...tx,
              aiTransactionType: aiType,
              aiCategory: aiCat,
              aiSubcategory: aiSub,
              aiConfidence: conf,
              aiReason: prop.reason || "Qwen AI categorization",
              transaction_type: aiType,
              category: aiCat,
              subcategory: aiSub,
              classification_confidence: conf,
              categorySource: "ai",
            };
          } else {
            return {
              ...tx,
              aiTransactionType: aiType,
              aiCategory: aiCat,
              aiConfidence: conf,
              aiReason: prop.reason || "Low confidence AI proposal",
              transaction_type: "other",
              category: "Other",
              classification_confidence: conf,
              categorySource: "ai",
            };
          }
        }

        const fallbackCat = categorize(
          tx.merchant || tx.merchant_normalized || tx.description,
          tx.description,
        );
        return {
          ...tx,
          aiCategory: fallbackCat,
          category: tx.category || fallbackCat,
          categorySource: tx.categorySource || "rule",
        };
      });
      const stored = readStoredAnalysis();
      if (stored) {
        persistAnalysis({ ...stored, transactions: next, origin: "import" });
      }
      return next;
    });

    // Also fetch updated AI financial analysis insights from backend (/api/coach/suggestions)
    try {
      const summary = {
        totalTransactions: transactions.length,
        totalIncome: transactions
          .filter((t) => t.type === "income" || t.transaction_type === "income")
          .reduce((s, x) => s + Math.abs(x.amount || 0), 0),
        totalExpenses: transactions
          .filter((t) => t.type === "expense" || t.transaction_type === "expense")
          .reduce((s, x) => s + Math.abs(x.amount || 0), 0),
        netCashFlow: transactions.reduce((s, x) => s + (x.amount || 0), 0),
        recentTransactions: (transactions || []).slice(0, 30).map((t) => ({
          id: String(t.id),
          date: t.date,
          description: t.description || t.merchant_raw || t.merchant,
          merchant: t.merchant_normalized || t.merchant || t.merchant_raw,
          amount: t.amount,
          category: t.category,
        })),
        topCategories: [],
        topMerchants: [],
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const coachRes = await fetch("/api/coach/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (coachRes.ok) {
        const coachData = await coachRes.json();
        if (coachData.suggestions) {
          const full = coachData.fullInsights || {};
          const recommendations =
            Array.isArray(full.recommendations) && full.recommendations.length > 0
              ? full.recommendations
              : coachData.suggestions;

          setLatestAnalysis((prev) => ({
            ...(prev || {}),
            status: "success",
            aiStatus: prev?.aiStatus || { insights: coachData.source || "openrouter" },
            insights: {
              summary:
                full.summary?.explanation ||
                full.summary ||
                "Analysis updated with Qwen AI Analyst.",
              headline: full.summary?.headline || "",
              financialDirection: full.summary?.financialDirection || null,
              score: typeof full.score === "number" ? full.score : 75,
              riskLevel: full.riskLevel || "low",
              spendingInsights: Array.isArray(full.spendingInsights)
                ? full.spendingInsights
                : prev?.insights?.spendingInsights || [],
              savingsAnalysis:
                full.savingsAnalysis && typeof full.savingsAnalysis === "object"
                  ? full.savingsAnalysis
                  : prev?.insights?.savingsAnalysis || null,
              categoryInsights: Array.isArray(full.categoryInsights)
                ? full.categoryInsights
                : prev?.insights?.categoryInsights || [],
              merchantInsights: Array.isArray(full.merchantInsights)
                ? full.merchantInsights
                : prev?.insights?.merchantInsights || [],
              recurringInsights: Array.isArray(full.recurringInsights)
                ? full.recurringInsights
                : prev?.insights?.recurringInsights || [],
              recommendations: recommendations,
              observations: Array.isArray(full.observations)
                ? full.observations
                : prev?.insights?.observations || [],
              anomalies: Array.isArray(full.anomalies)
                ? full.anomalies
                : prev?.insights?.anomalies || [],
            },
          }));
        }
      }
    } catch (e) {
      console.warn("[TransactionsContext] Fetch coach suggestions finished/timed out:", e);
    }
  }, [transactions]);

  const updateCategory = useCallback(async (id, category) => {
    let updatedMerchantKey = null;
    setTransactions((prev) => {
      const next = prev.map((t) => {
        if (t.id === id) {
          updatedMerchantKey = (
            t.merchant_normalized ||
            t.merchant ||
            t.merchant_raw ||
            t.description ||
            ""
          )
            .trim()
            .toLowerCase();
          return {
            ...t,
            category,
            manual_override: true,
            category_source: "manual",
          };
        }
        return t;
      });
      const stored = readStoredAnalysis();
      if (stored) {
        persistAnalysis({ ...stored, transactions: next, origin: "import" });
      }
      return next;
    });

    // Also persist reusable merchant rule to localStorage so future imports automatically apply manual category
    if (updatedMerchantKey) {
      try {
        const rawRules = localStorage.getItem("finance_os_merchant_rules");
        const rules = rawRules ? JSON.parse(rawRules) : {};
        rules[updatedMerchantKey] = category;
        localStorage.setItem("finance_os_merchant_rules", JSON.stringify(rules));
      } catch {
        /* ignore storage quota */
      }
    }

    try {
      await updateTransactionCategory(id, category);
    } catch (err) {
      console.warn("[transactions] updateCategory failed", err);
    }
  }, []);

  // Create a structured merchant rule and apply to matching non-overridden historical transactions
  const createMerchantRule = useCallback(
    ({
      merchantKey,
      category,
      subcategory = null,
      transactionType = "expense",
      source = "manual",
    }) => {
      if (!merchantKey || !category) return;
      const cleanKey = merchantKey.trim().toLowerCase();

      // 1. Update localStorage rule list
      let existingRules = [];
      try {
        const raw = localStorage.getItem("finance_os_structured_merchant_rules");
        if (raw) existingRules = JSON.parse(raw);
      } catch {
        existingRules = [];
      }

      const newRule = {
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        matchType: "normalized_merchant",
        matchValue: cleanKey,
        merchantNormalized: merchantKey,
        category,
        subcategory,
        transactionType,
        source,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedRules = [newRule, ...existingRules.filter((r) => r.matchValue !== cleanKey)];
      try {
        localStorage.setItem("finance_os_structured_merchant_rules", JSON.stringify(updatedRules));
        // Map simple merchant rules for backward compatibility
        const simpleRules = {};
        updatedRules.forEach((r) => {
          simpleRules[r.matchValue] = r.category;
        });
        localStorage.setItem("finance_os_merchant_rules", JSON.stringify(simpleRules));
      } catch {
        /* ignore */
      }

      // 2. Apply rule across all matching non-overridden transactions
      setTransactions((prev) => {
        const next = prev.map((t) => {
          if (t.manual_override) return t;
          const mKey = (
            t.merchant_normalized ||
            t.merchant ||
            t.merchant_raw ||
            t.description ||
            ""
          )
            .trim()
            .toLowerCase();
          if (mKey === cleanKey || mKey.includes(cleanKey)) {
            return {
              ...t,
              category,
              subcategory: subcategory || t.subcategory,
              transaction_type: transactionType || t.transaction_type,
              category_source: source === "manual" ? "manual" : "rule",
              manual_override: source === "manual",
            };
          }
          return t;
        });

        const stored = readStoredAnalysis();
        if (stored) {
          persistAnalysis({ ...stored, transactions: next, origin: "import" });
        }
        return next;
      });
    },
    [],
  );

  // Delete a merchant rule without corrupting transaction history
  const deleteMerchantRule = useCallback((ruleId) => {
    try {
      const raw = localStorage.getItem("finance_os_structured_merchant_rules");
      if (!raw) return;
      const rules = JSON.parse(raw);
      const filtered = rules.filter((r) => r.id !== ruleId);
      localStorage.setItem("finance_os_structured_merchant_rules", JSON.stringify(filtered));

      const simpleRules = {};
      filtered.forEach((r) => {
        simpleRules[r.matchValue] = r.category;
      });
      localStorage.setItem("finance_os_merchant_rules", JSON.stringify(simpleRules));
    } catch {
      /* ignore */
    }
  }, []);

  // Reprocess uncategorized/Other transactions using current rule chain without overwriting manual overrides
  const reprocessUncategorized = useCallback(() => {
    let merchantRules = {};
    try {
      const rawRules = localStorage.getItem("finance_os_merchant_rules");
      if (rawRules) merchantRules = JSON.parse(rawRules);
    } catch {
      /* ignore */
    }

    setTransactions((prev) => {
      const next = prev.map((t) => {
        if (t.manual_override) return t;
        if (t.category && t.category !== "Other") return t;

        const mKey = (t.merchant_normalized || t.merchant || t.merchant_raw || t.description || "")
          .trim()
          .toLowerCase();
        let newCat = t.category;

        if (merchantRules[mKey]) {
          newCat = merchantRules[mKey];
        } else {
          newCat = categorize(t.merchant || t.merchant_normalized || t.description, t.description);
        }

        return {
          ...t,
          category: newCat,
          category_source: merchantRules[mKey] ? "rule" : t.category_source,
        };
      });

      const stored = readStoredAnalysis();
      if (stored) {
        persistAnalysis({ ...stored, transactions: next, origin: "import" });
      }
      return next;
    });
  }, []);

  const updateTransactionType = useCallback((id, transaction_type) => {
    setTransactions((prev) => {
      const next = prev.map((t) =>
        t.id === id
          ? {
              ...t,
              transaction_type,
              manual_override: true,
              category_source: "manual",
            }
          : t,
      );
      const stored = readStoredAnalysis();
      if (stored) {
        persistAnalysis({ ...stored, transactions: next, origin: "import" });
      }
      return next;
    });
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
    createMerchantRule,
    deleteMerchantRule,
    reprocessUncategorized,
    updateTransactionType,
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
