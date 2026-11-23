import { useEffect, useRef, useState } from 'react';
import type { Feedback, OrderStep } from '../../../types/silver';
import { sfx } from '../../audio/sfx';
import { useT } from '../../text';
import { useSilver } from '../adapter';
import { ST } from '../text';
import Panel from '../parts/Panel';
import PrimaryButton from '../parts/PrimaryButton';
import SecondaryButton from '../parts/SecondaryButton';

interface OrderProps {
  step: OrderStep;
  feedback: Feedback | null;
}

/** Bước sắp xếp thứ tự các câu bằng nút ↑ / ↓ và kiểm tra đáp án. */
export default function Order({ step, feedback }: OrderProps) {
  const tr = useT();
  const answer = useSilver((s) => s.answer);
  const retry = useSilver((s) => s.retry);
  const revealAnswer = useSilver((s) => s.revealAnswer);

  const [ids, setIds] = useState<string[]>(() => step.items.map((item) => item.id));
  const prevFeedbackRef = useRef<Feedback | null>(null);

  useEffect(() => {
    const prev = prevFeedbackRef.current;
    prevFeedbackRef.current = feedback;
    if (feedback?.kind === 'graded' && prev !== feedback) {
      if (feedback.correct) sfx.correct();
      else if (!feedback.revealed) sfx.wrong();
    }
  }, [feedback]);

  const graded = feedback?.kind === 'graded' ? feedback : null;
  const isLocked = graded !== null;
  const shownIds =
    graded?.revealed && graded.correctAnswer
      ? graded.correctAnswer.split(',').filter((id) => step.items.some((it) => it.id === id))
      : ids;

  const itemById = new Map(step.items.map((item) => [item.id, item]));

  const move = (index: number, delta: -1 | 1) => {
    if (isLocked) return;
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    setIds((prev) => {
      const next = [...prev];
      const a = next[index];
      const b = next[target];
      if (a === undefined || b === undefined) return prev;
      next[index] = b;
      next[target] = a;
      return next;
    });
  };

  return (
    <Panel className="mx-auto max-w-3xl space-y-4">
      <p className="text-[15px] font-semibold leading-6 text-slate-800">{tr(step.prompt)}</p>

      <ol className="space-y-2.5">
        {shownIds.map((id, idx) => {
          const item = itemById.get(id);
          if (!item) return null;
          const borderTone = graded
            ? graded.correct || graded.revealed
              ? 'border-emerald-500 bg-emerald-50/70'
              : 'border-red-500 bg-red-50/70'
            : 'border-slate-200 bg-slate-50';

          return (
            <li
              key={id}
              className={`flex items-center justify-between gap-3 rounded-xl border-2 px-3 py-2.5 ${borderTone}`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0b3d91] text-xs font-bold text-white">
                  {idx + 1}
                </span>
                <span className="break-words text-[15px] leading-6 text-slate-800">
                  {tr(item.text)}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  disabled={isLocked || idx === 0}
                  onClick={() => move(idx, -1)}
                  aria-label={`${tr(ST.up)} (${idx + 1})`}
                  className={`inline-flex h-[44px] w-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white text-base font-bold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                    isLocked || idx === 0 ? 'cursor-not-allowed opacity-40 hover:bg-white' : ''
                  }`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={isLocked || idx === shownIds.length - 1}
                  onClick={() => move(idx, 1)}
                  aria-label={`${tr(ST.down)} (${idx + 1})`}
                  className={`inline-flex h-[44px] w-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white text-base font-bold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                    isLocked || idx === shownIds.length - 1
                      ? 'cursor-not-allowed opacity-40 hover:bg-white'
                      : ''
                  }`}
                >
                  ↓
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex justify-end">
        <PrimaryButton disabled={isLocked} onClick={() => answer(shownIds.join(','))}>
          {tr(ST.check)}
        </PrimaryButton>
      </div>

      <div aria-live="polite">
        {graded && (
          <div
            className={`rounded-xl border p-3.5 ${
              graded.correct || graded.revealed
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                : 'border-red-500 bg-red-50 text-red-800'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">
                  <span aria-hidden="true" className="mr-1.5">
                    {graded.correct || graded.revealed ? '✓' : '✕'}
                  </span>
                  {graded.correct
                    ? tr(ST.correct)
                    : graded.revealed
                      ? tr(ST.revealed)
                      : tr(ST.wrong)}
                </p>
                {graded.explain && (
                  <p className="mt-1 text-[15px] leading-6">{tr(graded.explain)}</p>
                )}
              </div>

              {!graded.correct && !graded.revealed && (
                <div className="flex flex-wrap gap-2">
                  <SecondaryButton onClick={retry} className="!min-h-[38px] !px-3">
                    {tr(ST.retry)}
                  </SecondaryButton>
                  <SecondaryButton onClick={revealAnswer} className="!min-h-[38px] !px-3">
                    {tr(ST.reveal)}
                  </SecondaryButton>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
