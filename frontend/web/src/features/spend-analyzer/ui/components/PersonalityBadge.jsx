export default function PersonalityBadge({ label, tone = "indigo" }) {
  if (!label) return null;
  return <span className={`personalityBadge tone-${tone}`}>{label}</span>;
}

