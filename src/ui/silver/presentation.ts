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

let presentationSnapshot = { userMode, webglLost };
const SSR_SNAPSHOT = { userMode: 'world' as SilverPresentationMode, webglLost: false };

function notify(): void {
  presentationSnapshot = { userMode, webglLost };
  for (const fn of listeners) {
    fn();
  }
}

/**
 * Đăng ký listener khi presentation mode hoặc webglLost thay đổi.
 */
export function onPresentationChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Gắn listener trực tiếp vào canvas element vì webglcontextlost không bubble lên window.
 */
export function attachWebglCanvas(canvas: HTMLCanvasElement): () => void {
  const onLost = (e: Event) => {
    // Ngăn chặn hành vi mặc định của trình duyệt hủy vĩnh viễn WebGL context
    e.preventDefault();
    webglLost = true;
    notify();
  };
  const onRestored = () => {
    webglLost = false;
    notify();
  };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  return () => {
    canvas.removeEventListener('webglcontextlost', onLost);
    canvas.removeEventListener('webglcontextrestored', onRestored);
  };
}

if (typeof window !== 'undefined') {
  // Bắt ở capture phase trên window phòng trường hợp sự kiện phát từ canvas
  window.addEventListener(
    'webglcontextlost',
    (e: Event) => {
      e.preventDefault();
      webglLost = true;
      notify();
    },
    true,
  );
  window.addEventListener(
    'webglcontextrestored',
    () => {
      webglLost = false;
      notify();
    },
    true,
  );
}

export function isWebglContextLost(): boolean {
  return webglLost;
}

export function setWebglContextLostForTest(lost: boolean): void {
  webglLost = lost;
  notify();
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

export function useSilverPresentationState(): { userMode: SilverPresentationMode; webglLost: boolean } {
  return useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => {
        listeners.delete(onStoreChange);
      };
    },
    () => presentationSnapshot,
    () => SSR_SNAPSHOT,
  );
}

export function useSilverUserMode(): SilverPresentationMode {
  return useSilverPresentationState().userMode;
}

/**
 * Hook xác định chế độ trình bày UI Silver:
 * - Mặc định luôn là 'world' (3D).
 * - 'overlay' (2D) khi:
 *   1. Người chơi chọn "Chơi nhanh 2D" (localStorage['campussim.silver.mode'] === 'overlay')
 *   2. WebGL context bị mất (tự động re-render khi webglLost thay đổi)
 *   3. Đang ở màn screen === 'play' nhưng cảnh hiện tại chưa có stage/phòng khả dụng (lùi 2D riêng cảnh đó).
 */
export function useSilverPresentation(): { mode: SilverPresentationMode } {
  const { userMode: currentMode, webglLost: isLost } = useSilverPresentationState();
  const screen = useSilver((s) => s.screen);
  const sceneId = useSilver((s) => (s.screen === 'play' ? s.play?.item.scene?.id ?? s.play?.item.id ?? null : null));

  if (currentMode === 'overlay' || isLost) {
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
