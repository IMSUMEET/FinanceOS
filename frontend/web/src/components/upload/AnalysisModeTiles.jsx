import { Loader2, Sparkles, Zap } from "lucide-react";
import Button from "../ui/Button";

function AnalysisModeTiles({
  runningMode,
  isBusy,
  llmDisabled,
  localButtonLabel,
  llmButtonLabel,
  onLocal,
  onLlm,
  className = "",
}) {
  return (
    <div className={["grid w-full gap-3 sm:grid-cols-2", className].filter(Boolean).join(" ")}>
      <div className="flex flex-col gap-2 rounded-xl2 border border-ink-200 bg-white p-4 text-left dark:border-ink-700 dark:bg-ink-900/60">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
          Lambda 1 · Local
        </p>
        <p className="text-sm text-ink-600 dark:text-ink-300">
          Rule-based categories on the server. Fast path for importing transactions.
        </p>
        <Button
          onClick={onLocal}
          icon={runningMode === "local" && isBusy ? Loader2 : Zap}
          className={runningMode === "local" && isBusy ? "[&_svg]:animate-spin w-full" : "w-full"}
          disabled={isBusy}
        >
          {localButtonLabel}
        </Button>
      </div>

      <div className="flex flex-col gap-2 rounded-xl2 border border-ink-200 bg-white p-4 text-left dark:border-ink-700 dark:bg-ink-900/60">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
          Lambda 2 · AI
        </p>
        <p className="text-sm text-ink-600 dark:text-ink-300">
          OpenRouter categorization plus deduplicated AI insights. Slower, richer results.
        </p>
        <Button
          variant="dark"
          onClick={onLlm}
          icon={runningMode === "llm" && isBusy ? Loader2 : Sparkles}
          className={runningMode === "llm" && isBusy ? "[&_svg]:animate-spin w-full" : "w-full"}
          disabled={isBusy || llmDisabled}
          title={
            llmDisabled ? "Configure VITE_USE_MOCK=false and VITE_AI_ANALYZER_URL" : undefined
          }
        >
          {llmButtonLabel}
        </Button>
        {llmDisabled ? (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Requires{" "}
            <code className="rounded bg-ink-100 px-1 dark:bg-ink-800">VITE_AI_ANALYZER_URL</code> in
            production.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default AnalysisModeTiles;
