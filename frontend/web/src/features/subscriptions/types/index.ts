export type Subscription = {
  id: string;
  name: string;
  monthlyCost: number;
  renewalDate: string;
  status: "active" | "paused" | "cancelled";
  category?: string;
};
