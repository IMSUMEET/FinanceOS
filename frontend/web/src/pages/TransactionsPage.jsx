import { useMemo, useState } from "react";
import { Filter, Search, X } from "lucide-react";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Pill from "../components/ui/Pill";
import Badge from "../components/ui/Badge";
import IconButton from "../components/ui/IconButton";
import CategoryDot from "../components/ui/CategoryDot";
import EmptyState from "../components/ui/EmptyState";
import Drawer from "../components/ui/Drawer";
import Button from "../components/ui/Button";
import { useTransactions } from "../context/useTransactions";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { CATEGORIES } from "../utils/categories";
import { formatAmountSpend, formatDate } from "../utils/format";

function TransactionDetail({ tx, onClose, onUpdateCategory }) {
  if (!tx) return null;
  return (
    <Drawer open={!!tx} onClose={onClose} title={tx.merchant_normalized} subtitle={tx.category}>
      <div className="space-y-5">
        <div className="rounded-xl2 bg-[#f8fbff] p-5 dark:bg-ink-800/60">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">Amount</p>
          <p className="tabular mt-1 text-3xl font-black text-ink-900 dark:text-ink-50">
            -{formatAmountSpend(tx.amount)}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl2 bg-[#f8fbff] p-4 dark:bg-ink-800/60">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">Date</dt>
            <dd className="mt-1 font-bold text-ink-900 dark:text-ink-50">{formatDate(tx.date, { year: "numeric", month: "short", day: "numeric" })}</dd>
          </div>
          <div className="rounded-xl2 bg-[#f8fbff] p-4 dark:bg-ink-800/60">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">Source</dt>
            <dd className="mt-1 font-bold text-ink-900 capitalize dark:text-ink-50">{tx.source}</dd>
          </div>
          <div className="col-span-2 rounded-xl2 bg-[#f8fbff] p-4 dark:bg-ink-800/60">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">Description</dt>
            <dd className="mt-1 font-semibold text-ink-800 dark:text-ink-200">{tx.description ?? "—"}</dd>
          </div>
          <div className="col-span-2 rounded-xl2 bg-[#f8fbff] p-4 dark:bg-ink-800/60">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">Raw merchant</dt>
            <dd className="mt-1 font-mono text-xs text-ink-600 break-all dark:text-ink-300">{tx.merchant_raw}</dd>
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
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  tx.category === c
                    ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-900/40 dark:text-brand-200"
                    : "border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-700 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:border-brand-500 dark:hover:text-brand-200",
                ].join(" ")}
              >
                <CategoryDot category={c} size={8} />
                {c}
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
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        active
          ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-900/40 dark:text-brand-200"
          : "border-ink-200 bg-white text-ink-600 hover:border-brand-300 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:border-brand-500",
      ].join(" ")}
    >
      <CategoryDot category={label} size={8} />
      {label}
    </button>
  );
}

function TransactionsPage() {
  useDocumentTitle("Transactions");
  const { filtered, filters, setFilters, updateCategory } = useTransactions();
  const [openTx, setOpenTx] = useState(null);

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

  const clearAll = () =>
    setFilters((f) => ({
      ...f,
      categories: [],
      search: "",
      amountMin: null,
      amountMax: null,
    }));

  const activeFilters =
    filters.categories.length +
    (filters.search ? 1 : 0) +
    (filters.amountMin != null ? 1 : 0) +
    (filters.amountMax != null ? 1 : 0);

  return (
    <section className="space-y-5 pt-2">
      <div className="lg:static sticky top-[88px] z-20 -mx-4 px-4 md:mx-0 md:px-0">
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink-500 dark:text-ink-400">Activity</p>
            <h2 className="mt-1 text-2xl font-black text-ink-900 dark:text-ink-50">
              {sorted.length} transactions
            </h2>
          </div>
          <div className="flex items-center gap-2">
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
            <div className="hidden grid-cols-[1.4fr_1fr_1fr_auto] gap-3 border-b border-ink-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-ink-500 md:grid dark:border-ink-800 dark:text-ink-400">
              <span>Merchant</span>
              <span>Date</span>
              <span>Category</span>
              <span className="text-right">Amount</span>
            </div>
            <ul className="divide-y divide-ink-100 dark:divide-ink-800">
              {sorted.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setOpenTx(t)}
                    className="grid w-full grid-cols-[1.4fr_1fr_auto] gap-3 px-4 py-3 text-left transition hover:bg-[#f8fbff] md:grid-cols-[1.4fr_1fr_1fr_auto] dark:hover:bg-ink-800/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold text-ink-900 dark:text-ink-50">{t.merchant_normalized}</p>
                      <p className="truncate text-xs text-ink-500 dark:text-ink-400">{t.description}</p>
                    </div>
                    <p className="self-center text-sm text-ink-600 dark:text-ink-300">{formatDate(t.date)}</p>
                    <div className="hidden self-center md:flex">
                      <Badge tone="neutral">
                        <CategoryDot category={t.category} size={8} />
                        {t.category}
                      </Badge>
                    </div>
                    <p className="tabular self-center text-right font-black text-ink-900 dark:text-ink-50">
                      -{formatAmountSpend(t.amount)}
                    </p>
                  </button>
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
