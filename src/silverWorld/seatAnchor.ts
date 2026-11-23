import type { Classroom } from '../types/lesson';
import type { Vec2 } from '../types';
import type { SeatAnchor, WorldSpot } from '../types/silverWorld';

function normalize(v: Vec2): Vec2 {
  const length = Math.hypot(v[0], v[1]);
  return length > 0 ? [v[0] / length, v[1] / length] : [1, 0];
}

const COMPUTER_LAB_CODES = new Set(['406.B11', '406.B8']);

export function isComputerLabRoom(room: Classroom): boolean {
  return COMPUTER_LAB_CODES.has(room.code) || room.name.includes('máy tính') || room.name.includes('thực hành');
}

/**
 * Tạo SeatAnchor từ Classroom.
 * Bố cục và toWorld nhận từ nơi gọi (không chép cứng EX/EV hay toWorld trong module).
 *
 * Hướng nhìn f và vector phải r (thế giới):
 * - mắt = ghế − 0,65 f + 0,15 r, cao 1,55
 * - nhìn = tâm TV theo phương ngang, cao 1,35 (r lấy chiều +v khi f = +u, B11)
 * - máy (chỉ phòng máy): mắt = ghế + 0,20 f cao 1,08; nhìn = ghế + 0,65 f cao 1,05
 * - stand = standPoint (chỉ fallback 91.8, -142.0 cho 406.B11; phòng khác thiếu thì ném lỗi rõ)
 */
export function createSeatAnchor(
  room: Classroom,
  toWorld: (u: number, v: number) => Vec2,
  seatId?: string,
): SeatAnchor {
  const targetSeatId = seatId ?? room.playerSeat;
  const seat = room.seats.find((s) => s.id === targetSeatId);
  if (!seat) {
    throw new Error(`Ghế ${targetSeatId} không tồn tại trong phòng ${room.code}`);
  }

  // Điểm đứng: 406.B11 có fallback, các phòng khác bắt buộc có standPoint
  let standLocal = room.standPoint;
  if (!standLocal) {
    if (room.code === '406.B11') {
      standLocal = { u: 91.8, v: -142.0 };
    } else {
      throw new Error(`Phòng ${room.code} thiếu standPoint trong dữ liệu`);
    }
  }

  const [seatX, seatZ] = toWorld(seat.u, seat.v);
  const [du, dv] = room.studentFacing;
  const [targetX, targetZ] = toWorld(seat.u + du, seat.v + dv);
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

  const [standX, standZ] = toWorld(standLocal.u, standLocal.v);
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
    ? toWorld(room.projectorScreen.u, room.projectorScreen.v)
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

/**
 * 208.B8 khai ghế tại seatAnchor (phòng phỏng vấn nói 1-1, tầng 2 B8).
 * Tọa độ địa phương B8 từ PLAN-3D mục 3:
 * - bàn (77.2; -205.1), giám khảo (76.4; -205.1) nhìn +u, người chơi (77.95; -205.1) nhìn -u
 * - đứng dậy (78.6; -204.2), camera mắt (79.0; 1.55; -204.9) nhìn (76.4; 1.15; -205.1)
 *
 * toWorld nhận từ nơi gọi (toWorld của B8), không chép cứng trong module.
 */
export function create208B8SeatAnchor(toWorld: (u: number, v: number) => Vec2): SeatAnchor {
  const [seatX, seatZ] = toWorld(77.95, -205.1);
  const [standX, standZ] = toWorld(78.6, -204.2);
  const [eyeX, eyeZ] = toWorld(79.0, -204.9);
  const [lookX, lookZ] = toWorld(76.4, -205.1);
  const facing: Vec2 = normalize([lookX - seatX, lookZ - seatZ]);

  return {
    id: '208-player',
    spot: {
      buildingId: 'b8',
      floor: 2,
      x: seatX,
      z: seatZ,
      facing,
    },
    stand: {
      buildingId: 'b8',
      floor: 2,
      x: standX,
      z: standZ,
      facing,
    },
    camera: {
      eye: [eyeX, 1.55, eyeZ],
      look: [lookX, 1.15, lookZ],
    },
    screenCamera: null,
  };
}

export function resolveSeatAnchor(
  roomCode: string | null,
  getRoom: (code: string) => Classroom | undefined,
  toWorld: (frame: 'b11' | 'b8', u: number, v: number) => Vec2,
): SeatAnchor | null {
  if (!roomCode) return null;
  if (roomCode === '208.B8') {
    return create208B8SeatAnchor((u, v) => toWorld('b8', u, v));
  }
  const room = getRoom(roomCode);
  if (!room) return null;
  return createSeatAnchor(room, (u, v) => toWorld(room.frame, u, v));
}
