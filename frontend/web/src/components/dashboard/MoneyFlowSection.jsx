import { useEffect, useMemo, useState } from "react";
import Card from "../ui/Card";
import Select from "../ui/Select";
import SectionHeader from "../ui/SectionHeader";
import SpendTrendChart from "../charts/SpendTrendChart";
import { filterByAccount, listAccountsFromTransactions } from "../../utils/accountCards";
import { filterTransactionsByPeriod, flowPeriodOptions } from "../../utils/periodFilters";
import { monthlyTotals } from "../../utils/insights";

function AccountTab({ label, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={[
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        active
          ? "border-brand-500 bg-brand-50 text-brand-800 dark:border-brand-400 dark:bg-brand-900/40 dark:text-brand-100"
          : "border-ink-200 bg-white text-ink-600 hover:border-brand-300 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function MoneyFlowSection({ transactions, selectedAccount, onSelectAccount }) {
  const [flowPeriod, setFlowPeriod] = useState("ALL");
  const [flowAccount, setFlowAccount] = useState(selectedAccount);

  useEffect(() => {
    setFlowAccount(selectedAccount);
  }, [selectedAccount]);

  const accounts = useMemo(() => listAccountsFromTransactions(transactions), [transactions]);

  const chartRows = useMemo(() => {
    let rows = filterByAccount(transactions, flowAccount);
    rows = filterTransactionsByPeriod(rows, flowPeriod);
    return rows;
  }, [transactions, flowAccount, flowPeriod]);

  const monthly = useMemo(() => monthlyTotals(chartRows), [chartRows]);
  const periodOptions = useMemo(() => flowPeriodOptions(transactions), [transactions]);

  function pickAccount(id) {
    setFlowAccount(id);
    onSelectAccount?.(id);
  }

  return (
    <Card>
      <SectionHeader eyebrow="Overview" title="Money flow" />
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <AccountTab
            label="All cards"
            active={flowAccount == null}
            onSelect={() => pickAccount(null)}
          />
          {accounts.map((a) => (
            <AccountTab
              key={a.id}
              label={a.label}
              active={flowAccount === a.id}
              onSelect={() => pickAccount(a.id)}
            />
          ))}
        </div>
        <Select
          value={flowPeriod}
          onChange={(e) => setFlowPeriod(e.target.value)}
          options={periodOptions}
          aria-label="Money flow period"
          className="w-full sm:w-auto"
        />
      </div>
      <div className="surface-muted mt-6 p-4">
        {monthly.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-500 dark:text-ink-400">
            Import statements to see your money flow over time.
          </p>
        ) : (
          <SpendTrendChart data={monthly} height={280} />
        )}
      </div>
    </Card>
  );
}

export default MoneyFlowSection;
