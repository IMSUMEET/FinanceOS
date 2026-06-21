import { Link } from "react-router-dom";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { Download, RotateCcw, Upload } from "lucide-react";
import { useTransactions } from "../../context/useTransactions";
import { exportTransactionsCsv } from "../../utils/exportTransactions";

function SettingsPopover({ open, onClose }) {
  const { transactions, clearSessionAnalysis, resetUploadPrompt, uploadPromptDismissed } =
    useTransactions();

  async function handleClearData() {
    await clearSessionAnalysis();
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
          className="absolute right-0 top-full z-40 mt-3 w-[280px] origin-top-right rounded-xl3 border border-ink-200/80 bg-white/95 shadow-softLg backdrop-blur-xl dark:border-ink-700 dark:bg-ink-900/95 dark:shadow-softLgDark"
          role="dialog"
          aria-label="Settings"
        >
          <div className="border-b border-ink-100 px-4 py-3 dark:border-ink-800">
            <p className="text-sm font-bold text-ink-900 dark:text-ink-50">Settings</p>
            <p className="text-xs text-ink-500 dark:text-ink-400">Data and imports</p>
          </div>

          <div className="space-y-1 p-2">
            <Link
              to="/upload"
              onClick={onClose}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-ink-100 dark:hover:bg-ink-800"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                <Upload size={16} />
              </span>
              <span className="text-sm font-bold text-ink-900 dark:text-ink-50">
                Import statements
              </span>
            </Link>

            {transactions.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  exportTransactionsCsv(transactions);
                  onClose?.();
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-ink-100 dark:hover:bg-ink-800"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                  <Download size={16} />
                </span>
                <span className="text-sm font-bold text-ink-900 dark:text-ink-50">Export CSV</span>
              </button>
            ) : null}

            {transactions.length > 0 ? (
              <button
                type="button"
                onClick={handleClearData}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-ink-100 dark:hover:bg-ink-800"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                  <RotateCcw size={16} />
                </span>
                <span className="text-sm font-bold text-ink-900 dark:text-ink-50">
                  Clear all data
                </span>
              </button>
            ) : uploadPromptDismissed ? (
              <button
                type="button"
                onClick={() => {
                  resetUploadPrompt();
                  onClose?.();
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-ink-100 dark:hover:bg-ink-800"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                  <Upload size={16} />
                </span>
                <span className="text-sm font-bold text-ink-900 dark:text-ink-50">
                  Show import prompt
                </span>
              </button>
            ) : null}
          </div>
        </Motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default SettingsPopover;
