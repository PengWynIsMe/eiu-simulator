import { campus } from '../../data';
import type { Vec2 } from '../../types';
import { computePrincipalAxis } from '../kit/geometryHelpers';
import { buildGrassMask, type GrassMask, type GrassMaskRoad } from '../nature/grassMask';
import { getGroundHeight } from '../walk/groundHeight';
import { isPointInPond } from '../zone1/pondLayout';
import {
  BRIDGE_WIDTH,
  CANTEEN_PARKING_DECK,
  FOOTWAY_WIDTH,
  ROAD_WIDTH,
  ROUNDABOUT_ROAD_WIDTH,
  STREET_LANE_WIDTH,
} from '../groundLevels';

/** Vị trí + hướng một vật (yaw: góc quay quanh Y; hướng "trước" của vật là +Z cục bộ). */
export interface Placement {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export interface BikePlacement extends Placement {
  /** true = xe đen, false = xe đỏ. */
  dark: boolean;
}

export interface StreetLayout {
  lamps: Placement[];
  benches: Placement[];
  bins: Placement[];
  bikes: BikePlacement[];
  sign: Placement;
}

/** Khoảng đèn đường dọc đường nội bộ (m). */
const LAMP_SPACING = 25;
/** Lệch tim đường tới cột đèn (m): đường rộng 7 m, bó vỉa ở 3.5 m, nên 4.2 m là ngoài bó vỉa. */
const LAMP_OFFSET = 4.2;
/** Hai cột đèn gần nhau hơn mức này (đường chồng nhau) thì bỏ cột sau (m). */
const LAMP_MIN_GAP = 14;
const BENCH_RING_RADIUS = 86;
const BENCH_RING_COUNT = 12;
const CANTEEN_BENCH_COUNT = 6;
export const BIKE_MAX = 400;
const BIKE_SPACING = 0.8;
const BIKE_ROW_PITCH = 2.2;
/** Nửa chiều dài xe (m) — để giữ xe cách mép nhà xe. */
const BIKE_HALF_LENGTH = 0.9;
/** Điểm đặt bảng "EIU" gần cổng chính (phía trong). */
const SIGN_TARGET: Vec2 = [248, -40];

/** Băm số nguyên → [0, 1). Ổn định, không phụ thuộc thứ tự gọi. */
function hash01(i: number, j: number): number {
  let h = Math.imul(i | 0, 0x27d4eb2d) ^ Math.imul(j | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function roadWidth(road: { kind: string; lanes: number | null }): number {
  if (road.kind === 'street') return (road.lanes ?? 2) * STREET_LANE_WIDTH;
  if (road.kind === 'footway') return FOOTWAY_WIDTH;
  if (road.kind === 'bridge') return BRIDGE_WIDTH;
  return ROAD_WIDTH;
}

/** Lưới "chỗ trống ngoài trời" (dùng lại bộ lọc của cỏ, S3): trong ranh trường, không đường/nhà/bãi xe/hồ. */
export function buildFreeMask(): GrassMask {
  const roads: GrassMaskRoad[] = campus.layout.roads.map((r) => ({ points: r.points, width: roadWidth(r) }));
  return buildGrassMask({
    boundary: campus.layout.boundary,
    roads,
    buildingOuters: campus.buildings.map((b) => b.shape.outer),
    parking: campus.layout.parking,
    roundabout: { radius: campus.layout.roundabout.radius, roadWidth: ROUNDABOUT_ROAD_WIDTH },
    isBlocked: (x, z) => isPointInPond(x, z, 1.2),
    roadMargin: 0.3,
    solidMargin: 0.6,
  });
}

/** Điểm tâm + 4 điểm quanh bán kính r đều là đất trống. */
function isFree(mask: GrassMask, x: number, z: number, r: number): boolean {
  return (
    mask.isGrass(x, z) &&
    mask.isGrass(x + r, z) &&
    mask.isGrass(x - r, z) &&
    mask.isGrass(x, z + r) &&
    mask.isGrass(x, z - r)
  );
}

function place(x: number, z: number, yaw: number): Placement {
  return { x, y: getGroundHeight(x, z), z, yaw };
}

function lampPlacements(mask: GrassMask): Placement[] {
  const out: Placement[] = [];
  for (const road of campus.layout.roads) {
    if (road.kind !== 'internal') continue;
    let acc = 0;
    let next = LAMP_SPACING / 2;
    let idx = 0;
    for (let i = 0; i < road.points.length - 1; i++) {
      const a = road.points[i];
      const b = road.points[i + 1];
      if (!a || !b) continue;
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < 1e-6) continue;
      const tx = (b[0] - a[0]) / len;
      const tz = (b[1] - a[1]) / len;
      while (next <= acc + len) {
        const t = next - acc;
        const px = a[0] + tx * t;
        const pz = a[1] + tz * t;
        const side = idx % 2 === 0 ? 1 : -1;
        idx++;
        next += LAMP_SPACING;
        // Pháp tuyến (-tz, tx); cột lệch ra `side`, cần vươn ngược lại về phía lòng đường.
        const nx = -tz * side;
        const nz = tx * side;
        const x = px + nx * LAMP_OFFSET;
        const z = pz + nz * LAMP_OFFSET;
        if (!isFree(mask, x, z, 0.3)) continue;
        if (out.some((l) => Math.hypot(l.x - x, l.z - z) < LAMP_MIN_GAP)) continue;
        out.push(place(x, z, Math.atan2(-nx, -nz)));
      }
      acc += len;
    }
  }
  return out;
}

/** Thùng rác cạnh một ghế: thử bên phải, rồi bên trái. */
function binBeside(mask: GrassMask, bench: Placement): Placement | null {
  const rx = Math.cos(bench.yaw);
  const rz = -Math.sin(bench.yaw);
  for (const s of [1, -1]) {
    const x = bench.x + rx * 1.35 * s;
    const z = bench.z + rz * 1.35 * s;
    if (isFree(mask, x, z, 0.3)) return place(x, z, bench.yaw);
  }
  return null;
}

function ringBenches(mask: GrassMask): Placement[] {
  const [cx, cz] = campus.layout.roundabout.center;
  const out: Placement[] = [];
  for (let k = 0; k < BENCH_RING_COUNT; k++) {
    const ang = ((k + 0.5) / BENCH_RING_COUNT) * Math.PI * 2;
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    for (const r of [BENCH_RING_RADIUS, BENCH_RING_RADIUS + 1.5, BENCH_RING_RADIUS + 3]) {
      const x = cx + c * r;
      const z = cz + s * r;
      if (isFree(mask, x, z, 1)) {
        out.push(place(x, z, Math.atan2(-c, -s)));
        break;
      }
    }
  }
  return out;
}

function pointInPolygon(poly: readonly Vec2[], x: number, z: number): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (!a || !b) continue;
    if (a[1] > z !== b[1] > z && x < ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

function distToEdges(poly: readonly Vec2[], x: number, z: number): number {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    if (!a || !b) continue;
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const lenSq = dx * dx + dz * dz;
    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / lenSq));
    best = Math.min(best, Math.hypot(x - (a[0] + t * dx), z - (a[1] + t * dz)));
  }
  return best;
}

/** Ghế trước căn tin: dọc cạnh dài nhất quay về phía Nam (+Z), cách tường 2.8–6 m. */
function canteenBenches(mask: GrassMask): Placement[] {
  const b = campus.buildings.find((x) => x.id === 'can-tin');
  if (!b) return [];
  const poly = b.shape.outer;
  let bestLen = 0;
  let edge: { a: Vec2; b: Vec2; nx: number; nz: number } | null = null;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    if (!p || !q) continue;
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (len < 1e-6) continue;
    let nx = -(q[1] - p[1]) / len;
    let nz = (q[0] - p[0]) / len;
    const mx = (p[0] + q[0]) / 2;
    const mz = (p[1] + q[1]) / 2;
    if (pointInPolygon(poly, mx + nx * 0.5, mz + nz * 0.5)) {
      nx = -nx;
      nz = -nz;
    }
    if (nz > 0.5 && len > bestLen) {
      bestLen = len;
      edge = { a: p, b: q, nx, nz };
    }
  }
  if (!edge) return [];
  const out: Placement[] = [];
  for (let i = 0; i < CANTEEN_BENCH_COUNT; i++) {
    const t = 0.1 + (0.8 * (i + 0.5)) / CANTEEN_BENCH_COUNT;
    const bx = edge.a[0] + (edge.b[0] - edge.a[0]) * t;
    const bz = edge.a[1] + (edge.b[1] - edge.a[1]) * t;
    for (const d of [2.8, 3.6, 4.4, 5.2, 6]) {
      const x = bx + edge.nx * d;
      const z = bz + edge.nz * d;
      if (isFree(mask, x, z, 1)) {
        out.push(place(x, z, Math.atan2(edge.nx, edge.nz)));
        break;
      }
    }
  }
  return out;
}

function bridgeBins(mask: GrassMask): Placement[] {
  const out: Placement[] = [];
  for (const road of campus.layout.roads) {
    if (road.kind !== 'bridge') continue;
    const n = road.points.length;
    const ends: [Vec2 | undefined, Vec2 | undefined][] = [
      [road.points[0], road.points[1]],
      [road.points[n - 1], road.points[n - 2]],
    ];
    for (const [end, inner] of ends) {
      if (!end || !inner) continue;
      const len = Math.hypot(end[0] - inner[0], end[1] - inner[1]) || 1;
      const dx = (end[0] - inner[0]) / len;
      const dz = (end[1] - inner[1]) / len;
      let done = false;
      for (const along of [1.5, 2.5, 3.5, 4.5]) {
        for (const side of [1, -1]) {
          const x = end[0] + dx * along - dz * 2.4 * side;
          const z = end[1] + dz * along + dx * 2.4 * side;
          if (!done && isFree(mask, x, z, 0.3)) {
            out.push(place(x, z, Math.atan2(dx, dz)));
            done = true;
          }
        }
      }
    }
  }
  return out;
}

interface BikeLot {
  outer: readonly Vec2[];
  deckY?: number;
  /** Đường cột chống (tọa độ v cục bộ) cần chừa; hàng xe xếp giữa các cột. */
  postLines: readonly number[] | null;
  /** Vùng cho phép theo u: [min, max]. */
  uRange: [number, number] | null;
  /** Giới hạn v cho nhà nhiều tầng: chỉ phần tầng trệt hở. */
  vRange: [number, number] | null;
}

/** Chỗ đậu xe máy: ba nhà xe (kind 'parking') + bãi trong layout.parking chưa trùng nhà xe nào. */
function bikeLots(): BikeLot[] {
  const lots: BikeLot[] = [];
  const parkingBuildings = campus.buildings.filter((b) => b.kind === 'parking');
  for (const b of parkingBuildings) {
    const { maxU, maxV } = computePrincipalAxis(b.shape.outer);
    if (b.id === 'nha-xe-can-tin') {
      lots.push({
        outer: b.shape.outer,
        deckY: CANTEEN_PARKING_DECK,
        postLines: [0, 0.45, maxV / 2, maxV - 0.45, maxV],
        uRange: [1, maxU - 1],
        vRange: null,
      });
    } else if (b.id === 'nha-xe-b5') {
      lots.push({
        outer: b.shape.outer,
        postLines: [0, 1, 2, 3, 4, 5].map((c) => (maxV * c) / 5),
        uRange: [1, maxU - 1],
        vRange: null,
      });
    } else if (b.id === 'nha-xe-2-tang') {
      // Tầng trên (sàn y = 2.7) chiếm u >= 11, phần dưới là khối hầm kín: chỉ đậu ở phần tầng trệt hở (u < 10.5)
      // phía trước dốc hầm (dốc + gờ ở v > maxV - 4.6).
      lots.push({ outer: b.shape.outer, postLines: null, uRange: [1.3, 9.6], vRange: [1.2, maxV - 4.7] });
    } else {
      lots.push({ outer: b.shape.outer, postLines: null, uRange: [1, maxU - 1], vRange: [1, maxV - 1] });
    }
  }
  for (const p of campus.layout.parking) {
    const mid = p.reduce<Vec2>((s, q) => [s[0] + q[0] / p.length, s[1] + q[1] / p.length], [0, 0]);
    if (parkingBuildings.some((b) => pointInPolygon(b.shape.outer, mid[0], mid[1]))) continue;
    const { maxU, maxV } = computePrincipalAxis(p);
    lots.push({ outer: p, postLines: null, uRange: [1, maxU - 1], vRange: [1, maxV - 1] });
  }
  return lots;
}

/** Hàng (tọa độ v) giữa các cột: gap ≥ 4.4 m → 2 hàng cách 2.2 m, gap ≥ 2.6 m → 1 hàng. */
function rowsBetweenPosts(lines: readonly number[]): number[] {
  const rows: number[] = [];
  const sorted = [...lines].sort((p, q) => p - q);
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i] ?? 0;
    const b = sorted[i + 1] ?? 0;
    const gap = b - a;
    const mid = (a + b) / 2;
    if (gap >= 4.4) rows.push(mid - BIKE_ROW_PITCH / 2, mid + BIKE_ROW_PITCH / 2);
    else if (gap >= 2.6) rows.push(mid);
  }
  return rows;
}

function bikePlacements(): BikePlacement[] {
  const slots: BikePlacement[] = [];
  let lotIndex = 0;
  for (const lot of bikeLots()) {
    lotIndex++;
    const axis = computePrincipalAxis([...lot.outer]);
    const uMin = lot.uRange?.[0] ?? 1;
    const uMax = lot.uRange?.[1] ?? axis.maxU - 1;
    let rows: number[];
    if (lot.postLines) {
      rows = rowsBetweenPosts(lot.postLines);
    } else {
      rows = [];
      const v0 = lot.vRange?.[0] ?? 1;
      const v1 = lot.vRange?.[1] ?? axis.maxV - 1;
      for (let v = v0 + BIKE_HALF_LENGTH; v + BIKE_HALF_LENGTH <= v1 + 1e-6; v += BIKE_ROW_PITCH) rows.push(v);
    }
    rows.forEach((v, rowIdx) => {
      const heading = rowIdx % 2 === 0 ? 1 : -1;
      for (let u = uMin; u <= uMax + 1e-6; u += BIKE_SPACING) {
        const x = axis.originX + u * axis.ux + v * axis.vx;
        const z = axis.originZ + u * axis.uz + v * axis.vz;
        if (!pointInPolygon(lot.outer, x, z) || distToEdges(lot.outer, x, z) < BIKE_HALF_LENGTH) continue;
        const key = lotIndex * 1000 + rowIdx;
        const jitter = ((hash01(Math.round(u * 10), key) - 0.5) * 12 * Math.PI) / 180;
        const yaw = Math.atan2(axis.vx * heading, axis.vz * heading) + jitter;
        slots.push({
          x,
          y: lot.deckY ?? getGroundHeight(x, z),
          z,
          yaw,
          dark: hash01(Math.round(u * 10), key + 77) < 0.5,
        });
      }
    });
  }
  if (slots.length <= BIKE_MAX) return slots;
  // Thưa đều bằng băm cố định: chọn BIKE_MAX xe có giá trị băm nhỏ nhất.
  const ranked = slots.map((s, i) => ({ s, h: hash01(i, 4242) })).sort((p, q) => p.h - q.h);
  return ranked.slice(0, BIKE_MAX).map((r) => r.s);
}

/** Bảng "EIU": hướng pháp tuyến dọc theo đường vào cổng, đặt gần SIGN_TARGET trên đất trống. */
function signPlacement(mask: GrassMask): Placement {
  // Đường nội bộ dẫn vào cổng chính (road index 2): hướng của đoạn đầu (từ cổng vào trong).
  const road = campus.layout.roads.find(
    (r) => r.kind === 'internal' && r.points[0] && Math.hypot(r.points[0][0] - 273.8, r.points[0][1] + 53.6) < 1,
  );
  const a = road?.points[0] ?? [273.8, -53.6];
  const b = road?.points[1] ?? [238.4, -49.1];
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const yaw = Math.atan2(dx, dz);
  for (let r = 0; r <= 12; r += 1) {
    for (let k = 0; k < 8; k++) {
      const ang = (k / 8) * Math.PI * 2;
      const x = SIGN_TARGET[0] + Math.cos(ang) * r;
      const z = SIGN_TARGET[1] + Math.sin(ang) * r;
      if (isFree(mask, x, z, 1.8)) return place(x, z, yaw);
    }
  }
  return place(SIGN_TARGET[0], SIGN_TARGET[1], yaw);
}

let cachedStreetLayout: StreetLayout | null = null;

/** Toàn bộ vị trí phố xá (tính một lần và cache). */
export function buildStreetLayout(): StreetLayout {
  const mask = buildFreeMask();
  const lamps = lampPlacements(mask);
  const ring = ringBenches(mask);
  const canteen = canteenBenches(mask);
  const benches = [...ring, ...canteen];
  const bins: Placement[] = [];
  benches.forEach((bench, i) => {
    if (i % 2 !== 0) return;
    const bin = binBeside(mask, bench);
    if (bin) bins.push(bin);
  });
  bins.push(...bridgeBins(mask));
  return { lamps, benches, bins, bikes: bikePlacements(), sign: signPlacement(mask) };
}

/** Trả bản cache duy nhất của StreetLayout để dùng chung giữa StreetProps và hệ tương tác ghế đá. */
export function getStreetLayout(): StreetLayout {
  if (!cachedStreetLayout) {
    cachedStreetLayout = buildStreetLayout();
  }
  return cachedStreetLayout;
}
