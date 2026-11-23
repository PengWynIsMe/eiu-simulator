import type { Vec2 } from '../../../types';
import type {
  WallSegment,
  RoomArea,
  InteractivePoint,
  InteriorLayout,
  ExteriorEntrance,
} from '../types';
import { B6_TEXT } from '../b6Text';

/**
 * Hệ tọa độ địa phương Block 6 (Vườn ươm Doanh nghiệp Becamex BBI & Trung tâm An ninh mạng):
 * Gốc tọa độ B6_ORIGIN: góc Tây Bắc của Block 6 [173.8, 77.5] (world).
 * Góc xoay trục U: rotY = 0.10808157 (~6.19°).
 * Trục U: dọc chiều rộng tòa nhà (u = 0: mặt Tây, u = 34.3: mặt Đông hướng 100.B6).
 * Trục V: dọc chiều dài tòa nhà (v = 0: mặt Bắc giáp hành lang B3–B6, v = 47.7: mặt Nam).
 */
export const B6_ORIGIN: Vec2 = [173.8, 77.5];
export const B6_ROTATION_Y = 0.10808157; // radians (~6.19°)

const COS = Math.cos(B6_ROTATION_Y);
const SIN = Math.sin(B6_ROTATION_Y);

export function toWorld(u: number, v: number): Vec2 {
  return [
    B6_ORIGIN[0] + u * COS - v * SIN,
    B6_ORIGIN[1] + u * SIN + v * COS,
  ];
}

export function toLocal(x: number, z: number): [number, number] {
  const dx = x - B6_ORIGIN[0];
  const dz = z - B6_ORIGIN[1];
  return [
    dx * COS + dz * SIN,
    -dx * SIN + dz * COS,
  ];
}

/** Tọa độ các cửa ra vào ngoài và trong */
export const B6_NORTH_OUTSIDE: Vec2 = toWorld(13.9, -1.2);
export const B6_NORTH_INSIDE: Vec2 = toWorld(13.9, 2.8);

export const B6_SOUTH_OUTSIDE: Vec2 = toWorld(13.9, 49.0);
export const B6_SOUTH_INSIDE: Vec2 = toWorld(13.9, 45.2);

/** Thang máy B6 */
export const B6_ELEVATOR_POS_LOCAL: [number, number] = [16.8, 38.0];
export const B6_ELEVATOR_POS_WORLD: Vec2 = toWorld(B6_ELEVATOR_POS_LOCAL[0], B6_ELEVATOR_POS_LOCAL[1]);
export const B6_ELEVATOR_SPAWN_LOCAL: [number, number] = [15.0, 38.0];
export const B6_ELEVATOR_SPAWN_WORLD: Vec2 = toWorld(B6_ELEVATOR_SPAWN_LOCAL[0], B6_ELEVATOR_SPAWN_LOCAL[1]);

/** Tọa độ khu vực chờ cầu thang sơn gáy sách (dành cho Codex) */
export const B6_CODEX_STAIRWELL_LOCAL = {
  minU: 10.2,
  maxU: 13.8,
  minV: 25.0,
  maxV: 34.0,
  landingF1: [12.0, 25.5] as [number, number],
  landingF2: [12.0, 33.5] as [number, number],
};

// =============================================================================
// DANH SÁCH PHÒNG THEO TẦNG
// =============================================================================

export const TANG_1_B6_ROOMS: readonly RoomArea[] = [
  {
    code: '100.B6',
    name: 'Trung tâm An ninh mạng (Cyber Security Center)',
    minU: 18.2,
    maxU: 34.2,
    minV: 1.0,
    maxV: 18.0,
  },
  {
    code: 'Sảnh BBI',
    name: 'Sảnh kính thông tầng BBI (Khu đón tiếp & Hồ nước cảnh quan)',
    minU: 9.8,
    maxU: 18.2,
    minV: 0.0,
    maxV: 24.0,
  },
  {
    code: 'Thang bộ gáy sách (Codex)',
    name: 'Khu vực Cầu thang sơn gáy sách (chuyển giao Codex)',
    minU: 10.2,
    maxU: 14.0,
    minV: 24.0,
    maxV: 35.0,
  },
  {
    code: 'Sảnh Nam BBI',
    name: 'Sảnh Nam & Lối thang máy B6',
    minU: 14.0,
    maxU: 18.2,
    minV: 35.0,
    maxV: 47.7,
  },
  {
    code: 'P.102',
    name: 'Hội trường đa năng phía Tây',
    minU: 0.2,
    maxU: 9.8,
    minV: 1.0,
    maxV: 41.0,
  },
  {
    code: 'P.101–P.109',
    name: 'Không gian Khởi nghiệp BBI (Gian làm việc P.101–P.109)',
    minU: 18.2,
    maxU: 34.2,
    minV: 18.0,
    maxV: 41.0,
  },
  {
    code: 'PKT / WC',
    name: 'Phòng kỹ thuật & Khu vệ sinh Tầng 1',
    minU: 18.2,
    maxU: 34.2,
    minV: 41.0,
    maxV: 47.7,
  },
];

export const TANG_2_B6_ROOMS: readonly RoomArea[] = [
  {
    code: '206.B6',
    name: 'Văn phòng Đoàn Thanh niên – Hội Sinh viên EIU',
    minU: 18.2,
    maxU: 34.2,
    minV: 1.0,
    maxV: 18.0,
  },
  {
    code: 'Hành lang Tầng 2',
    name: 'Hành lang thông tầng & Cầu nối trung tâm BBI',
    minU: 9.8,
    maxU: 18.2,
    minV: 0.0,
    maxV: 47.7,
  },
  {
    code: 'Không gian CLB SV',
    name: 'Không gian ươm tạo & Sinh hoạt CLB sinh viên Tầng 2',
    minU: 18.2,
    maxU: 34.2,
    minV: 18.0,
    maxV: 47.0,
  },
  {
    code: 'P.202',
    name: 'Không gian làm việc mở & Hội thảo Tầng 2',
    minU: 0.2,
    maxU: 9.8,
    minV: 1.0,
    maxV: 41.0,
  },
];

// =============================================================================
// HỆ TƯỜNG & VÁCH KÍNH B6
// =============================================================================

function generateB6Walls(floor: number): WallSegment[] {
  const walls: WallSegment[] = [];

  // 1. Tường bao ngoài chu vi công trình
  // Mặt Bắc (v = 0.0)
  walls.push({ u1: 0.0, v1: 0.0, u2: 9.8, v2: 0.0, thickness: 0.25 });
  // Cửa Bắc sảnh kính (chừa lối đi u = 12.5 .. 15.3)
  walls.push({ u1: 9.8, v1: 0.0, u2: 12.5, v2: 0.0, thickness: 0.08, isGlass: true });
  walls.push({ u1: 15.3, v1: 0.0, u2: 18.2, v2: 0.0, thickness: 0.08, isGlass: true });
  walls.push({ u1: 18.2, v1: 0.0, u2: 34.3, v2: 0.0, thickness: 0.25 });

  // Mặt Nam (v = 47.7)
  walls.push({ u1: 0.0, v1: 47.7, u2: 9.8, v2: 47.7, thickness: 0.25 });
  // Cửa Nam sảnh kính (chừa lối đi u = 12.5 .. 15.3)
  walls.push({ u1: 9.8, v1: 47.7, u2: 12.5, v2: 47.7, thickness: 0.08, isGlass: true });
  walls.push({ u1: 15.3, v1: 47.7, u2: 18.2, v2: 47.7, thickness: 0.08, isGlass: true });
  walls.push({ u1: 18.2, v1: 47.7, u2: 34.3, v2: 47.7, thickness: 0.25 });

  // Mặt Tây (u = 0.0)
  walls.push({ u1: 0.0, v1: 0.0, u2: 0.0, v2: 47.7, thickness: 0.25 });

  // Mặt Đông (u = 34.3)
  walls.push({ u1: 34.3, v1: 0.0, u2: 34.3, v2: 47.7, thickness: 0.25 });

  // 2. Vách dọc ngăn cách Sảnh trung tâm với 2 cánh
  // Trục Tây sảnh (u = 9.8, ngăn Hội trường P.102): có 2 cửa mở
  walls.push({ u1: 9.8, v1: 0.0, u2: 9.8, v2: 8.0, thickness: 0.2 });
  walls.push({ u1: 9.8, v1: 10.5, u2: 9.8, v2: 28.0, thickness: 0.2 });
  walls.push({ u1: 9.8, v1: 30.5, u2: 9.8, v2: 47.7, thickness: 0.2 });

  if (floor === 1) {
    // Trục Đông sảnh (u = 18.2, tiếp giáp 100.B6 Trung tâm An ninh mạng):
    // Vách kính hiện đại chuẩn EIU nhìn vào Trung tâm An ninh mạng (v = 1.0 .. 18.0)
    // Cửa kính đôi tại v = 8.2 .. 10.6
    walls.push({ u1: 18.2, v1: 0.0, u2: 18.2, v2: 1.0, thickness: 0.2 });
    walls.push({ u1: 18.2, v1: 1.0, u2: 18.2, v2: 8.2, thickness: 0.06, isGlass: true });
    walls.push({ u1: 18.2, v1: 10.6, u2: 18.2, v2: 18.0, thickness: 0.06, isGlass: true });
    // Phần tường tiếp theo ngăn gian khởi nghiệp (v = 18.0 .. 47.7, có cửa mở v = 22..24 và v = 34..36)
    walls.push({ u1: 18.2, v1: 18.0, u2: 18.2, v2: 22.0, thickness: 0.2 });
    walls.push({ u1: 18.2, v1: 24.0, u2: 18.2, v2: 34.0, thickness: 0.2 });
    walls.push({ u1: 18.2, v1: 36.0, u2: 18.2, v2: 47.7, thickness: 0.2 });

    // Tường ngang chia 100.B6 với dãy gian khởi nghiệp BBI
    walls.push({ u1: 18.2, v1: 18.0, u2: 34.3, v2: 18.0, thickness: 0.2 });

    // Tường ngang chia gian khởi nghiệp với khu kỹ thuật/WC
    walls.push({ u1: 18.2, v1: 41.0, u2: 34.3, v2: 41.0, thickness: 0.2 });

    // Tường ngang chia Hội trường P.102 với WC Tây
    walls.push({ u1: 0.0, v1: 41.0, u2: 9.8, v2: 41.0, thickness: 0.2 });

    // Viền hồ nước cạn sảnh (u = 10.4 .. 12.4, v = 6.0 .. 22.0) - gờ đá bazan ngăn bước vào lòng hồ
    walls.push({ u1: 10.4, v1: 6.0, u2: 12.4, v2: 6.0, thickness: 0.16, isRailing: true, minY: 0, maxY: 0.3 });
    walls.push({ u1: 12.4, v1: 6.0, u2: 12.4, v2: 22.0, thickness: 0.16, isRailing: true, minY: 0, maxY: 0.3 });
    walls.push({ u1: 12.4, v1: 22.0, u2: 10.4, v2: 22.0, thickness: 0.16, isRailing: true, minY: 0, maxY: 0.3 });
    walls.push({ u1: 10.4, v1: 22.0, u2: 10.4, v2: 6.0, thickness: 0.16, isRailing: true, minY: 0, maxY: 0.3 });
  } else {
    // Tầng 2: Vách trục Đông (u = 18.2) ngăn phòng 206.B6 và không gian SV
    walls.push({ u1: 18.2, v1: 0.0, u2: 18.2, v2: 8.0, thickness: 0.2 });
    walls.push({ u1: 18.2, v1: 10.5, u2: 18.2, v2: 28.0, thickness: 0.2 });
    walls.push({ u1: 18.2, v1: 30.5, u2: 18.2, v2: 47.7, thickness: 0.2 });

    walls.push({ u1: 18.2, v1: 18.0, u2: 34.3, v2: 18.0, thickness: 0.2 });
    walls.push({ u1: 18.2, v1: 41.0, u2: 34.3, v2: 41.0, thickness: 0.2 });

    // Lan can kính quanh 2 lỗ thông tầng (North Void & South Void)
    // North Void: u = 10.0 .. 16.2, v = 4.0 .. 19.0
    walls.push({ u1: 10.0, v1: 4.0, u2: 16.2, v2: 4.0, thickness: 0.06, isRailing: true, isGlass: true, minY: 0, maxY: 1.1 });
    walls.push({ u1: 16.2, v1: 4.0, u2: 16.2, v2: 19.0, thickness: 0.06, isRailing: true, isGlass: true, minY: 0, maxY: 1.1 });
    walls.push({ u1: 16.2, v1: 19.0, u2: 10.0, v2: 19.0, thickness: 0.06, isRailing: true, isGlass: true, minY: 0, maxY: 1.1 });
    walls.push({ u1: 10.0, v1: 19.0, u2: 10.0, v2: 4.0, thickness: 0.06, isRailing: true, isGlass: true, minY: 0, maxY: 1.1 });

    // South Void: u = 10.0 .. 16.2, v = 23.0 .. 35.0 (trên ô cầu thang Codex)
    walls.push({ u1: 10.0, v1: 23.0, u2: 16.2, v2: 23.0, thickness: 0.06, isRailing: true, isGlass: true, minY: 0, maxY: 1.1 });
    walls.push({ u1: 16.2, v1: 23.0, u2: 16.2, v2: 35.0, thickness: 0.06, isRailing: true, isGlass: true, minY: 0, maxY: 1.1 });
    walls.push({ u1: 16.2, v1: 35.0, u2: 10.0, v2: 35.0, thickness: 0.06, isRailing: true, isGlass: true, minY: 0, maxY: 1.1 });
    walls.push({ u1: 10.0, v1: 35.0, u2: 10.0, v2: 23.0, thickness: 0.06, isRailing: true, isGlass: true, minY: 0, maxY: 1.1 });
  }

  return walls;
}

const b6FloorWallsCache: Record<number, WallSegment[]> = {};

export function getFloorWalls(floor: number): readonly WallSegment[] {
  if (!b6FloorWallsCache[floor]) {
    b6FloorWallsCache[floor] = generateB6Walls(floor);
  }
  return b6FloorWallsCache[floor] ?? [];
}

export function getFloorRooms(floor: number): readonly RoomArea[] {
  return floor === 2 ? TANG_2_B6_ROOMS : TANG_1_B6_ROOMS;
}

export function getFloorBoundaryPts(): Vec2[] {
  return [
    toWorld(0.0, 0.0),
    toWorld(34.3, 0.0),
    toWorld(34.46, 47.7),
    toWorld(0.0, 47.7),
  ];
}

export function getFloorHoles(floor: number): Vec2[][] {
  if (floor !== 2) return [];

  // Tầng 2 có 2 ô khoét thông tầng nhìn xuống sảnh Tầng 1 (hồ nước & ô cầu thang Codex)
  return [
    [
      toWorld(10.0, 4.0),
      toWorld(16.2, 4.0),
      toWorld(16.2, 19.0),
      toWorld(10.0, 19.0),
    ],
    [
      toWorld(10.0, 23.0),
      toWorld(16.2, 23.0),
      toWorld(16.2, 35.0),
      toWorld(10.0, 35.0),
    ],
  ];
}

// =============================================================================
// VA CHẠM & TỌA ĐỘ DI CHUYỂN B6
// =============================================================================

function distancePointToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

export function resolveInteriorPosition(
  nextX: number,
  nextZ: number,
  prevX: number,
  prevZ: number,
  floor: number,
  radius = 0.38,
  currentY = 0
): Vec2 {
  const [nextU, nextV] = toLocal(nextX, nextZ);
  const [prevU, prevV] = toLocal(prevX, prevZ);

  let curU = nextU;
  let curV = nextV;

  // Giới hạn biên sàn B6
  if (curU < 0.3 || curU > 34.0 || curV < 0.3 || curV > 47.4) {
    // Chừa lối thoát ở cửa Bắc (v < 0.3 tại u = 12.6..15.2) và cửa Nam (v > 47.4 tại u = 12.6..15.2)
    const isNorthDoor = curU >= 12.6 && curU <= 15.2 && curV <= 1.5;
    const isSouthDoor = curU >= 12.6 && curU <= 15.2 && curV >= 46.5;
    if (!isNorthDoor && !isSouthDoor) {
      curU = prevU;
      curV = prevV;
    }
  }

  // Tầng 2: chặn bước rơi vào 2 ô thông tầng (North Void & South Void)
  if (floor === 2) {
    const inNorthHole = curU > 9.9 && curU < 16.3 && curV > 3.9 && curV < 19.1;
    const inSouthHole = curU > 9.9 && curU < 16.3 && curV > 22.9 && curV < 35.1;
    if (inNorthHole || inSouthHole) {
      curU = prevU;
      curV = prevV;
    }
  }

  // Kiểm tra va chạm với các bức tường
  const walls = getFloorWalls(floor);
  for (const wall of walls) {
    if (wall.isRailing && (currentY < (wall.minY ?? 0) || currentY > (wall.maxY ?? 3.8))) {
      continue;
    }
    const dist = distancePointToSegment(curU, curV, wall.u1, wall.v1, wall.u2, wall.v2);
    const safeDist = radius + wall.thickness * 0.5;
    if (dist < safeDist) {
      // Đẩy lùi về vị trí trước
      curU = prevU;
      curV = prevV;
      break;
    }
  }

  return toWorld(curU, curV);
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

export const b6ExteriorEntrances: readonly ExteriorEntrance[] = [
  {
    id: 'exterior-b6-north',
    buildingId: 'b6',
    worldPos: B6_NORTH_OUTSIDE,
    radius: 4.5,
    label: B6_TEXT.doors.northEntrance.vi,
    spawnInsideWorld: B6_NORTH_INSIDE,
    spawnInsideYaw: Math.PI,
    spawnOutsideWorld: B6_NORTH_OUTSIDE,
    spawnOutsideYaw: 0,
  },
  {
    id: 'exterior-b6-south',
    buildingId: 'b6',
    worldPos: B6_SOUTH_OUTSIDE,
    radius: 4.5,
    label: B6_TEXT.doors.southEntrance.vi,
    spawnInsideWorld: B6_SOUTH_INSIDE,
    spawnInsideYaw: 0,
    spawnOutsideWorld: B6_SOUTH_OUTSIDE,
    spawnOutsideYaw: Math.PI,
  },
];

export function getNearInteractive(
  worldX: number,
  worldZ: number,
  floor: number | null
): InteractivePoint | null {
  if (floor === null) {
    // Ngoài khuôn viên: kiểm tra gần Cửa Bắc hoặc Cửa Nam Block 6
    const distNorth = Math.hypot(worldX - B6_NORTH_OUTSIDE[0], worldZ - B6_NORTH_OUTSIDE[1]);
    if (distNorth <= 4.5) {
      return {
        id: 'exterior-b6-north',
        type: 'exterior-door',
        worldPos: B6_NORTH_OUTSIDE,
        radius: 4.5,
        label: B6_TEXT.doors.northEntrance.vi,
        buildingId: 'b6',
        spawnPosWorld: B6_NORTH_INSIDE,
        spawnYaw: Math.PI,
      };
    }
    const distSouth = Math.hypot(worldX - B6_SOUTH_OUTSIDE[0], worldZ - B6_SOUTH_OUTSIDE[1]);
    if (distSouth <= 4.5) {
      return {
        id: 'exterior-b6-south',
        type: 'exterior-door',
        worldPos: B6_SOUTH_OUTSIDE,
        radius: 4.5,
        label: B6_TEXT.doors.southEntrance.vi,
        buildingId: 'b6',
        spawnPosWorld: B6_SOUTH_INSIDE,
        spawnYaw: 0,
      };
    }
    return null;
  }

  // Trong nội thất:
  // 1. Thang máy B6 (Tầng 1 & Tầng 2)
  const distElevator = Math.hypot(worldX - B6_ELEVATOR_POS_WORLD[0], worldZ - B6_ELEVATOR_POS_WORLD[1]);
  if (distElevator <= 3.2) {
    return {
      id: 'interior-b6-elevator',
      type: 'elevator',
      worldPos: B6_ELEVATOR_POS_WORLD,
      radius: 3.2,
      label: B6_TEXT.doors.elevator.vi,
      buildingId: 'b6',
    };
  }

  // 2. Cửa ra khuôn viên (chỉ Tầng 1)
  if (floor === 1) {
    const distNorthExit = Math.hypot(worldX - B6_NORTH_INSIDE[0], worldZ - B6_NORTH_INSIDE[1]);
    if (distNorthExit <= 3.2) {
      return {
        id: 'interior-b6-exit-north',
        type: 'interior-door',
        worldPos: B6_NORTH_INSIDE,
        radius: 3.2,
        label: B6_TEXT.doors.exitNorth.vi,
        buildingId: 'b6',
        spawnPosWorld: B6_NORTH_OUTSIDE,
        spawnYaw: 0,
      };
    }
    const distSouthExit = Math.hypot(worldX - B6_SOUTH_INSIDE[0], worldZ - B6_SOUTH_INSIDE[1]);
    if (distSouthExit <= 3.2) {
      return {
        id: 'interior-b6-exit-south',
        type: 'interior-door',
        worldPos: B6_SOUTH_INSIDE,
        radius: 3.2,
        label: B6_TEXT.doors.exitSouth.vi,
        buildingId: 'b6',
        spawnPosWorld: B6_SOUTH_OUTSIDE,
        spawnYaw: Math.PI,
      };
    }
  }

  return null;
}

export const b6Layout: InteriorLayout = {
  buildingId: 'b6',
  name: 'Block 6 (Vườn ươm BBI & An ninh mạng)',
  origin: B6_ORIGIN,
  rotationY: B6_ROTATION_Y,
  floors: 2,
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
    posLocal: B6_ELEVATOR_POS_LOCAL,
    spawnLocal: B6_ELEVATOR_SPAWN_LOCAL,
    posWorld: B6_ELEVATOR_POS_WORLD,
    spawnWorld: B6_ELEVATOR_SPAWN_WORLD,
    facingYaw: 0,
  },
  exteriorEntrances: b6ExteriorEntrances,
  defaultInsideEntrance: B6_NORTH_INSIDE,
  defaultOutsideEntrance: B6_NORTH_OUTSIDE,
};
