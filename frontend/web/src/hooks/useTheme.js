import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "financeos.theme";
const subscribers = new Set();

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "dark" ? "#080f1e" : "#edf4ff");
  }
}

function detectInitial() {
  if (typeof window === "undefined") return "light";
  const stored = readStored();
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setThemeState] = useState(detectInitial);

  useEffect(() => {
    applyTheme(theme);
    const cb = (t) => setThemeState(t);
    subscribers.add(cb);
    return () => {
      subscribers.delete(cb);
    };
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function onSysChange(e) {
      if (readStored()) return;
      const next = e.matches ? "dark" : "light";
      applyTheme(next);
      setThemeState(next);
      subscribers.forEach((cb) => cb(next));
    }
    mq.addEventListener?.("change", onSysChange);
    return () => mq.removeEventListener?.("change", onSysChange);
  }, []);

  const setTheme = useCallback((next) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    applyTheme(next);
    setThemeState(next);
    subscribers.forEach((cb) => cb(next));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
