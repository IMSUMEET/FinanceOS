import { AlertTriangle, ShieldCheck } from "lucide-react";
import Badge from "../ui/Badge";
import { formatCurrency } from "../../utils/format";
import { observationSeverityTone } from "../../utils/analysisInsights";

function AIAnomalyCard({ anomaly, index }) {
  const severity = anomaly.severity ?? "warning";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl3 border border-rose-200/80 ring-1 ring-rose-200/50 shadow-[0_14px_32px_rgba(244,63,94,0.12)] dark:border-rose-900/50 dark:ring-rose-500/20 dark:shadow-[0_14px_32px_rgba(244,63,94,0.08)]">
      <div className="relative bg-gradient-to-br from-rose-600 via-red-600 to-orange-600 px-4 py-3">
        <div className="absolute -right-3 -top-3 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white">
              <AlertTriangle size={16} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Anomaly {index + 1}</p>
              <p className="text-xs font-semibold text-white/90">Unusual event</p>
            </div>
          </div>
          <Badge tone={observationSeverityTone(severity)} className="capitalize">
            {severity}
          </Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col bg-gradient-to-b from-rose-50/90 to-white px-4 py-4 dark:from-rose-950/30 dark:to-ink-900/80">
        <h3 className="text-sm font-black leading-snug text-ink-900 dark:text-ink-50">{anomaly.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{anomaly.message}</p>
        {typeof anomaly.amount === "number" && anomaly.amount > 0 ? (
          <p className="tabular mt-3 text-lg font-black text-rose-600 dark:text-rose-300">
            {formatCurrency(anomaly.amount)}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function AIAnomalyEmptyState() {
  return (
    <div className="flex h-full min-h-[180px] flex-col items-center justify-center rounded-xl3 border border-dashed border-ink-200 bg-ink-50/50 px-6 py-8 text-center dark:border-ink-700 dark:bg-ink-900/40">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
        <ShieldCheck size={20} />
      </span>
      <p className="mt-3 text-sm font-bold text-ink-700 dark:text-ink-200">No unusual events</p>
      <p className="mt-1 max-w-xs text-xs text-ink-500 dark:text-ink-400">
        Your last analysis did not flag any one-off charges well above normal transaction size.
      </p>
    </div>
  );
}

export default AIAnomalyCard;
