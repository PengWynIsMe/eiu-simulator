import type { SubscribableSilverStore } from '../../silverWorld/director';
import type { SilverApi } from '../../types/silver';
import { isStageAvailable } from '../../data/silver/stages';

/**
 * Type guard kiểm tra xem store useSilverStore có hỗ trợ subscribe và getState hay không.
 * Thu hẹp kiểu chuẩn TypeScript, tuyệt đối không dùng as unknown as.
 */
export function isSubscribableSilver(store: unknown): store is SubscribableSilverStore {
  return (
    (typeof store === 'function' || typeof store === 'object') &&
    store !== null &&
    'getState' in store &&
    typeof (store as { getState: unknown }).getState === 'function' &&
    'subscribe' in store &&
    typeof (store as { subscribe: unknown }).subscribe === 'function'
  );
}

/**
 * Kiểm tra trạng thái kích hoạt của chế độ 3D world:
 * Chỉ bật khi chạy DEV, có param ?silver3d=lab1, screen đang là 'play'
 * và sceneId hiện hành có stage khả dụng (isStageAvailable).
 */
export function isWorldActive(screen?: string | null, sceneId?: string | null): boolean {
  if (!import.meta.env.DEV) return false;
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('silver3d') !== 'lab1') return false;
  if (screen !== 'play' || !sceneId) return false;
  return isStageAvailable(sceneId);
}

let devInitTriggered = false;

/**
 * Cửa vào dev ?silver3d=lab1 (chỉ import.meta.env.DEV):
 * Tự gọi load, startChapter('2.2', 'restart'), confirmRecap, confirmRegistration, bỏ qua opening, playNext.
 */
export async function initDevSilver3DLab1(silver: SilverApi): Promise<void> {
  if (!import.meta.env.DEV || typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  if (params.get('silver3d') !== 'lab1') return;
  if (devInitTriggered) return;
  devInitTriggered = true;

  try {
    await silver.load();
    silver.startChapter('2.2', 'restart');

    const stateAfterStart = silver.screen;
    if (stateAfterStart === 'recap') {
      silver.confirmRecap();
    }
    if (silver.screen === 'registration') {
      silver.confirmRegistration();
    }
    if (silver.screen === 'play') {
      silver.skipItem();
    }
    if (silver.screen === 'week') {
      silver.playNext();
    }
  } catch (err) {
    console.error('[initDevSilver3DLab1] Failed to auto-start 3D lab1:', err);
  }
}
