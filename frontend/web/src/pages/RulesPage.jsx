import { useState, useMemo } from "react";
import { Sliders, Trash2, RefreshCw, CheckCircle2, ShieldCheck, Tag } from "lucide-react";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import Badge from "../components/ui/Badge";
import CategoryBadge from "../components/ui/CategoryBadge";
import { useTransactions } from "../context/useTransactions";

export default function RulesPage() {
  const { transactions, deleteMerchantRule, reprocessUncategorized } = useTransactions();
  const [reprocessing, setReprocessing] = useState(false);
  const [reprocessedDone, setReprocessedDone] = useState(false);

  // Load structured merchant rules from localStorage
  const structuredRules = useMemo(() => {
    try {
      const raw = localStorage.getItem("finance_os_structured_merchant_rules");
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore */
    }

    // Fallback to simple merchant rules map
    try {
      const rawSimple = localStorage.getItem("finance_os_merchant_rules");
      if (rawSimple) {
        const simple = JSON.parse(rawSimple);
        return Object.entries(simple).map(([mKey, cat], idx) => ({
          id: `simple_${idx}_${mKey}`,
          matchType: "normalized_merchant",
          matchValue: mKey,
          merchantNormalized: mKey.charAt(0).toUpperCase() + mKey.slice(1),
          category: cat,
          subcategory: null,
          transactionType: "expense",
          source: "manual",
          createdAt: new Date().toISOString(),
        }));
      }
    } catch {
      /* ignore */
    }
    return [];
  }, [transactions]);

  // Compute matched transaction counts for each rule
  const rulesWithCounts = useMemo(() => {
    return structuredRules.map((rule) => {
      const val = (rule.matchValue || "").toLowerCase();
      const matchCount = (transactions || []).filter((t) => {
        const mKey = (t.merchant_normalized || t.merchant || t.merchant_raw || t.description || "")
          .trim()
          .toLowerCase();
        return mKey === val || mKey.includes(val);
      }).length;

      return {
        ...rule,
        matchCount,
      };
    });
  }, [structuredRules, transactions]);

  const handleDeleteRule = (ruleId) => {
    deleteMerchantRule(ruleId);
    window.location.reload();
  };

  const handleReprocess = () => {
    setReprocessing(true);
    setReprocessedDone(false);
    setTimeout(() => {
      reprocessUncategorized();
      setReprocessing(false);
      setReprocessedDone(true);
      setTimeout(() => setReprocessedDone(false), 3000);
    }, 400);
  };

  return (
    <div className="space-y-6 pb-12">
      <SectionHeader
        title="Categorization Rules"
        subtitle="Manage permanent merchant rules and reprocess uncategorized transactions."
        actions={
          <button
            type="button"
            onClick={handleReprocess}
            disabled={reprocessing}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-purple-700 disabled:opacity-50 transition"
          >
            <RefreshCw size={14} className={reprocessing ? "animate-spin" : ""} />
            {reprocessing ? "Reprocessing..." : "Reprocess Uncategorized"}
          </button>
        }
      />

      {reprocessedDone && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 size={16} />
          Uncategorized transactions successfully reprocessed against current rules!
        </div>
      )}

      {/* Rules Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card padding="md" className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">
              Total Rules
            </p>
            <p className="text-2xl font-black text-ink-900 dark:text-white mt-1">
              {rulesWithCounts.length}
            </p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Sliders size={20} />
          </span>
        </Card>

        <Card padding="md" className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">
              Manual Rules
            </p>
            <p className="text-2xl font-black text-ink-900 dark:text-white mt-1">
              {rulesWithCounts.filter((r) => r.source === "manual").length}
            </p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={20} />
          </span>
        </Card>

        <Card padding="md" className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">
              Matched History
            </p>
            <p className="text-2xl font-black text-ink-900 dark:text-white mt-1">
              {rulesWithCounts.reduce((acc, r) => acc + r.matchCount, 0)} txns
            </p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Tag size={20} />
          </span>
        </Card>
      </div>

      {/* Rules Table */}
      <Card padding="none">
        <div className="border-b border-border-subtle p-4 dark:border-ink-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-ink-900 dark:text-white">
            Active Merchant Rules
          </h3>
          <span className="text-xs text-ink-500 dark:text-ink-400 font-semibold">
            Highest priority rule applies first
          </span>
        </div>

        {rulesWithCounts.length === 0 ? (
          <div className="p-8 text-center text-sm font-semibold text-ink-500 dark:text-ink-400">
            No merchant rules created yet. Approve merchant groups in AI Insights to automatically
            build permanent rules!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-surface-muted/60 text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:bg-ink-900/60 dark:text-ink-400">
                <tr>
                  <th className="px-4 py-3">Merchant Pattern</th>
                  <th className="px-4 py-3">Classification</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3 text-center">Matched Txns</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle dark:divide-ink-800">
                {rulesWithCounts.map((rule) => (
                  <tr
                    key={rule.id}
                    className="hover:bg-surface-muted/40 dark:hover:bg-ink-800/40 transition"
                  >
                    <td className="px-4 py-3 font-bold text-ink-900 dark:text-white">
                      {rule.merchantNormalized || rule.matchValue}
                    </td>
                    <td className="px-4 py-3">
                      <CategoryBadge category={rule.category} />
                      {rule.subcategory && (
                        <span className="ml-2 text-[10px] font-bold text-ink-400">
                          ({rule.subcategory})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={rule.source === "manual" ? "success" : "purple"}>
                        {rule.source === "manual" ? "Manual" : "Approved AI"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center font-bold font-mono text-ink-700 dark:text-ink-300">
                      {rule.matchCount} matches
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="rounded-lg p-1 text-ink-400 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition"
                        title="Delete rule"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
