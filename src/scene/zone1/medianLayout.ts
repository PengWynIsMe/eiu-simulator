import { STREET } from '../groundLevels';

// Bồn cây dải phân cách trên đường vào từ cổng chính — dùng chung cho Zone1 (dựng hình) và walk/groundHeight (độ cao).
export interface MedianPlanter {
  x: number;
  z: number;
  /** Dài theo trục X (m). */
  w: number;
  /** Rộng theo trục Z (m). */
  d: number;
}

export const MEDIAN_PLANTERS: readonly MedianPlanter[] = [
  { x: 236, z: -40, w: 22, d: 2.2 },
  { x: 236, z: -23, w: 22, d: 2.2 },
  { x: 236, z: -8, w: 22, d: 2.2 },
];

/** Bồn cây đặt trên mặt đường phố, cao 0.35 m. */
export const MEDIAN_BASE = STREET;
export const MEDIAN_HEIGHT = 0.35;
export const MEDIAN_TOP = MEDIAN_BASE + MEDIAN_HEIGHT;

export function isOnMedianPlanter(x: number, z: number): boolean {
  for (let i = 0; i < MEDIAN_PLANTERS.length; i++) {
    const m = MEDIAN_PLANTERS[i];
    if (m && Math.abs(x - m.x) <= m.w / 2 && Math.abs(z - m.z) <= m.d / 2) return true;
  }
  return false;
}
