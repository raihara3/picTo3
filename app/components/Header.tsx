"use client";

import { useUiStore } from "../store/uiStore";
import { useTranslations } from "../i18n/useTranslations";
import { CubeIcon, SunIcon, MoonIcon } from "../icons";
import styles from "./Header.module.scss";

export function Header() {
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const locale = useUiStore((state) => state.locale);
  const toggleLocale = useUiStore((state) => state.toggleLocale);
  const t = useTranslations();

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <span className={styles.brandMark}>
          <CubeIcon size={24} />
        </span>
        <span className={styles.brandText}>
          <span className={styles.brandTitle}>picTo3</span>
          <span className={styles.brandSubtitle}>{t("header.brandSubtitle")}</span>
        </span>
      </div>

      <div className={styles.right}>
        <button
          type="button"
          className={styles.langToggle}
          onClick={toggleLocale}
          aria-label={t("header.language")}
        >
          {locale === "ja" ? "EN" : "日本語"}
        </button>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={theme === "light" ? t("header.toDark") : t("header.toLight")}
        >
          {theme === "light" ? <MoonIcon size={16} /> : <SunIcon size={16} />}
        </button>
      </div>
    </header>
  );
}
