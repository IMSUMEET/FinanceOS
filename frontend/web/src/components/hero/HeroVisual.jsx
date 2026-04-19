import { motion as Motion } from "framer-motion";
import { PieChart, Wallet, TrendingUp, Sparkles } from "lucide-react";

function FloatingCard({ className = "", children, delay = 0 }) {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay }}
      className={`absolute rounded-[28px] bg-slate-100 border border-white/60 shadow-[0_10px_40px_rgba(15,23,42,0.08)] ${className}`}
    >
      {children}
    </Motion.div>
  );
}

function HeroVisual() {
  return (
    <div className="relative h-[520px] w-full">
      <Motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-indigo-500/25 via-sky-300/25 to-fuchsia-300/25 blur-2xl"
      />

      <FloatingCard delay={0.1} className="left-2 top-10 w-[180px] p-4">
        <div className="flex items-center justify-between">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600/80 shadow-sm flex items-center justify-center">
            <Wallet size={18} className="text-slate-900" />
          </div>
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-indigo-600">+12%</span>
        </div>
        <p className="mt-4 text-sm text-slate-500">Monthly balance</p>
        <h3 className="text-2xl font-black text-slate-900">$4,820</h3>
      </FloatingCard>

      <FloatingCard delay={0.2} className="right-3 top-6 w-[190px] p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">Spending split</p>
          <PieChart size={18} className="text-indigo-600" />
        </div>

        <div className="mt-4 flex items-end gap-2">
          <div className="h-16 w-6 rounded-full bg-indigo-500/85" />
          <div className="h-24 w-6 rounded-full bg-fuchsia-400/80" />
          <div className="h-12 w-6 rounded-full bg-sky-400/90" />
          <div className="h-20 w-6 rounded-full bg-sky-400/90" />
        </div>
      </FloatingCard>

      <FloatingCard delay={0.3} className="left-10 bottom-12 w-[210px] p-4">
        <p className="text-sm font-bold text-slate-900">Top category</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-300 to-fuchsia-400 shadow-sm flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Food & Dining</p>
            <p className="text-xl font-black text-slate-900">$1,245</p>
          </div>
        </div>
      </FloatingCard>

      <FloatingCard delay={0.35} className="right-6 bottom-8 w-[220px] p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">Weekly trend</p>
          <TrendingUp size={18} className="text-emerald-500" />
        </div>

        <div className="mt-5 flex items-end gap-2">
          {[42, 66, 48, 88, 74, 96, 68].map((height, index) => (
            <div
              key={index}
              className="w-5 rounded-full bg-gradient-to-t from-indigo-500 to-indigo-600"
              style={{ height: `${height}px` }}
            />
          ))}
        </div>
      </FloatingCard>

      <Motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="absolute left-1/2 top-1/2 z-10 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-[40px] bg-slate-100 border border-white/70 shadow-[0_10px_40px_rgba(15,23,42,0.08)] flex items-center justify-center"
      >
        <div className="relative h-[200px] w-[200px] rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-400 flex items-center justify-center">
          <div className="absolute inset-[14px] rounded-full bg-slate-100 shadow-[inset_8px_8px_16px_#d0d7df,inset_-8px_-8px_16px_#ffffff]" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-orange-300 to-fuchsia-400 shadow-sm">
              <div className="absolute left-5 top-8 h-2.5 w-2.5 rounded-full bg-slate-900" />
              <div className="absolute right-5 top-8 h-2.5 w-2.5 rounded-full bg-slate-900" />
              <div className="absolute left-1/2 top-[52px] h-2 w-8 -translate-x-1/2 rounded-full border-b-[4px] border-slate-900" />
            </div>

            <div className="mt-4 rounded-full bg-slate-100 px-4 py-2 shadow-sm">
              <p className="text-sm font-black text-indigo-600">Finance Buddy</p>
            </div>
          </div>
        </div>
      </Motion.div>
    </div>
  );
}

export default HeroVisual;
