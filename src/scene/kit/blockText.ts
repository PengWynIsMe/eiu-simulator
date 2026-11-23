import type { BufferGeometry } from 'three';
import { addBox } from './geometryHelpers';

type Segment = readonly [minU: number, maxU: number, minV: number, maxV: number];

const FONT_MAP: Record<string, readonly Segment[]> = {
  A: [
    [0, 0.22, 0, 1],
    [0.78, 1, 0, 1],
    [0, 1, 0.78, 1],
    [0, 1, 0.42, 0.6],
  ],
  B: [
    [0, 0.22, 0, 1],
    [0, 0.85, 0.8, 1],
    [0, 0.85, 0, 0.2],
    [0, 0.8, 0.42, 0.58],
    [0.78, 1, 0.5, 0.9],
    [0.78, 1, 0.1, 0.5],
  ],
  C: [
    [0, 0.22, 0, 1],
    [0, 1, 0.8, 1],
    [0, 1, 0, 0.2],
  ],
  D: [
    [0, 0.22, 0, 1],
    [0, 0.82, 0.8, 1],
    [0, 0.82, 0, 0.2],
    [0.78, 1, 0.18, 0.82],
  ],
  E: [
    [0, 0.22, 0, 1],
    [0, 1, 0.8, 1],
    [0, 1, 0, 0.2],
    [0, 0.75, 0.42, 0.58],
  ],
  F: [
    [0, 0.22, 0, 1],
    [0, 1, 0.8, 1],
    [0, 0.75, 0.42, 0.58],
  ],
  G: [
    [0, 0.22, 0, 1],
    [0, 1, 0.8, 1],
    [0, 1, 0, 0.2],
    [0.78, 1, 0, 0.52],
    [0.45, 1, 0.38, 0.54],
  ],
  H: [
    [0, 0.22, 0, 1],
    [0.78, 1, 0, 1],
    [0, 1, 0.42, 0.58],
  ],
  I: [
    [0.38, 0.62, 0, 1],
    [0.12, 0.88, 0.82, 1],
    [0.12, 0.88, 0, 0.18],
  ],
  J: [
    [0.78, 1, 0.18, 1],
    [0, 1, 0, 0.2],
    [0, 0.22, 0, 0.5],
  ],
  K: [
    [0, 0.22, 0, 1],
    [0.2, 0.85, 0.38, 0.6],
    [0.42, 1, 0.55, 1],
    [0.42, 1, 0, 0.45],
  ],
  L: [
    [0, 0.22, 0, 1],
    [0, 1, 0, 0.2],
  ],
  M: [
    [0, 0.2, 0, 1],
    [0.8, 1, 0, 1],
    [0.4, 0.6, 0.22, 0.65],
    [0.18, 0.42, 0.55, 0.95],
    [0.58, 0.82, 0.55, 0.95],
  ],
  N: [
    [0, 0.22, 0, 1],
    [0.78, 1, 0, 1],
    [0.20, 0.42, 0.60, 0.85],
    [0.38, 0.62, 0.38, 0.62],
    [0.58, 0.80, 0.15, 0.40],
  ],
  O: [
    [0, 0.22, 0, 1],
    [0.78, 1, 0, 1],
    [0, 1, 0.8, 1],
    [0, 1, 0, 0.2],
  ],
  P: [
    [0, 0.22, 0, 1],
    [0, 1, 0.8, 1],
    [0, 1, 0.45, 0.62],
    [0.78, 1, 0.52, 0.9],
  ],
  R: [
    [0, 0.22, 0, 1],
    [0, 1, 0.8, 1],
    [0, 1, 0.45, 0.62],
    [0.78, 1, 0.52, 0.9],
    [0.45, 1, 0, 0.48],
  ],
  S: [
    [0, 1, 0.8, 1],
    [0, 1, 0.42, 0.58],
    [0, 1, 0, 0.2],
    [0, 0.22, 0.5, 0.9],
    [0.78, 1, 0.1, 0.5],
  ],
  T: [
    [0.39, 0.61, 0, 1],
    [0, 1, 0.8, 1],
  ],
  U: [
    [0, 0.22, 0, 1],
    [0.78, 1, 0, 1],
    [0, 1, 0, 0.2],
  ],
  V: [
    [0, 0.24, 0.2, 1],
    [0.76, 1, 0.2, 1],
    [0.18, 0.82, 0, 0.24],
  ],
  W: [
    [0, 0.22, 0, 1],
    [0.78, 1, 0, 1],
    [0.38, 0.62, 0, 0.65],
    [0, 1, 0, 0.2],
  ],
  Y: [
    [0.39, 0.61, 0, 0.55],
    [0, 0.45, 0.52, 1],
    [0.55, 1, 0.52, 1],
  ],
  '-': [
    [0.1, 0.9, 0.42, 0.58],
  ],
  '.': [
    [0.3, 0.7, 0, 0.25],
  ],
};

/**
 * Thêm các hộp chữ 3D vào mảng geometries.
 * Mặt chữ hướng về trục Z (facing +Z hoặc -Z) hoặc trục X.
 */
export function add3DTextAlongX(
  list: BufferGeometry[],
  text: string,
  startX: number,
  baseY: number,
  zPos: number,
  charW: number,
  charH: number,
  thickness: number,
  spacing = 0.25
): void {
  const upper = text.toUpperCase();
  let curX = startX;

  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i];
    if (!ch || ch === ' ') {
      curX += charW * 0.7;
      continue;
    }
    const segs = FONT_MAP[ch];
    if (segs) {
      for (const [u0, u1, v0, v1] of segs) {
        const minX = curX + u0 * charW;
        const maxX = curX + u1 * charW;
        const minY = baseY + v0 * charH;
        const maxY = baseY + v1 * charH;
        const minZ = zPos - thickness * 0.5;
        const maxZ = zPos + thickness * 0.5;
        addBox(list, minX, maxX, minY, maxY, minZ, maxZ);
      }
    }
    curX += charW + spacing;
  }
}

/**
 * Thêm các hộp chữ 3D xếp dọc theo trục Z.
 */
export function add3DTextAlongZ(
  list: BufferGeometry[],
  text: string,
  xPos: number,
  baseY: number,
  startZ: number,
  charW: number,
  charH: number,
  thickness: number,
  spacing = 0.25,
  direction = 1
): void {
  const upper = text.toUpperCase();
  let curZ = startZ;

  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i];
    if (!ch || ch === ' ') {
      curZ += direction * charW * 0.7;
      continue;
    }
    const segs = FONT_MAP[ch];
    if (segs) {
      for (const [u0, u1, v0, v1] of segs) {
        const minZ = direction > 0 ? curZ + u0 * charW : curZ - u1 * charW;
        const maxZ = direction > 0 ? curZ + u1 * charW : curZ - u0 * charW;
        const minY = baseY + v0 * charH;
        const maxY = baseY + v1 * charH;
        const minX = xPos - thickness * 0.5;
        const maxX = xPos + thickness * 0.5;
        addBox(list, minX, maxX, minY, maxY, minZ, maxZ);
      }
    }
    curZ += direction * (charW + spacing);
  }
}
