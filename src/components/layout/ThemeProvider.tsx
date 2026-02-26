"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type ThemeMode = "light" | "dark";
type AccentTheme = "green" | "purple" | "orange";

type ThemeContextValue = {
  mode: ThemeMode;
  accent: AccentTheme;
  toggleMode: () => void;
  setAccent: (accent: AccentTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const MODE_STORAGE_KEY = "sylvy-theme-mode";
const ACCENT_STORAGE_KEY = "sylvy-theme-accent";

function getInitialMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(MODE_STORAGE_KEY) as
      | ThemeMode
      | null;
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // ignore
  }
  if (typeof window !== "undefined" && "matchMedia" in window) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
}

function getInitialAccent(): AccentTheme {
  if (typeof window === "undefined") return "green";
  try {
    const stored = window.localStorage.getItem(ACCENT_STORAGE_KEY) as
      | AccentTheme
      | null;
    if (stored === "green" || stored === "purple" || stored === "orange") {
      return stored;
    }
  } catch {
    // ignore
  }
  return "green";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);
  const [accent, setAccentState] = useState<AccentTheme>(getInitialAccent);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  }, [mode]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.setAttribute("data-theme", accent);
    try {
      window.localStorage.setItem(ACCENT_STORAGE_KEY, accent);
    } catch {
      // ignore
    }
  }, [accent]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const setAccent = useCallback((next: AccentTheme) => {
    setAccentState(next);
  }, []);

  const value: ThemeContextValue = {
    mode,
    accent,
    toggleMode,
    setAccent,
  };

  return (
    <ThemeContext.Provider value={value}>
      <ThemeFloatingToggle />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

function ThemeFloatingToggle() {
  const { mode, toggleMode } = useTheme();

  const label =
    mode === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      aria-label={label}
      onClick={toggleMode}
      className="fixed right-4 top-4 z-[9999] inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/80 text-neutral-800 shadow-sm backdrop-blur-md transition hover:shadow-md dark:border-white/20 dark:bg-neutral-900/80 dark:text-neutral-100 sm:right-6 sm:top-5"
    >
      <span className="relative inline-flex h-4 w-4 overflow-hidden rounded-full border border-current">
        <span className="h-full w-1/2 bg-current" />
        <span className="h-full w-1/2 bg-transparent" />
      </span>
    </button>
  );
}

