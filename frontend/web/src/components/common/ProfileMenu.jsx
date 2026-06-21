import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { AtSign, ChevronDown, Mail, User } from "lucide-react";
import Avatar from "./Avatar";
import Button from "../ui/Button";
import { useProfile } from "../../hooks/useProfile";

function profileEmail(profile, hasProfile) {
  if (!hasProfile) return null;
  const local = `${String(profile.name).toLowerCase()}.${String(profile.handle).toLowerCase()}@financeos.app`;
  return local;
}

function ProfileMenu() {
  const { profile, updateProfile, hasProfile, displayName } = useProfile();
  const [open, setOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [handleInput, setHandleInput] = useState("");
  const rootRef = useRef(null);

  function openMenu() {
    setNameInput(profile.name ?? "");
    setHandleInput(profile.handle ?? "");
    setOpen(true);
  }

  function toggleMenu() {
    if (open) {
      setOpen(false);
    } else {
      openMenu();
    }
  }

  useEffect(() => {
    function onClick(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function saveProfile(e) {
    e.preventDefault();
    const name = nameInput.trim();
    const handle = handleInput.trim();
    if (!name || !handle) return;
    updateProfile({ name, handle, profileCompleted: true });
  }

  const email = profileEmail(profile, hasProfile);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggleMenu}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open profile menu"
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-ink-100/80 dark:hover:bg-ink-800/80"
      >
        <Avatar variant={profile.avatarVariant} size={40} alt={displayName} />
        <ChevronDown
          size={16}
          className={`hidden text-ink-500 transition sm:block dark:text-ink-400 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <Motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full z-50 mt-2 w-[300px] origin-top-right rounded-xl3 border border-ink-200/80 bg-white/95 p-4 shadow-softLg backdrop-blur-xl dark:border-ink-700 dark:bg-ink-900/95"
            role="menu"
          >
            <div className="flex items-center gap-3">
              <Avatar variant={profile.avatarVariant} size={52} alt={displayName} />
              <div className="min-w-0">
                <p className="truncate text-base font-black text-ink-900 dark:text-ink-50">
                  {hasProfile ? displayName : "Guest user"}
                </p>
                {email ? (
                  <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-ink-500 dark:text-ink-400">
                    <Mail size={13} className="shrink-0" />
                    {email}
                  </p>
                ) : (
                  <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">
                    Profile not set up yet
                  </p>
                )}
              </div>
            </div>

            {hasProfile ? (
              <div className="mt-4 space-y-2 rounded-xl2 border border-ink-100 bg-ink-50/60 px-3 py-3 dark:border-ink-800 dark:bg-ink-800/40">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-500 dark:text-ink-400">First name</span>
                  <span className="font-semibold text-ink-900 dark:text-ink-100">
                    {profile.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-500 dark:text-ink-400">Last name</span>
                  <span className="font-semibold text-ink-900 dark:text-ink-100">
                    {profile.handle}
                  </span>
                </div>
                {email ? (
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-ink-500 dark:text-ink-400">Email</span>
                    <span className="truncate font-semibold text-ink-900 dark:text-ink-100">
                      {email}
                    </span>
                  </div>
                ) : null}
              </div>
            ) : (
              <form onSubmit={saveProfile} className="mt-4 space-y-2">
                <label className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 dark:border-ink-700 dark:bg-ink-800">
                  <User size={14} className="text-ink-400" />
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="First name"
                    className="h-10 w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none dark:text-ink-100"
                  />
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 dark:border-ink-700 dark:bg-ink-800">
                  <AtSign size={14} className="text-ink-400" />
                  <input
                    value={handleInput}
                    onChange={(e) => setHandleInput(e.target.value)}
                    placeholder="Last name"
                    className="h-10 w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none dark:text-ink-100"
                  />
                </label>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!nameInput.trim() || !handleInput.trim()}
                >
                  Save profile
                </Button>
              </form>
            )}

            <p className="mt-3 text-center text-[11px] text-ink-400 dark:text-ink-500">
              Stored on this device only
            </p>
          </Motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default ProfileMenu;
