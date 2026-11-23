import type { Classroom } from '../types/lesson';
import type { Vec2 } from '../types';
import type { SeatAnchor, WorldSpot } from '../types/silverWorld';

export const B11_EX: readonly [number, number] = [0.985642036, -0.168848383];
export const B11_EV: readonly [number, number] = [0.168848383, 0.985642036];
export const B8_EX: readonly [number, number] = [0.97398, -0.22663];
export const B8_EV: readonly [number, number] = [0.22663, 0.97398];

export function b11ToWorld(u: number, v: number): Vec2 {
  return [
    u * B11_EX[0] + v * B11_EV[0],
    u * B11_EX[1] + v * B11_EV[1],
  ];
}

export function b8ToWorld(u: number, v: number): Vec2 {
  return [
    u * B8_EX[0] + v * B8_EV[0],
    u * B8_EX[1] + v * B8_EV[1],
  ];
}

export function frameToWorld(frame: 'b11' | 'b8', u: number, v: number): Vec2 {
  return frame === 'b8' ? b8ToWorld(u, v) : b11ToWorld(u, v);
}

function normalize(v: Vec2): Vec2 {
  const length = Math.hypot(v[0], v[1]);
  return length > 0 ? [v[0] / length, v[1] / length] : [1, 0];
}

export function isComputerLabRoom(room: Classroom): boolean {
  return room.code.startsWith('406') || room.name.toLowerCase().includes('thực hành');
}

/**
 * Tạo SeatAnchor từ Classroom.
 * Hướng nhìn f và vector phải r (thế giới):
 * - mắt = ghế − 0,65 f + 0,15 r, cao 1,55
 * - nhìn = tâm TV theo phương ngang, cao 1,35 (r lấy chiều +v khi f = +u, B11)
 * - máy (chỉ phòng máy): mắt = ghế + 0,20 f cao 1,08; nhìn = ghế + 0,65 f cao 1,05
 * - stand = standPoint (nếu thiếu: u = 91.8, v = -142.0)
 */
export function createSeatAnchor(
  room: Classroom,
  seatId?: string,
  toWorld?: (u: number, v: number) => Vec2,
): SeatAnchor {
  const toWorldFn = toWorld ?? ((u: number, v: number) => frameToWorld(room.frame, u, v));
  const targetSeatId = seatId ?? room.playerSeat;
  const seat = room.seats.find((s) => s.id === targetSeatId);
  if (!seat) {
    throw new Error(`Ghế ${targetSeatId} không tồn tại trong phòng ${room.code}`);
  }

  const [seatX, seatZ] = toWorldFn(seat.u, seat.v);
  const [du, dv] = room.studentFacing;
  const [targetX, targetZ] = toWorldFn(seat.u + du, seat.v + dv);
  const f = normalize([targetX - seatX, targetZ - seatZ]);
  // r lấy chiều +v khi f = +u (với f = [fx, fz], r = [-fz, fx])
  const r: Vec2 = [-f[1], f[0]];

  const spot: WorldSpot = {
    buildingId: room.buildingId,
    floor: room.floor,
    x: seatX,
    z: seatZ,
    facing: f,
  };

  // standPoint hoặc fallback (91.8, -142.0)
  const standLocal = room.standPoint ?? { u: 91.8, v: -142.0 };
  const [standX, standZ] = toWorldFn(standLocal.u, standLocal.v);
  const stand: WorldSpot = {
    buildingId: room.buildingId,
    floor: room.floor,
    x: standX,
    z: standZ,
    facing: f,
  };

  // Mắt = ghế - 0.65 f + 0.15 r, cao 1.55
  const eye: [number, number, number] = [
    seatX - 0.65 * f[0] + 0.15 * r[0],
    1.55,
    seatZ - 0.65 * f[1] + 0.15 * r[1],
  ];

  // Nhìn = tâm TV theo phương ngang, cao 1.35
  const tvPos: Vec2 = room.projectorScreen
    ? toWorldFn(room.projectorScreen.u, room.projectorScreen.v)
    : [seatX + 4 * f[0], seatZ + 4 * f[1]];
  const look: [number, number, number] = [tvPos[0], 1.35, tvPos[1]];

  // Camera màn hình máy tính (chỉ phòng máy)
  let screenCamera: SeatAnchor['screenCamera'] = null;
  if (isComputerLabRoom(room)) {
    screenCamera = {
      eye: [seatX + 0.20 * f[0], 1.08, seatZ + 0.20 * f[1]],
      look: [seatX + 0.65 * f[0], 1.05, seatZ + 0.65 * f[1]],
    };
  }

  return {
    id: targetSeatId,
    spot,
    stand,
    camera: { eye, look },
    screenCamera,
  };
}

// 208.B8 khai ghế tại seatAnchor (phòng phỏng vấn nói 1-1, tầng 2 B8)
// PLAN-3D: bàn (77.2; -205.1), giám khảo (76.4; -205.1) nhìn +u, người chơi (77.95; -205.1) nhìn -u,
// đứng dậy (78.6; -204.2), camera mắt (79.0; 1.55; -204.9) nhìn (76.4; 1.15; -205.1).
const [seat208X, seat208Z] = b8ToWorld(77.95, -205.1);
const [stand208X, stand208Z] = b8ToWorld(78.6, -204.2);
const [eye208X, eye208Z] = b8ToWorld(79.0, -204.9);
const [look208X, look208Z] = b8ToWorld(76.4, -205.1);
const facing208: Vec2 = normalize([look208X - seat208X, look208Z - seat208Z]);

export const SEAT_ANCHOR_208_B8: SeatAnchor = {
  id: '208-player',
  spot: {
    buildingId: 'b8',
    floor: 2,
    x: seat208X,
    z: seat208Z,
    facing: facing208,
  },
  stand: {
    buildingId: 'b8',
    floor: 2,
    x: stand208X,
    z: stand208Z,
    facing: facing208,
  },
  camera: {
    eye: [eye208X, 1.55, eye208Z],
    look: [look208X, 1.15, look208Z],
  },
  screenCamera: null,
};

export function resolveSeatAnchor(
  roomCode: string | null,
  getRoom: (code: string) => Classroom | undefined,
): SeatAnchor | null {
  if (!roomCode) return null;
  if (roomCode === '208.B8') return SEAT_ANCHOR_208_B8;
  const room = getRoom(roomCode);
  return room ? createSeatAnchor(room) : null;
}
