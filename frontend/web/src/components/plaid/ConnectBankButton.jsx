import { useState, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Plus, RefreshCw, AlertCircle } from "lucide-react";
import { createLinkToken } from "../../api/plaid";

export default function ConnectBankButton({
  onSuccess,
  connectionId,
  isReconnect = false,
  className = "",
  children,
}) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOpenLink = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await createLinkToken(connectionId);
      setToken(data.link_token);
    } catch (err) {
      console.error("[PlaidLinkButton] Error fetching link token:", err);
      setError(
        err.message ||
          "Could not launch Plaid Link. Ensure PLAID_CLIENT_ID and PLAID_SECRET are set.",
      );
      setLoading(false);
    }
  };

  const handlePlaidSuccess = useCallback(
    async (publicToken, metadata) => {
      setLoading(true);
      try {
        if (onSuccess) {
          await onSuccess(publicToken, metadata);
        }
      } catch (err) {
        setError(err.message || "Failed to complete connection exchange.");
      } finally {
        setLoading(false);
        setToken(null);
      }
    },
    [onSuccess],
  );

  const config = {
    token,
    onSuccess: handlePlaidSuccess,
    onExit: (err, metadata) => {
      setLoading(false);
      setToken(null);
      if (err) {
        console.warn("[PlaidLinkButton] Link exited with error:", err);
      }
    },
  };

  const { open, ready } = usePlaidLink(config);

  // Automatically trigger open once token is set and ready
  if (token && ready) {
    open();
    setToken(null);
    setLoading(false);
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={loading}
        onClick={handleOpenLink}
        className={
          className ||
          `inline-flex items-center gap-2 rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:bg-brand-600 active:scale-95 disabled:opacity-50`
        }
      >
        {loading ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : isReconnect ? (
          <RefreshCw className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {children || (isReconnect ? "Reconnect Institution" : "Connect Financial Institution")}
      </button>
      {error && (
        <p className="flex items-center gap-1 text-xs font-medium text-red-500 dark:text-red-400">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
