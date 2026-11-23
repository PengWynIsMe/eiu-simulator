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

export type SilverStoreTarget = { getState: () => SilverApi } | SilverApi;

function isStoreGetter(target: SilverStoreTarget): target is { getState: () => SilverApi } {
  return (
    (typeof target === 'function' || (typeof target === 'object' && target !== null)) &&
    'getState' in target &&
    typeof (target as { getState: unknown }).getState === 'function'
  );
}

/**
 * Cửa vào dev ?silver3d=lab1 (chỉ import.meta.env.DEV):
 * Tự gọi load, startChapter('2.2', 'restart'), confirmRecap, confirmRegistration, bỏ qua opening, playNext.
 */
export async function initDevSilver3DLab1(target: SilverStoreTarget): Promise<void> {
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).__silverStore = target;
  }
  if (!import.meta.env.DEV || typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  if (params.get('silver3d') !== 'lab1') return;
  if (devInitTriggered) return;
  devInitTriggered = true;

  const getSilver = (): SilverApi => (isStoreGetter(target) ? target.getState() : target);

  try {
    await getSilver().load();
    getSilver().startChapter('2.2', 'restart');

    if (getSilver().screen === 'recap') {
      getSilver().confirmRecap();
    }
    if (getSilver().screen === 'registration') {
      getSilver().confirmRegistration();
    }
    if (getSilver().screen === 'play') {
      getSilver().skipItem();
    }
    if (getSilver().screen === 'week') {
      getSilver().playNext();
    }
  } catch (err) {
    console.error('[initDevSilver3DLab1] Failed to auto-start 3D lab1:', err);
  }
}
