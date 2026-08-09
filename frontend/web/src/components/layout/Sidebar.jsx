import { createElement } from "react";
import { NavLink } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import {
  BarChart3,
  Building2,
  Home,
  HelpCircle,
  LayoutDashboard,
  ListOrdered,
  PieChart,
  Sliders,
  Sparkles,
  Upload,
} from "lucide-react";
import Logo from "../common/Logo";

const NAV_SECTIONS = [
  {
    id: "spend",
    label: "Spend Analyzer",
    items: [
      { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
      { to: "/connections", label: "Connections", icon: Building2 },
      {
        to: "/insights",
        label: "Insights",
        icon: Sparkles,
        subItems: [
          { to: "/insights/ai", label: "AI Insights", icon: Sparkles },
          { to: "/transactions", label: "Transactions", icon: ListOrdered },
          { to: "/categories", label: "Categories", icon: PieChart },
          { to: "/rules", label: "Rules", icon: Sliders },
          { to: "/reports", label: "Reports", icon: BarChart3 },
        ],
      },
      { to: "/upload", label: "Upload", icon: Upload },
      { to: "/help", label: "Help & Support", icon: HelpCircle },
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
      title="House Sale — coming soon"
      className="flex cursor-not-allowed select-none items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-ink-400 dark:text-ink-500"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500">
        {createElement(icon, { size: 16 })}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block">{label}</span>
        <span className="text-[11px] font-medium normal-case tracking-normal text-ink-400 dark:text-ink-500">
          Coming soon
        </span>
      </span>
    </span>
  );
}

function Sidebar() {
  return (
    <aside className="hidden lg:flex h-full w-[260px] shrink-0 flex-col gap-6 border-r border-ink-200/70 bg-white/70 px-5 py-6 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-950/80">
      <div className="px-1">
        <Logo />
      </div>

      <nav className="flex flex-col gap-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.id} className="flex flex-col gap-1">
            <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-ink-400 dark:text-ink-500">
              {section.label}
            </p>
            {section.items.map(({ to, label, icon, end, comingSoon, subItems }) =>
              comingSoon ? (
                <SidebarComingSoonItem key={to} label={label} icon={icon} />
              ) : (
                <div key={to} className="flex flex-col gap-1">
                  <NavLink
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
                  {subItems && (
                    <div className="ml-5 flex flex-col gap-1 pl-2 border-l border-brand-200/60 dark:border-ink-800">
                      {subItems.map((sub) => (
                        <NavLink
                          key={sub.to}
                          to={sub.to}
                          className={({ isActive }) =>
                            [
                              "flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition",
                              isActive
                                ? "bg-brand-500/15 text-brand-600 dark:bg-brand-400/20 dark:text-brand-300"
                                : "text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-100",
                            ].join(" ")
                          }
                        >
                          {createElement(sub.icon, { size: 14 })}
                          <span>{sub.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
