import { AnimatePresence, motion as Motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileNav from "./MobileNav";
import MobileFab from "./MobileFab";

function AppShell({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="h-screen overflow-hidden bg-appField text-ink-900 dark:bg-ink-950 dark:text-ink-100 dark:bg-appFieldDark">
      <div className="flex h-full">
        <Sidebar />
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto px-4 pb-28 lg:pb-10 md:px-6 xl:px-8">
            <div className="mx-auto w-full max-w-[1600px]">
              <AnimatePresence mode="wait">
                <Motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  {children}
                </Motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
      <MobileNav />
      <MobileFab />
    </div>
  );
}

export default AppShell;
