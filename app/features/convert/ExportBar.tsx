"use client";

import { useImageStore } from "../../store/imageStore";
import type { StageController } from "../../viewer/useThreeStage";
import { useTranslations } from "../../i18n/useTranslations";
import { DownloadIcon } from "../../icons";
import styles from "./ExportBar.module.scss";

/** Turn "logo.png" into "logo.glb". */
function glbName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "");
  return `${base || "model"}.glb`;
}

/** Sticky bottom bar: triangle count + the "save as glb" CTA. */
export function ExportBar({ stage }: { stage: StageController }) {
  const name = useImageStore((state) => state.source?.name ?? "model");
  const stats = useImageStore((state) => state.stats);
  const t = useTranslations();

  const ready = stats != null && stats.triangleCount > 0;

  return (
    <div className={styles.bar}>
      <div className={styles.info}>
        <span className={styles.count}>{(stats?.triangleCount ?? 0).toLocaleString()}</span>
        <span className={styles.unit}>{t("stats.triangles")}</span>
      </div>
      <button
        type="button"
        className={styles.save}
        onClick={() => stage.exportGlb(glbName(name))}
        disabled={!ready}
      >
        <DownloadIcon size={16} />
        {t("export.save")}
      </button>
    </div>
  );
}
