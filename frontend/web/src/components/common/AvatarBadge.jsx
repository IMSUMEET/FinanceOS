import { Sparkles } from "lucide-react";

function AvatarBadge() {
  return (
    <div className="flex items-center gap-3 rounded-full bg-slate-100 px-3 py-2 shadow-md border border-white/60">
      <div className="relative h-11 w-11 rounded-full bg-gradient-to-br from-indigo-500 via-violet-400 to-sky-400 shadow-sm flex items-center justify-center">
        <div className="absolute inset-[3px] rounded-full bg-slate-100 flex items-center justify-center">
          <div className="relative h-7 w-7 rounded-full bg-gradient-to-br from-orange-300 to-fuchsia-400">
            <div className="absolute left-[5px] top-[8px] h-1.5 w-1.5 rounded-full bg-slate-900" />
            <div className="absolute right-[5px] top-[8px] h-1.5 w-1.5 rounded-full bg-slate-900" />
            <div className="absolute left-1/2 top-[14px] h-1.5 w-3 -translate-x-1/2 rounded-full border-b-2 border-slate-900" />
          </div>
        </div>

        <div className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-white shadow-sm flex items-center justify-center">
          <Sparkles size={10} className="text-indigo-600" />
        </div>
      </div>

      <div className="hidden xl:block leading-tight">
        <p className="text-sm font-semibold text-slate-900">Finance Buddy</p>
        <p className="text-xs text-slate-500">Fun mode on</p>
      </div>
    </div>
  );
}

export default AvatarBadge;
