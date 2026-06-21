import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { Loader2, UploadCloud, X } from "lucide-react";
import Button from "../ui/Button";
import { useTransactions } from "../../context/useTransactions";
import { importStatementFiles } from "../../services/statementImport";

function UploadPromptModal({ open, onDismiss }) {
  const { applyAnalysisResult } = useTransactions();
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const previouslyFocused = useRef(null);
  const [dragHighlight, setDragHighlight] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = useCallback(
    async (fileList) => {
      if (!fileList?.length) return;
      setError("");
      setBusy(true);
      try {
        const analysis = await importStatementFiles(fileList);
        await applyAnalysisResult(analysis);
      } catch (e) {
        setError(e?.message || "Could not import those files.");
      } finally {
        setBusy(false);
      }
    },
    [applyAnalysisResult],
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragHighlight(false);
    handleFiles(e.dataTransfer.files);
  };

  const dismiss = useCallback(() => {
    if (busy) return;
    onDismiss?.();
  }, [busy, onDismiss]);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    function onKey(e) {
      if (e.key === "Escape") {
        dismiss();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKey);

    const t = window.setTimeout(() => {
      const focusable = panelRef.current?.querySelector(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    }, 50);

    return () => {
      document.removeEventListener("keydown", onKey);
      body.style.overflow = prevOverflow;
      window.clearTimeout(t);
      previouslyFocused.current?.focus?.();
    };
  }, [open, dismiss]);

  const modalNode = (
    <AnimatePresence>
      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-prompt-title"
        >
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm dark:bg-black/65"
            onClick={dismiss}
          />
          <Motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-lg clay-card-light rounded-xl3 p-5 shadow-softLg md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-300">
                Get started
              </p>
              <button
                type="button"
                onClick={dismiss}
                disabled={busy}
                aria-label="Close"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink-200 text-ink-500 transition hover:border-ink-300 hover:bg-ink-100 hover:text-ink-800 disabled:opacity-50 dark:border-ink-600 dark:text-ink-400 dark:hover:border-ink-500 dark:hover:bg-ink-700/80 dark:hover:text-ink-100"
              >
                <X size={15} strokeWidth={2.25} />
              </button>
            </div>

            <div className="mt-2">
              <h2
                id="upload-prompt-title"
                className="text-lg font-black text-ink-900 md:text-xl dark:text-ink-50"
              >
                Upload bank statements to see your spending
              </h2>
              <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
                Drop CSV or Excel files below, or browse the app with empty charts until you&apos;re
                ready. Parsed data is saved on this device only.
              </p>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragHighlight(true);
              }}
              onDragLeave={() => setDragHighlight(false)}
              onDrop={onDrop}
              className={[
                "mt-4 rounded-xl2 border-2 border-dashed p-5 transition md:p-6",
                dragHighlight
                  ? "border-brand-400 bg-brand-50/80 dark:border-brand-500 dark:bg-brand-950/30"
                  : "border-ink-200 bg-ink-50/60 dark:border-ink-700 dark:bg-ink-800/40",
              ].join(" ")}
            >
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-teal-500 text-white shadow-brand">
                  {busy ? (
                    <Loader2 size={22} className="animate-spin" />
                  ) : (
                    <UploadCloud size={22} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">
                    Drag and drop files here
                  </p>
                  <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                    Supports CSV and Excel exports from most banks
                  </p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button
                    variant="primary"
                    icon={UploadCloud}
                    disabled={busy}
                    onClick={() => inputRef.current?.click()}
                  >
                    Choose files
                  </Button>
                  <Button variant="ghost" disabled={busy} onClick={dismiss}>
                    Maybe later
                  </Button>
                </div>
              </div>
            </div>

            {error ? (
              <p className="mt-3 rounded-xl2 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
                {error}
              </p>
            ) : null}
          </Motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return modalNode;
  return createPortal(modalNode, document.body);
}

export default UploadPromptModal;
