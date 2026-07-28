import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** Color theme. Light is the default. */
export type Theme = "light" | "dark";

/** UI language. `ja` is the default; detected from the browser on first visit. */
export type Locale = "ja" | "en";

interface UiState {
  theme: Theme;
  locale: Locale;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

/**
 * UI-only store (theme + locale). Persisted to localStorage so the choices
 * survive a reload. `skipHydration` keeps the server render and the first
 * client render on the defaults, then `AppShell` rehydrates after mount — this
 * avoids a React hydration mismatch.
 */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: "light",
      locale: "ja",
      toggleTheme: () => set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale }),
      toggleLocale: () => set((state) => ({ locale: state.locale === "ja" ? "en" : "ja" })),
    }),
    {
      name: "picto3-ui",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);
