"use client";

import { useCallback } from "react";
import { useUiStore } from "../store/uiStore";
import { ja, type MessageKey, type Messages } from "./ja";
import { en } from "./en";

const dictionaries: Record<"ja" | "en", Messages> = { ja, en };

/**
 * Returns a `t(key, params?)` translator bound to the current locale. Values may
 * contain `{name}` placeholders, filled from `params`.
 */
export function useTranslations() {
  const locale = useUiStore((state) => state.locale);
  const messages = dictionaries[locale];

  return useCallback(
    (key: MessageKey, params?: Record<string, string | number>) => {
      let text: string = messages[key];
      if (params) {
        for (const [name, value] of Object.entries(params)) {
          text = text.split(`{${name}}`).join(String(value));
        }
      }
      return text;
    },
    [messages]
  );
}
