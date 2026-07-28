import type { Vec2 } from "./types";

/** Perpendicular distance from point `p` to the segment `a`–`b`. */
function perpendicularDistance(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) {
    return Math.hypot(p.x - a.x, p.y - a.y);
  }
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared;
  const projectionX = a.x + t * dx;
  const projectionY = a.y + t * dy;
  return Math.hypot(p.x - projectionX, p.y - projectionY);
}

/**
 * Douglas–Peucker simplification of an open polyline. Both endpoints are always
 * kept. Iterative (explicit stack) to stay safe for very long staircase chains.
 */
function simplifyOpen(points: Vec2[], epsilon: number): Vec2[] {
  const count = points.length;
  if (count < 3) {
    return points.slice();
  }
  const keep = new Uint8Array(count);
  keep[0] = 1;
  keep[count - 1] = 1;

  const stack: Array<[number, number]> = [[0, count - 1]];
  while (stack.length > 0) {
    const [start, end] = stack.pop()!;
    let maxDistance = 0;
    let index = -1;
    for (let i = start + 1; i < end; i += 1) {
      const distance = perpendicularDistance(points[i], points[start], points[end]);
      if (distance > maxDistance) {
        maxDistance = distance;
        index = i;
      }
    }
    if (index !== -1 && maxDistance > epsilon) {
      keep[index] = 1;
      stack.push([start, index]);
      stack.push([index, end]);
    }
  }

  const result: Vec2[] = [];
  for (let i = 0; i < count; i += 1) {
    if (keep[i]) {
      result.push(points[i]);
    }
  }
  return result;
}

/**
 * Simplify a closed loop (first point ≠ last). Split at the two farthest-apart
 * anchors so the pass is stable regardless of where the loop was opened, then
 * simplify each half and recombine without duplicating the shared anchors.
 */
export function simplifyClosed(points: Vec2[], epsilon: number): Vec2[] {
  const count = points.length;
  if (count < 4) {
    return points.slice();
  }

  // Anchor 0, plus the point farthest from it, split the loop into two chains.
  let farIndex = 0;
  let farDistance = -1;
  for (let i = 1; i < count; i += 1) {
    const distance = Math.hypot(points[i].x - points[0].x, points[i].y - points[0].y);
    if (distance > farDistance) {
      farDistance = distance;
      farIndex = i;
    }
  }

  const firstChain = points.slice(0, farIndex + 1);
  const secondChain = points.slice(farIndex).concat([points[0]]);

  const simplifiedFirst = simplifyOpen(firstChain, epsilon);
  const simplifiedSecond = simplifyOpen(secondChain, epsilon);

  // Drop the trailing shared anchor of each chain to avoid duplicates.
  return simplifiedFirst.slice(0, -1).concat(simplifiedSecond.slice(0, -1));
}

/**
 * Chaikin corner-cutting on a closed loop. Each iteration replaces every corner
 * with two points at 1/4 and 3/4 of each edge, rounding the outline into a
 * genuinely smooth curve (Douglas–Peucker alone can only yield straight
 * segments). Point count roughly doubles per iteration, so callers cap it.
 */
export function chaikinClosed(points: Vec2[], iterations: number): Vec2[] {
  let current = points;
  for (let iteration = 0; iteration < iterations && current.length >= 3; iteration += 1) {
    const next: Vec2[] = [];
    for (let i = 0, n = current.length; i < n; i += 1) {
      const a = current[i];
      const b = current[(i + 1) % n];
      next.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 });
      next.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
    }
    current = next;
  }
  return current;
}

/** Signed area of a polygon (positive = counter-clockwise in a y-up frame). */
export function signedArea(points: Vec2[]): number {
  let area = 0;
  for (let i = 0, n = points.length; i < n; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % n];
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

/** Even-odd ray-cast point-in-polygon test. */
export function pointInPolygon(point: Vec2, polygon: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    const intersects =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}
