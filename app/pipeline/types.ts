export interface Vec2 {
  x: number;
  y: number;
}

/** Raw silhouette contours traced from the alpha mask, before simplification. */
export interface Contours {
  /** Closed loops in mask-pixel coordinates (y-down); first point ≠ last. */
  loops: Vec2[][];
  maskWidth: number;
  maskHeight: number;
  /** True when the image has no transparency — keep the plain image rectangle. */
  fullyOpaque: boolean;
}

/** Tunable inputs for a single mesh generation. Levels are 0–100 slider units. */
export interface GenerateSettings {
  /** Edge smoothness: higher = stronger contour simplification / fewer verts. */
  smoothness: number;
  /** Extrusion depth level. */
  thickness: number;
  /** Front/back bulge: 0 = flat caps, 100 = fully round (ball-like). */
  roundness: number;
}
