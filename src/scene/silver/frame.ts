import type { Vec2 } from '../../types';
import { b11ToWorld, B11_ROTATION_Y } from '../interior/layouts/b11';
import { toWorld as b8ToWorld, B8_ROTATION_Y } from '../interior/layouts/b8';

export type FrameId = 'b11' | 'b8';

/**
 * Đổi tọa độ (u, v) trong hệ địa phương của tòa nhà sang tọa độ thế giới [x, z].
 */
export function toWorld(frame: FrameId, u: number, v: number): Vec2 {
  if (frame === 'b8') {
    return b8ToWorld(u, v);
  }
  return b11ToWorld(u, v);
}

/**
 * Tính góc yaw (rad) trong thế giới cho vector hướng [du, dv] trong hệ địa phương.
 * Model Kenney nhìn +Z trong thế giới, quay Y góc theta -> hướng (sin theta, cos theta).
 * Tính qua vector thế giới [wx, wz] = toWorld(frame, du, dv) -> atan2(wx, wz).
 * Không dùng localDirToYaw vì B8_ROTATION_Y ngược dấu với B11_ROTATION_Y.
 */
export function yawOf(frame: FrameId, du: number, dv: number): number {
  const [wx, wz] = toWorld(frame, du, dv);
  return Math.atan2(wx, wz);
}

/**
 * Góc quay rotation.y của khung tòa nhà so với thế giới.
 */
export function rotationYOf(frame: FrameId): number {
  return frame === 'b8' ? B8_ROTATION_Y : B11_ROTATION_Y;
}
