import { useRef, type ReactNode } from 'react';
import { sfx } from '../audio/sfx';
import { CodeSpans, MONO } from './CodeBlock';
import { useTypewriter } from './useTypewriter';

const BLANK = '___';

export type CodeLabRunState = 'idle' | 'compiling' | 'shown';

export interface CodeLabLabels {
  hintBtn: string;
  hintCost?: string;
  blankLabel: string;
  runBtn: string;
  outputTitle: string;
  compiling: string;
  outputEmpty: string;
  revealBtn?: string;
  simNote?: string;
}

export interface CodeLabResult {
  correct: boolean;
  output: string;
  explain?: string;
}

export interface CodeLabViewProps {
  title: string;
  instruction: string;
  template: string;
  value: string;
  runState: CodeLabRunState;
  runId?: number;
  result: CodeLabResult | null;
  hints: string[];
  nextLabel: string;
  labels: CodeLabLabels;
  starsSlot?: ReactNode;
  revealed?: boolean;
  onChange: (value: string) => void;
  onRun: () => void;
  onRequestHint?: () => void;
  onReveal?: () => void;
  onNext: () => void;
}

/** Panel Output: gõ dần kết quả của một lần chạy (mount lại cho mỗi lần chạy). */
function OutputPane({ output, correct, explain }: { output: string; correct: boolean; explain?: string }) {
  const { shown, done } = useTypewriter(output, 90);
  return (
    <div className="space-y-1">
      <pre
        className={`whitespace-pre-wrap text-[13px] leading-5 ${correct ? 'text-emerald-400' : 'text-red-400'}`}
        style={{ fontFamily: MONO }}
      >
        {shown}
        {!done && <span className="animate-pulse">▌</span>}
      </pre>
      {done && !correct && explain && <p className="text-[13px] text-amber-300">{explain}</p>}
    </div>
  );
}

/** Khung IDE giả dùng chung (không import store). */
export default function CodeLabView({
  title,
  instruction,
  template,
  value,
  runState,
  runId = 0,
  result,
  hints,
  nextLabel,
  labels,
  starsSlot,
  revealed = false,
  onChange,
  onRun,
  onRequestHint,
  onReveal,
  onNext,
}: CodeLabViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [before = '', after = ''] = template.split(BLANK);
  const lineCount = template.split('\n').length;
  const correct = runState === 'shown' && (result?.correct === true || revealed);

  return (
    <div className="flex h-full min-h-0 flex-col sm:flex-row-reverse">
      {/* Hướng dẫn: nằm trên code ở mobile, bên phải ở màn rộng */}
      <aside className="max-h-[34%] shrink-0 space-y-2 overflow-y-auto border-b border-slate-700 bg-slate-800 p-3 sm:max-h-none sm:w-64 sm:border-b-0 sm:border-l">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {starsSlot}
        </div>
        <p className="text-[13px] leading-5 text-slate-300">{instruction}</p>
        {hints.map((h, i) => (
          <p key={i} className="rounded-lg bg-amber-400/15 p-2 text-[13px] leading-5 text-amber-200">
            💡 {h} {labels.hintCost && <span className="text-amber-400/80">({labels.hintCost})</span>}
          </p>
        ))}
        {onRequestHint && (
          <button
            type="button"
            onClick={onRequestHint}
            disabled={correct}
            className="min-h-[44px] w-full rounded-lg border border-amber-400/60 px-3 text-sm text-amber-200 hover:bg-amber-400/10 disabled:opacity-40 sm:min-h-0 sm:py-1.5"
          >
            {labels.hintBtn} {labels.hintCost && <span className="text-xs text-amber-400/80">({labels.hintCost})</span>}
          </button>
        )}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800 text-xs">
          <span className="border-t-2 border-yellow-400 bg-slate-900 px-3 py-1.5 text-slate-100">Main.java</span>
          {labels.simNote && <span className="px-3 text-[11px] text-slate-400">{labels.simNote}</span>}
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
                aria-label={labels.blankLabel}
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                onChange={(e) => {
                  onChange(e.target.value);
                  sfx.key();
                }}
                onFocus={() =>
                  window.setTimeout(() => inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250)
                }
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') onRun();
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

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-700 bg-slate-800 px-3 py-2">
          <button
            type="button"
            onClick={onRun}
            disabled={runState === 'compiling' || correct}
            className="min-h-[44px] rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 sm:min-h-0 sm:py-1.5"
          >
            {labels.runBtn}
          </button>
          {runState === 'shown' && result && !result.correct && !revealed && onReveal && labels.revealBtn && (
            <button
              type="button"
              onClick={onReveal}
              className="min-h-[44px] rounded-lg border border-slate-500 px-3 text-sm text-slate-200 hover:bg-slate-700 sm:min-h-0 sm:py-1.5"
            >
              {labels.revealBtn}
            </button>
          )}
          {correct && (
            <button
              type="button"
              onClick={onNext}
              className="min-h-[44px] rounded-lg bg-yellow-400 px-4 text-sm font-semibold text-slate-900 hover:bg-yellow-300 sm:min-h-0 sm:py-1.5"
            >
              {nextLabel}
            </button>
          )}
        </div>

        <div className="h-32 shrink-0 overflow-y-auto border-t border-slate-700 bg-black/60 p-3 sm:h-36">
          <div className="mb-1 text-[11px] uppercase tracking-wide text-slate-500">{labels.outputTitle}</div>
          {runState === 'compiling' && <p className="animate-pulse text-[13px] text-slate-400">{labels.compiling}</p>}
          {runState === 'shown' && result && (
            <OutputPane key={runId} output={result.output} correct={result.correct || revealed} explain={result.explain} />
          )}
          {runState === 'idle' && <p className="text-[13px] text-slate-600">{labels.outputEmpty}</p>}
        </div>
      </div>
    </div>
  );
}
