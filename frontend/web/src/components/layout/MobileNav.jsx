import { createElement } from "react";
import { NavLink } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { LayoutDashboard, ListOrdered, PieChart, Sparkles, Upload } from "lucide-react";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/transactions", label: "Activity", icon: ListOrdered },
  { to: "/categories", label: "Cats", icon: PieChart },
  { to: "/insights", label: "Insights", icon: Sparkles },
  { to: "/upload", label: "Upload", icon: Upload },
];

function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-40 rounded-full border border-white/70 bg-white/85 px-2 py-2 shadow-softLg backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/85 dark:shadow-softLgDark">
      <ul className="flex items-center justify-between">
        {NAV.map(({ to, label, icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  "relative mx-auto flex flex-col items-center gap-0.5 rounded-full px-3 py-2 text-[10px] font-semibold transition",
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
