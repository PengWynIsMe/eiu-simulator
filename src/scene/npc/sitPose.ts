import { B11_ROTATION_Y } from '../interior/layouts/b11';

/**
 * Độ nâng y (m) của group nhân vật khi phát clip `sit`, để mông chạm mặt ghế cao 0.45 m.
 *
 * Đo từ character-male-b.glb (Kenney, cùng bộ xương cho mọi nhân vật):
 * - Clip `sit` chỉ hạ node `root` từ y=0 xuống y=-0.15 (đơn vị model) → -0.30 m sau scale 2.0.
 * - Đáy thân (mặt dưới mông, đỉnh khớp hông) ở y=0.17625 model → trong clip sit còn 0.02625 model = 0.0525 m so với gốc group.
 * - Muốn mông ở 0.45 m: offset = 0.45 − 0.0525 ≈ 0.3975 → làm tròn 0.40.
 * Luồng người chơi dùng cùng số này: group.position.y = sàn + SIT_Y_OFFSET (khi chiều cao ghế = 0.45).
 */
export const SIT_Y_OFFSET = 0.4;

/**
 * Hướng nhìn trong hệ (u, v) của B11 → góc `rotation.y` (rad) để đặt cho group nhân vật trong hệ thế giới.
 * Model Kenney nhìn +Z. Quay quanh Y một góc θ thì hướng nhìn thành (sinθ, cosθ) trên mặt phẳng (x, z).
 * Trong hệ (u, v): u ↔ x, v ↔ z nên θ_local = atan2(du, dv). Hệ B11 lại xoay so với thế giới đúng
 * `B11_ROTATION_Y` quanh Y nên cộng thẳng vào (đã kiểm: bằng atan2(wx, wz) với (wx, wz) = b11ToWorld(du, dv)).
 */
export function localDirToYaw(du: number, dv: number): number {
  return Math.atan2(du, dv) + B11_ROTATION_Y;
}
