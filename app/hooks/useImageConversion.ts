import { useEffect, useMemo, useState } from "react";
import { useImageStore } from "../store/imageStore";
import { useSettingsStore } from "../store/settingsStore";
import { computeContours } from "../pipeline/traceContours";
import { buildGeometry } from "../pipeline/buildGeometry";

/** Debounce a value so rapid slider drags coalesce into one rebuild. */
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * Reactive image → mesh pipeline. Contours are traced once per image; the
 * geometry is rebuilt whenever smoothness/thickness/roundness change (debounced,
 * since the rounded rebuild subdivides the caps). Mesh stats are pushed back into
 * the store for the sidebar to display.
 */
export function useImageConversion() {
  const source = useImageStore((state) => state.source);
  const smoothness = useDebounced(useSettingsStore((state) => state.smoothness), 120);
  const thickness = useDebounced(useSettingsStore((state) => state.thickness), 120);
  const roundness = useDebounced(useSettingsStore((state) => state.roundness), 120);
  const setStats = useImageStore((state) => state.setStats);

  const contours = useMemo(
    () => (source ? computeContours(source.image, source.naturalWidth, source.naturalHeight) : null),
    [source]
  );

  const mesh = useMemo(
    () => (contours ? buildGeometry(contours, { smoothness, thickness, roundness }) : null),
    [contours, smoothness, thickness, roundness]
  );

  useEffect(() => {
    setStats(mesh ? { vertexCount: mesh.vertexCount, triangleCount: mesh.triangleCount } : null);
  }, [mesh, setStats]);

  return { geometry: mesh?.geometry ?? null };
}
