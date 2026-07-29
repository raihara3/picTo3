import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Contours, GenerateSettings, Vec2 } from "./types";
import {
  simplifyClosed,
  chaikinClosed,
  decimateToMax,
  signedArea,
  pointInPolygon,
} from "./simplify";

/** An outer contour with its holes, in world coordinates. */
interface ShapeGroup {
  outer: Vec2[];
  holes: Vec2[][];
}

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

/** Max boundary points per loop before the rounded caps are subdivided. */
const ROUND_OUTER_MAX = 160;
const ROUND_HOLE_MAX = 80;

/** Shortest distance from a point to a set of segments `[ax, ay, bx, by]`. */
function distanceToSegments(point: Vec2, segments: number[][]): number {
  let best = Infinity;
  for (let i = 0; i < segments.length; i += 1) {
    const [ax, ay, bx, by] = segments[i];
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;
    let t = lengthSquared === 0 ? 0 : ((point.x - ax) * dx + (point.y - ay) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));
    const distance = Math.hypot(point.x - (ax + t * dx), point.y - (ay + t * dy));
    if (distance < best) {
      best = distance;
    }
  }
  return best;
}

/**
 * Build a rounded (inflated) geometry: the flat slab of `depth` with its front
 * and back caps bulged outward by `roundness`. The bulge at a cap vertex follows
 * `√(d·(2·dmax − d))` where `d` is the distance to the silhouette boundary — a
 * hemispherical profile that pinches to zero at the edge and, for a circular
 * silhouette, forms an exact half-sphere (front + back = a ball).
 *
 * Caps are triangulated (holes included), then midpoint-subdivided so there are
 * enough interior faces to carry the curvature; the boundary is shared with the
 * straight side walls (duplicated for a crisp edge) to avoid cracks.
 */
function buildPuffedGeometry(
  groups: ShapeGroup[],
  worldWidth: number,
  worldHeight: number,
  depth: number,
  roundness: number
): THREE.BufferGeometry {
  const subdivisions = Math.min(3, 1 + Math.round(roundness * 2));

  const positions: number[] = [];
  const uvs: number[] = [];
  const capIndices: number[] = [];
  const sideIndices: number[] = [];

  const pushVertex = (x: number, y: number, z: number) => {
    const index = positions.length / 3;
    positions.push(x, y, z);
    uvs.push(x / worldWidth + 0.5, y / worldHeight + 0.5);
    return index;
  };

  for (const group of groups) {
    const outer = decimateToMax(group.outer, ROUND_OUTER_MAX);
    const holes = group.holes.map((hole) => decimateToMax(hole, ROUND_HOLE_MAX));
    const outerCCW = signedArea(outer) < 0 ? outer.slice().reverse() : outer;
    const holesCW = holes.map((hole) => (signedArea(hole) > 0 ? hole.slice().reverse() : hole));

    const contourV = outerCCW.map((p) => new THREE.Vector2(p.x, p.y));
    const holesV = holesCW.map((hole) => hole.map((p) => new THREE.Vector2(p.x, p.y)));
    const faces = THREE.ShapeUtils.triangulateShape(contourV, holesV);

    // Working vertex list (indices into it) — grows as triangles subdivide.
    const verts: Vec2[] = [...outerCCW, ...holesCW.flat()];
    let triangles: number[][] = faces.map((face) => [face[0], face[1], face[2]]);

    for (let level = 0; level < subdivisions; level += 1) {
      const midpointCache = new Map<string, number>();
      const midpoint = (a: number, b: number) => {
        const key = a < b ? `${a}_${b}` : `${b}_${a}`;
        const cached = midpointCache.get(key);
        if (cached !== undefined) {
          return cached;
        }
        const index = verts.length;
        verts.push({ x: (verts[a].x + verts[b].x) / 2, y: (verts[a].y + verts[b].y) / 2 });
        midpointCache.set(key, index);
        return index;
      };
      const next: number[][] = [];
      for (const [a, b, c] of triangles) {
        const ab = midpoint(a, b);
        const bc = midpoint(b, c);
        const ca = midpoint(c, a);
        next.push([a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]);
      }
      triangles = next;
    }

    // Distance-to-boundary field over the (decimated) outline.
    const segments: number[][] = [];
    const addLoop = (loop: Vec2[]) => {
      for (let i = 0; i < loop.length; i += 1) {
        const a = loop[i];
        const b = loop[(i + 1) % loop.length];
        segments.push([a.x, a.y, b.x, b.y]);
      }
    };
    addLoop(outerCCW);
    holesCW.forEach(addLoop);

    const distances = verts.map((v) => distanceToSegments(v, segments));
    let dmax = 0;
    for (const d of distances) {
      dmax = Math.max(dmax, d);
    }
    dmax = dmax || 1;
    const bulgeAt = (index: number) => {
      const d = distances[index];
      return roundness * Math.sqrt(Math.max(0, d * (2 * dmax - d)));
    };

    // Front + back cap vertices (bulged), sharing the interior tessellation.
    const frontBase = positions.length / 3;
    for (let i = 0; i < verts.length; i += 1) {
      pushVertex(verts[i].x, verts[i].y, depth / 2 + bulgeAt(i));
    }
    const backBase = positions.length / 3;
    for (let i = 0; i < verts.length; i += 1) {
      pushVertex(verts[i].x, verts[i].y, -depth / 2 - bulgeAt(i));
    }
    for (const [a, b, c] of triangles) {
      capIndices.push(frontBase + a, frontBase + b, frontBase + c);
      capIndices.push(backBase + a, backBase + c, backBase + b); // back reversed
    }

    // Boundary = directed edges with no reverse; extrude each into a wall quad
    // with its own (duplicated) vertices so the cap↔side seam stays crisp.
    const directed = new Set<string>();
    for (const [a, b, c] of triangles) {
      directed.add(`${a}_${b}`);
      directed.add(`${b}_${c}`);
      directed.add(`${c}_${a}`);
    }
    for (const key of Array.from(directed)) {
      const [a, b] = key.split("_").map(Number);
      if (directed.has(`${b}_${a}`)) {
        continue;
      }
      const va = verts[a];
      const vb = verts[b];
      const topA = pushVertex(va.x, va.y, depth / 2);
      const topB = pushVertex(vb.x, vb.y, depth / 2);
      const bottomB = pushVertex(vb.x, vb.y, -depth / 2);
      const bottomA = pushVertex(va.x, va.y, -depth / 2);
      // Wound so the normal faces outward (right of the CCW boundary edge).
      sideIndices.push(topA, bottomB, topB, topA, bottomA, bottomB);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(capIndices.concat(sideIndices));
  // Group 0 = caps (textured), group 1 = side walls — matches the flat path.
  geometry.addGroup(0, capIndices.length, 0);
  geometry.addGroup(capIndices.length, sideIndices.length, 1);
  geometry.computeVertexNormals();
  return geometry;
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

  // Simplify + smooth each loop and move it into world space. A fully opaque
  // image is kept verbatim (a rectangle) so smoothing never deforms its shape.
  const polygons: Vec2[][] = [];
  for (const loop of loops) {
    const outline = contours.fullyOpaque
      ? loop
      : chaikinClosed(simplifyClosed(loop, epsilon), iterations);
    const worldPolygon = outline.map(toWorld);
    if (worldPolygon.length >= 3) {
      polygons.push(worldPolygon);
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

  // Nest polygons into outer contours (CCW) + their holes (CW).
  const outerToGroup = new Map<number, number>();
  const groups: ShapeGroup[] = [];
  polygons.forEach((polygon, index) => {
    if (depths[index] % 2 === 0) {
      const ordered = signedArea(polygon) < 0 ? polygon.slice().reverse() : polygon;
      outerToGroup.set(index, groups.length);
      groups.push({ outer: ordered, holes: [] });
    }
  });
  polygons.forEach((polygon, index) => {
    if (depths[index] % 2 === 0) {
      return;
    }
    // Attach this hole to the tightest enclosing outer contour.
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
    const groupIndex = parent >= 0 ? outerToGroup.get(parent) : undefined;
    if (groupIndex !== undefined) {
      const ordered = signedArea(polygon) > 0 ? polygon.slice().reverse() : polygon;
      groups[groupIndex].holes.push(ordered);
    }
  });
  if (groups.length === 0) {
    return null;
  }

  const roundness = Math.min(1, Math.max(0, settings.roundness / 100));
  let geometry: THREE.BufferGeometry;

  if (roundness > 0) {
    geometry = buildPuffedGeometry(groups, worldWidth, worldHeight, depth, roundness);
  } else {
    // Flat slab via ExtrudeGeometry. Planar cap UVs; the side walls reuse the
    // same mapping so their x/y on the contour sample the image's boundary
    // colour (used by the "edge colour" side material).
    const uvAt = (vertices: number[], index: number) =>
      new THREE.Vector2(
        vertices[index * 3] / worldWidth + 0.5,
        vertices[index * 3 + 1] / worldHeight + 0.5
      );
    const uvGenerator = {
      generateTopUV(_g: THREE.ExtrudeGeometry, vertices: number[], a: number, b: number, c: number) {
        return [uvAt(vertices, a), uvAt(vertices, b), uvAt(vertices, c)];
      },
      generateSideWallUV(
        _g: THREE.ExtrudeGeometry,
        vertices: number[],
        a: number,
        b: number,
        c: number,
        d: number
      ) {
        return [uvAt(vertices, a), uvAt(vertices, b), uvAt(vertices, c), uvAt(vertices, d)];
      },
    };
    const shapeList = groups.map((group) => {
      const shape = new THREE.Shape(group.outer.map((p) => new THREE.Vector2(p.x, p.y)));
      group.holes.forEach((hole) => shape.holes.push(new THREE.Path(hole.map((p) => new THREE.Vector2(p.x, p.y)))));
      return shape;
    });
    geometry = new THREE.ExtrudeGeometry(shapeList, {
      depth,
      bevelEnabled: false,
      steps: 1,
      UVGenerator: uvGenerator,
    });
    geometry.translate(0, 0, -depth / 2); // centre the slab in depth
    geometry = mergeVertices(geometry);
    geometry.computeVertexNormals();
  }

  // Place the origin at the object's bottom-centre (x/z centred, base at y=0) so
  // rotations pivot from the base and the model rests on the origin.
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  if (bounds) {
    const centerX = (bounds.min.x + bounds.max.x) / 2;
    const centerZ = (bounds.min.z + bounds.max.z) / 2;
    geometry.translate(-centerX, -bounds.min.y, -centerZ);
  }

  const vertexCount = geometry.attributes.position.count;
  const triangleCount = geometry.index ? geometry.index.count / 3 : vertexCount / 3;

  return { geometry, worldWidth, worldHeight, vertexCount, triangleCount };
}
