import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { Loader2, UploadCloud, X } from "lucide-react";
import Button from "../ui/Button";
import AnalysisModeTiles from "../upload/AnalysisModeTiles";
import PendingFilesTable from "../upload/PendingFilesTable";
import { useTransactions } from "../../context/useTransactions";
import { prepareStatementFiles, runStatementAnalysis } from "../../services/statementImport";
import { USE_MOCK, LLM_ANALYSIS_AVAILABLE } from "../../api/client";
import { useAnalysisRunState } from "../../hooks/useAnalysisRunState";

function UploadPromptModal({ open, onDismiss }) {
  const navigate = useNavigate();
  const { applyAnalysisResult } = useTransactions();
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const previouslyFocused = useRef(null);
  const [dragHighlight, setDragHighlight] = useState(false);
  const [error, setError] = useState("");
  const [pendingFiles, setPendingFiles] = useState([]);
  const {
    setPhase,
    runningMode,
    setRunningMode,
    isBusy,
    localButtonLabel,
    llmButtonLabel,
    resetRunState,
  } = useAnalysisRunState();

  const llmDisabled = USE_MOCK || !LLM_ANALYSIS_AVAILABLE;

  const resetModal = useCallback(() => {
    setPendingFiles([]);
    setError("");
    resetRunState();
    if (inputRef.current) inputRef.current.value = "";
  }, [resetRunState]);

  const onChooseFiles = useCallback(
    async (fileList) => {
      if (!fileList?.length) return;
      setError("");
      resetRunState();
      try {
        const prepared = await prepareStatementFiles(fileList);
        setPendingFiles(prepared);
      } catch (e) {
        setError(e?.message || "Could not read those files.");
        setPendingFiles([]);
      }
    },
    [resetRunState],
  );

  const runAnalysis = useCallback(
    async (mode) => {
      if (!pendingFiles.length) {
        setError("Choose at least one CSV or Excel file.");
        return;
      }

      setError("");
      setRunningMode(mode);

      try {
        const { result, mode: completedMode } = await runStatementAnalysis(pendingFiles, mode, {
          onPhase: setPhase,
        });
        await applyAnalysisResult(result);
        resetModal();
        onDismiss?.();
        navigate(completedMode === "llm" ? "/insights" : "/");
      } catch (e) {
        setError(e?.message || "Could not import those files.");
      } finally {
        setRunningMode(null);
        setPhase("idle");
      }
    },
    [pendingFiles, applyAnalysisResult, navigate, onDismiss, resetModal, setPhase, setRunningMode],
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragHighlight(false);
    onChooseFiles(e.dataTransfer.files);
  };

  const dismiss = useCallback(() => {
    if (isBusy) return;
    resetModal();
    onDismiss?.();
  }, [isBusy, onDismiss, resetModal]);

  useEffect(() => {
    if (!open) {
      resetModal();
    }
  }, [open, resetModal]);

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
            className={[
              "relative z-10 w-full clay-card-light rounded-xl3 p-5 shadow-softLg md:p-6",
              pendingFiles.length ? "max-w-2xl" : "max-w-lg",
            ].join(" ")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-300">
                Get started
              </p>
              <button
                type="button"
                onClick={dismiss}
                disabled={isBusy}
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
                {USE_MOCK
                  ? "Choose files, then run Local analysis to parse in your browser. Parsed data stays on this device."
                  : "Choose files, then pick Local (fast import) or AI (OpenRouter insights). Parsed data stays on this device."}
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
                  {isBusy ? (
                    <Loader2 size={22} className="animate-spin" />
                  ) : (
                    <UploadCloud size={22} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">
                    {pendingFiles.length ? "Add more files or run analysis" : "Drag and drop files here"}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                    Supports CSV and Excel exports from most banks · max 5 MB per file
                  </p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  multiple
                  className="hidden"
                  onChange={(e) => onChooseFiles(e.target.files)}
                />
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button
                    variant="primary"
                    icon={UploadCloud}
                    disabled={isBusy}
                    onClick={() => inputRef.current?.click()}
                  >
                    Choose files
                  </Button>
                  {!pendingFiles.length ? (
                    <Button variant="ghost" disabled={isBusy} onClick={dismiss}>
                      Maybe later
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      disabled={isBusy}
                      onClick={() => {
                        setPendingFiles([]);
                        if (inputRef.current) inputRef.current.value = "";
                      }}
                    >
                      Clear files
                    </Button>
                  )}
                </div>
              </div>

              {pendingFiles.length ? (
                <div className="mt-4 space-y-4">
                  <PendingFilesTable
                    files={pendingFiles}
                    compact
                    disabled={isBusy}
                    onRemove={(idx) => {
                      setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
                    }}
                  />
                  <AnalysisModeTiles
                    runningMode={runningMode}
                    isBusy={isBusy}
                    llmDisabled={llmDisabled}
                    localButtonLabel={localButtonLabel}
                    llmButtonLabel={llmButtonLabel}
                    onLocal={() => runAnalysis("local")}
                    onLlm={() => runAnalysis("llm")}
                  />
                </div>
              ) : null}
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
