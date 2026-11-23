import type { Vec2 } from '../../../types';
import {
  buildSwitchbackWalkableSpec,
  evaluateStairHeight,
  isInsideAnyStairFootprint,
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
 * Mặt Nam (v = 28) nhìn ra hồ nước, ki-ốt Highlands Coffee và lối sang Block 3.
 * Mặt Đông (u = 67) hướng sang Block 5.
 * Mặt Tây (u = 0) hướng sang hành lang nối Block 11.
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

/** Tính góc quay Euler Y (radian) trong Three.js cho một hướng quay địa phương */
export function getLocalFacingYaw(localRotY = 0): number {
  const dirU = Math.cos(localRotY);
  const dirV = Math.sin(localRotY);
  const p0 = toWorld(0, 0);
  const p1 = toWorld(dirU, dirV);
  return -Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
}

// Tâm tòa nhà (thế giới)
export const B4_CENTER_WORLD = toWorld(33.5, 14.0);

// Thang máy Thư viện B4 (đặt ở khu dịch vụ trung tâm phía Bắc)
export const B4_ELEVATOR_POS_LOCAL: [number, number] = [30.0, 5.0];
export const B4_ELEVATOR_POS_WORLD: Vec2 = toWorld(B4_ELEVATOR_POS_LOCAL[0], B4_ELEVATOR_POS_LOCAL[1]);
export const B4_ELEVATOR_SPAWN_LOCAL: [number, number] = [30.0, 7.5];
export const B4_ELEVATOR_SPAWN_WORLD: Vec2 = toWorld(B4_ELEVATOR_SPAWN_LOCAL[0], B4_ELEVATOR_SPAWN_LOCAL[1]);

// Cửa ra vào ngoài khuôn viên (Tầng 1)
// 1. Cửa chính phía Nam (mặt tiền nhìn ra hồ & Highlands)
export const B4_ENTRANCE_SOUTH_OUTSIDE = toWorld(28.0, 29.8);
export const B4_ENTRANCE_SOUTH_INSIDE = toWorld(28.0, 26.0);

// 2. Cửa phụ phía Đông (hướng Block 5)
export const B4_ENTRANCE_EAST_OUTSIDE = toWorld(68.5, 14.0);
export const B4_ENTRANCE_EAST_INSIDE = toWorld(65.0, 14.0);

// 3. Cửa phụ phía Tây (hướng cầu nối Block 11)
export const B4_ENTRANCE_WEST_OUTSIDE = toWorld(-1.5, 14.0);
export const B4_ENTRANCE_WEST_INSIDE = toWorld(2.0, 14.0);

export const b4ExteriorEntrances: readonly ExteriorEntrance[] = [
  {
    id: 'b4-door-south',
    buildingId: 'b4',
    worldPos: B4_ENTRANCE_SOUTH_OUTSIDE,
    radius: 3.2,
    label: 'Vào Thư viện EIU (Cửa chính)',
    spawnInsideWorld: B4_ENTRANCE_SOUTH_INSIDE,
    spawnInsideYaw: getLocalFacingYaw(-Math.PI / 2), // Quay vào trong hướng Bắc
    spawnOutsideWorld: B4_ENTRANCE_SOUTH_OUTSIDE,
    spawnOutsideYaw: getLocalFacingYaw(Math.PI / 2),  // Quay ra hồ hướng Nam
  },
  {
    id: 'b4-door-east',
    buildingId: 'b4',
    worldPos: B4_ENTRANCE_EAST_OUTSIDE,
    radius: 2.8,
    label: 'Vào Thư viện EIU (Cửa Đông)',
    spawnInsideWorld: B4_ENTRANCE_EAST_INSIDE,
    spawnInsideYaw: getLocalFacingYaw(Math.PI),       // Quay vào hướng Tây
    spawnOutsideWorld: B4_ENTRANCE_EAST_OUTSIDE,
    spawnOutsideYaw: getLocalFacingYaw(0),            // Quay ra hướng Đông
  },
  {
    id: 'b4-door-west',
    buildingId: 'b4',
    worldPos: B4_ENTRANCE_WEST_OUTSIDE,
    radius: 2.8,
    label: 'Vào Thư viện EIU (Cửa Tây)',
    spawnInsideWorld: B4_ENTRANCE_WEST_INSIDE,
    spawnInsideYaw: getLocalFacingYaw(0),             // Quay vào hướng Đông
    spawnOutsideWorld: B4_ENTRANCE_WEST_OUTSIDE,
    spawnOutsideYaw: getLocalFacingYaw(Math.PI),      // Quay ra hướng Tây
  },
];

// Cầu thang bộ chữ U Thư viện B4 (2 vế có chiếu nghỉ giữa tầng)
export const B4_SWITCHBACK_STAIR: SwitchbackStairGeometrySpec = {
  id: 'b4-stair',
  label: 'Thang bộ Thư viện',
  f1: [35.5, 2.2, 35.5, 5.5],
  f2: [37.5, 5.5, 37.5, 2.2],
  width: 1.8,
  steps1: 12,
  steps2: 12,
  landRatio: 0.5,
  land: [36.5, 6.45, 3.8, 1.8],
  backRail: [34.5, 7.35, 38.5, 7.35],
  shaftBounds: [34.0, 39.0, 2.0, 7.5],
};

export const B4_WALKABLE_STAIRS: readonly WalkableStairSpec[] = [
  buildSwitchbackWalkableSpec(B4_SWITCHBACK_STAIR),
];

// Danh sách các phòng / phân khu từng tầng
export const B4_ROOMS_FLOOR_1: readonly RoomArea[] = [
  {
    code: '100.B4',
    name: 'Sảnh đón Thư viện EIU & Quầy thủ thư',
    minU: 20.0,
    maxU: 34.0,
    minV: 8.0,
    maxV: 22.0,
  },
  {
    code: 'ZONE-B',
    name: 'Khu đọc mở & Bàn tự học phía Nam (Zone B)',
    minU: 4.0,
    maxU: 44.0,
    minV: 18.0,
    maxV: 27.5,
  },
  {
    code: 'OPAC',
    name: 'Khu máy tính tra cứu OPAC',
    minU: 44.0,
    maxU: 66.0,
    minV: 12.0,
    maxV: 27.0,
  },
  {
    code: 'REF-BOOK',
    name: 'Khu kệ sách tham khảo mở & Tạp chí mới',
    minU: 2.0,
    maxU: 20.0,
    minV: 2.0,
    maxV: 16.0,
  },
  {
    code: 'ELEVATOR',
    name: 'Sảnh thang máy Thư viện B4',
    minU: 28.0,
    maxU: 32.5,
    minV: 3.5,
    maxV: 8.0,
  },
  {
    code: 'STAIRS',
    name: 'Thang bộ Thư viện (Tầng 1–3)',
    minU: 34.0,
    maxU: 39.0,
    minV: 2.0,
    maxV: 7.5,
  },
];

export const B4_ROOMS_FLOOR_2: readonly RoomArea[] = [
  {
    code: '200.B4',
    name: 'Không gian Thư viện tầng 2 — kệ sách học thuật, máy tra cứu & bàn tự học',
    minU: 0.0,
    maxU: 67.0,
    minV: 0.0,
    maxV: 28.0,
  },
  {
    code: 'GROUP-01',
    name: 'Phòng họp nhóm 01 (Group Study Room 01)',
    minU: 38.0,
    maxU: 42.5,
    minV: 1.0,
    maxV: 8.0,
  },
  {
    code: 'GROUP-02',
    name: 'Phòng họp nhóm 02 (Group Study Room 02)',
    minU: 42.5,
    maxU: 47.0,
    minV: 1.0,
    maxV: 8.0,
  },
  {
    code: 'GROUP-03',
    name: 'Phòng họp nhóm 03 (Group Study Room 03)',
    minU: 47.0,
    maxU: 51.5,
    minV: 1.0,
    maxV: 8.0,
  },
  {
    code: 'GROUP-04',
    name: 'Phòng họp nhóm 04 (Group Study Room 04)',
    minU: 51.5,
    maxU: 56.0,
    minV: 1.0,
    maxV: 8.0,
  },
  {
    code: 'GROUP-05',
    name: 'Phòng họp nhóm 05 (Group Study Room 05)',
    minU: 56.0,
    maxU: 60.5,
    minV: 1.0,
    maxV: 8.0,
  },
  {
    code: 'GROUP-06',
    name: 'Phòng họp nhóm 06 (Group Study Room 06)',
    minU: 60.5,
    maxU: 65.0,
    minV: 1.0,
    maxV: 8.0,
  },
  {
    code: 'ZONE-A',
    name: 'Khu tự học tầng lửng Zone A',
    minU: 2.0,
    maxU: 22.0,
    minV: 14.0,
    maxV: 27.5,
  },
  {
    code: 'ZONE-B2',
    name: 'Khu bàn tự học carrels Zone B',
    minU: 38.0,
    maxU: 66.0,
    minV: 12.0,
    maxV: 27.5,
  },
  {
    code: 'ATRIUM',
    name: 'Khoảng thông tầng nhìn xuống sảnh đọc tầng 1',
    minU: 22.0,
    maxU: 36.0,
    minV: 16.0,
    maxV: 26.0,
  },
];

export const B4_ROOMS_FLOOR_3: readonly RoomArea[] = [
  {
    code: '300.B4',
    name: 'Không gian Thư viện tầng 3 & sảnh trên',
    minU: 0.0,
    maxU: 67.0,
    minV: 0.0,
    maxV: 28.0,
  },
  {
    code: 'SILENT',
    name: 'Khu vực tự học yên tĩnh cao độ (Silent Zone)',
    minU: 2.0,
    maxU: 34.0,
    minV: 2.0,
    maxV: 27.0,
  },
  {
    code: 'RESEARCH',
    name: 'Khu nghiên cứu chuyên sâu & tài liệu học thuật',
    minU: 36.0,
    maxU: 65.0,
    minV: 2.0,
    maxV: 27.0,
  },
];

// Danh sách tường cho từng tầng (gồm tường đặc, vách kính, và lan can va chạm)
export function getFloorWalls(floor: number): readonly WallSegment[] {
  const walls: WallSegment[] = [];

  // Tường bao quanh tòa nhà (áp dụng cho mọi tầng)
  // Tường Bắc (u: 0..67, v = 0)
  walls.push({ u1: 0, v1: 0, u2: 67, v2: 0, thickness: 0.25 });

  // Tường Tây (u = 0, v: 0..28)
  if (floor === 1) {
    // Có cửa ra vào ở v = 12.5..15.5
    walls.push({ u1: 0, v1: 0, u2: 0, v2: 12.5, thickness: 0.25 });
    walls.push({ u1: 0, v1: 15.5, u2: 0, v2: 28, thickness: 0.25 });
  } else {
    walls.push({ u1: 0, v1: 0, u2: 0, v2: 28, thickness: 0.25 });
  }

  // Tường Đông (u = 67, v: 0..28)
  if (floor === 1) {
    // Có cửa ra vào ở v = 12.5..15.5
    walls.push({ u1: 67, v1: 0, u2: 67, v2: 12.5, thickness: 0.25 });
    walls.push({ u1: 67, v1: 15.5, u2: 67, v2: 28, thickness: 0.25 });
  } else {
    walls.push({ u1: 67, v1: 0, u2: 67, v2: 28, thickness: 0.25 });
  }

  // Tường Nam (Vách kính suốt nhìn ra hồ nước & Highlands)
  // isRailing: true để InteriorScene nhường cho B4Furniture vẽ vách kính khung đen công nghiệp,
  // đồng thời vẫn giữ nguyên va chạm cản người chơi không đi xuyên qua kính.
  if (floor === 1) {
    // Có cửa chính ở u = 26.0..30.0
    walls.push({ u1: 0, v1: 28, u2: 26, v2: 28, thickness: 0.1, isRailing: true });
    walls.push({ u1: 30, v1: 28, u2: 67, v2: 28, thickness: 0.1, isRailing: true });
  } else {
    walls.push({ u1: 0, v1: 28, u2: 67, v2: 28, thickness: 0.1, isRailing: true });
  }

  // Tường buồng thang máy (u: 28.5..31.5, v: 3.5..5.5)
  walls.push({ u1: 28.5, v1: 3.5, u2: 31.5, v2: 3.5, thickness: 0.2 });
  walls.push({ u1: 28.5, v1: 3.5, u2: 28.5, v2: 5.5, thickness: 0.2 });
  walls.push({ u1: 31.5, v1: 3.5, u2: 31.5, v2: 5.5, thickness: 0.2 });

  // Tường khoang cầu thang (u: 34.0..39.0, v: 2.0..7.5)
  walls.push({ u1: 34.0, v1: 2.0, u2: 39.0, v2: 2.0, thickness: 0.2 });
  walls.push({ u1: 39.0, v1: 2.0, u2: 39.0, v2: 7.5, thickness: 0.2 });
  walls.push({ u1: 34.0, v1: 2.0, u2: 34.0, v2: 7.5, thickness: 0.2 });

  if (floor === 1) {
    // Quầy thủ thư Tầng 1 (khối chữ L chắn va chạm nhân vật)
    walls.push({ u1: 24.0, v1: 15.0, u2: 28.5, v2: 15.0, thickness: 0.5, isRailing: true });
    walls.push({ u1: 24.0, v1: 15.0, u2: 24.0, v2: 18.0, thickness: 0.5, isRailing: true });

    // Dãy bàn máy tính OPAC (khối cản va chạm dạng vách thấp isRailing: true để không đi xuyên qua bàn)
    for (let row = 0; row < 3; row++) {
      const v = 15.5 + row * 4.2;
      walls.push({ u1: 48.0, v1: v, u2: 62.0, v2: v, thickness: 0.8, isRailing: true });
    }

    // Các cụm bàn đọc dài mặt Nam
    walls.push({ u1: 6.0, v1: 22.0, u2: 18.0, v2: 22.0, thickness: 0.8, isRailing: true });
    walls.push({ u1: 34.0, v1: 22.0, u2: 44.0, v2: 22.0, thickness: 0.8, isRailing: true });
  }

  if (floor === 2) {
    // Dãy phòng họp nhóm vách kính dọc tường Bắc (u = 38..65, v = 1..8)
    // Vách kính mặt hành lang (v = 8.0) chừa các cửa đi
    const roomDoors = [40.2, 44.7, 49.2, 53.7, 58.2, 62.7];
    let prevU = 38.0;
    for (const dU of roomDoors) {
      if (dU - 0.5 > prevU) {
        walls.push({ u1: prevU, v1: 8.0, u2: dU - 0.5, v2: 8.0, thickness: 0.08, isGlass: true });
      }
      prevU = dU + 0.5;
    }
    if (prevU < 65.0) {
      walls.push({ u1: prevU, v1: 8.0, u2: 65.0, v2: 8.0, thickness: 0.08, isGlass: true });
    }

    // Vách ngăn kính giữa các phòng họp
    for (const u of [38.0, 42.5, 47.0, 51.5, 56.0, 60.5, 65.0]) {
      walls.push({ u1: u, v1: 0.0, u2: u, v2: 8.0, thickness: 0.08, isGlass: u > 38.0 && u < 65.0 });
    }

    // Lan can kính thông tầng (Atrium void u: 22..36, v: 16..26)
    // isRailing: true để InteriorScene không dựng thành tường kín, mà do B4Furniture vẽ lan can kính inox
    walls.push({ u1: 22.0, v1: 16.0, u2: 36.0, v2: 16.0, thickness: 0.15, isRailing: true });
    walls.push({ u1: 22.0, v1: 26.0, u2: 36.0, v2: 26.0, thickness: 0.15, isRailing: true });
    walls.push({ u1: 22.0, v1: 16.0, u2: 22.0, v2: 26.0, thickness: 0.15, isRailing: true });
    walls.push({ u1: 36.0, v1: 16.0, u2: 36.0, v2: 26.0, thickness: 0.15, isRailing: true });

    // Cụm bàn carrels Zone B
    walls.push({ u1: 42.0, v1: 20.0, u2: 56.0, v2: 20.0, thickness: 0.7, isRailing: true });
  }

  if (floor === 3) {
    // Vách phân chia khu vực học tập yên tĩnh & nghiên cứu (u = 33.0, v = 9..27 chừa lối thông ở giữa)
    walls.push({ u1: 33.0, v1: 9.0, u2: 33.0, v2: 15.0, thickness: 0.2 });
    walls.push({ u1: 33.0, v1: 21.0, u2: 33.0, v2: 27.0, thickness: 0.2 });

    // Dãy bàn học yên tĩnh
    walls.push({ u1: 8.0, v1: 14.0, u2: 24.0, v2: 14.0, thickness: 0.8, isRailing: true });
    walls.push({ u1: 42.0, v1: 14.0, u2: 58.0, v2: 14.0, thickness: 0.8, isRailing: true });
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

// Các lỗ khoét sàn thông tầng / khoang thang
export function getFloorHoles(floor: number): Vec2[][] {
  if (floor === 1) return [];

  const holes: Vec2[][] = [];

  // Lỗ khoét cầu thang bộ lên các tầng
  holes.push([
    toWorld(34.0, 2.0),
    toWorld(39.0, 2.0),
    toWorld(39.0, 7.5),
    toWorld(34.0, 7.5),
  ]);

  if (floor === 2) {
    // Khoảng giếng trời thông tầng (Atrium) nhìn xuống tầng 1
    holes.push([
      toWorld(22.0, 16.0),
      toWorld(36.0, 16.0),
      toWorld(36.0, 26.0),
      toWorld(22.0, 26.0),
    ]);
  }

  return holes;
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
  return u >= 0.2 && u <= 66.8 && v >= 0.2 && v <= 27.8;
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

  // Cho phép đi qua khu vực cửa tầng 1 khi ra/vào
  const isNearExitT1 =
    floor === 1 &&
    ((currentU >= 25.5 && currentU <= 30.5 && currentV >= 27.5) ||
     (currentU >= 66.0 && currentV >= 12.0 && currentV <= 16.0) ||
     (currentU <= 1.0 && currentV >= 12.0 && currentV <= 16.0));

  const onStairs = isInsideAnyStairFootprint(
    B4_WALKABLE_STAIRS,
    currentU,
    currentV,
    floor,
    3,
    currentY
  );

  // Kiểm tra ranh giới bao quanh
  if (!isInsideB4Boundary(currentU, currentV) && !isNearExitT1 && !onStairs) {
    currentU = prevU;
    currentV = prevV;
  }

  // Chống rơi vào khoảng thông tầng Tầng 2
  if (floor === 2 && currentU >= 22.0 && currentU <= 36.0 && currentV >= 16.0 && currentV <= 26.0 && !onStairs) {
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

  if (!isInsideB4Boundary(currentU, currentV) && !isNearExitT1) {
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
  // 1. Khi đang ở ngoài khuôn viên: kiểm tra tiệm cận các cửa vào ngoại thất
  if (floor === null) {
    for (const ent of b4ExteriorEntrances) {
      const dist = Math.hypot(worldX - ent.worldPos[0], worldZ - ent.worldPos[1]);
      if (dist <= ent.radius) {
        return {
          id: ent.id,
          type: 'exterior-door',
          worldPos: ent.worldPos,
          radius: ent.radius,
          label: ent.label,
          buildingId: ent.buildingId,
          spawnPosWorld: ent.spawnInsideWorld,
          spawnYaw: ent.spawnInsideYaw,
        };
      }
    }
    return null;
  }

  // 2. Khi đang ở bên trong:
  // a. Thang máy
  const [u, v] = toLocal(worldX, worldZ);
  const distElevator = Math.hypot(u - B4_ELEVATOR_POS_LOCAL[0], v - B4_ELEVATOR_POS_LOCAL[1]);
  if (distElevator <= 2.5) {
    return {
      id: 'b4-elevator',
      type: 'elevator',
      worldPos: B4_ELEVATOR_POS_WORLD,
      radius: 2.5,
      label: 'Thang máy Thư viện B4 (Nhấn E)',
      buildingId: 'b4',
    };
  }

  // b. Cửa ra ngoài khuôn viên ở tầng 1
  if (floor === 1) {
    for (const ent of b4ExteriorEntrances) {
      const dist = Math.hypot(worldX - ent.spawnInsideWorld[0], worldZ - ent.spawnInsideWorld[1]);
      if (dist <= 2.5) {
        return {
          id: `${ent.id}-exit`,
          type: 'interior-door',
          worldPos: ent.spawnInsideWorld,
          radius: 2.5,
          label: 'Ra ngoài khuôn viên (Nhấn E)',
          buildingId: 'b4',
          spawnPosWorld: ent.spawnOutsideWorld,
          spawnYaw: ent.spawnOutsideYaw,
        };
      }
    }
  }

  return null;
}

function canStandOnFloorZeroB4(u: number, v: number): boolean {
  const [minU, maxU, minV, maxV] = B4_SWITCHBACK_STAIR.shaftBounds;
  if (u >= minU && u <= maxU && v >= minV && v <= maxV) {
    return false;
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
    B4_WALKABLE_STAIRS,
    toLocal,
    worldX,
    worldZ,
    prevY,
    floor,
    3,
    canStandOnFloorZeroB4
  );
}

export const b4Layout: InteriorLayout = {
  buildingId: 'b4',
  name: 'Block 4 — Thư viện',
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
    facingYaw: getLocalFacingYaw(Math.PI / 2),
  },
  exteriorEntrances: b4ExteriorEntrances,
  defaultInsideEntrance: B4_ENTRANCE_SOUTH_INSIDE,
  defaultOutsideEntrance: B4_ENTRANCE_SOUTH_OUTSIDE,
};
