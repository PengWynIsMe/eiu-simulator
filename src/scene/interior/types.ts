import type { Vec2 } from '../../types';

export interface WallSegment {
  u1: number;
  v1: number;
  u2: number;
  v2: number;
  thickness: number;
  isGlass?: boolean;
  isRailing?: boolean;
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
  buildingId?: string;
  targetFloor?: number;
  /** Vị trí xuất hiện khi bước qua điểm này (tọa độ thế giới) */
  spawnPosWorld?: Vec2;
  spawnYaw?: number;
}

export interface ExteriorEntrance {
  id: string;
  buildingId: string;
  worldPos: Vec2;
  radius: number;
  label: string;
  /** Vị trí xuất hiện bên trong khi vào từ cửa này */
  spawnInsideWorld: Vec2;
  spawnInsideYaw: number;
  /** Vị trí xuất hiện bên ngoài khi đi ra từ cửa này */
  spawnOutsideWorld: Vec2;
  spawnOutsideYaw: number;
}

export interface InteriorLayout {
  buildingId: string;
  name: string;
  origin: Vec2;
  rotationY: number;
  floors: number;
  toWorld: (u: number, v: number) => Vec2;
  toLocal: (x: number, z: number) => [number, number];
  getFloorWalls: (floor: number) => readonly WallSegment[];
  getFloorRooms: (floor: number) => readonly RoomArea[];
  getFloorBoundaryPts: (floor: number) => Vec2[];
  getFloorHoles?: (floor: number) => Vec2[][];
  getStairHeight?: (u: number, v: number) => number | null;
  resolvePosition: (
    nextX: number,
    nextZ: number,
    prevX: number,
    prevZ: number,
    floor: number,
    radius?: number
  ) => Vec2;
  getActiveRoom: (worldX: number, worldZ: number, floor: number) => RoomArea | null;
  getNearInteractive: (
    worldX: number,
    worldZ: number,
    floor: number | null
  ) => InteractivePoint | null;
  elevator: {
    posLocal: [number, number];
    spawnLocal: [number, number];
    posWorld: Vec2;
    spawnWorld: Vec2;
    facingYaw: number;
  };
  exteriorEntrances: readonly ExteriorEntrance[];
  defaultInsideEntrance: Vec2;
  defaultOutsideEntrance: Vec2;
}
