"use client";

import { useSettingsStore } from "../../store/settingsStore";
import { useImageStore } from "../../store/imageStore";
import { RangeSlider } from "../../components/ui/RangeSlider";
import { useTranslations } from "../../i18n/useTranslations";
import { SlidersIcon } from "../../icons";
import styles from "./ControlsCard.module.scss";

/** Mesh adjustment: edge smoothness + thickness sliders, plus result stats. */
export function ControlsCard() {
  const smoothness = useSettingsStore((state) => state.smoothness);
  const thickness = useSettingsStore((state) => state.thickness);
  const setSmoothness = useSettingsStore((state) => state.setSmoothness);
  const setThickness = useSettingsStore((state) => state.setThickness);
  const stats = useImageStore((state) => state.stats);
  const t = useTranslations();

  return (
    <div className={styles.card}>
      <div className={styles.sectionTitle}>
        <span className={styles.icon}>
          <SlidersIcon size={14} />
        </span>
        <span className={styles.label}>{t("controls.settings.label")}</span>
      </div>

      <RangeSlider
        label={t("controls.smoothness")}
        value={smoothness}
        min={0}
        max={100}
        step={1}
        valueText={`${smoothness}%`}
        onChange={setSmoothness}
      />
      <RangeSlider
        label={t("controls.thickness")}
        value={thickness}
        min={0}
        max={100}
        step={1}
        valueText={`${thickness}%`}
        onChange={setThickness}
      />

      <div className={styles.dataArea}>
        <div className={styles.data}>
          <span className={styles.dataLabel}>{t("stats.vertices")}</span>
          <span className={styles.dataValue}>{(stats?.vertexCount ?? 0).toLocaleString()}</span>
        </div>
        <div className={styles.data}>
          <span className={styles.dataLabel}>{t("stats.triangles")}</span>
          <span className={styles.dataValue}>{(stats?.triangleCount ?? 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
