"use client";

import { useEffect } from "react";
import { useUiStore } from "../store/uiStore";

/**
 * Client wrapper for the whole app. Owns the `[data-app="picto3"]` scope and the
 * `data-theme` attribute that drives the token overrides. The persisted store is
 * rehydrated after mount (see `skipHydration` in uiStore) so the first client
 * render matches the server render on the defaults.
 */
export function AppShell({
  children,
  fontClassName,
}: {
  children: React.ReactNode;
  fontClassName: string;
}) {
  const theme = useUiStore((state) => state.theme);
  const locale = useUiStore((state) => state.locale);

  useEffect(() => {
    // Detect the browser language on the first visit (no locale stored yet),
    // then rehydrate any explicitly chosen locale/theme over it.
    let storedLocale: unknown;
    try {
      const raw = localStorage.getItem("picto3-ui");
      storedLocale = raw ? JSON.parse(raw)?.state?.locale : undefined;
    } catch {
      storedLocale = undefined;
    }
    void useUiStore.persist.rehydrate()?.then(() => {
      if (!storedLocale) {
        useUiStore
          .getState()
          .setLocale(navigator.language.toLowerCase().startsWith("ja") ? "ja" : "en");
      }
    });
  }, []);

  // Keep <html lang> in sync with the chosen locale.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <div data-app="picto3" data-theme={theme} className={fontClassName}>
      {children}
    </div>
  );
}
