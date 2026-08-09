import { useState, useEffect, useCallback } from "react";
import { motion as Motion } from "framer-motion";
import {
  Building2,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Wallet,
  ShieldCheck,
  Zap,
} from "lucide-react";
import ConnectBankButton from "../components/plaid/ConnectBankButton";
import {
  fetchPlaidConfig,
  fetchConnections,
  exchangePublicToken,
  syncConnection,
  disconnectConnection,
} from "../api/plaid";
import { useTransactions } from "../context/useTransactions";
import { formatCurrency } from "@oblivion-labs-dev/arsenal-shared";

export default function ConnectionsPage() {
  const { applyAnalysisResult, clearSessionAnalysis, transactions } = useTransactions();
  const [configStatus, setConfigStatus] = useState({ isConfigured: false, environment: "sandbox" });
  const [connections, setConnections] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cfg, connData] = await Promise.all([
        fetchPlaidConfig().catch(() => ({ isConfigured: false, environment: "sandbox" })),
        fetchConnections().catch(() => ({ connections: [], accounts: [] })),
      ]);
      setConfigStatus(cfg);
      setConnections(connData.connections || []);
      setAccounts(connData.accounts || []);
    } catch (err) {
      console.error("[ConnectionsPage] Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExchangeSuccess = async (publicToken, metadata) => {
    try {
      setStatusMessage({ type: "info", text: "Exchanging token and connecting institution..." });
      const res = await exchangePublicToken(publicToken, metadata);
      setStatusMessage({
        type: "success",
        text: `Successfully connected ${res.connection.institutionName}!`,
      });
      await loadData();

      // Automatically trigger initial transaction sync
      if (res.connection?.id) {
        handleSync(res.connection.id, res.connection.institutionName);
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to establish bank connection.",
      });
    }
  };

  const handleSync = async (connectionId, institutionName) => {
    setSyncingId(connectionId);
    setStatusMessage({ type: "info", text: `Syncing transactions for ${institutionName}...` });
    try {
      let res = await syncConnection(connectionId);
      let added = res.added || [];

      // If 0 transactions returned on manual sync, force resetCursor to fetch all historical records
      if (added.length === 0) {
        res = await syncConnection(connectionId, { resetCursor: true });
        added = res.added || [];
      }

      const txnsToLoad =
        Array.isArray(res.allStored) && res.allStored.length > 0 ? res.allStored : added;
      if (txnsToLoad.length > 0) {
        // Merge into FinanceOS normalized transactions state
        applyAnalysisResult({
          status: "success",
          origin: "import",
          transactions: txnsToLoad,
        });
      }

      setStatusMessage({
        type: "success",
        text: `Synced ${added.length} transaction${added.length === 1 ? "" : "s"} from ${institutionName}.`,
      });
      await loadData();
    } catch (err) {
      if (err.code === "ITEM_LOGIN_REQUIRED") {
        setStatusMessage({
          type: "warning",
          text: `${institutionName} requires credentials update. Please click Reconnect.`,
        });
      } else {
        setStatusMessage({
          type: "error",
          text: err.message || `Synchronization failed for ${institutionName}.`,
        });
      }
    } finally {
      setSyncingId(null);
    }
  };

  const handleDisconnect = async (connectionId, institutionName) => {
    if (
      !window.confirm(
        `Are you sure you want to disconnect ${institutionName}? Historical imported transactions will be preserved.`,
      )
    ) {
      return;
    }
    try {
      await disconnectConnection(connectionId);
      setStatusMessage({
        type: "success",
        text: `Disconnected ${institutionName}.`,
      });
      await loadData();
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to disconnect connection.",
      });
    }
  };

  const handleSyncAll = async () => {
    if (!connections.length) return;
    setLoading(true);
    setStatusMessage({ type: "info", text: "Resyncing all connected accounts..." });
    let totalSynced = 0;
    try {
      for (const conn of connections) {
        if (conn.status === "connected") {
          try {
            const res = await syncConnection(conn.id, { resetCursor: true });
            const added = res.added || [];
            if (added.length > 0) {
              applyAnalysisResult({
                status: "success",
                origin: "import",
                transactions: added,
              });
              totalSynced += added.length;
            }
          } catch (e) {
            console.warn(`[SyncAll] Failed for ${conn.institutionName}:`, e);
          }
        }
      }
      setStatusMessage({
        type: "success",
        text: `Sync All complete. Total ${totalSynced} transaction${totalSynced === 1 ? "" : "s"} synced across all accounts.`,
      });
      await loadData();
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to sync all accounts.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-ink-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/80 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-ink-800 dark:text-brand-400">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-ink-900 dark:text-white">
                Financial Connections
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                  configStatus.environment === "production"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                }`}
              >
                {configStatus.environment}
              </span>
            </div>
            <p className="text-sm text-ink-500 dark:text-ink-400">
              Connect real bank accounts securely via Plaid read-only sync
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {connections.length > 0 && (
            <button
              type="button"
              onClick={handleSyncAll}
              disabled={loading}
              title="Resync all accounts from the beginning"
              className="inline-flex items-center gap-1.5 rounded-2xl border border-brand-500/40 bg-brand-50 px-3.5 py-2 text-xs font-bold text-brand-700 shadow-sm transition hover:bg-brand-100 dark:border-brand-500/60 dark:bg-brand-900/60 dark:text-brand-200 dark:hover:bg-brand-800/80"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Sync All Accounts
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (window.confirm("Clear all local transaction history and session analysis?")) {
                clearSessionAnalysis();
                setStatusMessage({
                  type: "info",
                  text: "Cleared local session analysis and transaction data.",
                });
              }
            }}
            title="Clear all local transaction cache"
            className="inline-flex items-center gap-1.5 rounded-2xl border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-600 shadow-sm transition hover:bg-red-50 hover:text-red-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-red-950/50 dark:hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Data Cache
          </button>
          <ConnectBankButton onSuccess={handleExchangeSuccess} />
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <Motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 rounded-2xl p-4 text-sm font-medium ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
              : statusMessage.type === "error"
                ? "bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300"
                : statusMessage.type === "warning"
                  ? "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                  : "bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : statusMessage.type === "warning" ? (
            <AlertTriangle className="h-5 w-5 shrink-0" />
          ) : (
            <Zap className="h-5 w-5 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </Motion.div>
      )}

      {/* Security notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-ink-200/60 bg-ink-50/50 p-4 text-xs text-ink-600 dark:border-ink-800 dark:bg-ink-900/40 dark:text-ink-400">
        <ShieldCheck className="h-5 w-5 text-brand-600 dark:text-brand-400 shrink-0" />
        <div>
          <strong className="font-semibold text-ink-900 dark:text-ink-200">
            Read-only connection:
          </strong>{" "}
          FinanceOS never requests or possesses permissions for payments, transfers, or write
          operations. Access tokens are encrypted locally on your server.
        </div>
      </div>

      {/* Main Connection List / Grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-3xl border border-ink-200/70 bg-white/60 dark:border-ink-800 dark:bg-ink-900/40">
          <RefreshCw className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      ) : connections.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-ink-300 p-12 text-center dark:border-ink-800">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-ink-800 dark:text-brand-400">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-ink-900 dark:text-white">
              No Institutions Connected Yet
            </h3>
            <p className="max-w-md text-sm text-ink-500 dark:text-ink-400">
              Click the button below to launch Plaid Link and seamlessly import your checking,
              savings, and credit card accounts.
            </p>
          </div>
          <ConnectBankButton onSuccess={handleExchangeSuccess} />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {connections.map((conn) => {
            const connAccounts = accounts.filter((a) => a.connectionId === conn.id);
            const isSyncing = syncingId === conn.id;
            const isReconnect = conn.status === "reconnect_required";
            const syncedTxnCount = transactions.filter(
              (t) =>
                (t.card_identity && t.card_identity.includes(conn.institutionName)) ||
                t.source === conn.institutionName,
            ).length;

            return (
              <div
                key={conn.id}
                className="flex flex-col justify-between rounded-3xl border border-ink-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-xl transition hover:shadow-md dark:border-ink-800 dark:bg-ink-900/90"
              >
                <div>
                  {/* Connection Card Header */}
                  <div className="flex items-center justify-between border-b border-ink-100 pb-4 dark:border-ink-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-300">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-ink-900 dark:text-white">
                          {conn.institutionName}
                        </h3>
                        <p className="text-xs text-ink-500 dark:text-ink-400">
                          {connAccounts.length} account{connAccounts.length === 1 ? "" : "s"} •{" "}
                          {syncedTxnCount} txns synced
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isReconnect
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${isReconnect ? "bg-amber-500" : "bg-emerald-500"}`}
                      />
                      {isReconnect ? "Reconnect required" : "Connected"}
                    </span>
                  </div>

                  {/* Connected Accounts Sub-list */}
                  <div className="mt-4 flex flex-col gap-2.5">
                    {connAccounts.map((acc) => {
                      const accTxnCount = transactions.filter(
                        (t) =>
                          (t.card_identity && t.card_identity.includes(acc.mask)) ||
                          t.account_id === acc.id ||
                          t.account_id === acc.plaidAccountId,
                      ).length;

                      return (
                        <div
                          key={acc.id}
                          className="flex items-center justify-between rounded-2xl bg-ink-50/70 px-4 py-3 dark:bg-ink-950/60"
                        >
                          <div className="flex items-center gap-3">
                            {acc.type === "credit" ? (
                              <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            ) : (
                              <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            )}
                            <div>
                              <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                                {acc.name} {acc.mask ? `(••• ${acc.mask})` : ""}
                              </p>
                              <p className="text-xs capitalize text-ink-500 dark:text-ink-400">
                                {acc.subtype || acc.type}{" "}
                                {accTxnCount > 0 ? `• ${accTxnCount} txns` : ""}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-bold text-ink-900 dark:text-white">
                              {formatCurrency(acc.currentBalance)}
                            </p>
                            {acc.availableBalance !== null &&
                              acc.availableBalance !== undefined && (
                                <p className="text-[11px] text-ink-500 dark:text-ink-400">
                                  {formatCurrency(acc.availableBalance)} avail
                                </p>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-6 flex items-center justify-between border-t border-ink-100 pt-4 dark:border-ink-800">
                  <span className="text-xs text-ink-400 dark:text-ink-500">
                    Last synced:{" "}
                    {conn.lastSyncedAt
                      ? new Date(conn.lastSyncedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Never"}
                  </span>

                  <div className="flex items-center gap-2">
                    {isReconnect ? (
                      <ConnectBankButton
                        connectionId={conn.id}
                        isReconnect={true}
                        onSuccess={handleExchangeSuccess}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
                      >
                        Reconnect
                      </ConnectBankButton>
                    ) : (
                      <button
                        type="button"
                        disabled={isSyncing}
                        onClick={() => handleSync(conn.id, conn.institutionName)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-sm transition hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-ink-700"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                        Sync
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDisconnect(conn.id, conn.institutionName)}
                      title="Disconnect institution"
                      className="inline-flex items-center justify-center rounded-xl p-1.5 text-ink-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
