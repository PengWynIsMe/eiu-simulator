import { useSyncExternalStore } from 'react';
import { useSilver } from './adapter';
import { isStageAvailable } from '../../data/silver/stages';

export type SilverPresentationMode = 'overlay' | 'world';

const MODE_STORAGE_KEY = 'campussim.silver.mode';

/**
 * Xóa khóa lưu trữ chế độ cũ nếu người dùng đã từng chọn 'overlay' / '2d' trước đây,
 * đưa tất cả về chế độ mặc định 3D ('world').
 */
export function cleanupStoredMode(): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(MODE_STORAGE_KEY);
    } catch {
      // bỏ qua lỗi storage bị chặn
    }
  }
}

// Chạy dọn dẹp ngay khi nạp module
cleanupStoredMode();

let webglLost = false;
const listeners = new Set<() => void>();
let presentationSnapshot = { webglLost };
const SSR_SNAPSHOT = { webglLost: false };

function notify(): void {
  presentationSnapshot = { webglLost };
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

export function useSilverPresentationState(): { webglLost: boolean } {
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

/**
 * Hook xác định chế độ trình bày UI Silver:
 * - Mặc định luôn là 'world' (3D).
 * - 'overlay' (2D) tự động khi:
 *   1. WebGL context bị mất (tự động re-render khi webglLost thay đổi).
 *   2. Đang ở màn screen === 'play' nhưng cảnh hiện tại chưa có stage/phòng khả dụng (lùi 2D riêng cảnh đó).
 */
export function useSilverPresentation(): { mode: SilverPresentationMode } {
  const { webglLost: isLost } = useSilverPresentationState();
  const screen = useSilver((s) => s.screen);
  const sceneId = useSilver((s) => (s.screen === 'play' ? s.play?.item.scene?.id ?? s.play?.item.id ?? null : null));

  if (isLost) {
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
  if (webglLost) return 'overlay';
  const s = useSilver.getState();
  if (s.screen === 'play') {
    const sceneId = s.play?.item.scene?.id ?? s.play?.item.id ?? null;
    if (!sceneId || !isStageAvailable(sceneId)) return 'overlay';
  }
  return 'world';
}
