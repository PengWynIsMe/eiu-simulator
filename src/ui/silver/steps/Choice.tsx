import { useEffect } from 'react';
import type { ChoiceStep, Feedback } from '../../../types/silver';
import { useT } from '../../text';
import { useSilver } from '../adapter';
import Avatar, { LABEL_BY_SPEAKER } from '../parts/Avatar';

interface ChoiceProps {
  step: ChoiceStep;
  feedback: Feedback | null;
}

/** Bước lựa chọn tình huống (không đúng/sai), hỗ trợ phím 1–4. */
export default function Choice({ step, feedback }: ChoiceProps) {
  const tr = useT();
  const answer = useSilver((s) => s.answer);

  const chosenId = feedback?.kind === 'choice' ? feedback.optionId : null;
  const reply = feedback?.kind === 'choice' ? feedback.reply : undefined;

  useEffect(() => {
    if (chosenId !== null) return;
    const host: EventTarget =
      (typeof document !== 'undefined' ? document.querySelector('[data-silver-overlay="true"]') : null) ??
      window;
    const onKeyDown = (ev: Event) => {
      const e = ev as KeyboardEvent;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (typeof document !== 'undefined' && document.querySelector('[role="alertdialog"]')) return;
      const num = Number.parseInt(e.key, 10);
      if (num >= 1 && num <= 4 && num <= step.options.length) {
        const opt = step.options[num - 1];
        if (opt) {
          e.preventDefault();
          answer(opt.id);
        }
      }
    };
    host.addEventListener('keydown', onKeyDown);
    return () => host.removeEventListener('keydown', onKeyDown);
  }, [chosenId, step.options, answer]);

  const speakerLabel = step.speaker === 'narrator' ? '' : tr(LABEL_BY_SPEAKER[step.speaker]);
  const twoColOnSm = step.options.length <= 2;

  return (
    <div className="w-full space-y-4">
      <div className="max-h-[42dvh] overflow-y-auto space-y-3">
        <div className="flex items-start gap-3">
          <Avatar speaker={step.speaker} />
          <div className="min-w-0 flex-1">
            {speakerLabel && <p className="text-sm font-bold text-[#0b3d91]">{speakerLabel}</p>}
            <p className="mt-1 whitespace-pre-line text-[15px] leading-6 text-slate-800">
              {tr(step.text)}
            </p>
          </div>
        </div>

        <div
          className={`grid gap-2.5 ${twoColOnSm ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}
        >
          {step.options.map((opt, idx) => {
            const selected = chosenId === opt.id;
            const lockedOut = chosenId !== null && !selected;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={chosenId !== null}
                aria-pressed={selected}
                onClick={() => answer(opt.id)}
                className={`flex min-h-[44px] items-center justify-between gap-2 rounded-xl border-2 px-4 py-2.5 text-left text-[15px] leading-6 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  selected
                    ? 'border-[#0b3d91] bg-[#0b3d91] font-semibold text-white'
                    : lockedOut
                      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500 opacity-50'
                      : 'border-slate-300 bg-white font-medium text-slate-800 hover:border-[#0b3d91] hover:bg-slate-50'
                }`}
              >
                <span className="break-words">
                  <span className="mr-2 font-mono text-xs opacity-75">{idx + 1} ·</span>
                  {tr(opt.text)}
                </span>
                {selected && (
                  <span aria-hidden="true" className="shrink-0 font-bold">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div aria-live="polite">
        {reply && (
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <Avatar speaker={step.speaker} />
            <div className="min-w-0 flex-1">
              {speakerLabel && <p className="text-sm font-bold text-[#0b3d91]">{speakerLabel}</p>}
              <p className="mt-1 whitespace-pre-line text-[15px] leading-6 text-slate-800">
                {tr(reply)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
