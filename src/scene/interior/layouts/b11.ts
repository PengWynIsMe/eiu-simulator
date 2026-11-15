import type { Vec2 } from '../../../types';
import type {
  ExteriorEntrance,
  InteractivePoint,
  InteriorLayout,
  RoomArea,
  WallSegment,
} from '../types';

/**
 * Hệ tọa độ địa phương Block 11 (B11) — khớp 100% đa giác OSM r21266052 trong layout.json:
 * - B11_EX: vector đơn vị hướng Đông (+u, dọc theo chiều dài tòa nhà ~147 m, nghiêng -9.72° so với +X)
 * - B11_EV: vector đơn vị hướng Nam (+v, cắt ngang hai cánh Bắc–Nam: v = -148.1 ngoài Bắc -> -103.45 ngoài Nam)
 */
export const B11_EX: readonly [number, number] = [0.985642036, -0.168848383];
export const B11_EV: readonly [number, number] = [0.168848383, 0.985642036];
export const B11_ROTATION_Y = Math.atan2(-B11_EX[1], B11_EX[0]); // ~ +0.1696 rad (+9.72°)

export function b11ToWorld(u: number, v: number): Vec2 {
  return [
    u * B11_EX[0] + v * B11_EV[0],
    u * B11_EX[1] + v * B11_EV[1],
  ];
}

export function b11ToLocal(x: number, z: number): [number, number] {
  return [
    x * B11_EX[0] + z * B11_EX[1],
    x * B11_EV[0] + z * B11_EV[1],
  ];
}

/** Các mốc tọa độ kết cấu chuẩn (m) theo OSM r21266052 & 4 sơ đồ thoát hiểm thực tế */
export const B11_BOUNDS = {
  // Trục Đông-Tây (u)
  uNwOut: -7.6,
  uNwWcSplit: -0.6,
  uWOut: 1.35,
  uWCyStart: 8.2,
  uMidStairW: 55.5,
  uWCyEnd: 61.3,
  uBridgeE: 64.95,
  uElevE: 69.55,
  uMidNE: 68.5,
  uEStairTip: 108.05,
  uECyEnd: 115.35,
  uEMainOut: 121.55,
  uNeOut: 139.3,
  // Trục Bắc-Nam (v)
  vNOut: -148.1,
  vNCorrIn: -136.0,
  vCyN: -132.3,
  vCyS: -120.6,
  vSCorrIn: -116.9,
  vSOut: -103.45,
} as const;

export const B11_ORIGIN: Vec2 = b11ToWorld(B11_BOUNDS.uWOut, B11_BOUNDS.vNOut);

/** Hai lỗ sân trong chuẩn (phù hợp exact OSM holes của B11) */
export const B11_WEST_HOLE_UV: readonly Vec2[] = [
  [8.2, -132.3],
  [61.3, -132.3],
  [61.3, -120.4],
  [8.2, -120.4],
];

export const B11_EAST_HOLE_UV: readonly Vec2[] = [
  [64.95, -132.3],
  [115.35, -132.3],
  [115.35, -129.6],
  [108.05, -129.6],
  [108.05, -123.7],
  [115.35, -123.7],
  [115.35, -120.9],
  [64.95, -120.9],
  [64.95, -125.0],
  [69.55, -125.0],
  [69.55, -129.0],
  [64.95, -129.0],
];

/** Các bồn cây xây nổi giữa sân trong tầng trệt (khớp ảnh thực tế sân trong B11) */
export interface CourtyardBed {
  readonly minU: number;
  readonly maxU: number;
  readonly minV: number;
  readonly maxV: number;
  readonly courtyard: 'west' | 'east';
}

export const B11_TREE_BEDS: readonly CourtyardBed[] = [
  { minU: 15.5, maxU: 24.5, minV: -128.1, maxV: -124.7, courtyard: 'west' },
  { minU: 30.0, maxU: 39.0, minV: -128.1, maxV: -124.7, courtyard: 'west' },
  { minU: 44.5, maxU: 53.5, minV: -128.1, maxV: -124.7, courtyard: 'west' },
  { minU: 76.0, maxU: 85.0, minV: -128.3, maxV: -124.9, courtyard: 'east' },
  { minU: 92.0, maxU: 101.0, minV: -128.3, maxV: -124.9, courtyard: 'east' },
];

/** Tọa độ trục U của hàng cột hành lang Bắc–Nam dọc 2 sân trong */
export const B11_COLUMN_US: readonly number[] = [
  1.5, 8.2, 16.0, 23.8, 31.6, 39.4, 47.2, 55.2, 61.3, 64.95, 68.5, 77.8, 87.2, 96.6, 106.0, 115.35, 121.4,
];

/** Các nhịp băng ghế đá dài nối liền từng cặp cột kế tiếp dọc 2 sân trong tầng trệt (trừ các lối đi chính) */
export const B11_BENCH_SPANS: readonly { readonly u1: number; readonly u2: number }[] = [
  { u1: 8.2, u2: 16.0 },
  { u1: 16.0, u2: 23.8 },
  { u1: 23.8, u2: 31.6 },
  { u1: 31.6, u2: 39.4 },
  { u1: 39.4, u2: 47.2 },
  { u1: 47.2, u2: 55.2 },
  { u1: 68.5, u2: 77.8 },
  { u1: 77.8, u2: 87.2 },
  { u1: 87.2, u2: 96.6 },
  { u1: 96.6, u2: 106.0 },
];

/** Các nhịp khung lam chắn nắng nối khít từng cặp cột dọc hành lang Bắc & Nam 2 sân trong */
export const B11_LOUVER_SPANS: readonly { readonly u1: number; readonly u2: number }[] = [
  ...B11_BENCH_SPANS,
  { u1: 106.0, u2: 115.35 },
];

/** 5 lõi thang bộ + 1 lõi thang máy B11 */
export interface StairwellSpec {
  readonly id: string;
  readonly label: string;
  readonly minU: number;
  readonly maxU: number;
  readonly minV: number;
  readonly maxV: number;
  readonly orientation: 'ns' | 'ew';
}

export const B11_STAIRWELLS: readonly StairwellSpec[] = [
  { id: 'nw', label: 'Thang bộ Tây Bắc', minU: -0.6, maxU: 8.2, minV: -148.1, maxV: -136.0, orientation: 'ew' },
  { id: 'sw', label: 'Thang bộ Tây Nam', minU: 1.35, maxU: 8.2, minV: -116.9, maxV: -103.45, orientation: 'ew' },
  { id: 'mn', label: 'Thang bộ giữa (Bắc)', minU: 55.5, maxU: 61.3, minV: -148.1, maxV: -136.0, orientation: 'ew' },
  { id: 'ms', label: 'Thang bộ giữa (Nam)', minU: 55.5, maxU: 61.3, minV: -116.9, maxV: -103.45, orientation: 'ew' },
  { id: 'east', label: 'Thang bộ lớn phía Đông', minU: 108.05, maxU: 115.35, minV: -129.6, maxV: -123.7, orientation: 'ew' },
];

/** Tủ PCCC (chứa cuộn vòi + bình chữa cháy) đặt chuẩn tại các đầu hồi cầu thang sân trong */
export const B11_PCCC_POINTS: readonly { readonly u: number; readonly v: number; readonly facingYawDeg: number }[] = [
  { u: 9.2, v: -135.75, facingYawDeg: 0 },
  { u: 54.6, v: -135.75, facingYawDeg: 0 },
  { u: 54.6, v: -117.15, facingYawDeg: 180 },
  { u: 114.6, v: -135.75, facingYawDeg: 0 },
  { u: 115.5, v: -123.0, facingYawDeg: -90 },
  { u: 61.6, v: -131.5, facingYawDeg: 90 },
];

/** Hộp thang máy (trên cầu nối giữa, mặt cửa quay về Tây u = 64.95) */
export const B11_ELEVATOR_LOCAL: [number, number] = [64.3, -127.0];
export const B11_ELEVATOR_WORLD: Vec2 = b11ToWorld(B11_ELEVATOR_LOCAL[0], B11_ELEVATOR_LOCAL[1]);
export const B11_ELEVATOR_SPAWN_LOCAL: [number, number] = [63.0, -127.0];
export const B11_ELEVATOR_SPAWN_WORLD: Vec2 = b11ToWorld(B11_ELEVATOR_SPAWN_LOCAL[0], B11_ELEVATOR_SPAWN_LOCAL[1]);

/** Phòng CLB Bóng bàn 410.B11 trên tầng 4 (ảnh a4045894) */
export const B11_PINGPONG_BOUNDS = {
  minU: 68.5,
  maxU: 77.87,
  minV: -148.1,
  maxV: -136.0,
} as const;

// =============================================================================
// 5 LỐI VÀO / RA NGOÀI KHUÔN VIÊN (KHỚP HÀNH LANG MÁI CHE & SẢNH THỰC TẾ)
// =============================================================================

const DOOR_NORTH_OUT = b11ToWorld(57.2, -149.4);
const DOOR_NORTH_IN = b11ToWorld(57.2, -145.2);

const DOOR_EAST_OUT = b11ToWorld(123.2, -125.6);
const DOOR_EAST_IN = b11ToWorld(118.8, -125.6);

const DOOR_WEST_OUT = b11ToWorld(-0.4, -126.5);
const DOOR_WEST_IN = b11ToWorld(4.2, -126.5);

const DOOR_SOUTH_W_OUT = b11ToWorld(31.0, -101.9);
const DOOR_SOUTH_W_IN = b11ToWorld(31.0, -106.2);

const DOOR_SOUTH_E_OUT = b11ToWorld(88.0, -101.9);
const DOOR_SOUTH_E_IN = b11ToWorld(88.0, -106.2);

const DOOR_SOUTH_MID_OUT = b11ToWorld(57.2, -102.0);
const DOOR_SOUTH_MID_IN = b11ToWorld(57.2, -106.0);

export const b11ExteriorEntrances: readonly ExteriorEntrance[] = [
  {
    id: 'exterior-b11-north',
    buildingId: 'b11',
    worldPos: DOOR_NORTH_OUT,
    radius: 4.0,
    label: 'Vào Block 11 (Lối mái che từ Block 8)',
    spawnInsideWorld: DOOR_NORTH_IN,
    spawnInsideYaw: Math.PI / 2,
    spawnOutsideWorld: DOOR_NORTH_OUT,
    spawnOutsideYaw: -Math.PI / 2,
  },
  {
    id: 'exterior-b11-east',
    buildingId: 'b11',
    worldPos: DOOR_EAST_OUT,
    radius: 4.0,
    label: 'Vào Block 11 (Sảnh thang bộ Đông — hướng Nhà xe)',
    spawnInsideWorld: DOOR_EAST_IN,
    spawnInsideYaw: Math.PI,
    spawnOutsideWorld: DOOR_EAST_OUT,
    spawnOutsideYaw: 0,
  },
  {
    id: 'exterior-b11-west',
    buildingId: 'b11',
    worldPos: DOOR_WEST_OUT,
    radius: 4.0,
    label: 'Vào Block 11 (Sảnh Tây — hướng Block 10)',
    spawnInsideWorld: DOOR_WEST_IN,
    spawnInsideYaw: 0,
    spawnOutsideWorld: DOOR_WEST_OUT,
    spawnOutsideYaw: Math.PI,
  },
  {
    id: 'exterior-b11-south-west',
    buildingId: 'b11',
    worldPos: DOOR_SOUTH_W_OUT,
    radius: 4.0,
    label: 'Vào Block 11 (Sảnh Nam Tây — Mái kính DatBike 103)',
    spawnInsideWorld: DOOR_SOUTH_W_IN,
    spawnInsideYaw: -Math.PI / 2,
    spawnOutsideWorld: DOOR_SOUTH_W_OUT,
    spawnOutsideYaw: Math.PI / 2,
  },
  {
    id: 'exterior-b11-south-east',
    buildingId: 'b11',
    worldPos: DOOR_SOUTH_E_OUT,
    radius: 4.0,
    label: 'Vào Block 11 (Sảnh Nam Đông — Mái kính DatBike 101)',
    spawnInsideWorld: DOOR_SOUTH_E_IN,
    spawnInsideYaw: -Math.PI / 2,
    spawnOutsideWorld: DOOR_SOUTH_E_OUT,
    spawnOutsideYaw: Math.PI / 2,
  },
  {
    id: 'exterior-b11-south-mid',
    buildingId: 'b11',
    worldPos: DOOR_SOUTH_MID_OUT,
    radius: 4.0,
    label: 'Vào Block 11 (Sảnh cầu thang giữa Nam — hướng Block 4)',
    spawnInsideWorld: DOOR_SOUTH_MID_IN,
    spawnInsideYaw: -Math.PI / 2,
    spawnOutsideWorld: DOOR_SOUTH_MID_OUT,
    spawnOutsideYaw: Math.PI / 2,
  },
];

// =============================================================================
// BỘ SINH DỮ LIỆU PHÒNG & TƯỜNG CHUẨN TỪ 4 SƠ ĐỒ THOÁT HIỂM
// =============================================================================

interface RoomBaySpec {
  readonly code: string;
  readonly name: string;
  readonly minU: number;
  readonly maxU: number;
  readonly glassCorridor?: boolean;
  readonly doorCount?: number;
}

function makeUniformBays(
  specs: readonly { readonly code: string; readonly name: string }[],
  startU: number,
  endU: number,
  glassCorridor = true
): RoomBaySpec[] {
  const step = (endU - startU) / specs.length;
  return specs.map((spec, idx) => ({
    code: spec.code,
    name: spec.name,
    minU: +(startU + idx * step).toFixed(2),
    maxU: +(startU + (idx + 1) * step).toFixed(2),
    glassCorridor,
  }));
}

/**
 * Cắt mặt tiền hành lang của 1 phòng thành mảng trụ tường nâu sẫm, khoảng hở cửa ra vào (2.0 m),
 * và ô kính trong suốt để người chơi nhìn thấy bên trong phòng (như ảnh dbfc837a và 410.B11).
 */
function addFrontCorridorWall(
  walls: WallSegment[],
  minU: number,
  maxU: number,
  vWall: number,
  doorCount = 1,
  withGlass = true
): void {
  const span = maxU - minU;
  if (span <= 2.4) return;

  const doorHalf = 0.95;
  const count = Math.max(1, Math.min(doorCount, Math.floor(span / 4.2)));
  const doors: [number, number][] = [];

  for (let i = 0; i < count; i++) {
    const center =
      count === 1
        ? minU + Math.min(2.2, span * 0.32)
        : minU + ((i + 0.5) / count) * span;
    const d1 = Math.max(minU + 0.5, center - doorHalf);
    const d2 = Math.min(maxU - 0.5, center + doorHalf);
    doors.push([+d1.toFixed(2), +d2.toFixed(2)]);
  }

  let cursor = minU;
  for (const [d1, d2] of doors) {
    if (d1 > cursor + 0.15) {
      if (withGlass && d1 - cursor > 2.4) {
        walls.push({ u1: cursor, v1: vWall, u2: +(cursor + 0.85).toFixed(2), v2: vWall, thickness: 0.2 });
        walls.push({ u1: +(cursor + 0.85).toFixed(2), v1: vWall, u2: +(d1 - 0.55).toFixed(2), v2: vWall, thickness: 0.1, isGlass: true });
        walls.push({ u1: +(d1 - 0.55).toFixed(2), v1: vWall, u2: d1, v2: vWall, thickness: 0.2 });
      } else {
        walls.push({ u1: cursor, v1: vWall, u2: d1, v2: vWall, thickness: 0.2 });
      }
    }
    cursor = d2;
  }

  if (maxU > cursor + 0.15) {
    if (withGlass && maxU - cursor > 2.4) {
      walls.push({ u1: cursor, v1: vWall, u2: +(cursor + 0.55).toFixed(2), v2: vWall, thickness: 0.2 });
      walls.push({ u1: +(cursor + 0.55).toFixed(2), v1: vWall, u2: +(maxU - 0.85).toFixed(2), v2: vWall, thickness: 0.1, isGlass: true });
      walls.push({ u1: +(maxU - 0.85).toFixed(2), v1: vWall, u2: maxU, v2: vWall, thickness: 0.2 });
    } else {
      walls.push({ u1: cursor, v1: vWall, u2: maxU, v2: vWall, thickness: 0.2 });
    }
  }
}

function buildWingRoomsAndWalls(
  floor: number,
  northBays: readonly RoomBaySpec[],
  southBays: readonly RoomBaySpec[],
  southWallDoors?: readonly { readonly u1: number; readonly u2: number }[]
): { readonly rooms: RoomArea[]; readonly walls: WallSegment[] } {
  const B = B11_BOUNDS;
  const rooms: RoomArea[] = [];
  const walls: WallSegment[] = [];

  // 1. Tường bao ngoài cánh Bắc (có lối thông cầu thang giữa hướng B8 tầng 1 & vách kính giếng thang tầng 2–4)
  if (floor === 1) {
    walls.push({ u1: B.uNwOut, v1: B.vNOut, u2: 55.6, v2: B.vNOut, thickness: 0.3 });
    walls.push({ u1: 58.8, v1: B.vNOut, u2: 61.2, v2: B.vNOut, thickness: 0.25, isRailing: true });
    walls.push({ u1: 61.2, v1: B.vNOut, u2: B.uNeOut, v2: B.vNOut, thickness: 0.3 });
  } else {
    walls.push({ u1: B.uNwOut, v1: B.vNOut, u2: 55.6, v2: B.vNOut, thickness: 0.3 });
    walls.push({ u1: 55.6, v1: B.vNOut, u2: 61.2, v2: B.vNOut, thickness: 0.1, isGlass: true });
    walls.push({ u1: 61.2, v1: B.vNOut, u2: B.uNeOut, v2: B.vNOut, thickness: 0.3 });
  }

  // Hai chái WC Tây Bắc & Đông Bắc
  walls.push({ u1: B.uNwOut, v1: B.vNOut, u2: B.uNwOut, v2: B.vCyN, thickness: 0.3 });
  walls.push({ u1: B.uNwOut, v1: B.vCyN, u2: B.uWOut, v2: B.vCyN, thickness: 0.3 });

  walls.push({ u1: B.uNeOut, v1: B.vNOut, u2: B.uNeOut, v2: B.vCyN, thickness: 0.3 });
  walls.push({ u1: B.uEMainOut, v1: B.vCyN, u2: B.uNeOut, v2: B.vCyN, thickness: 0.3 });

  // Tường bao Tây & Đông giữa 2 cánh
  if (floor === 1) {
    // Sảnh Tây tầng 1 mở rộng ra khuôn viên [v = -130.0..-123.0]
    walls.push({ u1: B.uWOut, v1: B.vCyN, u2: B.uWOut, v2: -130.0, thickness: 0.3 });
    walls.push({ u1: B.uWOut, v1: -123.0, u2: B.uWOut, v2: B.vSOut, thickness: 0.3 });
    // Sảnh Đông tầng 1 mở ra lối đi mái che [v = -128.0..-123.5]
    walls.push({ u1: B.uEMainOut, v1: B.vCyN, u2: B.uEMainOut, v2: -128.0, thickness: 0.3 });
    walls.push({ u1: B.uEMainOut, v1: -123.5, u2: B.uEMainOut, v2: B.vSOut, thickness: 0.3 });
  } else {
    walls.push({ u1: B.uWOut, v1: B.vCyN, u2: B.uWOut, v2: B.vSOut, thickness: 0.3 });
    walls.push({ u1: B.uEMainOut, v1: B.vCyN, u2: B.uEMainOut, v2: B.vSOut, thickness: 0.3 });
  }

  // Tường bao ngoài cánh Nam (có 2 cửa sảnh mái kính + lối thông thang giữa hướng B4 trên tầng 1 & kính giếng thang tầng 2–4)
  if (floor === 1 && southWallDoors && southWallDoors.length > 0) {
    let cursor: number = B.uWOut;
    for (const d of southWallDoors) {
      if (d.u1 > cursor) walls.push({ u1: cursor, v1: B.vSOut, u2: d.u1, v2: B.vSOut, thickness: 0.3 });
      cursor = d.u2;
    }
    if (cursor < B.uEMainOut) walls.push({ u1: cursor, v1: B.vSOut, u2: B.uEMainOut, v2: B.vSOut, thickness: 0.3 });
    walls.push({ u1: 58.8, v1: B.vSOut, u2: 61.2, v2: B.vSOut, thickness: 0.25, isRailing: true });
  } else {
    walls.push({ u1: B.uWOut, v1: B.vSOut, u2: 55.6, v2: B.vSOut, thickness: 0.3 });
    walls.push({ u1: 55.6, v1: B.vSOut, u2: 61.2, v2: B.vSOut, thickness: 0.1, isGlass: true });
    walls.push({ u1: 61.2, v1: B.vSOut, u2: B.uEMainOut, v2: B.vSOut, thickness: 0.3 });
  }

  // 2. Cụm WC Tây Bắc & Đông Bắc cố định mọi tầng
  const floorTag = floor === 1 ? 'Trệt' : `T.${floor}`;
  rooms.push({
    code: `WC-TB.B11`,
    name: `Nhà vệ sinh Tây Bắc (${floorTag})`,
    minU: B.uNwOut,
    maxU: B.uNwWcSplit,
    minV: B.vNOut,
    maxV: B.vNCorrIn,
  });
  walls.push({ u1: B.uNwWcSplit, v1: B.vNOut, u2: B.uNwWcSplit, v2: B.vNCorrIn, thickness: 0.2 });
  addFrontCorridorWall(walls, B.uNwOut, B.uNwWcSplit, B.vNCorrIn, 1, false);

  rooms.push({
    code: 'Thang TB',
    name: 'Thang bộ Tây Bắc',
    minU: B.uNwWcSplit,
    maxU: B.uWCyStart,
    minV: B.vNOut,
    maxV: B.vNCorrIn,
  });
  walls.push({ u1: B.uWCyStart, v1: B.vNOut, u2: B.uWCyStart, v2: B.vNCorrIn, thickness: 0.22 });

  rooms.push({
    code: `WC-ĐB.B11`,
    name: `Khu Nhà vệ sinh đôi Đông Bắc (${floorTag})`,
    minU: B.uEMainOut,
    maxU: B.uNeOut,
    minV: B.vNOut,
    maxV: B.vNCorrIn,
  });
  walls.push({ u1: B.uEMainOut, v1: B.vNOut, u2: B.uEMainOut, v2: B.vNCorrIn, thickness: 0.2 });
  walls.push({ u1: 130.4, v1: B.vNOut, u2: 130.4, v2: B.vNCorrIn, thickness: 0.15 });
  addFrontCorridorWall(walls, B.uEMainOut, 130.4, B.vNCorrIn, 1, false);
  addFrontCorridorWall(walls, 130.4, B.uNeOut, B.vNCorrIn, 1, false);

  // Thang bộ giữa Bắc, Tây Nam, giữa Nam
  rooms.push({ code: 'Thang G-B', name: 'Thang bộ giữa (Bắc)', minU: B.uMidStairW, maxU: B.uWCyEnd, minV: B.vNOut, maxV: B.vNCorrIn });
  walls.push({ u1: B.uMidStairW, v1: B.vNOut, u2: B.uMidStairW, v2: B.vNCorrIn, thickness: 0.22 });
  walls.push({ u1: B.uWCyEnd, v1: B.vNOut, u2: B.uWCyEnd, v2: B.vNCorrIn, thickness: 0.22 });

  rooms.push({ code: 'Thang TN', name: 'Thang bộ Tây Nam', minU: B.uWOut, maxU: B.uWCyStart, minV: B.vSCorrIn, maxV: B.vSOut });
  walls.push({ u1: B.uWCyStart, v1: B.vSCorrIn, u2: B.uWCyStart, v2: B.vSOut, thickness: 0.22 });

  rooms.push({ code: 'Thang G-N', name: 'Thang bộ giữa (Nam)', minU: B.uMidStairW, maxU: B.uWCyEnd, minV: B.vSCorrIn, maxV: B.vSOut });
  walls.push({ u1: B.uMidStairW, v1: B.vSCorrIn, u2: B.uMidStairW, v2: B.vSOut, thickness: 0.22 });
  walls.push({ u1: B.uWCyEnd, v1: B.vSCorrIn, u2: B.uWCyEnd, v2: B.vSOut, thickness: 0.22 });

  // Sảnh thang máy, Thang bộ Đông & hành lang nối
  rooms.push({ code: 'Sảnh TM', name: 'Cầu nối giữa & Thang máy Block 11', minU: B.uWCyEnd, maxU: B.uBridgeE, minV: B.vCyN, maxV: B.vCyS });
  rooms.push({ code: 'Thang Đông', name: 'Sảnh Thang bộ lớn phía Đông', minU: B.uEStairTip, maxU: B.uEMainOut, minV: B.vCyN, maxV: B.vCyS });
  if (floor === 1) {
    rooms.push({ code: 'Sân Tây', name: 'Sảnh Tây & Sân trong phía Tây', minU: B.uWCyStart, maxU: B.uWCyEnd, minV: B.vCyN, maxV: B.vCyS });
    rooms.push({ code: 'Sân Đông', name: 'Sân trong phía Đông', minU: B.uBridgeE, maxU: B.uEStairTip, minV: B.vCyN, maxV: B.vCyS });
  }

  // 3. Phòng học Cánh Bắc
  for (let i = 0; i < northBays.length; i++) {
    const bay = northBays[i];
    if (!bay) continue;
    rooms.push({
      code: bay.code,
      name: bay.name,
      minU: bay.minU,
      maxU: bay.maxU,
      minV: B.vNOut,
      maxV: B.vNCorrIn,
    });
    walls.push({ u1: bay.maxU, v1: B.vNOut, u2: bay.maxU, v2: B.vNCorrIn, thickness: 0.2 });
    addFrontCorridorWall(walls, bay.minU, bay.maxU, B.vNCorrIn, bay.doorCount ?? 1, bay.glassCorridor ?? true);
  }

  // 4. Phòng học Cánh Nam
  for (let i = 0; i < southBays.length; i++) {
    const bay = southBays[i];
    if (!bay) continue;
    rooms.push({
      code: bay.code,
      name: bay.name,
      minU: bay.minU,
      maxU: bay.maxU,
      minV: B.vSCorrIn,
      maxV: B.vSOut,
    });
    walls.push({ u1: bay.maxU, v1: B.vSCorrIn, u2: bay.maxU, v2: B.vSOut, thickness: 0.2 });
    addFrontCorridorWall(walls, bay.minU, bay.maxU, B.vSCorrIn, bay.doorCount ?? 1, bay.glassCorridor ?? true);
  }

  // 5. Lõi thang máy nhô vào sân trong Đông [64.95..69.55 x -129.0..-125.0], cửa quay Tây
  walls.push({ u1: B.uBridgeE, v1: -129.0, u2: B.uElevE, v2: -129.0, thickness: 0.25 });
  walls.push({ u1: B.uElevE, v1: -129.0, u2: B.uElevE, v2: -125.0, thickness: 0.25 });
  walls.push({ u1: B.uBridgeE, v1: -125.0, u2: B.uElevE, v2: -125.0, thickness: 0.25 });
  walls.push({ u1: B.uBridgeE, v1: -129.0, u2: B.uBridgeE, v2: -128.1, thickness: 0.22 });
  walls.push({ u1: B.uBridgeE, v1: -125.9, u2: B.uBridgeE, v2: -125.0, thickness: 0.22 });

  // 6. Lan can inox 4 thanh dọc 2 sân trong trên tầng 2–4 hoặc bồn cây tầng 1
  if (floor === 1) {
    // Ranh giới va chạm bồn cây & dải ghế đá nối liền cột ở tầng trệt (được render ở B11Furniture)
    for (const bed of B11_TREE_BEDS) {
      walls.push({ u1: bed.minU, v1: bed.minV, u2: bed.maxU, v2: bed.minV, thickness: 0.22, isRailing: true });
      walls.push({ u1: bed.minU, v1: bed.maxV, u2: bed.maxU, v2: bed.maxV, thickness: 0.22, isRailing: true });
      walls.push({ u1: bed.minU, v1: bed.minV, u2: bed.minU, v2: bed.maxV, thickness: 0.22, isRailing: true });
      walls.push({ u1: bed.maxU, v1: bed.minV, u2: bed.maxU, v2: bed.maxV, thickness: 0.22, isRailing: true });
    }
    for (const span of B11_BENCH_SPANS) {
      walls.push({ u1: span.u1 + 0.23, v1: B.vCyN, u2: span.u2 - 0.23, v2: B.vCyN, thickness: 0.54, isRailing: true });
      walls.push({ u1: span.u1 + 0.23, v1: B.vCyS, u2: span.u2 - 0.23, v2: B.vCyS, thickness: 0.54, isRailing: true });
    }
    // Chặn va chạm dưới vế 1 cầu thang giữa (để vế 2 bên Tây u = 55.6..58.5 vẫn đi thông suốt ra B4/B8)
    walls.push({ u1: 58.6, v1: -144.8, u2: 61.1, v2: -144.8, thickness: 0.2, isRailing: true });
    walls.push({ u1: 58.6, v1: -144.8, u2: 58.6, v2: -137.0, thickness: 0.2, isRailing: true });
    walls.push({ u1: 58.6, v1: -108.1, u2: 61.1, v2: -108.1, thickness: 0.2, isRailing: true });
    walls.push({ u1: 58.6, v1: -115.9, u2: 58.6, v2: -108.1, thickness: 0.2, isRailing: true });
  } else {
    // Ranh giới an toàn lỗ thông giếng thang giữa Bắc & Nam trên tầng 2–4
    walls.push({ u1: 55.6, v1: -137.0, u2: 61.2, v2: -137.0, thickness: 0.15, isRailing: true });
    walls.push({ u1: 55.6, v1: -115.9, u2: 61.2, v2: -115.9, thickness: 0.15, isRailing: true });
    // Sân trong Tây [8.2..61.3 x -132.3..-120.4]
    walls.push({ u1: 8.2, v1: -132.3, u2: 61.3, v2: -132.3, thickness: 0.15, isRailing: true });
    walls.push({ u1: 8.2, v1: -120.4, u2: 61.3, v2: -120.4, thickness: 0.15, isRailing: true });
    walls.push({ u1: 8.2, v1: -132.3, u2: 8.2, v2: -120.4, thickness: 0.15, isRailing: true });
    walls.push({ u1: 61.3, v1: -132.3, u2: 61.3, v2: -120.4, thickness: 0.15, isRailing: true });

    // Sân trong Đông [64.95..115.35 x -132.3..-120.9] vòng quanh lõi thang máy & thang bộ Đông
    walls.push({ u1: 64.95, v1: -132.3, u2: 115.35, v2: -132.3, thickness: 0.15, isRailing: true });
    walls.push({ u1: 64.95, v1: -120.9, u2: 115.35, v2: -120.9, thickness: 0.15, isRailing: true });
    walls.push({ u1: 64.95, v1: -132.3, u2: 64.95, v2: -129.0, thickness: 0.15, isRailing: true });
    walls.push({ u1: 64.95, v1: -125.0, u2: 64.95, v2: -120.9, thickness: 0.15, isRailing: true });
    walls.push({ u1: 115.35, v1: -132.3, u2: 115.35, v2: -129.6, thickness: 0.15, isRailing: true });
    walls.push({ u1: 115.35, v1: -123.7, u2: 115.35, v2: -120.9, thickness: 0.15, isRailing: true });
    // Lan can vịnh thang bộ Đông
    walls.push({ u1: 108.05, v1: -129.6, u2: 115.35, v2: -129.6, thickness: 0.15, isRailing: true });
    walls.push({ u1: 108.05, v1: -129.6, u2: 108.05, v2: -123.7, thickness: 0.15, isRailing: true });
    walls.push({ u1: 108.05, v1: -123.7, u2: 115.35, v2: -123.7, thickness: 0.15, isRailing: true });
  }

  return { rooms, walls };
}

// =============================================================================
// DỮ LIỆU TỪNG TẦNG 1 -> 4 (ĐỐI CHIẾU 100% 4 SƠ ĐỒ PCCC BLOCK 11)
// =============================================================================

const FLOOR_1_DATA = buildWingRoomsAndWalls(
  1,
  [
    { code: '108.B11', name: 'Phòng Thí nghiệm 4.0 (Khu Tây)', minU: 8.2, maxU: 55.5, doorCount: 4, glassCorridor: true },
    { code: '106.B11', name: 'Phòng Hỗ trợ & Kỹ thuật 106', minU: 61.3, maxU: 68.5, doorCount: 1, glassCorridor: true },
    { code: '104.B11', name: 'Phòng Thí nghiệm Công nghệ 4.0 (IIC)', minU: 68.5, maxU: 106.0, doorCount: 3, glassCorridor: true },
    { code: '102.B11', name: 'Phòng Kỹ thuật (102.B11)', minU: 106.0, maxU: 115.35, doorCount: 1, glassCorridor: false },
  ],
  [
    { code: '103.B11', name: 'Công ty Khởi nghiệp DatBike (Khu Tây)', minU: 8.2, maxU: 55.5, doorCount: 3, glassCorridor: true },
    { code: '101.B11', name: 'Công ty Khởi nghiệp DatBike (Khu Đông)', minU: 61.3, maxU: 121.55, doorCount: 4, glassCorridor: true },
  ],
  [
    { u1: 29.8, u2: 32.2 },
    { u1: 55.6, u2: 61.2 },
    { u1: 86.8, u2: 89.2 },
  ]
);

const FLOOR_2_DATA = buildWingRoomsAndWalls(
  2,
  [
    { code: '204.B11', name: 'Không gian STEM & Phòng chế tạo số EIU FabLab', minU: 8.2, maxU: 55.5, doorCount: 3, glassCorridor: true },
    { code: '202.B11', name: 'Phòng Thí nghiệm & Chế tạo thực hành (202.B11)', minU: 61.3, maxU: 115.35, doorCount: 3, glassCorridor: true },
  ],
  [
    { code: '217.B11', name: 'Phòng Thực hành Chiếu sáng (217.B11)', minU: 8.2, maxU: 19.5 },
    { code: '215.B11', name: 'Phòng Thực hành Kỹ thuật Điện (215.B11)', minU: 19.5, maxU: 28.5 },
    { code: '213.B11', name: 'Phòng Thực hành Kỹ thuật Điện tử (213.B11)', minU: 28.5, maxU: 37.5 },
    { code: '211.B11', name: 'Phòng Thực hành Lắp đặt Điện (211.B11)', minU: 37.5, maxU: 46.5 },
    { code: '209.B11', name: 'Phòng Thực hành PLC (209.B11)', minU: 46.5, maxU: 55.5 },
    { code: '207.B11', name: 'Phòng Thực hành 207.B11', minU: 61.3, maxU: 75.1 },
    { code: '205.B11', name: 'Phòng Thực hành 205.B11', minU: 75.1, maxU: 88.9 },
    { code: '203.B11', name: 'Phòng Thực hành 203.B11', minU: 88.9, maxU: 102.7 },
    { code: '201.B11', name: 'Khu Thực hành Mạch điện & Điện tử công suất (201.B11)', minU: 102.7, maxU: 121.55, doorCount: 2 },
  ]
);

const FLOOR_3_DATA = buildWingRoomsAndWalls(
  3,
  [
    ...makeUniformBays(
      [
        { code: '324.B11', name: 'Phòng 324.B11' },
        { code: '322.B11', name: 'Phòng 322.B11' },
        { code: '320.B11', name: 'Phòng 320.B11' },
        { code: '318.B11', name: 'Phòng 318.B11' },
        { code: '316.B11', name: 'Phòng 316.B11' },
        { code: '314.B11', name: 'Phòng 314.B11' },
      ],
      8.2,
      55.5
    ),
    { code: '312.B11', name: 'Phòng Hỗ trợ 312.B11', minU: 61.3, maxU: 68.5, glassCorridor: true },
    ...makeUniformBays(
      [
        { code: '310.B11', name: 'Văn phòng & Nghiên cứu 310.B11' },
        { code: '308.B11', name: 'Phòng thí nghiệm Năng lượng / Vật lý (308.B11)' },
        { code: '306.B11', name: 'Văn phòng Khoa Điều dưỡng / Sức khỏe (306.B11)' },
        { code: '304.B11', name: 'PERE Lab (304.B11)' },
        { code: '302.B11', name: 'Phòng Thực hành 302.B11' },
      ],
      68.5,
      115.35
    ),
  ],
  [
    ...makeUniformBays(
      [
        { code: '311.B11', name: 'Phòng học / Lab 311.B11' },
        { code: '309.B11', name: 'Phòng Thực hành Kỹ năng 309.B11' },
        { code: '307.B11', name: 'Skill Lab — Thực hành Điều dưỡng (307.B11)' },
      ],
      8.2,
      55.5
    ),
    ...makeUniformBays(
      [
        { code: '305B.B11', name: 'Phòng 305B.B11' },
        { code: '305A.B11', name: 'Phòng 305A.B11' },
        { code: '303B.B11', name: 'Phòng 303B.B11' },
        { code: '303A.B11', name: 'Phòng 303A.B11' },
        { code: '301B.B11', name: 'Phòng 301B.B11' },
        { code: '301A.B11', name: 'Khu Giảng đường / Phòng thi 301A.B11' },
      ],
      61.3,
      121.55
    ),
  ]
);

const FLOOR_4_DATA = buildWingRoomsAndWalls(
  4,
  [
    ...makeUniformBays(
      [
        { code: '424.B11', name: 'Phòng Lab Khoa CNTT (424.B11)' },
        { code: '422.B11', name: 'Phòng Thực hành (422.B11)' },
        { code: '420.B11', name: 'Phòng Thực hành (420.B11)' },
        { code: '418.B11', name: 'Phòng Thực hành (418.B11)' },
        { code: '416.B11', name: 'Văn phòng Khoa Kỹ thuật (416.B11)' },
        { code: '414.B11', name: 'Văn phòng Khoa Công nghệ Thông tin (414.B11)' },
      ],
      8.2,
      55.5
    ),
    { code: '412.B11', name: 'Phòng Hỗ trợ 412.B11', minU: 61.3, maxU: 68.5, glassCorridor: true },
    ...makeUniformBays(
      [
        { code: '410.B11', name: 'CLB Bóng bàn EIU (EIU Ping Pong Club) & PM AI (410.B11)' },
        { code: '408.B11', name: 'Phòng Máy tính CNTT (408.B11)' },
        { code: '406.B11', name: 'Phòng Máy tính CNTT (406.B11)' },
        { code: '404.B11', name: 'Phòng Thực hành Khoa CNTT (404.B11)' },
        { code: '402.B11', name: 'Phòng Thực hành Khoa CNTT (402.B11)' },
      ],
      68.5,
      115.35
    ),
  ],
  [
    { code: '415.B11', name: 'Không gian Đa năng / Dự phòng mở rộng (415.B11)', minU: 8.2, maxU: 35.0, doorCount: 2, glassCorridor: true },
    { code: '413.B11', name: 'Phòng Hội thảo / Thực hành lớn (413.B11)', minU: 35.0, maxU: 55.5, doorCount: 2, glassCorridor: true },
    ...makeUniformBays(
      [
        { code: '411.B11', name: 'Phòng 411.B11' },
        { code: '409.B11', name: 'Phòng 409.B11' },
        { code: '407.B11', name: 'Phòng 407.B11' },
        { code: '405.B11', name: 'Phòng 405.B11' },
        { code: '403.B11', name: 'Phòng 403.B11' },
        { code: '401.B11', name: 'Phòng 401.B11' },
      ],
      61.3,
      121.55
    ),
  ]
);

export function getFloorWalls(floor: number): readonly WallSegment[] {
  if (floor === 2) return FLOOR_2_DATA.walls;
  if (floor === 3) return FLOOR_3_DATA.walls;
  if (floor === 4) return FLOOR_4_DATA.walls;
  return FLOOR_1_DATA.walls;
}

export function getFloorRooms(floor: number): readonly RoomArea[] {
  if (floor === 2) return FLOOR_2_DATA.rooms;
  if (floor === 3) return FLOOR_3_DATA.rooms;
  if (floor === 4) return FLOOR_4_DATA.rooms;
  return FLOOR_1_DATA.rooms;
}

export function getFloorBoundaryPts(): Vec2[] {
  const B = B11_BOUNDS;
  return [
    b11ToWorld(B.uNwOut, B.vNOut),
    b11ToWorld(B.uNeOut, B.vNOut),
    b11ToWorld(B.uNeOut, B.vCyN),
    b11ToWorld(B.uEMainOut, B.vCyN),
    b11ToWorld(B.uEMainOut, B.vSOut),
    b11ToWorld(B.uWOut, B.vSOut),
    b11ToWorld(B.uWOut, B.vCyN),
    b11ToWorld(B.uNwOut, B.vCyN),
  ];
}

const B11_NORTH_STAIR_HOLE_UV: readonly Vec2[] = [
  [55.6, -148.0],
  [61.2, -148.0],
  [61.2, -137.0],
  [55.6, -137.0],
];

const B11_SOUTH_STAIR_HOLE_UV: readonly Vec2[] = [
  [55.6, -115.9],
  [61.2, -115.9],
  [61.2, -103.55],
  [55.6, -103.55],
];

export function getFloorHoles(floor: number): Vec2[][] {
  if (floor === 1) return [];
  return [
    B11_WEST_HOLE_UV.map(([u, v]) => b11ToWorld(u, v)),
    B11_EAST_HOLE_UV.map(([u, v]) => b11ToWorld(u, v)),
    B11_NORTH_STAIR_HOLE_UV.map(([u, v]) => b11ToWorld(u, v)),
    B11_SOUTH_STAIR_HOLE_UV.map(([u, v]) => b11ToWorld(u, v)),
  ];
}

// =============================================================================
// KIỂM TRA RANH GIỚI & VA CHẠM TƯỜNG (WALKABLE COLLISION)
// =============================================================================

function pointInPolyUV(u: number, v: number, poly: readonly Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (!a || !b) continue;
    if ((a[1] > v) !== (b[1] > v) && u < ((b[0] - a[0]) * (v - a[1])) / (b[1] - a[1]) + a[0]) {
      inside = !inside;
    }
  }
  return inside;
}

function distanceToSegment(u: number, v: number, u1: number, v1: number, u2: number, v2: number): number {
  const du = u2 - u1;
  const dv = v2 - v1;
  const lenSq = du * du + dv * dv;
  if (lenSq === 0) return Math.hypot(u - u1, v - v1);
  const t = Math.max(0, Math.min(1, ((u - u1) * du + (v - v1) * dv) / lenSq));
  return Math.hypot(u - (u1 + t * du), v - (v1 + t * dv));
}

function isInsideWalkableB11(u: number, v: number, floor: number): boolean {
  const B = B11_BOUNDS;
  const inMain = u >= B.uWOut && u <= B.uEMainOut && v >= B.vNOut && v <= B.vSOut;
  const inNwWing = u >= B.uNwOut && u < B.uWOut && v >= B.vNOut && v <= B.vCyN;
  const inNeWing = u > B.uEMainOut && u <= B.uNeOut && v >= B.vNOut && v <= B.vCyN;

  if (!inMain && !inNwWing && !inNeWing) return false;
  if (floor === 1) return true;

  // Tầng 2–4: loại trừ giếng trời sân trong Tây & Đông và 2 giếng chiếu nghỉ thang giữa
  if (pointInPolyUV(u, v, B11_WEST_HOLE_UV)) return false;
  if (pointInPolyUV(u, v, B11_EAST_HOLE_UV)) return false;
  if (pointInPolyUV(u, v, B11_NORTH_STAIR_HOLE_UV)) return false;
  if (pointInPolyUV(u, v, B11_SOUTH_STAIR_HOLE_UV)) return false;
  return true;
}

export function resolveInteriorPosition(
  nextX: number,
  nextZ: number,
  prevX: number,
  prevZ: number,
  floor: number,
  radius = 0.4
): Vec2 {
  const [nextU, nextV] = b11ToLocal(nextX, nextZ);
  const [prevU, prevV] = b11ToLocal(prevX, prevZ);

  let currentU = nextU;
  let currentV = nextV;

  if (!isInsideWalkableB11(currentU, currentV, floor)) {
    currentU = prevU;
    currentV = prevV;
  }

  const walls = getFloorWalls(floor);
  for (const wall of walls) {
    const minDist = radius + wall.thickness / 2;
    const dist = distanceToSegment(currentU, currentV, wall.u1, wall.v1, wall.u2, wall.v2);
    if (dist < minDist) {
      const du = wall.u2 - wall.u1;
      const dv = wall.v2 - wall.v1;
      const lenSq = du * du + dv * dv;
      if (lenSq > 0) {
        const t = Math.max(0, Math.min(1, ((currentU - wall.u1) * du + (currentV - wall.v1) * dv) / lenSq));
        const projU = wall.u1 + t * du;
        const projV = wall.v1 + t * dv;
        const pushU = currentU - projU;
        const pushV = currentV - projV;
        const pushLen = Math.hypot(pushU, pushV);
        if (pushLen > 0.001) {
          currentU = projU + (pushU / pushLen) * minDist;
          currentV = projV + (pushV / pushLen) * minDist;
        } else {
          currentU = prevU;
          currentV = prevV;
        }
      } else {
        currentU = prevU;
        currentV = prevV;
      }
    }
  }

  if (!isInsideWalkableB11(currentU, currentV, floor)) {
    currentU = prevU;
    currentV = prevV;
  }

  return b11ToWorld(currentU, currentV);
}

export function getActiveRoom(worldX: number, worldZ: number, floor: number): RoomArea | null {
  const [u, v] = b11ToLocal(worldX, worldZ);
  const rooms = getFloorRooms(floor);
  for (const room of rooms) {
    if (u >= room.minU && u <= room.maxU && v >= room.minV && v <= room.maxV) {
      return room;
    }
  }
  return null;
}

export function getNearInteractive(
  worldX: number,
  worldZ: number,
  floor: number | null
): InteractivePoint | null {
  if (floor === null) {
    for (const ent of b11ExteriorEntrances) {
      const dist = Math.hypot(worldX - ent.worldPos[0], worldZ - ent.worldPos[1]);
      if (dist <= ent.radius) {
        return {
          id: ent.id,
          type: 'exterior-door',
          worldPos: ent.worldPos,
          radius: ent.radius,
          label: ent.label,
          buildingId: 'b11',
          spawnPosWorld: ent.spawnInsideWorld,
          spawnYaw: ent.spawnInsideYaw,
        };
      }
    }
    return null;
  }

  // 1. Thang máy Block 11 (tại cầu nối giữa mọi tầng 1–4)
  const distElev = Math.hypot(worldX - B11_ELEVATOR_WORLD[0], worldZ - B11_ELEVATOR_WORLD[1]);
  if (distElev <= 3.4) {
    return {
      id: 'b11-elevator',
      type: 'elevator',
      worldPos: B11_ELEVATOR_WORLD,
      radius: 3.4,
      label: 'Thang máy Block 11 (Chọn tầng 1–4)',
      buildingId: 'b11',
    };
  }

  // 2. Cầu thang bộ ở 5 lõi thang (cho phép đổi tầng thuận tiện)
  const [u, v] = b11ToLocal(worldX, worldZ);
  for (const sw of B11_STAIRWELLS) {
    const cu = (sw.minU + sw.maxU) * 0.5;
    const cv = (sw.minV + sw.maxV) * 0.5;
    if (Math.hypot(u - cu, v - cv) <= 3.6) {
      return {
        id: `b11-stair-${sw.id}`,
        type: 'elevator',
        worldPos: b11ToWorld(cu, cv),
        radius: 3.6,
        label: `${sw.label} — Chọn tầng (1–4)`,
        buildingId: 'b11',
      };
    }
  }

  // 3. 5 cửa ra ngoài khuôn viên (trên tầng 1)
  if (floor === 1) {
    for (const ent of b11ExteriorEntrances) {
      const dist = Math.hypot(worldX - ent.spawnInsideWorld[0], worldZ - ent.spawnInsideWorld[1]);
      if (dist <= 3.4) {
        return {
          id: `${ent.id}-exit`,
          type: 'interior-door',
          worldPos: ent.spawnInsideWorld,
          radius: 3.4,
          label: 'Ra ngoài khuôn viên',
          buildingId: 'b11',
          spawnPosWorld: ent.spawnOutsideWorld,
          spawnYaw: ent.spawnOutsideYaw,
        };
      }
    }
  }

  return null;
}

export const b11Layout: InteriorLayout = {
  buildingId: 'b11',
  name: 'Block 11 (Kỹ thuật · CNTT · Điều dưỡng)',
  origin: B11_ORIGIN,
  rotationY: B11_ROTATION_Y,
  floors: 4,
  toWorld: b11ToWorld,
  toLocal: b11ToLocal,
  getFloorWalls,
  getFloorRooms,
  getFloorBoundaryPts,
  getFloorHoles,
  resolvePosition: resolveInteriorPosition,
  getActiveRoom,
  getNearInteractive,
  elevator: {
    posLocal: B11_ELEVATOR_LOCAL,
    spawnLocal: B11_ELEVATOR_SPAWN_LOCAL,
    posWorld: B11_ELEVATOR_WORLD,
    spawnWorld: B11_ELEVATOR_SPAWN_WORLD,
    facingYaw: Math.PI,
  },
  exteriorEntrances: b11ExteriorEntrances,
  defaultInsideEntrance: DOOR_SOUTH_W_IN,
  defaultOutsideEntrance: DOOR_SOUTH_W_OUT,
};
