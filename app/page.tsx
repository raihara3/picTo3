"use client";

import { useImageStore } from "./store/imageStore";
import { useViewerDrop } from "./hooks/useViewerDrop";
import { useTranslations } from "./i18n/useTranslations";
import { Header } from "./components/Header";
import { ServiceInfo } from "./components/ServiceInfo";
import { FileDropzone } from "./components/FileDropzone";
import { Copyright } from "./components/Copyright";
import { ConvertWorkspace } from "./features/convert/ConvertWorkspace";
import styles from "./styles/page.module.scss";

/**
 * Landing (`/`). Empty state = service info + hero uploader; once an image is
 * loaded, the ConvertWorkspace takes over (convert sidebar + 3D viewer).
 */
export default function Page() {
  const hasImage = useImageStore((state) => state.source !== null);
  const { isDragging, dropProps } = useViewerDrop();
  const t = useTranslations();

  return (
    <>
      <Header />
      <main className={styles.main}>
        {hasImage ? (
          <ConvertWorkspace />
        ) : (
          <>
            <aside className={styles.sidebar}>
              <ServiceInfo />
            </aside>
            <section className={styles.viewer} aria-label={t("viewer.label")} {...dropProps}>
              <div className={styles.viewerBody}>
                <FileDropzone variant="hero" />
              </div>
              <Copyright />
              {isDragging && <div className={styles.dropOverlay}>{t("viewer.dropHere")}</div>}
            </section>
          </>
        )}
      </main>
    </>
  );
}
