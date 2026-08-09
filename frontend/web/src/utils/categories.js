export const EXPENSE_CATEGORIES = [
  "Housing",
  "Food",
  "Transportation",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Travel",
  "Health & Personal",
  "Family & Giving",
  "Other",
];

export const INCOME_CATEGORIES = [
  "Salary",
  "Investment Income",
  "Business Income",
  "Reimbursements",
  "Other Income",
];

export const TRANSFER_CATEGORIES = ["Internal Transfer"];

export const DEBT_PAYMENT_CATEGORIES = ["Credit Card Payment", "Loan Payment"];

export const REFUND_CATEGORIES = ["Refund"];

export const CATEGORIES = [
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
  ...TRANSFER_CATEGORIES,
  ...DEBT_PAYMENT_CATEGORIES,
  ...REFUND_CATEGORIES,
];

const COLOR_MAP = {
  Housing: "#8b5cf6",
  Food: "#f97316",
  Transportation: "#06b6d4",
  Shopping: "#3b82f6",
  "Bills & Utilities": "#14b8a6",
  Entertainment: "#ec4899",
  Travel: "#a855f7",
  "Health & Personal": "#ef4444",
  "Family & Giving": "#10b981",
  Other: "#94a3b8",
  Salary: "#10b981",
  "Investment Income": "#059669",
  "Business Income": "#34d399",
  Reimbursements: "#6ee7b7",
  "Other Income": "#a7f3d0",
  "Internal Transfer": "#6366f1",
  "Credit Card Payment": "#64748b",
  "Loan Payment": "#475569",
  Refund: "#22c55e",
};

const TINT_MAP = {
  Housing: "bg-gradient-to-br from-violet-500 to-purple-600",
  Food: "bg-gradient-to-br from-orange-400 to-rose-500",
  Transportation: "bg-gradient-to-br from-cyan-400 to-sky-500",
  Shopping: "bg-gradient-to-br from-blue-500 to-indigo-500",
  "Bills & Utilities": "bg-gradient-to-br from-teal-400 to-emerald-500",
  Entertainment: "bg-gradient-to-br from-pink-400 to-fuchsia-500",
  Travel: "bg-gradient-to-br from-purple-500 to-indigo-600",
  "Health & Personal": "bg-gradient-to-br from-rose-400 to-red-500",
  "Family & Giving": "bg-gradient-to-br from-emerald-400 to-teal-500",
  Other: "bg-gradient-to-br from-slate-400 to-slate-500",
  Salary: "bg-gradient-to-br from-emerald-500 to-teal-600",
  "Investment Income": "bg-gradient-to-br from-emerald-600 to-teal-700",
  "Business Income": "bg-gradient-to-br from-teal-400 to-emerald-500",
  Reimbursements: "bg-gradient-to-br from-emerald-300 to-teal-400",
  "Other Income": "bg-gradient-to-br from-emerald-400 to-teal-500",
  "Internal Transfer": "bg-gradient-to-br from-indigo-500 to-violet-600",
  "Credit Card Payment": "bg-gradient-to-br from-slate-500 to-slate-700",
  "Loan Payment": "bg-gradient-to-br from-slate-600 to-slate-800",
  Refund: "bg-gradient-to-br from-emerald-400 to-teal-500",
};

const EMOJI_MAP = {
  Housing: "🏠",
  Food: "🍎",
  Transportation: "🚗",
  Shopping: "🛍️",
  "Bills & Utilities": "💡",
  Entertainment: "🎬",
  Travel: "✈️",
  "Health & Personal": "🏥",
  "Family & Giving": "🎁",
  Other: "📦",
  Salary: "💼",
  "Investment Income": "📈",
  "Business Income": "🚀",
  Reimbursements: "💵",
  "Other Income": "💰",
  "Internal Transfer": "🔁",
  "Credit Card Payment": "💳",
  "Loan Payment": "🏦",
  Refund: "💸",
};

function pillStyle(light, dark) {
  return {
    bg: `${light.bg} ${dark.bg}`,
    text: `${light.text} ${dark.text}`,
    border: `${light.border} ${dark.border}`,
  };
}

const PILL_STYLE_MAP = {
  Housing: pillStyle(
    { bg: "bg-violet-100", text: "text-violet-900", border: "border-violet-200" },
    {
      bg: "dark:bg-violet-950/55",
      text: "dark:text-violet-300",
      border: "dark:border-violet-800/50",
    },
  ),
  Food: pillStyle(
    { bg: "bg-orange-100", text: "text-orange-900", border: "border-orange-200" },
    {
      bg: "dark:bg-orange-950/55",
      text: "dark:text-orange-300",
      border: "dark:border-orange-800/50",
    },
  ),
  Transportation: pillStyle(
    { bg: "bg-cyan-100", text: "text-cyan-900", border: "border-cyan-200" },
    { bg: "dark:bg-cyan-950/55", text: "dark:text-cyan-300", border: "dark:border-cyan-800/50" },
  ),
  Shopping: pillStyle(
    { bg: "bg-blue-100", text: "text-blue-900", border: "border-blue-200" },
    { bg: "dark:bg-blue-950/55", text: "dark:text-blue-300", border: "dark:border-blue-800/50" },
  ),
  "Bills & Utilities": pillStyle(
    { bg: "bg-teal-100", text: "text-teal-900", border: "border-teal-200" },
    { bg: "dark:bg-teal-950/55", text: "dark:text-teal-300", border: "dark:border-teal-800/50" },
  ),
  Entertainment: pillStyle(
    { bg: "bg-fuchsia-100", text: "text-fuchsia-900", border: "border-fuchsia-200" },
    {
      bg: "dark:bg-fuchsia-950/55",
      text: "dark:text-fuchsia-300",
      border: "dark:border-fuchsia-800/50",
    },
  ),
  Travel: pillStyle(
    { bg: "bg-purple-100", text: "text-purple-900", border: "border-purple-200" },
    {
      bg: "dark:bg-purple-950/55",
      text: "dark:text-purple-300",
      border: "dark:border-purple-800/50",
    },
  ),
  "Health & Personal": pillStyle(
    { bg: "bg-rose-100", text: "text-rose-900", border: "border-rose-200" },
    { bg: "dark:bg-rose-950/55", text: "dark:text-rose-300", border: "dark:border-rose-800/50" },
  ),
  "Family & Giving": pillStyle(
    { bg: "bg-emerald-100", text: "text-emerald-900", border: "border-emerald-200" },
    {
      bg: "dark:bg-emerald-950/55",
      text: "dark:text-emerald-300",
      border: "dark:border-emerald-800/50",
    },
  ),
  Other: pillStyle(
    { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
    { bg: "dark:bg-slate-800/60", text: "dark:text-slate-300", border: "dark:border-slate-600/45" },
  ),
  Salary: pillStyle(
    { bg: "bg-emerald-100", text: "text-emerald-900", border: "border-emerald-200" },
    {
      bg: "dark:bg-emerald-950/55",
      text: "dark:text-emerald-300",
      border: "dark:border-emerald-800/50",
    },
  ),
  "Investment Income": pillStyle(
    { bg: "bg-emerald-100", text: "text-emerald-900", border: "border-emerald-200" },
    {
      bg: "dark:bg-emerald-950/55",
      text: "dark:text-emerald-300",
      border: "dark:border-emerald-800/50",
    },
  ),
  "Business Income": pillStyle(
    { bg: "bg-teal-100", text: "text-teal-900", border: "border-teal-200" },
    { bg: "dark:bg-teal-950/55", text: "dark:text-teal-300", border: "dark:border-teal-800/50" },
  ),
  Reimbursements: pillStyle(
    { bg: "bg-emerald-100", text: "text-emerald-900", border: "border-emerald-200" },
    {
      bg: "dark:bg-emerald-950/55",
      text: "dark:text-emerald-300",
      border: "dark:border-emerald-800/50",
    },
  ),
  "Other Income": pillStyle(
    { bg: "bg-emerald-100", text: "text-emerald-900", border: "border-emerald-200" },
    {
      bg: "dark:bg-emerald-950/55",
      text: "dark:text-emerald-300",
      border: "dark:border-emerald-800/50",
    },
  ),
  "Internal Transfer": pillStyle(
    { bg: "bg-indigo-100", text: "text-indigo-900", border: "border-indigo-200" },
    {
      bg: "dark:bg-indigo-950/55",
      text: "dark:text-indigo-300",
      border: "dark:border-indigo-800/50",
    },
  ),
  "Credit Card Payment": pillStyle(
    { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-200" },
    { bg: "dark:bg-slate-800/70", text: "dark:text-slate-300", border: "dark:border-slate-600/50" },
  ),
  "Loan Payment": pillStyle(
    { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-200" },
    { bg: "dark:bg-slate-800/70", text: "dark:text-slate-300", border: "dark:border-slate-600/50" },
  ),
  Refund: pillStyle(
    { bg: "bg-emerald-100", text: "text-emerald-900", border: "border-emerald-200" },
    {
      bg: "dark:bg-emerald-950/55",
      text: "dark:text-emerald-300",
      border: "dark:border-emerald-800/50",
    },
  ),
};

const DISPLAY_LABEL_MAP = {
  Housing: "Housing",
  Food: "Food",
  Transportation: "Transport",
  Shopping: "Shopping",
  "Bills & Utilities": "Bills",
  Entertainment: "Fun",
  Travel: "Travel",
  "Health & Personal": "Health",
  "Family & Giving": "Family",
  Other: "Other",
  Salary: "Salary",
  "Investment Income": "Investments",
  "Business Income": "Business",
  Reimbursements: "Reimburse",
  "Other Income": "Income",
  "Internal Transfer": "Transfer",
  "Credit Card Payment": "Card Pmt",
  "Loan Payment": "Loan Pmt",
  Refund: "Refund",
};

export function categoryPillStyle(name) {
  if (name && PILL_STYLE_MAP[name]) return PILL_STYLE_MAP[name];
  const lower = String(name ?? "").toLowerCase();
  const match = Object.entries(PILL_STYLE_MAP).find(([key]) => lower.includes(key.toLowerCase()));
  return match?.[1] ?? PILL_STYLE_MAP.Other;
}

export function categoryDisplayLabel(name) {
  if (!name || name === "—") return "OTHER";
  const label = DISPLAY_LABEL_MAP[name] ?? name;
  return String(label).toUpperCase();
}

export function categoryEmoji(name) {
  if (!name || name === "—") return "📊";
  if (EMOJI_MAP[name]) return EMOJI_MAP[name];

  const lower = String(name).toLowerCase();
  const match = Object.entries(EMOJI_MAP).find(([key]) => lower.includes(key.toLowerCase()));
  return match?.[1] ?? EMOJI_MAP.Other;
}

export function categoryColor(name) {
  return COLOR_MAP[name] ?? COLOR_MAP.Other;
}

export function categoryTint(name) {
  return TINT_MAP[name] ?? TINT_MAP.Other;
}
