import { createElement } from "react";
import { NavLink } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { LayoutDashboard, ListOrdered, PieChart, Sparkles, Upload } from "lucide-react";
import Logo from "../common/Logo";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/transactions", label: "Transactions", icon: ListOrdered },
  { to: "/categories", label: "Categories", icon: PieChart },
  { to: "/insights", label: "Insights", icon: Sparkles },
  { to: "/upload", label: "Upload", icon: Upload },
];

function Sidebar() {
  return (
    <aside className="hidden lg:flex h-full w-[260px] shrink-0 flex-col gap-6 border-r border-white/60 bg-white/55 px-5 py-6 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/60">
      <div className="px-1">
        <Logo />
      </div>

      <nav className="flex flex-col gap-1">
        <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-ink-400 dark:text-ink-500">
          Spend Analyzer
        </p>
        {NAV.map(({ to, label, icon, end }) => (
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
