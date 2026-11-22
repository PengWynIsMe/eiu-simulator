import { useEffect, useRef, useState } from 'react';
import { getLesson } from '../../data';
import { sfx } from '../audio/sfx';
import { useLessonStore } from '../../store/useLessonStore';
import type { ExerciseStep } from '../../types';
import { TEXT } from '../text';
import { CodeSpans, MONO } from './CodeBlock';
import { useTypewriter } from './useTypewriter';

const BLANK = '___';

type RunState = 'idle' | 'compiling' | 'shown';

/** Panel Output: gõ dần kết quả của một lần chạy (mount lại cho mỗi lần chạy). */
function OutputPane({ output, correct, explain }: { output: string; correct: boolean; explain?: string }) {
  const { shown, done } = useTypewriter(output, 90);
  return (
    <div className="space-y-1">
      <pre className={`whitespace-pre-wrap text-[13px] leading-5 ${correct ? 'text-emerald-400' : 'text-red-400'}`} style={{ fontFamily: MONO }}>
        {shown}
        {!done && <span className="animate-pulse">▌</span>}
      </pre>
      {done && !correct && explain && <p className="text-[13px] text-amber-300">{explain}</p>}
    </div>
  );
}

/** Cửa sổ IDE giả của một bài tập. Mount lại (key = step.id) cho mỗi bài. */
export default function CodeLab({ step }: { step: ExerciseStep }) {
  const lastResult = useLessonStore((s) => s.lastResult);
  const stars = useLessonStore((s) => s.stars);
  const nextIsExercise = useLessonStore((s) => {
    const lesson = s.lessonId ? getLesson(s.lessonId) : undefined;
    return lesson?.steps[s.stepIndex + 1]?.type === 'exercise';
  });

  const [value, setValue] = useState('');
  const [runState, setRunState] = useState<RunState>('idle');
  const [runId, setRunId] = useState(0);
  const [hints, setHints] = useState<string[]>([]);
  const timer = useRef<number | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const [before = '', after = ''] = step.template.split(BLANK);
  const lineCount = step.template.split('\n').length;
  const correct = runState === 'shown' && lastResult?.correct === true;

  const run = () => {
    if (runState === 'compiling' || correct) return;
    setRunState('compiling');
    timer.current = window.setTimeout(() => {
      useLessonStore.getState().submitExercise(step.id, value);
      setRunId((n) => n + 1);
      setRunState('shown');
    }, 500);
  };

  const askHint = () => {
    const hint = useLessonStore.getState().takeHint(step.id);
    if (hint) setHints((h) => [...h, hint]);
  };

  return (
    <div className="flex h-full min-h-0 flex-col sm:flex-row-reverse">
      {/* Hướng dẫn: nằm trên code ở mobile, bên phải ở màn rộng */}
      <aside className="max-h-[34%] shrink-0 space-y-2 overflow-y-auto border-b border-slate-700 bg-slate-800 p-3 sm:max-h-none sm:w-64 sm:border-b-0 sm:border-l">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-white">{step.title}</h3>
          <span className="shrink-0 rounded-full bg-slate-900 px-2 py-0.5 text-xs text-yellow-300" title="Số sao hiện tại">
            {'⭐'.repeat(stars)}
          </span>
        </div>
        <p className="text-[13px] leading-5 text-slate-300">{step.instruction}</p>
        {hints.map((h, i) => (
          <p key={i} className="rounded-lg bg-amber-400/15 p-2 text-[13px] leading-5 text-amber-200">
            💡 {h} <span className="text-amber-400/80">({TEXT.codeHintCost})</span>
          </p>
        ))}
        <button
          type="button"
          onClick={askHint}
          disabled={correct}
          className="min-h-[44px] w-full rounded-lg border border-amber-400/60 px-3 text-sm text-amber-200 hover:bg-amber-400/10 disabled:opacity-40 sm:min-h-0 sm:py-1.5"
        >
          {TEXT.codeHint} <span className="text-xs text-amber-400/80">({TEXT.codeHintCost})</span>
        </button>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-slate-900">
        <div className="flex items-center border-b border-slate-700 bg-slate-800 text-xs">
          <span className="border-t-2 border-yellow-400 bg-slate-900 px-3 py-1.5 text-slate-100">Main.java</span>
        </div>

        <div className="flex min-h-0 flex-1 overflow-auto p-3 text-[13px] leading-6 sm:text-sm" style={{ fontFamily: MONO }}>
          <pre aria-hidden="true" className="select-none pr-3 text-right text-slate-600">
            {Array.from({ length: lineCount }, (_, i) => i + 1).join('\n')}
          </pre>
          <pre className="min-w-0">
            <code>
              <CodeSpans code={before} />
              <input
                ref={inputRef}
                value={value}
                disabled={correct}
                aria-label={TEXT.codeBlankLabel}
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                onChange={(e) => {
                  setValue(e.target.value);
                  sfx.key();
                }}
                onFocus={() => window.setTimeout(() => inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') run();
                }}
                style={{ width: `calc(${Math.max(value.length, 4) + 1}ch + 1.25rem)`, fontFamily: MONO }}
                className={`mx-0.5 rounded border-2 bg-slate-800 px-1 text-slate-100 outline-none focus:border-sky-400 ${
                  value === '' ? 'animate-pulse border-yellow-400' : correct ? 'border-emerald-500' : 'border-slate-500'
                }`}
              />
              <CodeSpans code={after} />
            </code>
          </pre>
        </div>

        <div className="flex items-center gap-2 border-t border-slate-700 bg-slate-800 px-3 py-2">
          <button
            type="button"
            onClick={run}
            disabled={runState === 'compiling' || correct}
            className="min-h-[44px] rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 sm:min-h-0 sm:py-1.5"
          >
            {TEXT.codeRun}
          </button>
          {correct && (
            <button
              type="button"
              onClick={() => useLessonStore.getState().nextStep()}
              className="min-h-[44px] rounded-lg bg-yellow-400 px-4 text-sm font-semibold text-slate-900 hover:bg-yellow-300 sm:min-h-0 sm:py-1.5"
            >
              {nextIsExercise ? TEXT.codeNextExercise : TEXT.codeSubmit}
            </button>
          )}
        </div>

        <div className="h-32 shrink-0 overflow-y-auto border-t border-slate-700 bg-black/60 p-3 sm:h-36">
          <div className="mb-1 text-[11px] uppercase tracking-wide text-slate-500">{TEXT.codeOutput}</div>
          {runState === 'compiling' && <p className="animate-pulse text-[13px] text-slate-400">{TEXT.codeCompiling}</p>}
          {runState === 'shown' && lastResult && (
            <OutputPane key={runId} output={lastResult.output} correct={lastResult.correct} explain={lastResult.explain} />
          )}
          {runState === 'idle' && <p className="text-[13px] text-slate-600">{TEXT.codeOutputEmpty}</p>}
        </div>
      </div>
    </div>
  );
}
