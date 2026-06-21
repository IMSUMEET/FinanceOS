import { useCallback, useState } from "react";

export function useAnalysisRunState() {
  const [phase, setPhase] = useState("idle");
  const [runningMode, setRunningMode] = useState(null);

  const isBusy = phase === "uploading" || phase === "analyzing";

  const resetRunState = useCallback(() => {
    setPhase("idle");
    setRunningMode(null);
  }, []);

  const localButtonLabel =
    runningMode === "local"
      ? phase === "uploading"
        ? "Uploading…"
        : phase === "analyzing"
          ? "Analyzing…"
          : "Local analysis"
      : "Local analysis";

  const llmButtonLabel =
    runningMode === "llm"
      ? phase === "uploading"
        ? "Uploading…"
        : phase === "analyzing"
          ? "Analyzing with AI…"
          : "AI analysis"
      : "AI analysis";

  return {
    phase,
    setPhase,
    runningMode,
    setRunningMode,
    isBusy,
    localButtonLabel,
    llmButtonLabel,
    resetRunState,
  };
}
