import { create } from "zustand";
import { THEME_STORAGE_KEY } from "@/utils/constants";

type Theme = "light" | "dark";

function initialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "dark";
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

interface UIState {
  theme: Theme;
  helpOpen: boolean;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  setHelpOpen: (open: boolean) => void;
}

/**
 * Small global UI store shared by the theme toggle and the keyboard-shortcut
 * handlers, so a theme change from anywhere (button or the "D" shortcut) stays
 * in sync, and the shortcuts modal can be opened from the header or "?".
 */
export const useUIStore = create<UIState>((set, get) => ({
  theme: initialTheme(),
  helpOpen: false,
  toggleTheme: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    applyTheme(next);
    set({ theme: next });
  },
  setTheme: (t) => {
    applyTheme(t);
    set({ theme: t });
  },
  setHelpOpen: (open) => set({ helpOpen: open }),
}));
