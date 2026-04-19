import { Link } from "react-router-dom";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { ArrowUpRight, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { useTransactions } from "../../context/useTransactions";
import {
  detectRecurring,
  topAnomalies,
  topCategoryMovers,
} from "../../utils/insights";
import { formatAmountSpend, formatCurrency, formatPct } from "../../utils/format";

function buildNotifications(transactions) {
  const items = [];
  const movers = topCategoryMovers(transactions);
  if (movers.length) {
    const [m] = movers;
    items.push({
      id: `mover-${m.category}`,
      icon: m.deltaAbs >= 0 ? TrendingUp : TrendingDown,
      tone: m.deltaAbs >= 0 ? "warn" : "good",
      title: `${m.category} ${m.deltaAbs >= 0 ? "up" : "down"} ${formatPct(Math.abs(m.deltaPct))}`,
      body: `${formatCurrency(m.prev)} → ${formatCurrency(m.current)} vs last month.`,
      to: "/insights",
    });
  }
  const anomalies = topAnomalies(transactions, 1);
  if (anomalies.length) {
    const a = anomalies[0];
    items.push({
      id: `anomaly-${a.id}`,
      icon: Sparkles,
      tone: "warn",
      title: `Unusual charge at ${a.merchant_normalized}`,
      body: `${formatAmountSpend(a.amount)} — ${a.ratio.toFixed(1)}× the typical amount.`,
      to: "/transactions",
    });
  }
  const recurring = detectRecurring(transactions).slice(0, 1);
  if (recurring.length) {
    const r = recurring[0];
    items.push({
      id: `recur-${r.merchant}`,
      icon: Sparkles,
      tone: "info",
      title: `${r.merchant} runs every month`,
      body: `Roughly ${formatCurrency(r.avg)} per month — ${formatCurrency(r.annualized)} a year.`,
      to: "/insights",
    });
  }
  return items;
}

const TONE_STYLES = {
  warn: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
  good: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
  info: "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200",
};

function NotificationsPopover({ open, onClose }) {
  const { transactions } = useTransactions();
  const items = buildNotifications(transactions);

  return (
    <AnimatePresence>
      {open ? (
        <Motion.div
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="absolute right-0 top-full z-40 mt-3 w-[340px] origin-top-right rounded-xl3 border border-white/70 bg-white/95 shadow-softLg backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/95 dark:shadow-softLgDark"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3 dark:border-ink-800">
            <p className="text-sm font-bold text-ink-900 dark:text-ink-50">Notifications</p>
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
              {items.length}
            </span>
          </div>
          <div className="max-h-[360px] overflow-y-auto p-2">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-500 dark:text-ink-400">
                You're all caught up.
              </p>
            ) : (
              items.map((n) => {
                const Icon = n.icon;
                return (
                  <Link
                    key={n.id}
                    to={n.to}
                    onClick={onClose}
                    className="group flex items-start gap-3 rounded-2xl px-3 py-3 transition hover:bg-ink-100 dark:hover:bg-ink-800"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${TONE_STYLES[n.tone]}`}
                    >
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink-900 dark:text-ink-50">
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{n.body}</p>
                    </div>
                    <ArrowUpRight
                      size={14}
                      className="mt-1 shrink-0 text-ink-400 transition group-hover:text-brand-600 dark:text-ink-500 dark:group-hover:text-brand-300"
                    />
                  </Link>
                );
              })
            )}
          </div>
          <div className="border-t border-ink-100 px-5 py-3 text-right dark:border-ink-800">
            <Link
              to="/insights"
              onClick={onClose}
              className="text-xs font-bold text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
            >
              See all insights →
            </Link>
          </div>
        </Motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default NotificationsPopover;
