// lib/stores/themeStore.ts
import { create } from "zustand";

export type Theme = "light" | "dark";

interface ThemeState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const getInitialTheme = (): Theme => {
    if (typeof window !== "undefined") {
        const stored = localStorage.getItem("theme") as Theme | null;
        if (stored) return stored;
        // fallback to prefers-color-scheme
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        return prefersDark ? "dark" : "light";
    }
    return "light";
};

export const useThemeStore = create<ThemeState>((set) => ({
    theme: getInitialTheme(),
    setTheme: (theme) => {
        if (typeof window !== "undefined") {
            localStorage.setItem("theme", theme);
        }
        set({ theme });
    },
    toggleTheme: () => {
        set((state) => {
            const newTheme: Theme = state.theme === "light" ? "dark" : "light";
            if (typeof window !== "undefined") {
                localStorage.setItem("theme", newTheme);
            }
            return { theme: newTheme };
        });
    },
}));
