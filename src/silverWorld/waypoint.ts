import type { Classroom } from '../types/lesson';
import type { Vec2 } from '../types';
import type { WorldSpot } from '../types/silverWorld';

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
  /** Kiểm tra xem điểm (x, z) thế giới đã nằm trong phòng hay chưa */
  isInside: (x: number, z: number) => boolean;
}

export interface BuildingWaypointLayout {
  buildingId: string;
  /** Các cửa vào ngoài trời dẫn vào tòa */
  entrances: readonly { x: number; z: number }[];
  /** Vị trí thang máy trên các tầng */
  elevator: { x: number; z: number };
  /** Các cửa thoát hiểm/ra ngoài khi đang ở trong tòa */
  exitDoors?: readonly { x: number; z: number }[];
  /** Danh sách các phòng trong tòa */
  rooms?: readonly RoomWaypointSpec[];
}

export type WaypointLayoutMap = Record<string, BuildingWaypointLayout>;

/**
 * Dựng RoomWaypointSpec từ Classroom và hàm đổi tọa độ toLocal của tòa nhà.
 * Cửa phòng lấy chính xác từ room.doorWorld, khung phòng theo room.bounds.
 */
export function createRoomWaypoint(
  room: Classroom,
  toLocal: (x: number, z: number) => [number, number],
): RoomWaypointSpec {
  const { minU, maxU, minV, maxV } = room.bounds;
  return {
    code: room.code,
    floor: room.floor,
    door: { x: room.doorWorld[0], z: room.doorWorld[1] },
    isInside: (x: number, z: number) => {
      const [u, v] = toLocal(x, z);
      return u >= minU && u <= maxU && v >= minV && v <= maxV;
    },
  };
}

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
 * Nhận bố cục tòa nhà từ nơi gọi, không import scene.
 *
 * @param pos Vị trí hiện tại ({ x, z } hoặc [x, z])
 * @param interior Trạng thái nội thất ({ buildingId, floor } hoặc null)
 * @param target Điểm đích (WorldSpot)
 * @param layoutMap Bố cục các tòa nhà do caller truyền vào
 */
export function nextWaypoint(
  pos: { x: number; z: number } | Vec2,
  interior: { buildingId: string; floor: number } | null,
  target: WorldSpot,
  layoutMap: WaypointLayoutMap,
): WaypointResult {
  const px = 'x' in pos ? pos.x : pos[0];
  const pz = 'z' in pos ? pos.z : pos[1];

  // 1. Target ở ngoài trời
  if (!target.buildingId) {
    if (interior) {
      const currentLayout = layoutMap[interior.buildingId.toLowerCase()];
      const exits = currentLayout?.exitDoors && currentLayout.exitDoors.length > 0
        ? currentLayout.exitDoors
        : currentLayout?.entrances ?? [];
      const exit = findClosestPoint(px, pz, exits) ?? { x: px, z: pz };
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

  // 3. Người chơi ở tòa nhà khác tòa nhà của target -> chọn cửa ra gần nhất
  if (interior.buildingId.toLowerCase() !== targetBuildingId) {
    const currentLayout = layoutMap[interior.buildingId.toLowerCase()];
    const exits = currentLayout?.exitDoors && currentLayout.exitDoors.length > 0
      ? currentLayout.exitDoors
      : currentLayout?.entrances ?? [];
    const exit = findClosestPoint(px, pz, exits) ?? { x: px, z: pz };
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
  const room = rooms.find((r) => r.floor === targetFloor && r.isInside(target.x, target.z));

  if (room) {
    // Nếu người chơi chưa vào trong phòng (đang ở hành lang hoặc phòng khác)
    if (!room.isInside(px, pz)) {
      return { x: room.door.x, z: room.door.z, hint: 'room' };
    }
  }

  // Đã trong phòng hoặc không thuộc phòng riêng nào → tới target
  return { x: target.x, z: target.z, hint: 'target' };
}
