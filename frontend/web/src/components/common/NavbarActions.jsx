import { useEffect, useRef, useState } from "react";
import { motion as Motion } from "framer-motion";
import { Bell, ChevronDown, Settings } from "lucide-react";
import { useTransactions } from "../../context/useTransactions";
import { useProfile } from "../../hooks/useProfile";
import {
  detectRecurring,
  topAnomalies,
  topCategoryMovers,
} from "../../utils/insights";
import Avatar from "./Avatar";
import Drawer from "../ui/Drawer";
import NotificationsPopover from "./NotificationsPopover";
import SettingsPopover from "./SettingsPopover";
import ProfilePanel from "../profile/ProfilePanel";

function notificationCount(transactions) {
  let n = 0;
  if (topCategoryMovers(transactions).length) n += 1;
  if (topAnomalies(transactions, 1).length) n += 1;
  if (detectRecurring(transactions).length) n += 1;
  return n;
}

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
  const { profile, hasProfile, displayName } = useProfile();
  const [openMenu, setOpenMenu] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const rootRef = useRef(null);

  const count = notificationCount(transactions);

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
    setProfileOpen(false);
    setOpenMenu((cur) => (cur === name ? null : name));
  }

  function openProfile() {
    setOpenMenu(null);
    setProfileOpen(true);
  }

  return (
    <>
      <div ref={rootRef} className="flex items-center gap-3">
        <PopoverHost>
          <ActionButton
            active={openMenu === "notifications"}
            onClick={() => toggle("notifications")}
            ariaLabel="Notifications"
            badge={count > 0 ? count : null}
          >
            <Bell size={18} />
          </ActionButton>
          <NotificationsPopover
            open={openMenu === "notifications"}
            onClose={() => setOpenMenu(null)}
          />
        </PopoverHost>

        <PopoverHost>
          <ActionButton
            active={openMenu === "settings"}
            onClick={() => toggle("settings")}
            ariaLabel="Settings"
          >
            <Settings size={18} />
          </ActionButton>
          <SettingsPopover
            open={openMenu === "settings"}
            onClose={() => setOpenMenu(null)}
          />
        </PopoverHost>

        <Motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={openProfile}
          aria-label="Open profile"
          className="group flex items-center gap-3 rounded-full border border-ink-200 bg-white px-2 py-1.5 pr-3 transition hover:bg-ink-50 hover:shadow-soft dark:border-ink-700 dark:bg-ink-800 dark:hover:bg-ink-700"
        >
          <div className="relative h-9 w-9">
            <Avatar
              seed={hasProfile ? displayName : "Guest user"}
              variant={profile.avatarVariant}
              size={36}
              className="h-9 w-9"
            />
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-ink-800" />
          </div>
          <div className="hidden md:block leading-tight">
            <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">
              {hasProfile ? displayName : "Create your profile"}
            </p>
            <p className="text-xs text-ink-500 dark:text-ink-400">
              {hasProfile ? "View profile" : "Unlock AI insights"}
            </p>
          </div>
          <ChevronDown
            size={16}
            className="text-ink-400 transition group-hover:text-ink-700 dark:group-hover:text-ink-200"
          />
        </Motion.button>
      </div>

      <Drawer
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        title="Your profile"
        subtitle="FinanceOS"
        width="max-w-lg"
      >
        <ProfilePanel onClose={() => setProfileOpen(false)} />
      </Drawer>
    </>
  );
}

export default NavbarActions;
