import { useEffect } from 'react';
import { useTypewriter } from '../../desktop/useTypewriter';

/** Ảnh đại diện tròn: chữ cái đầu của tên (bỏ danh xưng "Thầy/Cô") hoặc chữ + màu chỉ định. */
export function Avatar({
  name,
  tone = 'blue',
  bg,
  textColor,
  initial: customInitial,
}: {
  name: string;
  tone?: 'blue' | 'gold';
  bg?: string;
  textColor?: string;
  initial?: string;
}) {
  const parts = name.trim().split(/\s+/);
  const initial = customInitial ?? (parts[parts.length - 1] ?? name).charAt(0).toUpperCase();
  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-bold shadow ${
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

/** Khung thoại dùng chung (không `fixed`, không import store). */
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
  const { shown, done, skip } = useTypewriter(text, 30);

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
    <div className="pointer-events-auto rounded-2xl bg-white p-4 shadow-2xl">
      <button
        type="button"
        onClick={skip}
        className="flex w-full cursor-pointer items-start gap-3 text-left"
        aria-label={speakerName || undefined}
      >
        {showAvatar && (
          <Avatar
            name={speakerName}
            tone={avatarTone}
            bg={avatarBg}
            textColor={avatarTextColor}
            initial={avatarInitial}
          />
        )}
        <span className={`min-w-0 flex-1 ${!showAvatar && italic ? 'text-center' : ''}`}>
          {speakerName && <span className="block text-sm font-bold text-[#0b3d91]">{speakerName}</span>}
          <span
            className={`block min-h-[3rem] text-[15px] leading-6 text-slate-800 ${
              italic ? 'italic text-slate-700' : ''
            }`}
          >
            {shown}
          </span>
        </span>
      </button>

      {hasOptions && (
        <div className={`mt-3 flex flex-col gap-2 sm:flex-row ${done ? '' : 'invisible'}`}>
          {options.map((o) => {
            const isSelected = selectedOptionId === o.id;
            const lockedOut = selectedOptionId !== null && !isSelected;
            return (
              <button
                key={o.id}
                type="button"
                disabled={selectedOptionId !== null}
                onClick={() => onChoose?.(o.id)}
                className={`min-h-[44px] flex-1 rounded-xl border-2 px-4 py-2 text-sm font-medium ${
                  isSelected
                    ? 'border-[#0b3d91] bg-[#0b3d91] text-white'
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
        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{reply}</p>
      )}

      {showNextBtn && (
        <div className={`mt-3 flex justify-end ${done || hasOptions ? '' : 'invisible'}`}>
          <button
            type="button"
            onClick={() => {
              if (!done && !hasOptions) {
                skip();
                return;
              }
              onNext?.();
            }}
            className="min-h-[44px] rounded-xl bg-[#f5b700] px-6 text-sm font-bold text-slate-900 hover:brightness-105"
          >
            {nextLabel}
          </button>
        </div>
      )}
    </div>
  );
}
