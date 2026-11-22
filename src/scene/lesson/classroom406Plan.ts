import { BoxGeometry, BufferGeometry, CylinderGeometry, Matrix4, PlaneGeometry, Quaternion, Vector3 } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Classroom } from '../../types';

/**
 * Bảng dựng phòng 406.B11 — thuần dữ liệu (ma trận + hình), không React, để cả component lẫn script đếm dùng chung.
 * Khung toạ độ: x = u, z = v, y = cao từ sàn tầng (sàn tầng đang đứng có y = 0). Component bọc trong group xoay B11_ROTATION_Y.
 */

export const CEILING_Y = 3.8; // = FLOOR_HEIGHT; không import data ở đây để script Node nhẹ

const _p = new Vector3();
const _q = new Quaternion();
const _s = new Vector3();

function place(x: number, y: number, z: number, sx = 1, sy = 1, sz = 1): Matrix4 {
  return new Matrix4().compose(_p.set(x, y, z), _q.identity(), _s.set(sx, sy, sz));
}

/** Hộp (w theo u, h theo y, d theo v) dời tới (x, y, z) trong hệ của chi tiết. */
function part(w: number, h: number, d: number, x: number, y: number, z: number, rotY = 0): BufferGeometry {
  const g = new BoxGeometry(w, h, d);
  if (rotY !== 0) g.rotateY(rotY);
  g.translate(x, y, z);
  return g;
}

function merge(parts: BufferGeometry[]): BufferGeometry {
  const merged = BufferGeometryUtils.mergeGeometries(parts);
  for (const p of parts) p.dispose();
  if (!merged) throw new Error('Không gộp được hình phòng 406');
  return merged;
}

/** Bàn SV: mặt + 2 tấm hông. Gốc = tâm bàn trên sàn. */
export function makeDeskGeometry(room: Classroom): BufferGeometry {
  const { depth, width, height } = room.desk;
  const panel = height - 0.04;
  return merge([
    part(depth, 0.04, width, 0, height - 0.02, 0),
    part(depth - 0.1, panel, 0.03, 0, panel / 2, width / 2 - 0.03),
    part(depth - 0.1, panel, 0.03, 0, panel / 2, -(width / 2 - 0.03)),
  ]);
}

/** Ghế xoay: mặt ngồi, lưng tựa phía +u (SV quay lưng về +u), trụ, chân sao. Gốc = tâm ghế trên sàn. */
export function makeChairGeometry(room: Classroom): BufferGeometry {
  const h = room.chairSeatHeight;
  const post = new CylinderGeometry(0.025, 0.025, h - 0.08, 8);
  post.translate(0, (h - 0.08) / 2 + 0.03, 0);
  return merge([
    part(0.45, 0.06, 0.45, 0, h - 0.03, 0),
    part(0.05, 0.5, 0.45, 0.2, h + 0.27, 0),
    post,
    part(0.32, 0.03, 0.05, 0, 0.03, 0, 0),
    part(0.32, 0.03, 0.05, 0, 0.03, 0, Math.PI / 3),
    part(0.32, 0.03, 0.05, 0, 0.03, 0, -Math.PI / 3),
  ]);
}

/** Thân màn hình 0.55 × 0.34 × 0.03 + cổ + đế. Gốc = điểm trên mặt bàn, mặt màn quay +u. */
export function makeMonitorGeometry(): BufferGeometry {
  return merge([part(0.14, 0.015, 0.24, 0, 0.0075, 0), part(0.03, 0.1, 0.05, 0, 0.065, 0), part(0.03, 0.34, 0.55, 0, 0.285, 0)]);
}

/** Mặt sáng màn hình 0.5 × 0.3, đứng sát mặt trước thân màn (+u). */
export function makeScreenFaceGeometry(): BufferGeometry {
  const g = new PlaneGeometry(0.5, 0.3);
  g.rotateY(Math.PI / 2); // pháp tuyến +z → +x (= +u)
  g.translate(0.0165, 0.285, 0);
  return g;
}

/** Bàn phím 0.44 × 0.14 × 0.02 (dài theo v) + chuột 0.06 × 0.1. Gốc = điểm trên mặt bàn. */
export function makeKeyboardGeometry(): BufferGeometry {
  return merge([part(0.14, 0.02, 0.44, 0, 0.01, 0), part(0.1, 0.02, 0.06, 0, 0.01, 0.32)]);
}

/** Case máy 0.2 (v) × 0.42 (cao) × 0.45 (u). Gốc = tâm đáy trên sàn. */
export function makeCaseGeometry(): BufferGeometry {
  return part(0.45, 0.42, 0.2, 0, 0.21, 0);
}

export interface MiscBox {
  matrix: Matrix4;
  color: string;
}

export interface Classroom406Plan {
  desks: Matrix4[];
  chairs: Matrix4[];
  monitors: Matrix4[];
  faces: Matrix4[];
  /** Mức sáng từng màn (ghế người chơi sáng hơn). */
  faceBrightness: number[];
  keyboards: Matrix4[];
  cases: Matrix4[];
  lights: Matrix4[];
  misc: MiscBox[];
}

const WOOD = '#c8a67a';

export function buildClassroom406Plan(room: Classroom): Classroom406Plan {
  const { desk } = room;
  const desks: Matrix4[] = [];
  const chairs: Matrix4[] = [];
  const monitors: Matrix4[] = [];
  const faces: Matrix4[] = [];
  const faceBrightness: number[] = [];
  const keyboards: Matrix4[] = [];
  const cases: Matrix4[] = [];

  for (const seat of room.seats) {
    desks.push(place(seat.deskU, 0, seat.v));
    chairs.push(place(seat.u, 0, seat.v));
    monitors.push(place(seat.deskU - 0.18, desk.height, seat.v));
    faces.push(place(seat.deskU - 0.18, desk.height, seat.v));
    faceBrightness.push(seat.id === room.playerSeat ? 1 : 0.5);
    keyboards.push(place(seat.deskU + 0.08, desk.height, seat.v));
    cases.push(place(seat.deskU - 0.05, 0, seat.v + 0.3));
  }

  const lights = room.ceilingLights.map((l) => place(l.u, CEILING_Y - 0.03, l.v, 0.6, 0.04, 1.2));

  const misc: MiscBox[] = [];
  const box = (u: number, y: number, v: number, sx: number, sy: number, sz: number, color: string) =>
    misc.push({ matrix: place(u, y, v, sx, sy, sz), color });

  // Bàn giáo viên (người dùng mặt về +u): mặt bàn + 2 tấm hông + tấm chắn gối phía −u, màn hình quay −u về chỗ ngồi.
  const t = room.teacherDesk;
  const tPanel = t.height - 0.04;
  box(t.u, t.height - 0.02, t.v, t.depth, 0.04, t.width, WOOD);
  box(t.u, tPanel / 2, t.v + t.width / 2 - 0.03, t.depth - 0.1, tPanel, 0.03, WOOD);
  box(t.u, tPanel / 2, t.v - t.width / 2 + 0.03, t.depth - 0.1, tPanel, 0.03, WOOD);
  box(t.u + t.depth / 2 - 0.03, 0.4, t.v, 0.03, 0.6, t.width - 0.1, WOOD);
  box(t.u + 0.12, t.height + 0.285, t.v, 0.03, 0.34, 0.55, '#111827');
  box(t.u + 0.12, t.height + 0.015, t.v, 0.14, 0.03, 0.2, '#111827');
  box(t.u + 0.105, t.height + 0.285, t.v, 0.01, 0.3, 0.5, '#1e3a8a'); // mặt màn (hướng −u)
  box(t.u - 0.1, t.height + 0.01, t.v, 0.14, 0.02, 0.44, '#1f2937');

  // Bảng trắng: khung + mặt + máng bút (mặt nhìn +u, áp tường Tây).
  const w = room.whiteboard;
  const wy = w.bottom + w.height / 2;
  box(w.u - 0.015, wy, w.v, 0.03, w.height + 0.08, w.width + 0.08, '#94a3b8');
  box(w.u, wy, w.v, 0.04, w.height, w.width, '#f8fafc');
  box(w.u + 0.05, w.bottom - 0.02, w.v, 0.1, 0.03, 0.9, '#94a3b8');

  // Hộp cuộn màn chiếu phía trên màn (màn là ProjectorScreen).
  const s = room.projectorScreen;
  box(s.u + 0.05, s.bottom + s.height + 0.05, s.v, 0.1, 0.1, s.width + 0.1, '#e5e7eb');

  // Máy chiếu + thanh treo.
  const p = room.projector;
  box(p.u, p.y, p.v, p.size[0], p.size[1], p.size[2], '#e5e7eb');
  const rod = CEILING_Y - (p.y + p.size[1] / 2);
  box(p.u, p.y + p.size[1] / 2 + rod / 2, p.v, 0.05, rod, 0.05, '#9ca3af');

  // Điều hòa treo tường Bắc.
  for (const ac of room.airConditioners) box(ac.u, ac.y, ac.v, 0.9, 0.3, 0.22, '#f1f5f9');

  return { desks, chairs, monitors, faces, faceBrightness, keyboards, cases, lights, misc };
}

/** Số draw call ước tính = số instancedMesh không rỗng (mỗi loại 1 mesh). */
export function countDrawCalls(plan: Classroom406Plan): number {
  const groups = [plan.desks, plan.chairs, plan.monitors, plan.faces, plan.keyboards, plan.cases, plan.lights, plan.misc];
  return groups.filter((g) => g.length > 0).length;
}
