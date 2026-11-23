import { useEffect, useRef, useState } from 'react';
import type { Feedback, OrderStep } from '../../types/silver';
import { sfx } from '../audio/sfx';
import { useT } from '../text';
import { useSilver } from '../silver/adapter';
import { ST_W } from './text';

interface WorldOrderProps {
  step: OrderStep;
  feedback: Feedback | null;
  onNext: () => void;
}

/** Khung sắp xếp thứ tự các câu tối thiểu cho đợt 1. */
export default function WorldOrder({ step, feedback, onNext }: WorldOrderProps) {
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

  const isSolved = graded?.correct === true || graded?.revealed === true;

  return (
    <div className="pointer-events-auto max-h-[85vh] w-full max-w-xl space-y-3 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
      <h3 className="text-base font-bold text-[#0b3d91]">{tr(step.prompt)}</h3>

      <ol className="space-y-2">
        {shownIds.map((id, idx) => {
          const item = itemById.get(id);
          if (!item) return null;
          const borderTone = graded
            ? isSolved
              ? 'border-emerald-500 bg-emerald-50/70'
              : 'border-red-500 bg-red-50/70'
            : 'border-slate-200 bg-slate-50';

          return (
            <li
              key={id}
              className={`flex items-center justify-between gap-3 rounded-xl border-2 px-3 py-2 text-sm ${borderTone}`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0b3d91] text-xs font-bold text-white">
                  {idx + 1}
                </span>
                <span className="break-words text-slate-800">{tr(item.text)}</span>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  disabled={isLocked || idx === 0}
                  onClick={() => move(idx, -1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  aria-label={`Up ${idx + 1}`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={isLocked || idx === shownIds.length - 1}
                  onClick={() => move(idx, 1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  aria-label={`Down ${idx + 1}`}
                >
                  ↓
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        {!graded ? (
          <button
            type="button"
            onClick={() => answer(shownIds.join(','))}
            className="min-h-[40px] rounded-xl bg-[#0b3d91] px-5 text-sm font-bold text-white hover:bg-blue-800"
          >
            {tr(ST_W.check)}
          </button>
        ) : !isSolved ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={retry}
              className="min-h-[40px] rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              {tr(ST_W.retry)}
            </button>
            <button
              type="button"
              onClick={revealAnswer}
              className="min-h-[40px] rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              {tr(ST_W.reveal)}
            </button>
          </div>
        ) : (
          <span className="text-sm font-bold text-emerald-700">✓ {tr(ST_W.correct)}</span>
        )}

        {isSolved && (
          <button
            type="button"
            onClick={onNext}
            className="min-h-[40px] rounded-xl bg-[#f5b700] px-5 text-sm font-bold text-slate-900 hover:brightness-105"
          >
            {tr(ST_W.next)}
          </button>
        )}
      </div>

      {graded?.explain && (
        <p className="mt-2 text-xs leading-5 text-slate-600">{tr(graded.explain)}</p>
      )}
    </div>
  );
}
