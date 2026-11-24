import { useEffect, useRef, useState } from 'react';

// =======================================================================
// Phần D: Lưu bề rộng cột mép phải (px) để camera hoặc hệ thống 3D dùng sau
// =======================================================================
let currentRightColumnWidth = 0;
const columnListeners = new Set<(width: number) => void>();

export function setRightColumnWidth(width: number): void {
  if (currentRightColumnWidth !== width) {
    currentRightColumnWidth = width;
    columnListeners.forEach((listener) => listener(width));
  }
}

export function getRightColumnWidth(): number {
  return currentRightColumnWidth;
}

export function useRightColumnWidth(): number {
  const [width, setWidth] = useState(currentRightColumnWidth);
  useEffect(() => {
    columnListeners.add(setWidth);
    return () => {
      columnListeners.delete(setWidth);
    };
  }, []);
  return width;
}

/**
 * Hook gắn vào container cột phải để tự động đo bề rộng THẬT (getBoundingClientRect)
 * và cập nhật cho camera 3D qua ResizeObserver + window resize event.
 * Chỉ ghi nhận bề rộng khi ở layout cột bên (w >= 1024 hoặc landscape >= 640).
 */
export function useTrackRightColumn(active: boolean = true) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || typeof window === 'undefined') {
      setRightColumnWidth(0);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const updateWidth = () => {
      const w = window.innerWidth;
      const isSideCol = w >= 1024 || (w >= 640 && window.matchMedia('(orientation: landscape)').matches);
      if (isSideCol) {
        const measured = Math.round(el.getBoundingClientRect().width);
        setRightColumnWidth(measured);
      } else {
        setRightColumnWidth(0);
      }
    };

    updateWidth();

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateWidth) : null;
    ro?.observe(el);
    window.addEventListener('resize', updateWidth);

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', updateWidth);
      setRightColumnWidth(0);
    };
  }, [active]);

  return ref;
}

// =======================================================================
// Phần B5: Component gợi ý hành động dùng chung cho phím E và nút chạm
// =======================================================================
export interface ActionPromptProps {
  label: string;
  hotkey?: string;
  onAction?: () => void;
  className?: string;
  touchPosition?: 'bottom-right' | 'bottom-center';
  touchOnly?: boolean;
}

export default function ActionPrompt({
  label,
  hotkey = 'E',
  onAction,
  className = '',
  touchPosition = 'bottom-right',
  touchOnly = false,
}: ActionPromptProps) {
  return (
    <>
      {/* 1. Màn hình chuột/bàn phím (PC/Laptop): Gợi ý ở giữa dưới màn hình bấm chuột được */}
      {!touchOnly && (
        <button
          type="button"
          onClick={onAction}
          className={`pointer-events-auto fixed bottom-8 left-1/2 z-40 hidden -translate-x-1/2 select-none cursor-pointer [@media(pointer:fine)]:flex items-center gap-2.5 rounded-full border border-sky-300/40 bg-slate-950/90 px-5 py-2.5 text-sm font-semibold text-white shadow-2xl backdrop-blur-md transition-transform hover:scale-105 active:scale-95 ${className}`}
        >
          <span className="rounded bg-[#f5b700] px-2 py-0.5 text-xs font-black text-slate-900 shadow">
            {hotkey}
          </span>
          <span>{label}</span>
        </button>
      )}

      {/* 2. Màn hình chạm (Mobile/Tablet): Nút bấm nổi dời lên bottom-56 không đè joystick, T1-T3, Thư viện, hay Thoát */}
      <div
        className={`fixed z-50 select-none [@media(pointer:fine)]:hidden ${
          touchPosition === 'bottom-center'
            ? 'bottom-56 left-1/2 -translate-x-1/2 sm:bottom-20'
            : 'bottom-24 right-6'
        }`}
      >
        <button
          type="button"
          onClick={onAction}
          className="flex min-h-[48px] items-center gap-2 rounded-2xl border-2 border-amber-300 bg-[#f5b700] px-5 py-3 text-sm font-bold text-slate-900 shadow-2xl active:scale-95"
        >
          <span>{label}</span>
          <span className="rounded bg-slate-900/15 px-2 py-0.5 text-xs font-black">{hotkey}</span>
        </button>
      </div>
    </>
  );
}
