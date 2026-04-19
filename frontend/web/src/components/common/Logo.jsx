import { BarChart3 } from "lucide-react";

function Logo() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-blue-600 to-violet-500 shadow-[0_10px_24px_rgba(79,70,229,0.32)]">
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
