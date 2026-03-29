export default function InsightCard({ icon, tone = "indigo", text, hint, onClick, className = "", style = {} }) {
  const interactive = typeof onClick === "function";

  return (
    <blockquote
      className={`insightCard ${interactive ? "insightCardInteractive" : ""} tone-${tone} ${className}`.trim()}
      onClick={interactive ? onClick : undefined}
      style={{ cursor: interactive ? "pointer" : "default", ...style }}
    >
      <div className="insightCardTop">
        {icon && <span className="insightIcon">{icon}</span>}
        {hint && <span className="insightHint">{hint}</span>}
      </div>
      <p className="insightText insightTextStrong">{text}</p>
      {interactive && <div className="insightClickHint">Click to explore</div>}
    </blockquote>
  );
}

