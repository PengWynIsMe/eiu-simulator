import { useEffect, useRef, useState } from 'react';
import type { LocalizedText } from '../../../types';
import type { CodeStep, Feedback } from '../../../types/silver';
import { sfx } from '../../audio/sfx';
import { CodeSpans, MONO } from '../../desktop/CodeBlock';
import { useT } from '../../text';
import { useSilver } from '../adapter';
import { ST } from '../text';
import Panel from '../parts/Panel';
import PrimaryButton from '../parts/PrimaryButton';
import SecondaryButton from '../parts/SecondaryButton';

interface CodeProps {
  step: CodeStep;
  feedback: Feedback | null;
  hint: LocalizedText | null;
}

/** Bước điền một chỗ trống "___" vào đoạn mã mô phỏng. */
export default function Code({ step, feedback, hint }: CodeProps) {
  const tr = useT();
  const answer = useSilver((s) => s.answer);
  const retry = useSilver((s) => s.retry);
  const revealAnswer = useSilver((s) => s.revealAnswer);
  const showHint = useSilver((s) => s.showHint);

  const [value, setValue] = useState('');
  const [reducedMotion] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
  );
  const inputRef = useRef<HTMLInputElement | null>(null);
  const prevFeedbackRef = useRef<Feedback | null>(null);

  useEffect(() => {
    const prev = prevFeedbackRef.current;
    prevFeedbackRef.current = feedback;
    if (feedback?.kind === 'graded' && prev !== feedback) {
      if (feedback.correct) sfx.correct();
      else if (!feedback.revealed) sfx.wrong();
    }
    if (feedback === null && prev !== null) {
      inputRef.current?.focus();
    }
  }, [feedback]);

  const graded = feedback?.kind === 'graded' ? feedback : null;
  const isLocked = graded !== null;
  const displayValue =
    graded?.revealed && graded.correctAnswer !== undefined ? graded.correctAnswer : value;

  const handleRun = () => {
    if (isLocked || value.trim().length === 0) return;
    answer(value);
  };

  const lines = step.template.split('\n');

  return (
    <Panel className="mx-auto max-w-3xl space-y-4">
      {/* Tiêu đề & nút Gợi ý */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-[#0b3d91] sm:text-lg">{tr(step.title)}</h3>
          <p className="mt-1 text-[15px] leading-6 text-slate-700">{tr(step.instruction)}</p>
        </div>
        <SecondaryButton
          onClick={showHint}
          disabled={hint !== null || isLocked}
          className="!min-h-[38px] shrink-0 !px-3"
        >
          <span aria-hidden="true" className="mr-1">
            💡
          </span>
          {tr(ST.hint)}
        </SecondaryButton>
      </div>

      {hint && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-[14px] leading-6 text-amber-950">
          <span className="font-bold">{tr(ST.hint)}: </span>
          {tr(hint)}
        </div>
      )}

      {/* Khối mã nền tối #0f172a với số dòng và ô nhập */}
      <div
        className="overflow-x-auto rounded-xl bg-[#0f172a] p-3 text-slate-100 shadow-inner sm:p-4"
        style={{ fontFamily: MONO }}
      >
        <div className="min-w-max space-y-1 text-sm leading-7">
          {lines.map((line, idx) => {
            const blankIdx = line.indexOf('___');
            return (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-6 shrink-0 select-none text-right text-xs text-slate-500">
                  {idx + 1}
                </span>
                {blankIdx >= 0 ? (
                  <div className="whitespace-pre">
                    <CodeSpans code={line.slice(0, blankIdx)} />
                    <input
                      ref={inputRef}
                      type="text"
                      value={displayValue}
                      readOnly={isLocked}
                      disabled={isLocked}
                      onChange={(e) => {
                        setValue(e.target.value);
                        if (!isLocked) sfx.key();
                      }}
                      onFocus={(e) =>
                        e.currentTarget.scrollIntoView({
                          block: 'center',
                          inline: 'nearest',
                          behavior: reducedMotion ? 'auto' : 'smooth',
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key !== 'Escape') {
                          e.stopPropagation();
                        }
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleRun();
                        }
                      }}
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="off"
                      spellCheck={false}
                      aria-label={tr(ST.blank)}
                      size={Math.max(8, displayValue.length + 2)}
                      className="mx-0.5 inline-block rounded border border-sky-400 bg-slate-800 px-2 py-0.5 text-[16px] text-amber-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                    <CodeSpans code={line.slice(blankIdx + 3)} />
                  </div>
                ) : (
                  <div className="whitespace-pre">
                    <CodeSpans code={line} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Thanh chạy & mô phỏng */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PrimaryButton
          disabled={isLocked || value.trim().length === 0}
          onClick={handleRun}
        >
          <span aria-hidden="true" className="mr-1">
            ▶
          </span>
          {tr(ST.run)}
        </PrimaryButton>
        <span className="text-[13px] text-slate-500">{tr(ST.simCode)}</span>
      </div>

      {/* Kết quả chạy & phản hồi */}
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
              <div className="min-w-0 flex-1 space-y-1.5">
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

                {graded.output !== undefined && (
                  <div className="rounded-lg bg-slate-900/90 px-3 py-2 text-xs text-slate-100">
                    <span className="font-semibold text-slate-400">{tr(ST.output)}: </span>
                    <pre className="mt-1 whitespace-pre-wrap font-mono">{graded.output}</pre>
                  </div>
                )}

                {graded.explain && (
                  <p className="text-[15px] leading-6">{tr(graded.explain)}</p>
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
