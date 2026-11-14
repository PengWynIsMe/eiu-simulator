import type { Vec2 } from '../../../types';
import type {
  WallSegment,
  RoomArea,
  InteractivePoint,
  InteriorLayout,
  ExteriorEntrance,
} from '../types';

/**
 * Hệ tọa độ địa phương B8:
 * Gốc tọa độ: góc Tây Bắc của Block 8 [-38.9, -206.8] (world).
 * Trục dài nghiêng -13.10° (atan2(-25.2, 108.3)).
 * u: dọc theo chiều dài tòa nhà (u = 0: đầu Tây; u ≈ 111.2: đầu Đông).
 * v: dọc theo chiều sâu tòa nhà (v = 0: mặt Bắc đường Lê Duẩn; v ≈ 44.2: mặt Nam nhìn vào nội khu).
 */
export const B8_ORIGIN: Vec2 = [-38.9, -206.8];
export const B8_ROTATION_Y = -0.228670836; // radians (-13.102°)

const COS = Math.cos(B8_ROTATION_Y);
const SIN = Math.sin(B8_ROTATION_Y);

export function toWorld(u: number, v: number): Vec2 {
  return [
    B8_ORIGIN[0] + u * COS - v * SIN,
    B8_ORIGIN[1] + u * SIN + v * COS,
  ];
}

export function toLocal(x: number, z: number): [number, number] {
  const dx = x - B8_ORIGIN[0];
  const dz = z - B8_ORIGIN[1];
  return [
    dx * COS + dz * SIN,
    -dx * SIN + dz * COS,
  ];
}

/** Vị trí thang máy duy nhất của tòa nhà (tại nhịp giữa, cạnh sân trong lớn) */
export const B8_ELEVATOR_POS_LOCAL: [number, number] = [47.5, 20.5];
export const B8_ELEVATOR_POS_WORLD: Vec2 = toWorld(B8_ELEVATOR_POS_LOCAL[0], B8_ELEVATOR_POS_LOCAL[1]);
/** Vị trí xuất hiện khi ra khỏi thang máy (trong hành lang giữa) */
export const B8_ELEVATOR_SPAWN_LOCAL: [number, number] = [43.8, 20.5];
export const B8_ELEVATOR_SPAWN_WORLD: Vec2 = toWorld(B8_ELEVATOR_SPAWN_LOCAL[0], B8_ELEVATOR_SPAWN_LOCAL[1]);

// 4 Lối ra vào tầng 1 của B8 (theo mũi tên LỐI THOÁT HIỂM trên sơ đồ T1)
export const B8_ENTRANCE_NORTH_OUTSIDE = toWorld(43.6, -2.5);
export const B8_ENTRANCE_NORTH_INSIDE = toWorld(43.6, 2.5);

export const B8_ENTRANCE_SOUTH_OUTSIDE = toWorld(43.6, 46.5);
export const B8_ENTRANCE_SOUTH_INSIDE = toWorld(43.6, 41.7);

export const B8_EXIT_EAST_OUTSIDE = toWorld(113.5, 20.9);
export const B8_EXIT_EAST_INSIDE = toWorld(108.5, 20.9);

export const B8_EXIT_WEST_OUTSIDE = toWorld(-10.5, 34.0);
export const B8_EXIT_WEST_INSIDE = toWorld(-5.5, 34.0);

export const b8ExteriorEntrances: readonly ExteriorEntrance[] = [
  {
    id: 'exterior-b8-north',
    buildingId: 'b8',
    worldPos: B8_ENTRANCE_NORTH_OUTSIDE,
    radius: 4.2,
    label: 'Vào Block 8 (Cửa Bắc — Nhịp giữa)',
    spawnInsideWorld: B8_ENTRANCE_NORTH_INSIDE,
    spawnInsideYaw: Math.PI / 2,
    spawnOutsideWorld: B8_ENTRANCE_NORTH_OUTSIDE,
    spawnOutsideYaw: -Math.PI / 2,
  },
  {
    id: 'exterior-b8-south',
    buildingId: 'b8',
    worldPos: B8_ENTRANCE_SOUTH_OUTSIDE,
    radius: 4.2,
    label: 'Vào Block 8 (Cửa Nam — Nhịp giữa)',
    spawnInsideWorld: B8_ENTRANCE_SOUTH_INSIDE,
    spawnInsideYaw: -Math.PI / 2,
    spawnOutsideWorld: B8_ENTRANCE_SOUTH_OUTSIDE,
    spawnOutsideYaw: Math.PI / 2,
  },
  {
    id: 'exterior-b8-east',
    buildingId: 'b8',
    worldPos: B8_EXIT_EAST_OUTSIDE,
    radius: 4.0,
    label: 'Vào Block 8 (Cửa Đông)',
    spawnInsideWorld: B8_EXIT_EAST_INSIDE,
    spawnInsideYaw: Math.PI,
    spawnOutsideWorld: B8_EXIT_EAST_OUTSIDE,
    spawnOutsideYaw: 0,
  },
  {
    id: 'exterior-b8-west',
    buildingId: 'b8',
    worldPos: B8_EXIT_WEST_OUTSIDE,
    radius: 4.0,
    label: 'Vào Block 8 (Cửa Tây)',
    spawnInsideWorld: B8_EXIT_WEST_INSIDE,
    spawnInsideYaw: 0,
    spawnOutsideWorld: B8_EXIT_WEST_OUTSIDE,
    spawnOutsideYaw: Math.PI,
  },
];

// =============================================================================
// DANH SÁCH PHÒNG THEO SƠ ĐỒ THOÁT HIỂM 4 TẦNG
// =============================================================================

// TẦNG 2: TẦNG MẪU (khung chuẩn)
export const TANG_2_B8_ROOMS: readonly RoomArea[] = [
  // --- Cánh Bắc (Dãy số chẵn) ---
  { code: 'Thang bộ Tây Bắc', name: 'Khu vực Cầu thang bộ Tây Bắc', minU: 0, maxU: 6.8, minV: 0, maxV: 10.5 },
  { code: '220.B8', name: 'Phòng học lý thuyết 220', minU: 6.8, maxU: 15.45, minV: 0, maxV: 10.5 },
  { code: '218.B8', name: 'Phòng học lý thuyết 218', minU: 15.45, maxU: 24.1, minV: 0, maxV: 10.5 },
  { code: '216.B8', name: 'Phòng học lý thuyết 216', minU: 24.1, maxU: 32.75, minV: 0, maxV: 10.5 },
  { code: '214.B8', name: 'Phòng học lý thuyết 214', minU: 32.75, maxU: 41.4, minV: 0, maxV: 10.5 },
  { code: 'Hành lang giữa', name: 'Cầu nối liên thông & Lõi thang bộ giữa', minU: 41.4, maxU: 45.8, minV: 0, maxV: 14.5 },
  { code: '212.B8', name: 'Phòng học lý thuyết 212', minU: 45.8, maxU: 54.4, minV: 0, maxV: 10.5 },
  { code: '210.B8', name: 'Phòng học lý thuyết 210', minU: 54.4, maxU: 63.0, minV: 0, maxV: 10.5 },
  { code: '208.B8', name: 'Phòng học lý thuyết 208', minU: 63.0, maxU: 71.6, minV: 0, maxV: 10.5 },
  { code: '206.B8', name: 'Phòng học lý thuyết 206', minU: 71.6, maxU: 80.2, minV: 0, maxV: 10.5 },
  { code: '204.B8', name: 'Phòng học lý thuyết 204', minU: 80.2, maxU: 88.8, minV: 0, maxV: 10.5 },
  { code: '202.B8', name: 'Phòng học lý thuyết 202', minU: 88.8, maxU: 97.4, minV: 0, maxV: 10.5 },
  { code: 'WC-2N', name: 'Khu vệ sinh & kho Đông Bắc', minU: 97.4, maxU: 104.5, minV: 0, maxV: 10.5 },
  { code: 'Thang bộ Đông Bắc', name: 'Khu vực Tháp thang bộ kính Đông Bắc', minU: 104.5, maxU: 111.2, minV: 0, maxV: 10.5 },

  // --- Cánh Nam (Dãy số lẻ) ---
  { code: 'WC-2S', name: 'Khu vệ sinh Tây Nam', minU: -8.25, maxU: 0, minV: 25.5, maxV: 44.2 },
  { code: 'Thang bộ Tây Nam', name: 'Khu vực Cầu thang bộ Tây Nam', minU: 0, maxU: 6.8, minV: 31.3, maxV: 44.2 },
  { code: '221.B8', name: 'Phòng học lý thuyết 221', minU: 6.8, maxU: 15.45, minV: 31.3, maxV: 44.2 },
  { code: '219.B8', name: 'Phòng học lý thuyết 219', minU: 15.45, maxU: 24.1, minV: 31.3, maxV: 44.2 },
  { code: '217.B8', name: 'Phòng học lý thuyết 217', minU: 24.1, maxU: 32.75, minV: 31.3, maxV: 44.2 },
  { code: '215.B8', name: 'Phòng học lý thuyết 215', minU: 32.75, maxU: 41.4, minV: 31.3, maxV: 44.2 },
  { code: '213.B8', name: 'Phòng học lý thuyết 213', minU: 45.8, maxU: 55.14, minV: 31.3, maxV: 44.2 },
  { code: '211.B8', name: 'Phòng học lý thuyết 211', minU: 55.14, maxU: 64.48, minV: 31.3, maxV: 44.2 },
  { code: '209.B8', name: 'Phòng học lý thuyết 209', minU: 64.48, maxU: 73.82, minV: 31.3, maxV: 44.2 },
  { code: '207.B8', name: 'Phòng học lý thuyết 207', minU: 73.82, maxU: 83.16, minV: 31.3, maxV: 44.2 },
  { code: '205.B8', name: 'Phòng học lý thuyết 205', minU: 83.16, maxU: 92.5, minV: 31.3, maxV: 44.2 },
  { code: '203.B8', name: 'Phòng học lý thuyết 203', minU: 92.5, maxU: 101.84, minV: 31.3, maxV: 44.2 },
  { code: '201.B8', name: 'Phòng học lý thuyết 201', minU: 101.84, maxU: 111.2, minV: 31.3, maxV: 44.2 },
];

// TẦNG 3: Sinh từ tầng 2 với các phòng gộp 311.B8, 309.B8 và các phòng 40 chỗ
export const TANG_3_B8_ROOMS: readonly RoomArea[] = [
  // Cánh Bắc
  { code: 'Thang bộ Tây Bắc', name: 'Khu vực Cầu thang bộ Tây Bắc', minU: 0, maxU: 6.8, minV: 0, maxV: 10.5 },
  { code: '320.B8', name: 'Phòng học lý thuyết 320', minU: 6.8, maxU: 15.45, minV: 0, maxV: 10.5 },
  { code: '318.B8', name: 'Phòng học lý thuyết 318', minU: 15.45, maxU: 24.1, minV: 0, maxV: 10.5 },
  { code: '316.B8', name: 'Phòng học lý thuyết 316', minU: 24.1, maxU: 32.75, minV: 0, maxV: 10.5 },
  { code: '314.B8', name: 'Phòng học lý thuyết 314', minU: 32.75, maxU: 41.4, minV: 0, maxV: 10.5 },
  { code: 'Hành lang giữa', name: 'Cầu nối liên thông & Lõi thang bộ giữa', minU: 41.4, maxU: 45.8, minV: 0, maxV: 14.5 },
  { code: '312.B8', name: 'Phòng học lý thuyết 312', minU: 45.8, maxU: 54.4, minV: 0, maxV: 10.5 },
  { code: '310.B8', name: 'Phòng học lý thuyết 310', minU: 54.4, maxU: 63.0, minV: 0, maxV: 10.5 },
  { code: '308.B8', name: 'Phòng học lý thuyết 308', minU: 63.0, maxU: 71.6, minV: 0, maxV: 10.5 },
  { code: '306.B8', name: 'Phòng học lý thuyết 306', minU: 71.6, maxU: 80.2, minV: 0, maxV: 10.5 },
  { code: '304.B8', name: 'Phòng học lý thuyết 304', minU: 80.2, maxU: 88.8, minV: 0, maxV: 10.5 },
  { code: '302.B8', name: 'Phòng học lý thuyết 302', minU: 88.8, maxU: 97.4, minV: 0, maxV: 10.5 },
  { code: 'WC-3N', name: 'Khu vệ sinh & kho Đông Bắc', minU: 97.4, maxU: 104.5, minV: 0, maxV: 10.5 },
  { code: 'Thang bộ Đông Bắc', name: 'Khu vực Tháp thang bộ kính Đông Bắc', minU: 104.5, maxU: 111.2, minV: 0, maxV: 10.5 },

  // Cánh Nam
  { code: 'WC-3S', name: 'Khu vệ sinh Tây Nam', minU: -8.25, maxU: 0, minV: 25.5, maxV: 44.2 },
  { code: 'Thang bộ Tây Nam', name: 'Khu vực Cầu thang bộ Tây Nam', minU: 0, maxU: 6.8, minV: 31.3, maxV: 44.2 },
  { code: '311.B8', name: 'Phòng học lớn 311 (60 sinh viên)', minU: 6.8, maxU: 24.1, minV: 31.3, maxV: 44.2 },
  { code: '309.B8', name: 'Phòng học lớn 309 (60 sinh viên)', minU: 24.1, maxU: 41.4, minV: 31.3, maxV: 44.2 },
  { code: '307.B8', name: 'Phòng học cỡ vừa 307 (40 sinh viên)', minU: 45.8, maxU: 62.15, minV: 31.3, maxV: 44.2 },
  { code: '305.B8', name: 'Phòng học cỡ vừa 305 (40 sinh viên)', minU: 62.15, maxU: 78.5, minV: 31.3, maxV: 44.2 },
  { code: '303.B8', name: 'Phòng học cỡ vừa 303 (40 sinh viên)', minU: 78.5, maxU: 94.85, minV: 31.3, maxV: 44.2 },
  { code: '301.B8', name: 'Phòng học cỡ vừa 301 (40 sinh viên)', minU: 94.85, maxU: 111.2, minV: 31.3, maxV: 44.2 },
];

// TẦNG 4: Sinh từ tầng 2 với phòng lớn 411.B8
export const TANG_4_B8_ROOMS: readonly RoomArea[] = [
  // Cánh Bắc
  { code: 'Thang bộ Tây Bắc', name: 'Khu vực Cầu thang bộ Tây Bắc', minU: 0, maxU: 6.8, minV: 0, maxV: 10.5 },
  { code: '420.B8', name: 'Phòng học lý thuyết 420', minU: 6.8, maxU: 15.45, minV: 0, maxV: 10.5 },
  { code: '418.B8', name: 'Phòng học lý thuyết 418', minU: 15.45, maxU: 24.1, minV: 0, maxV: 10.5 },
  { code: '416.B8', name: 'Phòng học lý thuyết 416', minU: 24.1, maxU: 32.75, minV: 0, maxV: 10.5 },
  { code: '414.B8', name: 'Phòng học lý thuyết 414', minU: 32.75, maxU: 41.4, minV: 0, maxV: 10.5 },
  { code: 'Hành lang giữa', name: 'Cầu nối liên thông & Lõi thang bộ giữa', minU: 41.4, maxU: 45.8, minV: 0, maxV: 14.5 },
  { code: '412.B8', name: 'Phòng học lý thuyết 412', minU: 45.8, maxU: 54.4, minV: 0, maxV: 10.5 },
  { code: '410.B8', name: 'Phòng học lý thuyết 410', minU: 54.4, maxU: 63.0, minV: 0, maxV: 10.5 },
  { code: '408.B8', name: 'Phòng học lý thuyết 408', minU: 63.0, maxU: 71.6, minV: 0, maxV: 10.5 },
  { code: '406.B8', name: 'Phòng học lý thuyết 406', minU: 71.6, maxU: 80.2, minV: 0, maxV: 10.5 },
  { code: '404.B8', name: 'Phòng học lý thuyết 404', minU: 80.2, maxU: 88.8, minV: 0, maxV: 10.5 },
  { code: '402.B8', name: 'Phòng học lý thuyết 402', minU: 88.8, maxU: 97.4, minV: 0, maxV: 10.5 },
  { code: 'WC-4N', name: 'Khu vệ sinh & kho Đông Bắc', minU: 97.4, maxU: 104.5, minV: 0, maxV: 10.5 },
  { code: 'Thang bộ Đông Bắc', name: 'Khu vực Tháp thang bộ kính Đông Bắc', minU: 104.5, maxU: 111.2, minV: 0, maxV: 10.5 },

  // Cánh Nam
  { code: 'WC-4S', name: 'Khu vệ sinh Tây Nam', minU: -8.25, maxU: 0, minV: 25.5, maxV: 44.2 },
  { code: 'Thang bộ Tây Nam', name: 'Khu vực Cầu thang bộ Tây Nam', minU: 0, maxU: 6.8, minV: 31.3, maxV: 44.2 },
  { code: '419.B8', name: 'Phòng học lý thuyết 419', minU: 6.8, maxU: 15.45, minV: 31.3, maxV: 44.2 },
  { code: '417.B8', name: 'Phòng học lý thuyết 417', minU: 15.45, maxU: 24.1, minV: 31.3, maxV: 44.2 },
  { code: '415.B8', name: 'Phòng học lý thuyết 415', minU: 24.1, maxU: 32.75, minV: 31.3, maxV: 44.2 },
  { code: '413.B8', name: 'Phòng học lý thuyết 413', minU: 32.75, maxU: 41.4, minV: 31.3, maxV: 44.2 },
  { code: '411.B8', name: 'Phòng học lớn 411 (60 sinh viên)', minU: 45.8, maxU: 64.48, minV: 31.3, maxV: 44.2 },
  { code: '409.B8', name: 'Phòng học cỡ vừa 409', minU: 64.48, maxU: 73.82, minV: 31.3, maxV: 44.2 },
  { code: '407.B8', name: 'Phòng học cỡ vừa 407', minU: 73.82, maxU: 83.16, minV: 31.3, maxV: 44.2 },
  { code: '405.B8', name: 'Phòng học cỡ vừa 405', minU: 83.16, maxU: 92.5, minV: 31.3, maxV: 44.2 },
  { code: '403.B8', name: 'Phòng học 403', minU: 92.5, maxU: 101.84, minV: 31.3, maxV: 44.2 },
  { code: '401.B8', name: 'Phòng học 401', minU: 101.84, maxU: 111.2, minV: 31.3, maxV: 44.2 },
];

// TẦNG 1 (TRỆT): Các phòng lớn, lối thông gió, bồn cây sân trong
export const TANG_1_B8_ROOMS: readonly RoomArea[] = [
  // Cánh Bắc
  { code: 'Thang bộ Tây Bắc', name: 'Khu vực Cầu thang bộ Tây Bắc', minU: 0, maxU: 6.8, minV: 0, maxV: 10.5 },
  { code: '116.B8', name: 'Phòng học lớn 116', minU: 6.8, maxU: 24.1, minV: 0, maxV: 10.5 },
  { code: '114.B8', name: 'Phòng học lớn 114', minU: 24.1, maxU: 41.4, minV: 0, maxV: 10.5 },
  { code: 'Hành lang thông gió Bắc', name: 'Lối vào thông gió Bắc — Nhịp giữa', minU: 41.4, maxU: 45.8, minV: 0, maxV: 14.5 },
  { code: '112.B8', name: 'Phòng học 112', minU: 45.8, maxU: 54.4, minV: 0, maxV: 10.5 },
  { code: '110.B8', name: 'Phòng học 110', minU: 54.4, maxU: 63.0, minV: 0, maxV: 10.5 },
  { code: '108.B8', name: 'Phòng học 108', minU: 63.0, maxU: 71.6, minV: 0, maxV: 10.5 },
  { code: '106.B8', name: 'Phòng học 106', minU: 71.6, maxU: 80.2, minV: 0, maxV: 10.5 },
  { code: '104.B8', name: 'Phòng học 104', minU: 80.2, maxU: 88.8, minV: 0, maxV: 10.5 },
  { code: '102.B8', name: 'Phòng Kỹ thuật điện 102', minU: 88.8, maxU: 97.4, minV: 0, maxV: 10.5 },
  { code: 'WC-1N', name: 'Khu vệ sinh Đông Bắc', minU: 97.4, maxU: 104.5, minV: 0, maxV: 10.5 },
  { code: 'Thang bộ Đông Bắc', name: 'Cầu thang & Cửa thoát hiểm phía Đông', minU: 104.5, maxU: 111.2, minV: 0, maxV: 10.5 },

  // Cánh Nam
  { code: 'WC-1S', name: 'Khu vệ sinh & Cửa thoát hiểm phía Tây', minU: -8.25, maxU: 0, minV: 25.5, maxV: 44.2 },
  { code: 'Thang bộ Tây Nam', name: 'Khu vực Cầu thang bộ Tây Nam', minU: 0, maxU: 6.8, minV: 31.3, maxV: 44.2 },
  { code: '111.B8', name: 'Phòng học lớn 111', minU: 6.8, maxU: 24.1, minV: 31.3, maxV: 44.2 },
  { code: '109.B8', name: 'Phòng học lớn 109', minU: 24.1, maxU: 41.4, minV: 31.3, maxV: 44.2 },
  { code: 'Hành lang thông gió Nam', name: 'Lối vào thông gió Nam — Nhịp giữa', minU: 41.4, maxU: 45.8, minV: 27.3, maxV: 44.2 },
  { code: '107.B8', name: 'Phòng học lớn 107', minU: 45.8, maxU: 62.15, minV: 31.3, maxV: 44.2 },
  { code: '105.B8', name: 'Phòng học lớn 105', minU: 62.15, maxU: 78.5, minV: 31.3, maxV: 44.2 },
  { code: '103.B8', name: 'Phòng học lớn 103', minU: 78.5, maxU: 94.85, minV: 31.3, maxV: 44.2 },
  { code: '101.B8', name: 'Phòng học lớn 101', minU: 94.85, maxU: 111.2, minV: 31.3, maxV: 44.2 },
];

export function getFloorRooms(floor: number): readonly RoomArea[] {
  if (floor === 1) return TANG_1_B8_ROOMS;
  if (floor === 3) return TANG_3_B8_ROOMS;
  if (floor === 4) return TANG_4_B8_ROOMS;
  return TANG_2_B8_ROOMS;
}

// =============================================================================
// TẠO HÌNH HỌC TƯỜNG CHO TỪNG TẦNG
// =============================================================================

function createFloorWalls(floor: number): WallSegment[] {
  const walls: WallSegment[] = [];

  // 1. Tường bao ngoài (Outer Perimeter)
  // Mặt Bắc (v = 0):
  if (floor === 1) {
    // Tầng 1: Cửa nhịp giữa mở tại u ∈ [42.0, 45.2]
    walls.push({ u1: 0, v1: 0, u2: 42.0, v2: 0, thickness: 0.3 });
    walls.push({ u1: 45.2, v1: 0, u2: 111.2, v2: 0, thickness: 0.3 });
  } else {
    walls.push({ u1: 0, v1: 0, u2: 111.2, v2: 0, thickness: 0.3 });
  }

  // Mặt Đông (u = 111.2):
  if (floor === 1) {
    // Tầng 1: Cửa thoát hiểm mở tại v ∈ [19.0, 22.8]
    walls.push({ u1: 111.2, v1: 0, u2: 111.2, v2: 19.0, thickness: 0.3 });
    walls.push({ u1: 111.2, v1: 22.8, u2: 111.2, v2: 44.2, thickness: 0.3 });
  } else {
    walls.push({ u1: 111.2, v1: 0, u2: 111.2, v2: 44.2, thickness: 0.3 });
  }

  // Mặt Nam (v = 44.2):
  if (floor === 1) {
    // Tầng 1: Cửa nhịp giữa mở tại u ∈ [42.0, 45.2]
    walls.push({ u1: 111.2, v1: 44.2, u2: 45.2, v2: 44.2, thickness: 0.3 });
    walls.push({ u1: 42.0, v1: 44.2, u2: -8.25, v2: 44.2, thickness: 0.3 });
  } else {
    walls.push({ u1: 111.2, v1: 44.2, u2: -8.25, v2: 44.2, thickness: 0.3 });
  }

  // Mặt Tây cánh Nam (u = -8.25):
  if (floor === 1) {
    // Tầng 1: Cửa thoát hiểm mở tại v ∈ [32.0, 36.0]
    walls.push({ u1: -8.25, v1: 44.2, u2: -8.25, v2: 36.0, thickness: 0.3 });
    walls.push({ u1: -8.25, v1: 32.0, u2: -8.25, v2: 25.5, thickness: 0.3 });
  } else {
    walls.push({ u1: -8.25, v1: 44.2, u2: -8.25, v2: 25.5, thickness: 0.3 });
  }

  // Khớp góc Tây Nam (v = 25.5 từ u = -8.25 đến u = 0):
  walls.push({ u1: -8.25, v1: 25.5, u2: 0, v2: 25.5, thickness: 0.3 });

  // Mặt Tây cánh Bắc (u = 0, v từ 25.5 về 0):
  walls.push({ u1: 0, v1: 25.5, u2: 0, v2: 0, thickness: 0.3 });

  // 2. Tường ngăn hành lang và phòng học (có cửa ra vào)
  const rooms = getFloorRooms(floor);

  // Nhóm phòng cánh Bắc (v: 0..10.5):
  // Tường hành lang Bắc tại v = 10.5:
  const northRooms = rooms.filter((r) => r.minV === 0 && r.code.includes('.B8'));
  for (const r of northRooms) {
    // Để cửa hở 1.4m ở mép phải của phòng
    const doorStart = r.maxU - 1.8;
    const doorEnd = r.maxU - 0.4;
    walls.push({ u1: r.minU, v1: 10.5, u2: doorStart, v2: 10.5, thickness: 0.2 });
    walls.push({ u1: doorEnd, v1: 10.5, u2: r.maxU, v2: 10.5, thickness: 0.2 });
    // Tường ngăn dọc giữa các phòng
    walls.push({ u1: r.maxU, v1: 0, u2: r.maxU, v2: 10.5, thickness: 0.2 });
  }

  // Nhóm phòng cánh Nam (v: 31.3..44.2):
  // Tường hành lang Nam tại v = 31.3:
  const southRooms = rooms.filter((r) => r.maxV === 44.2 && r.code.includes('.B8'));
  for (const r of southRooms) {
    // Để cửa hở 1.4m ở mép trái của phòng
    const doorStart = r.minU + 0.4;
    const doorEnd = r.minU + 1.8;
    walls.push({ u1: r.minU, v1: 31.3, u2: doorStart, v2: 31.3, thickness: 0.2 });
    walls.push({ u1: doorEnd, v1: 31.3, u2: r.maxU, v2: 31.3, thickness: 0.2 });
    // Tường ngăn dọc giữa các phòng
    walls.push({ u1: r.maxU, v1: 31.3, u2: r.maxU, v2: 44.2, thickness: 0.2 });
  }

  // 3. Lan can an toàn bao quanh 2 sân trong (chặn va chạm)
  // Sân trong Tây: u ∈ [6.8, 41.4], v ∈ [14.5, 27.3]
  // Sân trong Đông: u ∈ [45.8, 105.4], v ∈ [14.5, 27.3]
  // Mép Bắc sân trong (v = 14.5)
  walls.push({ u1: 6.8, v1: 14.5, u2: 41.4, v2: 14.5, thickness: 0.15, isGlass: true });
  walls.push({ u1: 45.8, v1: 14.5, u2: 105.4, v2: 14.5, thickness: 0.15, isGlass: true });

  // Mép Nam sân trong (v = 27.3)
  walls.push({ u1: 6.8, v1: 27.3, u2: 41.4, v2: 27.3, thickness: 0.15, isGlass: true });
  walls.push({ u1: 45.8, v1: 27.3, u2: 105.4, v2: 27.3, thickness: 0.15, isGlass: true });

  // Đầu Tây sân Tây (u = 6.8)
  walls.push({ u1: 6.8, v1: 14.5, u2: 6.8, v2: 27.3, thickness: 0.15, isGlass: true });
  // Đầu Đông sân Tây (u = 41.4, cạnh thang bộ giữa)
  walls.push({ u1: 41.4, v1: 14.5, u2: 41.4, v2: 27.3, thickness: 0.2 });

  // Đầu Tây sân Đông (u = 45.8, cạnh thang máy)
  walls.push({ u1: 45.8, v1: 14.5, u2: 45.8, v2: 18.5, thickness: 0.2 });
  walls.push({ u1: 45.8, v1: 22.5, u2: 45.8, v2: 27.3, thickness: 0.2 });

  // Đầu Đông sân Đông (u = 105.4, cạnh thang Đông)
  walls.push({ u1: 105.4, v1: 14.5, u2: 105.4, v2: 27.3, thickness: 0.2 });

  // 4. Hộp buồng thang máy (u ∈ [45.8, 49.5], v ∈ [18.5, 22.5])
  walls.push({ u1: 49.5, v1: 18.5, u2: 49.5, v2: 22.5, thickness: 0.25 }); // Lưng thang
  walls.push({ u1: 45.8, v1: 18.5, u2: 49.5, v2: 18.5, thickness: 0.25 }); // Hông Bắc
  walls.push({ u1: 45.8, v1: 22.5, u2: 49.5, v2: 22.5, thickness: 0.25 }); // Hông Nam

  // 5. Vách tháp cầu thang kính Đông Bắc (u = 104.5, v ∈ [0, 10.5])
  walls.push({ u1: 104.5, v1: 0, u2: 104.5, v2: 10.5, thickness: 0.2, isGlass: true });

  // 6. Tường WC Đông Bắc & Tây Nam
  walls.push({ u1: 97.4, v1: 0, u2: 97.4, v2: 10.5, thickness: 0.2 });
  walls.push({ u1: 0, v1: 31.3, u2: 0, v2: 44.2, thickness: 0.2 });

  return walls;
}

const TANG_1_WALLS = createFloorWalls(1);
const TANG_2_WALLS = createFloorWalls(2);
const TANG_3_WALLS = createFloorWalls(3);
const TANG_4_WALLS = createFloorWalls(4);

export function getFloorWalls(floor: number): readonly WallSegment[] {
  if (floor === 1) return TANG_1_WALLS;
  if (floor === 3) return TANG_3_WALLS;
  if (floor === 4) return TANG_4_WALLS;
  return TANG_2_WALLS;
}

// Đa giác biên sàn B8
export function getFloorBoundaryPts(): Vec2[] {
  return [
    toWorld(0, 0),
    toWorld(111.2, 0),
    toWorld(111.2, 44.2),
    toWorld(-8.25, 44.2),
    toWorld(-8.25, 25.5),
    toWorld(0, 25.5),
  ];
}

// 2 Lỗ giếng trời sân trong cho các tầng 2, 3, 4
export function getFloorHoles(floor: number): Vec2[][] {
  if (floor === 1) return []; // Tầng 1 phủ kín sàn sân vườn

  const westCourtyardHole: Vec2[] = [
    toWorld(6.8, 14.5),
    toWorld(41.4, 14.5),
    toWorld(41.4, 27.3),
    toWorld(6.8, 27.3),
  ];

  // Sân Đông chừa buồng thang máy tại u ∈ [45.8, 49.5], v ∈ [18.5, 22.5]
  const eastCourtyardHole: Vec2[] = [
    toWorld(45.8, 14.5),
    toWorld(105.4, 14.5),
    toWorld(105.4, 27.3),
    toWorld(45.8, 27.3),
    toWorld(45.8, 22.5),
    toWorld(49.5, 22.5),
    toWorld(49.5, 18.5),
    toWorld(45.8, 18.5),
  ];

  return [westCourtyardHole, eastCourtyardHole];
}

function distanceToSegment(u: number, v: number, u1: number, v1: number, u2: number, v2: number): number {
  const du = u2 - u1;
  const dv = v2 - v1;
  const lenSq = du * du + dv * dv;
  if (lenSq === 0) return Math.hypot(u - u1, v - v1);
  const t = Math.max(0, Math.min(1, ((u - u1) * du + (v - v1) * dv) / lenSq));
  const projU = u1 + t * du;
  const projV = v1 + t * dv;
  return Math.hypot(u - projU, v - projV);
}

function isInsideB8FloorBoundary(u: number, v: number, floor: number): boolean {
  // 1. Phải nằm trong khung chữ nhật lớn hoặc phần mở rộng Tây Nam
  const inMain = u >= 0 && u <= 111.2 && v >= 0 && v <= 44.2;
  const inSW = u >= -8.25 && u < 0 && v >= 25.5 && v <= 44.2;
  if (!inMain && !inSW) return false;

  // 2. Ở tầng 2–4: không được rơi vào 2 giếng trời sân trong
  if (floor >= 2) {
    // Sân Tây
    if (u > 6.8 && u < 41.4 && v > 14.5 && v < 27.3) return false;
    // Sân Đông
    if (u > 45.8 && u < 105.4 && v > 14.5 && v < 27.3) {
      // Ngoại trừ buồng thang máy
      const inElevator = u >= 45.8 && u <= 49.5 && v >= 18.5 && v <= 22.5;
      if (!inElevator) return false;
    }
  }

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
  const [nextU, nextV] = toLocal(nextX, nextZ);
  const [prevU, prevV] = toLocal(prevX, prevZ);

  let currentU = nextU;
  let currentV = nextV;

  // Cho phép đi xuyên vùng cửa tầng 1
  const isNearExitT1 =
    floor === 1 &&
    ((currentU >= 41.5 && currentU <= 45.5 && (currentV <= 1.0 || currentV >= 43.2)) ||
      (currentU >= 109.0 && currentV >= 19.0 && currentV <= 22.8) ||
      (currentU <= -6.0 && currentV >= 32.0 && currentV <= 36.0));

  if (!isInsideB8FloorBoundary(currentU, currentV, floor) && !isNearExitT1) {
    currentU = prevU;
    currentV = prevV;
  }

  // Va chạm với từng đoạn tường
  const walls = getFloorWalls(floor);
  for (const wall of walls) {
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

  if (!isInsideB8FloorBoundary(currentU, currentV, floor) && !isNearExitT1) {
    currentU = prevU;
    currentV = prevV;
  }

  return toWorld(currentU, currentV);
}

export function getActiveRoom(worldX: number, worldZ: number, floor: number): RoomArea | null {
  const [u, v] = toLocal(worldX, worldZ);
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
    // Ngoài khuôn viên: kiểm tra 4 cửa B8
    for (const entrance of b8ExteriorEntrances) {
      const dist = Math.hypot(worldX - entrance.worldPos[0], worldZ - entrance.worldPos[1]);
      if (dist <= entrance.radius) {
        return {
          id: entrance.id,
          type: 'exterior-door',
          worldPos: entrance.worldPos,
          radius: entrance.radius,
          label: entrance.label,
          buildingId: 'b8',
          spawnPosWorld: entrance.spawnInsideWorld,
          spawnYaw: entrance.spawnInsideYaw,
        };
      }
    }
    return null;
  }

  // Trong nội thất:
  // 1. Thang máy duy nhất của tòa nhà (ở nhịp giữa)
  const distElevator = Math.hypot(worldX - B8_ELEVATOR_POS_WORLD[0], worldZ - B8_ELEVATOR_POS_WORLD[1]);
  if (distElevator <= 3.5) {
    return {
      id: 'interior-elevator',
      type: 'elevator',
      worldPos: B8_ELEVATOR_POS_WORLD,
      radius: 3.5,
      label: 'Thang máy Block 8',
      buildingId: 'b8',
    };
  }

  // 2. Các cửa thoát hiểm ra ngoài (chỉ ở Tầng 1)
  if (floor === 1) {
    const exits = [
      { id: 'exit-north', pos: B8_ENTRANCE_NORTH_INSIDE, outPos: B8_ENTRANCE_NORTH_OUTSIDE, label: 'Ra ngoài (Cửa Bắc)' },
      { id: 'exit-south', pos: B8_ENTRANCE_SOUTH_INSIDE, outPos: B8_ENTRANCE_SOUTH_OUTSIDE, label: 'Ra ngoài (Cửa Nam)' },
      { id: 'exit-east', pos: B8_EXIT_EAST_INSIDE, outPos: B8_EXIT_EAST_OUTSIDE, label: 'Ra ngoài (Cửa Đông)' },
      { id: 'exit-west', pos: B8_EXIT_WEST_INSIDE, outPos: B8_EXIT_WEST_OUTSIDE, label: 'Ra ngoài (Cửa Tây)' },
    ];

    for (const exit of exits) {
      const dist = Math.hypot(worldX - exit.pos[0], worldZ - exit.pos[1]);
      if (dist <= 3.5) {
        return {
          id: exit.id,
          type: 'interior-door',
          worldPos: exit.pos,
          radius: 3.5,
          label: exit.label,
          buildingId: 'b8',
          spawnPosWorld: exit.outPos,
        };
      }
    }
  }

  return null;
}

export const b8Layout: InteriorLayout = {
  buildingId: 'b8',
  name: 'Block 8 (Khu phòng học đa năng)',
  origin: B8_ORIGIN,
  rotationY: B8_ROTATION_Y,
  floors: 4,
  toWorld,
  toLocal,
  getFloorWalls,
  getFloorRooms,
  getFloorBoundaryPts,
  getFloorHoles,
  resolvePosition: resolveInteriorPosition,
  getActiveRoom,
  getNearInteractive,
  elevator: {
    posLocal: B8_ELEVATOR_POS_LOCAL,
    spawnLocal: B8_ELEVATOR_SPAWN_LOCAL,
    posWorld: B8_ELEVATOR_POS_WORLD,
    spawnWorld: B8_ELEVATOR_SPAWN_WORLD,
    facingYaw: Math.PI,
  },
  exteriorEntrances: b8ExteriorEntrances,
  defaultInsideEntrance: B8_ENTRANCE_NORTH_INSIDE,
  defaultOutsideEntrance: B8_ENTRANCE_NORTH_OUTSIDE,
};
