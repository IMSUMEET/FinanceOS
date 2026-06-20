import { createElement } from "react";
import { NavLink } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Home, LayoutDashboard, ListOrdered, PieChart, Sparkles, Upload } from "lucide-react";

const SPEND_NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/transactions", label: "Activity", icon: ListOrdered },
  { to: "/categories", label: "Cats", icon: PieChart },
  { to: "/insights", label: "Insights", icon: Sparkles },
  { to: "/upload", label: "Upload", icon: Upload },
];

const REAL_ESTATE_NAV = [{ to: "/house-sale", label: "House Sale", icon: Home, comingSoon: true }];

function MobileComingSoonItem({ label, icon }) {
  return (
    <span
      aria-disabled="true"
      title="House Sale — appear soon"
      className="relative mx-auto flex max-w-[76px] cursor-not-allowed select-none flex-col items-center gap-0.5 rounded-2xl px-1.5 py-1.5 sm:px-2"
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-brand-200/80 dark:bg-brand-950/40 dark:text-brand-300 dark:ring-brand-700/50">
        {createElement(icon, { size: 18 })}
        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-violet-500 text-white shadow-brand">
          <Sparkles size={8} strokeWidth={2.5} aria-hidden />
        </span>
      </span>
      <span className="max-w-full text-center text-[9px] font-semibold leading-tight text-ink-700 dark:text-ink-100 sm:text-[10px]">
        {label}
      </span>
      <span className="rounded-full bg-gradient-to-r from-brand-600 to-violet-500 px-1.5 py-px text-[7px] font-bold uppercase tracking-wide text-white">
        Soon
      </span>
    </span>
  );
}

function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-40 rounded-full border border-white/70 bg-white/85 px-1 py-2 shadow-softLg backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/85 dark:shadow-softLgDark">
      <ul className="flex items-center justify-between gap-0.5">
        {SPEND_NAV.map(({ to, label, icon, end }) => (
          <li key={to} className="min-w-0 flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  "relative mx-auto flex max-w-[72px] flex-col items-center gap-0.5 rounded-full px-1.5 py-1.5 text-[9px] font-semibold transition sm:px-2 sm:text-[10px]",
                  isActive ? "text-white" : "text-ink-500 dark:text-ink-300 active:scale-95",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <Motion.span
                      layoutId="mobile-nav-pill"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-brand shadow-brand"
                    />
                  ) : null}
                  <span className="relative z-10 flex flex-col items-center gap-0.5">
                    {createElement(icon, { size: 18 })}
                    <span>{label}</span>
                  </span>
                  {isActive ? <span className="sr-only">(current)</span> : null}
                </>
              )}
            </NavLink>
          </li>
        ))}
        <li className="mx-0.5 h-8 w-px shrink-0 self-center bg-ink-200/90 dark:bg-ink-600" aria-hidden />
        {REAL_ESTATE_NAV.map(({ to, label, icon, end, comingSoon }) => (
          <li key={to} className="min-w-0 shrink-0">
            {comingSoon ? (
              <MobileComingSoonItem label={label} icon={icon} />
            ) : (
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  "relative mx-auto flex max-w-[72px] flex-col items-center gap-0.5 rounded-full px-1.5 py-1.5 text-[9px] font-semibold transition sm:px-2 sm:text-[10px]",
                  isActive ? "text-white" : "text-ink-500 dark:text-ink-300 active:scale-95",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <Motion.span
                      layoutId="mobile-nav-pill"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-brand shadow-brand"
                    />
                  ) : null}
                  <span className="relative z-10 flex flex-col items-center gap-0.5">
                    {createElement(icon, { size: 18 })}
                    <span>{label}</span>
                  </span>
                  {isActive ? <span className="sr-only">(current)</span> : null}
                </>
              )}
            </NavLink>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default MobileNav;
