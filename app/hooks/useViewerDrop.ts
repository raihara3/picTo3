import { useCallback, useRef, useState } from "react";
import { useImageUpload } from "./useImageUpload";

/**
 * Drag & drop upload for the viewer area. Returns `dropProps` to spread on the
 * drop target and an `isDragging` flag for the overlay. A depth counter keeps
 * the flag stable across child enter/leave events.
 */
export function useViewerDrop() {
  const { acceptFiles } = useImageUpload();
  const [isDragging, setIsDragging] = useState(false);
  const depth = useRef(0);

  const onDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    depth.current += 1;
    setIsDragging(true);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    depth.current -= 1;
    if (depth.current <= 0) {
      depth.current = 0;
      setIsDragging(false);
    }
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      depth.current = 0;
      setIsDragging(false);
      void acceptFiles(event.dataTransfer.files);
    },
    [acceptFiles]
  );

  return { isDragging, dropProps: { onDragEnter, onDragOver, onDragLeave, onDrop } };
}
