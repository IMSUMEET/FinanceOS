import { BarChart3 } from "lucide-react";

export const VISUALIZATIONS = [
  { id: "sankey", label: "Cash Flow Sankey" },
  { id: "treemap", label: "Spending Treemap" },
  { id: "trends", label: "Monthly Trends" },
  { id: "category", label: "Category Breakdown" },
  { id: "budget", label: "Budget vs Actual" },
  { id: "waterfall", label: "Cash Flow Waterfall" },
  { id: "heatmap", label: "Spending Heatmap" },
  { id: "income", label: "Income Sources" },
  { id: "savings", label: "Savings Analysis" },
  { id: "networth", label: "Net Worth Trend" },
  { id: "health", label: "Financial Health Dashboard" },
];

function ReportSelector({ selected, onChange }) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
      <label htmlFor="viz-select" className="text-sm font-bold text-ink-600 dark:text-ink-400 flex items-center gap-1.5">
        <BarChart3 size={16} />
        Visualization:
      </label>
      <select
        id="viz-select"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm focus:border-brand-500 focus:outline-none dark:border-ink-800 dark:bg-ink-900 dark:text-ink-50"
      >
        {VISUALIZATIONS.map((v) => (
          <option key={v.id} value={v.id}>
            {v.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ReportSelector;
