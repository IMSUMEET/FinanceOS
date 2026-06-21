import { Layers } from "lucide-react";
import { themeForAccount } from "../../utils/accountCards";
import { formatCurrency } from "../../utils/format";

function AccountChip({ account, active, onSelect }) {
  const theme = themeForAccount(account.label);

  return (
    <button
      type="button"
      onClick={() => onSelect(account.id)}
      aria-pressed={active}
      aria-label={`Filter by ${account.label}, ${formatCurrency(account.total)} spend`}
      className={[
        "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-left text-xs font-semibold transition",
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
    </button>
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
