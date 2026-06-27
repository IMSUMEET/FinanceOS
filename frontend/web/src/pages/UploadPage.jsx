import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileSpreadsheet, Trash2, UploadCloud, Wand2, FolderOpen, Sparkles } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Pill from "../components/ui/Pill";
import SectionHeader from "../components/ui/SectionHeader";
import EmptyState from "../components/ui/EmptyState";
import AnalysisModeTiles from "../components/upload/AnalysisModeTiles";
import PendingFilesTable from "../components/upload/PendingFilesTable";
import { useTransactions } from "../context/useTransactions";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { useAnalysisRunState } from "../hooks/useAnalysisRunState";
import { USE_MOCK, LLM_ANALYSIS_AVAILABLE } from "../api/client";
import { prepareStatementFiles, runStatementAnalysis } from "../services/statementImport";

function UploadPage() {
  useDocumentTitle("Import");
  const navigate = useNavigate();
  const { transactions, applyAnalysisResult, clearSessionAnalysis, restoredFromStorage } =
    useTransactions();

  const [flowPhase, setFlowPhase] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingFiles, setPendingFiles] = useState([]);
  const [lastSummary, setLastSummary] = useState(null);
  const [lastAnalysisMode, setLastAnalysisMode] = useState(null);
  const {
    setPhase,
    runningMode,
    setRunningMode,
    isBusy,
    localButtonLabel,
    llmButtonLabel,
    resetRunState,
  } = useAnalysisRunState();
  const inputRef = useRef(null);
  const folderInputRef = useRef(null);

  const llmDisabled = USE_MOCK || !LLM_ANALYSIS_AVAILABLE;

  const resetFlow = useCallback(() => {
    setFlowPhase("idle");
    resetRunState();
    setErrorMessage("");
    setPendingFiles([]);
    setLastSummary(null);
    setLastAnalysisMode(null);
    if (inputRef.current) inputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  }, [resetRunState]);

  const onChooseFiles = useCallback(
    async (fileList) => {
      if (!fileList?.length) return;
      setFlowPhase("idle");
      setErrorMessage("");
      resetRunState();

      try {
        const prepared = await prepareStatementFiles(fileList);
        setPendingFiles((prev) => {
          const byName = new Map(prev.map((pf) => [pf.name, pf]));
          for (const pf of prepared) {
            byName.set(pf.name, pf);
          }
          return Array.from(byName.values());
        });
      } catch (e) {
        setFlowPhase("error");
        setErrorMessage(e?.message || "Error reading CSV files.");
      }
    },
    [resetRunState],
  );

  const runAnalysis = useCallback(
    async (mode) => {
      if (!pendingFiles.length) {
        setFlowPhase("error");
        setErrorMessage("Choose at least one CSV file.");
        return;
      }

      setRunningMode(mode);
      setFlowPhase("idle");
      setErrorMessage("");

      try {
        const { result, mode: completedMode } = await runStatementAnalysis(pendingFiles, mode, {
          onPhase: setPhase,
        });
        await applyAnalysisResult(result);
        setLastSummary(result.summary);
        setLastAnalysisMode(completedMode);
        setFlowPhase("success");
        setPendingFiles([]);
        navigate(completedMode === "llm" ? "/insights" : "/");
      } catch (e) {
        const msg =
          e?.message || (typeof e === "string" ? e : "Something went wrong. Please try again.");
        setFlowPhase("error");
        setErrorMessage(msg);
      } finally {
        setRunningMode(null);
        setPhase("idle");
      }
    },
    [pendingFiles, applyAnalysisResult, navigate, setPhase, setRunningMode],
  );

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onChooseFiles(e.dataTransfer.files);
  };

  const dragOver = useRef(false);
  const [dragHighlight, setDragHighlight] = useState(false);

  return (
    <section className="space-y-5 pt-2">
      {restoredFromStorage ? (
        <p className="rounded-xl2 border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-100">
          Restored your saved data from this device.
        </p>
      ) : null}

      <Card>
        <SectionHeader
          eyebrow="Bring your data"
          title="Import transactions from CSV"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="soft">{transactions.length} in store</Pill>
              {transactions.length > 0 ? (
                <Button variant="ghost" icon={Trash2} onClick={clearSessionAnalysis}>
                  Clear all data
                </Button>
              ) : null}
            </div>
          }
        />

        <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
          Files are parsed on this device. Nothing is uploaded to our servers unless you connect a
          backend API.
        </p>
        <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
          Supported exports from Chase, Amex, Citi, Capital One, Discover, and generic CSV. Max 5 MB
          per file.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!dragOver.current) {
              dragOver.current = true;
              setDragHighlight(true);
            }
          }}
          onDragLeave={() => {
            dragOver.current = false;
            setDragHighlight(false);
          }}
          onDrop={(e) => {
            dragOver.current = false;
            setDragHighlight(false);
            onDrop(e);
          }}
          className={[
            "mt-6 flex flex-col items-center justify-center gap-3 rounded-xl3 border-2 border-dashed px-6 py-12 text-center transition",
            dragHighlight
              ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30"
              : "border-ink-200 bg-white/60 hover:border-brand-400 dark:border-ink-700 dark:bg-ink-800/40",
          ].join(" ")}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-brand">
            <UploadCloud size={24} />
          </div>
          <p className="text-lg font-black text-ink-900 dark:text-ink-50">
            Drop CSV or Excel files here
          </p>
          <p className="max-w-md text-sm text-ink-500 dark:text-ink-400">
            {USE_MOCK
              ? "Mock mode: choose Local analysis to parse in your browser."
              : "After choosing files, pick Local (fast) or AI (OpenRouter insights)."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              onClick={() => inputRef.current?.click()}
              icon={FileSpreadsheet}
              disabled={isBusy}
            >
              Choose files
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              multiple
              className="hidden"
              onChange={(e) => onChooseFiles(e.target.files)}
            />
            <Button
              onClick={() => folderInputRef.current?.click()}
              icon={FolderOpen}
              disabled={isBusy}
            >
              Choose folder
            </Button>
            <input
              ref={folderInputRef}
              type="file"
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
              onChange={(e) => onChooseFiles(e.target.files)}
            />
          </div>
          {pendingFiles.length ? (
            <div className="mt-8 w-full max-w-2xl">
              <PendingFilesTable
                files={pendingFiles}
                disabled={isBusy}
                onRemove={(idx) => {
                  setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
                }}
              />
            </div>
          ) : null}

          {pendingFiles.length ? (
            <AnalysisModeTiles
              className="mt-6 max-w-2xl"
              runningMode={runningMode}
              isBusy={isBusy}
              llmDisabled={llmDisabled}
              localButtonLabel={localButtonLabel}
              llmButtonLabel={llmButtonLabel}
              onLocal={() => runAnalysis("local")}
              onLlm={() => runAnalysis("llm")}
            />
          ) : null}
        </div>
      </Card>

      {flowPhase === "success" && lastSummary ? (
        <Card>
          <EmptyState
            icon={lastAnalysisMode === "llm" ? Sparkles : Wand2}
            title={`${lastSummary.totalTransactions} transactions analyzed`}
            description={[
              lastAnalysisMode === "llm"
                ? "AI analysis — OpenRouter categories and insights."
                : lastAnalysisMode === "local" && !USE_MOCK
                  ? "Local analysis — server rule-based categories."
                  : "Browser mock analysis.",
              "Head to Overview, Transactions, or Insights to explore results.",
            ].join(" ")}
            action={<Button onClick={resetFlow}>Analyze more</Button>}
          />
        </Card>
      ) : null}

      {flowPhase === "error" ? (
        <Card>
          <EmptyState
            icon={Trash2}
            title="Could not analyze"
            description={errorMessage}
            action={<Button onClick={resetFlow}>Try again</Button>}
          />
        </Card>
      ) : null}
    </section>
  );
}

export default UploadPage;
