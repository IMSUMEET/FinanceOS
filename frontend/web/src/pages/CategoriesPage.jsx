import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Card from "../components/ui/Card";
import Pill from "../components/ui/Pill";
import IconButton from "../components/ui/IconButton";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import CategoryDot from "../components/ui/CategoryDot";
import EmptyState from "../components/ui/EmptyState";
import SectionHeader from "../components/ui/SectionHeader";
import MiniSparkline from "../components/charts/MiniSparkline";
import MonthlyCategoryBars from "../components/charts/MonthlyCategoryBars";
import { useTransactions } from "../context/useTransactions";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { categoryColor } from "../utils/categories";
import { formatAmountSpend, formatCurrency, formatDate } from "../utils/format";

function CategoryGrid() {
  const { filtered, derived } = useTransactions();
  const total = derived.categories.reduce((s, c) => s + c.total, 0);

  // Sparkline points per category (across months in current filter)
  const sparkByCat = useMemo(() => {
    const out = {};
    for (const m of derived.monthlyByCategory) {
      for (const k of Object.keys(m)) {
        if (k === "month") continue;
        out[k] = out[k] ?? [];
        out[k].push({ v: m[k] ?? 0 });
      }
    }
    return out;
  }, [derived.monthlyByCategory]);

  if (derived.categories.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={ArrowUpRight}
          title="No category activity"
          description="Adjust filters or upload a CSV to see breakdowns."
        />
      </Card>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {derived.categories.map((c) => {
        const share = total ? (c.total / total) * 100 : 0;
        const color = categoryColor(c.category);
        return (
          <Link key={c.category} to={`/categories/${encodeURIComponent(c.category)}`}>
            <Card className="h-full transition hover:shadow-softLg">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CategoryDot category={c.category} size={10} />
                    <p className="text-sm font-semibold text-ink-500 dark:text-ink-400">{c.category}</p>
                  </div>
                  <p className="tabular mt-3 text-3xl font-black text-ink-900 dark:text-ink-50">
                    {formatCurrency(c.total)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-ink-500 dark:text-ink-400">
                    {share.toFixed(1)}% of spend · {c.count} txns ·{" "}
                    {filtered.filter((t) => t.category === c.category).length} in view
                  </p>
                </div>
                <Badge tone="neutral">View</Badge>
              </div>
              <div className="mt-5">
                <MiniSparkline data={sparkByCat[c.category]} color={color} />
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function CategoryDetail({ name }) {
  const { filtered, derived } = useTransactions();

  const monthlyForCat = useMemo(() => {
    return derived.monthlyByCategory.map((m) => ({ month: m.month, total: m[name] ?? 0 }));
  }, [derived.monthlyByCategory, name]);

  const txns = useMemo(
    () =>
      [...filtered]
        .filter((t) => t.category === name)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [filtered, name],
  );

  const total = txns.reduce((s, t) => s + Math.abs(t.amount), 0);

  const merchantsForCat = useMemo(() => {
    const map = new Map();
    for (const t of txns) {
      const key = t.merchant_normalized || t.merchant_raw || "Unknown";
      const cur = map.get(key) ?? { merchant: key, total: 0, count: 0 };
      cur.total += Math.abs(t.amount);
      cur.count += 1;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [txns]);

  return (
    <section className="space-y-5 pt-2">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/categories">
              <IconButton aria-label="Back to categories">
                <ArrowLeft size={16} />
              </IconButton>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <CategoryDot category={name} size={12} />
                <p className="text-sm font-semibold text-ink-500 dark:text-ink-400">Category</p>
              </div>
              <h2 className="mt-1 text-3xl font-black text-ink-900 dark:text-ink-50">{name}</h2>
            </div>
          </div>
          <Pill>{formatCurrency(total)} · {txns.length} txns</Pill>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <SectionHeader eyebrow="Monthly trend" title={`${name} over time`} />
          <div className="mt-6 rounded-xl2 bg-[#edf6ff] p-4 dark:bg-ink-800/60">
            <MonthlyCategoryBars data={monthlyForCat} color={categoryColor(name)} />
          </div>
        </Card>
        <Card className="xl:col-span-4">
          <SectionHeader eyebrow="Top Merchants" title={`In ${name}`} />
          <div className="mt-5 space-y-3">
            {merchantsForCat.slice(0, 6).map((m) => (
              <div
                key={m.merchant}
                className="flex items-center justify-between rounded-xl2 bg-[#f8fbff] px-4 py-3 dark:bg-ink-800/60"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink-900 dark:text-ink-50">{m.merchant}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">{m.count} txns</p>
                </div>
                <p className="tabular shrink-0 font-black text-ink-900 dark:text-ink-50">{formatCurrency(m.total)}</p>
              </div>
            ))}
            {merchantsForCat.length === 0 ? (
              <p className="text-sm text-ink-500 dark:text-ink-400">No merchants in this category for the current filters.</p>
            ) : null}
          </div>
        </Card>
      </div>

      <Card padding="sm">
        <div className="border-b border-ink-100 px-4 py-3 dark:border-ink-800">
          <p className="text-sm font-bold text-ink-700 dark:text-ink-200">Transactions in {name}</p>
        </div>
        {txns.length === 0 ? (
          <EmptyState icon={ArrowUpRight} title="No transactions" description="Try adjusting filters." />
        ) : (
          <ul className="divide-y divide-ink-100 dark:divide-ink-800">
            {txns.map((t) => (
              <li
                key={t.id}
                className="grid grid-cols-[1.4fr_1fr_auto] gap-3 px-4 py-3 hover:bg-[#f8fbff] dark:hover:bg-ink-800/60"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink-900 dark:text-ink-50">{t.merchant_normalized}</p>
                  <p className="truncate text-xs text-ink-500 dark:text-ink-400">{t.description}</p>
                </div>
                <p className="self-center text-sm text-ink-600 dark:text-ink-300">{formatDate(t.date)}</p>
                <p className="tabular self-center text-right font-black text-ink-900 dark:text-ink-50">
                  -{formatAmountSpend(t.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex justify-end">
        <Link to="/transactions">
          <Button variant="ghost" iconRight={ArrowUpRight}>
            View all transactions
          </Button>
        </Link>
      </div>
    </section>
  );
}

function CategoriesPage() {
  const { name } = useParams();
  useDocumentTitle(name ? decodeURIComponent(name) : "Categories");

  if (name) return <CategoryDetail name={decodeURIComponent(name)} />;

  return (
    <section className="space-y-5 pt-2">
      <Card>
        <SectionHeader
          eyebrow="Categories"
          title="How your money is split"
          action={<Pill tone="dark">All categories</Pill>}
        />
      </Card>
      <CategoryGrid />
    </section>
  );
}

export default CategoriesPage;
