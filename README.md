# picTo3

Browser-based tool that turns an **image into a 3D `.glb` model** — fully
client-side. Images are never uploaded to a server; decoding, meshing, and
export all happen in the browser.

Upload an image, and picTo3 removes the transparent areas, traces the outline of
the colored region, extrudes it into a solid, and textures it with the original
image. Sibling service to [`gltf-light`](../gltf-light) and shares its design
system.

## How it works

The image → mesh pipeline (`app/pipeline`) is built to keep the vertex count
low — it meshes the **outline**, never one vertex per pixel:

1. **Alpha mask** — the image is drawn to a size-capped canvas (≤300 px on the
   long edge) and thresholded on its alpha channel to a solid/transparent mask.
2. **Boundary tracing** (`traceContours.ts`) — the solid/empty border is emitted
   as directed cell-edges (interior on the left) and stitched head-to-tail into
   closed loops (outer contours + holes) following the pixel staircase.
3. **Simplify + smooth** (`simplify.ts`) — Douglas–Peucker removes the staircase
   (bounding the vertex budget); Chaikin corner-cutting then rounds the outline.
   Both are driven by the **edge-smoothness** slider (0 = faithful, 100 = smooth).
4. **Extrude** (`buildGeometry.ts`) — loops are nested into `THREE.Shape`s with
   holes by containment depth and extruded to the **thickness** slider depth,
   with planar UVs so the source image maps onto both caps.
5. **Texture bleed** (`viewer/textureSource.ts`) — opaque color is dilated a few
   pixels into the transparent region so the caps never sample a black halo where
   the silhouette and the alpha edge don't line up exactly.

Export is `three`'s `GLTFExporter` (binary), so a valid `.glb` with an embedded
texture is produced entirely in the browser.

## Controls

| Control | Range | Effect |
| --- | --- | --- |
| エッジのなめらかさ / Edge smoothness | 0–100 | Contour simplification + rounding |
| 厚み / Thickness | 0–100 | Extrusion depth |

## Tech

- **Next.js App Router** (single page, `app/page.tsx`), deployed on **Vercel**.
- **3D layer**: plain `three.js` behind a thin hook (`viewer/useThreeStage`).
- **State**: `zustand` (`store/imageStore`, `store/settingsStore`, `store/uiStore`).
- **Styling**: SCSS modules over design tokens (`styles/tokens.scss`), scoped to
  `[data-app="picto3"]`; light/dark theme + JA/EN, persisted to `localStorage`.

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
```

Everything runs client-side; there is no backend and no environment
configuration required.
