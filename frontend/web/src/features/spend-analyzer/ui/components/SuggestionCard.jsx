import { useMemo } from "react";

export default function SuggestionCard({ suggestion, onApply }) {
  const { text, tone = "indigo", hint } = suggestion || {};
  const interactive = typeof onApply === "function";

  const toneClass = useMemo(() => `tone-${tone}`, [tone]);

  if (!text) return null;

  return (
    <div className={`suggestionCard ${toneClass} ${interactive ? "suggestionCardInteractive" : ""}`} onClick={interactive ? onApply : undefined} style={{ cursor: interactive ? "pointer" : "default" }}>
      <div className="suggestionTop">
        <span className="suggestionIcon" aria-hidden>
          ✦
        </span>
        <span className="suggestionTitle">Next best move</span>
      </div>
      <p className="suggestionText">{text}</p>
      {hint ? <div className="suggestionHint">{hint}</div> : null}
    </div>
  );
}

