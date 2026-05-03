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

const REAL_ESTATE_NAV = [{ to: "/house-sale", label: "House", icon: Home }];

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
        {REAL_ESTATE_NAV.map(({ to, label, icon, end }) => (
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
      </ul>
    </nav>
  );
}

export default MobileNav;
