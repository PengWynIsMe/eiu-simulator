import { useEffect, type ReactNode } from 'react';
import CodeBlock from '../../desktop/CodeBlock';
import { Avatar } from './DialogueView';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuestionResult {
  correct: boolean;
  explain?: string;
  revealed?: boolean;
  correctAnswerId?: string;
}

export interface QuestionViewProps {
  speakerName: string;
  avatarBg?: string;
  avatarTextColor?: string;
  avatarInitial?: string;
  prompt: string;
  code?: string;
  options: QuestionOption[];
  chosenId?: string | null;
  locked?: boolean;
  result?: QuestionResult | null;
  nextLabel?: string;
  retryLabel?: string;
  revealLabel?: string;
  hotkeys?: boolean;
  children?: ReactNode;
  onChoose: (optionId: string) => void;
  onNext?: () => void;
  onRetry?: () => void;
  onReveal?: () => void;
}

/** Khung câu hỏi trắc nghiệm dùng chung (không `fixed`, không import store). */
export default function QuestionView({
  speakerName,
  avatarBg,
  avatarTextColor,
  avatarInitial,
  prompt,
  code,
  options,
  chosenId,
  locked = false,
  result,
  nextLabel = 'Tiếp ›',
  retryLabel = 'Thử lại',
  revealLabel = 'Xem lời giải',
  hotkeys = false,
  children,
  onChoose,
  onNext,
  onRetry,
  onReveal,
}: QuestionViewProps) {
  const solved = result?.correct === true || result?.revealed === true;
  const isDisabled = locked || solved;

  useEffect(() => {
    if (!hotkeys || isDisabled) return;
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
  }, [hotkeys, isDisabled, options, onChoose]);

  const optionStyle = (id: string) => {
    if (result?.revealed && result.correctAnswerId === id) {
      return 'border-emerald-500 bg-emerald-50 text-emerald-800';
    }
    if (!result || id !== chosenId) {
      return 'border-slate-300 text-slate-800 hover:border-[#0b3d91] hover:bg-slate-50';
    }
    return result.correct
      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
      : 'border-red-500 bg-red-50 text-red-800';
  };

  return (
    <div className="pointer-events-auto max-h-[85vh] w-full max-w-xl space-y-3 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
      {children}
      <div className="flex items-center gap-3">
        <Avatar
          name={speakerName}
          bg={avatarBg}
          textColor={avatarTextColor}
          initial={avatarInitial}
        />
        <div>
          <div className="text-sm font-bold text-[#0b3d91]">{speakerName}</div>
          <p className="text-[15px] text-slate-800">{prompt}</p>
        </div>
      </div>
      {code && <CodeBlock code={code} />}
      <div className="grid gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            disabled={isDisabled}
            onClick={() => onChoose(o.id)}
            className={`min-h-[44px] rounded-xl border-2 px-4 py-2 text-left text-sm font-medium ${optionStyle(o.id)}`}
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
          >
            {o.text}
          </button>
        ))}
      </div>
      {result?.explain && (
        <p
          className={`rounded-xl p-3 text-sm ${
            result.correct || result.revealed
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {result.explain}
        </p>
      )}
      {result && !result.correct && !result.revealed && (onRetry || onReveal) && (
        <div className="flex flex-wrap justify-end gap-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="min-h-[44px] rounded-xl border-2 border-[#0b3d91] px-4 text-sm font-medium text-[#0b3d91] hover:bg-slate-50"
            >
              {retryLabel}
            </button>
          )}
          {onReveal && (
            <button
              type="button"
              onClick={onReveal}
              className="min-h-[44px] rounded-xl border-2 border-[#0b3d91] px-4 text-sm font-medium text-[#0b3d91] hover:bg-slate-50"
            >
              {revealLabel}
            </button>
          )}
        </div>
      )}
      {solved && onNext && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onNext}
            className="min-h-[44px] rounded-xl bg-[#f5b700] px-6 text-sm font-bold text-slate-900 hover:brightness-105"
          >
            {nextLabel}
          </button>
        </div>
      )}
    </div>
  );
}
