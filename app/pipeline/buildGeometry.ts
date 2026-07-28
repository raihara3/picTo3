import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Contours, GenerateSettings, Vec2 } from "./types";
import { simplifyClosed, chaikinClosed, signedArea, pointInPolygon } from "./simplify";

export interface MeshGeometry {
  geometry: THREE.BufferGeometry;
  /** Normalised UV span used so the texture maps 1:1 onto the caps. */
  worldWidth: number;
  worldHeight: number;
  vertexCount: number;
  triangleCount: number;
}

/**
 * Smoothness 0–100 → contour treatment. Douglas–Peucker first removes the pixel
 * staircase (epsilon grows mildly with smoothness to keep the vertex budget
 * down), then Chaikin rounds the result into a smooth curve — more iterations at
 * higher smoothness. Together: low = faithful outline, high = smooth blob.
 */
function smoothnessParams(
  smoothness: number,
  maskMaxEdge: number
): { epsilon: number; iterations: number } {
  const normalized = Math.min(1, Math.max(0, smoothness / 100));
  return {
    epsilon: 0.6 + normalized * 0.012 * maskMaxEdge,
    iterations: Math.round(normalized * 3),
  };
}

/** Thickness 0–100 → extrusion depth in world units (model spans ~2 units). */
function thicknessDepth(thickness: number): number {
  const normalized = Math.min(1, Math.max(0, thickness / 100));
  return 0.03 + normalized * 0.67;
}

/**
 * Turn traced silhouette contours into an extruded, textured-UV geometry.
 *
 * Contours are simplified (smoothness), nested into outer shapes + holes by
 * containment depth, extruded to the requested thickness, and given planar UVs
 * so the source image maps onto both caps. Returns `null` when nothing meshable
 * remains.
 */
export function buildGeometry(
  contours: Contours,
  settings: GenerateSettings
): MeshGeometry | null {
  const { loops, maskWidth, maskHeight } = contours;
  if (loops.length === 0 || maskWidth === 0 || maskHeight === 0) {
    return null;
  }

  const { epsilon, iterations } = smoothnessParams(
    settings.smoothness,
    Math.max(maskWidth, maskHeight)
  );
  const depth = thicknessDepth(settings.thickness);

  // Preserve the image aspect ratio; longest side spans 2 world units.
  const aspect = maskWidth / maskHeight;
  const worldWidth = aspect >= 1 ? 2 : 2 * aspect;
  const worldHeight = aspect >= 1 ? 2 / aspect : 2;

  const toWorld = (point: Vec2): Vec2 => ({
    x: (point.x / maskWidth - 0.5) * worldWidth,
    y: (0.5 - point.y / maskHeight) * worldHeight, // flip Y (image is y-down)
  });

  // Simplify each loop and move it into world space.
  const polygons: Vec2[][] = [];
  for (const loop of loops) {
    const simplified = chaikinClosed(simplifyClosed(loop, epsilon), iterations).map(toWorld);
    if (simplified.length >= 3) {
      polygons.push(simplified);
    }
  }
  if (polygons.length === 0) {
    return null;
  }

  // Containment depth: even = outer shape, odd = hole. Immediate parent is the
  // containing polygon of greatest depth (i.e. the tightest enclosing loop).
  const depths = polygons.map((polygon, index) => {
    let containing = 0;
    for (let other = 0; other < polygons.length; other += 1) {
      if (other !== index && pointInPolygon(polygon[0], polygons[other])) {
        containing += 1;
      }
    }
    return containing;
  });

  const shapes = new Map<number, THREE.Shape>();
  polygons.forEach((polygon, index) => {
    if (depths[index] % 2 === 0) {
      // Outer contour → CCW.
      const ordered = signedArea(polygon) < 0 ? polygon.slice().reverse() : polygon;
      shapes.set(index, new THREE.Shape(ordered.map((p) => new THREE.Vector2(p.x, p.y))));
    }
  });

  polygons.forEach((polygon, index) => {
    if (depths[index] % 2 === 0) {
      return; // outer, handled above
    }
    // Attach this hole to the tightest enclosing outer shape.
    let parent = -1;
    let parentDepth = -1;
    for (let other = 0; other < polygons.length; other += 1) {
      if (
        other !== index &&
        depths[other] % 2 === 0 &&
        depths[other] > parentDepth &&
        pointInPolygon(polygon[0], polygons[other])
      ) {
        parent = other;
        parentDepth = depths[other];
      }
    }
    const shape = parent >= 0 ? shapes.get(parent) : undefined;
    if (shape) {
      // Hole → CW.
      const ordered = signedArea(polygon) > 0 ? polygon.slice().reverse() : polygon;
      shape.holes.push(new THREE.Path(ordered.map((p) => new THREE.Vector2(p.x, p.y))));
    }
  });

  const shapeList = Array.from(shapes.values());
  if (shapeList.length === 0) {
    return null;
  }

  // Planar UVs from world position; sides use the solid material so their UVs
  // are irrelevant.
  const uvAt = (vertices: number[], index: number) =>
    new THREE.Vector2(
      vertices[index * 3] / worldWidth + 0.5,
      vertices[index * 3 + 1] / worldHeight + 0.5
    );
  const uvGenerator = {
    generateTopUV(_geometry: THREE.ExtrudeGeometry, vertices: number[], a: number, b: number, c: number) {
      return [uvAt(vertices, a), uvAt(vertices, b), uvAt(vertices, c)];
    },
    generateSideWallUV() {
      return [new THREE.Vector2(0, 0), new THREE.Vector2(0, 0), new THREE.Vector2(0, 0), new THREE.Vector2(0, 0)];
    },
  };

  let geometry: THREE.BufferGeometry = new THREE.ExtrudeGeometry(shapeList, {
    depth,
    bevelEnabled: false,
    steps: 1,
    UVGenerator: uvGenerator,
  });
  geometry.translate(0, 0, -depth / 2); // centre the slab on the origin
  geometry = mergeVertices(geometry);
  geometry.computeVertexNormals();

  const vertexCount = geometry.attributes.position.count;
  const triangleCount = geometry.index ? geometry.index.count / 3 : vertexCount / 3;

  return { geometry, worldWidth, worldHeight, vertexCount, triangleCount };
}
