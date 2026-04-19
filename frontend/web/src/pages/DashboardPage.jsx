import AppShell from "../components/layout/AppShell";

function DashboardPage() {
  return (
    <AppShell>
      <section className="px-4 md:px-8 py-10">
        <div className="mx-auto max-w-7xl rounded-[40px] border border-white/60 bg-white/40 shadow-[0_10px_40px_rgba(15,23,42,0.08)] p-10 backdrop-blur-sm">
          <h1 className="text-4xl font-black text-slate-900">Dashboard</h1>
          <p className="mt-3 text-slate-500">Your charts and finance analytics will live here.</p>
        </div>
      </section>
    </AppShell>
  );
}

export default DashboardPage;
