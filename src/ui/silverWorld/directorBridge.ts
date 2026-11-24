import type { SubscribableSilverStore } from '../../silverWorld/director';
import { getSilverPresentationMode } from '../silver/presentation';

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
 * Kiểm tra trạng thái kích hoạt của director Silver 3D (hàm thuần, không chứa side-effect):
 * - Director chạy suốt lượt chơi 3D (từ home, recap, registration, week, play, ...)
 * - Không dừng khi chuyển qua màn tuần (week) để bảo toàn prevItem, ngày học và keepSeated.
 * - Chỉ dừng khi đóng Silver (screen === 'closed') hoặc người chơi chọn chế độ 2D overlay.
 * - Trong môi trường SSR test (typeof window === 'undefined'), trả về false.
 */
export function isWorldActive(screen?: string | null): boolean {
  if (typeof window === 'undefined') return false;
  if (!screen || screen === 'closed') return false;
  if (getSilverPresentationMode() === 'overlay') return false;
  return true;
}
