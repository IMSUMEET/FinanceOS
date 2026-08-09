import { NavLink } from "react-router-dom";
import { BarChart3, Bot, ListOrdered, PieChart, Sparkles } from "lucide-react";

export function InsightsSubNav() {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle pb-3 pt-1 dark:border-ink-800">
      <NavLink
        to="/insights"
        end
        className={({ isActive }) =>
          `flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
            isActive
              ? "bg-brand text-white shadow-brand"
              : "bg-surface-muted text-ink-600 hover:bg-brand-50 hover:text-brand-700 dark:text-ink-300 dark:hover:bg-ink-800"
          }`
        }
      >
        <Sparkles size={14} />
        <span>Insight Overview</span>
      </NavLink>
      <NavLink
        to="/transactions"
        className={({ isActive }) =>
          `flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
            isActive
              ? "bg-brand text-white shadow-brand"
              : "bg-surface-muted text-ink-600 hover:bg-brand-50 hover:text-brand-700 dark:text-ink-300 dark:hover:bg-ink-800"
          }`
        }
      >
        <ListOrdered size={14} />
        <span>Transactions</span>
      </NavLink>
      <NavLink
        to="/categories"
        className={({ isActive }) =>
          `flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
            isActive
              ? "bg-brand text-white shadow-brand"
              : "bg-surface-muted text-ink-600 hover:bg-brand-50 hover:text-brand-700 dark:text-ink-300 dark:hover:bg-ink-800"
          }`
        }
      >
        <PieChart size={14} />
        <span>Categories</span>
      </NavLink>
      <NavLink
        to="/reports"
        className={({ isActive }) =>
          `flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
            isActive
              ? "bg-brand text-white shadow-brand"
              : "bg-surface-muted text-ink-600 hover:bg-brand-50 hover:text-brand-700 dark:text-ink-300 dark:hover:bg-ink-800"
          }`
        }
      >
        <BarChart3 size={14} />
        <span>Reports</span>
      </NavLink>
      <NavLink
        to="/insights/ai"
        className={({ isActive }) =>
          `flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
            isActive
              ? "bg-purple-600 text-white shadow-purple-500/20"
              : "bg-surface-muted text-ink-600 hover:bg-purple-50 hover:text-purple-700 dark:text-ink-300 dark:hover:bg-ink-800"
          }`
        }
      >
        <Bot size={14} />
        <span>AI Insights</span>
      </NavLink>
    </div>
  );
}
