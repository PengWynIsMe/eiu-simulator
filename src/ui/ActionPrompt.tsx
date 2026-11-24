import { useEffect, useState } from 'react';

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
      {/* 1. Màn hình chuột/bàn phím (PC/Laptop): Gợi ý ở giữa dưới màn hình */}
      {!touchOnly && (
        <div
          className={`pointer-events-none fixed bottom-8 left-1/2 z-40 hidden -translate-x-1/2 select-none [@media(pointer:fine)]:flex items-center gap-2.5 rounded-full border border-sky-300/40 bg-slate-950/90 px-5 py-2.5 text-sm font-semibold text-white shadow-2xl backdrop-blur-md ${className}`}
        >
          <span className="rounded bg-[#f5b700] px-2 py-0.5 text-xs font-black text-slate-900 shadow">
            {hotkey}
          </span>
          <span>{label}</span>
        </div>
      )}

      {/* 2. Màn hình chạm (Mobile/Tablet): Nút bấm nổi ở góc phải dưới hoặc giữa dưới */}
      <div
        className={`fixed z-50 select-none [@media(pointer:fine)]:hidden ${
          touchPosition === 'bottom-center'
            ? 'bottom-20 left-1/2 -translate-x-1/2'
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
