import { createElement } from "react";
import { NavLink } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Home, LayoutDashboard, ListOrdered, PieChart, Sparkles, Upload } from "lucide-react";
import Logo from "../common/Logo";

const NAV_SECTIONS = [
  {
    id: "spend",
    label: "Spend Analyzer",
    items: [
      { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
      { to: "/transactions", label: "Transactions", icon: ListOrdered },
      { to: "/categories", label: "Categories", icon: PieChart },
      { to: "/insights", label: "Insights", icon: Sparkles },
      { to: "/upload", label: "Upload", icon: Upload },
    ],
  },
  {
    id: "real-estate",
    label: "Real estate",
    items: [{ to: "/house-sale", label: "House Sale", icon: Home, comingSoon: true }],
  },
];

function SidebarComingSoonItem({ label, icon }) {
  return (
    <span
      aria-disabled="true"
      title="House Sale — appear soon"
      className="group relative block cursor-not-allowed select-none rounded-2xl p-[1px] bg-gradient-to-br from-brand-300/70 via-violet-300/50 to-brand-400/60 dark:from-brand-500/40 dark:via-violet-500/30 dark:to-brand-600/40"
    >
      <span className="relative flex items-center gap-3 rounded-[15px] bg-white/90 px-3 py-2.5 dark:bg-ink-900/90">
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 dark:bg-brand-950/50 dark:text-brand-300 dark:ring-brand-800/60">
          {createElement(icon, { size: 16 })}
          <Motion.span
            aria-hidden
            animate={{ scale: [1, 1.35, 1], opacity: [0.55, 0, 0.55] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-xl bg-brand-400/25"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink-700 dark:text-ink-100">{label}</span>
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-600 to-violet-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-brand">
            <Sparkles size={10} strokeWidth={2.5} aria-hidden />
            Appear soon
          </span>
        </span>
      </span>
    </span>
  );
}

function Sidebar() {
  return (
    <aside className="hidden lg:flex h-full w-[260px] shrink-0 flex-col gap-6 border-r border-white/60 bg-white/55 px-5 py-6 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/60">
      <div className="px-1">
        <Logo />
      </div>

      <nav className="flex flex-col gap-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.id} className="flex flex-col gap-1">
            <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-ink-400 dark:text-ink-500">
              {section.label}
            </p>
            {section.items.map(({ to, label, icon, end, comingSoon }) =>
              comingSoon ? (
                <SidebarComingSoonItem key={to} label={label} icon={icon} />
              ) : (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  [
                    "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                    isActive
                      ? "text-white"
                      : "text-ink-600 hover:bg-white hover:text-brand-700 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-brand-300",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive ? (
                      <Motion.span
                        layoutId="sidebar-active-pill"
                        transition={{ type: "spring", stiffness: 360, damping: 30 }}
                        className="absolute inset-0 rounded-2xl bg-brand shadow-brand"
                        aria-hidden
                      />
                    ) : null}
                    <span
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-xl ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-brand-50 text-brand-600 group-hover:bg-brand-100 dark:bg-ink-800 dark:text-brand-300 dark:group-hover:bg-ink-700"
                      }`}
                    >
                      {createElement(icon, { size: 16 })}
                    </span>
                    <span className="relative z-10">{label}</span>
                    {isActive ? <span className="sr-only">(current)</span> : null}
                  </>
                )}
              </NavLink>
              ),
            )}
          </div>
        ))}
      </nav>

      <div className="mt-auto rounded-xl2 border border-white/60 bg-white/70 p-4 shadow-soft dark:border-ink-700 dark:bg-ink-800/60">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
          Demo data
        </p>
        <p className="mt-1 text-sm text-ink-700 dark:text-ink-300">
          You're exploring 6 months of synthetic transactions. Use{" "}
          <span className="font-bold text-brand-700 dark:text-brand-300">Upload</span> to bring your own CSV.
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;
