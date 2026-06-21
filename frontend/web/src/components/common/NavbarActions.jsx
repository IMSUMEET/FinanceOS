import { useEffect, useRef, useState } from "react";
import { motion as Motion } from "framer-motion";
import { Bell } from "lucide-react";
import { useTransactions } from "../../context/useTransactions";
import { unreadAlertCount } from "../../utils/alerts";
import AlertsPopover from "./AlertsPopover";

function PopoverHost({ children }) {
  return <div className="relative">{children}</div>;
}

function ActionButton({ active, children, onClick, ariaLabel, badge }) {
  return (
    <Motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      aria-label={ariaLabel}
      aria-expanded={active}
      className={[
        "group relative flex h-11 w-11 items-center justify-center rounded-full border transition",
        active
          ? "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
          : "border-ink-200 bg-white text-ink-600 hover:bg-ink-100 hover:text-brand-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-ink-700 dark:hover:text-brand-300",
      ].join(" ")}
    >
      {children}
      {badge ? (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-soft ring-2 ring-white dark:ring-ink-900">
          {badge}
        </span>
      ) : null}
    </Motion.button>
  );
}

function NavbarActions() {
  const { transactions } = useTransactions();
  const [openMenu, setOpenMenu] = useState(null);
  const [unreadCount, setUnreadCount] = useState(() => unreadAlertCount(transactions));
  const rootRef = useRef(null);

  useEffect(() => {
    setUnreadCount(unreadAlertCount(transactions));
  }, [transactions]);

  useEffect(() => {
    function onClick(e) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") setOpenMenu(null);
    }
    if (openMenu) {
      document.addEventListener("mousedown", onClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  function toggle(name) {
    setOpenMenu((cur) => (cur === name ? null : name));
  }

  return (
    <div ref={rootRef} className="flex items-center gap-3">
      <PopoverHost>
        <ActionButton
          active={openMenu === "alerts"}
          onClick={() => toggle("alerts")}
          ariaLabel="Alerts"
          badge={unreadCount > 0 ? unreadCount : null}
        >
          <Bell size={18} />
        </ActionButton>
        <AlertsPopover
          open={openMenu === "alerts"}
          onClose={() => setOpenMenu(null)}
          onSeenChange={() => setUnreadCount(unreadAlertCount(transactions))}
        />
      </PopoverHost>
    </div>
  );
}

export default NavbarActions;
