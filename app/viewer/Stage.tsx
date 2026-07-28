"use client";

import type { Ref } from "react";
import { ViewerToolbar } from "./ViewerToolbar";
import styles from "./Stage.module.scss";

interface StageProps {
  containerRef: Ref<HTMLDivElement>;
  onResetView: () => void;
}

/** Presentational 3D canvas host. The stage is driven by `useThreeStage`. */
export function Stage({ containerRef, onResetView }: StageProps) {
  return (
    <div className={styles.stage}>
      <div ref={containerRef} className={styles.canvas} />
      <ViewerToolbar onResetView={onResetView} />
    </div>
  );
}
