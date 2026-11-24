import { useEffect, useMemo, useState, type ReactNode } from 'react';
import CodeBlock from '../../desktop/CodeBlock';

export interface SlideViewProps {
  title: string;
  body: string;
  code?: string;
  slideIndex?: number;
  slideCount?: number;
  slideAriaLabel?: string;
  nextLabel?: string;
  compact?: boolean;
  extraAction?: ReactNode;
  zoomInLabel?: string;
  zoomOutLabel?: string;
  onNext?: () => void;
}

/**
 * Khung trình bày slide:
 * - Bình thường: cột mép phải hoặc tấm đáy, chỉ ghi chú ngắn (2–4 gạch), nút Phóng to và nút Tiếp.
 * - Phóng to: modal lớn ở giữa màn hình; đóng bằng nút hoặc Esc (chặn không làm nhân vật đứng dậy).
 * - Mobile (<640px): tấm kéo từ dưới lên, cao tối đa 45% màn hình, có tay kéo/gập.
 */
export default function SlideView({
  title,
  body,
  code,
  slideIndex = 0,
  slideCount = 1,
  slideAriaLabel,
  nextLabel = 'Tiếp ›',
  compact = false,
  extraAction,
  zoomInLabel = 'Phóng to',
  zoomOutLabel = 'Thu nhỏ',
  onNext,
}: SlideViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileCollapsed, setIsMobileCollapsed] = useState(false);

  // Esc khi đang phóng to: CHỈ đóng modal phóng to, KHÔNG để lan tới sự kiện đứng dậy
  useEffect(() => {
    if (!isExpanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [isExpanded]);

  // Trích xuất 2–4 gạch đầu dòng ngắn gọn từ nội dung body
  const bulletNotes = useMemo(() => {
    const rawLines = body
      .split(/\n+/)
      .map((s) => s.trim().replace(/^[-*•]\s*/, ''))
      .filter((s) => s.length > 0);

    if (rawLines.length > 1) {
      return rawLines.slice(0, 4);
    }
    // Nếu chỉ là 1 đoạn văn, tách theo câu
    const sentences = body
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    return sentences.slice(0, 4);
  }, [body]);

  return (
    <>
      {/* 1. Khung hiển thị bình thường ở mép màn hình */}
      <div
        className={`pointer-events-auto w-full select-none rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-2xl backdrop-blur-md transition-all ${
          compact ? 'max-h-[45vh]' : 'max-h-[85vh]'
        } flex flex-col justify-between overflow-y-auto`}
      >
        {/* Tay kéo/gập trên mobile */}
        <button
          type="button"
          onClick={() => setIsMobileCollapsed((v) => !v)}
          className="mx-auto mb-2 flex h-4 w-full cursor-pointer items-center justify-center sm:hidden"
          aria-label={isMobileCollapsed ? 'Mở rộng' : 'Thu gọn'}
        >
          <span className="h-1.5 w-12 rounded-full bg-slate-300" />
        </button>

        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-sm font-bold text-[#0b3d91] sm:text-base">{title}</h2>
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-[#0b3d91] shadow-sm hover:bg-sky-100 active:scale-95"
              title={zoomInLabel}
            >
              <span>🔍</span>
              <span>{zoomInLabel}</span>
            </button>
          </div>

          {!isMobileCollapsed && (
            <>
              {/* Ghi chú ngắn 2–4 gạch */}
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700">
                {bulletNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="font-bold text-[#0b3d91]">•</span>
                    <span className="leading-relaxed">{note}</span>
                  </li>
                ))}
              </ul>

              {code && (
                <div className="max-h-32 overflow-hidden rounded-lg opacity-90">
                  <CodeBlock code={code} />
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
          {slideCount > 1 ? (
            <div className="flex gap-1.5" aria-label={slideAriaLabel}>
              {Array.from({ length: slideCount }, (_, i) => (
                <span
                  key={i}
                  className={`h-2.5 w-2.5 rounded-full ${i === slideIndex ? 'bg-[#0b3d91]' : 'bg-slate-300'}`}
                />
              ))}
            </div>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            {extraAction}
            {onNext && (
              <button
                type="button"
                onClick={onNext}
                className="min-h-[44px] rounded-xl bg-[#f5b700] px-5 text-xs font-bold text-slate-900 shadow hover:brightness-105 active:scale-95 sm:min-h-[38px] sm:px-6 sm:text-sm"
              >
                {nextLabel}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Modal phóng to slide giữa màn hình khi người dùng bấm "Phóng to" */}
      {isExpanded && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm sm:p-8"
        >
          <div className="max-h-[90vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-[#0b3d91] sm:text-2xl">{title}</h2>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 active:scale-95"
              >
                <span>✕</span>
                <span>{zoomOutLabel}</span>
                <span className="text-[10px] text-slate-400">(Esc)</span>
              </button>
            </div>

            {code && <CodeBlock code={code} />}

            <div className="text-sm leading-relaxed sm:text-base sm:leading-loose text-slate-800 whitespace-pre-line">
              {body}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              {slideCount > 1 ? (
                <div className="flex gap-2" aria-label={slideAriaLabel}>
                  {Array.from({ length: slideCount }, (_, i) => (
                    <span
                      key={i}
                      className={`h-3 w-3 rounded-full ${i === slideIndex ? 'bg-[#0b3d91]' : 'bg-slate-300'}`}
                    />
                  ))}
                </div>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="min-h-[40px] rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {zoomOutLabel}
                </button>
                {onNext && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsExpanded(false);
                      onNext();
                    }}
                    className="min-h-[40px] rounded-xl bg-[#f5b700] px-6 text-sm font-bold text-slate-900 shadow hover:brightness-105 active:scale-95"
                  >
                    {nextLabel}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
