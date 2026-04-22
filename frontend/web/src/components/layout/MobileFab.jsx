import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { Plus, RotateCcw, Upload, UserCircle, X } from "lucide-react";
import { useTransactions } from "../../context/useTransactions";
import Drawer from "../ui/Drawer";
import ProfilePanel from "../profile/ProfilePanel";
import seed from "../../data/mockTransactions";

function MobileFab() {
  const { replaceAll, setFilters, ALL_MONTHS_SENTINEL } = useTransactions();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  function handleReset() {
    replaceAll(seed);
    setFilters((f) => ({ ...f, month: ALL_MONTHS_SENTINEL, categories: [], search: "" }));
    setOpen(false);
  }

  function openProfile() {
    setOpen(false);
    setProfileOpen(true);
  }

  return (
    <>
      <div className="lg:hidden fixed bottom-24 right-4 z-30">
        <AnimatePresence>
          {open ? (
            <Motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="mb-3 w-56 origin-bottom-right space-y-2 rounded-xl3 border border-white/70 bg-white/95 p-2 shadow-softLg backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/95 dark:shadow-softLgDark"
            >
              <button
                type="button"
                onClick={openProfile}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-ink-100 dark:hover:bg-ink-800"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                  <UserCircle size={16} />
                </span>
                <span className="text-sm font-bold text-ink-900 dark:text-ink-50">Profile</span>
              </button>
              <Link
                to="/upload"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-ink-100 dark:hover:bg-ink-800"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                  <Upload size={16} />
                </span>
                <span className="text-sm font-bold text-ink-900 dark:text-ink-50">Import CSV</span>
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-ink-100 dark:hover:bg-ink-800"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                  <RotateCcw size={16} />
                </span>
                <span className="text-sm font-bold text-ink-900 dark:text-ink-50">Reset demo</span>
              </button>
            </Motion.div>
          ) : null}
        </AnimatePresence>

        <Motion.button
          type="button"
          onClick={() => setOpen((v) => !v)}
          whileTap={{ scale: 0.92 }}
          aria-label={open ? "Close quick actions" : "Open quick actions"}
          className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-brand text-white shadow-brand"
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <Motion.span
                key="x"
                initial={{ opacity: 0, rotate: -45 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 45 }}
                transition={{ duration: 0.18 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <X size={22} />
              </Motion.span>
            ) : (
              <Motion.span
                key="plus"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Plus size={24} />
              </Motion.span>
            )}
          </AnimatePresence>
        </Motion.button>
      </div>

      <Drawer
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        title="Your profile"
        subtitle="FinanceOS"
        width="max-w-md"
      >
        <ProfilePanel onClose={() => setProfileOpen(false)} />
      </Drawer>
    </>
  );
}

export default MobileFab;
