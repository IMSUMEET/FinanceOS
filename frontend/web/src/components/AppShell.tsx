import { NavLink, Outlet } from "react-router-dom";
import { motion } from "framer-motion";

const navItems = [
  { to: "/", label: "Dashboard", end: true, emoji: "✨" },
  { to: "/shared-expenses", label: "Shared Expenses", emoji: "🍕" },
  { to: "/subscriptions", label: "Subscriptions", emoji: "🎬" },
  { to: "/loans", label: "Loans", emoji: "🎯" },
  { to: "/financial-tracker", label: "Financial Tracker", emoji: "🪄" },
];

export default function AppShell() {
  return (
    <div className="min-h-screen bg-app text-primary-theme">
      <div className="relative flex min-h-screen">
        <aside className="w-72 border-r border-theme bg-surface-strong backdrop-blur-xl">
          <div className="flex h-full flex-col px-6 py-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mb-10"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-accent-soft text-2xl shadow-soft">
                🛰️
              </div>

              <h1 className="mt-5 text-[2rem] font-black tracking-tight text-primary-theme">
                FinanceOS
              </h1>

              <p className="mt-2 text-base text-muted-theme">
                A fun place for money stuff
              </p>
            </motion.div>

            <nav className="space-y-3">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                >
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] font-semibold transition-all duration-200",
                        isActive
                          ? "bg-accent text-white shadow-soft"
                          : "bg-transparent text-secondary-theme hover:bg-surface-muted",
                      ].join(" ")
                    }
                  >
                    <span className="text-lg">{item.emoji}</span>
                    <span>{item.label}</span>
                  </NavLink>
                </motion.div>
              ))}
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              className="mt-auto rounded-[24px] border border-theme bg-surface p-5 shadow-soft"
            >
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-theme">
                Goal
              </p>
              <p className="mt-2 text-base font-semibold text-primary-theme">
                Make money feel simple
              </p>
              <p className="mt-1 text-sm leading-6 text-secondary-theme">
                Calm, clear, and delightful.
              </p>
            </motion.div>
          </div>
        </aside>

        <main className="flex-1">
          <div className="border-b border-theme bg-surface px-8 py-5 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-muted-theme">
                  Personal Money Playground
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-primary-theme">
                  Welcome back ✨
                </h2>
              </div>

              <div className="rounded-2xl border border-theme bg-surface-strong px-4 py-2 text-sm font-semibold text-secondary-theme shadow-soft">
                Seattle · Happy Workspace
              </div>
            </motion.div>
          </div>

          <div className="p-8">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
