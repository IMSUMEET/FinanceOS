import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import EmptyState from "../../../shared/ui/EmptyState";
import PageHeader from "../../../shared/ui/PageHeader";
import SectionCard from "../../../shared/ui/SectionCard";
import StatCard from "../../../shared/ui/StatCard";

const payments = [
  {
    month: "Jan 2026",
    amount: "$2,000",
    split: "$1,260 principal · $740 interest",
  },
  {
    month: "Feb 2026",
    amount: "$2,000",
    split: "$1,284 principal · $716 interest",
  },
  {
    month: "Mar 2026",
    amount: "$2,000",
    split: "$1,309 principal · $691 interest",
  },
];

export default function LoansPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Module"
        title="Loans 🎯"
        description="Track principal, interest, payoff progress, and payment momentum without turning it into a scary spreadsheet."
        actions={
          <>
            <Button variant="secondary">Compare Options</Button>
            <Button>Add Payment</Button>
          </>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Remaining balance"
          value="$62,400"
          hint="Current estimated balance"
          icon="🏦"
          tone="accent"
        />
        <StatCard
          label="Monthly payment"
          value="$2,000"
          hint="Current payment plan"
          icon="💵"
          tone="blue"
        />
        <StatCard
          label="Interest this month"
          value="$691"
          hint="Trending down"
          icon="📉"
          tone="teal"
        />
        <StatCard
          label="Paid off"
          value="31%"
          hint="Good progress so far"
          icon="🏆"
          tone="amber"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <SectionCard
          title="Payment history"
          subtitle="Recent loan payments"
          action={<Badge tone="accent">On track</Badge>}
        >
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.month}
                className="flex items-center justify-between rounded-2xl border border-theme bg-surface p-4"
              >
                <div>
                  <p className="font-bold text-primary-theme">
                    {payment.month}
                  </p>
                  <p className="mt-1 text-sm text-muted-theme">
                    {payment.split}
                  </p>
                </div>
                <p className="font-semibold text-primary-theme">
                  {payment.amount}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Loan snapshot" subtitle="Quick summary">
          <div className="space-y-4">
            <div className="rounded-2xl border border-theme bg-surface p-4">
              <p className="text-sm text-muted-theme">Payoff target</p>
              <p className="mt-2 text-2xl font-black text-primary-theme">
                May 2028
              </p>
            </div>

            <div className="rounded-2xl border border-theme bg-surface p-4">
              <p className="text-sm text-muted-theme">Extra payment impact</p>
              <p className="mt-2 text-sm text-secondary-theme">
                Adding extra each month can reduce total interest significantly.
              </p>
            </div>

            <Button fullWidth>Simulate payoff</Button>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Projection area"
        subtitle="Future amortization and payoff visuals"
      >
        <EmptyState
          icon="🎯"
          title="Projection charts coming soon"
          description="This section can later show amortization, payoff forecast, refinance comparison, and extra payment simulations."
          action={<Button variant="secondary">Open planner</Button>}
        />
      </SectionCard>
    </div>
  );
}
