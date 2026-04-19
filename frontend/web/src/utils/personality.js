import { categoryBreakdown, detectRecurring, weekdayVsWeekend } from "./insights";

const ARCHETYPES = {
  foodie: {
    label: "The Foodie",
    emoji: "🍜",
    blurb: "Dining and groceries dominate your spend.",
  },
  shopper: {
    label: "The Shopper",
    emoji: "🛍",
    blurb: "Retail therapy is your love language.",
  },
  traveler: {
    label: "The Wanderer",
    emoji: "✈️",
    blurb: "Travel and transport eat the biggest slice.",
  },
  subscriber: {
    label: "The Subscriber",
    emoji: "🔁",
    blurb: "Recurring charges quietly run your life.",
  },
  weekender: {
    label: "The Weekender",
    emoji: "🌴",
    blurb: "Weekends carry the bulk of your spend.",
  },
  balanced: {
    label: "Balanced Spender",
    emoji: "🧘",
    blurb: "No category dominates — your spend is well distributed.",
  },
};

export function classifyPersonality(transactions) {
  if (!transactions || transactions.length === 0) {
    return { ...ARCHETYPES.balanced, key: "balanced" };
  }

  const cats = categoryBreakdown(transactions);
  const total = cats.reduce((s, c) => s + c.total, 0);
  const top = cats[0];
  const topShare = top && total > 0 ? top.total / total : 0;

  const recurring = detectRecurring(transactions);
  const recurringTotal = recurring.reduce((s, r) => s + r.avg, 0);
  const recurringShare = total > 0 ? (recurringTotal * 12) / total : 0;

  const we = weekdayVsWeekend(transactions);

  if (recurringShare > 0.25) return { ...ARCHETYPES.subscriber, key: "subscriber" };
  if (top && topShare > 0.32) {
    if (["Food", "Groceries"].includes(top.category)) {
      return { ...ARCHETYPES.foodie, key: "foodie" };
    }
    if (["Shopping"].includes(top.category)) {
      return { ...ARCHETYPES.shopper, key: "shopper" };
    }
    if (["Travel", "Transport", "Gas"].includes(top.category)) {
      return { ...ARCHETYPES.traveler, key: "traveler" };
    }
  }
  if (we.weekendPct > 45) return { ...ARCHETYPES.weekender, key: "weekender" };

  return { ...ARCHETYPES.balanced, key: "balanced" };
}

export const AVATAR_VARIANTS = ["blue", "violet", "emerald", "amber"];
