import { useLocation } from "react-router-dom";
import { Calendar } from "lucide-react";
import NavbarActions from "../common/NavbarActions";
import ThemeToggle from "../common/ThemeToggle";
import Select from "../ui/Select";
import { useTransactions } from "../../context/useTransactions";
import { formatMonth } from "../../utils/format";

const TITLES = {
  "/": { eyebrow: "Spend Analyzer", title: "Overview" },
  "/transactions": { eyebrow: "Spend Analyzer", title: "Transactions" },
  "/categories": { eyebrow: "Spend Analyzer", title: "Categories" },
  "/insights": { eyebrow: "Spend Analyzer", title: "Insights" },
  "/upload": { eyebrow: "Spend Analyzer", title: "Import CSV" },
};

function Topbar() {
  const { pathname } = useLocation();
  const { months, filters, setFilters, ALL_MONTHS_SENTINEL } = useTransactions();

  const meta = TITLES[pathname] ?? TITLES["/"];

  const monthOptions = [
    { value: ALL_MONTHS_SENTINEL, label: "All months" },
    ...months.map((m) => ({ value: m, label: formatMonth(m) })),
  ];

  return (
    <header className="relative z-30 shrink-0 px-4 pt-5 pb-4 md:px-6 xl:px-8 bg-gradient-to-b from-[#edf4ff]/95 via-[#edf4ff]/80 to-transparent dark:from-ink-950/95 dark:via-ink-950/80">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 rounded-xl2 border border-white/60 bg-white/55 px-5 py-3 backdrop-blur-xl shadow-soft md:px-6 dark:border-ink-800 dark:bg-ink-900/60 dark:shadow-softDark">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">
            {meta.eyebrow}
          </p>
          <h1 className="truncate text-xl font-black text-ink-900 md:text-2xl dark:text-ink-50">
            {meta.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={filters.month}
            onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))}
            options={monthOptions}
            leadingIcon={Calendar}
            aria-label="Filter by month"
            className="hidden sm:inline-flex"
          />
          <ThemeToggle />
          <NavbarActions />
        </div>
      </div>
    </header>
  );
}

export default Topbar;
