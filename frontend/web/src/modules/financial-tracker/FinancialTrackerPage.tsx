import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import SectionCard from "../../components/ui/SectionCard";
import StatCard from "../../components/ui/StatCard";

const files = [
  { name: "bank_statement_jan.csv", status: "Parsed", rows: "214 rows" },
  { name: "credit_card_feb.csv", status: "Ready", rows: "98 rows" },
];

export default function FinancialTrackerPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Module"
        title="Financial Tracker 🪄"
        description="Upload CSV files, inspect transactions, categorize spending, and surface useful financial insights."
        actions={
          <>
            <Button variant="secondary">View Schema</Button>
            <Button>Upload CSV</Button>
          </>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Imported files"
          value="4"
          hint="Across statements and cards"
          icon="📂"
          tone="accent"
        />
        <StatCard
          label="Transactions parsed"
          value="612"
          hint="Ready for review"
          icon="🧾"
          tone="blue"
        />
        <StatCard
          label="Top category"
          value="Food"
          hint="Largest current spend bucket"
          icon="🍜"
          tone="teal"
        />
        <StatCard
          label="Detected duplicates"
          value="3"
          hint="Needs confirmation"
          icon="🕵️"
          tone="amber"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <SectionCard
          title="Imported files"
          subtitle="Recent uploads and processing status"
          action={<Badge tone="accent">Service-backed</Badge>}
        >
          <div className="space-y-4">
            {files.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between rounded-2xl border border-theme bg-surface p-4"
              >
                <div>
                  <p className="font-bold text-primary-theme">{file.name}</p>
                  <p className="mt-1 text-sm text-muted-theme">{file.rows}</p>
                </div>
                <p className="text-sm font-semibold text-secondary-theme">
                  {file.status}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Quick actions" subtitle="Common tracker flows">
          <div className="grid gap-3">
            <Button fullWidth>Upload new file</Button>
            <Button fullWidth variant="secondary">
              Review categories
            </Button>
            <Button fullWidth variant="ghost">
              Inspect duplicates
            </Button>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Transaction analysis"
        subtitle="Future analysis workspace"
      >
        <EmptyState
          icon="🪄"
          title="CSV analysis UI coming soon"
          description="This area can later hold a transaction table, category mapping, merchant cleanup, and spending insights."
          action={<Button>Start analysis</Button>}
        />
      </SectionCard>
    </div>
  );
}
