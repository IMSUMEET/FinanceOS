export const CATEGORIES = [
  "Food",
  "Groceries",
  "Gas",
  "Transport",
  "Shopping",
  "Entertainment",
  "Travel",
  "Utilities",
  "Subscriptions",
  "Other",
];

const COLOR_MAP = {
  "Equity built": "#10b981",
  "Interest cost": "#f59e0b",
  "Still owed": "#64748b",
  Food: "#f97316",
  Groceries: "#22c55e",
  Gas: "#eab308",
  Transport: "#06b6d4",
  Shopping: "#3b82f6",
  Entertainment: "#ec4899",
  Travel: "#8b5cf6",
  Utilities: "#14b8a6",
  Subscriptions: "#6366f1",
  Other: "#94a3b8",
};

const TINT_MAP = {
  Food: "bg-gradient-to-br from-orange-400 to-rose-500",
  Groceries: "bg-gradient-to-br from-emerald-400 to-teal-500",
  Gas: "bg-gradient-to-br from-amber-400 to-yellow-500",
  Transport: "bg-gradient-to-br from-cyan-400 to-sky-500",
  Shopping: "bg-gradient-to-br from-blue-500 to-indigo-500",
  Entertainment: "bg-gradient-to-br from-pink-400 to-fuchsia-500",
  Travel: "bg-gradient-to-br from-violet-500 to-purple-500",
  Utilities: "bg-gradient-to-br from-teal-400 to-emerald-500",
  Subscriptions: "bg-gradient-to-br from-indigo-500 to-violet-500",
  Other: "bg-gradient-to-br from-slate-400 to-slate-500",
};

const EMOJI_MAP = {
  Food: "🍔",
  "Food & Dining": "🍽️",
  Groceries: "🛒",
  Gas: "⛽",
  Transport: "🚗",
  Shopping: "🛍️",
  Entertainment: "🎬",
  Travel: "✈️",
  Utilities: "💡",
  Subscriptions: "📱",
  "Credit Card Payments": "💳",
  Payments: "💸",
  Health: "🏥",
  Medical: "💊",
  Education: "📚",
  Income: "💰",
  Transfer: "🔁",
  Other: "📦",
};

function pillStyle(light, dark) {
  return {
    bg: `${light.bg} ${dark.bg}`,
    text: `${light.text} ${dark.text}`,
    border: `${light.border} ${dark.border}`,
  };
}

const PILL_STYLE_MAP = {
  Food: pillStyle(
    { bg: "bg-orange-100", text: "text-orange-900", border: "border-orange-200" },
    {
      bg: "dark:bg-orange-950/55",
      text: "dark:text-orange-300",
      border: "dark:border-orange-800/50",
    },
  ),
  "Food & Dining": pillStyle(
    { bg: "bg-orange-100", text: "text-orange-900", border: "border-orange-200" },
    {
      bg: "dark:bg-orange-950/55",
      text: "dark:text-orange-300",
      border: "dark:border-orange-800/50",
    },
  ),
  Groceries: pillStyle(
    { bg: "bg-emerald-100", text: "text-emerald-900", border: "border-emerald-200" },
    {
      bg: "dark:bg-emerald-950/55",
      text: "dark:text-emerald-300",
      border: "dark:border-emerald-800/50",
    },
  ),
  Gas: pillStyle(
    { bg: "bg-amber-100", text: "text-amber-900", border: "border-amber-200" },
    { bg: "dark:bg-amber-950/55", text: "dark:text-amber-300", border: "dark:border-amber-800/50" },
  ),
  Transport: pillStyle(
    { bg: "bg-sky-100", text: "text-sky-900", border: "border-sky-200" },
    { bg: "dark:bg-sky-950/55", text: "dark:text-sky-300", border: "dark:border-sky-800/50" },
  ),
  Shopping: pillStyle(
    { bg: "bg-violet-100", text: "text-violet-900", border: "border-violet-200" },
    {
      bg: "dark:bg-violet-950/55",
      text: "dark:text-violet-300",
      border: "dark:border-violet-800/50",
    },
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
  Utilities: pillStyle(
    { bg: "bg-teal-100", text: "text-teal-900", border: "border-teal-200" },
    { bg: "dark:bg-teal-950/55", text: "dark:text-teal-300", border: "dark:border-teal-800/50" },
  ),
  Subscriptions: pillStyle(
    { bg: "bg-indigo-100", text: "text-indigo-900", border: "border-indigo-200" },
    {
      bg: "dark:bg-indigo-950/55",
      text: "dark:text-indigo-300",
      border: "dark:border-indigo-800/50",
    },
  ),
  "Credit Card Payments": pillStyle(
    { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-200" },
    { bg: "dark:bg-slate-800/70", text: "dark:text-slate-300", border: "dark:border-slate-600/50" },
  ),
  Payments: pillStyle(
    { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-200" },
    { bg: "dark:bg-slate-800/70", text: "dark:text-slate-300", border: "dark:border-slate-600/50" },
  ),
  Health: pillStyle(
    { bg: "bg-rose-100", text: "text-rose-900", border: "border-rose-200" },
    { bg: "dark:bg-rose-950/55", text: "dark:text-rose-300", border: "dark:border-rose-800/50" },
  ),
  Medical: pillStyle(
    { bg: "bg-rose-100", text: "text-rose-900", border: "border-rose-200" },
    { bg: "dark:bg-rose-950/55", text: "dark:text-rose-300", border: "dark:border-rose-800/50" },
  ),
  Education: pillStyle(
    { bg: "bg-blue-100", text: "text-blue-900", border: "border-blue-200" },
    { bg: "dark:bg-blue-950/55", text: "dark:text-blue-300", border: "dark:border-blue-800/50" },
  ),
  Income: pillStyle(
    { bg: "bg-emerald-100", text: "text-emerald-900", border: "border-emerald-200" },
    {
      bg: "dark:bg-emerald-950/55",
      text: "dark:text-emerald-300",
      border: "dark:border-emerald-800/50",
    },
  ),
  Transfer: pillStyle(
    { bg: "bg-indigo-100", text: "text-indigo-900", border: "border-indigo-200" },
    {
      bg: "dark:bg-indigo-950/55",
      text: "dark:text-indigo-300",
      border: "dark:border-indigo-800/50",
    },
  ),
  Other: pillStyle(
    { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
    { bg: "dark:bg-slate-800/60", text: "dark:text-slate-300", border: "dark:border-slate-600/45" },
  ),
};

const DISPLAY_LABEL_MAP = {
  "Credit Card Payments": "Card pmt",
  "Food & Dining": "Dining",
  Payments: "Payment",
  Entertainment: "Fun",
  Transport: "Transit",
  Subscriptions: "Subs",
  Utilities: "Utilities",
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
