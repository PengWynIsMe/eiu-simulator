import { useSilver } from './adapter';
import { isWorldActive } from '../silverWorld/directorBridge';

/**
 * Quy định chế độ trình bày UI Silver: lớp phủ 2D hoặc nhúng vào thế giới 3D.
 * Mặc định luôn là 'overlay'. Chỉ chuyển sang 'world' khi dev có ?silver3d=lab1
 * VÀ cảnh hiện tại có stage khả dụng (isStageAvailable).
 */
export function useSilverPresentation(): { mode: 'overlay' | 'world' } {
  const screen = useSilver((s) => s.screen);
  const sceneId = useSilver((s) => (s.screen === 'play' ? s.play?.item.scene?.id ?? s.play?.item.id ?? null : null));
  const active = isWorldActive(screen, sceneId);
  return { mode: active ? 'world' : 'overlay' };
}

/** Đọc trực tiếp presentation mode từ state mà không qua hook React. */
export function getSilverPresentationMode(): 'overlay' | 'world' {
  const s = useSilver.getState();
  const sceneId = s.screen === 'play' ? s.play?.item.scene?.id ?? s.play?.item.id ?? null : null;
  return isWorldActive(s.screen, sceneId) ? 'world' : 'overlay';
}
