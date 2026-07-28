"use client";

import { useRef, useState } from "react";
import { useImageUpload } from "../hooks/useImageUpload";
import { useTranslations } from "../i18n/useTranslations";
import { UploadIcon } from "../icons";
import styles from "./FileDropzone.module.scss";

interface FileDropzoneProps {
  /** `panel` = compact (sidebar); `hero` = fills the viewer area (empty state). */
  variant?: "panel" | "hero";
}

/** Upload dropzone: click or drag & drop an image into imageStore. */
export function FileDropzone({ variant = "panel" }: FileDropzoneProps) {
  const { acceptFiles, error } = useImageUpload();
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className={`${styles.wrapper} ${variant === "hero" ? styles.wrapperHero : ""}`}>
      <button
        type="button"
        className={`${styles.dropzone} ${variant === "hero" ? styles.dropzoneHero : ""} ${
          isDragging ? styles.dragging : ""
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsDragging(false);
          void acceptFiles(event.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/webp,image/jpeg,image/gif"
          hidden
          onChange={(event) => void acceptFiles(event.target.files)}
        />
        <span className={styles.icon}>
          <UploadIcon size={24} />
        </span>
        <span className={styles.text}>
          <span className={styles.title}>{t("dropzone.title")}</span>
          <span className={styles.hint}>{t("dropzone.hint")}</span>
          <span className={styles.note}>{t("common.noUpload")}</span>
        </span>
      </button>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
