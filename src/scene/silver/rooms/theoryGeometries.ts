import { BoxGeometry, CylinderGeometry } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Tạo hình học ghế học sinh / giáo viên chuẩn:
 * - Mặt ngồi tại độ cao chuẩn 0.45 m (kích thước 0.42 x 0.025 x 0.42 m).
 * - 4 chân kim loại vững chãi từ mặt đất (y = 0) lên mặt ngồi.
 * - Tựa lưng bản rộng (0.40 x 0.26 x 0.025 m) tại tầm lưng người ngồi (y = 0.73 m).
 * - 2 thanh ống đỡ tựa lưng từ chân sau.
 * Ghế tạo sẵn với mặt ngồi tại y = 0.45 m, chân từ y = 0, hướng nhìn về +X (u).
 */
export function makeTheoryChairGeometry() {
  const h = 0.45;
  const seatThick = 0.025;
  const legR = 0.012;
  const legH = h - seatThick;
  const backPostH = 0.38;

  const part = (sx: number, sy: number, sz: number, px: number, py: number, pz: number) => {
    const b = new BoxGeometry(sx, sy, sz);
    b.translate(px, py, pz);
    return b;
  };

  const makeLeg = (x: number, z: number) => {
    const leg = new CylinderGeometry(legR, legR, legH, 8);
    leg.translate(x, legH / 2, z);
    return leg;
  };

  const makeBackPost = (x: number, z: number) => {
    const p = new CylinderGeometry(legR, legR, backPostH, 8);
    p.translate(x, h + backPostH / 2 - 0.04, z);
    return p;
  };

  const parts = [
    // Mặt ngồi gỗ / đệm (0.42 x 0.025 x 0.42) tại y = 0.45 m
    part(0.42, seatThick, 0.42, 0, h - seatThick / 2, 0),
    // Tựa lưng (0.025 x 0.26 x 0.40) tại x = -0.19 m
    part(0.025, 0.26, 0.4, -0.19, h + 0.28, 0),
    // 4 chân
    makeLeg(0.16, 0.16),
    makeLeg(0.16, -0.16),
    makeLeg(-0.16, 0.16),
    makeLeg(-0.16, -0.16),
    // 2 ống kim loại đỡ lưng
    makeBackPost(-0.18, 0.14),
    makeBackPost(-0.18, -0.14),
  ];

  const merged = BufferGeometryUtils.mergeGeometries(parts, false);
  for (const p of parts) {
    p.dispose();
  }
  return merged;
}

/**
 * Tạo hình học bàn chuẩn:
 * - Mặt bàn mỏng (~0.04 m) ở đỉnh độ cao (y = height).
 * - 4 chân bàn vuông (0.035 x 0.035 m) từ sàn (y = 0) tới dưới mặt bàn.
 * - Tấm chắn trước (modesty panel) mỏng (~0.018 m) treo dưới mặt bàn, che phía đối diện người ngồi.
 * - Khi nhìn từ bên hông, khoảng trống dưới bàn thông thoáng, thấy rõ chân người ngồi không bị lún vào khối.
 * - Gộp thành 1 BufferGeometry duy nhất để giữ đúng 1 InstancedMesh mỗi loại bàn.
 *
 * Base của bàn tại y = 0 (mặt sàn).
 */
export function makeTheoryDeskGeometry(
  depth: number,
  height: number,
  width: number,
  modestyFacing: 'front' | 'back' | 'none' = 'front',
) {
  const topThick = 0.04;
  const legH = height - topThick;
  const legSize = 0.035;
  const insetX = legSize / 2 + 0.02;
  const insetZ = legSize / 2 + 0.02;

  const part = (sx: number, sy: number, sz: number, px: number, py: number, pz: number) => {
    const b = new BoxGeometry(sx, sy, sz);
    b.translate(px, py, pz);
    return b;
  };

  const parts = [
    // 1. Mặt bàn mỏng (~0.04 m)
    part(depth, topThick, width, 0, height - topThick / 2, 0),
    // 2. 4 chân bàn ở 4 góc
    part(legSize, legH, legSize, depth / 2 - insetX, legH / 2, width / 2 - insetZ),
    part(legSize, legH, legSize, depth / 2 - insetX, legH / 2, -(width / 2 - insetZ)),
    part(legSize, legH, legSize, -(depth / 2 - insetX), legH / 2, width / 2 - insetZ),
    part(legSize, legH, legSize, -(depth / 2 - insetX), legH / 2, -(width / 2 - insetZ)),
  ];

  // 3. Tấm chắn (modesty panel)
  if (modestyFacing !== 'none') {
    const panelH = 0.32;
    const panelThick = 0.018;
    const panelW = width - insetZ * 2 - legSize;
    const posX = modestyFacing === 'front' ? -(depth / 2 - insetX) : depth / 2 - insetX;
    parts.push(
      part(panelThick, panelH, panelW, posX, height - topThick - panelH / 2, 0),
    );
  }

  const merged = BufferGeometryUtils.mergeGeometries(parts, false);
  for (const p of parts) {
    p.dispose();
  }
  return merged;
}
