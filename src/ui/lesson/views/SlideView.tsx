import type { ReactNode } from 'react';
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
  onNext?: () => void;
}

/** Khung trình bày slide dùng chung (không `fixed`, không import store). */
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
  onNext,
}: SlideViewProps) {
  if (compact) {
    return (
      <div className="pointer-events-auto max-h-[45vh] space-y-2.5 overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-bold text-[#0b3d91]">{title}</h2>
          {extraAction}
        </div>
        <p className="text-[14px] leading-6 text-slate-700">{body}</p>
        <div className="flex items-center justify-between pt-1">
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
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="min-h-[44px] rounded-xl bg-[#f5b700] px-5 text-sm font-bold text-slate-900 hover:brightness-105"
            >
              {nextLabel}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto max-h-[80vh] space-y-3 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
      <h2 className="text-xl font-bold text-[#0b3d91] sm:text-2xl">{title}</h2>
      {code && <CodeBlock code={code} />}
      <p className="text-[15px] leading-7 text-slate-700">{body}</p>
      <div className="flex items-center justify-between pt-1">
        {slideCount > 0 ? (
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
        <div className="flex items-center gap-2">
          {extraAction}
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="min-h-[44px] rounded-xl bg-[#f5b700] px-6 text-sm font-bold text-slate-900 hover:brightness-105"
            >
              {nextLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
