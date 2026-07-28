import { useEffect, useMemo } from "react";
import { useImageStore } from "../store/imageStore";
import { useSettingsStore } from "../store/settingsStore";
import { computeContours } from "../pipeline/traceContours";
import { buildGeometry } from "../pipeline/buildGeometry";

/**
 * Reactive image → mesh pipeline. Contours are traced once per image; the
 * geometry is rebuilt whenever smoothness/thickness change. Mesh stats are
 * pushed back into the store for the sidebar to display.
 */
export function useImageConversion() {
  const source = useImageStore((state) => state.source);
  const smoothness = useSettingsStore((state) => state.smoothness);
  const thickness = useSettingsStore((state) => state.thickness);
  const setStats = useImageStore((state) => state.setStats);

  const contours = useMemo(
    () => (source ? computeContours(source.image, source.naturalWidth, source.naturalHeight) : null),
    [source]
  );

  const mesh = useMemo(
    () => (contours ? buildGeometry(contours, { smoothness, thickness }) : null),
    [contours, smoothness, thickness]
  );

  useEffect(() => {
    setStats(mesh ? { vertexCount: mesh.vertexCount, triangleCount: mesh.triangleCount } : null);
  }, [mesh, setStats]);

  return { geometry: mesh?.geometry ?? null };
}
