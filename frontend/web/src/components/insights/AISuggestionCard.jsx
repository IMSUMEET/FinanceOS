import { Sparkles, TrendingUp, Wallet, Zap } from "lucide-react";
import { formatCurrency } from "../../utils/format";

const CARD_ICONS = [Sparkles, TrendingUp, Wallet];

export const AI_SUGGESTION_THEMES = [
  {
    header: "from-violet-600 via-purple-500 to-fuchsia-500",
    ring: "ring-violet-200/60 dark:ring-violet-500/30",
    shadow: "shadow-[0_18px_36px_rgba(124,58,237,0.22)] dark:shadow-[0_18px_36px_rgba(124,58,237,0.15)]",
    body: "bg-gradient-to-b from-violet-50/90 to-white dark:from-violet-950/40 dark:to-ink-900/80",
    pill: "bg-violet-500/15 text-violet-700 dark:bg-violet-400/15 dark:text-violet-200",
    savings: "text-fuchsia-600 dark:text-fuchsia-300",
    number: "text-white/90",
  },
  {
    header: "from-emerald-500 via-teal-500 to-cyan-500",
    ring: "ring-emerald-200/60 dark:ring-emerald-500/30",
    shadow: "shadow-[0_18px_36px_rgba(16,185,129,0.22)] dark:shadow-[0_18px_36px_rgba(16,185,129,0.12)]",
    body: "bg-gradient-to-b from-emerald-50/90 to-white dark:from-emerald-950/35 dark:to-ink-900/80",
    pill: "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
    savings: "text-teal-600 dark:text-teal-300",
    number: "text-white/90",
  },
  {
    header: "from-amber-500 via-orange-500 to-rose-500",
    ring: "ring-amber-200/60 dark:ring-amber-500/30",
    shadow: "shadow-[0_18px_36px_rgba(245,158,11,0.22)] dark:shadow-[0_18px_36px_rgba(245,158,11,0.12)]",
    body: "bg-gradient-to-b from-amber-50/90 to-white dark:from-amber-950/30 dark:to-ink-900/80",
    pill: "bg-amber-500/15 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
    savings: "text-orange-600 dark:text-orange-300",
    number: "text-white/90",
  },
];

const IMPACT_LABEL = {
  high: "High impact",
  medium: "Medium impact",
  low: "Quick win",
};

const ACTION_LABELS = ["Primary action", "Second action", "Third action"];

function AISuggestionCard({ index, theme, suggestion, placeholder = false, featured = false }) {
  const Icon = CARD_ICONS[index] ?? Sparkles;

  if (placeholder) {
    return (
      <article
        className={`flex h-full min-h-[220px] flex-col overflow-hidden rounded-xl3 border border-dashed border-ink-200 bg-ink-50/50 dark:border-ink-700 dark:bg-ink-900/40`}
      >
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500">
            <Zap size={22} />
          </span>
          <p className="mt-4 text-sm font-bold text-ink-500 dark:text-ink-400">Suggestion {index + 1}</p>
          <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">
            Run AI analysis again for another personalized tip.
          </p>
        </div>
      </article>
    );
  }

  const impact = suggestion.impact ?? "medium";

  return (
    <article
      className={`group relative flex h-full ${featured ? "min-h-[280px]" : "min-h-[220px]"} flex-col overflow-hidden rounded-xl3 border border-white/60 ring-1 ${theme.ring} ${theme.shadow} transition-shadow duration-300 hover:shadow-lg dark:border-ink-700/80`}
    >
      <div className={`relative bg-gradient-to-br ${theme.header} px-5 py-4`}>
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-sm">
              <Icon size={20} />
            </span>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.number}`}>
                {ACTION_LABELS[index] ?? "Recommended action"}
              </p>
              <p className="text-lg font-black text-white">#{index + 1}</p>
            </div>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${theme.pill}`}>
            {IMPACT_LABEL[impact] ?? IMPACT_LABEL.medium}
          </span>
        </div>
      </div>

      <div className={`flex flex-1 flex-col px-5 py-5 ${theme.body}`}>
        <h3 className="text-base font-black leading-snug text-ink-900 dark:text-ink-50">{suggestion.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{suggestion.message}</p>

        {Array.isArray(suggestion.breakdown) && suggestion.breakdown.length > 1 ? (
          <ul className="mt-4 space-y-2">
            {suggestion.breakdown.map((row) => (
              <li
                key={row.label}
                className="flex items-center justify-between gap-3 rounded-xl2 border border-white/80 bg-white/70 px-3 py-2.5 dark:border-ink-700/60 dark:bg-ink-900/50"
              >
                <span className="min-w-0 truncate text-sm font-bold text-ink-900 dark:text-ink-50">{row.label}</span>
                <span className="tabular shrink-0 text-xs font-semibold text-ink-500 dark:text-ink-400">
                  {formatCurrency(row.monthlyAvg)}/mo · {row.sharePct}%
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto pt-4">
          {suggestion.estimatedMonthlySavings > 0 ? (
            <p className={`tabular text-sm font-black ${theme.savings}`}>
              Save ~{formatCurrency(suggestion.estimatedMonthlySavings)}/mo
            </p>
          ) : (
            <p className="text-xs font-semibold text-ink-400 dark:text-ink-500">
              Personalized from your CSV analysis
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export default AISuggestionCard;
