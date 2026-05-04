import { useCallback, useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import {
  Calculator,
  Calendar,
  ChevronDown,
  Hammer,
  Home,
  Landmark,
  Percent,
  PiggyBank,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import CategoryDonut from "../components/charts/CategoryDonut";
import ProfitCurveChart from "../components/charts/ProfitCurveChart";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import Input from "../components/ui/Input";
import useDocumentTitle from "../hooks/useDocumentTitle";
import {
  EMPTY_HOUSE_SALE_INPUT,
  HOUSE_SALE_LOAN_DEFAULTS,
  HOUSE_SALE_PLACEHOLDERS,
  HOUSE_SALE_RATE_DEFAULTS,
  HOUSE_SALE_TARGET_PROFIT_DEFAULT,
  HOUSE_SALE_TARGET_PROFIT_SLIDER,
} from "../types/houseSale";
import {
  buildLoanCompositionDonutData,
  generateProfitCurveSeries,
  getHouseSaleNarrativeBullets,
  snapTargetProfitSlider,
} from "../utils/houseSaleChartData";
import {
  buildInsightLines,
  computeHouseSale,
} from "../utils/houseSaleCalculations";
import { formatCurrency, formatPct } from "../utils/format";

/* ── tiny helpers ──────────────────────────────────────────────── */

function parseNum(v) {
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function todayIsoDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtWhole(n) {
  return formatCurrency(n).replace(/\.00$/, "");
}

function fmtCompact(n) {
  return formatCurrency(n, { compact: true });
}

/* ── shared sub-components ─────────────────────────────────────── */

function FieldRow({ label, hint, value, onChange, icon: Icon, step = "1", placeholder, type = "number", min }) {
  const isNumber = type === "number";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">{label}</label>
        {Icon ? <span className="text-ink-400 dark:text-ink-500"><Icon size={14} aria-hidden /></span> : null}
      </div>
      <Input
        type={type}
        inputMode={isNumber ? "decimal" : undefined}
        step={isNumber ? step : undefined}
        min={isNumber ? (min ?? 0) : undefined}
        max={type === "date" ? todayIsoDate() : undefined}
        value={value === "" || value == null ? "" : value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        wrapperClassName="rounded-xl2"
        className="tabular"
      />
      {hint ? <p className="text-[11px] text-ink-500 dark:text-ink-500">{hint}</p> : null}
    </div>
  );
}

function OptionalFieldRow({ label, hint, value, onChange, icon: Icon, placeholder = "0" }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">
          {label} <span className="font-normal normal-case text-ink-400">(optional)</span>
        </label>
        {Icon ? <span className="text-ink-400 dark:text-ink-500"><Icon size={14} aria-hidden /></span> : null}
      </div>
      <Input
        type="number"
        inputMode="decimal"
        step="1"
        min={0}
        value={value === "" || value == null ? "" : value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        wrapperClassName="rounded-xl2"
        className="tabular"
      />
      {hint ? <p className="text-[11px] text-ink-500 dark:text-ink-500">{hint}</p> : null}
    </div>
  );
}

function InputSection({ title, icon: Icon, defaultOpen = true, children }) {
  return (
    <details
      open={defaultOpen}
      className="group min-w-0 rounded-xl2 border border-white/60 bg-white/40 dark:border-ink-800 dark:bg-ink-900/40"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5 text-sm font-black text-ink-900 dark:text-ink-50 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-2">
          {Icon ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-ink-800 dark:text-brand-300">
              <Icon size={16} />
            </span>
          ) : null}
          <span className="truncate">{title}</span>
        </span>
        <ChevronDown size={18} className="shrink-0 text-ink-400 transition group-open:rotate-180 dark:text-ink-500" aria-hidden />
      </summary>
      <div className="border-t border-white/60 px-5 pb-5 pt-4 dark:border-ink-800">{children}</div>
    </details>
  );
}

function SectionHeading({ emoji, title, description }) {
  return (
    <header className="mb-4">
      <h3 className="text-xl font-black tracking-tight text-ink-900 dark:text-ink-50 md:text-2xl">
        <span className="mr-2" aria-hidden>{emoji}</span>{title}
      </h3>
      {description ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600 dark:text-ink-400">{description}</p> : null}
    </header>
  );
}

function EmphasisStat({ emoji, title, value, exact, sub, variant = "neutral" }) {
  const border =
    variant === "success" ? "border-emerald-300/90 shadow-soft dark:border-emerald-800/60 dark:shadow-softDark"
    : variant === "danger" ? "border-rose-300/90 shadow-soft dark:border-rose-900/45 dark:shadow-softDark"
    : variant === "warn" ? "border-amber-300/90 shadow-soft dark:border-amber-900/40 dark:shadow-softDark"
    : "border-white/60 dark:border-ink-800";
  const valueTone =
    variant === "success" ? "text-emerald-600 dark:text-emerald-400"
    : variant === "danger" ? "text-rose-600 dark:text-rose-400"
    : variant === "warn" ? "text-amber-700 dark:text-amber-300"
    : "text-ink-900 dark:text-ink-50";

  return (
    <Card className={`${border} min-w-0 border-2`} padding="md" hover>
      <p className="text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">
        <span className="mr-1.5" aria-hidden>{emoji}</span>{title}
      </p>
      <p className={`mt-2 tabular text-xl font-black tracking-tight sm:text-2xl ${valueTone}`} title={exact}>{value}</p>
      {sub ? <p className="mt-2 text-xs leading-snug text-ink-500 dark:text-ink-400">{sub}</p> : null}
    </Card>
  );
}

function StatTile({ label, value, sub, exact }) {
  return (
    <div className="min-w-0 rounded-xl2 border border-white/60 bg-white/60 px-4 py-3 dark:border-ink-800 dark:bg-ink-900/50">
      <p className="text-[10px] font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">{label}</p>
      <p className="mt-1.5 tabular text-base font-black tracking-tight text-ink-900 dark:text-ink-50 sm:text-lg" title={exact}>{value}</p>
      {sub ? <p className="mt-1 text-[11px] leading-snug text-ink-500 dark:text-ink-500">{sub}</p> : null}
    </div>
  );
}

function ColorStatTile({ label, value, exact, colorClass }) {
  return (
    <div className={`min-w-0 rounded-xl2 border px-4 py-3 ${colorClass}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide">{label}</p>
      <p className="mt-1 tabular text-base font-black tracking-tight sm:text-lg" title={exact}>{value}</p>
    </div>
  );
}

function FlowDivider({ label }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-px flex-1 bg-ink-200/90 dark:bg-ink-700" />
      <span className="shrink-0 text-[11px] font-black uppercase tracking-wide text-ink-500 dark:text-ink-400">{label}</span>
      <div className="h-px flex-1 bg-ink-200/90 dark:bg-ink-700" />
    </div>
  );
}

function WaterfallBar({ label, display, valueForWidth, sale, colorClass }) {
  const max = Math.max(sale, 1);
  const w = `${Math.min(100, (Math.abs(Number(valueForWidth)) / max) * 100)}%`;
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex min-w-0 items-start justify-between gap-2 text-xs">
        <span className="min-w-0 shrink font-semibold leading-snug text-ink-600 dark:text-ink-300">{label}</span>
        <span className="shrink-0 tabular font-black text-ink-900 dark:text-ink-50">{display}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
        <Motion.div layout className={`h-full rounded-full ${colorClass}`} style={{ width: w }} transition={{ type: "spring", stiffness: 280, damping: 28 }} />
      </div>
    </div>
  );
}

function SellingOutcomeWaterfall({ sale, commission, closing, payoff, cashAtClose, invested, trueProfit }) {
  return (
    <div className="space-y-4">
      <WaterfallBar label="Starting point: your expected sale" display={fmtCompact(sale)} valueForWidth={sale} sale={sale} colorClass="bg-brand" />
      <WaterfallBar label="Agent commission" display={`−${fmtCompact(commission)}`} valueForWidth={commission} sale={sale} colorClass="bg-rose-400/90 dark:bg-rose-600/80" />
      <WaterfallBar label="Seller closing costs" display={`−${fmtCompact(closing)}`} valueForWidth={closing} sale={sale} colorClass="bg-amber-400/90 dark:bg-amber-600/80" />
      <WaterfallBar label="Estimated loan payoff" display={`−${fmtCompact(payoff)}`} valueForWidth={payoff} sale={sale} colorClass="bg-ink-400 dark:bg-ink-500" />
      <FlowDivider label="Cash at closing" />
      <div className="rounded-xl2 border-2 border-brand-300 bg-brand-100 px-4 py-3 dark:border-brand-600 dark:bg-brand-900/60">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-900 dark:text-brand-100">Cash at closing</p>
        <p className="mt-1 tabular text-lg font-black tracking-tight text-brand-950 dark:text-white" title={fmtWhole(cashAtClose)}>{fmtCompact(cashAtClose)}</p>
      </div>
      <WaterfallBar label="Money you put into the home (our count)" display={`−${fmtCompact(invested)}`} valueForWidth={invested} sale={sale} colorClass="bg-accent-500/85" />
      <FlowDivider label="True profit / loss" />
      <div className={`rounded-xl2 border-2 px-4 py-3 ${trueProfit >= 0 ? "border-emerald-300 bg-emerald-100 dark:border-emerald-600 dark:bg-emerald-900/60" : "border-rose-300 bg-rose-100 dark:border-rose-600 dark:bg-rose-900/50"}`}>
        <p className={`text-xs font-bold uppercase tracking-wide ${trueProfit >= 0 ? "text-emerald-900 dark:text-emerald-100" : "text-rose-900 dark:text-rose-100"}`}>True profit / loss</p>
        <p className={`mt-1 tabular text-lg font-black tracking-tight ${trueProfit >= 0 ? "text-emerald-950 dark:text-white" : "text-rose-950 dark:text-white"}`}>{formatCurrency(trueProfit, { signed: true })}</p>
      </div>
    </div>
  );
}

/* ── main page ─────────────────────────────────────────────────── */

function HouseSaleCalculator() {
  useDocumentTitle("House Sale");
  const [input, setInput] = useState(() => ({ ...EMPTY_HOUSE_SALE_INPUT }));
  const [loanDonutActive, setLoanDonutActive] = useState(null);

  const set = (key) => (v) => {
    if (v === "") { setInput((prev) => ({ ...prev, [key]: "" })); return; }
    setInput((prev) => ({ ...prev, [key]: parseNum(v) }));
  };
  const setDate = (v) => setInput((prev) => ({ ...prev, purchaseDate: v }));

  const merged = useMemo(() => {
    const num = (k, fallback = 0) => {
      const raw = input[k];
      if (raw === "" || raw == null) return fallback;
      const n = Number(raw);
      return Number.isFinite(n) ? n : fallback;
    };
    return {
      purchasePrice: num("purchasePrice", 0),
      downPayment: num("downPayment", 0),
      purchaseDate: input.purchaseDate || "",
      annualInterestRate: num("annualInterestRate", 0),
      loanTermYears: input.loanTermYears === "" || input.loanTermYears == null
        ? HOUSE_SALE_LOAN_DEFAULTS.loanTermYears
        : num("loanTermYears", HOUSE_SALE_LOAN_DEFAULTS.loanTermYears),
      expectedSalePrice: num("expectedSalePrice", 0),
      agentCommissionPct: input.agentCommissionPct === "" || input.agentCommissionPct == null
        ? HOUSE_SALE_RATE_DEFAULTS.agentCommissionPct
        : num("agentCommissionPct", HOUSE_SALE_RATE_DEFAULTS.agentCommissionPct),
      closingCostsPct: input.closingCostsPct === "" || input.closingCostsPct == null
        ? HOUSE_SALE_RATE_DEFAULTS.closingCostsPct
        : num("closingCostsPct", HOUSE_SALE_RATE_DEFAULTS.closingCostsPct),
      repairsImprovements: num("repairsImprovements", 0),
      annualPropertyTax: num("annualPropertyTax", 0),
      annualInsurance: num("annualInsurance", 0),
      monthlyHoa: num("monthlyHoa", 0),
      maintenanceTotal: num("maintenanceTotal", 0),
      targetProfit: num("targetProfit", HOUSE_SALE_TARGET_PROFIT_DEFAULT),
    };
  }, [input]);

  const result = useMemo(() => computeHouseSale(merged, new Date(), input), [merged, input]);
  const insights = useMemo(() => buildInsightLines(result), [result]);
  const narrative = useMemo(() => getHouseSaleNarrativeBullets(result), [result]);
  const { mortgage } = result;

  const loanSoFar = useMemo(() => {
    const monthsPaid = Math.floor(mortgage.monthsElapsed);
    const totalPaid = mortgage.monthlyPayment * monthsPaid;
    const principalPaid = mortgage.principalPaidDown;
    const interestPaid = Math.max(0, totalPaid - principalPaid);
    return { monthsPaid, totalPaid, principalPaid, interestPaid };
  }, [mortgage]);

  const loanDonutData = useMemo(
    () => buildLoanCompositionDonutData(loanSoFar.principalPaid, loanSoFar.interestPaid, mortgage.remainingBalance),
    [loanSoFar.principalPaid, loanSoFar.interestPaid, mortgage.remainingBalance],
  );
  const loanDonutTotal = useMemo(() => loanDonutData.reduce((s, d) => s + (d.total ?? 0), 0), [loanDonutData]);

  const profitCurve = useMemo(() => {
    if (!result.canComputePriceTargets) return { points: [] };
    return generateProfitCurveSeries({
      expectedSalePrice: result.expectedSalePrice,
      targetSalePrice: result.targetSalePrice,
      sellingCostRate: result.sellingCostRate,
      remainingBalance: result.remainingBalance,
      totalInvested: result.totalInvested,
      pointCount: 25,
    });
  }, [result]);

  const sliderSnap = snapTargetProfitSlider(merged.targetProfit, HOUSE_SALE_TARGET_PROFIT_SLIDER);
  const setTargetProfitFromSlider = useCallback((rawValue) => {
    setInput((prev) => ({ ...prev, targetProfit: snapTargetProfitSlider(Number(rawValue), HOUSE_SALE_TARGET_PROFIT_SLIDER) }));
  }, []);

  const profitCardVariant = result.trueProfit >= 0 ? "success" : result.netProceeds >= 0 ? "warn" : "danger";
  const breakEvenCardVariant = !result.isValidModel ? "neutral"
    : result.breakEvenSalePrice != null && result.expectedSalePrice > 0 && result.expectedSalePrice < result.breakEvenSalePrice ? "warn" : "success";

  const ph = HOUSE_SALE_PLACEHOLDERS;

  return (
    <section className="space-y-8 pb-6 pt-2">
      {/* ── Hero ── */}
      <Card variant="dark" padding="lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white/70">Real estate exit</p>
            <h2 className="mt-1 text-2xl font-black md:text-3xl">House Sale Calculator</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              Three snapshots: what the loan has cost so far, what a sale does for your wallet, and what sale price hits your goal.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
            <Calculator size={22} />
          </div>
        </div>
      </Card>

      {/* ── Validation errors ── */}
      {result.errors.length ? (
        <Card className="border-rose-200 bg-rose-50/80 dark:border-rose-900/40 dark:bg-rose-950/30" padding="md">
          <ul className="list-inside list-disc text-sm font-semibold text-rose-800 dark:text-rose-200">
            {result.errors.map((w) => <li key={w}>{w}</li>)}
          </ul>
        </Card>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════
          ROW 1 — Purchase & mortgage inputs  ↔  Loan summary
          ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2 xl:items-start">
        <InputSection title="Purchase & mortgage" icon={Landmark} defaultOpen>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldRow label="Original purchase price" value={input.purchasePrice} onChange={set("purchasePrice")} icon={Home} placeholder={ph.purchasePrice} />
            <FieldRow label="Down payment" value={input.downPayment} onChange={set("downPayment")} icon={Wallet} placeholder={ph.downPayment} />
            <FieldRow label="Purchase date" value={input.purchaseDate} onChange={setDate} icon={Calendar} type="date" hint="We count months from here to today." />
            <FieldRow label="Interest rate (APR %)" value={input.annualInterestRate} onChange={set("annualInterestRate")} icon={Percent} step="0.01" placeholder={ph.annualInterestRate} />
            <FieldRow label="Loan term (years)" value={input.loanTermYears} onChange={set("loanTermYears")} step="1" placeholder={ph.loanTermYears} />
          </div>
        </InputSection>

        <Motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Card padding="lg" className="border-white/60 dark:border-ink-800">
            <SectionHeading emoji="🏦" title="Your loan so far" description="A simple read on your fixed-rate loan. Your lender's payoff number can still differ." />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,200px)_1fr] lg:items-start">
              <div className="flex flex-col items-center">
                {mortgage.originalLoanAmount > 0 || loanSoFar.totalPaid > 0 || mortgage.remainingBalance > 0 ? (
                  <>
                    <CategoryDonut data={loanDonutData} total={loanDonutTotal} label="Paid & owed" size={200} activeIndex={loanDonutActive} onActiveChange={setLoanDonutActive} />
                    <p className="mt-2 max-w-[12rem] text-center text-[11px] text-ink-500 dark:text-ink-500">Hover slices to compare.</p>
                  </>
                ) : (
                  <p className="max-w-[12rem] text-center text-sm text-ink-500 dark:text-ink-400">Fill in purchase details to see your loan breakdown.</p>
                )}
              </div>
              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                <StatTile label="Original loan amount" value={fmtCompact(mortgage.originalLoanAmount)} sub="Price − down" />
                <StatTile label="Monthly payment" value={fmtWhole(mortgage.monthlyPayment)} sub="Principal & interest" />
                <StatTile label="Months paid" value={String(loanSoFar.monthsPaid)} sub="Since purchase" />
                <StatTile label="Total paid so far" value={fmtCompact(loanSoFar.totalPaid)} sub="Payment × months" />
                <ColorStatTile label="Equity built (principal)" value={fmtCompact(loanSoFar.principalPaid)} exact={fmtWhole(loanSoFar.principalPaid)} colorClass="border-emerald-200/90 bg-emerald-50/70 text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950/25 dark:text-emerald-100" />
                <ColorStatTile label="Interest cost" value={fmtCompact(loanSoFar.interestPaid)} exact={fmtWhole(loanSoFar.interestPaid)} colorClass="border-amber-200/90 bg-amber-50/80 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100" />
                <div className="sm:col-span-2">
                  <ColorStatTile label="Still owed" value={fmtCompact(mortgage.remainingBalance)} exact={fmtWhole(mortgage.remainingBalance)} colorClass="border-ink-200/80 bg-white/80 text-ink-900 dark:border-ink-700 dark:bg-ink-900/60 dark:text-ink-50" />
                </div>
              </div>
            </div>
          </Card>
        </Motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          ROW 2 — Selling inputs  ↔  If you sell today
          ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2 xl:items-start">
        <div className="space-y-5">
          <InputSection title="Selling assumptions" icon={TrendingUp} defaultOpen>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldRow label="Expected sale price" value={input.expectedSalePrice} onChange={set("expectedSalePrice")} placeholder={ph.expectedSalePrice} />
              <FieldRow label="Agent commission %" value={input.agentCommissionPct} onChange={set("agentCommissionPct")} step="0.1" placeholder={ph.agentCommissionPct} />
              <FieldRow label="Seller closing costs %" value={input.closingCostsPct} onChange={set("closingCostsPct")} step="0.1" placeholder={ph.closingCostsPct} />
              <FieldRow label="Repairs / improvements" value={input.repairsImprovements} onChange={set("repairsImprovements")} icon={Hammer} placeholder={ph.repairsImprovements} />
            </div>
            <p className="mt-3 text-xs text-ink-500 dark:text-ink-400">
              Commission & closing default to {HOUSE_SALE_RATE_DEFAULTS.agentCommissionPct}% / {HOUSE_SALE_RATE_DEFAULTS.closingCostsPct}% when blank.
            </p>
          </InputSection>

          <InputSection title="Ownership costs" icon={PiggyBank} defaultOpen={false}>
            <div className="grid gap-4 sm:grid-cols-2">
              <OptionalFieldRow label="Annual property tax" value={input.annualPropertyTax} onChange={set("annualPropertyTax")} placeholder={ph.annualPropertyTax} />
              <OptionalFieldRow label="Annual insurance" value={input.annualInsurance} onChange={set("annualInsurance")} placeholder={ph.annualInsurance} />
              <OptionalFieldRow label="HOA / month" value={input.monthlyHoa} onChange={set("monthlyHoa")} placeholder={ph.monthlyHoa} />
              <OptionalFieldRow label="Maintenance (total)" hint="Beyond one-off improvements." value={input.maintenanceTotal} onChange={set("maintenanceTotal")} placeholder={ph.maintenanceTotal} />
            </div>
            <p className="mt-3 text-xs text-ink-500 dark:text-ink-400">
              Carrying costs use ~<span className="font-bold text-ink-800 dark:text-ink-200">{mortgage.yearsOwned.toFixed(2)}</span> years from purchase to today.
            </p>
          </InputSection>
        </div>

        <Motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
          <Card padding="lg" className="border-white/60 dark:border-ink-800">
            <SectionHeading emoji="💸" title="If you sell today" description="What your expected price means for money in your pocket." />
            <div className="mb-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
              <EmphasisStat emoji="💵" title="Cash at closing" value={fmtCompact(result.netProceeds)} exact={fmtWhole(result.netProceeds)} sub="After agent, closing, and estimated loan payoff" variant={result.netProceeds < 0 ? "danger" : "neutral"} />
              <EmphasisStat emoji="📉" title="True profit / loss" value={fmtCompact(result.trueProfit)} exact={formatCurrency(result.trueProfit, { signed: true })} sub={`ROI ${result.roiPercent == null ? "—" : formatPct(result.roiPercent)} · ${result.cashReturnedMultiple == null ? "—" : `${result.cashReturnedMultiple.toFixed(2)}×`} vs cash in`} variant={profitCardVariant} />
              <EmphasisStat emoji="🧱" title="Break-even sale price" value={result.breakEvenSalePrice == null ? "—" : fmtCompact(result.breakEvenSalePrice)} exact={result.breakEvenSalePrice == null ? undefined : fmtWhole(result.breakEvenSalePrice)} sub="After fees, payoff, and your counted costs" variant={breakEvenCardVariant} />
              <EmphasisStat emoji="🎯" title="Price for target profit" value={result.targetSalePrice == null ? "—" : fmtCompact(result.targetSalePrice)} exact={result.targetSalePrice == null ? undefined : fmtWhole(result.targetSalePrice)} sub={`For about ${fmtCompact(result.targetProfitInput)} true profit`} variant="neutral" />
            </div>
            <div className="rounded-xl2 border border-brand-200/70 bg-brand-50/60 px-4 py-3 dark:border-brand-800/50 dark:bg-brand-950/25">
              <p className="text-xs font-bold text-brand-900 dark:text-brand-100">Remember</p>
              <p className="mt-1 text-sm text-ink-800 dark:text-ink-200">
                <span className="font-bold text-brand-800 dark:text-brand-200">Cash at closing</span> is what's left after the sale costs and loan payoff.{" "}
                <span className="font-bold text-brand-800 dark:text-brand-200">True profit</span> also backs out all invested cash.
              </p>
            </div>
          </Card>
        </Motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          ROW 3 — Target profit + profit curve  ↔  Cost breakdown
          Slider and chart live side-by-side now.
          ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2 xl:items-start">
        <div className="space-y-5">
          <InputSection title="Target profit" icon={Target} defaultOpen>
            <FieldRow label="Profit you want after the sale" hint="Slide for round numbers, or type any amount." value={input.targetProfit} onChange={set("targetProfit")} placeholder={ph.targetProfit} />
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                <span>Quick set</span>
                <span className="tabular text-ink-700 dark:text-ink-200">{formatCurrency(sliderSnap)}</span>
              </div>
              <input
                type="range"
                min={HOUSE_SALE_TARGET_PROFIT_SLIDER.min}
                max={HOUSE_SALE_TARGET_PROFIT_SLIDER.max}
                step={HOUSE_SALE_TARGET_PROFIT_SLIDER.step}
                value={sliderSnap}
                onChange={(e) => setTargetProfitFromSlider(e.target.value)}
                onInput={(e) => setTargetProfitFromSlider(e.target.value)}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-ink-200 accent-brand dark:bg-ink-700"
                aria-label="Target profit slider"
              />
              <p className="text-[11px] text-ink-500 dark:text-ink-500">
                {formatCurrency(HOUSE_SALE_TARGET_PROFIT_SLIDER.min)}–{formatCurrency(HOUSE_SALE_TARGET_PROFIT_SLIDER.max)} in {formatCurrency(HOUSE_SALE_TARGET_PROFIT_SLIDER.step)} steps
                (defaults to {formatCurrency(HOUSE_SALE_TARGET_PROFIT_DEFAULT)} when blank).
              </p>
            </div>
          </InputSection>

          <Card padding="lg" className="border-white/60 dark:border-ink-800">
            <SectionHeading emoji="📊" title="Profit curve" description="True profit across a range of sale prices. Steeper slope means costs eat less of each extra dollar." />
            <Motion.div className="mt-2 min-h-[280px] min-w-0 w-full rounded-xl2 border border-white/60 bg-white/50 p-3 dark:border-ink-800 dark:bg-ink-900/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              <ProfitCurveChart data={profitCurve.points} markers={{ expected: result.expectedSalePrice, breakEven: result.breakEvenSalePrice, target: result.targetSalePrice }} height={280} />
            </Motion.div>
          </Card>
        </div>

        <Motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }}>
          <Card padding="lg" className="border-white/60 dark:border-ink-800">
            <SectionHeader title="Cost breakdown" eyebrow="Selling outcome" />
            <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">Each bar is sized next to your expected sale so you can feel the bite of each cost.</p>
            <div className="mt-4">
              <SellingOutcomeWaterfall sale={result.expectedSalePrice} commission={result.agentCommission} closing={result.sellerClosingCosts} payoff={result.remainingBalance} cashAtClose={result.netProceeds} invested={result.totalInvested} trueProfit={result.trueProfit} />
            </div>
          </Card>
        </Motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          ROW 4 — Price guardrails  +  Narrative / Insights
          ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2 xl:items-start">
        <Motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
          <Card padding="lg" className="border-white/60 dark:border-ink-800">
            <SectionHeading emoji="🎯" title="What price makes this worth it?" description="Guardrails—not a title-company quote." />
            <div className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 [&>*]:min-w-0">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">Break-even</p>
                <p className="mt-1 tabular text-xl font-black tracking-tight text-ink-900 dark:text-ink-50 sm:text-2xl" title={result.breakEvenSalePrice == null ? undefined : fmtWhole(result.breakEvenSalePrice)}>{result.breakEvenSalePrice == null ? "—" : fmtCompact(result.breakEvenSalePrice)}</p>
                <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">Roughly flat after fees, payoff, and invested cash.</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-500 dark:text-ink-400">Hit your target profit</p>
                <p className="mt-1 tabular text-xl font-black tracking-tight text-ink-900 dark:text-ink-50 sm:text-2xl" title={result.targetSalePrice == null ? undefined : fmtWhole(result.targetSalePrice)}>{result.targetSalePrice == null ? "—" : fmtCompact(result.targetSalePrice)}</p>
                <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">
                  The price that leaves about <span className="font-bold text-ink-800 dark:text-ink-200">{fmtCompact(result.targetProfitInput)}</span> of true profit.
                </p>
              </div>
              {result.minSalePriceNetProceedsZero != null ? (
                <p className="text-xs text-ink-500 dark:text-ink-500 sm:col-span-2">
                  Just need $0 at closing? That's about <span className="font-bold text-ink-700 dark:text-ink-300">{fmtCompact(result.minSalePriceNetProceedsZero)}</span>—not the same as truly breaking even.
                </p>
              ) : null}
            </div>
          </Card>
        </Motion.div>

        <div className="space-y-6">
          {narrative.length ? (
            <Card className="border-amber-200/80 bg-amber-50/50 dark:border-amber-900/35 dark:bg-amber-950/20" padding="md">
              <SectionHeader title="Headlines for your situation" eyebrow="At a glance" />
              <ul className="mt-3 space-y-2 text-sm font-semibold text-ink-800 dark:text-ink-100">
                {narrative.map((line) => <li key={line} className="leading-snug">{line}</li>)}
              </ul>
            </Card>
          ) : null}

          <Card padding="md" variant="inset">
            <SectionHeader title="More detail" eyebrow="Takeaway" />
            <ul className="mt-4 space-y-2 text-sm text-ink-700 dark:text-ink-200">
              {insights.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <p className="text-center text-[11px] text-ink-500 dark:text-ink-500">
        Estimates only—not tax advice (capital gains, depreciation recapture, etc. are not modeled).
      </p>
    </section>
  );
}

export default HouseSaleCalculator;
