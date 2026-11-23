import { GRASS, POND_RIM } from '../groundLevels';
import { POND_BASINS, POND_ROTATION_Y } from './pondLayout';

export const POND_STEP_DEPTH = 0.35;
export const POND_STEP_COUNT = 3;
export const POND_STEP_RISE = (POND_RIM - GRASS) / POND_STEP_COUNT;
export const POND_POT_RADIUS = 0.42;

export const POND_TERRACES = POND_BASINS.flatMap((basin) => [-1, 1].map((side) => ({
  minU: basin.minU + 0.55,
  maxU: basin.maxU - 0.55,
  v: side < 0 ? basin.minV : basin.maxV,
  side,
})));

export const POND_POTS = POND_TERRACES.flatMap(({ minU, maxU, v, side }) => {
  const span = maxU - minU;
  const count = Math.max(2, Math.floor(span / 3.25));
  return Array.from({ length: count }, (_, i) => ({
    u: minU + span * (i + 0.5) / count,
    v: v - side * 0.22,
  }));
});

const cos = Math.cos(POND_ROTATION_Y);
const sin = Math.sin(POND_ROTATION_Y);

export function getPondTerraceHeight(x: number, z: number): number | undefined {
  const u = x * cos - z * sin;
  const v = x * sin + z * cos;
  for (const terrace of POND_TERRACES) {
    const d = (v - terrace.v) * terrace.side;
    if (u < terrace.minU || u > terrace.maxU || d < 0 || d >= POND_STEP_COUNT * POND_STEP_DEPTH) continue;
    return POND_RIM - Math.floor(d / POND_STEP_DEPTH) * POND_STEP_RISE;
  }
}

export function isOnPondPot(x: number, z: number, padding: number): boolean {
  const u = x * cos - z * sin;
  const v = x * sin + z * cos;
  return POND_POTS.some((pot) => (pot.u - u) ** 2 + (pot.v - v) ** 2 < (POND_POT_RADIUS + padding) ** 2);
}
