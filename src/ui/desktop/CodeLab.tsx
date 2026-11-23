import { useEffect, useRef, useState } from 'react';
import { getLesson } from '../../data';
import { useLessonStore } from '../../store/useLessonStore';
import type { ExerciseStep } from '../../types';
import { TEXT } from '../text';
import CodeLabView, { type CodeLabLabels, type CodeLabRunState } from './CodeLabView';

const LABELS: CodeLabLabels = {
  hintBtn: TEXT.codeHint,
  hintCost: TEXT.codeHintCost,
  blankLabel: TEXT.codeBlankLabel,
  runBtn: TEXT.codeRun,
  outputTitle: TEXT.codeOutput,
  compiling: TEXT.codeCompiling,
  outputEmpty: TEXT.codeOutputEmpty,
};

/** Cửa sổ IDE giả của một bài tập. Mount lại (key = step.id) cho mỗi bài. */
export default function CodeLab({ step }: { step: ExerciseStep }) {
  const lastResult = useLessonStore((s) => s.lastResult);
  const stars = useLessonStore((s) => s.stars);
  const nextIsExercise = useLessonStore((s) => {
    const lesson = s.lessonId ? getLesson(s.lessonId) : undefined;
    return lesson?.steps[s.stepIndex + 1]?.type === 'exercise';
  });

  const [value, setValue] = useState('');
  const [runState, setRunState] = useState<CodeLabRunState>('idle');
  const [runId, setRunId] = useState(0);
  const [hints, setHints] = useState<string[]>([]);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const run = () => {
    if (runState === 'compiling' || (runState === 'shown' && lastResult?.correct === true)) return;
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
    <CodeLabView
      title={step.title}
      instruction={step.instruction}
      template={step.template}
      value={value}
      runState={runState}
      runId={runId}
      result={lastResult}
      hints={hints}
      nextLabel={nextIsExercise ? TEXT.codeNextExercise : TEXT.codeSubmit}
      labels={LABELS}
      starsSlot={
        <span className="shrink-0 rounded-full bg-slate-900 px-2 py-0.5 text-xs text-yellow-300" title="Số sao hiện tại">
          {'⭐'.repeat(stars)}
        </span>
      }
      onChange={setValue}
      onRun={run}
      onRequestHint={askHint}
      onNext={() => useLessonStore.getState().nextStep()}
    />
  );
}
