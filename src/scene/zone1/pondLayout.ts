import type { Vec2 } from '../../types';

/**
 * Hệ tọa độ cục bộ của sân trong giữa Block 4 và Block 3,
 * căn song song với 2 cây cầu ([123, -72.6] → [134.7, 38.4] và [106.8, -70.8] → [118.5, 40.1]).
 * - Trục u: Tây → Đông (từ vòng xoay hướng ra đường phía Đông)
 * - Trục v: Bắc → Nam (dọc theo 2 cây cầu từ Block 4 sang Block 3)
 */
const BRIDGE_DX = 11.7;
const BRIDGE_DZ = 110.95;
const BRIDGE_LEN = Math.hypot(BRIDGE_DX, BRIDGE_DZ);

/** Vector đơn vị trục v (Bắc → Nam, dọc 2 cây cầu). */
const V_DIR: Vec2 = [BRIDGE_DX / BRIDGE_LEN, BRIDGE_DZ / BRIDGE_LEN];

/** Vector đơn vị trục u (Tây → Đông, vuông góc 2 cây cầu). */
const U_DIR: Vec2 = [V_DIR[1], -V_DIR[0]];

/** Góc xoay quanh trục Y để đưa hình học từ hệ (u, v) sang thế giới (x, z). */
export const POND_ROTATION_Y = Math.atan2(V_DIR[0], V_DIR[1]);

export interface PondBasin {
  minU: number;
  maxU: number;
  minV: number;
  maxV: number;
}

/**
 * Sân cỏ giữa 2 đường nội bộ có dải v ∈ [-41.8, +42.5] (tâm v ≈ +0.35).
 * 3 hồ nằm chính giữa theo chiều Bắc–Nam (rộng 26 m, đối xứng 2 bên đường),
 * trải dài theo chiều Tây–Đông từ gần vòng xoay (u = 88) tới trước đường Đông (u = 140.5),
 * ngăn cách gọn tại mép sàn 2 cây cầu (u ≈ 113.64 và u ≈ 129.93).
 */
const POND_MIN_V = -12.65;
const POND_MAX_V = 13.35;

export const POND_BASINS: readonly PondBasin[] = [
  // Hồ 1 (phía Tây, gần quảng trường vòng xoay)
  { minU: 88.0, maxU: 111.8, minV: POND_MIN_V, maxV: POND_MAX_V },
  // Hồ 2 (ở giữa, ngăn cách bởi 2 cây cầu)
  { minU: 115.45, maxU: 128.15, minV: POND_MIN_V, maxV: POND_MAX_V },
  // Hồ 3 (phía Đông, trước đường nội bộ phía Đông)
  { minU: 131.75, maxU: 140.5, minV: POND_MIN_V, maxV: POND_MAX_V },
];

/** Kiểm tra điểm thế giới [x, z] có nằm trong (hoặc gần trong phạm vi padding) cụm hồ nước không. */
export function isPointInPond(x: number, z: number, padding = 0): boolean {
  const u = x * U_DIR[0] + z * U_DIR[1];
  const v = x * V_DIR[0] + z * V_DIR[1];

  return POND_BASINS.some(
    (b) =>
      u >= b.minU - padding &&
      u <= b.maxU + padding &&
      v >= b.minV - padding &&
      v <= b.maxV + padding,
  );
}
