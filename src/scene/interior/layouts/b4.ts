import type { Vec2 } from '../../../types';
import {
  buildSwitchbackWalkableSpec,
  evaluateStairHeight,
  isInsideAnyStairFootprint,
  type StairPart,
  type SwitchbackStairGeometrySpec,
  type WalkableStairSpec,
} from '../stairs';
import type {
  WallSegment,
  RoomArea,
  InteractivePoint,
  InteriorLayout,
  ExteriorEntrance,
  StairStepResult,
} from '../types';

/**
 * Hệ tọa độ địa phương Block 4 (Thư viện EIU):
 * Gốc tọa độ O (u=0, v=0): Góc Tây Bắc của tòa nhà [91.5, -97.4] (world).
 * Kích thước phủ bì: dài 67.0 m (u: 0..67, Tây → Đông), rộng 28.0 m (v: 0..28, Bắc → Nam).
 * Góc xoay trục dài: -6.25° (rad: -0.10912).
 *
 * Đối chiếu chính xác với 3 sơ đồ mặt bằng & 74 ảnh 360° tại https://eiu.edu.vn/eiu_lib/index.htm:
 * - Đầu Đông (u = 67): Cửa chính Thư viện nhìn ra hành lang cột & hồ nước xanh giữa B4–B5.
 * - Đầu Tây (u = 0): Lõi thang máy, cửa Tây sang B11, thang bộ phụ phía Tây Nam, WC / Góc trao đổi sách.
 * - Mặt Nam (v = 28): Nhìn ra hồ nước, 2 cầu mái xanh, Highlands Coffee & Block 3.
 * - Mặt Bắc (v = 0): Nhìn ra sân pergola ngoài trời, Fami Pizza & cụm giảng đường B11.
 */
export const B4_ORIGIN: Vec2 = [91.5, -97.4];
export const B4_ROTATION_Y = -0.10912; // -6.25°

const COS = Math.cos(B4_ROTATION_Y);
const SIN = Math.sin(B4_ROTATION_Y);

export function toWorld(u: number, v: number): Vec2 {
  return [
    B4_ORIGIN[0] + u * COS - v * SIN,
    B4_ORIGIN[1] + u * SIN + v * COS,
  ];
}

export function toLocal(x: number, z: number): [number, number] {
  const dx = x - B4_ORIGIN[0];
  const dz = z - B4_ORIGIN[1];
  return [
    dx * COS + dz * SIN,
    -dx * SIN + dz * COS,
  ];
}

/** Tính góc quay Euler Y trong Three.js cho mesh 3D quay theo vector địa phương. */
export function getLocalFacingYaw(localRotY = 0): number {
  const dirU = Math.cos(localRotY);
  const dirV = Math.sin(localRotY);
  const p0 = toWorld(0, 0);
  const p1 = toWorld(dirU, dirV);
  return -Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
}

/**
 * Tính góc yaw dùng cho WalkMode (`forwardX = cos(yaw), forwardZ = sin(yaw)`).
 * Luôn dùng hàm này (KHÔNG dùng `getLocalFacingYaw`) cho hướng nhìn nhân vật khi spawn/teleport.
 */
export function getLocalWalkYaw(dirU: number, dirV: number): number {
  const p0 = toWorld(0, 0);
  const p1 = toWorld(dirU, dirV);
  return Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
}

// Tâm tòa nhà (thế giới)
export const B4_CENTER_WORLD = toWorld(33.5, 14.0);

// Thang máy Thư viện B4 (sảnh thang máy phía Tây Bắc lõi giao thông)
export const B4_ELEVATOR_POS_LOCAL: [number, number] = [5.8, 12.2];
export const B4_ELEVATOR_POS_WORLD: Vec2 = toWorld(B4_ELEVATOR_POS_LOCAL[0], B4_ELEVATOR_POS_LOCAL[1]);
export const B4_ELEVATOR_SPAWN_LOCAL: [number, number] = [7.6, 14.0];
export const B4_ELEVATOR_SPAWN_WORLD: Vec2 = toWorld(B4_ELEVATOR_SPAWN_LOCAL[0], B4_ELEVATOR_SPAWN_LOCAL[1]);

// =============================================================================
// CỬA RA VÀO NGOÀI KHUÔN VIÊN (4 cửa đối chiếu đúng bản đồ mặt bằng Tầng 1)
// Tất cả tọa độ ngoài đều nằm ngoài polygon B4 & B5 để người chơi không bị kẹt.
// =============================================================================

// 1. Cửa chính phía Đông (bên trong sảnh lớn B4–B5 đối diện hồ nước trung tâm)
export const B4_ENTRANCE_MAIN_OUTSIDE = toWorld(56.2, 14.0);
export const B4_ENTRANCE_MAIN_INSIDE = toWorld(61.8, 14.0);
export const B4_ENTRANCE_MAIN_VESTIBULE = toWorld(66.2, 14.0);

// 2. Cửa phụ phía Nam ("Lối Vào Thư Viện EIU" — nhìn ra hồ nước, pergola & Block 3)
export const B4_ENTRANCE_SOUTH_OUTSIDE = toWorld(47.3, 28.5);
export const B4_ENTRANCE_SOUTH_INSIDE = toWorld(48.5, 25.0);

// 3. Cửa phụ phía Bắc (gần khu máy in & tủ gửi đồ, hướng sang sân pergola / B11)
export const B4_ENTRANCE_NORTH_OUTSIDE = toWorld(48.5, -1.8);
export const B4_ENTRANCE_NORTH_INSIDE = toWorld(48.5, 3.0);

// 4. Cửa phụ phía Tây (sảnh thang máy, hành lang Tây hướng sang Block 11)
export const B4_ENTRANCE_WEST_OUTSIDE = toWorld(2.1, 14.0);
export const B4_ENTRANCE_WEST_INSIDE = toWorld(2.2, 14.0);

export const b4ExteriorEntrances: readonly ExteriorEntrance[] = [
  {
    id: 'b4-door-main',
    buildingId: 'b4',
    worldPos: B4_ENTRANCE_MAIN_OUTSIDE,
    radius: 3.5,
    label: 'Vào Thư viện EIU (Cửa chính)',
    spawnInsideWorld: B4_ENTRANCE_MAIN_INSIDE,
    spawnInsideYaw: getLocalWalkYaw(-1, 0), // Quay vào hướng Tây, đối diện cầu thang gáy sách
    spawnOutsideWorld: B4_ENTRANCE_MAIN_OUTSIDE,
    spawnOutsideYaw: getLocalWalkYaw(1, 0), // Quay ra hướng Đông nhìn hồ nước lớn B4–B5
  },
  {
    id: 'b4-door-south',
    buildingId: 'b4',
    worldPos: B4_ENTRANCE_SOUTH_OUTSIDE,
    radius: 3.4,
    label: 'Vào Thư viện EIU (Cửa Nam — Hồ nước)',
    spawnInsideWorld: B4_ENTRANCE_SOUTH_INSIDE,
    spawnInsideYaw: getLocalWalkYaw(0, -1), // Quay vào hướng Bắc
    spawnOutsideWorld: B4_ENTRANCE_SOUTH_OUTSIDE,
    spawnOutsideYaw: getLocalWalkYaw(0, 1), // Quay ra hướng Nam
  },
  {
    id: 'b4-door-north',
    buildingId: 'b4',
    worldPos: B4_ENTRANCE_NORTH_OUTSIDE,
    radius: 2.8,
    label: 'Vào Thư viện EIU (Cửa Bắc — Khu in ấn)',
    spawnInsideWorld: B4_ENTRANCE_NORTH_INSIDE,
    spawnInsideYaw: getLocalWalkYaw(0, 1), // Quay vào hướng Nam
    spawnOutsideWorld: B4_ENTRANCE_NORTH_OUTSIDE,
    spawnOutsideYaw: getLocalWalkYaw(0, -1), // Quay ra hướng Bắc
  },
  {
    id: 'b4-door-west',
    buildingId: 'b4',
    worldPos: B4_ENTRANCE_WEST_OUTSIDE,
    radius: 2.8,
    label: 'Vào Thư viện EIU (Cửa Tây — Sảnh thang máy)',
    spawnInsideWorld: B4_ENTRANCE_WEST_INSIDE,
    spawnInsideYaw: getLocalWalkYaw(1, 0), // Quay vào hướng Đông
    spawnOutsideWorld: B4_ENTRANCE_WEST_OUTSIDE,
    spawnOutsideYaw: getLocalWalkYaw(-1, 0), // Quay ra hướng Tây
  },
];

// =============================================================================
// HỆ THỐNG CẦU THANG (1. Thang trung tâm gáy sách, 2. Thang bộ chữ U phía Tây)
// =============================================================================

export interface StraightBookStairSpec {
  readonly id: string;
  readonly startU: number;
  readonly midStartU: number;
  readonly midEndU: number;
  readonly endU: number;
  readonly centerV: number;
  readonly width: number;
  readonly stepsPerFlight: number;
  readonly shaftBounds: readonly [number, number, number, number];
}

/** Cầu thang trung tâm dán gáy sách EIU: 2 vế thẳng nối qua chiếu nghỉ giữa, đi lên về hướng Tây. */
export const B4_GRAND_STAIR: StraightBookStairSpec = {
  id: 'b4-grand-stair',
  startU: 59.8,
  midStartU: 56.0,
  midEndU: 54.5,
  endU: 50.8,
  centerV: 14.0,
  width: 3.0,
  stepsPerFlight: 10,
  shaftBounds: [50.8, 59.8, 12.4, 15.6],
};

function buildGrandStairWalkableSpec(spec: StraightBookStairSpec): WalkableStairSpec {
  const hw = spec.width * 0.5;
  const parts: StairPart[] = [
    {
      kind: 'ramp',
      u1: spec.startU,
      v1: spec.centerV,
      y1: 0,
      u2: spec.midStartU,
      v2: spec.centerV,
      y2: 1.9,
      halfWidth: hw,
    },
    {
      kind: 'landing',
      minU: spec.midEndU,
      maxU: spec.midStartU,
      minV: spec.centerV - hw,
      maxV: spec.centerV + hw,
      y: 1.9,
    },
    {
      kind: 'ramp',
      u1: spec.midEndU,
      v1: spec.centerV,
      y1: 1.9,
      u2: spec.endU,
      v2: spec.centerV,
      y2: 3.8,
      halfWidth: hw,
    },
  ];
  return {
    id: spec.id,
    parts,
    shaftMinU: spec.shaftBounds[0],
    shaftMaxU: spec.shaftBounds[1],
    shaftMinV: spec.shaftBounds[2],
    shaftMaxV: spec.shaftBounds[3],
  };
}

/** Cầu thang bộ phụ chữ U ở lõi Tây Nam (Tầng 1–3). */
export const B4_REAR_STAIR: SwitchbackStairGeometrySpec = {
  id: 'b4-rear-stair',
  label: 'Thang bộ phía Tây',
  f1: [4.2, 24.0, 8.2, 24.0],
  f2: [8.2, 21.0, 4.2, 21.0],
  width: 1.7,
  steps1: 10,
  steps2: 10,
  landRatio: 0.5,
  land: [9.0, 22.5, 1.8, 4.6],
  backRail: [9.9, 20.2, 9.9, 24.8],
  shaftBounds: [3.5, 10.0, 19.8, 25.2],
};

export const B4_WALKABLE_STAIRS: readonly WalkableStairSpec[] = [
  buildGrandStairWalkableSpec(B4_GRAND_STAIR),
  buildSwitchbackWalkableSpec(B4_REAR_STAIR),
];

// =============================================================================
// PHÂN KHU & PHÒNG CHỨC NĂNG TỪNG TẦNG (đặt vùng hẹp trước vùng rộng)
// =============================================================================

export const B4_ROOMS_FLOOR_1: readonly RoomArea[] = [
  {
    code: 'ENTRANCE',
    name: 'Sảnh đón & Cổng quẹt thẻ Thư viện EIU',
    minU: 60.2,
    maxU: 67.0,
    minV: 10.5,
    maxV: 17.5,
  },
  {
    code: 'GRAND-STAIR',
    name: 'Cầu thang gáy sách trung tâm',
    minU: 50.5,
    maxU: 60.2,
    minV: 12.0,
    maxV: 16.0,
  },
  {
    code: 'PC-SOUTH',
    name: 'Khu vực máy tính tra cứu phía Nam (24 máy AIO)',
    minU: 52.0,
    maxU: 66.8,
    minV: 17.5,
    maxV: 27.8,
  },
  {
    code: 'PC-NORTH',
    name: 'Khu vực máy tính tra cứu phía Bắc (24 máy AIO)',
    minU: 52.0,
    maxU: 66.8,
    minV: 0.2,
    maxV: 10.5,
  },
  {
    code: 'PRINTING',
    name: 'Khu vực in ấn & Tủ gửi đồ 36 ngăn',
    minU: 43.0,
    maxU: 52.0,
    minV: 0.2,
    maxV: 10.5,
  },
  {
    code: 'INFO-DESK',
    name: 'Quầy thông tin (Information Desk)',
    minU: 34.0,
    maxU: 47.2,
    minV: 10.5,
    maxV: 17.5,
  },
  {
    code: 'BOOK-EXCHANGE',
    name: 'Góc trao đổi sách (Book Exchange Corner)',
    minU: 0.2,
    maxU: 11.5,
    minV: 0.2,
    maxV: 10.5,
  },
  {
    code: 'ELEVATOR',
    name: 'Sảnh thang máy phía Tây',
    minU: 0.2,
    maxU: 11.5,
    minV: 10.5,
    maxV: 17.5,
  },
  {
    code: 'REAR-STAIRS',
    name: 'Thang bộ phía Tây Nam (Tầng 1–3)',
    minU: 2.0,
    maxU: 11.5,
    minV: 17.5,
    maxV: 27.5,
  },
  {
    code: 'ZONE-A/B/C',
    name: 'Khu tự học Tầng 1 (Zone A–C)',
    minU: 11.5,
    maxU: 52.0,
    minV: 0.2,
    maxV: 27.8,
  },
  {
    code: '100.B4',
    name: 'Không gian Thư viện Tầng 1',
    minU: 0.0,
    maxU: 67.0,
    minV: 0.0,
    maxV: 28.0,
  },
];

export const B4_ROOMS_FLOOR_2: readonly RoomArea[] = [
  {
    code: 'ROOM-202',
    name: 'Phòng 202 — Server Room & Hạ tầng Kỹ thuật',
    minU: 52.0,
    maxU: 66.8,
    minV: 0.2,
    maxV: 10.5,
  },
  {
    code: 'ROOM-09',
    name: 'Phòng 09 — Phòng đa năng (Multipurpose Room)',
    minU: 11.5,
    maxU: 22.5,
    minV: 22.5,
    maxV: 27.8,
  },
  { code: 'ROOM-08', name: 'Phòng học nhóm 08 (Group Study 08)', minU: 22.5, maxU: 28.0, minV: 22.5, maxV: 27.8 },
  { code: 'ROOM-07', name: 'Phòng học nhóm 07 (Group Study 07)', minU: 28.0, maxU: 33.5, minV: 22.5, maxV: 27.8 },
  { code: 'ROOM-06', name: 'Phòng học nhóm 06 (Group Study 06)', minU: 33.5, maxU: 39.0, minV: 22.5, maxV: 27.8 },
  { code: 'ROOM-05', name: 'Phòng học nhóm 05 (Group Study 05)', minU: 39.0, maxU: 44.5, minV: 22.5, maxV: 27.8 },
  { code: 'ROOM-04', name: 'Phòng học nhóm 04 (Group Study 04)', minU: 44.5, maxU: 50.0, minV: 22.5, maxV: 27.8 },
  { code: 'ROOM-03', name: 'Phòng học nhóm 03 (Group Study 03)', minU: 50.0, maxU: 55.5, minV: 22.5, maxV: 27.8 },
  { code: 'ROOM-02', name: 'Phòng học nhóm 02 (Group Study 02)', minU: 55.5, maxU: 61.0, minV: 22.5, maxV: 27.8 },
  { code: 'ROOM-01', name: 'Phòng học nhóm 01 (Group Study 01)', minU: 61.0, maxU: 66.8, minV: 22.5, maxV: 27.8 },
  {
    code: 'GRAND-STAIR',
    name: 'Sảnh cầu thang gáy sách Tầng 2',
    minU: 52.0,
    maxU: 66.8,
    minV: 10.5,
    maxV: 17.5,
  },
  {
    code: 'SELF-STUDY-2',
    name: 'Khu tự học Tầng 2 (Bàn xám & Ghế xanh ngọc)',
    minU: 11.5,
    maxU: 52.0,
    minV: 0.2,
    maxV: 10.5,
  },
  {
    code: 'GROUP-OPEN-2',
    name: 'Khu học nhóm mở & Sofa lượn sóng Tầng 2',
    minU: 11.5,
    maxU: 66.8,
    minV: 10.5,
    maxV: 22.5,
  },
  {
    code: 'WC-2',
    name: 'Khu vệ sinh Tầng 2 (Nam / Nữ / Tiếp cận)',
    minU: 0.2,
    maxU: 11.5,
    minV: 0.2,
    maxV: 10.5,
  },
  {
    code: 'ELEVATOR',
    name: 'Sảnh thang máy Tầng 2',
    minU: 0.2,
    maxU: 11.5,
    minV: 10.5,
    maxV: 17.5,
  },
  {
    code: 'REAR-STAIRS',
    name: 'Thang bộ phía Tây Nam (Tầng 1–3)',
    minU: 2.0,
    maxU: 11.5,
    minV: 17.5,
    maxV: 27.5,
  },
  {
    code: '200.B4',
    name: 'Không gian Thư viện Tầng 2',
    minU: 0.0,
    maxU: 67.0,
    minV: 0.0,
    maxV: 28.0,
  },
];

export const B4_ROOMS_FLOOR_3: readonly RoomArea[] = [
  {
    code: 'CIRC-EAST',
    name: 'Quầy lưu hành & Bức tường gỗ LIBRARY',
    minU: 35.5,
    maxU: 43.0,
    minV: 10.5,
    maxV: 17.5,
  },
  {
    code: 'CIRC-WEST',
    name: 'Quầy lưu hành phía Tây',
    minU: 17.5,
    maxU: 23.5,
    minV: 10.5,
    maxV: 17.5,
  },
  {
    code: 'ROUND-TABLE',
    name: 'Bàn tròn giới thiệu sách mới & Trần gỗ caro',
    minU: 43.0,
    maxU: 52.0,
    minV: 10.5,
    maxV: 17.5,
  },
  {
    code: 'STAFF-ONLY',
    name: 'Phòng nghiệp vụ Thư viện (Staff Only)',
    minU: 23.5,
    maxU: 35.5,
    minV: 10.8,
    maxV: 17.2,
  },
  {
    code: 'GRAND-STAIR',
    name: 'Cửa kiểm soát RFID & LỐI RA / EXIT Tầng 3',
    minU: 52.0,
    maxU: 66.8,
    minV: 10.5,
    maxV: 17.5,
  },
  {
    code: 'READING-N',
    name: 'Góc đọc sách cửa sổ Bắc & Đèn LED zíc-zắc',
    minU: 27.5,
    maxU: 39.5,
    minV: 0.2,
    maxV: 9.5,
  },
  {
    code: 'READING-S',
    name: 'Góc đọc sách cửa sổ Nam',
    minU: 27.5,
    maxU: 39.5,
    minV: 18.5,
    maxV: 27.8,
  },
  {
    code: 'LOUNGE-N',
    name: 'Góc ghế bành đọc sách phía Bắc',
    minU: 17.5,
    maxU: 27.5,
    minV: 0.2,
    maxV: 9.5,
  },
  {
    code: 'LOUNGE-S',
    name: 'Góc ghế bành đọc sách phía Nam',
    minU: 40.5,
    maxU: 52.0,
    minV: 18.5,
    maxV: 27.8,
  },
  {
    code: 'STACKS-N',
    name: 'Khu kệ sách chuyên ngành DDC 000–617',
    minU: 11.5,
    maxU: 66.8,
    minV: 0.2,
    maxV: 10.5,
  },
  {
    code: 'STACKS-S',
    name: 'Khu kệ sách chuyên ngành DDC 618–999 & Tạp chí',
    minU: 11.5,
    maxU: 66.8,
    minV: 17.5,
    maxV: 27.8,
  },
  {
    code: 'WC-3',
    name: 'Khu vệ sinh Tầng 3 (Nam / Nữ / Tiếp cận)',
    minU: 0.2,
    maxU: 11.5,
    minV: 0.2,
    maxV: 10.5,
  },
  {
    code: 'ELEVATOR',
    name: 'Sảnh thang máy Tầng 3',
    minU: 0.2,
    maxU: 11.5,
    minV: 10.5,
    maxV: 17.5,
  },
  {
    code: 'REAR-STAIRS',
    name: 'Thang bộ phía Tây Nam (Tầng 1–3)',
    minU: 2.0,
    maxU: 11.5,
    minV: 17.5,
    maxV: 27.5,
  },
  {
    code: '300.B4',
    name: 'Không gian Thư viện Tầng 3',
    minU: 0.0,
    maxU: 67.0,
    minV: 0.0,
    maxV: 28.0,
  },
];

// =============================================================================
// HỆ THỐNG TƯỜNG & VA CHẠM TỪNG TẦNG
// Tường đánh dấu `isRailing: true` vẫn cản va chạm nhân vật nhưng nhường `B4Furniture`
// dựng vách kính / cửa sổ băng ngang / lan can inox đúng kiến trúc thực tế.
// =============================================================================

export function getFloorWalls(floor: number): readonly WallSegment[] {
  const walls: WallSegment[] = [];

  // 1. Tường bao ngoài 4 cạnh tòa nhà (67 m × 28 m)
  // Tường Bắc (v = 0)
  if (floor === 1) {
    // Có cửa phụ khu in ấn ở u = 47.0..50.0
    walls.push({ u1: 0, v1: 0, u2: 47.0, v2: 0, thickness: 0.22, isRailing: true });
    walls.push({ u1: 50.0, v1: 0, u2: 67.0, v2: 0, thickness: 0.22, isRailing: true });
  } else {
    // Tầng 2 & 3: Lõi WC phía Tây Bắc (u = 0..11.5) tường đặc, phần còn lại cửa sổ băng ngang (isRailing)
    walls.push({ u1: 0, v1: 0, u2: 11.5, v2: 0, thickness: 0.25 });
    walls.push({ u1: 11.5, v1: 0, u2: 67.0, v2: 0, thickness: 0.22, isRailing: true });
  }

  // Tường Nam (v = 28)
  if (floor === 1) {
    // Có cửa phụ mặt Nam nhìn ra hồ ở u = 47.0..50.0
    walls.push({ u1: 0, v1: 28, u2: 47.0, v2: 28, thickness: 0.22, isRailing: true });
    walls.push({ u1: 50.0, v1: 28, u2: 67.0, v2: 28, thickness: 0.22, isRailing: true });
  } else {
    walls.push({ u1: 0, v1: 28, u2: 11.5, v2: 28, thickness: 0.25 });
    walls.push({ u1: 11.5, v1: 28, u2: 67.0, v2: 28, thickness: 0.22, isRailing: true });
  }

  // Tường Tây (u = 0)
  if (floor === 1) {
    // Có cửa phụ Tây sang hành lang B11 ở v = 12.2..15.8
    walls.push({ u1: 0, v1: 0, u2: 0, v2: 12.2, thickness: 0.25 });
    walls.push({ u1: 0, v1: 15.8, u2: 0, v2: 28, thickness: 0.25 });
  } else {
    walls.push({ u1: 0, v1: 0, u2: 0, v2: 28, thickness: 0.25 });
  }

  // Tường Đông (u = 67)
  if (floor === 1) {
    // Cửa chính vách kính ở v = 12.2..15.8 (lối vào từ B4–B5)
    walls.push({ u1: 67, v1: 0, u2: 67, v2: 12.2, thickness: 0.22, isRailing: true });
    walls.push({ u1: 67, v1: 15.8, u2: 67, v2: 28, thickness: 0.22, isRailing: true });
  } else {
    walls.push({ u1: 67, v1: 0, u2: 67, v2: 28, thickness: 0.22, isRailing: true });
  }

  // 2. Lõi giao thông phía Tây (chung cả 3 tầng)
  // Hộp thang máy (u = 4.6..7.0, v = 10.6..12.2)
  walls.push({ u1: 4.6, v1: 10.6, u2: 7.0, v2: 10.6, thickness: 0.2 });
  walls.push({ u1: 4.6, v1: 10.6, u2: 4.6, v2: 12.2, thickness: 0.2 });
  walls.push({ u1: 7.0, v1: 10.6, u2: 7.0, v2: 12.2, thickness: 0.2 });

  // Khoang thang bộ phụ phía Tây Nam (u = 3.5..10.2, v = 19.6..25.4) — chừa cửa phía Tây (u=3.5, v=22.4..25.2)
  walls.push({ u1: 3.5, v1: 19.6, u2: 10.2, v2: 19.6, thickness: 0.22 });
  walls.push({ u1: 10.2, v1: 19.6, u2: 10.2, v2: 25.4, thickness: 0.22 });
  walls.push({ u1: 3.5, v1: 25.4, u2: 10.2, v2: 25.4, thickness: 0.22 });
  walls.push({ u1: 3.5, v1: 19.6, u2: 3.5, v2: 20.4, thickness: 0.22 });

  // Tường ngăn lõi Tây Nam & sảnh thang máy (chừa lối đi hành lang v = 17.5..19.6)
  walls.push({ u1: 11.5, v1: 17.5, u2: 11.5, v2: 28.0, thickness: 0.22 });

  // 3. Chi tiết từng tầng
  if (floor === 1) {
    // Vách kính tiền sảnh cổng quẹt thẻ (u = 65.2..67, v = 10.5..17.5) — chừa lối qua 2 lane cổng ở v = 12.2..15.8
    walls.push({ u1: 65.2, v1: 10.5, u2: 67.0, v2: 10.5, thickness: 0.1, isRailing: true });
    walls.push({ u1: 65.2, v1: 17.5, u2: 67.0, v2: 17.5, thickness: 0.1, isRailing: true });
    walls.push({ u1: 65.2, v1: 10.5, u2: 65.2, v2: 12.2, thickness: 0.1, isRailing: true });
    walls.push({ u1: 65.2, v1: 15.8, u2: 65.2, v2: 17.5, thickness: 0.1, isRailing: true });

    // Cánh kính chắn hai bên cổng quẹt thẻ 2 lane ở cửa phụ Bắc & cửa phụ Nam (hướng về B3)
    for (const sv of [1.15, 26.85]) {
      walls.push({ u1: 47.0, v1: sv, u2: 47.45, v2: sv, thickness: 0.1, isRailing: true });
      walls.push({ u1: 49.55, v1: sv, u2: 50.0, v2: sv, thickness: 0.1, isRailing: true });
    }

    // Lan can kính hai bên cầu thang gáy sách trung tâm
    walls.push({ u1: 50.8, v1: 12.4, u2: 59.8, v2: 12.4, thickness: 0.12, isRailing: true });
    walls.push({ u1: 50.8, v1: 15.6, u2: 59.8, v2: 15.6, thickness: 0.12, isRailing: true });

    // Tường ngăn xám khu vực in ấn & tủ gửi đồ 36 ngăn (nối từ vách kính Bắc tới trụ hành lang u = 43.0)
    walls.push({ u1: 43.0, v1: 0.2, u2: 43.0, v2: 10.5, thickness: 0.2 });
    // Hàng tủ gửi đồ 36 ngăn & 2 máy in lớn áp sát mặt Đông bức tường ngăn
    walls.push({ u1: 43.45, v1: 1.2, u2: 43.45, v2: 9.4, thickness: 0.72, isRailing: true });

    // Góc trao đổi sách phía Tây Bắc (tường ngăn u = 11.5, chừa lối vào rộng v = 7.2..10.5)
    walls.push({ u1: 11.5, v1: 0.2, u2: 11.5, v2: 7.2, thickness: 0.22 });
    walls.push({ u1: 1.5, v1: 10.5, u2: 7.5, v2: 10.5, thickness: 0.15, isRailing: true });

    // Quầy thông tin dài (u = 37.5..46.3, v = 13.0..15.0) & 2 ghế sofa xanh dương
    walls.push({ u1: 37.5, v1: 13.15, u2: 46.3, v2: 13.15, thickness: 0.65, isRailing: true });
    walls.push({ u1: 37.5, v1: 14.85, u2: 46.3, v2: 14.85, thickness: 0.65, isRailing: true });
    walls.push({ u1: 46.15, v1: 13.0, u2: 46.15, v2: 15.0, thickness: 0.55, isRailing: true });
    // 2 ghế sofa xanh dương: xoay vuông góc vách xám & đặt đối xứng thẳng hàng qua lối đi
    walls.push({ u1: 40.78, v1: 9.1, u2: 42.78, v2: 9.1, thickness: 0.78, isRailing: true });
    walls.push({ u1: 40.78, v1: 18.9, u2: 42.78, v2: 18.9, thickness: 0.78, isRailing: true });

    // Bàn máy tính tra cứu OPAC (2 phòng máy hai bên cầu thang trung tâm: 4 dãy bàn/bên)
    for (const u of [54.2, 57.6, 61.0, 64.4]) {
      walls.push({ u1: u, v1: 2.2, u2: u, v2: 7.6, thickness: 1.1, isRailing: true });
      walls.push({ u1: u, v1: 20.4, u2: u, v2: 25.8, thickness: 1.1, isRailing: true });
    }

    // 2 bàn đọc giữa hành lang trung tâm (u = 18.0 và 26.5)
    for (const u of [18.0, 26.5]) {
      walls.push({ u1: u, v1: 12.6, u2: u, v2: 15.4, thickness: 0.9, isRailing: true });
    }

    // Các cụm bàn tự học Tầng 1 hai bên hành lang (3 cụm Bắc, 3 cụm Nam theo lưới cột)
    for (const u of [16.8, 27.2, 37.5]) {
      walls.push({ u1: u - 1.3, v1: 4.6, u2: u + 1.3, v2: 4.6, thickness: 0.9, isRailing: true });
      walls.push({ u1: u - 1.3, v1: 23.4, u2: u + 1.3, v2: 23.4, thickness: 0.9, isRailing: true });
    }
  }

  if (floor === 2) {
    // Lan can kính bảo vệ quanh lỗ thông cầu thang trung tâm
    walls.push({ u1: 50.8, v1: 12.4, u2: 59.8, v2: 12.4, thickness: 0.14, isRailing: true });
    walls.push({ u1: 50.8, v1: 15.6, u2: 59.8, v2: 15.6, thickness: 0.14, isRailing: true });

    // Khu vệ sinh WC góc Tây Bắc (u = 0.2..11.5, v = 0.2..10.5 — chừa lối vào ở v = 10.5, u = 8.0..9.8)
    walls.push({ u1: 11.5, v1: 0.2, u2: 11.5, v2: 10.5, thickness: 0.22 });
    walls.push({ u1: 0.2, v1: 10.5, u2: 8.0, v2: 10.5, thickness: 0.22 });
    walls.push({ u1: 9.8, v1: 10.5, u2: 11.5, v2: 10.5, thickness: 0.22 });

    // Phòng 202 Server Room góc Đông Bắc (u = 52.0..66.8, v = 0.2..10.5 — vách kính khung trắng)
    walls.push({ u1: 52.0, v1: 0.2, u2: 52.0, v2: 10.5, thickness: 0.14, isRailing: true });
    walls.push({ u1: 52.0, v1: 10.5, u2: 54.0, v2: 10.5, thickness: 0.14, isRailing: true });
    walls.push({ u1: 55.2, v1: 10.5, u2: 66.8, v2: 10.5, thickness: 0.14, isRailing: true });

    // Dãy 9 phòng học nhóm dọc tường Nam (v = 22.5..27.8, u = 11.5..66.8)
    // Phòng 09 (đa năng): u = 11.5..22.5, cửa ở u = 16.4..17.6
    walls.push({ u1: 11.5, v1: 22.5, u2: 16.4, v2: 22.5, thickness: 0.14, isRailing: true });
    walls.push({ u1: 17.6, v1: 22.5, u2: 22.5, v2: 22.5, thickness: 0.14, isRailing: true });

    // 8 phòng 08..01 (mỗi phòng rộng 5.5 m từ u = 22.5 đến u = 66.5), chừa cửa 1.1 m cho mỗi phòng
    for (let i = 0; i < 8; i++) {
      const uStart = 22.5 + i * 5.5;
      const uEnd = uStart + 5.5;
      const doorCenter = uStart + 2.75;
      walls.push({ u1: uStart, v1: 22.5, u2: doorCenter - 0.55, v2: 22.5, thickness: 0.14, isRailing: true });
      walls.push({ u1: doorCenter + 0.55, v1: 22.5, u2: uEnd, v2: 22.5, thickness: 0.14, isRailing: true });
    }
    // Vách ngăn giữa các phòng học nhóm
    for (const uPart of [22.5, 28.0, 33.5, 39.0, 44.5, 50.0, 55.5, 61.0, 66.5]) {
      walls.push({ u1: uPart, v1: 22.5, u2: uPart, v2: 27.8, thickness: 0.14 });
    }

    // Dãy sofa xanh ngọc lượn sóng hai bên hành lang trung tâm
    for (const u of [19.0, 29.5, 40.0]) {
      walls.push({ u1: u - 2.6, v1: 11.5, u2: u + 2.6, v2: 11.5, thickness: 0.85, isRailing: true });
      walls.push({ u1: u - 2.6, v1: 16.5, u2: u + 2.6, v2: 16.5, thickness: 0.85, isRailing: true });
    }

    // Bàn tự học Tầng 2 (3 cụm phía Bắc dọc cửa sổ băng ngang)
    for (const u of [18.0, 31.5, 45.0]) {
      walls.push({ u1: u - 1.5, v1: 4.5, u2: u + 1.5, v2: 4.5, thickness: 1.0, isRailing: true });
      walls.push({ u1: u - 1.5, v1: 7.5, u2: u + 1.5, v2: 7.5, thickness: 1.0, isRailing: true });
    }
  }

  if (floor === 3) {
    // Khu vệ sinh WC góc Tây Bắc (giống Tầng 2)
    walls.push({ u1: 11.5, v1: 0.2, u2: 11.5, v2: 10.5, thickness: 0.22 });
    walls.push({ u1: 0.2, v1: 10.5, u2: 8.0, v2: 10.5, thickness: 0.22 });
    walls.push({ u1: 9.8, v1: 10.5, u2: 11.5, v2: 10.5, thickness: 0.22 });

    // Vách kính bao sảnh thang & cửa LỐI RA / EXIT (u = 49.8..66.8, v = 10.5..17.5)
    walls.push({ u1: 49.8, v1: 10.5, u2: 66.8, v2: 10.5, thickness: 0.14, isRailing: true });
    walls.push({ u1: 49.8, v1: 17.5, u2: 66.8, v2: 17.5, thickness: 0.14, isRailing: true });
    walls.push({ u1: 49.8, v1: 10.5, u2: 49.8, v2: 12.2, thickness: 0.14, isRailing: true });
    walls.push({ u1: 49.8, v1: 15.8, u2: 49.8, v2: 17.5, thickness: 0.14, isRailing: true });

    // Lan can kính bảo vệ quanh miệng lỗ cầu thang Tầng 3 (chặn cả đầu Đông u = 59.8 vì không có Tầng 4)
    walls.push({ u1: 50.8, v1: 12.4, u2: 59.8, v2: 12.4, thickness: 0.14, isRailing: true });
    walls.push({ u1: 50.8, v1: 15.6, u2: 59.8, v2: 15.6, thickness: 0.14, isRailing: true });
    walls.push({ u1: 59.8, v1: 12.4, u2: 59.8, v2: 15.6, thickness: 0.14, isRailing: true });

    // Khối phòng nghiệp vụ STAFF ONLY khép kín ở giữa (u = 23.5..35.5, v = 11.0..17.0)
    walls.push({ u1: 23.5, v1: 11.0, u2: 35.5, v2: 11.0, thickness: 0.18, isRailing: true });
    walls.push({ u1: 23.5, v1: 17.0, u2: 35.5, v2: 17.0, thickness: 0.18, isRailing: true });
    walls.push({ u1: 23.5, v1: 11.0, u2: 23.5, v2: 17.0, thickness: 0.18, isRailing: true });
    walls.push({ u1: 35.5, v1: 11.0, u2: 35.5, v2: 17.0, thickness: 0.18, isRailing: true });

    // 2 Quầy lưu hành (Đông & Tây của khối STAFF ONLY)
    walls.push({ u1: 36.2, v1: 12.5, u2: 39.8, v2: 12.5, thickness: 0.85, isRailing: true });
    walls.push({ u1: 36.2, v1: 15.5, u2: 39.8, v2: 15.5, thickness: 0.85, isRailing: true });
    walls.push({ u1: 19.6, v1: 12.5, u2: 22.8, v2: 12.5, thickness: 0.85, isRailing: true });
    walls.push({ u1: 19.6, v1: 15.5, u2: 22.8, v2: 15.5, thickness: 0.85, isRailing: true });

    // 2 Bàn tròn giới thiệu sách (u = 45.0 và u = 15.2, v = 14.0)
    walls.push({ u1: 44.3, v1: 14.0, u2: 45.7, v2: 14.0, thickness: 1.8, isRailing: true });
    walls.push({ u1: 14.5, v1: 14.0, u2: 15.9, v2: 14.0, thickness: 1.8, isRailing: true });

    // 4 cụm kệ sách (mỗi cụm 4 dãy kệ đôi song song đặt vuông góc với cửa sổ, lối đi rộng giữa các dãy)
    const rackUsNorth = [13.5, 16.0, 18.5, 21.0, 41.0, 43.5, 46.0, 48.5, 53.5, 56.0, 58.5, 61.0];
    for (const u of rackUsNorth) {
      walls.push({ u1: u, v1: 3.0, u2: u, v2: 8.4, thickness: 0.65, isRailing: true });
      walls.push({ u1: u, v1: 19.6, u2: u, v2: 25.0, thickness: 0.65, isRailing: true });
    }
    // Thêm 2 cụm kệ sách phía Tây Bắc & Đông Nam đối xứng theo sơ đồ Tầng 3
    for (const u of [36.0, 38.5]) {
      walls.push({ u1: u, v1: 20.0, u2: u, v2: 25.0, thickness: 0.65, isRailing: true });
    }

    // 2 bàn đọc cửa sổ (Góc đọc sách Bắc u = 30.0..37.0, v = 3.2 và Nam u = 29.5..33.5)
    walls.push({ u1: 31.0, v1: 3.6, u2: 36.2, v2: 3.6, thickness: 1.0, isRailing: true });
    walls.push({ u1: 29.0, v1: 24.0, u2: 33.4, v2: 24.0, thickness: 1.0, isRailing: true });
  }

  return walls;
}

// Đường biên bản sàn từng tầng (thế giới)
export function getFloorBoundaryPts(): Vec2[] {
  return [
    toWorld(0, 0),
    toWorld(67, 0),
    toWorld(67, 28),
    toWorld(0, 28),
  ];
}

// Các lỗ khoét sàn cho 2 khoang cầu thang trên Tầng 2 & Tầng 3
export function getFloorHoles(floor: number): Vec2[][] {
  if (floor === 1) return [];

  return [
    // Lỗ khoét cầu thang trung tâm gáy sách (u: 52.6..62.4, v: 12.4..15.6)
    [
      toWorld(B4_GRAND_STAIR.shaftBounds[0], B4_GRAND_STAIR.shaftBounds[2]),
      toWorld(B4_GRAND_STAIR.shaftBounds[1], B4_GRAND_STAIR.shaftBounds[2]),
      toWorld(B4_GRAND_STAIR.shaftBounds[1], B4_GRAND_STAIR.shaftBounds[3]),
      toWorld(B4_GRAND_STAIR.shaftBounds[0], B4_GRAND_STAIR.shaftBounds[3]),
    ],
    // Lỗ khoét cầu thang bộ phụ phía Tây Nam (u: 3.5..10.0, v: 19.8..25.2)
    [
      toWorld(B4_REAR_STAIR.shaftBounds[0], B4_REAR_STAIR.shaftBounds[2]),
      toWorld(B4_REAR_STAIR.shaftBounds[1], B4_REAR_STAIR.shaftBounds[2]),
      toWorld(B4_REAR_STAIR.shaftBounds[1], B4_REAR_STAIR.shaftBounds[3]),
      toWorld(B4_REAR_STAIR.shaftBounds[0], B4_REAR_STAIR.shaftBounds[3]),
    ],
  ];
}

// =============================================================================
// VA CHẠM & TÌM VỊ TRÍ
// =============================================================================

function distanceToSegment(u: number, v: number, u1: number, v1: number, u2: number, v2: number): number {
  const du = u2 - u1;
  const dv = v2 - v1;
  const lenSq = du * du + dv * dv;
  if (lenSq < 0.0001) return Math.hypot(u - u1, v - v1);
  const t = Math.max(0, Math.min(1, ((u - u1) * du + (v - v1) * dv) / lenSq));
  const projU = u1 + t * du;
  const projV = v1 + t * dv;
  return Math.hypot(u - projU, v - projV);
}

function isInsideB4Boundary(u: number, v: number): boolean {
  return u >= 0.25 && u <= 66.75 && v >= 0.25 && v <= 27.75;
}

function resolveInteriorPosition(
  nextX: number,
  nextZ: number,
  prevX: number,
  prevZ: number,
  floor: number,
  radius = 0.4,
  currentY = 0
): Vec2 {
  const [nextU, nextV] = toLocal(nextX, nextZ);
  const [prevU, prevV] = toLocal(prevX, prevZ);

  let currentU = nextU;
  let currentV = nextV;

  // Cho phép đi qua 4 vùng cửa ra vào Tầng 1 (chặn kẹt ngoài giới hạn)
  const isNearExitT1 =
    floor === 1 &&
    ((currentU >= 65.5 && currentU <= 67.4 && currentV >= 12.2 && currentV <= 15.8) ||
      (currentU >= -0.4 && currentU <= 1.2 && currentV >= 12.2 && currentV <= 15.8) ||
      (currentU >= 47.0 && currentU <= 50.0 && currentV >= -0.4 && currentV <= 1.2) ||
      (currentU >= 47.0 && currentU <= 50.0 && currentV >= 26.8 && currentV <= 28.4));

  const onStairs = isInsideAnyStairFootprint(
    B4_WALKABLE_STAIRS,
    currentU,
    currentV,
    floor,
    3,
    currentY
  );

  // Kiểm tra biên ngoài tòa nhà
  if (!isInsideB4Boundary(currentU, currentV) && !isNearExitT1 && !onStairs) {
    currentU = prevU;
    currentV = prevV;
  }

  // Chống rơi từ ngang hông vào lỗ khoét cầu thang ở Tầng 2–3 khi không đang đứng trên thang
  if (floor >= 2 && !onStairs) {
    const inGrandHole =
      currentU >= B4_GRAND_STAIR.shaftBounds[0] + 0.18 &&
      currentU <= B4_GRAND_STAIR.shaftBounds[1] - 0.18 &&
      currentV >= B4_GRAND_STAIR.shaftBounds[2] + 0.08 &&
      currentV <= B4_GRAND_STAIR.shaftBounds[3] - 0.08;
    const inRearHole =
      currentU >= B4_REAR_STAIR.shaftBounds[0] + 0.18 &&
      currentU <= B4_REAR_STAIR.shaftBounds[1] - 0.18 &&
      currentV >= B4_REAR_STAIR.shaftBounds[2] + 0.08 &&
      currentV <= B4_REAR_STAIR.shaftBounds[3] - 0.08;
    if (inGrandHole || inRearHole) {
      currentU = prevU;
      currentV = prevV;
    }
  }

  // Va chạm với các đoạn tường & đồ nội thất lớn
  const walls = getFloorWalls(floor);
  for (const wall of walls) {
    if (wall.minY !== undefined && currentY < wall.minY) continue;
    if (wall.maxY !== undefined && currentY > wall.maxY) continue;

    const minDistance = radius + wall.thickness / 2;
    const dist = distanceToSegment(currentU, currentV, wall.u1, wall.v1, wall.u2, wall.v2);
    if (dist < minDistance) {
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
          currentU = projU + (pushU / pushLen) * minDistance;
          currentV = projV + (pushV / pushLen) * minDistance;
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

  if (!isInsideB4Boundary(currentU, currentV) && !isNearExitT1 && !onStairs) {
    currentU = prevU;
    currentV = prevV;
  }

  return toWorld(currentU, currentV);
}

export function getActiveRoom(worldX: number, worldZ: number, floor: number): RoomArea | null {
  const [u, v] = toLocal(worldX, worldZ);
  const rooms = floor === 1 ? B4_ROOMS_FLOOR_1 : floor === 2 ? B4_ROOMS_FLOOR_2 : B4_ROOMS_FLOOR_3;
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
  // 1. Khi ở ngoài khuôn viên: Block 4 đi thẳng qua cửa kính tự động, không hiện gợi ý nhấn E
  if (floor === null) {
    return null;
  }

  // 2. Khi ở bên trong: chỉ giữ nút thang máy phía Tây (ra/vào cửa đã tự động đi thông)
  const [u, v] = toLocal(worldX, worldZ);

  const distElevator = Math.hypot(u - B4_ELEVATOR_POS_LOCAL[0], v - B4_ELEVATOR_POS_LOCAL[1]);
  if (distElevator <= 2.8) {
    return {
      id: 'b4-elevator',
      type: 'elevator',
      worldPos: B4_ELEVATOR_POS_WORLD,
      radius: 2.8,
      label: 'Thang máy Thư viện B4 (Nhấn E)',
      buildingId: 'b4',
    };
  }

  return null;
}

export function stepStairHeight(
  worldX: number,
  worldZ: number,
  prevY: number,
  floor: number
): StairStepResult {
  const canStandOnFloorZero = (u: number, v: number): boolean => {
    const [rMinU, rMaxU, rMinV, rMaxV] = B4_REAR_STAIR.shaftBounds;
    if (u >= rMinU + 0.1 && u <= rMaxU - 0.1 && v >= rMinV + 0.1 && v <= rMaxV - 0.1) {
      return false;
    }
    const [gMinU, gMaxU, gMinV, gMaxV] = B4_GRAND_STAIR.shaftBounds;
    if (u >= gMinU + 0.18 && u <= gMaxU - 0.18 && v >= gMinV + 0.08 && v <= gMaxV - 0.08) {
      return false;
    }
    return true;
  };

  return evaluateStairHeight(
    B4_WALKABLE_STAIRS,
    toLocal,
    worldX,
    worldZ,
    prevY,
    floor,
    3,
    canStandOnFloorZero
  );
}

export const b4Layout: InteriorLayout = {
  buildingId: 'b4',
  name: 'Block 4 — Thư viện EIU',
  origin: B4_ORIGIN,
  rotationY: B4_ROTATION_Y,
  floors: 3,
  toWorld,
  toLocal,
  getFloorWalls,
  getFloorRooms: (f: number) => (f === 1 ? B4_ROOMS_FLOOR_1 : f === 2 ? B4_ROOMS_FLOOR_2 : B4_ROOMS_FLOOR_3),
  getFloorBoundaryPts,
  getFloorHoles,
  resolvePosition: resolveInteriorPosition,
  stepStairHeight,
  getActiveRoom,
  getNearInteractive,
  elevator: {
    posLocal: B4_ELEVATOR_POS_LOCAL,
    spawnLocal: B4_ELEVATOR_SPAWN_LOCAL,
    posWorld: B4_ELEVATOR_POS_WORLD,
    spawnWorld: B4_ELEVATOR_SPAWN_WORLD,
    facingYaw: getLocalWalkYaw(1, 0),
  },
  exteriorEntrances: b4ExteriorEntrances,
  defaultInsideEntrance: B4_ENTRANCE_MAIN_INSIDE,
  defaultOutsideEntrance: B4_ENTRANCE_MAIN_OUTSIDE,
};
