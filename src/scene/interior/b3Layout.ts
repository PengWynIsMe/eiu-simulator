import type { Vec2 } from '../../types';

/**
 * Hệ tọa độ địa phương B3:
 * Gốc tọa độ: điểm góc trong phía Bắc của Block 3 [167.6, 22.7] (world).
 * Góc xoay trục dài: -6.25° (atan2(-3.9, 35.6)).
 * u: dọc theo chiều dài tòa nhà (u < 0: cánh Tây hướng hồ; u > 0: cánh Đông hướng đường cổng).
 * v: dọc theo chiều sâu tòa nhà (v = 0: mặt Bắc; v = 40.1: mặt Nam giáp hành lang B6).
 */
export const B3_ORIGIN: Vec2 = [167.6, 22.7];
export const B3_ROTATION_Y = -0.10899728; // radians (-6.25°)

const COS = Math.cos(B3_ROTATION_Y);
const SIN = Math.sin(B3_ROTATION_Y);

export function toWorld(u: number, v: number): Vec2 {
  return [
    B3_ORIGIN[0] + u * COS - v * SIN,
    B3_ORIGIN[1] + u * SIN + v * COS,
  ];
}

export function toLocal(x: number, z: number): [number, number] {
  const dx = x - B3_ORIGIN[0];
  const dz = z - B3_ORIGIN[1];
  return [
    dx * COS + dz * SIN,
    -dx * SIN + dz * COS,
  ];
}

export interface WallSegment {
  u1: number;
  v1: number;
  u2: number;
  v2: number;
  thickness: number;
  isGlass?: boolean;
}

export interface RoomArea {
  code: string;
  name: string;
  minU: number;
  maxU: number;
  minV: number;
  maxV: number;
}

export interface InteractivePoint {
  id: string;
  type: 'exterior-door' | 'interior-door' | 'elevator';
  worldPos: Vec2;
  radius: number;
  label: string;
  targetFloor?: number;
}

/** Vị trí tương tác cửa chính (ngoài khuôn viên) */
export const OUTSIDE_ENTRANCE: Vec2 = toWorld(16.0, -1.8);
/** Vị trí xuất hiện khi bước vào sảnh tầng 1 */
export const INSIDE_ENTRANCE: Vec2 = toWorld(16.0, 3.2);

/** Vị trí thang máy trên các tầng */
export const ELEVATOR_POS_LOCAL: [number, number] = [20.0, 20.0];
export const ELEVATOR_POS_WORLD: Vec2 = toWorld(ELEVATOR_POS_LOCAL[0], ELEVATOR_POS_LOCAL[1]);
/** Vị trí xuất hiện khi ra khỏi thang máy */
export const ELEVATOR_SPAWN_LOCAL: [number, number] = [17.5, 20.0];
export const ELEVATOR_SPAWN_WORLD: Vec2 = toWorld(ELEVATOR_SPAWN_LOCAL[0], ELEVATOR_SPAWN_LOCAL[1]);

/** Vị trí cầu thang nhiều màu */
export const STAIRCASE_POS_LOCAL: [number, number] = [25.0, 20.0];

// =============================================================================
// TẦNG 1: Sảnh kính, Không gian chung, Hội thảo, Phòng họp VIP, Phòng học, OCE
// =============================================================================

export const TANG_1_ROOMS: readonly RoomArea[] = [
  {
    code: 'Sảnh chính',
    name: 'Sảnh đón tiếp & Phòng Kết nối Cộng đồng',
    minU: 8,
    maxU: 24,
    minV: 0,
    maxV: 16,
  },
  {
    code: '100.B3',
    name: 'Phòng VIP',
    minU: 20,
    maxU: 35.5,
    minV: 4,
    maxV: 16,
  },
  {
    code: '101.B3 / P.106',
    name: 'Phòng họp & khu làm việc hành chính',
    minU: 0,
    maxU: 10,
    minV: 12,
    maxV: 24,
  },
  {
    code: '104–105.B3',
    name: 'Văn phòng Khoa Quản trị Kinh doanh (QTKD) & Honors Program',
    minU: -20,
    maxU: 0,
    minV: 12,
    maxV: 24,
  },
  {
    code: '102–103.B3',
    name: 'Cụm Phòng học Lý thuyết',
    minU: -48,
    maxU: -20,
    minV: 12,
    maxV: 24,
  },
  {
    code: 'P.107',
    name: 'Phòng học',
    minU: -71,
    maxU: -48,
    minV: 12,
    maxV: 24,
  },
  {
    code: 'Không gian chung',
    name: 'Không gian tự học & Thư giãn sinh viên',
    minU: -71,
    maxU: -40,
    minV: 28,
    maxV: 40,
  },
  {
    code: 'Khu vực Hội thảo',
    name: 'Khu vực Hội thảo & Chuyên đề',
    minU: -40,
    maxU: -2,
    minV: 28,
    maxV: 40,
  },
  {
    code: '108–110.B3',
    name: 'Văn phòng OCE (Hợp tác Doanh nghiệp & Quốc tế)',
    minU: 20,
    maxU: 35.5,
    minV: 24,
    maxV: 40,
  },
];

export const TANG_1_WALLS: readonly WallSegment[] = [
  // --- Tường bao ngoài (Outer Perimeter) ---
  // Mặt Bắc cánh Đông: cửa chính hở ở u ∈ [14, 18]
  { u1: 0, v1: 0, u2: 14, v2: 0, thickness: 0.3 },
  { u1: 18, v1: 0, u2: 35.8, v2: 0, thickness: 0.3 },
  // Mặt Đông
  { u1: 35.8, v1: 0, u2: 35.8, v2: 40.1, thickness: 0.3 },
  // Mặt Nam
  { u1: -72, v1: 40.1, u2: 35.8, v2: 40.1, thickness: 0.3 },
  // Mặt Tây
  { u1: -72, v1: 12.0, u2: -72, v2: 40.1, thickness: 0.3 },
  // Mặt Bắc cánh Tây (nhìn ra hồ & 2 cầu)
  { u1: -72, v1: 12.0, u2: 0, v2: 12.0, thickness: 0.3 },
  // Khớp góc trong
  { u1: 0, v1: 0, u2: 0, v2: 12.0, thickness: 0.3 },

  // --- Hành lang chính cánh Tây (v = 24 và v = 28) ---
  // Tường phía Bắc hành lang (v = 24): có cửa mở vào các phòng
  { u1: -72, v1: 24, u2: -61, v2: 24, thickness: 0.2 }, // cửa P.107 hở [-61, -59]
  { u1: -59, v1: 24, u2: -36, v2: 24, thickness: 0.2 }, // cửa 102-103 hở [-36, -34]
  { u1: -34, v1: 24, u2: -12, v2: 24, thickness: 0.2 }, // cửa 104-105 hở [-12, -10]
  { u1: -10, v1: 24, u2: 2, v2: 24, thickness: 0.2 },   // cửa 101 hở [2, 4]
  { u1: 4, v1: 24, u2: 10, v2: 24, thickness: 0.2, isGlass: true },

  // Tường phía Nam hành lang (v = 28):
  { u1: -72, v1: 28, u2: -58, v2: 28, thickness: 0.2 }, // cửa không gian chung hở [-58, -55]
  { u1: -55, v1: 28, u2: -23, v2: 28, thickness: 0.2 }, // cửa hội thảo hở [-23, -20]
  { u1: -20, v1: 28, u2: -2, v2: 28, thickness: 0.2 },
  { u1: -2, v1: 28, u2: 14, v2: 28, thickness: 0.2 },

  // --- Vách ngăn các phòng cánh Tây ---
  { u1: -48, v1: 12, u2: -48, v2: 24, thickness: 0.2 }, // ngăn P.107 & 102-103
  { u1: -20, v1: 12, u2: -20, v2: 24, thickness: 0.2 }, // ngăn 102-103 & 104-105
  { u1: 0, v1: 12, u2: 0, v2: 24, thickness: 0.2 },     // ngăn 104-105 & 101
  { u1: 10, v1: 12, u2: 10, v2: 24, thickness: 0.2, isGlass: true }, // vách kính sảnh & 101
  { u1: -38, v1: 28, u2: -38, v2: 40, thickness: 0.2 }, // ngăn không gian chung & hội thảo
  { u1: -2, v1: 28, u2: -2, v2: 40, thickness: 0.2 },   // kết thúc khu hội thảo

  // --- Cánh Đông: Phòng VIP (100.B3), Thang máy, Văn phòng OCE (108-110.B3) ---
  // Vách phòng VIP (100.B3)
  { u1: 20, v1: 4, u2: 20, v2: 9, thickness: 0.2, isGlass: true }, // cửa hở [9, 11]
  { u1: 20, v1: 11, u2: 20, v2: 16, thickness: 0.2, isGlass: true },
  { u1: 20, v1: 16, u2: 35.8, v2: 16, thickness: 0.2 }, // tường ngăn ngang VIP

  // Vách văn phòng OCE (108-110.B3)
  { u1: 20, v1: 24, u2: 35.8, v2: 24, thickness: 0.2 }, // tường ngăn ngang OCE
  { u1: 20, v1: 24, u2: 20, v2: 29, thickness: 0.2 },  // cửa hở [29, 31]
  { u1: 20, v1: 31, u2: 20, v2: 40.1, thickness: 0.2 },

  // Hộp thang máy (u ∈ [20, 24], v ∈ [18, 22])
  { u1: 24, v1: 18, u2: 24, v2: 22, thickness: 0.25 }, // lưng thang
  { u1: 20, v1: 18, u2: 24, v2: 18, thickness: 0.25 }, // hông Bắc
  { u1: 20, v1: 22, u2: 24, v2: 22, thickness: 0.25 }, // hông Nam
];

// =============================================================================
// TẦNG 2: Hội trường 200.B3 (544 chỗ), 4 Giảng đường bậc thang 201–204.B3, WC 205
// =============================================================================

export const TANG_2_ROOMS: readonly RoomArea[] = [
  {
    code: '200.B3',
    name: 'Hội trường lớn EIU (sức chứa 544 sinh viên)',
    minU: -71,
    maxU: -18,
    minV: 12.5,
    maxV: 39.5,
  },
  {
    code: '201.B3',
    name: 'Giảng đường 1',
    minU: -18,
    maxU: 0,
    minV: 12,
    maxV: 24,
  },
  {
    code: '202.B3',
    name: 'Giảng đường 2',
    minU: -18,
    maxU: 0,
    minV: 28,
    maxV: 40,
  },
  {
    code: '203.B3',
    name: 'Giảng đường 3',
    minU: 20,
    maxU: 35.5,
    minV: 4,
    maxV: 17,
  },
  {
    code: '204.B3',
    name: 'Giảng đường 4',
    minU: 20,
    maxU: 35.5,
    minV: 23,
    maxV: 40,
  },
  {
    code: '205.B3',
    name: 'Phòng chức năng & khu WC, Kho',
    minU: 0,
    maxU: 14,
    minV: 4,
    maxV: 18,
  },
];

export const TANG_2_WALLS: readonly WallSegment[] = [
  // --- Tường bao ngoài ---
  { u1: 0, v1: 0, u2: 35.8, v2: 0, thickness: 0.3 },
  { u1: 35.8, v1: 0, u2: 35.8, v2: 40.1, thickness: 0.3 },
  { u1: -72, v1: 40.1, u2: 35.8, v2: 40.1, thickness: 0.3 },
  { u1: -72, v1: 12.0, u2: -72, v2: 40.1, thickness: 0.3 },
  { u1: -72, v1: 12.0, u2: 0, v2: 12.0, thickness: 0.3 },
  { u1: 0, v1: 0, u2: 0, v2: 12.0, thickness: 0.3 },

  // --- Tường ngăn Hội trường 200.B3 (u = -18) ---
  // Cửa đôi lớn mở vào hội trường ở v ∈ [24.5, 27.5]
  { u1: -18, v1: 12.0, u2: -18, v2: 24.5, thickness: 0.3 },
  { u1: -18, v1: 27.5, u2: -18, v2: 40.1, thickness: 0.3 },

  // --- Giảng đường 201 & 202 ---
  { u1: -18, v1: 24, u2: -10, v2: 24, thickness: 0.2 }, // cửa 201 hở [-10, -8]
  { u1: -8, v1: 24, u2: 0, v2: 24, thickness: 0.2 },
  { u1: 0, v1: 12, u2: 0, v2: 24, thickness: 0.2 },

  { u1: -18, v1: 28, u2: -10, v2: 28, thickness: 0.2 }, // cửa 202 hở [-10, -8]
  { u1: -8, v1: 28, u2: 0, v2: 28, thickness: 0.2 },
  { u1: 0, v1: 28, u2: 0, v2: 40, thickness: 0.2 },

  // --- Phòng chức năng 205.B3 ---
  { u1: 0, v1: 18, u2: 6, v2: 18, thickness: 0.2 }, // cửa hở [6, 8]
  { u1: 8, v1: 18, u2: 14, v2: 18, thickness: 0.2 },
  { u1: 14, v1: 4, u2: 14, v2: 18, thickness: 0.2 },

  // --- Giảng đường 203 & 204 ---
  { u1: 20, v1: 4, u2: 20, v2: 10, thickness: 0.2 }, // cửa 203 hở [10, 12]
  { u1: 20, v1: 12, u2: 20, v2: 17, thickness: 0.2 },
  { u1: 20, v1: 17, u2: 35.8, v2: 17, thickness: 0.2 },

  { u1: 20, v1: 23, u2: 35.8, v2: 23, thickness: 0.2 },
  { u1: 20, v1: 23, u2: 20, v2: 29, thickness: 0.2 }, // cửa 204 hở [29, 31]
  { u1: 20, v1: 31, u2: 20, v2: 40.1, thickness: 0.2 },

  // Hộp thang máy
  { u1: 24, v1: 18, u2: 24, v2: 22, thickness: 0.25 },
  { u1: 20, v1: 18, u2: 24, v2: 18, thickness: 0.25 },
  { u1: 20, v1: 22, u2: 24, v2: 22, thickness: 0.25 },
];

// =============================================================================
// TẦNG 3: Thông tầng Hội trường 200.B3, Giảng đường 5 & 6 (301, 302), Khoa QTKD 303
// =============================================================================

export const TANG_3_ROOMS: readonly RoomArea[] = [
  {
    code: 'Thông tầng 200.B3',
    name: 'Khoảng thông tầng Hội trường 200.B3 & Phòng Kỹ thuật',
    minU: -71,
    maxU: -18,
    minV: 12.5,
    maxV: 39.5,
  },
  {
    code: '303.B3',
    name: 'Văn phòng Khoa QTKD (tầng 3)',
    minU: -14,
    maxU: 10,
    minV: 12,
    maxV: 24,
  },
  {
    code: '301.B3',
    name: 'Giảng đường 5',
    minU: 20,
    maxU: 35.5,
    minV: 4,
    maxV: 17,
  },
  {
    code: '302.B3',
    name: 'Giảng đường 6',
    minU: 20,
    maxU: 35.5,
    minV: 23,
    maxV: 40,
  },
];

export const TANG_3_WALLS: readonly WallSegment[] = [
  // --- Tường bao ngoài ---
  { u1: 0, v1: 0, u2: 35.8, v2: 0, thickness: 0.3 },
  { u1: 35.8, v1: 0, u2: 35.8, v2: 40.1, thickness: 0.3 },
  { u1: -72, v1: 40.1, u2: 35.8, v2: 40.1, thickness: 0.3 },
  { u1: -72, v1: 12.0, u2: -72, v2: 40.1, thickness: 0.3 },
  { u1: -72, v1: 12.0, u2: 0, v2: 12.0, thickness: 0.3 },
  { u1: 0, v1: 0, u2: 0, v2: 12.0, thickness: 0.3 },

  // --- Lan can kính an toàn dọc khoảng thông tầng (u = -18) ---
  // Người chơi có thể đứng ở hành lang nhìn xuống hội trường bên dưới!
  { u1: -18, v1: 12.0, u2: -18, v2: 40.1, thickness: 0.15, isGlass: true },

  // --- Văn phòng Khoa QTKD 303.B3 ---
  { u1: -14, v1: 24, u2: -3, v2: 24, thickness: 0.2 }, // cửa hở [-3, -1]
  { u1: -1, v1: 24, u2: 10, v2: 24, thickness: 0.2 },
  { u1: -14, v1: 12, u2: -14, v2: 24, thickness: 0.2 },
  { u1: 10, v1: 12, u2: 10, v2: 24, thickness: 0.2 },

  // --- Giảng đường 301 & 302 ---
  { u1: 20, v1: 4, u2: 20, v2: 10, thickness: 0.2 },
  { u1: 20, v1: 12, u2: 20, v2: 17, thickness: 0.2 },
  { u1: 20, v1: 17, u2: 35.8, v2: 17, thickness: 0.2 },

  { u1: 20, v1: 23, u2: 35.8, v2: 23, thickness: 0.2 },
  { u1: 20, v1: 23, u2: 20, v2: 29, thickness: 0.2 },
  { u1: 20, v1: 31, u2: 20, v2: 40.1, thickness: 0.2 },

  // Hộp thang máy
  { u1: 24, v1: 18, u2: 24, v2: 22, thickness: 0.25 },
  { u1: 20, v1: 18, u2: 24, v2: 18, thickness: 0.25 },
  { u1: 20, v1: 22, u2: 24, v2: 22, thickness: 0.25 },
];

/** Lấy danh sách tường theo tầng */
export function getFloorWalls(floor: number): readonly WallSegment[] {
  if (floor === 2) return TANG_2_WALLS;
  if (floor === 3) return TANG_3_WALLS;
  return TANG_1_WALLS;
}

/** Lấy danh sách phòng theo tầng */
export function getFloorRooms(floor: number): readonly RoomArea[] {
  if (floor === 2) return TANG_2_ROOMS;
  if (floor === 3) return TANG_3_ROOMS;
  return TANG_1_ROOMS;
}

/**
 * Khoảng cách từ một điểm (u, v) đến đoạn thẳng [u1, v1] -> [u2, v2].
 */
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

/**
 * Kiểm tra điểm (u, v) có nằm trong đa giác biên của sàn B3 không.
 */
function isInsideFloorBoundary(u: number, v: number): boolean {
  // Cánh Đông: u ∈ [0, 35.8], v ∈ [0, 40.1]
  if (u >= 0 && u <= 35.8 && v >= 0 && v <= 40.1) return true;
  // Cánh Tây: u ∈ [-72, 0], v ∈ [12.0, 40.1]
  if (u >= -72 && u < 0 && v >= 12.0 && v <= 40.1) return true;
  return false;
}

/**
 * Giải quyết va chạm nhân vật trong nội thất tầng.
 * Trả về tọa độ thế giới [x, z] mới đã được trượt dọc theo tường.
 */
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

  // 1. Kiểm tra không rơi ra ngoài biên sàn B3
  if (!isInsideFloorBoundary(currentU, currentV)) {
    // Nếu ở tầng 1 ngay vị trí cửa chính hở (u ∈ [14, 18], v ∈ [-1, 2]), cho phép đi qua
    if (floor === 1 && currentU >= 14 && currentU <= 18 && currentV >= -1 && currentV <= 2) {
      // Đang ở vùng cửa
    } else {
      currentU = prevU;
      currentV = prevV;
    }
  }

  // 2. Kiểm tra va chạm với từng đoạn tường của tầng
  const walls = getFloorWalls(floor);
  for (const wall of walls) {
    const minDistance = radius + wall.thickness / 2;
    const dist = distanceToSegment(currentU, currentV, wall.u1, wall.v1, wall.u2, wall.v2);
    if (dist < minDistance) {
      // Đẩy nhân vật ra khỏi tường dọc theo vector pháp tuyến đoạn thẳng
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

  // Nếu vị trí sau khi đẩy vẫn không hợp lệ thì dùng lại vị trí trước
  if (!isInsideFloorBoundary(currentU, currentV)) {
    if (!(floor === 1 && currentU >= 14 && currentU <= 18 && currentV >= -1 && currentV <= 2)) {
      currentU = prevU;
      currentV = prevV;
    }
  }

  return toWorld(currentU, currentV);
}

/**
 * Xác định phòng mà nhân vật đang đứng bên trong.
 */
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

/**
 * Kiểm tra điểm tương tác gần nhân vật nhất (cửa ra vào, thang máy).
 */
export function getNearInteractive(
  worldX: number,
  worldZ: number,
  floor: number | null
): InteractivePoint | null {
  if (floor === null) {
    // Ngoài khuôn viên: kiểm tra gần cửa chính B3
    const dist = Math.hypot(worldX - OUTSIDE_ENTRANCE[0], worldZ - OUTSIDE_ENTRANCE[1]);
    if (dist <= 4.0) {
      return {
        id: 'exterior-b3-door',
        type: 'exterior-door',
        worldPos: OUTSIDE_ENTRANCE,
        radius: 4.0,
        label: 'Vào Block 3 (Khoa QTKD)',
      };
    }
    return null;
  }

  // Trong nội thất:
  // 1. Thang máy (có ở cả 3 tầng)
  const distElevator = Math.hypot(worldX - ELEVATOR_POS_WORLD[0], worldZ - ELEVATOR_POS_WORLD[1]);
  if (distElevator <= 3.2) {
    return {
      id: 'interior-elevator',
      type: 'elevator',
      worldPos: ELEVATOR_POS_WORLD,
      radius: 3.2,
      label: 'Thang máy',
    };
  }

  // 2. Cửa chính ra khuôn viên (chỉ tầng 1)
  if (floor === 1) {
    const distDoor = Math.hypot(worldX - INSIDE_ENTRANCE[0], worldZ - INSIDE_ENTRANCE[1]);
    if (distDoor <= 3.2) {
      return {
        id: 'interior-b3-exit',
        type: 'interior-door',
        worldPos: INSIDE_ENTRANCE,
        radius: 3.2,
        label: 'Ra ngoài khuôn viên',
      };
    }
  }

  return null;
}
