import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Path,
  Shape,
  Vector2,
} from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Vec2 } from '../../types';

/** Bỏ điểm đóng trùng điểm đầu nếu có. */
export function stripClosingPoint(ring: Vec2[]): Vec2[] {
  if (ring.length < 2) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (!first || !last) return ring;
  if (Math.hypot(first[0] - last[0], first[1] - last[1]) < 0.05) {
    return ring.slice(0, -1);
  }
  return ring;
}

export function signedArea2D(pts: Vec2[]): number {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    if (!a || !b) continue;
    area += a[0] * b[1] - b[0] * a[1];
  }
  return area * 0.5;
}

/** Chuyển [x, z] thế giới sang [x, -z] của Three.js Shape trước khi rotateX(-PI/2). */
export function toShapePoints(ring: Vec2[]): Vec2[] {
  return ring.map(([x, z]) => [x, -z]);
}

/**
 * Mở rộng (hoặc thu hẹp nếu `offset < 0`) đa giác 2D theo chiều pháp tuyến ngoài,
 * chuẩn hóa chiều quấn theo `signedArea2D`.
 */
export function expandShapePolygon(ring: Vec2[], offset: number): Vec2[] {
  const pts = stripClosingPoint(ring);
  const n = pts.length;
  if (n < 3) return pts;

  const ccwSign = signedArea2D(pts) >= 0 ? 1 : -1;
  const normals: Vec2[] = [];

  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    if (!a || !b) {
      normals.push([0, 0]);
      continue;
    }
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    normals.push([(dy / len) * ccwSign, (-dx / len) * ccwSign]);
  }

  return pts.map((p, i) => {
    const nPrev = normals[(i - 1 + n) % n] ?? [0, 0];
    const nCurr = normals[i] ?? [0, 0];
    let nx = nPrev[0] + nCurr[0];
    let ny = nPrev[1] + nCurr[1];
    const len = Math.hypot(nx, ny) || 1;
    nx /= len;
    ny /= len;
    const dot = Math.max(0.5, nx * nCurr[0] + ny * nCurr[1]);
    const scale = Math.max(-Math.abs(offset) * 1.6, Math.min(offset / dot, Math.abs(offset) * 1.6));
    return [p[0] + nx * scale, p[1] + ny * scale];
  });
}

/** Đùn đa giác 2D (tọa độ Shape) lên phương Y `[yBottom .. yBottom + thickness]`. */
export function createExtrudedPolygon(
  outerShapePts: Vec2[],
  holeShapeLoops: Vec2[][],
  yBottom: number,
  thickness: number
): BufferGeometry {
  const shape = new Shape(outerShapePts.map(([sx, sy]) => new Vector2(sx, sy)));
  for (const hole of holeShapeLoops) {
    if (hole.length < 3) continue;
    shape.holes.push(new Path(hole.map(([hx, hy]) => new Vector2(hx, hy))));
  }
  const geo = new ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, yBottom, 0);
  return geo.toNonIndexed();
}

export function addBox(
  list: BufferGeometry[],
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  minZ: number,
  maxZ: number
): void {
  const w = maxX - minX;
  const h = maxY - minY;
  const d = maxZ - minZ;
  if (w <= 0.005 || h <= 0.005 || d <= 0.005) return;
  const box = new BoxGeometry(w, h, d).toNonIndexed();
  box.translate((minX + maxX) * 0.5, (minY + maxY) * 0.5, (minZ + maxZ) * 0.5);
  list.push(box);
}

export function addRotatedBox(
  list: BufferGeometry[],
  w: number,
  h: number,
  d: number,
  cx: number,
  cy: number,
  cz: number,
  rotY = 0,
  rotX = 0,
  rotZ = 0
): void {
  if (w <= 0.005 || h <= 0.005 || d <= 0.005) return;
  const box = new BoxGeometry(w, h, d).toNonIndexed();
  if (rotX !== 0) box.rotateX(rotX);
  if (rotZ !== 0) box.rotateZ(rotZ);
  if (rotY !== 0) box.rotateY(rotY);
  box.translate(cx, cy, cz);
  list.push(box);
}

export function addCylinder(
  list: BufferGeometry[],
  rTop: number,
  rBottom: number,
  height: number,
  radialSegments: number,
  cx: number,
  cy: number,
  cz: number,
  rotX = 0,
  rotZ = 0
): void {
  const cyl = new CylinderGeometry(rTop, rBottom, height, radialSegments).toNonIndexed();
  if (rotX !== 0) cyl.rotateX(rotX);
  if (rotZ !== 0) cyl.rotateZ(rotZ);
  cyl.translate(cx, cy, cz);
  list.push(cyl);
}

/** Tính khung trục tọa độ cục bộ `(u, v)` dựa theo cạnh dài nhất (hướng Đông u >= 0). */
export function computePrincipalAxis(outerPts: Vec2[]): {
  originX: number;
  originZ: number;
  ux: number;
  uz: number;
  vx: number;
  vz: number;
  rotY: number;
  maxU: number;
  maxV: number;
  toUV: (pt: Vec2) => Vec2;
} {
  const pts = stripClosingPoint(outerPts);
  let maxLen = -1;
  let bestA: Vec2 = pts[0] ?? [0, 0];
  let bestB: Vec2 = pts[1] ?? [1, 0];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    if (!a || !b) continue;
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (d > maxLen) {
      maxLen = d;
      bestA = a;
      bestB = b;
    }
  }
  const dx = bestB[0] - bestA[0];
  const dz = bestB[1] - bestA[1];
  const len = Math.hypot(dx, dz) || 1;
  let ux = dx / len;
  let uz = dz / len;
  if (ux < 0) {
    ux = -ux;
    uz = -uz;
  }
  const vx = -uz;
  const vz = ux;

  let minU = Number.POSITIVE_INFINITY;
  let maxU = Number.NEGATIVE_INFINITY;
  let minV = Number.POSITIVE_INFINITY;
  let maxV = Number.NEGATIVE_INFINITY;
  for (const [x, z] of pts) {
    const u = x * ux + z * uz;
    const v = x * vx + z * vz;
    if (u < minU) minU = u;
    if (u > maxU) maxU = u;
    if (v < minV) minV = v;
    if (v > maxV) maxV = v;
  }

  const originX = minU * ux + minV * vx;
  const originZ = minU * uz + minV * vz;

  return {
    originX,
    originZ,
    ux,
    uz,
    vx,
    vz,
    rotY: Math.atan2(-uz, ux),
    maxU: maxU - minU,
    maxV: maxV - minV,
    toUV: ([x, z]: Vec2) => [
      (x - originX) * ux + (z - originZ) * uz,
      (x - originX) * vx + (z - originZ) * vz,
    ],
  };
}

/** Gộp danh sách BufferGeometry và dispose tất cả geometry nguồn. */
export function safeMerge(geos: BufferGeometry[]): BufferGeometry | null {
  if (geos.length === 0) return null;
  const merged = BufferGeometryUtils.mergeGeometries(geos, false);
  for (const g of geos) g.dispose();
  return merged;
}
