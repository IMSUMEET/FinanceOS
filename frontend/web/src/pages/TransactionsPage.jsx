import { useMemo, useState } from "react";
import { Filter, Search, X } from "lucide-react";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Pill from "../components/ui/Pill";
import IconButton from "../components/ui/IconButton";
import CategoryBadge from "../components/ui/CategoryBadge";
import NoDataYet from "../components/common/NoDataYet";
import EmptyState from "../components/ui/EmptyState";
import Drawer from "../components/ui/Drawer";
import Button from "../components/ui/Button";
import AccountFilterBar from "../components/dashboard/AccountFilterBar";
import MonthFilterSelect from "../components/filters/MonthFilterSelect";
import { usePageFilters } from "../context/usePageFilters";
import { useTransactions } from "../context/useTransactions";
import { ALL_MONTHS_SENTINEL } from "../context/pageFilters";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { CATEGORIES } from "../utils/categories";
import { listAccountsForPeriod } from "../utils/accountCards";
import { formatAmountSpend, formatDate, formatMonth } from "../utils/format";

function TransactionDetail({ tx, onClose, onUpdateCategory }) {
  if (!tx) return null;
  return (
    <Drawer open={!!tx} onClose={onClose} title={tx.merchant_normalized} subtitle={tx.category}>
      <div className="space-y-5">
        <div className="surface-muted p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
            Amount
          </p>
          <p className="tabular mt-1 text-3xl font-black text-ink-900 dark:text-ink-50">
            -{formatAmountSpend(tx.amount)}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="surface-muted p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
              Date
            </dt>
            <dd className="mt-1 font-bold text-ink-900 dark:text-ink-50">
              {formatDate(tx.date, { year: "numeric", month: "short", day: "numeric" })}
            </dd>
          </div>
          <div className="surface-muted p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
              Card / Account
            </dt>
            <dd className="mt-1 font-bold text-ink-900 dark:text-ink-50">
              {tx.card_identity ?? tx.source}
            </dd>
          </div>
          <div className="col-span-2 surface-muted p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
              Description
            </dt>
            <dd className="mt-1 font-semibold text-ink-800 dark:text-ink-200">
              {tx.description ?? "—"}
            </dd>
          </div>
          <div className="col-span-2 surface-muted p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
              Raw merchant
            </dt>
            <dd className="mt-1 font-mono text-xs text-ink-600 break-all dark:text-ink-300">
              {tx.merchant_raw}
            </dd>
          </div>
        </dl>

        <div>
          <p className="text-sm font-semibold text-ink-700 dark:text-ink-200">Recategorize</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onUpdateCategory(tx.id, c)}
                className={[
                  "rounded-full transition",
                  tx.category === c
                    ? "ring-2 ring-brand-400/70 ring-offset-2 ring-offset-white dark:ring-offset-ink-900"
                    : "",
                ].join(" ")}
              >
                <CategoryBadge category={c} size="md" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}

function CategoryChip({ active, label, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        "rounded-full transition",
        active
          ? "ring-2 ring-brand-400/70 ring-offset-2 ring-offset-white dark:ring-offset-ink-900"
          : "opacity-90 hover:opacity-100",
      ].join(" ")}
    >
      <CategoryBadge category={label} size="md" />
    </button>
  );
}

function TransactionMerchant({ tx }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-1.5">
        <p className="truncate font-bold text-ink-900 dark:text-ink-50">{tx.merchant_normalized}</p>
        {tx.card_identity ? (
          <span className="inline-block shrink-0 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300">
            {tx.card_identity}
          </span>
        ) : null}
      </div>
      {tx.description ? (
        <p className="truncate text-xs text-ink-500 dark:text-ink-400">{tx.description}</p>
      ) : null}
    </div>
  );
}

function TransactionAmount({ amount, className = "" }) {
  return (
    <p
      className={`tabular shrink-0 whitespace-nowrap font-black text-ink-900 dark:text-ink-50 ${className}`.trim()}
    >
      -{formatAmountSpend(amount)}
    </p>
  );
}

function TransactionRow({ tx, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(tx)}
      className="w-full px-4 py-2.5 text-left transition hover:bg-ink-50 dark:hover:bg-ink-800/60"
    >
      <div className="md:hidden">
        <div className="flex items-start justify-between gap-3">
          <TransactionMerchant tx={tx} />
          <TransactionAmount amount={tx.amount} />
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <CategoryBadge category={tx.category} />
          <span className="text-xs text-ink-500 dark:text-ink-400">{formatDate(tx.date)}</span>
        </div>
      </div>

      <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_7.5rem_9.5rem_6.5rem] md:items-center md:gap-x-4">
        <TransactionMerchant tx={tx} />
        <p className="whitespace-nowrap text-sm text-ink-600 dark:text-ink-300">
          {formatDate(tx.date)}
        </p>
        <div className="min-w-0 max-w-[9.5rem]">
          <CategoryBadge category={tx.category} />
        </div>
        <TransactionAmount amount={tx.amount} className="justify-self-end text-right" />
      </div>
    </button>
  );
}

function TransactionsPage() {
  useDocumentTitle("Transactions");
  const { transactions, updateCategory, setAccountFilter } = useTransactions();
  const { filtered, filters, setFilters } = usePageFilters("transactions");
  const [openTx, setOpenTx] = useState(null);

  const accounts = useMemo(
    () => listAccountsForPeriod(transactions, filters.month),
    [transactions, filters.month],
  );
  const isAllMonths = filters.month === ALL_MONTHS_SENTINEL;
  const periodLabel = isAllMonths ? "all time" : formatMonth(filters.month);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id)),
    [filtered],
  );

  const toggleCategory = (c) => {
    setFilters((f) => ({
      ...f,
      categories: f.categories.includes(c)
        ? f.categories.filter((x) => x !== c)
        : [...f.categories, c],
    }));
  };

  const clearAll = () => {
    setAccountFilter(null);
    setFilters((f) => ({
      ...f,
      categories: [],
      search: "",
      amountMin: null,
      amountMax: null,
    }));
  };

  const activeFilters =
    (filters.account ? 1 : 0) +
    filters.categories.length +
    (filters.search ? 1 : 0) +
    (filters.amountMin != null ? 1 : 0) +
    (filters.amountMax != null ? 1 : 0);

  if (transactions.length === 0) {
    return (
      <section className="space-y-5 pt-2">
        <NoDataYet title="No transactions yet" />
      </section>
    );
  }

  return (
    <section className="space-y-5 pt-2">
      {accounts.length > 1 ? (
        <AccountFilterBar
          accounts={accounts}
          selectedAccount={filters.account}
          onSelectAccount={setAccountFilter}
          periodLabel={periodLabel}
        />
      ) : null}

      <div className="lg:static sticky top-[88px] z-20 -mx-4 px-4 md:mx-0 md:px-0">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-ink-500 dark:text-ink-400">Activity</p>
              <h2 className="mt-1 text-2xl font-black text-ink-900 dark:text-ink-50">
                {sorted.length} transactions
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <MonthFilterSelect pageKey="transactions" className="w-full sm:w-auto" />
              <Pill tone={activeFilters ? "brand" : "soft"}>
                <Filter size={14} />
                {activeFilters ? `${activeFilters} filters` : "No filters"}
              </Pill>
              {activeFilters > 0 ? (
                <IconButton onClick={clearAll} aria-label="Clear filters">
                  <X size={16} />
                </IconButton>
              ) : null}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <Input
              icon={Search}
              placeholder="Search merchants, descriptions…"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
            <Select
              value={filters.amountMin ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  amountMin: e.target.value ? Number(e.target.value) : null,
                }))
              }
              options={[
                { value: "", label: "Min: any" },
                { value: "10", label: "Min: $10" },
                { value: "50", label: "Min: $50" },
                { value: "100", label: "Min: $100" },
              ]}
            />
            <Select
              value={filters.amountMax ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  amountMax: e.target.value ? Number(e.target.value) : null,
                }))
              }
              options={[
                { value: "", label: "Max: any" },
                { value: "50", label: "Max: $50" },
                { value: "200", label: "Max: $200" },
                { value: "500", label: "Max: $500" },
              ]}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <CategoryChip
                key={c}
                label={c}
                active={filters.categories.includes(c)}
                onToggle={() => toggleCategory(c)}
              />
            ))}
          </div>
        </Card>
      </div>

      <Card padding="sm">
        {sorted.length === 0 ? (
          <EmptyState
            icon={Filter}
            title="No transactions match your filters"
            description="Try clearing filters or expanding the date range."
            action={
              <Button variant="ghost" onClick={clearAll}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl2">
            <div className="hidden border-b border-ink-100 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-ink-500 md:grid md:grid-cols-[minmax(0,1fr)_7.5rem_9.5rem_6.5rem] md:gap-x-4 dark:border-ink-800 dark:text-ink-400">
              <span>Merchant</span>
              <span>Date</span>
              <span>Category</span>
              <span className="text-right">Amount</span>
            </div>
            <ul className="divide-y divide-ink-100 dark:divide-ink-800">
              {sorted.map((t) => (
                <li key={t.id}>
                  <TransactionRow tx={t} onSelect={setOpenTx} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <TransactionDetail
        tx={openTx}
        onClose={() => setOpenTx(null)}
        onUpdateCategory={(id, c) => {
          updateCategory(id, c);
          setOpenTx((cur) => (cur && cur.id === id ? { ...cur, category: c } : cur));
        }}
      />
    </section>
  );
}

export default TransactionsPage;
