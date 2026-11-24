import { useEffect } from 'react';
import { useTypewriter } from '../../desktop/useTypewriter';

/** Ảnh đại diện tròn: chữ cái đầu của tên hoặc chữ + màu chỉ định. */
export function Avatar({
  name,
  tone = 'blue',
  bg,
  textColor,
  initial: customInitial,
  size = 'md',
}: {
  name: string;
  tone?: 'blue' | 'gold';
  bg?: string;
  textColor?: string;
  initial?: string;
  size?: 'sm' | 'md';
}) {
  const parts = name.trim().split(/\s+/);
  const initial = customInitial ?? (parts[parts.length - 1] ?? name).charAt(0).toUpperCase();
  const dimClass = size === 'sm' ? 'h-9 w-9 text-base' : 'h-10 w-10 text-lg sm:h-11 sm:w-11';

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold shadow ${dimClass} ${
        bg ? '' : tone === 'blue' ? 'bg-[#0b3d91] text-white' : 'bg-[#f5b700] text-slate-900'
      }`}
      style={bg ? { backgroundColor: bg, color: textColor ?? '#ffffff' } : undefined}
    >
      {initial}
    </div>
  );
}

export interface DialogueOption {
  id: string;
  text: string;
}

export interface DialogueViewProps {
  speakerName: string;
  avatarTone?: 'blue' | 'gold';
  avatarBg?: string;
  avatarTextColor?: string;
  avatarInitial?: string;
  showAvatar?: boolean;
  italic?: boolean;
  text: string;
  options?: DialogueOption[];
  selectedOptionId?: string | null;
  reply?: string | null;
  nextLabel?: string;
  hotkeys?: boolean;
  onChoose?: (optionId: string) => void;
  onNext?: () => void;
}

/**
 * Khung thoại kiểu phụ đề:
 * - Dải thấp, mỏng ở đáy, rộng tối đa 640 px.
 * - Mobile (<640px): cao khoảng 30–35% màn hình, cuộn bên trong nếu nhiều dòng.
 * - Lựa chọn câu đáp bố trí hàng gọn hoặc cột phải.
 */
export default function DialogueView({
  speakerName,
  avatarTone = 'blue',
  avatarBg,
  avatarTextColor,
  avatarInitial,
  showAvatar = true,
  italic = false,
  text,
  options = [],
  selectedOptionId = null,
  reply = null,
  nextLabel = 'Tiếp ›',
  hotkeys = false,
  onChoose,
  onNext,
}: DialogueViewProps) {
  const { shown, done, skip } = useTypewriter(text, 25);

  useEffect(() => {
    if (!hotkeys || !done || options.length === 0 || selectedOptionId !== null || !onChoose) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const num = Number.parseInt(e.key, 10);
      if (num >= 1 && num <= 4 && num <= options.length) {
        const opt = options[num - 1];
        if (opt) {
          e.preventDefault();
          onChoose(opt.id);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hotkeys, done, options, selectedOptionId, onChoose]);

  const hasOptions = options.length > 0;
  const showNextBtn = Boolean(onNext) && (!hasOptions || selectedOptionId !== null);

  return (
    <div className="pointer-events-auto mx-auto w-full max-w-[640px] max-h-[35vh] sm:max-h-none overflow-y-auto rounded-2xl border border-slate-200/90 bg-white/95 p-3 sm:p-4 shadow-2xl backdrop-blur-md">
      <button
        type="button"
        onClick={skip}
        className="flex w-full cursor-pointer items-start gap-2.5 text-left sm:gap-3"
        aria-label={speakerName || undefined}
      >
        {showAvatar && (
          <Avatar
            name={speakerName}
            tone={avatarTone}
            bg={avatarBg}
            textColor={avatarTextColor}
            initial={avatarInitial}
            size="sm"
          />
        )}
        <span className={`min-w-0 flex-1 ${!showAvatar && italic ? 'text-center' : ''}`}>
          {speakerName && (
            <span className="block text-xs font-bold uppercase tracking-wider text-[#0b3d91] sm:text-sm">
              {speakerName}
            </span>
          )}
          <span
            className={`block min-h-[2.5rem] text-[13px] leading-snug sm:text-[14px] sm:leading-relaxed text-slate-800 ${
              italic ? 'italic text-slate-700' : ''
            }`}
          >
            {shown}
          </span>
        </span>
      </button>

      {/* Lựa chọn câu đáp: hàng gọn hoặc lưới 2 cột */}
      {hasOptions && (
        <div className={`mt-2.5 flex flex-wrap gap-2 ${done ? '' : 'invisible'}`}>
          {options.map((o) => {
            const isSelected = selectedOptionId === o.id;
            const lockedOut = selectedOptionId !== null && !isSelected;
            return (
              <button
                key={o.id}
                type="button"
                disabled={selectedOptionId !== null}
                onClick={() => onChoose?.(o.id)}
                className={`min-h-[44px] flex-1 rounded-xl border-2 px-3.5 py-1.5 text-xs font-semibold transition sm:text-sm active:scale-95 ${
                  isSelected
                    ? 'border-[#0b3d91] bg-[#0b3d91] text-white shadow'
                    : lockedOut
                      ? 'cursor-not-allowed border-slate-200 text-slate-400 opacity-50'
                      : 'border-[#0b3d91] text-[#0b3d91] hover:bg-[#0b3d91] hover:text-white'
                }`}
              >
                {o.text}
                {isSelected ? ' ✓' : ''}
              </button>
            );
          })}
        </div>
      )}

      {reply && (
        <p className="mt-2.5 rounded-xl bg-slate-50 px-3 py-1.5 text-xs text-slate-700 sm:text-sm">{reply}</p>
      )}

      {showNextBtn && (
        <div className={`mt-2.5 flex justify-end ${done || hasOptions ? '' : 'invisible'}`}>
          <button
            type="button"
            onClick={() => {
              if (!done && !hasOptions) {
                skip();
                return;
              }
              onNext?.();
            }}
            className="min-h-[44px] rounded-xl bg-[#f5b700] px-5 text-xs font-bold text-slate-900 shadow hover:brightness-105 active:scale-95 sm:min-h-[38px] sm:px-6 sm:text-sm"
          >
            {nextLabel}
          </button>
        </div>
      )}
    </div>
  );
}
