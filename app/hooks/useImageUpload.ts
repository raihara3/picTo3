import { useCallback, useState } from "react";
import { useImageStore } from "../store/imageStore";
import { useTranslations } from "../i18n/useTranslations";
import { analytics } from "../lib/analytics";

const IMAGE_TYPE = /^image\/(png|webp|jpeg|jpg|gif)$/i;

/**
 * Upload handling for the image dropzone. Decodes the selected file into an
 * HTMLImageElement (kept for both silhouette tracing and texturing) entirely in
 * the browser — nothing is uploaded to a server.
 */
export function useImageUpload() {
  const loadImage = useImageStore((state) => state.loadImage);
  const t = useTranslations();
  const [error, setError] = useState<string | null>(null);

  const acceptFiles = useCallback(
    async (files: FileList | File[] | null) => {
      const file = files && files[0];
      if (!file) {
        return;
      }
      if (!IMAGE_TYPE.test(file.type)) {
        setError(t("upload.error.imageOnly"));
        return;
      }
      setError(null);

      const url = URL.createObjectURL(file);
      const image = new Image();
      image.decoding = "async";
      try {
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error("decode failed"));
          image.src = url;
        });
      } catch {
        URL.revokeObjectURL(url);
        setError(t("upload.error.decode"));
        return;
      }

      loadImage({
        image,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        name: file.name,
      });
      analytics.imageUpload();
    },
    [loadImage, t]
  );

  return { acceptFiles, error };
}
