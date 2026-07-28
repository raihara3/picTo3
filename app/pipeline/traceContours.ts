import type { Contours, Vec2 } from "./types";

/** Longest edge (px) of the mask used for silhouette tracing. Keeps the
 * staircase — and therefore the vertex budget — bounded regardless of the
 * uploaded image size; the texture still uses the full-resolution image. */
const MASK_MAX_EDGE = 300;
/** Alpha above this (0–255) counts as opaque / "colored". */
const DEFAULT_ALPHA_THRESHOLD = 32;
/** Discard traced loops smaller than this area (mask px²) as noise/specks. */
const MIN_LOOP_AREA = 6;

interface Mask {
  solid: Uint8Array;
  width: number;
  height: number;
  /** True when every pixel is opaque (no transparency to cut away). */
  fullyOpaque: boolean;
}

/** Draw `image` into a capped-size canvas and threshold its alpha channel. */
function buildMask(
  image: CanvasImageSource,
  naturalWidth: number,
  naturalHeight: number,
  alphaThreshold: number
): Mask {
  const scale = Math.min(1, MASK_MAX_EDGE / Math.max(naturalWidth, naturalHeight));
  const width = Math.max(1, Math.round(naturalWidth * scale));
  const height = Math.max(1, Math.round(naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return { solid: new Uint8Array(0), width: 0, height: 0, fullyOpaque: false };
  }
  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  const { data } = context.getImageData(0, 0, width, height);

  const solid = new Uint8Array(width * height);
  let fullyOpaque = true;
  for (let i = 0; i < solid.length; i += 1) {
    if (data[i * 4 + 3] > alphaThreshold) {
      solid[i] = 1;
    } else {
      fullyOpaque = false;
    }
  }
  return { solid, width, height, fullyOpaque };
}

interface Edge {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  used: boolean;
}

/**
 * Trace the solid/empty boundary as closed loops of grid-corner points. Each
 * boundary cell-edge is emitted directed so the solid interior is on its left;
 * stitching head-to-tail then yields closed loops (outer + holes) following the
 * pixel staircase. Winding is normalised later by the caller.
 */
export function computeContours(
  image: CanvasImageSource,
  naturalWidth: number,
  naturalHeight: number,
  alphaThreshold: number = DEFAULT_ALPHA_THRESHOLD
): Contours {
  const { solid, width, height, fullyOpaque } = buildMask(
    image,
    naturalWidth,
    naturalHeight,
    alphaThreshold
  );
  if (width === 0 || height === 0) {
    return { loops: [], maskWidth: 0, maskHeight: 0, fullyOpaque: false };
  }

  // No transparency: keep the image as-is — a plain rectangle, no silhouette to
  // trace or smooth. Avoids the outline being rounded/deformed by smoothing.
  if (fullyOpaque) {
    const rectangle: Vec2[] = [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ];
    return { loops: [rectangle], maskWidth: width, maskHeight: height, fullyOpaque: true };
  }

  const isSolid = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < width && y < height && solid[y * width + x] === 1;
  const cornerKey = (x: number, y: number) => y * (width + 1) + x;

  const edges: Edge[] = [];
  const edgesByStart = new Map<number, Edge[]>();
  const addEdge = (ax: number, ay: number, bx: number, by: number) => {
    const edge: Edge = { ax, ay, bx, by, used: false };
    edges.push(edge);
    const key = cornerKey(ax, ay);
    const bucket = edgesByStart.get(key);
    if (bucket) {
      bucket.push(edge);
    } else {
      edgesByStart.set(key, [edge]);
    }
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!isSolid(x, y)) {
        continue;
      }
      // Emit each exposed side with the interior on the edge's left.
      if (!isSolid(x, y - 1)) addEdge(x + 1, y, x, y); // top
      if (!isSolid(x, y + 1)) addEdge(x, y + 1, x + 1, y + 1); // bottom
      if (!isSolid(x - 1, y)) addEdge(x, y, x, y + 1); // left
      if (!isSolid(x + 1, y)) addEdge(x + 1, y + 1, x + 1, y); // right
    }
  }

  const loops: Vec2[][] = [];
  for (const seed of edges) {
    if (seed.used) {
      continue;
    }
    const startKey = cornerKey(seed.ax, seed.ay);
    const points: Vec2[] = [];
    let edge: Edge | undefined = seed;
    while (edge && !edge.used) {
      edge.used = true;
      points.push({ x: edge.ax, y: edge.ay });
      const endKey = cornerKey(edge.bx, edge.by);
      if (endKey === startKey) {
        break;
      }
      const candidates = edgesByStart.get(endKey);
      edge = candidates?.find((candidate) => !candidate.used);
    }

    if (points.length < 3) {
      continue;
    }
    // Area filter (shoelace magnitude) to drop specks.
    let area = 0;
    for (let i = 0, n = points.length; i < n; i += 1) {
      const a = points[i];
      const b = points[(i + 1) % n];
      area += a.x * b.y - b.x * a.y;
    }
    if (Math.abs(area / 2) >= MIN_LOOP_AREA) {
      loops.push(points);
    }
  }

  return { loops, maskWidth: width, maskHeight: height, fullyOpaque: false };
}
