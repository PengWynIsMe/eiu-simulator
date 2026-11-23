import { useSyncExternalStore } from 'react';
import { useSilver } from './adapter';
import { isStageAvailable } from '../../data/silver/stages';

export type SilverPresentationMode = 'overlay' | 'world';

const MODE_STORAGE_KEY = 'campussim.silver.mode';

function readStoredUserMode(): SilverPresentationMode {
  if (typeof window === 'undefined') return 'world';
  try {
    const val = window.localStorage.getItem(MODE_STORAGE_KEY);
    if (val === 'overlay' || val === '2d') return 'overlay';
    return 'world';
  } catch {
    return 'world';
  }
}

let userMode: SilverPresentationMode = readStoredUserMode();
let webglLost = false;
const listeners = new Set<() => void>();

function notify(): void {
  for (const fn of listeners) {
    fn();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('webglcontextlost', () => {
    webglLost = true;
    notify();
  });
  window.addEventListener('webglcontextrestored', () => {
    webglLost = false;
    notify();
  });
}

export function isWebglContextLost(): boolean {
  return webglLost;
}

export function getSilverUserMode(): SilverPresentationMode {
  return userMode;
}

export function setSilverUserMode(mode: SilverPresentationMode): void {
  userMode = mode;
  if (typeof window !== 'undefined') {
    try {
      if (mode === 'world') {
        window.localStorage.removeItem(MODE_STORAGE_KEY);
      } else {
        window.localStorage.setItem(MODE_STORAGE_KEY, 'overlay');
      }
    } catch {
      // ignore localStorage errors
    }
  }
  notify();
}

export function useSilverUserMode(): SilverPresentationMode {
  return useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => {
        listeners.delete(onStoreChange);
      };
    },
    () => userMode,
    () => 'world',
  );
}

/**
 * Hook xác định chế độ trình bày UI Silver:
 * - Mặc định luôn là 'world' (3D).
 * - 'overlay' (2D) khi:
 *   1. Người chơi chọn "Chơi nhanh 2D" (localStorage['campussim.silver.mode'] === 'overlay')
 *   2. WebGL context bị mất
 *   3. Đang ở màn screen === 'play' nhưng cảnh hiện tại chưa có stage/phòng khả dụng (lùi 2D riêng cảnh đó).
 */
export function useSilverPresentation(): { mode: SilverPresentationMode } {
  const currentMode = useSilverUserMode();
  const screen = useSilver((s) => s.screen);
  const sceneId = useSilver((s) => (s.screen === 'play' ? s.play?.item.scene?.id ?? s.play?.item.id ?? null : null));

  if (currentMode === 'overlay' || webglLost) {
    return { mode: 'overlay' };
  }
  if (screen === 'play') {
    if (!sceneId || !isStageAvailable(sceneId)) {
      return { mode: 'overlay' };
    }
  }
  return { mode: 'world' };
}

/** Đọc trực tiếp presentation mode từ state mà không qua hook React. */
export function getSilverPresentationMode(): SilverPresentationMode {
  if (userMode === 'overlay' || webglLost) return 'overlay';
  const s = useSilver.getState();
  if (s.screen === 'play') {
    const sceneId = s.play?.item.scene?.id ?? s.play?.item.id ?? null;
    if (!sceneId || !isStageAvailable(sceneId)) return 'overlay';
  }
  return 'world';
}
