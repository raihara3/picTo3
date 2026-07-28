"use client";

import { ImageIcon, SlidersIcon, DownloadIcon, type IconProps } from "../icons";
import { useTranslations } from "../i18n/useTranslations";
import type { MessageKey } from "../i18n/ja";
import styles from "./ServiceInfo.module.scss";

type InfoCard = {
  Icon: (props: IconProps) => React.ReactElement;
  titleKey: MessageKey;
  bodyKey: MessageKey;
  noteKey?: MessageKey;
};

const CARDS: InfoCard[] = [
  {
    Icon: ImageIcon,
    titleKey: "service.upload.title",
    bodyKey: "service.upload.body",
    noteKey: "common.noUpload",
  },
  {
    Icon: SlidersIcon,
    titleKey: "service.adjust.title",
    bodyKey: "service.adjust.body",
  },
  {
    Icon: DownloadIcon,
    titleKey: "service.export.title",
    bodyKey: "service.export.body",
  },
];

/** Sidebar content for the empty (no image loaded) state. */
export function ServiceInfo() {
  const t = useTranslations();
  return (
    <>
      <h2 className={styles.heading}>{t("service.heading")}</h2>
      {CARDS.map(({ Icon, titleKey, bodyKey, noteKey }) => (
        <article key={titleKey} className={styles.card}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>
              <Icon size={14} />
            </span>
            <span className={styles.sectionLabel}>{t(titleKey)}</span>
          </div>
          <div className={styles.text}>
            <p className={styles.body}>{t(bodyKey)}</p>
            {noteKey && <p className={styles.note}>{t(noteKey)}</p>}
          </div>
        </article>
      ))}
    </>
  );
}
