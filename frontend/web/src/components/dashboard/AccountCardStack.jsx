import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Receipt, TrendingUp } from "lucide-react";
import CategoryBadge from "../ui/CategoryBadge";
import { themeForAccount } from "../../utils/accountCards";
import { formatCurrency, formatDate } from "../../utils/format";

const AUTO_CYCLE_MS = 5000;
const CARD_ASPECT = "aspect-[86/54]";

function ClayCard({ account, active, className = "", compact = false }) {
  const theme = themeForAccount(account.label);

  return (
    <div
      aria-label={account.label}
      className={[
        "relative rounded-[1.25rem] p-[3px] text-left transition-all",
        compact
          ? "mx-0 w-[236px] max-w-none shrink-0 snap-center aspect-[86/54]"
          : `w-full ${CARD_ASPECT}`,
        active
          ? "ring-2 ring-brand-400/80 ring-offset-2 ring-offset-transparent shadow-[0_0_0_1px_rgba(56,189,248,0.25)]"
          : "opacity-95",
        className,
      ].join(" ")}
    >
      <div
        className={`relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[1.05rem] bg-gradient-to-br ${theme.gradient} p-3.5 text-white shadow-[0_14px_32px_rgba(15,23,42,0.3),inset_0_1px_0_rgba(255,255,255,0.25)]`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,transparent_50%,rgba(0,0,0,0.1)_100%)]" />
        <div className="relative flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${theme.accent}`}>
              {theme.network}
            </p>
            <p className="mt-0.5 truncate text-sm font-black leading-tight">{account.label}</p>
          </div>
          <div
            className="h-6 w-8 shrink-0 rounded-md border border-white/20"
            style={{ background: theme.chip }}
          />
        </div>
        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Spend</p>
          <p className="tabular text-lg font-black">
            {formatCurrency(account.total, { compact: true })}
          </p>
          <p className="mt-0.5 text-[11px] text-white/65">
            {account.count} {account.count === 1 ? "txn" : "txns"}
            {account.sharePct != null ? ` · ${account.sharePct.toFixed(0)}%` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

function SpendShareRow({ account, active }) {
  const theme = themeForAccount(account.label);

  return (
    <div className={`transition ${active ? "opacity-100" : "opacity-75"}`}>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="truncate font-semibold text-ink-700 dark:text-ink-200">
          {account.label}
        </span>
        <span className="tabular shrink-0 font-bold text-ink-900 dark:text-ink-50">
          {account.sharePct.toFixed(0)}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${theme.gradient} transition-all`}
          style={{ width: `${Math.max(account.sharePct, 4)}%` }}
        />
      </div>
    </div>
  );
}

function InsightTile({ label, value, sub }) {
  return (
    <div className="surface-muted rounded-xl2 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">
        {label}
      </p>
      <div className="tabular mt-1 text-sm font-black text-ink-900 dark:text-ink-50">{value}</div>
      {sub ? (
        <p className="mt-0.5 truncate text-[11px] text-ink-500 dark:text-ink-400">{sub}</p>
      ) : null}
    </div>
  );
}

function AccountCardStack({ accounts, selectedAccount, onSelectAccount, layout = "horizontal" }) {
  const [previewIndex, setPreviewIndex] = useState(0);

  const isSidebar = layout === "sidebar";
  const hasMultiple = accounts.length > 1;
  const grandTotal = accounts.reduce((sum, account) => sum + account.total, 0);
  const totalTxns = accounts.reduce((sum, account) => sum + account.count, 0);
  const selectedIndex = Math.min(previewIndex, Math.max(accounts.length - 1, 0));
  const displayAccount = accounts[selectedIndex] ?? accounts[0];

  useEffect(() => {
    if (!hasMultiple) return undefined;
    const timer = window.setInterval(() => {
      setPreviewIndex((current) => (current + 1) % accounts.length);
    }, AUTO_CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [accounts.length, hasMultiple]);

  if (!accounts.length) return null;

  function stepCard(delta) {
    setPreviewIndex((current) => (current + delta + accounts.length) % accounts.length);
  }

  if (!isSidebar) {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">
            Your cards
          </p>
          <p className="mt-0.5 text-sm text-ink-600 dark:text-ink-300">
            Select a card to filter your dashboard
          </p>
        </div>
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 snap-x snap-mandatory scrollbar-thin">
          {accounts.map((account) => (
            <button
              key={account.id}
              type="button"
              onClick={() => onSelectAccount(account.id)}
              className="shrink-0 snap-center text-left"
            >
              <ClayCard account={account} active={selectedAccount === account.id} compact />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-xl3 border border-ink-200/70 bg-white/80 p-4 shadow-soft backdrop-blur-xl dark:border-ink-700 dark:bg-ink-900/85 dark:shadow-softDark md:p-5">
      <div className="shrink-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">
            Your cards
          </p>
          {hasMultiple ? (
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-900/50 dark:text-brand-200">
              {accounts.length}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-sm text-ink-600 dark:text-ink-300">
          {hasMultiple
            ? "Your cards rotate automatically — use arrows to browse"
            : "Summary for your linked card"}
        </p>
      </div>

      <div className="mt-3 rounded-xl2 surface-muted px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">
              {hasMultiple ? "Now showing" : "Portfolio"}
            </p>
            <p className="tabular mt-0.5 text-xl font-black text-ink-900 dark:text-ink-50">
              {formatCurrency(displayAccount.total, { compact: true })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">
              {hasMultiple ? "All cards" : "Activity"}
            </p>
            <p className="mt-0.5 text-sm font-bold text-ink-700 dark:text-ink-200">
              {hasMultiple
                ? formatCurrency(grandTotal, { compact: true })
                : `${accounts.length} card · ${totalTxns} txns`}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 shrink-0">
        <div className="relative flex items-center justify-center px-8">
          {hasMultiple ? (
            <>
              <button
                type="button"
                onClick={() => stepCard(-1)}
                aria-label="Previous card"
                className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-ink-200 bg-white p-1.5 text-ink-600 shadow-soft transition hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-ink-700"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => stepCard(1)}
                aria-label="Next card"
                className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-ink-200 bg-white p-1.5 text-ink-600 shadow-soft transition hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-ink-700"
              >
                <ChevronRight size={16} />
              </button>
            </>
          ) : null}

          <ClayCard account={displayAccount} active />
        </div>

        {hasMultiple ? (
          <div className="mt-3 flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5">
              {accounts.map((account, index) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => setPreviewIndex(index)}
                  aria-label={`Show ${account.label}`}
                  aria-current={index === selectedIndex ? "true" : undefined}
                  className={[
                    "h-2 rounded-full transition-all",
                    index === selectedIndex ? "w-5 bg-brand-500" : "w-2 bg-ink-300 dark:bg-ink-600",
                  ].join(" ")}
                />
              ))}
            </div>
            <p className="text-center text-[11px] font-medium text-ink-500 dark:text-ink-400">
              {displayAccount.label} · {selectedIndex + 1} of {accounts.length} · switches every{" "}
              {AUTO_CYCLE_MS / 1000}s
            </p>
          </div>
        ) : null}
      </div>

      {displayAccount ? (
        <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto border-t border-ink-200/70 pt-4 pr-0.5 scrollbar-thin dark:border-ink-700">
          {hasMultiple ? (
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-brand-500" />
                <p className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">
                  Spend share
                </p>
              </div>
              <div className="mt-3 max-h-36 space-y-2.5 overflow-y-auto pr-0.5 scrollbar-thin">
                {accounts.map((account) => (
                  <SpendShareRow
                    key={account.id}
                    account={account}
                    active={account.id === displayAccount.id}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <div className="flex items-center gap-2">
              <Receipt size={14} className="text-brand-500" />
              <p className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">
                Card insights
              </p>
            </div>
            <p className="mt-1 truncate text-sm font-semibold text-ink-800 dark:text-ink-100">
              {displayAccount.label}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <InsightTile
                label="Avg txn"
                value={formatCurrency(displayAccount.avgTxn ?? 0, { compact: true })}
              />
              <InsightTile
                label="Share"
                value={`${(displayAccount.sharePct ?? 0).toFixed(0)}%`}
                sub="of total spend"
              />
              <InsightTile
                label="Top category"
                value={
                  displayAccount.topCategory ? (
                    <CategoryBadge category={displayAccount.topCategory} size="xs" />
                  ) : (
                    "—"
                  )
                }
                sub={
                  displayAccount.topCategoryTotal
                    ? formatCurrency(displayAccount.topCategoryTotal, { compact: true })
                    : undefined
                }
              />
              <InsightTile
                label="Last activity"
                value={displayAccount.lastDate ? formatDate(displayAccount.lastDate) : "—"}
                sub={
                  displayAccount.lastDate ? (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={11} />
                      Most recent txn
                    </span>
                  ) : undefined
                }
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AccountCardStack;
