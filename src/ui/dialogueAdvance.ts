import { useEffect, useRef } from 'react';
import { useLangStore } from '../store/useLangStore';

export interface DialogueState {
  isTyping: boolean;
  hasOptions: boolean;
  canContinue: boolean;
  disabled: boolean;
}

export type DialogueTriggerResult = 'skip' | 'next' | 'none';

/**
 * Máy trạng thái thuần túy cho thao tác bấm / phím của lời thoại:
 * - Khi đang chạy chữ (isTyping): luôn là 'skip' (hiện hết chữ ngay lập tức).
 * - Khi chữ đã hiện hết (không isTyping):
 *   + Nếu có lựa chọn (hasOptions): trả về 'none' (bắt buộc phải bấm chọn, không tự nhảy tiếp).
 *   + Nếu không có lựa chọn và canContinue = true: trả về 'next' (chuyển sang bước tiếp).
 *   + Các trường hợp khác: 'none'.
 * - Khi disabled (hộp xác nhận, modal, desktop đang mở): luôn là 'none'.
 */
export function evaluateDialogueTrigger(state: DialogueState): DialogueTriggerResult {
  if (state.disabled) return 'none';
  if (state.isTyping) return 'skip';
  if (!state.hasOptions && state.canContinue) return 'next';
  return 'none';
}

export interface PointerCoords {
  x: number;
  y: number;
  time: number;
}

/**
 * Kiểm tra xem cử chỉ chuột/chạm có phải là thao tác kéo xoay nhìn (drag) hay không:
 * - Khoảng cách di chuyển > 6px (maxDistance), HOẶC
 * - Thời gian giữ nhấn > 300ms (maxDuration)
 * Nếu đúng -> là drag (xoay camera / cuộn), KHÔNG tính là click hội thoại.
 */
export function isDragGesture(
  start: PointerCoords,
  end: PointerCoords,
  maxDistance = 6,
  maxDuration = 300,
): boolean {
  const dist = Math.hypot(end.x - start.x, end.y - start.y);
  const duration = end.time - start.time;
  return dist > maxDistance || duration > maxDuration;
}

/**
 * Kiểm tra xem target của sự kiện click có nằm trong các thành phần tương tác cần bỏ qua:
 * - Nút khác: Thoát, ⋯ (menu), VI/EN, lựa chọn (options), Đứng dậy, v.v.
 * - Hộp xác nhận / modal / alertdialog / dialog / desktop.
 * - Ô nhập liệu (input, textarea).
 * NGOẠI TRỪ: các phần tử được đánh dấu rõ ràng là nút đi tiếp hoặc mặt phẳng thoại (data-dialogue-advance="true").
 */
export function shouldIgnoreTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as HTMLElement).closest !== 'function') return false;
  const el = target as HTMLElement;

  // 1. Nằm trong hộp xác nhận, modal dialog, hoặc vùng được đánh dấu bỏ qua
  if (el.closest('[role="dialog"], [role="alertdialog"], [data-dialogue-ignore="true"]')) {
    return true;
  }

  // 2. Nút lựa chọn câu đáp bên trong hội thoại
  if (el.closest('[data-dialogue-option="true"]')) {
    return true;
  }

  // 3. Nút hoặc ô tương tác khác (không phải nút tiến bước của hội thoại)
  const interactive = el.closest<HTMLElement>(
    'button, a, input, textarea, select, [role="button"], [role="option"], [role="tab"]',
  );
  if (interactive) {
    if (interactive.getAttribute('data-dialogue-advance') === 'true') {
      return false; // Nút Tiếp hoặc bề mặt thoại hợp lệ
    }
    return true; // Các nút khác (Thoát, Menu, Đứng dậy...) -> bỏ qua
  }

  return false;
}

/**
 * Lấy chuỗi gợi ý nhỏ ở góc khung thoại:
 * - Khi đang chạy chữ: "Chạm để hiện hết" (VI) / "Tap to show all" (EN)
 * - Khi đã hiện hết và không có lựa chọn: "Chạm để tiếp" (VI) / "Tap to continue" (EN)
 * - Khi có lựa chọn: không hiện gợi ý (người dùng nhìn thấy các nút lựa chọn)
 */
export function getDialogueHintText(
  isTyping: boolean,
  hasOptions: boolean,
  lang: 'vi' | 'en',
): string {
  if (isTyping) {
    return lang === 'en' ? 'Tap to show all' : 'Chạm để hiện hết';
  }
  if (!hasOptions) {
    return lang === 'en' ? 'Tap to continue' : 'Chạm để tiếp';
  }
  return '';
}

export interface UseDialogueAdvanceOptions {
  /** Chữ đang chạy trong hiệu ứng máy đánh chữ */
  isTyping: boolean;
  /** Hàm gọi để hiện hết chữ ngay lập tức */
  onSkip: () => void;
  /** Hàm gọi để sang câu / bước tiếp theo */
  onNext?: () => void;
  /** Có các lựa chọn câu đáp hay không */
  hasOptions?: boolean;
  /** Có được phép đi tiếp hay không (mặc định true nếu có onNext) */
  canContinue?: boolean;
  /** Đang bị vô hiệu hóa (ví dụ: hộp thoại xác nhận đang mở) */
  disabled?: boolean;
  /** Đang kích hoạt hook lắng nghe sự kiện toàn cục (mặc định true) */
  active?: boolean;
}

export interface UseDialogueAdvanceReturn {
  /** Chuỗi gợi ý góc khung */
  hintText: string;
  /** Kích hoạt hành động (bấm trực tiếp lên khung thoại hoặc nút Tiếp) */
  triggerAdvance: () => void;
  /** Cho biết có thể kích hoạt hành động hay không */
  canTrigger: boolean;
}

/**
 * Hook dùng chung cho việc bấm nhanh lời thoại (Silver 3D, nmlt-01, Silver 2D):
 * 1. Đang chạy chữ: click/chạm bất kỳ (khung hoặc cảnh 3D) hoặc Enter/Space -> hiện hết chữ.
 * 2. Đã hiện hết & không có lựa chọn: click/chạm hoặc Enter/Space -> sang câu tiếp.
 * 3. Chống bấm đúp (cooldown 250ms), bỏ qua thao tác kéo chuột xoay nhìn (>6px hoặc >300ms).
 * 4. Bỏ qua khi bấm nút khác (Thoát, ⋯, VI/EN, Đứng dậy, options) hoặc khi có modal mở.
 */
export function useDialogueAdvance({
  isTyping,
  onSkip,
  onNext,
  hasOptions = false,
  canContinue = true,
  disabled = false,
  active = true,
}: UseDialogueAdvanceOptions): UseDialogueAdvanceReturn {
  const lang = useLangStore((s) => s.lang);
  const lastTriggerTimeRef = useRef(0);
  const dragTrackerRef = useRef<{
    startX: number;
    startY: number;
    startTime: number;
    maxDist: number;
  } | null>(null);
  const wasDragRef = useRef(false);

  // Lưu trữ các giá trị callback mới nhất bằng ref để tránh re-attaching event listeners liên tục
  const latestPropsRef = useRef({
    isTyping,
    onSkip,
    onNext,
    hasOptions,
    canContinue,
    disabled,
    active,
  });
  useEffect(() => {
    latestPropsRef.current = {
      isTyping,
      onSkip,
      onNext,
      hasOptions,
      canContinue,
      disabled,
      active,
    };
  });

  const triggerAdvance = () => {
    const props = latestPropsRef.current;
    if (!props.active || props.disabled) return;

    // Kiểm tra modal đang mở trong DOM
    if (typeof document !== 'undefined') {
      const modal = document.querySelector('[role="dialog"], [role="alertdialog"]');
      if (modal) return;
    }

    const now = performance.now();
    // Chống bấm đúp / kích hoạt đúp trong cùng 250ms
    if (now - lastTriggerTimeRef.current < 250) return;

    const action = evaluateDialogueTrigger({
      isTyping: props.isTyping,
      hasOptions: props.hasOptions,
      canContinue: props.canContinue && Boolean(props.onNext),
      disabled: props.disabled,
    });

    if (action === 'skip') {
      lastTriggerTimeRef.current = now;
      props.onSkip();
    } else if (action === 'next') {
      lastTriggerTimeRef.current = now;
      props.onNext?.();
    }
  };

  useEffect(() => {
    if (!active) return;

    const onPointerDown = (e: PointerEvent) => {
      // Chỉ bắt chuột trái (button = 0) hoặc màn hình cảm ứng
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragTrackerRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startTime: performance.now(),
        maxDist: 0,
      };
      wasDragRef.current = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragTrackerRef.current) return;
      const d = Math.hypot(
        e.clientX - dragTrackerRef.current.startX,
        e.clientY - dragTrackerRef.current.startY,
      );
      if (d > dragTrackerRef.current.maxDist) {
        dragTrackerRef.current.maxDist = d;
      }
    };

    const onPointerUp = () => {
      if (!dragTrackerRef.current) return;
      const now = performance.now();
      const isDrag = isDragGesture(
        {
          x: dragTrackerRef.current.startX,
          y: dragTrackerRef.current.startY,
          time: dragTrackerRef.current.startTime,
        },
        {
          x: dragTrackerRef.current.startX,
          y: dragTrackerRef.current.startY,
          time: now,
        },
        dragTrackerRef.current.maxDist,
        now - dragTrackerRef.current.startTime,
      );
      wasDragRef.current = isDrag;
      dragTrackerRef.current = null;
    };

    const onClick = (e: MouseEvent) => {
      // Nếu thao tác là kéo xoay nhìn (drag) -> bỏ qua click
      if (wasDragRef.current) {
        wasDragRef.current = false;
        return;
      }
      // Nếu click vào nút tương tác khác hoặc modal -> bỏ qua
      if (shouldIgnoreTarget(e.target)) return;

      triggerAdvance();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.repeat) return;

      // Đang gõ văn bản trong input/textarea -> bỏ qua
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }

      // Đang focus vào nút bấm khác -> để sự kiện phím tự kích hoạt nút đó
      if (target instanceof HTMLButtonElement && target.getAttribute('data-dialogue-advance') !== 'true') {
        return;
      }

      // Kiểm tra modal đang mở trong DOM
      if (typeof document !== 'undefined') {
        const modal = document.querySelector('[role="dialog"], [role="alertdialog"]');
        if (modal) return;
      }

      const props = latestPropsRef.current;
      if (!props.active || props.disabled) return;

      const action = evaluateDialogueTrigger({
        isTyping: props.isTyping,
        hasOptions: props.hasOptions,
        canContinue: props.canContinue && Boolean(props.onNext),
        disabled: props.disabled,
      });

      if (action !== 'none') {
        e.preventDefault();
        triggerAdvance();
      }
    };

    window.addEventListener('pointerdown', onPointerDown, { capture: true });
    window.addEventListener('pointermove', onPointerMove, { capture: true, passive: true });
    window.addEventListener('pointerup', onPointerUp, { capture: true });
    window.addEventListener('click', onClick, { capture: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('pointerdown', onPointerDown, { capture: true });
      window.removeEventListener('pointermove', onPointerMove, { capture: true });
      window.removeEventListener('pointerup', onPointerUp, { capture: true });
      window.removeEventListener('click', onClick, { capture: true });
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [active]);

  const hintText = getDialogueHintText(isTyping, hasOptions, lang);
  const canTrigger = !disabled && (isTyping || (!hasOptions && canContinue && Boolean(onNext)));

  return {
    hintText,
    triggerAdvance,
    canTrigger,
  };
}
