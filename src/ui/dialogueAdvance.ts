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

export interface DragTrackerState {
  tracking: boolean;
  startX: number;
  startY: number;
  startTime: number;
  maxDist: number;
  wasDrag: boolean;
}

export const INITIAL_DRAG_STATE: DragTrackerState = {
  tracking: false,
  startX: 0,
  startY: 0,
  startTime: 0,
  maxDist: 0,
  wasDrag: false,
};

export type DragEventAction =
  | { type: 'down'; button?: number; pointerType?: string; x: number; y: number; time: number }
  | { type: 'move'; x: number; y: number }
  | { type: 'up'; x?: number; y?: number; time: number }
  | { type: 'cancel' }
  | { type: 'consume_click' };

export const DEFAULT_DRAG_THRESHOLDS = {
  maxDistance: 6,
  maxDuration: 300,
};

/**
 * Reducer thuần túy quản lý trạng thái kéo chuột / chạm:
 * - onPointerDown: ghi nhận tọa độ ban đầu (chỉ chuột trái hoặc chạm cảm ứng).
 * - onPointerMove: cập nhật khoảng cách dịch chuyển cực đại (maxDist) so với điểm bắt đầu.
 * - onPointerUp: nếu maxDist > 6px hoặc thời gian giữ > 300ms -> đánh dấu wasDrag = true.
 * - onPointerCancel: coi như cử chỉ kéo bị hủy/can thiệp ngoài -> đánh dấu wasDrag = true.
 * - consume_click: sau khi sự kiện click bị nuốt do wasDrag, reset wasDrag về false.
 */
export function dragTrackerReducer(
  state: DragTrackerState,
  action: DragEventAction,
  thresholds = DEFAULT_DRAG_THRESHOLDS,
): DragTrackerState {
  switch (action.type) {
    case 'down': {
      // Bỏ qua nếu là chuột và không phải chuột trái (button !== 0)
      if (action.pointerType === 'mouse' && action.button !== undefined && action.button !== 0) {
        return state;
      }
      return {
        tracking: true,
        startX: action.x,
        startY: action.y,
        startTime: action.time,
        maxDist: 0,
        wasDrag: false,
      };
    }
    case 'move': {
      if (!state.tracking) return state;
      const dist = Math.hypot(action.x - state.startX, action.y - state.startY);
      return {
        ...state,
        maxDist: Math.max(state.maxDist, dist),
      };
    }
    case 'up': {
      if (!state.tracking) return state;
      const currentDist =
        action.x !== undefined && action.y !== undefined
          ? Math.hypot(action.x - state.startX, action.y - state.startY)
          : 0;
      const maxDist = Math.max(state.maxDist, currentDist);
      const duration = action.time - state.startTime;
      const isDrag = maxDist > thresholds.maxDistance || duration > thresholds.maxDuration;
      return {
        ...state,
        tracking: false,
        maxDist,
        wasDrag: isDrag,
      };
    }
    case 'cancel': {
      return {
        ...state,
        tracking: false,
        wasDrag: true,
      };
    }
    case 'consume_click': {
      return {
        ...state,
        wasDrag: false,
      };
    }
    default:
      return state;
  }
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
 * Kiểm tra xem có modal đang chặn tương tác thoại hay không:
 * - Bị chặn nếu có [role="alertdialog"] (ví dụ ConfirmDialog Thoát / Bỏ qua).
 * - Bị chặn nếu có [role="dialog"] nằm TRÊN/NGOÀI khung thoại hiện tại
 *   (không tính container SilverLayer [data-silver-overlay="true"] và không tính dialog chứa khung thoại).
 */
export function isModalBlocking(): boolean {
  if (typeof document === 'undefined') return false;

  // 1. Có alertdialog đang mở trong DOM -> luôn chặn
  if (document.querySelector('[role="alertdialog"]')) {
    return true;
  }

  // 2. Kiểm tra các [role="dialog"]
  const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"]');
  for (const dialog of dialogs) {
    // Bỏ qua lớp phủ SilverLayer của 2D mode
    if (dialog.getAttribute('data-silver-overlay') === 'true') {
      continue;
    }
    // Nếu dialog này không chứa bất kỳ phần tử thoại nào có data-dialogue-advance="true" -> là modal ngoài -> chặn
    if (!dialog.querySelector('[data-dialogue-advance="true"]')) {
      return true;
    }
  }

  return false;
}

/**
 * Kiểm tra xem target của sự kiện click có nằm trong các thành phần tương tác cần bỏ qua:
 * - Nằm trong alertdialog hoặc dialog bên ngoài (không tính SilverLayer 2D hoặc dialog chứa khung thoại).
 * - Nút khác: Thoát, ⋯ (menu), VI/EN, lựa chọn (options), Đứng dậy, v.v.
 * - Ô nhập liệu (input, textarea).
 * NGOẠI TRỪ: các phần tử được đánh dấu rõ ràng là nút đi tiếp hoặc mặt phẳng thoại (data-dialogue-advance="true").
 */
export function shouldIgnoreTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as HTMLElement).closest !== 'function') return false;
  const el = target as HTMLElement;

  // 1. Nằm trong alertdialog (hộp xác nhận Thoát/Bỏ qua) hoặc vùng được đánh dấu bỏ qua
  if (el.closest('[role="alertdialog"], [data-dialogue-ignore="true"]')) {
    return true;
  }

  // 2. Nằm trong dialog bên ngoài (không phải container SilverLayer và không chứa khung thoại)
  const dialog = el.closest<HTMLElement>('[role="dialog"]');
  if (
    dialog &&
    dialog.getAttribute('data-silver-overlay') !== 'true' &&
    !dialog.querySelector('[data-dialogue-advance="true"]')
  ) {
    return true;
  }

  // 3. Nút lựa chọn câu đáp bên trong hội thoại
  if (el.closest('[data-dialogue-option="true"]')) {
    return true;
  }

  // 4. Nút hoặc ô tương tác khác (không phải nút tiến bước của hội thoại)
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

/** Cooldown cấp module: ngăn chặn kích hoạt đúp trong vòng 250ms trên toàn hệ thống */
export const DIALOGUE_TRIGGER_COOLDOWN_MS = 250;
let globalLastTriggerTime = 0;

export function getGlobalDialogueLastTriggerTime(): number {
  return globalLastTriggerTime;
}

export function resetGlobalDialogueCooldownForTest(): void {
  globalLastTriggerTime = 0;
}

export function setGlobalDialogueLastTriggerTimeForTest(time: number): void {
  globalLastTriggerTime = time;
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
 * 3. Chống bấm đúp qua cooldown cấp module 250ms, bỏ qua cử chỉ kéo chuột xoay nhìn (>6px hoặc >300ms).
 * 4. Bỏ qua khi bấm nút khác (Thoát, ⋯, VI/EN, Đứng dậy, options) hoặc khi có alertdialog / external modal mở.
 * 5. Chỉ xử lý tại MỘT nơi duy nhất (window capture listener), tránh kích hoạt đúp từ onClick/onKeyDown của khung.
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
  const dragStateRef = useRef<DragTrackerState>(INITIAL_DRAG_STATE);

  // Lưu trữ các giá trị callback mới nhất bằng ref
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
    if (isModalBlocking()) return;

    const now = performance.now();
    // Cooldown cấp module: ngăn kích hoạt 2 lần trong vòng 250ms kể cả khi component re-mount
    if (now - globalLastTriggerTime < DIALOGUE_TRIGGER_COOLDOWN_MS) return;

    const action = evaluateDialogueTrigger({
      isTyping: props.isTyping,
      hasOptions: props.hasOptions,
      canContinue: props.canContinue && Boolean(props.onNext),
      disabled: props.disabled,
    });

    if (action === 'skip') {
      globalLastTriggerTime = now;
      props.onSkip();
    } else if (action === 'next') {
      globalLastTriggerTime = now;
      props.onNext?.();
    }
  };

  useEffect(() => {
    if (!active) return;

    const onPointerDown = (e: PointerEvent) => {
      dragStateRef.current = dragTrackerReducer(dragStateRef.current, {
        type: 'down',
        button: e.button,
        pointerType: e.pointerType,
        x: e.clientX,
        y: e.clientY,
        time: performance.now(),
      });
    };

    const onPointerMove = (e: PointerEvent) => {
      dragStateRef.current = dragTrackerReducer(dragStateRef.current, {
        type: 'move',
        x: e.clientX,
        y: e.clientY,
      });
    };

    const onPointerUp = (e: PointerEvent) => {
      dragStateRef.current = dragTrackerReducer(dragStateRef.current, {
        type: 'up',
        x: e.clientX,
        y: e.clientY,
        time: performance.now(),
      });
    };

    const onPointerCancel = () => {
      dragStateRef.current = dragTrackerReducer(dragStateRef.current, {
        type: 'cancel',
      });
    };

    const onClick = (e: MouseEvent) => {
      // Bấm giữ lâu trên nút Tiếp vẫn là bấm; chỉ lọc kéo/giữ trên cảnh và khung thoại
      const onNextButton =
        e.target instanceof Element && e.target.closest('button[data-dialogue-advance="true"]') !== null;
      // Nếu thao tác là kéo xoay nhìn (drag) -> nuốt click và reset cờ wasDrag
      if (dragStateRef.current.wasDrag && !onNextButton) {
        dragStateRef.current = dragTrackerReducer(dragStateRef.current, {
          type: 'consume_click',
        });
        return;
      }

      if (e.defaultPrevented) return;
      // Nếu click vào nút tương tác khác hoặc modal bên ngoài -> bỏ qua
      if (shouldIgnoreTarget(e.target)) return;

      triggerAdvance();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.repeat) return;

      // Đang gõ văn bản trong input/textarea/editable -> bỏ qua
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }

      // Đang focus vào nút bấm khác (không phải nút tiến bước) -> để phím kích hoạt nút đó
      if (
        target instanceof HTMLButtonElement &&
        target.getAttribute('data-dialogue-advance') !== 'true'
      ) {
        return;
      }

      // Kiểm tra modal đang chặn
      if (isModalBlocking()) return;

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
        e.stopPropagation();
        triggerAdvance();
      }
    };

    window.addEventListener('pointerdown', onPointerDown, { capture: true });
    window.addEventListener('pointermove', onPointerMove, { capture: true, passive: true });
    window.addEventListener('pointerup', onPointerUp, { capture: true });
    window.addEventListener('pointercancel', onPointerCancel, { capture: true });
    window.addEventListener('click', onClick, { capture: true });
    window.addEventListener('keydown', onKeyDown, { capture: true });

    return () => {
      window.removeEventListener('pointerdown', onPointerDown, { capture: true });
      window.removeEventListener('pointermove', onPointerMove, { capture: true });
      window.removeEventListener('pointerup', onPointerUp, { capture: true });
      window.removeEventListener('pointercancel', onPointerCancel, { capture: true });
      window.removeEventListener('click', onClick, { capture: true });
      window.removeEventListener('keydown', onKeyDown, { capture: true });
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
