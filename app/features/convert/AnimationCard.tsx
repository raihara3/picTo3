"use client";

import { useAnimationStore } from "../../store/animationStore";
import { ANIMATIONS, type AnimationId } from "../../pipeline/animations";
import { useTranslations } from "../../i18n/useTranslations";
import type { MessageKey } from "../../i18n/ja";
import { FilmIcon, PlayIcon, StopIcon, CheckIcon } from "../../icons";
import styles from "./AnimationCard.module.scss";

const NAME_KEY: Record<AnimationId, MessageKey> = {
  float: "animation.float",
  jump: "animation.jump",
  sway: "animation.sway",
  wake: "animation.wake",
  pop: "animation.pop",
};

/**
 * Animation picker: preview one clip at a time (▶ / ■) and check the ones to
 * bake into the exported glb as named clips.
 */
export function AnimationCard() {
  const exportIds = useAnimationStore((state) => state.exportIds);
  const previewId = useAnimationStore((state) => state.previewId);
  const toggleExport = useAnimationStore((state) => state.toggleExport);
  const setPreview = useAnimationStore((state) => state.setPreview);
  const t = useTranslations();

  return (
    <div className={styles.card}>
      <div className={styles.sectionTitle}>
        <span className={styles.icon}>
          <FilmIcon size={14} />
        </span>
        <span className={styles.label}>{t("animation.label")}</span>
      </div>
      <p className={styles.hint}>{t("animation.hint")}</p>

      <ul className={styles.list}>
        {ANIMATIONS.map(({ id }) => {
          const name = t(NAME_KEY[id]);
          const included = exportIds.includes(id);
          const playing = previewId === id;
          return (
            <li key={id} className={styles.row}>
              <button
                type="button"
                className={styles.check}
                aria-pressed={included}
                aria-label={t("animation.include", { name })}
                onClick={() => toggleExport(id)}
              >
                <span className={`${styles.box} ${included ? styles.boxOn : ""}`} aria-hidden="true">
                  {included && <CheckIcon size={9} />}
                </span>
                <span className={styles.name}>{name}</span>
              </button>
              <button
                type="button"
                className={`${styles.play} ${playing ? styles.playOn : ""}`}
                aria-label={playing ? t("animation.stop") : t("animation.preview", { name })}
                onClick={() => setPreview(playing ? null : id)}
              >
                {playing ? <StopIcon size={14} /> : <PlayIcon size={14} />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
