import { Calendar } from "lucide-react";
import Select from "../ui/Select";
import { usePageFilters } from "../../context/usePageFilters";
import { useTransactions } from "../../context/useTransactions";
import { formatMonth } from "../../utils/format";

function MonthFilterSelect({ pageKey, className = "" }) {
  const { months, ALL_MONTHS_SENTINEL } = useTransactions();
  const { filters, setFilters } = usePageFilters(pageKey);

  const monthOptions = [
    { value: ALL_MONTHS_SENTINEL, label: "All months" },
    ...months.map((m) => ({ value: m, label: formatMonth(m) })),
  ];

  return (
    <Select
      value={filters.month}
      onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))}
      options={monthOptions}
      leadingIcon={Calendar}
      aria-label="Filter by month"
      className={className}
    />
  );
}

export default MonthFilterSelect;
