import { Activity, AlertCircle, TrendingUp } from "lucide-react";
import Badge from "../ui/Badge";
import { observationSeverityTone } from "../../utils/analysisInsights";

const SEVERITY_THEMES = {
  info: {
    header: "from-blue-600 via-indigo-600 to-violet-600",
    body: "bg-gradient-to-b from-blue-50/90 to-white dark:from-blue-950/35 dark:to-ink-900/80",
    ring: "ring-blue-200/60 dark:ring-blue-500/25",
    icon: Activity,
  },
  warning: {
    header: "from-amber-500 via-orange-500 to-rose-500",
    body: "bg-gradient-to-b from-amber-50/90 to-white dark:from-amber-950/30 dark:to-ink-900/80",
    ring: "ring-amber-200/60 dark:ring-amber-500/25",
    icon: TrendingUp,
  },
  critical: {
    header: "from-rose-600 via-red-600 to-rose-700",
    body: "bg-gradient-to-b from-rose-50/90 to-white dark:from-rose-950/35 dark:to-ink-900/80",
    ring: "ring-rose-200/60 dark:ring-rose-500/25",
    icon: AlertCircle,
  },
};

function AIInsightCard({ observation, index }) {
  const severity = observation.severity ?? "info";
  const theme = SEVERITY_THEMES[severity] ?? SEVERITY_THEMES.info;
  const Icon = theme.icon;

  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-xl3 border border-white/60 ring-1 ${theme.ring} shadow-[0_12px_28px_rgba(15,23,42,0.08)] dark:border-ink-700/80 dark:shadow-[0_12px_28px_rgba(0,0,0,0.25)]`}
    >
      <div className={`relative bg-gradient-to-br ${theme.header} px-4 py-3`}>
        <div className="relative flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
              <Icon size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Finding {index + 1}</p>
              {observation.category ? (
                <p className="truncate text-xs font-semibold text-white/90">{observation.category}</p>
              ) : null}
            </div>
          </div>
          {severity ? (
            <Badge tone={observationSeverityTone(severity)} className="shrink-0 capitalize">
              {severity}
            </Badge>
          ) : null}
        </div>
      </div>
      <div className={`flex flex-1 flex-col px-4 py-4 ${theme.body}`}>
        <h3 className="text-sm font-black leading-snug text-ink-900 dark:text-ink-50">{observation.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{observation.message}</p>
      </div>
    </article>
  );
}

export default AIInsightCard;
