import { BarChart3 } from "lucide-react";

function Logo() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-brand-400 to-brand-600 border border-brand-300/30 shadow-[0_10px_24px_rgba(13,148,136,0.2),inset_-3px_-3px_6px_rgba(0,0,0,0.15),inset_3px_3px_6px_rgba(255,255,255,0.25)]">
        <BarChart3 size={24} className="text-white" />
      </div>

      <div className="leading-tight">
        <p className="text-[1.7rem] font-black tracking-tight text-slate-900 dark:text-ink-50">
          FinanceOS
        </p>
        <p className="text-sm font-medium text-slate-500 dark:text-ink-400">
          personal finance intelligence
        </p>
      </div>
    </div>
  );
}

export default Logo;
