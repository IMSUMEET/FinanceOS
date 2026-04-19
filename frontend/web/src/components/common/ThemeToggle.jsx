import { AnimatePresence, motion as Motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Motion.button
      type="button"
      onClick={toggleTheme}
      whileTap={{ scale: 0.92 }}
      whileHover={{ y: -1 }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-ink-200 bg-white text-ink-700 transition hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100 dark:hover:bg-ink-700 ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <Motion.span
            key="moon"
            initial={{ opacity: 0, rotate: -45, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 45, scale: 0.6 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Moon size={18} />
          </Motion.span>
        ) : (
          <Motion.span
            key="sun"
            initial={{ opacity: 0, rotate: 45, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -45, scale: 0.6 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Sun size={18} />
          </Motion.span>
        )}
      </AnimatePresence>
    </Motion.button>
  );
}

export default ThemeToggle;
