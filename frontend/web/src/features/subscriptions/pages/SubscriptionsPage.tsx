import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import EmptyState from "../../../shared/ui/EmptyState";
import PageHeader from "../../../shared/ui/PageHeader";
import SectionCard from "../../../shared/ui/SectionCard";
import StatCard from "../../../shared/ui/StatCard";

const subscriptions = [
  {
    name: "Netflix",
    cost: "$15.49 / month",
    renewal: "Renews in 4 days",
    status: "Active",
  },
  {
    name: "Spotify",
    cost: "$10.99 / month",
    renewal: "Renews in 11 days",
    status: "Active",
  },
  {
    name: "ChatGPT Plus",
    cost: "$20.00 / month",
    renewal: "Renews in 18 days",
    status: "Active",
  },
];

export default function SubscriptionsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Module"
        title="Subscriptions 🎬"
        description="Track recurring payments, upcoming renewals, and monthly subscription spend in one calm place."
        actions={
          <>
            <Button variant="secondary">Import List</Button>
            <Button>Add Subscription</Button>
          </>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active subscriptions"
          value="6"
          hint="Across all services"
          icon="📦"
          tone="accent"
        />
        <StatCard
          label="Monthly recurring"
          value="$89"
          hint="Current monthly spend"
          icon="💳"
          tone="blue"
        />
        <StatCard
          label="Yearly projection"
          value="$1,068"
          hint="If nothing changes"
          icon="📈"
          tone="teal"
        />
        <StatCard
          label="Next renewal"
          value="4d"
          hint="Netflix renews soon"
          icon="⏰"
          tone="amber"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <SectionCard
          title="Active subscriptions"
          subtitle="Your recurring services"
          action={<Badge tone="accent">Tracked</Badge>}
        >
          <div className="space-y-4">
            {subscriptions.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-2xl border border-theme bg-surface p-4"
              >
                <div>
                  <p className="font-bold text-primary-theme">{item.name}</p>
                  <p className="mt-1 text-sm text-muted-theme">
                    {item.renewal}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary-theme">
                    {item.cost}
                  </p>
                  <p className="mt-1 text-sm text-secondary-theme">
                    {item.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Insights" subtitle="Small wins you can act on">
          <div className="space-y-4">
            <div className="rounded-2xl border border-theme bg-surface p-4">
              <p className="font-bold text-primary-theme">2 renewals soon</p>
              <p className="mt-1 text-sm text-secondary-theme">
                Review upcoming recurring charges before they hit.
              </p>
            </div>

            <div className="rounded-2xl border border-theme bg-surface p-4">
              <p className="font-bold text-primary-theme">Potential cleanup</p>
              <p className="mt-1 text-sm text-secondary-theme">
                Some subscriptions may be rarely used.
              </p>
            </div>

            <Button fullWidth>Review renewals</Button>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Recommendations"
        subtitle="Future area for smarter alerts"
      >
        <EmptyState
          icon="🎬"
          title="Subscription intelligence coming soon"
          description="This area can later show renewal reminders, unused subscription alerts, and annual spending breakdowns."
          action={<Button variant="secondary">See roadmap</Button>}
        />
      </SectionCard>
    </div>
  );
}
