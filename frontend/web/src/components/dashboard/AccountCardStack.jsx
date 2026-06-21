import { useEffect, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { CalendarDays, Receipt, TrendingUp } from "lucide-react";
import CategoryBadge from "../ui/CategoryBadge";
import { themeForAccount } from "../../utils/accountCards";
import { formatCurrency, formatDate } from "../../utils/format";

const AUTO_CYCLE_MS = 10000;
const CARD_TRANSITION = { duration: 1.1, ease: [0.22, 1, 0.36, 1] };
const CARD_ASPECT = "aspect-[86/54]";
const MAX_DOTS = 8;

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

function UsagePointer({ account }) {
  const theme = themeForAccount(account.label);
  const share = account.sharePct ?? 0;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Motion.div
        key={account.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-brand-500 dark:text-brand-300" />
            <span className="text-xs font-bold uppercase tracking-wider text-ink-600 dark:text-ink-300">
              Spend share
            </span>
          </div>
          <span className="tabular text-xs font-bold text-ink-900 dark:text-ink-50">
            {share.toFixed(0)}%
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800/90">
          <Motion.div
            className={`h-full rounded-full bg-gradient-to-r ${theme.barGradient ?? theme.gradient} shadow-[0_0_10px_rgba(99,102,241,0.45)] dark:shadow-[0_0_12px_rgba(167,139,250,0.55)]`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(share, 4)}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <p className="mt-1.5 truncate text-[11px] text-ink-500 dark:text-ink-400">
          {formatCurrency(account.total, { compact: true })} on this card
        </p>
      </Motion.div>
    </AnimatePresence>
  );
}

function CardInsights({ account, grandTotal }) {
  if (!account) return null;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Motion.div
        key={account.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-2">
          <Receipt size={14} className="text-brand-500" />
          <p className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">
            Card insights
          </p>
        </div>
        <p className="mt-1 truncate text-sm font-semibold text-ink-800 dark:text-ink-100">
          {account.label}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <InsightTile
            label="Avg txn"
            value={formatCurrency(account.avgTxn ?? 0, { compact: true })}
          />
          <InsightTile
            label="Share"
            value={`${(account.sharePct ?? 0).toFixed(0)}%`}
            sub={`${formatCurrency(account.total, { compact: true })} of ${formatCurrency(grandTotal, { compact: true })}`}
          />
          <InsightTile
            label="Top category"
            value={
              account.topCategory ? <CategoryBadge category={account.topCategory} size="xs" /> : "—"
            }
            sub={
              account.topCategoryTotal
                ? formatCurrency(account.topCategoryTotal, { compact: true })
                : undefined
            }
          />
          <InsightTile
            label="Last activity"
            value={account.lastDate ? formatDate(account.lastDate) : "—"}
            sub={
              account.lastDate ? (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays size={11} />
                  Most recent txn
                </span>
              ) : undefined
            }
          />
        </div>
      </Motion.div>
    </AnimatePresence>
  );
}

function CardPager({ accounts, selectedIndex, onSelect }) {
  if (accounts.length <= 1) return null;

  const showDots = accounts.length <= MAX_DOTS;
  const active = accounts[selectedIndex];
  const go = (delta) => onSelect((selectedIndex + delta + accounts.length) % accounts.length);

  return (
    <div className="mt-2 flex flex-col items-center gap-1.5">
      {showDots ? (
        <div className="flex items-center justify-center gap-1.5">
          {accounts.map((account, index) => (
            <button
              key={account.id}
              type="button"
              onClick={() => onSelect(index)}
              aria-label={`Show ${account.label}`}
              aria-current={index === selectedIndex ? "true" : undefined}
              className={[
                "h-2 rounded-full transition-all duration-500",
                index === selectedIndex ? "w-5 bg-brand-500" : "w-2 bg-ink-300 dark:bg-ink-600",
              ].join(" ")}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous card"
            className="rounded-full border border-ink-200 px-2.5 py-1 text-[11px] font-bold text-ink-600 transition hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            Prev
          </button>
          <span className="tabular rounded-full bg-ink-100 px-3 py-1 text-xs font-bold text-ink-700 dark:bg-ink-800 dark:text-ink-200">
            {selectedIndex + 1} / {accounts.length}
          </span>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next card"
            className="rounded-full border border-ink-200 px-2.5 py-1 text-[11px] font-bold text-ink-600 transition hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            Next
          </button>
        </div>
      )}
      <p className="max-w-full truncate text-center text-[11px] text-ink-500 dark:text-ink-400">
        {active?.label} · every {AUTO_CYCLE_MS / 1000}s
      </p>
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
    <div className="flex h-full min-h-[22rem] flex-col rounded-xl3 border border-ink-200/70 bg-white/80 p-4 shadow-soft backdrop-blur-xl dark:border-ink-700 dark:bg-ink-900/85 dark:shadow-softDark md:p-5">
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
          {formatCurrency(grandTotal, { compact: true })} · {totalTxns} txns
        </p>
      </div>

      <div className="mt-3 shrink-0">
        <div
          className={`relative w-full overflow-hidden rounded-[1.25rem] ${CARD_ASPECT}`}
          aria-live="polite"
        >
          <AnimatePresence mode="wait" initial={false}>
            <Motion.div
              key={displayAccount.id}
              initial={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
              transition={CARD_TRANSITION}
              className="absolute inset-0"
            >
              <ClayCard account={displayAccount} active />
            </Motion.div>
          </AnimatePresence>
        </div>
        <CardPager accounts={accounts} selectedIndex={selectedIndex} onSelect={setPreviewIndex} />
      </div>

      {displayAccount ? (
        <div className="mt-auto flex min-h-0 flex-1 flex-col justify-end gap-4 border-t border-ink-200/70 pt-4 dark:border-ink-700">
          <UsagePointer account={displayAccount} />
          <CardInsights account={displayAccount} grandTotal={grandTotal} />
        </div>
      ) : null}
    </div>
  );
}

export default AccountCardStack;
