import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { X } from "lucide-react";
import IconButton from "./IconButton";

function Drawer({ open, onClose, title, subtitle, children, width = "max-w-md" }) {
  const panelRef = useRef(null);
  const contentRef = useRef(null);
  const previouslyFocused = useRef(null);
  const canUsePortal = typeof document !== "undefined";

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    function onKey(e) {
      if (e.key === "Escape") {
        onClose?.();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKey);

    const t = window.setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
      const focusable = panelRef.current?.querySelector(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    }, 50);

    return () => {
      document.removeEventListener("keydown", onKey);
      body.style.overflow = prevOverflow;
      window.clearTimeout(t);
      if (previouslyFocused.current && previouslyFocused.current.focus) {
        previouslyFocused.current.focus();
      }
    };
  }, [open, onClose]);

  const drawerNode = (
    <AnimatePresence>
      {open ? (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm dark:bg-black/60"
            onClick={onClose}
          />
          <Motion.aside
            ref={panelRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
            className={`absolute right-0 top-0 flex h-full w-full ${width} flex-col border-l border-white/60 bg-white/95 shadow-softLg backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/95`}
          >
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-ink-100 bg-white/95 px-6 py-4 backdrop-blur dark:border-ink-800 dark:bg-ink-900/95">
              <div className="min-w-0">
                {subtitle ? (
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                    {subtitle}
                  </p>
                ) : null}
                <h3 className="truncate text-xl font-black text-ink-900 dark:text-ink-50">
                  {title}
                </h3>
              </div>
              <IconButton onClick={onClose} aria-label="Close">
                <X size={16} />
              </IconButton>
            </header>
            <div
              ref={contentRef}
              className="drawer-scroll flex-1 overflow-y-auto p-5 md:p-6"
              style={{ scrollbarGutter: "stable", overscrollBehavior: "contain" }}
            >
              {children}
            </div>
          </Motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );

  if (!canUsePortal) return drawerNode;
  return createPortal(drawerNode, document.body);
}

export default Drawer;
