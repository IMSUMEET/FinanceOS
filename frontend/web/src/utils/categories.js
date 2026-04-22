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

export function categoryColor(name) {
  return COLOR_MAP[name] ?? COLOR_MAP.Other;
}

export function categoryTint(name) {
  return TINT_MAP[name] ?? TINT_MAP.Other;
}
