import type { Group, Vector3 } from 'three';
import type { CharacterHandle } from '../characters/CharacterModel';

const FREEZE_DIST_SQ = 60 * 60;
const HIDE_DIST_SQ = 120 * 120;

/**
 * LOD theo khoảng cách tới camera: > 60 m đóng băng animation, > 120 m ẩn hẳn.
 * Trả về true nếu NPC đang hiện (còn đáng để chạy logic tốn kém như đọc độ cao đất).
 */
export function applyLod(cam: Vector3, group: Group, handle: CharacterHandle | null, x: number, y: number, z: number): boolean {
  const dx = cam.x - x;
  const dy = cam.y - y;
  const dz = cam.z - z;
  const d2 = dx * dx + dy * dy + dz * dz;
  const shown = d2 < HIDE_DIST_SQ;
  if (group.visible !== shown) group.visible = shown;
  handle?.setPaused(d2 >= FREEZE_DIST_SQ);
  return shown;
}

/** Góc quay ngắn nhất từ `from` tới `to`, nhân hệ số `k` (0..1). */
export function turnToward(from: number, to: number, k: number): number {
  const d = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + d * k;
}
