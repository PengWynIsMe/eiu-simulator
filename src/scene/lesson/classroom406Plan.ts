import { BoxGeometry, BufferGeometry, CylinderGeometry, Matrix4, PlaneGeometry, Quaternion, Vector3 } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Classroom } from '../../types';

/**
 * Bảng dựng phòng 406.B11 theo ảnh thật EIU phong-may-1 & phong-may-2.
 * Khung toạ độ: x = u, z = v, y = cao từ sàn tầng (sàn tầng 4 có y = 0).
 * Sinh viên quay mặt về hướng Đông (+u), nhìn về phía TV và 2 bảng trắng ở tường Đông (u ≈ 96.45).
 * Cửa sổ phía Bắc (v = -148.1) bên tay trái sinh viên dán các poster thương hiệu EIU.
 */

export const CEILING_Y = 3.8;

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

/** Bàn SV: Mặt gỗ sáng màu (0.6 dọc u × 1.0 dọc v × 0.035 dày), 2 chân khung kim loại sáng hai bên, tấm chắn gối phía trước (+u). */
export function makeDeskGeometry(room: Classroom): BufferGeometry {
  const { depth, width, height } = room.desk;
  const topThick = 0.035;
  const legH = height - topThick;
  return merge([
    // Mặt bàn gỗ sáng
    part(depth, topThick, width, 0, height - topThick / 2, 0),
    // 2 chân khung kim loại dạng tấm chữ nhật mảnh 2 đầu bàn
    part(depth - 0.08, legH, 0.03, 0, legH / 2, width / 2 - 0.03),
    part(depth - 0.08, legH, 0.03, 0, legH / 2, -(width / 2 - 0.03)),
    // Thanh giằng chân bàn
    part(0.04, 0.04, width - 0.08, 0, 0.08, 0),
    // Tấm chắn gối phía trước (+u, hướng về phía bảng)
    part(0.02, 0.35, width - 0.08, depth / 2 - 0.03, height - topThick - 0.35 / 2, 0),
  ]);
}

/**
 * Ghế SV theo ảnh thật: Ghế gỗ sáng uốn cong, khung 4 chân kim loại mảnh sáng, KHÔNG bánh xe.
 * SV ngồi mặt hướng về +u nên mặt ngồi ở giữa, tựa lưng ở phía -u.
 */
export function makeChairGeometry(room: Classroom): BufferGeometry {
  const h = room.chairSeatHeight; // 0.45 m
  const seatThick = 0.025;

  // 4 chân kim loại mảnh
  const legR = 0.012;
  const legH = h - seatThick;
  const makeLeg = (x: number, z: number) => {
    const leg = new CylinderGeometry(legR, legR, legH, 8);
    leg.translate(x, legH / 2, z);
    return leg;
  };

  // 2 thanh đỡ lưng nối từ 2 chân sau lên tựa lưng
  const backPostH = 0.38;
  const makeBackPost = (x: number, z: number) => {
    const p = new CylinderGeometry(legR, legR, backPostH, 8);
    p.translate(x, h + backPostH / 2 - 0.04, z);
    return p;
  };

  return merge([
    // Mặt ngồi gỗ sáng (bo góc nhẹ)
    part(0.42, seatThick, 0.42, 0, h - seatThick / 2, 0),
    // Tựa lưng gỗ sáng (ở phía -u, ngang tầm lưng)
    part(0.025, 0.26, 0.40, -0.19, h + 0.28, 0),
    // 4 chân kim loại
    makeLeg(0.16, 0.16),
    makeLeg(0.16, -0.16),
    makeLeg(-0.16, 0.16),
    makeLeg(-0.16, -0.16),
    // 2 ống kim loại đỡ lưng
    makeBackPost(-0.18, 0.14),
    makeBackPost(-0.18, -0.14),
  ]);
}

/** Thân màn hình Dell đen 0.55 × 0.34 × 0.03 + cổ đứng + chân đế phẳng. Mặt màn hình quay về phía -u (về phía SV). */
export function makeMonitorGeometry(): BufferGeometry {
  return merge([
    // Chân đế phẳng hình chữ nhật
    part(0.16, 0.012, 0.22, 0, 0.006, 0),
    // Trụ đỡ màn hình đứng
    part(0.03, 0.18, 0.05, 0, 0.09, 0),
    // Khung màn hình Dell viền mỏng (mặt quay -u)
    part(0.03, 0.34, 0.55, 0, 0.285, 0),
  ]);
}

/** Mặt sáng màn hình 0.5 × 0.3, đứng sát mặt trước thân màn (quay về phía -u). */
export function makeScreenFaceGeometry(): BufferGeometry {
  const g = new PlaneGeometry(0.5, 0.3);
  g.rotateY(-Math.PI / 2); // pháp tuyến +z → -x (= -u)
  g.translate(-0.0165, 0.285, 0);
  return g;
}

/** Bàn phím 0.44 × 0.14 × 0.02 (dài theo v) + chuột quang 0.06 × 0.1. Gốc = điểm trên mặt bàn. */
export function makeKeyboardGeometry(): BufferGeometry {
  return merge([
    part(0.14, 0.015, 0.44, 0, 0.0075, 0),
    part(0.10, 0.02, 0.06, 0, 0.01, 0.30),
  ]);
}

/** Case máy Dell Precision đen: Đặt TRÊN BÀN. Kích thước 0.38 (u) × 0.38 (cao) × 0.18 (v). Gốc = tâm đáy trên mặt bàn. */
export function makeCaseGeometry(): BufferGeometry {
  return merge([
    // Thân thùng máy kim loại đen
    part(0.38, 0.38, 0.18, 0, 0.19, 0),
    // Mặt trước có lưới tản nhiệt Dell đặc trưng
    part(0.01, 0.36, 0.16, -0.19, 0.19, 0),
  ]);
}

/** Đèn LED treo thả: Thanh nhôm dài 2.2 m dọc v × 0.12 m ngang u × 0.08 m cao, kèm 2 dây cáp treo từ trần xuống y = 3.15 m. */
export function makePendantLightGeometry(): BufferGeometry {
  const dropLen = CEILING_Y - 3.15; // ~0.65 m
  const wireR = 0.004;

  const wire1 = new CylinderGeometry(wireR, wireR, dropLen, 6);
  wire1.translate(0, dropLen / 2 + 0.04, 0.7);

  const wire2 = new CylinderGeometry(wireR, wireR, dropLen, 6);
  wire2.translate(0, dropLen / 2 + 0.04, -0.7);

  return merge([
    // Máng đèn hợp kim đen
    part(0.12, 0.08, 2.2, 0, 0, 0),
    // Dải phát sáng ở đáy
    part(0.10, 0.01, 2.16, 0, -0.04, 0),
    wire1,
    wire2,
  ]);
}

/** 7 poster thương hiệu EIU trên các ô kính cửa sổ phía Bắc. */
export function makePostersGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const startU = 88.2;
  const stepU = 1.15;
  const pw = 0.95;
  const ph = 0.85;
  const y = 3.05;
  const v = -147.86;

  for (let i = 0; i < 7; i++) {
    const plane = new PlaneGeometry(pw, ph);
    plane.translate(startU + i * stepU, y, v);
    const uvs = plane.attributes.uv;
    if (uvs) {
      const u0 = i / 7;
      const u1 = (i + 1) / 7;
      for (let j = 0; j < uvs.count; j++) {
        const origU = uvs.getX(j);
        uvs.setX(j, u0 + origU * (u1 - u0));
      }
    }
    parts.push(plane);
  }
  return merge(parts);
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
  faceBrightness: number[];
  keyboards: Matrix4[];
  cases: Matrix4[];
  lights: Matrix4[];
  misc: MiscBox[];
}

const WOOD_LIGHT = '#edd9bf';
const METAL_FRAME = '#cbd5e1';
const BEAM_BLACK = '#18181b';
const WHITEBOARD_SURFACE = '#ffffff';
const TV_FRAME = '#0f172a';
const AC_WHITE = '#f8fafc';
const CONCRETE_LIGHT_GRAY = '#abaaa5'; // trong khoảng #9a9a96–#b5b4ae

export function buildClassroom406Plan(room: Classroom): Classroom406Plan {
  const { desk } = room;
  const desks: Matrix4[] = [];
  const chairs: Matrix4[] = [];
  const monitors: Matrix4[] = [];
  const faces: Matrix4[] = [];
  const faceBrightness: number[] = [];
  const keyboards: Matrix4[] = [];
  const cases: Matrix4[] = [];

  for (let i = 0; i < room.seats.length; i++) {
    const seat = room.seats[i];
    if (!seat) continue;
    desks.push(place(seat.deskU, 0, seat.v));
    chairs.push(place(seat.u, 0, seat.v));

    // Màn hình Dell đặt mép bàn phía trước (+u), mặt quay về phía ghế (-u)
    monitors.push(place(seat.deskU + 0.15, desk.height, seat.v));
    faces.push(place(seat.deskU + 0.15, desk.height, seat.v));
    faceBrightness.push(seat.id === room.playerSeat ? 1 : 0.55);

    // Bàn phím + chuột đặt phía trước màn hình (gần người ngồi)
    keyboards.push(place(seat.deskU - 0.08, desk.height, seat.v));

    // Thùng máy Dell Precision đặt TRÊN BÀN:
    // Theo ảnh: thường 2 thùng đứng sát nhau giữa 2 vị trí ngồi.
    // Dãy 5 chỗ: chỗ 0 & 1 ghép cặp, chỗ 2 & 3 ghép cặp, chỗ 4 ở mép ngoài.
    const seatInRow = i % 10;
    const blockIdx = seatInRow < 5 ? seatInRow : seatInRow - 5;
    let caseVOffset = 0.38;
    if (blockIdx === 0 || blockIdx === 2) {
      caseVOffset = 0.38; // lệch sang phải
    } else if (blockIdx === 1 || blockIdx === 3) {
      caseVOffset = -0.38; // lệch sang trái -> sát thùng của bạn bên cạnh
    } else {
      caseVOffset = 0.38;
    }
    cases.push(place(seat.deskU + 0.06, desk.height, seat.v + caseVOffset));
  }

  // Đèn LED treo thả tại y = 3.15 m
  const lights = room.ceilingLights.map((l) => place(l.u, 3.15, l.v));

  const misc: MiscBox[] = [];
  const box = (u: number, y: number, v: number, sx: number, sy: number, sz: number, color: string) =>
    misc.push({ matrix: place(u, y, v, sx, sy, sz), color });

  // 1. Tường trước (Tường Đông, u ≈ 96.45):
  // TV lớn chính giữa (hiển thị slide từ ProjectorScreen) + khung viền TV đen
  const s = room.projectorScreen;
  box(s.u + 0.02, s.bottom + s.height / 2, s.v, 0.04, s.height + 0.08, s.width + 0.08, TV_FRAME);

  // 2 Bảng trắng hai bên TV (Left Whiteboard & Right Whiteboard)
  const wbLeft = { u: 96.45, v: -144.8, width: 2.8, height: 1.2, bottom: 1.1 };
  const wbRight = { u: 96.45, v: -139.2, width: 2.8, height: 1.2, bottom: 1.1 };

  for (const wb of [wbLeft, wbRight]) {
    const wby = wb.bottom + wb.height / 2;
    // Khung nhôm mảnh
    box(wb.u + 0.015, wby, wb.v, 0.02, wb.height + 0.04, wb.width + 0.04, METAL_FRAME);
    // Mặt bảng trắng tinh khiết
    box(wb.u, wby, wb.v, 0.015, wb.height, wb.width, WHITEBOARD_SURFACE);
    // Máng đựng bút / khăn lau ở đáy bảng
    box(wb.u - 0.03, wb.bottom - 0.015, wb.v, 0.06, 0.02, wb.width - 0.1, METAL_FRAME);
  }

  // 2. Bàn giáo viên (đặt tại tường trước, phía Nam của TV, mặt quay về phía -u)
  const t = room.teacherDesk;
  const tPanel = t.height - 0.04;
  box(t.u, t.height - 0.02, t.v, t.depth, 0.04, t.width, WOOD_LIGHT);
  box(t.u, tPanel / 2, t.v + t.width / 2 - 0.03, t.depth - 0.1, tPanel, 0.03, METAL_FRAME);
  box(t.u, tPanel / 2, t.v - t.width / 2 + 0.03, t.depth - 0.1, tPanel, 0.03, METAL_FRAME);
  box(t.u + t.depth / 2 - 0.03, 0.4, t.v, 0.03, 0.6, t.width - 0.1, WOOD_LIGHT);
  // Màn hình GV (quay mặt -u về phía thầy)
  box(t.u - 0.10, t.height + 0.285, t.v, 0.03, 0.34, 0.55, '#111827');
  box(t.u - 0.10, t.height + 0.015, t.v, 0.14, 0.03, 0.2, '#111827');
  box(t.u - 0.115, t.height + 0.285, t.v, 0.01, 0.3, 0.5, '#1e3a8a');
  box(t.u + 0.10, t.height + 0.01, t.v, 0.14, 0.02, 0.44, '#1f2937');

  // 3. Hệ dầm trần hở (Industrial Exposed Black Beams):
  // 3 dầm ngang cắt qua phòng theo trục V tại u = 89.0, 91.8, 94.6
  const beamY = CEILING_Y - 0.15; // 3.65 m
  const roomVLen = 12.1;
  const roomVMid = -142.05;
  for (const bu of [89.0, 91.8, 94.6]) {
    box(bu, beamY, roomVMid, 0.32, 0.30, roomVLen, BEAM_BLACK);
  }
  // 2 dầm dọc liên kết theo trục U
  const roomULen = 9.37;
  const roomUMid = 91.925;
  for (const bv of [-144.8, -139.2]) {
    box(roomUMid, beamY, bv, roomULen, 0.28, 0.28, BEAM_BLACK);
  }

  // 4. Máy lạnh âm trần dạng cassette 4 hướng thổi (Ceiling Cassette AC)
  for (const ac of room.airConditioners) {
    // Vỏ ngoài cassette
    box(ac.u, ac.y, ac.v, 0.9, 0.18, 0.9, AC_WHITE);
    // Lưới hút gió vuông chìm ở giữa
    box(ac.u, ac.y - 0.09, ac.v, 0.5, 0.02, 0.5, '#64748b');
  }

  // 5. Ốp tường bê tông xám nhạt hiện đại bên trong phòng 406 (màu #abaaa5 trong khoảng #9a9a96–#b5b4ae)
  // Tường trước (Đông)
  box(96.47, 1.9, -142.05, 0.02, 3.8, 12.1, CONCRETE_LIGHT_GRAY);
  // Tường sau (Tây)
  box(87.37, 1.9, -142.05, 0.02, 3.8, 12.1, CONCRETE_LIGHT_GRAY);
  // Tường hành lang (Nam, chừa cửa tại u=89.44)
  box(88.04, 1.9, -136.12, 1.6, 3.8, 0.02, CONCRETE_LIGHT_GRAY);
  box(93.325, 1.9, -136.12, 6.57, 3.8, 0.02, CONCRETE_LIGHT_GRAY);
  // Tường Bắc (dưới bậu cửa sổ)
  box(91.925, 0.425, -147.88, 9.37, 0.85, 0.06, CONCRETE_LIGHT_GRAY);

  // 6. Khung cửa sổ nhôm đen & kính đón sáng phía Bắc (v = -147.88)
  const WINDOW_FRAME_COLOR = '#18181b';
  // Bậu cửa sổ dưới (y = 0.85)
  box(91.925, 0.85, -147.88, 9.37, 0.08, 0.08, WINDOW_FRAME_COLOR);
  // Thanh đố ngang phân chia ô kính trên dán poster và kính dưới (y = 2.60)
  box(91.925, 2.60, -147.88, 9.37, 0.06, 0.08, WINDOW_FRAME_COLOR);
  // Đố trên sát trần (y = 3.55)
  box(91.925, 3.55, -147.88, 9.37, 0.06, 0.08, WINDOW_FRAME_COLOR);
  // Các đố đứng chia ô cửa sổ
  for (const mu of [87.3, 89.4, 91.5, 93.6, 95.7, 96.55]) {
    box(mu, 2.20, -147.88, 0.06, 2.70, 0.08, WINDOW_FRAME_COLOR);
  }
  // Kính cửa sổ dưới (màu trời xanh sáng dịu)
  box(91.925, 1.72, -147.89, 9.25, 1.66, 0.02, '#bae6fd');

  return { desks, chairs, monitors, faces, faceBrightness, keyboards, cases, lights, misc };
}

export function countDrawCalls(plan: Classroom406Plan): number {
  const groups = [plan.desks, plan.chairs, plan.monitors, plan.faces, plan.keyboards, plan.cases, plan.lights, plan.misc];
  return groups.filter((g) => g.length > 0).length;
}
