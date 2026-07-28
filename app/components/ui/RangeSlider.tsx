"use client";

import styles from "./RangeSlider.module.scss";

interface RangeSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Text shown on the right of the label (e.g. the formatted value). */
  valueText: string;
  onChange: (value: number) => void;
}

/**
 * Labeled range input matching the sibling gltf-light slider: a native range
 * sits transparently over a custom track (fill + knob) so the visual is fully
 * themable while keeping keyboard/pointer behaviour native.
 */
export function RangeSlider({ label, value, min, max, step, valueText, onChange }: RangeSliderProps) {
  const trackPct = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <div className={styles.slider}>
      <span className={styles.head}>
        <span>{label}</span>
        <span className={styles.value}>{valueText}</span>
      </span>
      <div className={styles.bar}>
        <div className={styles.fill} style={{ width: `${trackPct}%` }} />
        <span className={styles.knob} style={{ left: `${trackPct}%` }} />
        <input
          type="range"
          className={styles.input}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label={label}
        />
      </div>
    </div>
  );
}
