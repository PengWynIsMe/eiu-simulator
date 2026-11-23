import type { Vec2 } from '../types';
import type { WorldSpot } from '../types/silverWorld';
import { b8ToWorld } from './seatAnchor';

export type WaypointHint = 'door' | 'elevator' | 'room' | 'target';

export interface WaypointResult {
  x: number;
  z: number;
  hint: WaypointHint;
  floor?: number;
}

export interface RoomWaypointSpec {
  code: string;
  floor: number;
  door: { x: number; z: number };
  /** Kiểm tra (x, z) đã vào trong phòng hay chưa */
  isInside?: (x: number, z: number) => boolean;
  /** Hoặc hộp bao phòng (AABB trên mặt phẳng xz) */
  bounds?: { minX: number; maxX: number; minZ: number; maxZ: number };
}

export interface BuildingWaypointLayout {
  buildingId: string;
  /** Các cửa vào ngoài trời dẫn vào tòa */
  entrances: { x: number; z: number }[];
  /** Vị trí thang máy trên các tầng */
  elevator: { x: number; z: number };
  /** Cửa thoát hiểm/ra ngoài khi đang ở trong tòa */
  exitDoor?: { x: number; z: number };
  /** Các phòng trong tòa */
  rooms?: RoomWaypointSpec[];
}

export type WaypointLayoutMap = Record<string, BuildingWaypointLayout>;

// Bố cục mặc định cho B8 (không import scene)
// Tọa độ cửa và thang máy theo sơ đồ B8 chuẩn
const B8_ENTRANCE_SOUTH = b8ToWorld(52.8, -163.0);
const B8_ENTRANCE_NORTH = b8ToWorld(52.8, -213.0);
const B8_ELEVATOR = b8ToWorld(56.65, -188.35);
const B8_EXIT_SOUTH = b8ToWorld(52.8, -178.5);

// 406.B8: u 72.5..90.0, v -209.5..-200.7
const B8_EX = [0.97398, -0.22663] as const;
const B8_EV = [0.22663, 0.97398] as const;
function toB8Local(x: number, z: number): [number, number] {
  return [
    x * B8_EX[0] + z * B8_EX[1],
    x * B8_EV[0] + z * B8_EV[1],
  ];
}

export const DEFAULT_B8_LAYOUT: BuildingWaypointLayout = {
  buildingId: 'b8',
  entrances: [
    { x: B8_ENTRANCE_SOUTH[0], z: B8_ENTRANCE_SOUTH[1] },
    { x: B8_ENTRANCE_NORTH[0], z: B8_ENTRANCE_NORTH[1] },
  ],
  elevator: { x: B8_ELEVATOR[0], z: B8_ELEVATOR[1] },
  exitDoor: { x: B8_EXIT_SOUTH[0], z: B8_EXIT_SOUTH[1] },
  rooms: [
    {
      code: '406.B8',
      floor: 4,
      door: { x: 41.22, z: -213.29 },
      isInside: (x, z) => {
        const [u, v] = toB8Local(x, z);
        return u >= 72.0 && u <= 90.5 && v >= -210.0 && v <= -200.5;
      },
    },
  ],
};

export const DEFAULT_LAYOUTS: WaypointLayoutMap = {
  b8: DEFAULT_B8_LAYOUT,
};

function distanceSq(x1: number, z1: number, x2: number, z2: number): number {
  const dx = x2 - x1;
  const dz = z2 - z1;
  return dx * dx + dz * dz;
}

function findClosestPoint(
  fromX: number,
  fromZ: number,
  points: readonly { x: number; z: number }[],
): { x: number; z: number } | undefined {
  const first = points[0];
  if (!first) return undefined;
  let closest = first;
  let minDist = distanceSq(fromX, fromZ, first.x, first.z);
  for (let i = 1; i < points.length; i++) {
    const pt = points[i];
    if (!pt) continue;
    const d = distanceSq(fromX, fromZ, pt.x, pt.z);
    if (d < minDist) {
      minDist = d;
      closest = pt;
    }
  }
  return closest;
}

/**
 * Tính waypoint tiếp theo trên đường đến target.
 * Dùng tham số bố cục truyền vào, không import scene.
 *
 * @param pos Vị trí hiện tại của người chơi ({ x, z } hoặc [x, z])
 * @param interior Trạng thái nội thất hiện tại ({ buildingId, floor } hoặc null)
 * @param target Đích đến (WorldSpot)
 * @param layoutMap Bản đồ bố cục các tòa nhà (mặc định dùng DEFAULT_LAYOUTS)
 */
export function nextWaypoint(
  pos: { x: number; z: number } | Vec2,
  interior: { buildingId: string; floor: number } | null,
  target: WorldSpot,
  layoutMap: WaypointLayoutMap = DEFAULT_LAYOUTS,
): WaypointResult {
  const px = 'x' in pos ? pos.x : pos[0];
  const pz = 'z' in pos ? pos.z : pos[1];

  // 1. Target ở ngoài trời
  if (!target.buildingId) {
    if (interior) {
      // Đang ở trong tòa nhà → đi ra cửa thoát hiểm
      const currentLayout = layoutMap[interior.buildingId.toLowerCase()];
      const exit = currentLayout?.exitDoor ?? currentLayout?.entrances[0] ?? { x: px, z: pz };
      return { x: exit.x, z: exit.z, hint: 'door' };
    }
    return { x: target.x, z: target.z, hint: 'target' };
  }

  const targetBuildingId = target.buildingId.toLowerCase();
  const targetLayout = layoutMap[targetBuildingId];

  // 2. Người chơi ở ngoài trời và target ở trong tòa nhà
  if (!interior) {
    const entrances = targetLayout?.entrances ?? [];
    const closestEntrance = findClosestPoint(px, pz, entrances);
    if (closestEntrance) {
      return { x: closestEntrance.x, z: closestEntrance.z, hint: 'door' };
    }
    return { x: target.x, z: target.z, hint: 'door' };
  }

  // 3. Người chơi ở tòa nhà khác tòa nhà của target
  if (interior.buildingId.toLowerCase() !== targetBuildingId) {
    const currentLayout = layoutMap[interior.buildingId.toLowerCase()];
    const exit = currentLayout?.exitDoor ?? currentLayout?.entrances[0] ?? { x: px, z: pz };
    return { x: exit.x, z: exit.z, hint: 'door' };
  }

  // 4. Cùng tòa nhà nhưng sai tầng → thang máy
  const targetFloor = target.floor ?? 1;
  if (interior.floor !== targetFloor) {
    const elevator = targetLayout?.elevator ?? { x: px, z: pz };
    return {
      x: elevator.x,
      z: elevator.z,
      hint: 'elevator',
      floor: targetFloor,
    };
  }

  // 5. Cùng tòa nhà, đúng tầng → kiểm tra phòng và đích
  const rooms = targetLayout?.rooms ?? [];
  // Tìm phòng khớp tầng và chứa target (hoặc gần target)
  const room = rooms.find((r) => {
    if (r.floor !== targetFloor) return false;
    if (r.isInside) return r.isInside(target.x, target.z);
    if (r.bounds) {
      return target.x >= r.bounds.minX && target.x <= r.bounds.maxX
        && target.z >= r.bounds.minZ && target.z <= r.bounds.maxZ;
    }
    return distanceSq(target.x, target.z, r.door.x, r.door.z) < 15 * 15;
  });

  if (room) {
    // Kiểm tra người chơi đã ở trong phòng chưa
    const inRoom = room.isInside
      ? room.isInside(px, pz)
      : room.bounds
        ? px >= room.bounds.minX && px <= room.bounds.maxX && pz >= room.bounds.minZ && pz <= room.bounds.maxZ
        : distanceSq(px, pz, target.x, target.z) < 3.0 * 3.0;

    if (!inRoom) {
      return { x: room.door.x, z: room.door.z, hint: 'room' };
    }
  }

  // Đã trong phòng hoặc không có phòng riêng → tới target
  return { x: target.x, z: target.z, hint: 'target' };
}
