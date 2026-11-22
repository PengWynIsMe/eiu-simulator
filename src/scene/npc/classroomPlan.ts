import { getClassroom } from '../../data';
import { b11ToWorld } from '../interior/layouts/b11';
import { localDirToYaw } from './sitPose';

/** Khoảng lùi (m) từ ghế ra khe sau lưng ghế (khe giữa lưng ghế hàng này và bàn hàng sau, rộng ~0.6 m). */
const BACK_OFFSET_U = 0.5;
const RAISE_COUNT_FRACTIONS = [0.25, 0.7];
const CHEER_COUNT = 3;

const at = (a: ArrayLike<number>, i: number): number => a[i] ?? 0;

export interface StudentSpec {
  index: number;
  seatId: string;
  /** Vị trí ngồi / chỗ đứng sau ghế (thế giới). */
  seatX: number;
  seatZ: number;
  backX: number;
  backZ: number;
  yaw: number;
  /** Đường đi từ chỗ đứng ra cửa (thế giới): x0,z0,x1,z1,... + độ dài cộng dồn. */
  path: Float64Array;
  cum: Float64Array;
  total: number;
  /** Thứ tự ra khỏi lớp (0 = đi trước, đường ngắn nhất). */
  exitRank: number;
  raiser: boolean;
  cheerer: boolean;
}

export function buildClassroomPlan(): StudentSpec[] {
  const room = getClassroom('406.B11');
  if (!room) return [];
  const yaw = localDirToYaw(room.studentFacing[0], room.studentFacing[1]);
  const aisleV = (room.aisle.minV + room.aisle.maxV) / 2;
  const player = room.seats.find((s) => s.id === room.playerSeat);

  const students: StudentSpec[] = room.npcSeats.map((id, index) => {
    const seat = room.seats.find((s) => s.id === id);
    if (!seat) throw new Error(`Không thấy ghế ${id}`);
    const uv: number[] = [
      seat.u + BACK_OFFSET_U, seat.v,
      seat.u + BACK_OFFSET_U, aisleV,
      room.door.u, aisleV,
      room.door.u, room.door.v,
    ];
    const path = new Float64Array(uv.length);
    for (let i = 0; i < uv.length; i += 2) {
      const [x, z] = b11ToWorld(at(uv, i), at(uv, i + 1));
      path[i] = x;
      path[i + 1] = z;
    }
    const cum = new Float64Array(path.length / 2);
    for (let i = 1; i < cum.length; i++) {
      cum[i] = at(cum, i - 1) + Math.hypot(at(path, i * 2) - at(path, i * 2 - 2), at(path, i * 2 + 1) - at(path, i * 2 - 1));
    }
    const [seatX, seatZ] = b11ToWorld(seat.u, seat.v);
    return {
      index, seatId: id, seatX, seatZ, backX: at(path, 0), backZ: at(path, 1), yaw,
      path, cum, total: at(cum, cum.length - 1), exitRank: 0, raiser: false, cheerer: false,
    };
  });

  [...students].sort((a, b) => a.total - b.total).forEach((s, rank) => { s.exitRank = rank; });
  // 2 bạn giơ tay cố định, rải trong danh sách ghế.
  for (const f of RAISE_COUNT_FRACTIONS) {
    const s = students[Math.floor(students.length * f)];
    if (s) s.raiser = true;
  }
  // 3 bạn gần ghế người chơi nhất (không trùng người giơ tay) hoan hô khi làm đúng.
  if (player) {
    const dist = (s: StudentSpec) => {
      const seat = room.seats.find((q) => q.id === s.seatId);
      return seat ? Math.hypot(seat.u - player.u, seat.v - player.v) : Infinity;
    };
    students
      .filter((s) => !s.raiser)
      .sort((a, b) => dist(a) - dist(b))
      .slice(0, CHEER_COUNT)
      .forEach((s) => { s.cheerer = true; });
  }
  return students;
}

export interface PathSample {
  x: number;
  z: number;
  yaw: number;
}

/** Ghi điểm trên đường đi tại quãng `s` (m) và hướng đi (rad, model nhìn +Z) vào `out` — không cấp phát. */
export function samplePath(spec: StudentSpec, s: number, out: PathSample): void {
  const { cum, path } = spec;
  const last = cum.length - 1;
  const d = Math.min(Math.max(s, 0), spec.total);
  let i = 1;
  while (i < last && at(cum, i) < d) i++;
  const seg = at(cum, i) - at(cum, i - 1) || 1;
  const k = (d - at(cum, i - 1)) / seg;
  const x0 = at(path, i * 2 - 2);
  const z0 = at(path, i * 2 - 1);
  const dx = at(path, i * 2) - x0;
  const dz = at(path, i * 2 + 1) - z0;
  out.x = x0 + dx * k;
  out.z = z0 + dz * k;
  out.yaw = Math.atan2(dx, dz);
}
