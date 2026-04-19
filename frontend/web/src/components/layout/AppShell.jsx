import Navbar from "./Navbar";

function AppShell({ children }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#edf4ff] text-slate-900">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.18),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(167,139,250,0.14),_transparent_24%),linear-gradient(180deg,#edf4ff_0%,#f6f9ff_40%,#eef6ff_100%)]">
        <Navbar />
        <main className="w-full px-4 pb-10 md:px-6 xl:px-8">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;
