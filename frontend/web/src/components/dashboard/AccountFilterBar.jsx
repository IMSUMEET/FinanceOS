import { useState } from "react";
import { Layers, Edit2, Check, X } from "lucide-react";
import { themeForAccount } from "../../utils/accountCards";
import { formatCurrency } from "../../utils/format";
import { useTransactions } from "../../context/useTransactions";

function AccountChip({ account, active, onSelect }) {
  const theme = themeForAccount(account.label);
  const { renameAccount } = useTransactions();
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(account.label);

  const handleSave = (e) => {
    e.stopPropagation();
    if (nameInput.trim() && renameAccount) {
      renameAccount(account.id, nameInput.trim());
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="inline-flex items-center gap-1 rounded-full border border-brand-500 bg-white px-2 py-1 text-xs dark:bg-ink-800">
        <input
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          className="w-28 rounded bg-transparent px-1 font-bold text-ink-900 focus:outline-none dark:text-ink-50"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave(e);
            if (e.key === "Escape") setIsEditing(false);
          }}
        />
        <button
          type="button"
          onClick={handleSave}
          className="text-emerald-600 hover:text-emerald-700"
        >
          <Check size={14} />
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="text-ink-400 hover:text-ink-600"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect(account.id)}
      role="button"
      tabIndex={0}
      aria-pressed={active}
      aria-label={`Filter by ${account.label}, ${formatCurrency(account.total)} spend`}
      className={[
        "group relative inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-xs font-semibold transition cursor-pointer select-none",
        active
          ? "border-brand-500 bg-brand-50 text-brand-800 dark:border-brand-400 dark:bg-brand-900/40 dark:text-brand-100"
          : "border-ink-200 bg-white text-ink-700 hover:border-brand-300 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:border-brand-500",
      ].join(" ")}
    >
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br ${theme.gradient}`}
        aria-hidden
      />
      <span className="truncate">{account.label}</span>
      <span className="tabular shrink-0 font-bold opacity-80">
        {formatCurrency(account.total, { compact: true })}
      </span>
      <button
        type="button"
        title="Rename account"
        onClick={(e) => {
          e.stopPropagation();
          setNameInput(account.label);
          setIsEditing(true);
        }}
        className="ml-0.5 opacity-0 transition group-hover:opacity-100 hover:text-brand-500"
      >
        <Edit2 size={12} />
      </button>
    </div>
  );
}

function AccountFilterBar({ accounts, selectedAccount, onSelectAccount, periodLabel }) {
  if (accounts.length <= 1) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">
          Filter by account
        </p>
        <p className="mt-0.5 text-sm text-ink-600 dark:text-ink-300">
          Totals for{" "}
          <span className="font-semibold text-ink-800 dark:text-ink-100">{periodLabel}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onSelectAccount(null)}
          aria-pressed={selectedAccount == null}
          className={[
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
            selectedAccount == null
              ? "border-brand-500 bg-brand-50 text-brand-800 dark:border-brand-400 dark:bg-brand-900/40 dark:text-brand-100"
              : "border-ink-200 bg-white text-ink-600 hover:border-brand-300 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:border-brand-500",
          ].join(" ")}
        >
          <Layers size={14} />
          All accounts
        </button>
        {accounts.map((account) => (
          <AccountChip
            key={account.id}
            account={account}
            active={selectedAccount === account.id}
            onSelect={onSelectAccount}
          />
        ))}
      </div>
    </div>
  );
}

export default AccountFilterBar;
