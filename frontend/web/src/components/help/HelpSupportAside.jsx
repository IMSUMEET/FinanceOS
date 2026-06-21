import { Bug, Clock3, Lightbulb, Mail, Upload, Wrench } from "lucide-react";
import HelpToolsGraphic from "./HelpToolsGraphic";

const TOPICS = [
  {
    icon: Mail,
    label: "Email support",
    hint: "Billing, account, or general questions",
    color: "from-sky-500 to-blue-600",
  },
  {
    icon: Upload,
    label: "Import help",
    hint: "CSV uploads, parsing, and card mapping",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: Bug,
    label: "Report a bug",
    hint: "Something broken or behaving oddly",
    color: "from-rose-500 to-orange-600",
  },
  {
    icon: Lightbulb,
    label: "Feature ideas",
    hint: "Suggestions to improve FinanceOS",
    color: "from-amber-400 to-orange-500",
  },
  {
    icon: Wrench,
    label: "Troubleshooting",
    hint: "Filters, categories, and dashboard data",
    color: "from-violet-500 to-purple-600",
  },
];

function TopicRow({ icon, label, hint, color }) {
  const TopicIcon = icon;
  return (
    <div className="flex items-start gap-3 rounded-xl2 border border-white/5 bg-white/[0.03] px-3.5 py-3">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]`}
      >
        <TopicIcon size={16} className="text-white" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-ink-100">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-400">{hint}</p>
      </div>
    </div>
  );
}

function HelpSupportAside({ onPickSubject }) {
  return (
    <div className="flex h-full flex-col rounded-xl3 bg-gradient-to-br from-[#0c1424] via-[#09101d] to-[#070b14] p-6 lg:p-8">
      <div className="flex flex-1 flex-col justify-center">
        <HelpToolsGraphic size={260} />

        <p className="mt-6 text-center text-lg font-black text-white">Support tools</p>
        <p className="mx-auto mt-2 max-w-xs text-center text-sm leading-relaxed text-slate-400">
          Pick a topic below or send a message — we typically reply within one business day.
        </p>

        <div className="mt-6 space-y-2.5">
          {TOPICS.map((topic) => (
            <button
              key={topic.label}
              type="button"
              onClick={() => onPickSubject?.(topic.label)}
              className="w-full text-left transition hover:scale-[1.01] active:scale-[0.99]"
            >
              <TopicRow {...topic} />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-xl2 border border-white/5 bg-white/[0.03] px-4 py-3 text-xs text-slate-400">
        <Clock3 size={14} className="shrink-0 text-brand-300" />
        <span>Include your bank/card name in the message if the issue is import-related.</span>
      </div>
    </div>
  );
}

export default HelpSupportAside;
