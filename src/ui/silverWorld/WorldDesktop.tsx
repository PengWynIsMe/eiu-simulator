import { useEffect, useRef, useState } from 'react';
import type { CodeStep, Feedback } from '../../types/silver';
import type { LocalizedText } from '../../types';
import { useT } from '../text';
import { useSilver } from '../silver/adapter';
import { useActivityStore } from '../../store/useActivityStore';
import { sfx } from '../audio/sfx';
import DesktopView, { type DesktopLabels } from '../desktop/DesktopView';
import CodeLabView, { type CodeLabLabels, type CodeLabResult, type CodeLabRunState } from '../desktop/CodeLabView';
import { ST_W } from './text';

interface WorldDesktopProps {
  step: CodeStep;
  feedback: Feedback | null;
  hint: LocalizedText | null;
  onNext: () => void;
}

/**
 * Giao diện máy tính EIU toàn màn hình cho bước code trong 3D world.
 * Khi mở, render DesktopView + CodeLabView. Khi người chơi thu máy bằng Esc,
 * cung cấp nút "Mở máy tính" để mở lại bất kỳ lúc nào.
 */
export default function WorldDesktop({ step, feedback, hint, onNext }: WorldDesktopProps) {
  const tr = useT();
  const screenOpen = useActivityStore((s) => s.screenOpen);
  const setScreenOpen = useActivityStore((s) => s.setScreenOpen);
  const standUp = useActivityStore((s) => s.standUp);

  const answer = useSilver((s) => s.answer);
  const retry = useSilver((s) => s.retry);
  const showHint = useSilver((s) => s.showHint);
  const revealAnswer = useSilver((s) => s.revealAnswer);

  const [value, setValue] = useState<string>(() => (feedback?.kind === 'graded' && feedback.correct ? (step.answers[0] ?? '') : ''));
  const [runState, setRunState] = useState<CodeLabRunState>(feedback?.kind === 'graded' ? 'shown' : 'idle');
  const [runId, setRunId] = useState(0);
  const prevFeedbackRef = useRef<Feedback | null>(null);
  const runTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mở máy tính khi bước code bắt đầu và dọn dẹp timer khi unmount
  useEffect(() => {
    setScreenOpen(true);
    return () => {
      setScreenOpen(false);
      if (runTimerRef.current) {
        clearTimeout(runTimerRef.current);
        runTimerRef.current = null;
      }
    };
  }, [setScreenOpen]);

  // Âm thanh phản hồi khi chấm code
  useEffect(() => {
    const prev = prevFeedbackRef.current;
    prevFeedbackRef.current = feedback;
    if (feedback?.kind === 'graded' && prev !== feedback) {
      if (feedback.correct) sfx.correct();
      else if (!feedback.revealed) sfx.wrong();
      setRunState('shown');
      setRunId((n) => n + 1);
    }
  }, [feedback]);

  const graded = feedback?.kind === 'graded' ? feedback : null;
  const isCorrect = graded?.correct === true || graded?.revealed === true;

  const handleValueChange = (v: string) => {
    setValue(v);
    if (runState === 'shown' && !isCorrect) {
      setRunState('idle');
    }
  };

  const handleRun = () => {
    if (runState === 'compiling' || isCorrect || value.trim().length === 0) return;
    if (feedback?.kind === 'graded' && !feedback.correct && !feedback.revealed) {
      retry();
    }
    setRunState('compiling');
    if (runTimerRef.current) {
      clearTimeout(runTimerRef.current);
    }
    runTimerRef.current = setTimeout(() => {
      runTimerRef.current = null;
      answer(value);
      setRunId((n) => n + 1);
      setRunState('shown');
    }, 400);
  };

  const desktopLabels: DesktopLabels = {
    loginStudentId: tr(ST_W.loginStudentId),
    loginPassword: tr(ST_W.loginPassword),
    loginBtn: tr(ST_W.loginBtn),
    loggingIn: tr(ST_W.loggingIn),
    studentName: tr(ST_W.studentName),
    codeLabApp: 'Code Lab',
    slidesApp: tr(ST_W.slidesApp),
    trashApp: tr(ST_W.trashApp),
    trashEmpty: tr(ST_W.trashEmpty),
    noLecture: tr(ST_W.noLecture),
    slideLabel: 'Slide',
    minimize: tr(ST_W.minimizeComputer),
    close: tr(ST_W.close),
    hideTip: tr(ST_W.hideTip),
  };

  const codeLabLabels: CodeLabLabels = {
    hintBtn: tr(ST_W.hint),
    blankLabel: tr(ST_W.blankLabel),
    runBtn: tr(ST_W.run),
    outputTitle: tr(ST_W.outputTitle),
    compiling: tr(ST_W.compiling),
    outputEmpty: tr(ST_W.outputEmpty),
    revealBtn: tr(ST_W.reveal),
  };

  const codeResult: CodeLabResult | null = graded
    ? {
        correct: graded.correct,
        output: graded.output ?? (graded.correct ? step.outputCorrect : step.outputWrong),
        explain: graded.explain ? tr(graded.explain) : undefined,
      }
    : null;

  return (
    <>
      {/* 1. Màn máy tính ảo khi đang mở (screenOpen) */}
      <div
        className={`pointer-events-auto fixed inset-0 z-50 items-center justify-center bg-black/65 sm:p-[3%] ${
          screenOpen ? 'flex' : 'hidden'
        }`}
      >
        <DesktopView
          labels={desktopLabels}
          exitSlot={
            <button
              type="button"
              onClick={() => setScreenOpen(false)}
              className="inline-flex min-h-[32px] items-center gap-1 rounded bg-white/20 px-2.5 text-xs font-semibold text-white hover:bg-white/30"
              title={tr(ST_W.minimizeComputer)}
            >
              <span>–</span>
              <span>{tr(ST_W.minimizeComputer)}</span>
            </button>
          }
          codeContent={
            <CodeLabView
              title={tr(step.title)}
              instruction={tr(step.instruction)}
              template={step.template}
              value={value}
              runState={runState}
              runId={runId}
              result={codeResult}
              hints={hint ? [tr(hint)] : []}
              nextLabel={tr(ST_W.next)}
              labels={codeLabLabels}
              revealed={graded?.revealed}
              onChange={handleValueChange}
              onRun={handleRun}
              onRequestHint={showHint}
              onReveal={revealAnswer}
              onNext={onNext}
            />
          }
        />
      </div>

      {/* 2. Nút mở lại máy tính hoặc đứng dậy khi máy đang thu (screenOpen === false) */}
      {!screenOpen && (
        <div className="pointer-events-auto fixed bottom-8 left-1/2 z-40 flex -translate-x-1/2 gap-3 select-none">
          <button
            type="button"
            onClick={() => setScreenOpen(true)}
            className="flex min-h-[48px] items-center gap-2 rounded-2xl bg-[#0b3d91] px-5 py-3 text-sm font-bold text-white shadow-2xl transition hover:bg-blue-800 active:scale-95"
          >
            <span>🖥</span>
            <span>{tr(ST_W.openComputer)}</span>
          </button>
          <button
            type="button"
            onClick={standUp}
            className="flex min-h-[48px] items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-2xl transition hover:bg-slate-100 active:scale-95"
          >
            <span>{tr(ST_W.standUp)}</span>
            <span className="text-xs text-slate-400">(Esc)</span>
          </button>
        </div>
      )}
    </>
  );
}
