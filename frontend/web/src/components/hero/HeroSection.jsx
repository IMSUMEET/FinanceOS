import { motion as Motion } from "framer-motion";
import { ArrowRight, Upload } from "lucide-react";
import ClayButton from "../common/ClayButton";
import HeroVisual from "./HeroVisual";

function HeroSection() {
  return (
    <section className="px-4 md:px-8 pt-6 pb-10">
      <div className="mx-auto max-w-7xl rounded-[44px] border border-white/60 bg-gradient-to-br from-slate-100 via-white/50 to-indigo-500/10 shadow-[0_10px_40px_rgba(15,23,42,0.08)] overflow-hidden">
        <div className="grid items-center gap-12 px-6 py-10 md:px-10 lg:grid-cols-2 lg:px-14 lg:py-14">
          <Motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex rounded-full bg-white/55 px-4 py-2 shadow-sm border border-white/60">
              <span className="text-xs font-bold uppercase tracking-[0.28em] text-indigo-600">Spend smarter • feel richer</span>
            </div>

            <h1 className="mt-6 max-w-xl text-5xl font-black leading-[0.95] text-slate-900 md:text-6xl xl:text-7xl">
              Turn your CSV
              <span className="block bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                into a beautiful
              </span>
              money cockpit.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-500 md:text-xl">
              Upload your credit card statement, uncover your spending habits, and explore playful claymorphic charts that
              actually make finance feel fun.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <ClayButton icon={Upload} variant="primary">
                Upload your CSV
              </ClayButton>

              <ClayButton icon={ArrowRight}>Explore dashboard</ClayButton>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
              <div className="rounded-[24px] bg-slate-100 px-4 py-5 shadow-md border border-white/60">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">CSV</p>
                <p className="mt-2 text-2xl font-black text-slate-900">Upload</p>
              </div>

              <div className="rounded-[24px] bg-slate-100 px-4 py-5 shadow-md border border-white/60">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Charts</p>
                <p className="mt-2 text-2xl font-black text-slate-900">Bar + Pie</p>
              </div>

              <div className="rounded-[24px] bg-slate-100 px-4 py-5 shadow-md border border-white/60">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Insights</p>
                <p className="mt-2 text-2xl font-black text-slate-900">Smart</p>
              </div>
            </div>
          </Motion.div>

          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
