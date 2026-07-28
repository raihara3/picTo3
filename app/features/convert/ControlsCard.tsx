"use client";

import { useSettingsStore, type SideColorMode } from "../../store/settingsStore";
import { useImageStore } from "../../store/imageStore";
import { RangeSlider } from "../../components/ui/RangeSlider";
import { useTranslations } from "../../i18n/useTranslations";
import type { MessageKey } from "../../i18n/ja";
import { SlidersIcon } from "../../icons";
import styles from "./ControlsCard.module.scss";

const SIDE_MODES: { value: SideColorMode; labelKey: MessageKey }[] = [
  { value: "edge", labelKey: "controls.sideColor.edge" },
  { value: "custom", labelKey: "controls.sideColor.custom" },
];

/** Mesh adjustment: edge smoothness + thickness sliders, plus result stats. */
export function ControlsCard() {
  const smoothness = useSettingsStore((state) => state.smoothness);
  const thickness = useSettingsStore((state) => state.thickness);
  const sideColorMode = useSettingsStore((state) => state.sideColorMode);
  const sideColor = useSettingsStore((state) => state.sideColor);
  const setSmoothness = useSettingsStore((state) => state.setSmoothness);
  const setThickness = useSettingsStore((state) => state.setThickness);
  const setSideColorMode = useSettingsStore((state) => state.setSideColorMode);
  const setSideColor = useSettingsStore((state) => state.setSideColor);
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

      <div className={styles.sideColor}>
        <div className={styles.sideColorHead}>
          <span className={styles.sideColorLabel}>{t("controls.sideColor")}</span>
          {sideColorMode === "custom" && (
            <label className={styles.swatch} style={{ backgroundColor: sideColor }}>
              <input
                type="color"
                className={styles.colorInput}
                value={sideColor}
                onChange={(event) => setSideColor(event.target.value)}
                aria-label={t("controls.sideColor")}
              />
            </label>
          )}
        </div>
        <div className={styles.segmented} role="group" aria-label={t("controls.sideColor")}>
          {SIDE_MODES.map(({ value, labelKey }) => (
            <button
              key={value}
              type="button"
              className={`${styles.segment} ${sideColorMode === value ? styles.segmentActive : ""}`}
              aria-pressed={sideColorMode === value}
              onClick={() => setSideColorMode(value)}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>

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
