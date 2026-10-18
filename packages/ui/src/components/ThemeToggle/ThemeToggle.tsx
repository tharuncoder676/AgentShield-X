import React, { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "../../utils/cn";

export type Theme = "dark" | "light" | "system";

export interface ThemeToggleProps {
  className?: string;
  variant?: "icon-only" | "segmented";
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  variant = "segmented",
}) => {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("agentshield-theme") as Theme | null;
    if (stored) {
      setTheme(stored);
      applyTheme(stored);
    } else {
      setTheme("dark");
      applyTheme("dark");
    }
  }, []);

  const applyTheme = (target: Theme) => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (target === "system") {
      const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(isSystemDark ? "dark" : "light");
      root.setAttribute("data-theme", isSystemDark ? "dark" : "light");
    } else {
      root.classList.add(target);
      root.setAttribute("data-theme", target);
    }
  };

  const handleSelect = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("agentshield-theme", newTheme);
    applyTheme(newTheme);
  };

  if (!mounted) {
    return <div className="w-20 h-7 bg-line/20 rounded-sm animate-pulse" />;
  }

  if (variant === "icon-only") {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    return (
      <button
        onClick={() => handleSelect(nextTheme)}
        className={cn(
          "p-1.5 rounded-sm border border-line text-mut hover:text-fg hover:bg-line/20 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ok",
          className
        )}
        aria-label={`Switch to ${nextTheme} theme`}
        title={`Current theme: ${theme}. Click to switch.`}
      >
        {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Color Theme Selection"
      className={cn(
        "inline-flex items-center p-0.5 rounded-sm border border-line bg-panel text-xs font-chakra",
        className
      )}
    >
      <button
        type="button"
        onClick={() => handleSelect("dark")}
        aria-pressed={theme === "dark"}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-sm transition-colors",
          theme === "dark"
            ? "bg-bg text-fg font-semibold shadow-sm border border-line"
            : "text-mut hover:text-fg"
        )}
      >
        <Moon size={13} aria-hidden="true" />
        <span>Dark</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect("light")}
        aria-pressed={theme === "light"}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-sm transition-colors",
          theme === "light"
            ? "bg-bg text-fg font-semibold shadow-sm border border-line"
            : "text-mut hover:text-fg"
        )}
      >
        <Sun size={13} aria-hidden="true" />
        <span>Light</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect("system")}
        aria-pressed={theme === "system"}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-sm transition-colors",
          theme === "system"
            ? "bg-bg text-fg font-semibold shadow-sm border border-line"
            : "text-mut hover:text-fg"
        )}
        title="Follow system preference"
      >
        <Monitor size={13} aria-hidden="true" />
        <span className="hidden sm:inline">System</span>
      </button>
    </div>
  );
};
