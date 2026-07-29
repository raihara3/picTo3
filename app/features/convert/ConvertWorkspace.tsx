"use client";

import { useImageStore } from "../../store/imageStore";
import { useSettingsStore } from "../../store/settingsStore";
import { useAnimationStore } from "../../store/animationStore";
import { useImageConversion } from "../../hooks/useImageConversion";
import { useViewerDrop } from "../../hooks/useViewerDrop";
import { useTranslations } from "../../i18n/useTranslations";
import { useThreeStage } from "../../viewer/useThreeStage";
import { Stage } from "../../viewer/Stage";
import { Copyright } from "../../components/Copyright";
import { ConvertSidebar } from "./ConvertSidebar";
import styles from "../../styles/page.module.scss";

/**
 * Workspace shown once an image is loaded. Owns the shared 3D stage and the
 * reactive image→mesh pipeline, and lays out the convert sidebar + 3D viewer.
 */
export function ConvertWorkspace() {
  const source = useImageStore((state) => state.source);
  const sideColorMode = useSettingsStore((state) => state.sideColorMode);
  const sideColor = useSettingsStore((state) => state.sideColor);
  const previewId = useAnimationStore((state) => state.previewId);
  const { geometry } = useImageConversion();
  const stage = useThreeStage(geometry, source, sideColorMode, sideColor, previewId);
  const { isDragging, dropProps } = useViewerDrop();
  const t = useTranslations();

  return (
    <>
      <aside className={styles.sidebar}>
        <ConvertSidebar stage={stage} />
      </aside>
      <section className={styles.viewer} aria-label={t("viewer.label")} {...dropProps}>
        <Stage containerRef={stage.containerRef} onResetView={stage.resetView} />
        <Copyright />
        {isDragging && <div className={styles.dropOverlay}>{t("viewer.dropReplace")}</div>}
      </section>
    </>
  );
}
