export default function SummaryCard({
  label,
  value,
  hint,
  trend,
  trendPositive,
  variant = "metric",
  className = "",
  badge,
  badgeText,
  badgeTone,
  valueClassName = "",
}) {
  return (
    <div className={`summaryCard ${variant === "prose" ? "summaryCardProse" : ""} ${className}`.trim()}>
      <span className="summaryCardLabel">{label}</span>
      {badge ? badge : badgeText ? <span className={`summaryCardBadge ${badgeTone ? `tone-${badgeTone}` : ""}`.trim()}>{badgeText}</span> : null}
      <span className={`summaryCardValue ${valueClassName}`.trim()}>{value}</span>
      {hint != null && hint !== "" && <span className="summaryCardHint">{hint}</span>}
      {trend != null && trend !== "" && (
        <span
          className={`summaryCardTrend ${trendPositive === true ? "isUp" : trendPositive === false ? "isDown" : "isNeutral"}`}
        >
          {trend}
        </span>
      )}
    </div>
  );
}
