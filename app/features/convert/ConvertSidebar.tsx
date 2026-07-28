"use client";

import type { StageController } from "../../viewer/useThreeStage";
import { useTranslations } from "../../i18n/useTranslations";
import { FileDropzone } from "../../components/FileDropzone";
import { ControlsCard } from "./ControlsCard";
import { ExportBar } from "./ExportBar";
import styles from "./ConvertSidebar.module.scss";

/** Sidebar shown once an image is loaded: replace, adjust, export. */
export function ConvertSidebar({ stage }: { stage: StageController }) {
  const t = useTranslations();
  return (
    <div className={styles.sidebar}>
      <FileDropzone />
      <h2 className={styles.heading}>{t("controls.heading")}</h2>
      <ControlsCard />
      <ExportBar stage={stage} />
    </div>
  );
}
