/**
 * departureState.ts — Quản lý trạng thái và vòng đời rời đi của diễn viên theo lượt chơi.
 *
 * Yêu cầu:
 * 1. Trạng thái rời đi gắn với lượt của cảnh: (RunItem.id + lượt vào play).
 * 2. Xóa khi cảnh bắt đầu lại, thoát lượt (screen home/closed) hoặc restart chương.
 * 3. Mount lại giữa cảnh (re-render) không chạy lại hoạt cảnh rời đi.
 * 4. Chơi lại chương thì nhân vật lại có mặt bình thường.
 * 5. Kích hoạt rời đi:
 *    - Khi cảnh kết thúc (signalMode === 'end').
 *    - HOẶC khi ở bước cuối, nhân vật KHÔNG phải người nói bước cuối và bước cuối đã hiện >= 2.5s.
 *    - Nếu nhân vật đang là người nói ở bước cuối: ở lại, không rời đi khi đang nói.
 */

import { useSyncExternalStore } from 'react';

export interface DepartureSessionKeyParams {
  screen: string;
  chapterId?: string | null;
  itemId?: string | null;
  turnIndex?: number;
}

/**
 * Sinh khóa session cho lượt chơi hiện tại.
 * Trả về null nếu không ở màn hình 'play' hoặc không có itemId.
 */
export function computeSessionKey({
  screen,
  chapterId,
  itemId,
  turnIndex = 0,
}: DepartureSessionKeyParams): string | null {
  if (screen !== 'play' || !itemId) {
    return null;
  }
  return `${chapterId ?? 'unknown'}:${itemId}:${turnIndex}`;
}

export interface DepartureTriggerCheck {
  signalMode: string;
  signalSpeaker?: string | null;
  actorSpeaker: string;
  stepIndex: number;
  stepCount: number;
  currentStepSpeaker?: string | null;
  stepElapsedSeconds: number;
}

/**
 * Hàm thuần quyết định diễn viên có bắt đầu rời đi hay không.
 */
export function shouldTriggerDeparture({
  signalMode,
  signalSpeaker,
  actorSpeaker,
  stepIndex,
  stepCount,
  currentStepSpeaker,
  stepElapsedSeconds,
}: DepartureTriggerCheck): boolean {
  // Cảnh kết thúc: cho phép rời đi
  if (signalMode === 'end') {
    return true;
  }

  // Chưa đến bước cuối: không rời đi
  const isLastStep = stepCount > 0 && stepIndex + 1 >= stepCount;
  if (!isLastStep) {
    return false;
  }

  // Nếu người đó đang nói ở bước cuối: Ở LẠI, KHÔNG RỜI
  const isSpeaking = signalSpeaker === actorSpeaker || currentStepSpeaker === actorSpeaker;
  if (isSpeaking) {
    return false;
  }

  // Bước cuối không do người đó nói: đợi hiện đủ >= 2.5s rồi mới rời đi
  return stepElapsedSeconds >= 2.5;
}

/**
 * Quản lý bộ nhớ các diễn viên đã hoàn thành rời đi theo sessionKey.
 */
class DepartureManager {
  private completedMap = new Map<string, Set<string>>();
  private currentTurnIndex = 0;
  private lastPlayItemId: string | null = null;
  private lastScreen: string = 'closed';
  private currentSessionKey: string | null = null;
  private listeners = new Set<() => void>();
  private unsubscribeStore: (() => void) | null = null;

  public getSessionKey(): string | null {
    return this.currentSessionKey;
  }

  public onSessionChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const fn of this.listeners) {
      fn();
    }
  }

  /**
   * Cập nhật thông tin session dựa trên trạng thái SilverStore.
   * Tăng turnIndex khi vào lại play từ ngoài hoặc đổi itemId.
   */
  public updateSession(screen: string, chapterId: string | null, itemId: string | null): string | null {
    let nextKey: string | null = null;
    if (screen !== 'play') {
      // Thoát lượt (home, closed, etc.): xóa toàn bộ trạng thái đã lưu
      if (this.lastScreen === 'play') {
        this.completedMap.clear();
        this.lastPlayItemId = null;
      }
      this.lastScreen = screen;
      nextKey = null;
    } else {
      // Khi ở màn hình 'play'
      const isNewItem = itemId !== this.lastPlayItemId;
      const isEnterFromOutside = this.lastScreen !== 'play';

      if (isEnterFromOutside || isNewItem) {
        this.currentTurnIndex += 1;
        this.lastPlayItemId = itemId;
      }

      this.lastScreen = screen;
      nextKey = computeSessionKey({
        screen,
        chapterId,
        itemId,
        turnIndex: this.currentTurnIndex,
      });
    }

    if (nextKey !== this.currentSessionKey) {
      this.currentSessionKey = nextKey;
      this.notify();
    }
    return this.currentSessionKey;
  }

  /**
   * Nghe store của Silver ở nơi luôn chạy (subscription dùng chung, có hủy).
   */
  public subscribeToStore(store: {
    getState: () => { screen: string; play?: { chapterId?: string | null; item?: { id: string } | null } | null };
    subscribe: (fn: () => void) => () => void;
  }): () => void {
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
      this.unsubscribeStore = null;
    }

    const onStateChange = () => {
      const s = store.getState();
      const screen = s.screen;
      const chapterId = s.play?.chapterId ?? null;
      const itemId = s.play?.item?.id ?? null;
      this.updateSession(screen, chapterId, itemId);
    };

    onStateChange();
    const unsub = store.subscribe(onStateChange);
    this.unsubscribeStore = () => {
      unsub();
      this.unsubscribeStore = null;
    };
    return this.unsubscribeStore;
  }

  /**
   * Kiểm tra xem diễn viên đã hoàn thành rời đi trong session hiện tại chưa.
   */
  public isCompleted(sessionKey: string | null, actorKey: string): boolean {
    if (!sessionKey) return false;
    const set = this.completedMap.get(sessionKey);
    return Boolean(set && set.has(actorKey));
  }

  /**
   * Đánh dấu diễn viên đã hoàn thành rời đi trong session hiện tại.
   */
  public markCompleted(sessionKey: string | null, actorKey: string): void {
    if (!sessionKey) return;
    let set = this.completedMap.get(sessionKey);
    if (!set) {
      set = new Set<string>();
      this.completedMap.set(sessionKey, set);
    }
    set.add(actorKey);
  }

  /**
   * Reset hoàn toàn (cho test hoặc restart chương).
   */
  public reset(): void {
    this.completedMap.clear();
    this.currentTurnIndex = 0;
    this.lastPlayItemId = null;
    this.lastScreen = 'closed';
    this.currentSessionKey = null;
    this.notify();
  }
}

export const departureManager = new DepartureManager();

/**
 * Hook đọc sessionKey rời đi cho component React, không chứa side-effect trong useMemo.
 */
export function useDepartureSessionKey(): string | null {
  return useSyncExternalStore(
    (onStoreChange) => departureManager.onSessionChange(onStoreChange),
    () => departureManager.getSessionKey(),
    () => null,
  );
}
