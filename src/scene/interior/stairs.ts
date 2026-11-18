import { FLOOR_HEIGHT } from '../../data';

export interface StairRamp {
  readonly kind: 'ramp';
  readonly u1: number;
  readonly v1: number;
  readonly y1: number;
  readonly u2: number;
  readonly v2: number;
  readonly y2: number;
  readonly halfWidth: number;
}

export interface StairLanding {
  readonly kind: 'landing';
  readonly minU: number;
  readonly maxU: number;
  readonly minV: number;
  readonly maxV: number;
  readonly y: number;
}

export type StairPart = StairRamp | StairLanding;

export interface WalkableStairSpec {
  readonly id: string;
  readonly parts: readonly StairPart[];
  readonly shaftMinU: number;
  readonly shaftMaxU: number;
  readonly shaftMinV: number;
  readonly shaftMaxV: number;
}

export interface SwitchbackStairGeometrySpec {
  readonly id: string;
  readonly label: string;
  readonly f1: readonly [number, number, number, number];
  readonly f2: readonly [number, number, number, number];
  readonly width: number;
  readonly steps1: number;
  readonly steps2: number;
  readonly landRatio: number;
  readonly land: readonly [number, number, number, number];
  readonly backRail: readonly [number, number, number, number];
  readonly shaftBounds: readonly [number, number, number, number];
}

const MAX_STEP_DELTA = 0.72;
const FLOOR_TRANSITION_THRESHOLD = FLOOR_HEIGHT - 0.16;
const PART_EDGE_MARGIN = 0.08;
const RAMP_ALONG_MARGIN = 0.26;

function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/** Chuyển thông số thang chữ U 2 vế sang tập đoạn dốc + chiếu nghỉ dùng cho di chuyển 3D. */
export function buildSwitchbackWalkableSpec(spec: SwitchbackStairGeometrySpec): WalkableStairSpec {
  const midY = spec.landRatio * FLOOR_HEIGHT;
  const hw = spec.width * 0.5;
  const [lcx, lcz, lw, ld] = spec.land;
  return {
    id: spec.id,
    parts: [
      {
        kind: 'ramp',
        u1: spec.f1[0],
        v1: spec.f1[1],
        y1: 0,
        u2: spec.f1[2],
        v2: spec.f1[3],
        y2: midY,
        halfWidth: hw,
      },
      {
        kind: 'landing',
        minU: lcx - lw * 0.5,
        maxU: lcx + lw * 0.5,
        minV: lcz - ld * 0.5,
        maxV: lcz + ld * 0.5,
        y: midY,
      },
      {
        kind: 'ramp',
        u1: spec.f2[0],
        v1: spec.f2[1],
        y1: midY,
        u2: spec.f2[2],
        v2: spec.f2[3],
        y2: FLOOR_HEIGHT,
        halfWidth: hw,
      },
    ],
    shaftMinU: spec.shaftBounds[0],
    shaftMaxU: spec.shaftBounds[1],
    shaftMinV: spec.shaftBounds[2],
    shaftMaxV: spec.shaftBounds[3],
  };
}

/** Tính độ cao trên 1 mảnh thang (đoạn dốc hoặc chiếu nghỉ) tại (u, v); null nếu ngoài phạm vi mảnh. */
export function sampleStairPartY(part: StairPart, u: number, v: number, edgeMargin = PART_EDGE_MARGIN): number | null {
  if (part.kind === 'landing') {
    if (
      u >= part.minU - edgeMargin &&
      u <= part.maxU + edgeMargin &&
      v >= part.minV - edgeMargin &&
      v <= part.maxV + edgeMargin
    ) {
      return part.y;
    }
    return null;
  }

  const du = part.u2 - part.u1;
  const dv = part.v2 - part.v1;
  const len = Math.hypot(du, dv);
  if (len < 0.05) return null;

  const dirU = du / len;
  const dirV = dv / len;
  const relU = u - part.u1;
  const relV = v - part.v1;
  const along = relU * dirU + relV * dirV;
  const perp = Math.abs(-relU * dirV + relV * dirU);

  if (perp > part.halfWidth + edgeMargin) return null;
  if (along < -RAMP_ALONG_MARGIN || along > len + RAMP_ALONG_MARGIN) return null;

  const t = clamp01(along / len);
  // Nâng nhẹ ~6 cm ở giữa dốc để đế chân robot nằm sát trên mũi bậc, không lún vào cổ bậc
  const treadLift = 0.06 * Math.sin(t * Math.PI);
  return part.y1 + t * (part.y2 - part.y1) + treadLift;
}

export function isInsideAnyStairFootprint(
  stairs: readonly WalkableStairSpec[],
  u: number,
  v: number,
  floor: number,
  maxFloors: number,
  currentY: number
): boolean {
  const layers: number[] = [];
  if (floor < maxFloors && currentY >= -0.45) layers.push(0);
  if (floor > 1 && currentY <= 0.45) layers.push(-FLOOR_HEIGHT);

  for (const offset of layers) {
    for (const st of stairs) {
      for (const part of st.parts) {
        const localY = sampleStairPartY(part, u, v, 0.05);
        if (localY === null) continue;
        const candY = localY + offset;
        if (Math.abs(candY - currentY) <= MAX_STEP_DELTA) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Tính cao độ đứng trên hệ cầu thang nhiều tầng và phát hiện thời điểm đổi tầng.
 * `canStandOnFloorZero(u, v)` trả về false bên trong lỗ giếng thang / vùng chân vế 1 để nhân vật bám dốc thang.
 */
export function evaluateStairHeight(
  stairs: readonly WalkableStairSpec[],
  toLocal: (worldX: number, worldZ: number) => [number, number],
  worldX: number,
  worldZ: number,
  prevY: number,
  floor: number,
  maxFloors: number,
  canStandOnFloorZero: (u: number, v: number) => boolean
): { y: number; transitionToFloor?: number } {
  const [u, v] = toLocal(worldX, worldZ);

  let bestY: number | null = null;
  let bestDist = Number.POSITIVE_INFINITY;

  const tryCandidate = (candY: number) => {
    const dist = Math.abs(candY - prevY);
    if (dist <= MAX_STEP_DELTA && dist < bestDist) {
      bestDist = dist;
      bestY = candY;
    }
  };

  if (canStandOnFloorZero(u, v)) {
    tryCandidate(0);
  }

  if (floor < maxFloors) {
    for (const st of stairs) {
      for (const part of st.parts) {
        const py = sampleStairPartY(part, u, v);
        if (py !== null) tryCandidate(py);
      }
    }
  }

  if (floor > 1) {
    for (const st of stairs) {
      for (const part of st.parts) {
        const py = sampleStairPartY(part, u, v);
        if (py !== null) tryCandidate(py - FLOOR_HEIGHT);
      }
    }
  }

  const nextY = bestY ?? (Math.abs(prevY) <= MAX_STEP_DELTA ? 0 : prevY);

  if (floor < maxFloors && nextY >= FLOOR_TRANSITION_THRESHOLD) {
    return { y: nextY, transitionToFloor: floor + 1 };
  }
  if (floor > 1 && nextY <= -FLOOR_TRANSITION_THRESHOLD) {
    return { y: nextY, transitionToFloor: floor - 1 };
  }
  return { y: nextY };
}
