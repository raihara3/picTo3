"use client";

import { useTranslations } from "../i18n/useTranslations";
import { RotateIcon } from "../icons";
import styles from "./ViewerToolbar.module.scss";

interface ViewerToolbarProps {
  onResetView: () => void;
}

/** Minimal in-viewer control: reset view. */
export function ViewerToolbar({ onResetView }: ViewerToolbarProps) {
  const t = useTranslations();
  return (
    <div className={styles.toolbar}>
      <button
        type="button"
        className={styles.button}
        onClick={onResetView}
        aria-label={t("toolbar.resetView")}
      >
        <RotateIcon size={16} />
      </button>
    </div>
  );
}
