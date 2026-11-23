import { getClassroom } from '../../../data';
import type { Vec2 } from '../../../types';
import type {
  WallSegment,
  RoomArea,
  InteractivePoint,
  InteriorLayout,
  ExteriorEntrance,
  StairStepResult,
} from '../types';
import {
  buildSwitchbackWalkableSpec,
  evaluateStairHeight,
  isInsideAnyStairFootprint,
  type SwitchbackStairGeometrySpec,
  type WalkableStairSpec,
} from '../stairs';

/**
 * Hệ tọa độ địa phương B8 đo từ sơ đồ thoát hiểm thực tế (docs/tasks/T13b-b8-toa-do.json):
 * Trục dài nghiêng -13.1° (axisAngleDeg: -13.1).
 * ex = [0.97398, -0.22663] (Tây → Đông)
 * ev = [0.22663, 0.97398] (Bắc → Nam)
 * world[x, z] = u * ex + v * ev
 * u: 9.0 = tường Tây thân chính, 120.4 = tường Đông
 * v: -210.2 = tường Bắc, -166.0 = tường Nam
 */
export const B8_EX = [0.97398, -0.22663] as const;
export const B8_EV = [0.22663, 0.97398] as const;
export const B8_ROTATION_Y = -0.228638132; // -13.1° in radians
export const B8_ORIGIN: Vec2 = [0, 0];

export function toWorld(u: number, v: number): Vec2 {
  return [
    u * B8_EX[0] + v * B8_EV[0],
    u * B8_EX[1] + v * B8_EV[1],
  ];
}

export function toLocal(x: number, z: number): [number, number] {
  return [
    x * B8_EX[0] + z * B8_EX[1],
    x * B8_EV[0] + z * B8_EV[1],
  ];
}

// Tâm B8 (u_mid = 64.7, v_mid = -188.1)
export const B8_CENTER_WORLD = toWorld(64.7, -188.1);

/** Vị trí thang máy duy nhất của tòa nhà (tại nhịp giữa, cạnh sân trong lớn) */
export const B8_ELEVATOR_POS_LOCAL: [number, number] = [56.65, -188.35];
export const B8_ELEVATOR_POS_WORLD: Vec2 = toWorld(B8_ELEVATOR_POS_LOCAL[0], B8_ELEVATOR_POS_LOCAL[1]);
/** Vị trí xuất hiện khi ra khỏi thang máy (hành lang giữa, phía trước cửa thang máy) */
export const B8_ELEVATOR_SPAWN_LOCAL: [number, number] = [53.5, -188.35];
export const B8_ELEVATOR_SPAWN_WORLD: Vec2 = toWorld(B8_ELEVATOR_SPAWN_LOCAL[0], B8_ELEVATOR_SPAWN_LOCAL[1]);

// 4 Lối ra vào tầng 1 của B8 (theo sơ đồ T1)
export const B8_ENTRANCE_NORTH_OUTSIDE = toWorld(52.8, -213.0);
export const B8_ENTRANCE_NORTH_INSIDE = toWorld(52.8, -199.0);

export const B8_ENTRANCE_SOUTH_OUTSIDE = toWorld(52.8, -163.0);
export const B8_ENTRANCE_SOUTH_INSIDE = toWorld(52.8, -178.5);

export const B8_EXIT_EAST_OUTSIDE = toWorld(123.0, -188.75);
export const B8_EXIT_EAST_INSIDE = toWorld(118.0, -188.75);

export const B8_EXIT_WEST_OUTSIDE = toWorld(6.5, -188.75);
export const B8_EXIT_WEST_INSIDE = toWorld(11.0, -188.75);

export const b8ExteriorEntrances: readonly ExteriorEntrance[] = [
  {
    id: 'exterior-b8-north',
    buildingId: 'b8',
    worldPos: B8_ENTRANCE_NORTH_OUTSIDE,
    radius: 4.2,
    label: 'Vào Block 8 (Cửa Bắc — Nhịp giữa)',
    spawnInsideWorld: B8_ENTRANCE_NORTH_INSIDE,
    spawnInsideYaw: 0,
    spawnOutsideWorld: B8_ENTRANCE_NORTH_OUTSIDE,
    spawnOutsideYaw: Math.PI,
  },
  {
    id: 'exterior-b8-south',
    buildingId: 'b8',
    worldPos: B8_ENTRANCE_SOUTH_OUTSIDE,
    radius: 4.2,
    label: 'Vào Block 8 (Cửa Nam — Nhịp giữa)',
    spawnInsideWorld: B8_ENTRANCE_SOUTH_INSIDE,
    spawnInsideYaw: Math.PI,
    spawnOutsideWorld: B8_ENTRANCE_SOUTH_OUTSIDE,
    spawnOutsideYaw: 0,
  },
  {
    id: 'exterior-b8-east',
    buildingId: 'b8',
    worldPos: B8_EXIT_EAST_OUTSIDE,
    radius: 4.0,
    label: 'Vào Block 8 (Cửa Đông)',
    spawnInsideWorld: B8_EXIT_EAST_INSIDE,
    spawnInsideYaw: -Math.PI / 2,
    spawnOutsideWorld: B8_EXIT_EAST_OUTSIDE,
    spawnOutsideYaw: Math.PI / 2,
  },
  {
    id: 'exterior-b8-west',
    buildingId: 'b8',
    worldPos: B8_EXIT_WEST_OUTSIDE,
    radius: 4.0,
    label: 'Vào Block 8 (Cửa Tây)',
    spawnInsideWorld: B8_EXIT_WEST_INSIDE,
    spawnInsideYaw: Math.PI / 2,
    spawnOutsideWorld: B8_EXIT_WEST_OUTSIDE,
    spawnOutsideYaw: -Math.PI / 2,
  },
];

// =============================================================================
// DANH SÁCH PHÒNG THEO SƠ ĐỒ THOÁT HIỂM 4 TẦNG (T13b-b8-toa-do.json)
// =============================================================================

// TẦNG 1: TRỆT
export const TANG_1_B8_ROOMS: readonly RoomArea[] = [
  // --- Cánh Bắc ---
  { code: 'Thang bộ Tây Bắc', name: 'Sảnh mở Tây + thang bộ Tây Bắc', minU: 9.0, maxU: 13.9, minV: -210.2, maxV: -200.3 },
  { code: '116.B8', name: 'Phòng học 116', minU: 13.9, maxU: 31.8, minV: -209.8, maxV: -200.3 },
  { code: '114.B8', name: 'Phòng học 114', minU: 31.8, maxU: 50.8, minV: -209.8, maxV: -200.3 },
  { code: 'Thang bộ giữa (Bắc)', name: 'Cầu thang bộ giữa (Bắc)', minU: 50.8, maxU: 54.7, minV: -209.8, maxV: -200.3 },
  { code: '112.B8', name: 'Phòng học 112', minU: 54.7, maxU: 64.3, minV: -209.8, maxV: -200.3 },
  { code: '110.B8', name: 'Phòng học 110', minU: 64.3, maxU: 73.5, minV: -209.8, maxV: -200.3 },
  { code: '108.B8', name: 'Phòng học 108', minU: 73.5, maxU: 83.0, minV: -209.8, maxV: -200.3 },
  { code: '106.B8', name: 'Phòng học 106', minU: 83.0, maxU: 92.3, minV: -209.8, maxV: -200.3 },
  { code: '104.B8', name: 'Phòng học 104', minU: 92.3, maxU: 101.6, minV: -209.8, maxV: -200.3 },
  { code: '102.B8', name: 'Phòng Kỹ thuật điện 102', minU: 101.6, maxU: 110.6, minV: -209.8, maxV: -200.3 },
  { code: 'WC-1N', name: 'Khu vệ sinh Đông Bắc', minU: 110.6, maxU: 120.4, minV: -209.8, maxV: -200.3 },

  // --- Cánh Nam ---
  { code: 'WC-1S', name: 'Khu vệ sinh Tây Nam', minU: 1.2, maxU: 10.9, minV: -179.0, maxV: -167.5 },
  { code: 'Thang bộ Tây Nam', name: 'Cầu thang bộ Tây Nam', minU: 10.9, maxU: 14.3, minV: -177.8, maxV: -166.0 },
  { code: '111.B8', name: 'Phòng học 111', minU: 14.3, maxU: 32.5, minV: -177.8, maxV: -166.0 },
  { code: '109.B8', name: 'Phòng học 109', minU: 32.5, maxU: 50.8, minV: -177.8, maxV: -166.0 },
  { code: 'Thang bộ giữa (Nam)', name: 'Cầu thang bộ giữa (Nam)', minU: 50.8, maxU: 54.7, minV: -177.8, maxV: -166.0 },
  { code: '107.B8', name: 'Phòng học 107', minU: 54.7, maxU: 72.6, minV: -177.8, maxV: -166.0 },
  { code: '105.B8', name: 'Phòng học 105', minU: 72.6, maxU: 90.9, minV: -177.8, maxV: -166.0 },
  { code: '103.B8', name: 'Phòng học 103', minU: 90.9, maxU: 109.2, minV: -177.8, maxV: -166.0 },
  { code: '101.B8', name: 'Phòng học 101', minU: 109.2, maxU: 118.1, minV: -177.8, maxV: -166.0 },

  // --- Lõi giữa & Sân Đông ---
  { code: 'Thang bộ Đông', name: 'Lõi thang bộ Đông (trong sân Đông)', minU: 108.1, maxU: 115.1, minV: -190.8, maxV: -185.6 },
];

// TẦNG 2: TẦNG MẪU CHUẨN
export const TANG_2_B8_ROOMS: readonly RoomArea[] = [
  // --- Cánh Bắc ---
  { code: 'Thang bộ Tây Bắc', name: 'Khu vực Cầu thang bộ Tây Bắc', minU: 9.0, maxU: 13.1, minV: -210.2, maxV: -200.0 },
  { code: '220.B8', name: 'Phòng học 220', minU: 13.1, maxU: 22.4, minV: -210.2, maxV: -200.0 },
  { code: '218.B8', name: 'Phòng học 218', minU: 22.4, maxU: 31.6, minV: -210.2, maxV: -200.0 },
  { code: '216.B8', name: 'Phòng học 216', minU: 31.6, maxU: 40.8, minV: -210.2, maxV: -200.0 },
  { code: '214.B8', name: 'Phòng học 214', minU: 40.8, maxU: 49.7, minV: -210.2, maxV: -200.0 },
  { code: 'Thang bộ giữa (Bắc)', name: 'Cầu thang bộ giữa (Bắc)', minU: 49.7, maxU: 54.1, minV: -210.2, maxV: -200.0 },
  { code: '212.B8', name: 'Phòng học 212', minU: 54.1, maxU: 63.1, minV: -210.2, maxV: -200.0 },
  { code: '210.B8', name: 'Phòng học 210', minU: 63.1, maxU: 72.5, minV: -210.2, maxV: -200.0 },
  { code: '208.B8', name: 'Phòng học 208', minU: 72.5, maxU: 81.9, minV: -210.2, maxV: -200.0 },
  { code: '206.B8', name: 'Phòng học 206', minU: 81.9, maxU: 91.3, minV: -210.2, maxV: -200.0 },
  { code: '204.B8', name: 'Phòng học 204', minU: 91.3, maxU: 100.5, minV: -210.2, maxV: -200.0 },
  { code: '202.B8', name: 'Phòng học 202', minU: 100.5, maxU: 109.7, minV: -210.2, maxV: -200.0 },
  { code: 'WC-2N', name: 'WC + Thang bộ Đông Bắc', minU: 109.7, maxU: 119.4, minV: -210.2, maxV: -200.0 },

  // --- Cánh Nam ---
  { code: 'WC-2S', name: 'Khu vệ sinh Tây Nam', minU: 0.3, maxU: 9.7, minV: -181.0, maxV: -166.0 },
  { code: 'Thang bộ Tây Nam', name: 'Khu vực Cầu thang bộ Tây Nam', minU: 9.7, maxU: 13.5, minV: -177.7, maxV: -166.0 },
  { code: '221.B8', name: 'Phòng học 221', minU: 13.5, maxU: 22.6, minV: -177.7, maxV: -166.0 },
  { code: '219.B8', name: 'Phòng học 219', minU: 22.6, maxU: 31.7, minV: -177.7, maxV: -166.0 },
  { code: '217.B8', name: 'Phòng học 217', minU: 31.7, maxU: 40.8, minV: -177.7, maxV: -166.0 },
  { code: '215.B8', name: 'Phòng học 215', minU: 40.8, maxU: 50.0, minV: -177.7, maxV: -166.0 },
  { code: 'Thang bộ giữa (Nam)', name: 'Cầu thang bộ giữa (Nam)', minU: 50.0, maxU: 53.7, minV: -177.7, maxV: -166.0 },
  { code: '213.B8', name: 'Phòng học 213', minU: 53.7, maxU: 62.7, minV: -177.7, maxV: -166.0 },
  { code: '211.B8', name: 'Phòng học 211', minU: 62.7, maxU: 71.5, minV: -177.7, maxV: -166.0 },
  { code: '209.B8', name: 'Phòng học 209', minU: 71.5, maxU: 80.8, minV: -177.7, maxV: -166.0 },
  { code: '207.B8', name: 'Phòng học 207', minU: 80.8, maxU: 90.1, minV: -177.7, maxV: -166.0 },
  { code: '205.B8', name: 'Phòng học 205', minU: 90.1, maxU: 99.5, minV: -177.7, maxV: -166.0 },
  { code: '203.B8', name: 'Phòng học 203', minU: 99.5, maxU: 108.8, minV: -177.7, maxV: -166.0 },
  { code: '201.B8', name: 'Phòng học 201', minU: 108.8, maxU: 117.7, minV: -177.7, maxV: -166.0 },

  // --- Lõi giữa & Sân Đông ---
  { code: 'Thang bộ Đông', name: 'Lõi thang bộ Đông (trong sân Đông)', minU: 106.9, maxU: 114.5, minV: -190.3, maxV: -184.8 },
];

// TẦNG 3: Cánh Bắc giữ ô, cánh Nam gộp phòng 311, 309, 307, 305, 303, 301
export const TANG_3_B8_ROOMS: readonly RoomArea[] = [
  // --- Cánh Bắc ---
  { code: 'Thang bộ Tây Bắc', name: 'Khu vực Cầu thang bộ Tây Bắc', minU: 9.0, maxU: 13.1, minV: -210.2, maxV: -200.0 },
  { code: '320.B8', name: 'Phòng học 320', minU: 13.1, maxU: 22.4, minV: -210.2, maxV: -200.0 },
  { code: '318.B8', name: 'Phòng học 318', minU: 22.4, maxU: 31.6, minV: -210.2, maxV: -200.0 },
  { code: '316.B8', name: 'Phòng học 316', minU: 31.6, maxU: 40.8, minV: -210.2, maxV: -200.0 },
  { code: '314.B8', name: 'Phòng học 314', minU: 40.8, maxU: 49.7, minV: -210.2, maxV: -200.0 },
  { code: 'Thang bộ giữa (Bắc)', name: 'Cầu thang bộ giữa (Bắc)', minU: 49.7, maxU: 54.1, minV: -210.2, maxV: -200.0 },
  { code: '312.B8', name: 'Phòng học 312', minU: 54.1, maxU: 63.1, minV: -210.2, maxV: -200.0 },
  { code: '310.B8', name: 'Phòng học 310', minU: 63.1, maxU: 72.5, minV: -210.2, maxV: -200.0 },
  { code: '308.B8', name: 'Phòng học 308', minU: 72.5, maxU: 81.9, minV: -210.2, maxV: -200.0 },
  { code: '306.B8', name: 'Phòng học 306', minU: 81.9, maxU: 91.3, minV: -210.2, maxV: -200.0 },
  { code: '304.B8', name: 'Phòng học 304', minU: 91.3, maxU: 100.5, minV: -210.2, maxV: -200.0 },
  { code: '302.B8', name: 'Phòng học 302', minU: 100.5, maxU: 109.7, minV: -210.2, maxV: -200.0 },
  { code: 'WC-3N', name: 'WC + Thang bộ Đông Bắc', minU: 109.7, maxU: 119.4, minV: -210.2, maxV: -200.0 },

  // --- Cánh Nam ---
  { code: 'WC-3S', name: 'Khu vệ sinh Tây Nam', minU: 0.3, maxU: 9.7, minV: -181.0, maxV: -166.0 },
  { code: 'Thang bộ Tây Nam', name: 'Khu vực Cầu thang bộ Tây Nam', minU: 9.7, maxU: 13.5, minV: -177.7, maxV: -166.0 },
  { code: '311.B8', name: 'Phòng học lớn 311 (gộp ô 221+219)', minU: 13.5, maxU: 31.7, minV: -177.7, maxV: -166.0 },
  { code: '309.B8', name: 'Phòng học lớn 309 (gộp ô 217+215)', minU: 31.7, maxU: 50.0, minV: -177.7, maxV: -166.0 },
  { code: 'Thang bộ giữa (Nam)', name: 'Cầu thang bộ giữa (Nam)', minU: 50.0, maxU: 53.7, minV: -177.7, maxV: -166.0 },
  { code: '307.B8', name: 'Phòng học 307 (gộp ô 213+211)', minU: 53.7, maxU: 71.5, minV: -177.7, maxV: -166.0 },
  { code: '305.B8', name: 'Phòng học 305 (gộp ô 209+207)', minU: 71.5, maxU: 90.1, minV: -177.7, maxV: -166.0 },
  { code: '303.B8', name: 'Phòng học 303 (gộp ô 205+203)', minU: 90.1, maxU: 108.8, minV: -177.7, maxV: -166.0 },
  { code: '301.B8', name: 'Phòng học 301 (ô 201)', minU: 108.8, maxU: 117.7, minV: -177.7, maxV: -166.0 },

  // --- Lõi giữa & Sân Đông ---
  { code: 'Thang bộ Đông', name: 'Lõi thang bộ Đông (trong sân Đông)', minU: 106.9, maxU: 114.5, minV: -190.3, maxV: -184.8 },
];

// TẦNG 4: Cánh Bắc giữ ô, cánh Nam có phòng 411 gộp ô 213+211
export const TANG_4_B8_ROOMS: readonly RoomArea[] = [
  // --- Cánh Bắc ---
  { code: 'Thang bộ Tây Bắc', name: 'Khu vực Cầu thang bộ Tây Bắc', minU: 9.0, maxU: 13.1, minV: -210.2, maxV: -200.0 },
  { code: '420.B8', name: 'Phòng học 420', minU: 13.1, maxU: 22.4, minV: -210.2, maxV: -200.0 },
  { code: '418.B8', name: 'Phòng học 418', minU: 22.4, maxU: 31.6, minV: -210.2, maxV: -200.0 },
  { code: '416.B8', name: 'Phòng học 416', minU: 31.6, maxU: 40.8, minV: -210.2, maxV: -200.0 },
  { code: '414.B8', name: 'Phòng học 414', minU: 40.8, maxU: 49.7, minV: -210.2, maxV: -200.0 },
  { code: 'Thang bộ giữa (Bắc)', name: 'Cầu thang bộ giữa (Bắc)', minU: 49.7, maxU: 54.1, minV: -210.2, maxV: -200.0 },
  { code: '412.B8', name: 'Phòng học 412', minU: 54.1, maxU: 63.1, minV: -210.2, maxV: -200.0 },
  { code: '410.B8', name: 'Phòng học 410', minU: 63.1, maxU: 72.5, minV: -210.2, maxV: -200.0 },
  { code: '408.B8', name: 'Phòng học 408', minU: 72.5, maxU: 81.9, minV: -210.2, maxV: -200.0 },
  { code: '406.B8', name: 'Phòng học 406', minU: 81.9, maxU: 91.3, minV: -210.2, maxV: -200.0 },
  { code: '404.B8', name: 'Phòng học 404', minU: 91.3, maxU: 100.5, minV: -210.2, maxV: -200.0 },
  { code: '402.B8', name: 'Phòng học 402', minU: 100.5, maxU: 109.7, minV: -210.2, maxV: -200.0 },
  { code: 'WC-4N', name: 'WC + Thang bộ Đông Bắc', minU: 109.7, maxU: 119.4, minV: -210.2, maxV: -200.0 },

  // --- Cánh Nam ---
  { code: 'WC-4S', name: 'Khu vệ sinh Tây Nam', minU: 0.3, maxU: 9.7, minV: -181.0, maxV: -166.0 },
  { code: 'Thang bộ Tây Nam', name: 'Khu vực Cầu thang bộ Tây Nam', minU: 9.7, maxU: 13.5, minV: -177.7, maxV: -166.0 },
  { code: '419.B8', name: 'Phòng học 419', minU: 13.5, maxU: 22.6, minV: -177.7, maxV: -166.0 },
  { code: '417.B8', name: 'Phòng học 417', minU: 22.6, maxU: 31.7, minV: -177.7, maxV: -166.0 },
  { code: '415.B8', name: 'Phòng học 415', minU: 31.7, maxU: 40.8, minV: -177.7, maxV: -166.0 },
  { code: '413.B8', name: 'Phòng học 413', minU: 40.8, maxU: 50.0, minV: -177.7, maxV: -166.0 },
  { code: 'Thang bộ giữa (Nam)', name: 'Cầu thang bộ giữa (Nam)', minU: 50.0, maxU: 53.7, minV: -177.7, maxV: -166.0 },
  { code: '411.B8', name: 'Phòng học lớn 411 (gộp ô 213+211)', minU: 53.7, maxU: 71.5, minV: -177.7, maxV: -166.0 },
  { code: '409.B8', name: 'Phòng học 409', minU: 71.5, maxU: 80.8, minV: -177.7, maxV: -166.0 },
  { code: '407.B8', name: 'Phòng học 407', minU: 80.8, maxU: 90.1, minV: -177.7, maxV: -166.0 },
  { code: '405.B8', name: 'Phòng học 405', minU: 90.1, maxU: 99.5, minV: -177.7, maxV: -166.0 },
  { code: '403.B8', name: 'Phòng học 403', minU: 99.5, maxU: 108.8, minV: -177.7, maxV: -166.0 },
  { code: '401.B8', name: 'Phòng học 401', minU: 108.8, maxU: 117.7, minV: -177.7, maxV: -166.0 },

  // --- Lõi giữa & Sân Đông ---
  { code: 'Thang bộ Đông', name: 'Lõi thang bộ Đông (trong sân Đông)', minU: 106.9, maxU: 114.5, minV: -190.3, maxV: -184.8 },
];

export function getFloorRooms(floor: number): readonly RoomArea[] {
  if (floor === 1) return TANG_1_B8_ROOMS;
  if (floor === 3) return TANG_3_B8_ROOMS;
  if (floor === 4) return TANG_4_B8_ROOMS;
  return TANG_2_B8_ROOMS;
}

// =============================================================================
// TẠO HÌNH HỌC TƯỜNG CHO TỪNG TẦNG (TƯỜNG ĐẶC + RAILING CHẶN RƠI SÂN TRONG)
// =============================================================================

export interface B8DoorOpening {
  u1: number;
  u2: number;
  v: number;
  roomCode: string;
}

export function getFloorDoors(floor: number): readonly B8DoorOpening[] {
  const doors: B8DoorOpening[] = [];
  const rooms = getFloorRooms(floor);

  // Nhóm phòng cánh Bắc (v: -210.2 .. -200.0)
  const northRooms = rooms.filter((r) => r.code.includes('.B8') && r.maxV <= -200.0);
  for (const r of northRooms) {
    const corridorV = r.maxV;
    const width = r.maxU - r.minU;
    if (width >= 8.5) {
      // 2 cửa rộng 1.0 m: cửa Tây (front) và cửa Đông (back)
      doors.push({ u1: r.minU + 0.6, u2: r.minU + 1.6, v: corridorV, roomCode: r.code });
      doors.push({ u1: r.maxU - 1.6, u2: r.maxU - 0.6, v: corridorV, roomCode: r.code });
    } else {
      // 1 cửa rộng 1.0 m
      doors.push({ u1: r.minU + 0.6, u2: r.minU + 1.6, v: corridorV, roomCode: r.code });
    }
  }

  // Nhóm phòng cánh Nam (v: -177.7 .. -166.0)
  const southRooms = rooms.filter((r) => r.code.includes('.B8') && r.minV >= -178.0);
  for (const r of southRooms) {
    const corridorV = r.minV;
    const width = r.maxU - r.minU;
    if (width >= 8.5) {
      doors.push({ u1: r.minU + 0.6, u2: r.minU + 1.6, v: corridorV, roomCode: r.code });
      doors.push({ u1: r.maxU - 1.6, u2: r.maxU - 0.6, v: corridorV, roomCode: r.code });
    } else {
      doors.push({ u1: r.minU + 0.6, u2: r.minU + 1.6, v: corridorV, roomCode: r.code });
    }
  }

  return doors;
}

function createFloorWalls(floor: number): WallSegment[] {
  const walls: WallSegment[] = [];

  // 1. Tường bao ngoài (Outer Perimeter)
  if (floor === 1) {
    // Mặt Bắc (v = -210.2): cửa nhịp giữa tại u ∈ [51.5, 54.0]
    walls.push({ u1: 9.0, v1: -210.2, u2: 51.5, v2: -210.2, thickness: 0.3 });
    walls.push({ u1: 54.0, v1: -210.2, u2: 120.4, v2: -210.2, thickness: 0.3 });

    // Mặt Đông (u = 120.4): cửa thoát hiểm tại v ∈ [-190.5, -187.0]
    walls.push({ u1: 120.4, v1: -210.2, u2: 120.4, v2: -190.5, thickness: 0.3 });
    walls.push({ u1: 120.4, v1: -187.0, u2: 120.4, v2: -166.0, thickness: 0.3 });

    // Mặt Nam (v = -166.0): cửa nhịp giữa tại u ∈ [51.5, 54.0]
    walls.push({ u1: 120.4, v1: -166.0, u2: 54.0, v2: -166.0, thickness: 0.3 });
    walls.push({ u1: 51.5, v1: -166.0, u2: 0.3, v2: -166.0, thickness: 0.3 });

    // Mặt Tây WC Tây Nam (u = 0.3)
    walls.push({ u1: 0.3, v1: -166.0, u2: 0.3, v2: -181.0, thickness: 0.3 });
    // Khớp góc trên WC Tây Nam (v = -181.0)
    walls.push({ u1: 0.3, v1: -181.0, u2: 9.0, v2: -181.0, thickness: 0.3 });

    // Mặt Tây thân chính (u = 9.0): cửa thoát hiểm Tây tại v ∈ [-190.5, -187.0]
    walls.push({ u1: 9.0, v1: -181.0, u2: 9.0, v2: -187.0, thickness: 0.3 });
    walls.push({ u1: 9.0, v1: -190.5, u2: 9.0, v2: -210.2, thickness: 0.3 });
  } else {
    // Mặt Bắc (v = -210.2)
    walls.push({ u1: 9.0, v1: -210.2, u2: 120.4, v2: -210.2, thickness: 0.3 });
    // Mặt Đông (u = 120.4)
    walls.push({ u1: 120.4, v1: -210.2, u2: 120.4, v2: -166.0, thickness: 0.3 });
    // Mặt Nam (v = -166.0)
    walls.push({ u1: 120.4, v1: -166.0, u2: 0.3, v2: -166.0, thickness: 0.3 });
    // Mặt Tây WC Tây Nam (u = 0.3)
    walls.push({ u1: 0.3, v1: -166.0, u2: 0.3, v2: -181.0, thickness: 0.3 });
    // Khớp góc trên WC Tây Nam (v = -181.0)
    walls.push({ u1: 0.3, v1: -181.0, u2: 9.0, v2: -181.0, thickness: 0.3 });
    // Mặt Tây thân chính (u = 9.0)
    walls.push({ u1: 9.0, v1: -181.0, u2: 9.0, v2: -210.2, thickness: 0.3 });
  }

  // 2. Tường ngăn hành lang và phòng học (có cửa 1.0 m mở ra hành lang; đoạn >= 3.0 m mở ô kính nhìn vào phòng)
  const rooms = getFloorRooms(floor);
  const doors = getFloorDoors(floor);

  const pushCorridorSegment = (uStart: number, uEnd: number, v: number) => {
    const segLen = uEnd - uStart;
    if (segLen >= 3.0) {
      walls.push({ u1: uStart, v1: v, u2: +(uStart + 0.6).toFixed(3), v2: v, thickness: 0.2 });
      walls.push({ u1: +(uStart + 0.6).toFixed(3), v1: v, u2: +(uEnd - 0.6).toFixed(3), v2: v, thickness: 0.1, isGlass: true });
      walls.push({ u1: +(uEnd - 0.6).toFixed(3), v1: v, u2: uEnd, v2: v, thickness: 0.2 });
    } else if (segLen > 0.05) {
      walls.push({ u1: uStart, v1: v, u2: uEnd, v2: v, thickness: 0.2 });
    }
  };

  const addRoomCorridorWalls = (r: RoomArea, corridorV: number) => {
    const roomDoors = doors
      .filter((d) => d.roomCode === r.code)
      .sort((a, b) => a.u1 - b.u1);
    const firstDoor = roomDoors[0];
    const secondDoor = roomDoors[1];
    if (firstDoor && secondDoor) {
      pushCorridorSegment(r.minU, firstDoor.u1, corridorV);
      pushCorridorSegment(firstDoor.u2, secondDoor.u1, corridorV);
      pushCorridorSegment(secondDoor.u2, r.maxU, corridorV);
    } else if (firstDoor) {
      pushCorridorSegment(r.minU, firstDoor.u1, corridorV);
      pushCorridorSegment(firstDoor.u2, r.maxU, corridorV);
    } else {
      pushCorridorSegment(r.minU, r.maxU, corridorV);
    }
    // Tường ngăn dọc giữa các phòng
    walls.push({ u1: r.maxU, v1: r.minV, u2: r.maxU, v2: r.maxV, thickness: 0.2 });
  };

  // Nhóm phòng cánh Bắc (v: -210.2 .. -200.0)
  for (const r of rooms.filter((rm) => rm.code.includes('.B8') && rm.maxV <= -200.0)) {
    addRoomCorridorWalls(r, r.maxV);
  }

  // Nhóm phòng cánh Nam (v: -177.7 .. -166.0)
  for (const r of rooms.filter((rm) => rm.code.includes('.B8') && rm.minV >= -178.0)) {
    addRoomCorridorWalls(r, r.minV);
  }

  // 3. Tường WC và các buồng thang bộ
  // WC Đông Bắc
  const wcN = rooms.find((r) => r.code.startsWith('WC') && r.code.includes('N'));
  if (wcN) {
    walls.push({ u1: wcN.minU, v1: wcN.minV, u2: wcN.minU, v2: wcN.maxV, thickness: 0.2 });
    // Tường hành lang có cửa
    const doorStart = wcN.minU + 0.4;
    const doorEnd = wcN.minU + 1.6;
    walls.push({ u1: wcN.minU, v1: wcN.maxV, u2: doorStart, v2: wcN.maxV, thickness: 0.2 });
    walls.push({ u1: doorEnd, v1: wcN.maxV, u2: wcN.maxU, v2: wcN.maxV, thickness: 0.2 });
  }

  // WC Tây Nam
  const wcS = rooms.find((r) => r.code.startsWith('WC') && r.code.includes('S'));
  if (wcS) {
    walls.push({ u1: wcS.maxU, v1: wcS.minV, u2: wcS.maxU, v2: wcS.maxV, thickness: 0.2 });
  }

  // Thang bộ Tây Bắc: vách ngăn với hành lang (có cửa mở)
  const stairNW = rooms.find((r) => r.code === 'Thang bộ Tây Bắc');
  if (stairNW) {
    walls.push({ u1: stairNW.maxU, v1: stairNW.minV, u2: stairNW.maxU, v2: stairNW.maxV, thickness: 0.2 });
  }

  // Thang bộ Tây Nam: vách ngăn với hành lang
  const stairSW = rooms.find((r) => r.code === 'Thang bộ Tây Nam');
  if (stairSW) {
    walls.push({ u1: stairSW.minU, v1: stairSW.minV, u2: stairSW.minU, v2: stairSW.maxV, thickness: 0.2 });
    walls.push({ u1: stairSW.maxU, v1: stairSW.minV, u2: stairSW.maxU, v2: stairSW.maxV, thickness: 0.2 });
  }

  // Thang bộ giữa Bắc & Nam
  const stairMN = rooms.find((r) => r.code === 'Thang bộ giữa (Bắc)');
  if (stairMN) {
    walls.push({ u1: stairMN.minU, v1: stairMN.minV, u2: stairMN.minU, v2: stairMN.maxV, thickness: 0.2 });
    walls.push({ u1: stairMN.maxU, v1: stairMN.minV, u2: stairMN.maxU, v2: stairMN.maxV, thickness: 0.2 });
  }
  const stairMS = rooms.find((r) => r.code === 'Thang bộ giữa (Nam)');
  if (stairMS) {
    walls.push({ u1: stairMS.minU, v1: stairMS.minV, u2: stairMS.minU, v2: stairMS.maxV, thickness: 0.2 });
    walls.push({ u1: stairMS.maxU, v1: stairMS.minV, u2: stairMS.maxU, v2: stairMS.maxV, thickness: 0.2 });
  }

  // 4. Buồng THANG MÁY (duy nhất của tòa nhà, nhịp giữa)
  // u ∈ [55.1, 58.2], v ∈ [-190.2, -186.5]
  walls.push({ u1: 55.1, v1: -190.2, u2: 58.2, v2: -190.2, thickness: 0.25 }); // Hông Bắc
  walls.push({ u1: 55.1, v1: -186.5, u2: 58.2, v2: -186.5, thickness: 0.25 }); // Hông Nam
  walls.push({ u1: 58.2, v1: -190.2, u2: 58.2, v2: -186.5, thickness: 0.25 }); // Lưng thang (Đông)
  // Mặt Tây có cửa mở
  walls.push({ u1: 55.1, v1: -190.2, u2: 55.1, v2: -189.5, thickness: 0.25 });
  walls.push({ u1: 55.1, v1: -187.2, u2: 55.1, v2: -186.5, thickness: 0.25 });

  // 5. Lõi thang bộ Đông (hốc trong sân Đông)
  // u ∈ [106.9, 114.5], v ∈ [-190.3, -184.8]
  walls.push({ u1: 106.9, v1: -190.3, u2: 114.5, v2: -190.3, thickness: 0.2 }); // Hông Bắc
  walls.push({ u1: 106.9, v1: -184.8, u2: 114.5, v2: -184.8, thickness: 0.2 }); // Hông Nam
  walls.push({ u1: 106.9, v1: -190.3, u2: 106.9, v2: -184.8, thickness: 0.2 }); // Mặt Tây nhìn ra sân

  // 6. Lan can inox bảo vệ quanh 2 sân trong ở TẦNG 2–4 (KHÔNG DÙNG KÍNH, isRailing: true)
  // Sân Tây: u ∈ [13.5, 50.0], v ∈ [-197.0, -180.1]
  // Sân Đông: u ∈ [54.1, 114.9], v ∈ [-196.5, -179.6]
  if (floor >= 2) {
    // Sân Tây
    walls.push({ u1: 13.5, v1: -197.0, u2: 50.0, v2: -197.0, thickness: 0.15, isRailing: true });
    walls.push({ u1: 13.5, v1: -180.1, u2: 50.0, v2: -180.1, thickness: 0.15, isRailing: true });
    walls.push({ u1: 13.5, v1: -197.0, u2: 13.5, v2: -180.1, thickness: 0.15, isRailing: true });
    walls.push({ u1: 50.0, v1: -197.0, u2: 50.0, v2: -180.1, thickness: 0.15, isRailing: true });

    // Sân Đông
    walls.push({ u1: 54.1, v1: -196.5, u2: 114.9, v2: -196.5, thickness: 0.15, isRailing: true });
    walls.push({ u1: 54.1, v1: -179.6, u2: 114.9, v2: -179.6, thickness: 0.15, isRailing: true });
    // Mép Tây sân Đông (2 bên buồng thang máy)
    walls.push({ u1: 54.1, v1: -196.5, u2: 54.1, v2: -190.2, thickness: 0.15, isRailing: true });
    walls.push({ u1: 54.1, v1: -186.5, u2: 54.1, v2: -179.6, thickness: 0.15, isRailing: true });
    // Mép Đông sân Đông (2 bên lõi thang bộ Đông)
    walls.push({ u1: 114.9, v1: -196.5, u2: 114.9, v2: -190.3, thickness: 0.15, isRailing: true });
    walls.push({ u1: 114.9, v1: -184.8, u2: 114.9, v2: -179.6, thickness: 0.15, isRailing: true });
  }

  return walls;
}

const TANG_1_WALLS = createFloorWalls(1);
const TANG_2_WALLS = createFloorWalls(2);
const TANG_3_WALLS = createFloorWalls(3);
const TANG_4_WALLS = createFloorWalls(4);

// Bàn phòng 406.B8 chỉ tham gia va chạm; không dựng lại hình học bàn ở đây.
(function addClassroom406B8Obstacles(): void {
  const room = getClassroom('406.B8');
  if (!room) return;

  const { depth, width } = room.desk;
  const rowDeskUs = [...new Set(room.seats.map((seat) => seat.deskU))];
  for (const deskU of rowDeskUs) {
    const rowSeats = room.seats.filter((seat) => seat.deskU === deskU);
    const blocks = [
      rowSeats.filter((seat) => seat.v < room.aisle.minV),
      rowSeats.filter((seat) => seat.v > room.aisle.maxV),
    ];

    for (const block of blocks) {
      if (block.length === 0) continue;

      const vs = block.map((seat) => seat.v);
      const v1 = Math.min(...vs) - width / 2 + 0.25 + depth / 2;
      const v2 = Math.max(...vs) + width / 2 - 0.25 - depth / 2;
      TANG_4_WALLS.push({
        u1: deskU,
        v1,
        u2: deskU,
        v2,
        thickness: depth,
        isRailing: true,
      });
    }
  }

  const desk = room.teacherDesk;
  TANG_4_WALLS.push({
    u1: desk.u,
    v1: desk.v - desk.width / 2 + desk.depth / 2,
    u2: desk.u,
    v2: desk.v + desk.width / 2 - desk.depth / 2,
    thickness: desk.depth,
    isRailing: true,
  });
})();

export function getFloorWalls(floor: number): readonly WallSegment[] {
  if (floor === 1) return TANG_1_WALLS;
  if (floor === 3) return TANG_3_WALLS;
  if (floor === 4) return TANG_4_WALLS;
  return TANG_2_WALLS;
}

// =============================================================================
// BIÊN SÀN VÀ GIẾNG TRỜI SÂN TRONG
// =============================================================================

// Đa giác biên sàn B8 (6 đỉnh bao quát toàn khối theo OSM)
export function getFloorBoundaryPts(): Vec2[] {
  return [
    toWorld(9.0, -210.2),   // Tây Bắc
    toWorld(120.4, -210.2), // Đông Bắc
    toWorld(120.4, -166.0), // Đông Nam
    toWorld(0.3, -166.0),   // Tây Nam (mép dưới khối WC nhô ra)
    toWorld(0.3, -181.0),   // Mép trên khối WC
    toWorld(9.0, -181.0),   // Góc nối vào thân chính
  ];
}

/** Mép 2 lỗ giếng trời sân trong chuẩn (tọa độ địa phương [u, v]) */
export const B8_WEST_HOLE_UV: readonly Vec2[] = [
  [13.5, -197.0],
  [50.0, -197.0],
  [50.0, -180.1],
  [13.5, -180.1],
];

export const B8_EAST_HOLE_UV: readonly Vec2[] = [
  [54.1, -196.5],
  [114.9, -196.5],
  [114.9, -190.3],
  [106.9, -190.3],
  [106.9, -184.8],
  [114.9, -184.8],
  [114.9, -179.6],
  [54.1, -179.6],
  [54.1, -186.5],
  [58.2, -186.5],
  [58.2, -190.2],
  [54.1, -190.2],
];

export interface B8PcccPoint {
  readonly u: number;
  readonly v: number;
  readonly facingV: 1 | -1;
}

/** Vị trí tủ PCCC + kệ bình chữa cháy + sơ đồ thoát hiểm trên tường hành lang (mọi tầng) */
export const B8_PCCC_POINTS: readonly B8PcccPoint[] = [
  { u: 16.2, v: -199.9, facingV: 1 }, // lùi khỏi cửa Tây phòng x20 (u 13.7–14.7) ở tầng 2–4
  { u: 50.2, v: -199.9, facingV: 1 },
  { u: 15.0, v: -177.8, facingV: -1 },
  { u: 50.2, v: -177.8, facingV: -1 },
];

/** Vị trí biển EXIT xanh treo giữa hành lang trước mỗi cầu thang (mọi tầng) */
export const B8_EXIT_SIGNS: readonly Vec2[] = [
  [11.05, -198.5],
  [51.9, -198.5],
  [11.6, -178.9],
  [51.85, -178.9],
  [110.0, -188.0],
];

export interface B8Planter {
  readonly centerU: number;
  readonly lenU: number;
  readonly centerV: number;
  readonly widthV: number;
}

/** 8 bồn cây sân trong tầng trệt (dùng chung cho nội thất & ngoại thất) */
export const B8_PLANTERS: readonly B8Planter[] = [
  { centerU: 25.0, lenU: 8.5, centerV: -188.55, widthV: 5.0 },
  { centerU: 35.0, lenU: 8.5, centerV: -188.55, widthV: 5.0 },
  { centerU: 45.0, lenU: 7.2, centerV: -188.55, widthV: 5.0 },
  { centerU: 65.0, lenU: 8.5, centerV: -188.05, widthV: 5.0 },
  { centerU: 75.0, lenU: 8.5, centerV: -188.05, widthV: 5.0 },
  { centerU: 85.0, lenU: 8.5, centerV: -188.05, widthV: 5.0 },
  { centerU: 95.0, lenU: 8.5, centerV: -188.05, widthV: 5.0 },
  { centerU: 104.0, lenU: 6.5, centerV: -188.05, widthV: 5.0 },
];

/** 8 cây xanh sân trong (3 cây sân Tây, 5 cây sân Đông) */
export const B8_TREE_UV: readonly Vec2[] = [
  [25.0, -188.55],
  [35.0, -188.55],
  [45.0, -188.55],
  [65.0, -188.05],
  [75.0, -188.05],
  [85.0, -188.05],
  [95.0, -188.05],
  [104.0, -188.05],
];

export const B8_SWITCHBACK_STAIRS: readonly SwitchbackStairGeometrySpec[] = [
  {
    id: 'nw',
    label: 'Thang bộ Tây Bắc',
    f1: [12.025, -200.0, 12.025, -203.36],
    f2: [10.075, -203.36, 10.075, -200.0],
    width: 1.75,
    steps1: 12,
    steps2: 12,
    landRatio: 0.5,
    land: [11.05, -204.235, 3.7, 1.75],
    backRail: [9.25, -205.06, 12.85, -205.06],
    shaftBounds: [9.2, 12.9, -205.11, -200.0],
  },
  {
    id: 'mn',
    label: 'Thang bộ giữa (Bắc)',
    f1: [53.0, -200.0, 53.0, -203.36],
    f2: [50.8, -203.36, 50.8, -200.0],
    width: 2.0,
    steps1: 12,
    steps2: 12,
    landRatio: 0.5,
    land: [51.9, -204.36, 4.2, 2.0],
    backRail: [49.85, -205.31, 53.95, -205.31],
    shaftBounds: [49.8, 54.0, -205.36, -200.0],
  },
  {
    id: 'sw',
    label: 'Thang bộ Tây Nam',
    f1: [12.55, -177.7, 12.55, -174.34],
    f2: [10.65, -174.34, 10.65, -177.7],
    width: 1.7,
    steps1: 12,
    steps2: 12,
    landRatio: 0.5,
    land: [11.6, -173.49, 3.6, 1.7],
    backRail: [9.85, -172.69, 13.35, -172.69],
    shaftBounds: [9.8, 13.4, -177.7, -172.64],
  },
  {
    id: 'ms',
    label: 'Thang bộ giữa (Nam)',
    f1: [52.775, -177.7, 52.775, -174.34],
    f2: [50.925, -174.34, 50.925, -177.7],
    width: 1.65,
    steps1: 12,
    steps2: 12,
    landRatio: 0.5,
    land: [51.85, -173.515, 3.5, 1.65],
    backRail: [50.15, -172.74, 53.55, -172.74],
    shaftBounds: [50.1, 53.6, -177.7, -172.69],
  },
  {
    id: 'east',
    label: 'Lõi Đông',
    f1: [114.5, -186.175, 111.14, -186.175],
    f2: [111.14, -188.925, 114.5, -188.925],
    width: 2.55,
    steps1: 12,
    steps2: 12,
    landRatio: 0.5,
    land: [109.865, -187.55, 2.55, 5.3],
    backRail: [108.64, -190.15, 108.64, -184.95],
    shaftBounds: [108.59, 114.5, -190.2, -184.9],
  },
];

export const B8_WALKABLE_STAIRS: readonly WalkableStairSpec[] = B8_SWITCHBACK_STAIRS.map(
  buildSwitchbackWalkableSpec
);

function canStandOnFloorZeroB8(u: number, v: number): boolean {
  for (const st of B8_SWITCHBACK_STAIRS) {
    const [minU, maxU, minV, maxV] = st.shaftBounds;
    if (u >= minU && u <= maxU && v >= minV && v <= maxV) {
      return false;
    }
  }
  return true;
}

export function stepStairHeight(
  worldX: number,
  worldZ: number,
  prevY: number,
  floor: number
): StairStepResult {
  return evaluateStairHeight(
    B8_WALKABLE_STAIRS,
    toLocal,
    worldX,
    worldZ,
    prevY,
    floor,
    4,
    canStandOnFloorZeroB8
  );
}

// 2 Lỗ giếng trời sân trong cho các tầng 2, 3, 4 (KHÔNG CÓ KÍNH)
export function getFloorHoles(floor: number): Vec2[][] {
  if (floor === 1) return []; // Tầng 1 phủ kín sàn sân vườn

  return [
    B8_WEST_HOLE_UV.map(([u, v]) => toWorld(u, v)),
    B8_EAST_HOLE_UV.map(([u, v]) => toWorld(u, v)),
  ];
}

// =============================================================================
// GIẢI QUYẾT VA CHẠM VÀ NHẬN DIỆN VỊ TRÍ
// =============================================================================

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

function isInsideB8FloorBoundary(u: number, v: number, floor: number, currentY = 0): boolean {
  // 1. Phải nằm trong khung chữ nhật thân chính hoặc khối WC Tây Nam
  const inMain = u >= 9.0 && u <= 120.4 && v >= -210.2 && v <= -166.0;
  const inSW = u >= 0.3 && u < 9.0 && v >= -181.0 && v <= -166.0;
  if (!inMain && !inSW) return false;

  // Khi đang leo/xuống lưng chừng trên cầu thang (|y| > 0.35 m), chỉ cho phép đi trong lòng vế thang & chiếu nghỉ hợp lệ
  if (Math.abs(currentY) > 0.35) {
    return isInsideAnyStairFootprint(B8_WALKABLE_STAIRS, u, v, floor, 4, currentY);
  }

  // 2. Ở tầng 2–4: không được rơi vào 2 giếng trời sân trong
  if (floor >= 2) {
    // Sân Tây
    if (u > 13.5 && u < 50.0 && v > -197.0 && v < -180.1) return false;
    // Sân Đông
    if (u > 54.1 && u < 114.9 && v > -196.5 && v < -179.6) {
      // Ngoại trừ sàn buồng thang máy
      const inElevator = u >= 54.1 && u <= 58.2 && v >= -190.2 && v <= -186.5;
      // Ngoại trừ sàn lõi thang bộ Đông
      const inStairEast = u >= 106.9 && u <= 114.9 && v >= -190.3 && v <= -184.8;
      if (!inElevator && !inStairEast) return false;
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
  radius = 0.4,
  currentY = 0
): Vec2 {
  const [nextU, nextV] = toLocal(nextX, nextZ);
  const [prevU, prevV] = toLocal(prevX, prevZ);

  let currentU = nextU;
  let currentV = nextV;

  // Cho phép đi xuyên vùng cửa tầng 1 khi ra/vào
  const isNearExitT1 =
    floor === 1 &&
    ((currentU >= 51.0 && currentU <= 54.5 && (currentV <= -208.5 || currentV >= -167.5)) ||
      (currentU >= 118.0 && currentV >= -191.0 && currentV <= -186.0) ||
      (currentU <= 10.0 && currentV >= -191.0 && currentV <= -186.0));

  if (!isInsideB8FloorBoundary(currentU, currentV, floor, currentY) && !isNearExitT1) {
    currentU = prevU;
    currentV = prevV;
  }

  // Va chạm với từng đoạn tường
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

  if (!isInsideB8FloorBoundary(currentU, currentV, floor, currentY) && !isNearExitT1) {
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
  // 1. Thang máy DUY NHẤT của tòa nhà (tại nhịp giữa, cạnh sân trong lớn)
  const distElevator = Math.hypot(worldX - B8_ELEVATOR_POS_WORLD[0], worldZ - B8_ELEVATOR_POS_WORLD[1]);
  if (distElevator <= 3.5) {
    return {
      id: 'interior-elevator',
      type: 'elevator',
      worldPos: B8_ELEVATOR_POS_WORLD,
      radius: 3.5,
      label: 'Thang máy Block 8 (Nhịp giữa)',
      buildingId: 'b8',
    };
  }

  // 2. Các cửa thoát hiểm ra ngoài (chỉ ở Tầng 1)
  if (floor === 1) {
    const exits = [
      { id: 'exit-north', pos: B8_ENTRANCE_NORTH_INSIDE, outPos: B8_ENTRANCE_NORTH_OUTSIDE, label: 'Ra ngoài (Cửa Bắc — Nhịp giữa)' },
      { id: 'exit-south', pos: B8_ENTRANCE_SOUTH_INSIDE, outPos: B8_ENTRANCE_SOUTH_OUTSIDE, label: 'Ra ngoài (Cửa Nam — Nhịp giữa)' },
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
  stepStairHeight,
  resolvePosition: resolveInteriorPosition,
  getActiveRoom,
  getNearInteractive,
  elevator: {
    posLocal: B8_ELEVATOR_POS_LOCAL,
    spawnLocal: B8_ELEVATOR_SPAWN_LOCAL,
    posWorld: B8_ELEVATOR_POS_WORLD,
    spawnWorld: B8_ELEVATOR_SPAWN_WORLD,
    facingYaw: -2.912, // Quay mặt về phía Tây (ra hành lang)
  },
  exteriorEntrances: b8ExteriorEntrances,
  defaultInsideEntrance: B8_ENTRANCE_NORTH_INSIDE,
  defaultOutsideEntrance: B8_ENTRANCE_NORTH_OUTSIDE,
};
