/** Largest texture edge (px) — caps the bleed cost on huge uploads. */
const TEXTURE_MAX_EDGE = 1024;
/** Alpha above this (0–255) counts as opaque when seeding the bleed. */
const OPAQUE_ALPHA = 32;
/** How far (px) opaque colour is dilated into transparent regions. */
const BLEED_PASSES = 6;

/**
 * Build the canvas used as the mesh texture. The extruded silhouette rarely
 * lines up exactly with the image's alpha edge, and an opaque material would
 * sample the (black) RGB of transparent texels there, leaving a dark halo. To
 * avoid it, opaque colour is dilated a few pixels into the transparent area so
 * every texel the caps can land on carries a sensible colour.
 */
export function createTextureSource(
  image: CanvasImageSource,
  naturalWidth: number,
  naturalHeight: number
): HTMLCanvasElement {
  const scale = Math.min(1, TEXTURE_MAX_EDGE / Math.max(naturalWidth, naturalHeight));
  const width = Math.max(1, Math.round(naturalWidth * scale));
  const height = Math.max(1, Math.round(naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return canvas;
  }
  context.drawImage(image, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;

  // `filled[i]` marks pixels that already carry a valid colour (seeded from the
  // opaque texels, then grown outward one ring per pass).
  const filled = new Uint8Array(width * height);
  for (let i = 0; i < filled.length; i += 1) {
    if (data[i * 4 + 3] > OPAQUE_ALPHA) {
      filled[i] = 1;
    }
  }

  const neighbors = [-1, 1, -width, width];
  for (let pass = 0; pass < BLEED_PASSES; pass += 1) {
    const frontier: number[] = [];
    for (let index = 0; index < filled.length; index += 1) {
      if (filled[index]) {
        continue;
      }
      const x = index % width;
      for (let n = 0; n < neighbors.length; n += 1) {
        const offset = neighbors[n];
        // Skip horizontal wrap-around at the row edges.
        if (offset === -1 && x === 0) continue;
        if (offset === 1 && x === width - 1) continue;
        const neighbor = index + offset;
        if (neighbor >= 0 && neighbor < filled.length && filled[neighbor] === 1) {
          data[index * 4] = data[neighbor * 4];
          data[index * 4 + 1] = data[neighbor * 4 + 1];
          data[index * 4 + 2] = data[neighbor * 4 + 2];
          data[index * 4 + 3] = 255;
          frontier.push(index);
          break;
        }
      }
    }
    for (let f = 0; f < frontier.length; f += 1) {
      filled[frontier[f]] = 1;
    }
    if (frontier.length === 0) {
      break;
    }
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}
