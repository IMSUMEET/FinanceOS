import { createElement } from "react";
import {
  ArrowUpRight,
  CreditCard,
  DollarSign,
  TrendingUp,
  Wallet,
} from "lucide-react";

function StatCard({ title, value, change, icon, tint }) {
  return (
    <div className="rounded-[28px] border border-white/60 bg-white/72 p-5 shadow-[0_18px_38px_rgba(59,130,246,0.07)] backdrop-blur-xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <h3 className="mt-3 text-3xl font-black text-slate-900">{value}</h3>
          <p className="mt-2 text-sm font-semibold text-emerald-500">{change}</p>
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tint}`}>
          {createElement(icon, { size: 20, className: "text-white" })}
        </div>
      </div>
    </div>
  );
}

function TrendCard() {
  const points = "8,120 90,120 145,102 210,56 300,50 360,76 430,34";

  return (
    <div className="rounded-[32px] border border-white/60 bg-white/78 p-6 shadow-[0_18px_38px_rgba(59,130,246,0.07)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">Spend Trend</p>
          <h3 className="mt-2 text-2xl font-black text-slate-900">Monthly spend is stabilizing</h3>
        </div>

        <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Last 6 Months</div>
      </div>

      <div className="mt-8 h-[260px] rounded-[24px] bg-[#edf6ff] p-4">
        <svg viewBox="0 0 450 150" className="h-full w-full">
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          <path
            d="M8 120 C70 120, 100 120, 145 102 S210 56, 300 50 S360 76, 430 34 L430 150 L8 150 Z"
            fill="url(#trendFill)"
          />
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          <circle cx="210" cy="56" r="8" fill="#ffffff" stroke="#3b82f6" strokeWidth="4" />
          <circle cx="430" cy="34" r="8" fill="#ffffff" stroke="#3b82f6" strokeWidth="4" />
        </svg>

        <div className="mt-2 flex justify-between px-2 text-xs font-semibold text-slate-400">
          <span>Jan</span>
          <span>Feb</span>
          <span>Mar</span>
          <span>Apr</span>
          <span>May</span>
          <span>Jun</span>
        </div>
      </div>
    </div>
  );
}

function DonutCard() {
  return (
    <div className="rounded-[32px] border border-white/60 bg-white/78 p-6 shadow-[0_18px_38px_rgba(59,130,246,0.07)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">Category Split</p>
          <h3 className="mt-2 text-2xl font-black text-slate-900">Where your money goes</h3>
        </div>

        <button type="button" className="rounded-full bg-slate-900 p-3 text-white">
          <ArrowUpRight size={16} />
        </button>
      </div>

      <div className="mt-8 flex items-center justify-center">
        <div className="relative flex h-56 w-56 items-center justify-center rounded-full bg-[conic-gradient(#3b82f6_0_40%,#60a5fa_40%_62%,#22c55e_62%_78%,#f59e0b_78%_90%,#e5e7eb_90%_100%)]">
          <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-white">
            <p className="text-4xl font-black text-slate-900">$4.8K</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">Total Spent</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-3">
        {[
          ["Shopping", "$1.92K", "bg-blue-500"],
          ["Food", "$1.05K", "bg-sky-400"],
          ["Bills", "$760", "bg-emerald-500"],
          ["Travel", "$530", "bg-amber-400"],
        ].map(([name, value, color]) => (
          <div key={name} className="flex items-center justify-between rounded-2xl bg-[#f8fbff] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className={`h-3.5 w-3.5 rounded-full ${color}`} />
              <span className="font-semibold text-slate-700">{name}</span>
            </div>
            <span className="font-bold text-slate-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MapCard() {
  return (
    <div className="rounded-[32px] border border-white/60 bg-white/78 p-6 shadow-[0_18px_38px_rgba(59,130,246,0.07)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">Spend Map</p>
          <h3 className="mt-2 text-2xl font-black text-slate-900">Region-wise activity</h3>
        </div>

        <div className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">USA</div>
      </div>

      <div className="mt-8 rounded-[28px] bg-[#eef7ff] p-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 rounded-[24px] bg-white p-5 shadow-[0_12px_24px_rgba(59,130,246,0.07)]">
            <svg viewBox="0 0 500 280" className="h-[220px] w-full">
              <rect x="0" y="0" width="500" height="280" rx="22" fill="#ffffff" />
              <path
                d="M100 70 L165 40 L240 52 L300 30 L385 58 L392 140 L346 212 L248 225 L168 200 L116 148 Z"
                fill="#dbeafe"
              />
              <path d="M100 70 L165 40 L240 52 L248 118 L175 135 L116 148 Z" fill="#60a5fa" />
              <path d="M248 118 L300 30 L385 58 L392 140 L330 154 L270 148 Z" fill="#93c5fd" />
              <path d="M175 135 L248 118 L270 148 L248 225 L168 200 Z" fill="#86efac" />
              <path d="M270 148 L330 154 L346 212 L248 225 Z" fill="#fdba74" />
              <circle cx="210" cy="95" r="9" fill="#1d4ed8" />
              <circle cx="320" cy="110" r="9" fill="#0f172a" />
              <circle cx="230" cy="170" r="9" fill="#16a34a" />
            </svg>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-[24px] bg-blue-600 p-5 text-white shadow-[0_12px_24px_rgba(59,130,246,0.22)]">
              <p className="text-sm font-medium text-blue-100">Top Region</p>
              <h4 className="mt-2 text-3xl font-black">$25.7M</h4>
              <p className="mt-1 text-sm text-blue-100">Eastern cluster</p>
            </div>

            <div className="rounded-[24px] bg-white p-5">
              <div className="space-y-3">
                {[
                  ["California", "$8.2M"],
                  ["Texas", "$6.4M"],
                  ["Florida", "$5.1M"],
                  ["New York", "$4.0M"],
                ].map(([region, value]) => (
                  <div key={region} className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600">{region}</span>
                    <span className="font-bold text-slate-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionsCard() {
  const rows = [
    ["Apple", "Software", "-$19.99"],
    ["Whole Foods", "Groceries", "-$82.40"],
    ["Uber", "Travel", "-$24.10"],
    ["Amazon", "Shopping", "-$146.20"],
  ];

  return (
    <div className="rounded-[32px] border border-white/60 bg-white/78 p-6 shadow-[0_18px_38px_rgba(59,130,246,0.07)] backdrop-blur-xl">
      <p className="text-sm font-semibold text-slate-500">Recent Activity</p>
      <h3 className="mt-2 text-2xl font-black text-slate-900">Latest transactions</h3>

      <div className="mt-6 space-y-3">
        {rows.map(([name, type, amount]) => (
          <div key={name} className="flex items-center justify-between rounded-[22px] bg-[#f8fbff] px-4 py-4">
            <div>
              <p className="font-bold text-slate-900">{name}</p>
              <p className="text-sm text-slate-500">{type}</p>
            </div>
            <p className="font-black text-slate-900">{amount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardHero() {
  return (
    <section className="mx-auto w-full max-w-[1600px] pt-2">
      <div className="grid gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8 space-y-5">
          <div className="grid gap-5 md:grid-cols-3">
            <StatCard
              title="Current Balance"
              value="$48,240"
              change="+8.2% from last month"
              icon={Wallet}
              tint="bg-gradient-to-br from-blue-600 to-indigo-500"
            />
            <StatCard
              title="Monthly Spend"
              value="$4,820"
              change="-3.1% from last month"
              icon={CreditCard}
              tint="bg-gradient-to-br from-emerald-500 to-teal-500"
            />
            <StatCard
              title="Savings Rate"
              value="26%"
              change="+2.4% improvement"
              icon={DollarSign}
              tint="bg-gradient-to-br from-amber-400 to-orange-500"
            />
          </div>

          <TrendCard />
          <MapCard />
        </div>

        <div className="xl:col-span-4 space-y-5">
          <DonutCard />
          <TransactionsCard />

          <div className="rounded-[32px] border border-white/60 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-[0_20px_40px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300">Insight Engine</p>
                <h3 className="mt-2 text-2xl font-black">Smart Observation</h3>
              </div>
              <TrendingUp className="text-emerald-400" />
            </div>

            <p className="mt-5 text-slate-300">
              Your food and subscription spend rose faster than all other categories this month.
            </p>

            <div className="mt-6 rounded-[22px] bg-white/10 px-4 py-4">
              <p className="text-sm text-slate-300">Suggested action</p>
              <p className="mt-1 font-semibold text-white">
                Review recurring charges and cap dining spend for the next 2 weeks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DashboardHero;
