import type { Subscription } from "../../types/subscriptions";

export const mockSubscriptions: Subscription[] = [
  {
    id: "sub1",
    name: "Netflix",
    monthlyCost: 15.49,
    renewalDate: "2026-03-12",
    status: "active",
    category: "Entertainment",
  },
  {
    id: "sub2",
    name: "Spotify",
    monthlyCost: 10.99,
    renewalDate: "2026-03-20",
    status: "active",
    category: "Music",
  },
];
