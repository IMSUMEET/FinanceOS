import { createElement, useState } from "react";
import { motion as Motion } from "framer-motion";
import {
  AtSign,
  Download,
  LogOut,
  Mail,
  MapPin,
  MoonStar,
  Palette,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  Wallet,
} from "lucide-react";
import Avatar from "../common/Avatar";
import Button from "../ui/Button";
import { useTransactions } from "../../context/useTransactions";
import { useProfile } from "../../hooks/useProfile";
import { useTheme } from "../../hooks/useTheme";
import { classifyPersonality } from "../../utils/personality";
import { detectRecurring, totalSpend } from "../../utils/insights";
import { formatCurrency, monthKey } from "../../utils/format";
import seed from "../../data/mockTransactions";

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
        {createElement(icon, { size: 14 })}
      </span>
      <span className="text-ink-500 dark:text-ink-400">{label}</span>
      <span className="ml-auto font-semibold text-ink-900 dark:text-ink-100">{value}</span>
    </div>
  );
}

function QuickAction({ icon, label, onClick, tone = "default", disabled = false }) {
  const tones = {
    default:
      "border-ink-100 bg-white text-ink-700 hover:border-brand-200 hover:bg-brand-50/40 dark:border-ink-800 dark:bg-ink-900/60 dark:text-ink-200 dark:hover:border-brand-700 dark:hover:bg-ink-800",
    warn:
      "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-200 dark:hover:bg-amber-900/30",
    danger:
      "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-200 dark:hover:bg-rose-900/30",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${tones[tone]}`}
    >
      {createElement(icon, { size: 15 })}
      {label}
    </button>
  );
}

function exportCsv(rows) {
  const header = [
    "id",
    "date",
    "merchant_normalized",
    "merchant_raw",
    "description",
    "amount",
    "currency",
    "category",
    "source",
  ];
  const escape = (v) => {
    if (v == null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.join(",")];
  for (const r of rows) lines.push(header.map((h) => escape(r[h])).join(","));
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `financeos-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function ProfilePanel({ onClose }) {
  const { transactions, replaceAll, setFilters, ALL_MONTHS_SENTINEL } = useTransactions();
  const { profile, cycleAvatar, updateProfile, hasProfile, displayName } = useProfile();
  const { theme, toggleTheme } = useTheme();
  const [nameInput, setNameInput] = useState(profile.name ?? "");
  const [handleInput, setHandleInput] = useState(profile.handle ?? "");

  const total = totalSpend(transactions);
  const recurring = detectRecurring(transactions);
  const annualizedRecurring = recurring.reduce((s, r) => s + r.annualized, 0);
  const personality = classifyPersonality(transactions);
  const monthCount = new Set(transactions.map((t) => monthKey(t.date)).filter(Boolean)).size;
  const avgMonthly = monthCount ? total / monthCount : total;

  function handleReset() {
    replaceAll(seed);
    setFilters((f) => ({ ...f, month: ALL_MONTHS_SENTINEL, categories: [], search: "" }));
    onClose?.();
  }

  function handleCreateProfile(e) {
    e.preventDefault();
    const cleanName = nameInput.trim();
    const cleanHandle = handleInput.trim();
    if (!cleanName || !cleanHandle) return;
    updateProfile({ name: cleanName, handle: cleanHandle, profileCompleted: true });
  }

  return (
    <div className="space-y-4">
      <Motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-xl3 border border-ink-100 bg-white shadow-soft dark:border-ink-800 dark:bg-ink-900 dark:shadow-softDark"
      >
        <div className="relative h-24 bg-gradient-to-r from-[#7f8cff] via-[#8d7bf6] to-[#6b8cff]" />
        <div className="relative px-4 pb-4">
          <div className="-mt-10 flex items-end gap-3">
            <div className="rounded-full border-4 border-white bg-white shadow-soft dark:border-ink-900 dark:bg-ink-900">
              <Avatar
                seed={hasProfile ? displayName : "Guest user"}
                variant={profile.avatarVariant}
                size={76}
                className="h-[76px] w-[76px]"
                ring={false}
                alt={hasProfile ? displayName : "Guest user"}
              />
            </div>
            <div className="min-w-0 pb-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">
                {hasProfile ? "FinanceOS Member" : "Guest access"}
              </p>
              <h3 className="truncate text-xl font-black text-ink-900 dark:text-ink-50">
                {hasProfile ? displayName : "Create your profile"}
              </h3>
              <p className="mt-0.5 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">
                <span aria-hidden>{personality.emoji}</span>
                {hasProfile ? personality.label : "Unlock AI coach"}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-ink-100 bg-ink-50 px-2 py-2 text-center dark:border-ink-800 dark:bg-ink-800/60">
              <p className="tabular text-sm font-black text-ink-900 dark:text-ink-50">
                {formatCurrency(total, { compact: true })}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">Spend</p>
            </div>
            <div className="rounded-xl border border-ink-100 bg-ink-50 px-2 py-2 text-center dark:border-ink-800 dark:bg-ink-800/60">
              <p className="tabular text-sm font-black text-ink-900 dark:text-ink-50">{transactions.length}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">Txns</p>
            </div>
            <div className="rounded-xl border border-ink-100 bg-ink-50 px-2 py-2 text-center dark:border-ink-800 dark:bg-ink-800/60">
              <p className="tabular text-sm font-black text-ink-900 dark:text-ink-50">
                {formatCurrency(annualizedRecurring, { compact: true })}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">Recurring/yr</p>
            </div>
          </div>
        </div>
      </Motion.section>

      {!hasProfile ? (
        <form
          onSubmit={handleCreateProfile}
          className="rounded-xl2 border border-brand-200 bg-brand-50/60 p-4 shadow-soft dark:border-brand-800/60 dark:bg-brand-900/20 dark:shadow-softDark"
        >
          <p className="text-sm font-bold text-ink-900 dark:text-ink-100">
            Create profile to unlock advanced features
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 dark:border-ink-700 dark:bg-ink-900">
              <User size={14} className="text-ink-400 dark:text-ink-300" />
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="First name"
                className="h-10 w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none dark:text-ink-100 dark:placeholder:text-ink-500"
              />
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 dark:border-ink-700 dark:bg-ink-900">
              <AtSign size={14} className="text-ink-400 dark:text-ink-300" />
              <input
                value={handleInput}
                onChange={(e) => setHandleInput(e.target.value)}
                placeholder="Last name"
                className="h-10 w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none dark:text-ink-100 dark:placeholder:text-ink-500"
              />
            </label>
          </div>
          <Button type="submit" className="mt-3 w-full" disabled={!nameInput.trim() || !handleInput.trim()}>
            Save profile and unlock
          </Button>
        </form>
      ) : null}

      <section className="rounded-xl2 border border-ink-100 bg-white p-4 shadow-soft dark:border-ink-800 dark:bg-ink-900/70 dark:shadow-softDark">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
          Profile details
        </p>
        <div className="mt-3 space-y-2">
          <InfoRow
            icon={Mail}
            label="Email"
            value={hasProfile ? `${profile.name.toLowerCase()}.${profile.handle.toLowerCase()}@financeos.app` : "—"}
          />
          <InfoRow icon={MapPin} label="Region" value="Pune, India" />
          <InfoRow icon={ShieldCheck} label="Plan" value={hasProfile ? "FinanceOS Pro" : "Guest"} />
          <InfoRow icon={Wallet} label="Avg monthly" value={formatCurrency(avgMonthly)} />
        </div>
      </section>

      <section className="rounded-xl2 border border-ink-100 bg-white p-4 shadow-soft dark:border-ink-800 dark:bg-ink-900/70 dark:shadow-softDark">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
          Quick actions
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <QuickAction
            icon={theme === "dark" ? Sun : MoonStar}
            label={theme === "dark" ? "Light mode" : "Dark mode"}
            onClick={toggleTheme}
          />
          <QuickAction icon={Palette} label="Switch avatar" onClick={cycleAvatar} />
          <QuickAction icon={Download} label="Export CSV" onClick={() => exportCsv(transactions)} />
          <QuickAction icon={RotateCcw} label="Reset data" onClick={handleReset} tone="warn" />
          <QuickAction icon={LogOut} label="Sign out" onClick={onClose} tone="danger" />
        </div>
        <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50/60 px-3 py-2 text-xs text-brand-800 dark:border-brand-800/60 dark:bg-brand-900/20 dark:text-brand-200">
          {hasProfile
            ? "Advanced AI coach features are enabled for this profile."
            : "Create your profile to enable AI coach and personalized recommendations."}
        </div>
      </section>
    </div>
  );
}

export default ProfilePanel;
