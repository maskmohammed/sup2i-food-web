"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "sup2i-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-muted transition-colors hover:text-text"
      aria-label="Changer de thème"
    >
      <span suppressHydrationWarning>
        {theme === "dark" ? "☀️ Clair" : "🌙 Sombre"}
      </span>
    </button>
  );
}
