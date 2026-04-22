import { Link } from "react-router-dom";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { Bell, Calendar, Moon, RotateCcw, Sun, Upload } from "lucide-react";
import { useTransactions } from "../../context/useTransactions";
import { useTheme } from "../../hooks/useTheme";
import { formatMonth } from "../../utils/format";
import seed from "../../data/mockTransactions";

function SettingsPopover({ open, onClose }) {
  const {
    months,
    filters,
    setFilters,
    ALL_MONTHS_SENTINEL,
    replaceAll,
  } = useTransactions();
  const { theme, toggleTheme } = useTheme();

  const monthOptions = [
    { value: ALL_MONTHS_SENTINEL, label: "All months" },
    ...months.map((m) => ({ value: m, label: formatMonth(m) })),
  ];

  function handleReset() {
    replaceAll(seed);
    setFilters((f) => ({ ...f, month: ALL_MONTHS_SENTINEL, categories: [], search: "" }));
    onClose?.();
  }

  return (
    <AnimatePresence>
      {open ? (
        <Motion.div
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="absolute right-0 top-full z-40 mt-3 w-[320px] origin-top-right rounded-xl3 border border-white/70 bg-white/95 shadow-softLg backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/95 dark:shadow-softLgDark"
          role="dialog"
          aria-label="Quick settings"
        >
          <div className="border-b border-ink-100 px-5 py-3 dark:border-ink-800">
            <p className="text-sm font-bold text-ink-900 dark:text-ink-50">Quick settings</p>
            <p className="text-xs text-ink-500 dark:text-ink-400">Tweak the demo on the fly.</p>
          </div>

          <div className="space-y-1 p-2">
            <label className="flex flex-col gap-1.5 rounded-2xl px-3 py-2.5 hover:bg-ink-100 dark:hover:bg-ink-800">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                <Calendar size={12} /> Filter month
              </span>
              <select
                value={filters.month}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, month: e.target.value }));
                  e.currentTarget.blur();
                }}
                className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-800 outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
              >
                {monthOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => {
                toggleTheme();
              }}
              className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition hover:bg-ink-100 dark:hover:bg-ink-800"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                </span>
                <span>
                  <span className="block text-sm font-bold text-ink-900 dark:text-ink-50">
                    {theme === "dark" ? "Light mode" : "Dark mode"}
                  </span>
                  <span className="block text-xs text-ink-500 dark:text-ink-400">
                    Currently: {theme}
                  </span>
                </span>
              </span>
              <span className="text-xs font-bold text-brand-600 dark:text-brand-300">
                Toggle
              </span>
            </button>

            <button
              onClick={handleReset}
              className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition hover:bg-ink-100 dark:hover:bg-ink-800"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                  <RotateCcw size={16} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-ink-900 dark:text-ink-50">Reset demo data</span>
                  <span className="block text-xs text-ink-500 dark:text-ink-400">Restore the seed transactions</span>
                </span>
              </span>
            </button>

            <Link
              to="/upload"
              onClick={onClose}
              className="flex w-full items-center justify-between rounded-2xl px-3 py-3 transition hover:bg-ink-100 dark:hover:bg-ink-800"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                  <Upload size={16} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-ink-900 dark:text-ink-50">Import a CSV</span>
                  <span className="block text-xs text-ink-500 dark:text-ink-400">Bring your own transactions</span>
                </span>
              </span>
            </Link>

            <div className="flex items-center justify-between rounded-2xl px-3 py-3 opacity-70">
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                  <Bell size={16} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-ink-900 dark:text-ink-50">Email digests</span>
                  <span className="block text-xs text-ink-500 dark:text-ink-400">Weekly insights to your inbox</span>
                </span>
              </span>
              <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold uppercase text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                Soon
              </span>
            </div>
          </div>
        </Motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default SettingsPopover;
