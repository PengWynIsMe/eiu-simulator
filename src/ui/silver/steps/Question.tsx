import { useCallback, useEffect, useRef, useState } from 'react';
import type { Feedback, QuestionStep } from '../../../types/silver';
import { isMuted, sfx, subscribeMuted } from '../../audio/sfx';
import CodeBlock from '../../desktop/CodeBlock';
import { useT } from '../../text';
import { useSilver } from '../adapter';
import { ST } from '../text';
import Panel from '../parts/Panel';
import SecondaryButton from '../parts/SecondaryButton';

interface QuestionProps {
  step: QuestionStep;
  feedback: Feedback | null;
}

/** Bước câu hỏi trắc nghiệm (có thể kèm bài đọc, bài nghe TTS hoặc đoạn code). */
export default function Question({ step, feedback }: QuestionProps) {
  const tr = useT();
  const answer = useSilver((s) => s.answer);
  const retry = useSilver((s) => s.retry);
  const revealAnswer = useSilver((s) => s.revealAnswer);

  const [chosenId, setChosenId] = useState<string | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [muted, setMutedState] = useState(() => isMuted());
  const [synthFailed, setSynthFailed] = useState(false);
  const prevFeedbackRef = useRef<Feedback | null>(null);

  const speechSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined';
  const audioBlocked = !speechSupported || muted || synthFailed;
  const showCaptions = audioBlocked || captionsOn;

  useEffect(() => subscribeMuted(() => setMutedState(isMuted())), []);

  useEffect(() => {
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [muted]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    const prev = prevFeedbackRef.current;
    prevFeedbackRef.current = feedback;
    if (feedback?.kind === 'graded' && prev !== feedback) {
      if (feedback.correct) sfx.correct();
      else if (!feedback.revealed) sfx.wrong();
    }
    if (feedback === null && prev !== null) {
      setChosenId(null);
    }
  }, [feedback]);

  const handleChoose = useCallback(
    (id: string) => {
      if (feedback !== null) return;
      setChosenId(id);
      answer(id);
    },
    [feedback, answer],
  );

  useEffect(() => {
    if (feedback !== null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const num = Number.parseInt(e.key, 10);
      if (num >= 1 && num <= 4 && num <= step.options.length) {
        const opt = step.options[num - 1];
        if (opt) {
          e.preventDefault();
          handleChoose(opt.id);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [feedback, step.options, handleChoose]);

  const speakPassage = () => {
    if (!step.passage || !speechSupported || muted) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(step.passage.en);
      utter.lang = 'en-US';
      utter.rate = 0.9;
      utter.onerror = () => setSynthFailed(true);
      window.speechSynthesis.speak(utter);
      setHasPlayed(true);
    } catch {
      setSynthFailed(true);
    }
  };

  const graded = feedback?.kind === 'graded' ? feedback : null;
  const isLocked = graded !== null;

  return (
    <Panel className="mx-auto max-w-3xl space-y-4">
      <div className="max-h-[46dvh] space-y-4 overflow-y-auto pr-1">
        {/* Bài đọc */}
        {step.passage && step.passageKind === 'reading' && (
          <div className="max-h-44 overflow-y-auto rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-[15px] leading-6 text-slate-800 whitespace-pre-line">
            {tr(step.passage)}
          </div>
        )}

        {/* Bài nghe */}
        {step.passage && step.passageKind === 'listening' && (
          <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <SecondaryButton
                  disabled={audioBlocked}
                  onClick={speakPassage}
                  className="!min-h-[38px] !px-3"
                >
                  <span aria-hidden="true" className="mr-1">
                    ▶
                  </span>
                  {hasPlayed ? tr(ST.listenAgain) : tr(ST.listen)}
                </SecondaryButton>

                <label className="inline-flex min-h-[38px] cursor-pointer items-center gap-2 rounded-lg px-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={showCaptions}
                    disabled={audioBlocked}
                    onChange={(e) => setCaptionsOn(e.target.checked)}
                    className="h-4 w-4 accent-[#0b3d91] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  />
                  <span>{tr(ST.captions)}</span>
                </label>
              </div>
              <span className="text-xs font-medium text-slate-500">{tr(ST.simListen)}</span>
            </div>

            {audioBlocked && (
              <p className="text-[13px] leading-5 text-amber-800">{tr(ST.noAudio)}</p>
            )}

            {showCaptions && (
              <p className="whitespace-pre-line rounded-lg border border-slate-200 bg-white p-3 text-[15px] leading-6 text-slate-800">
                {tr(step.passage)}
              </p>
            )}
          </div>
        )}

        {/* Đề bài & đoạn code nếu có */}
        <div className="space-y-2.5">
          <p className="whitespace-pre-line text-[15px] font-semibold leading-6 text-slate-800">
            {tr(step.prompt)}
          </p>
          {step.code && <CodeBlock code={step.code} />}
        </div>

        {/* Các đáp án 1-4 */}
        <div className="grid grid-cols-1 gap-2.5">
          {step.options.map((opt, idx) => {
            const isChosen = chosenId === opt.id;
            const isCorrectChoice =
              (graded?.correct && isChosen) ||
              (graded?.revealed && graded.correctAnswer === opt.id);
            const isWrongChoice = graded && !graded.correct && !graded.revealed && isChosen;

            return (
              <button
                key={opt.id}
                type="button"
                disabled={isLocked}
                onClick={() => handleChoose(opt.id)}
                className={`flex min-h-[44px] items-center justify-between gap-2 rounded-xl border-2 px-4 py-2.5 text-left text-[15px] leading-6 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  isCorrectChoice
                    ? 'border-emerald-500 bg-emerald-50 font-semibold text-emerald-800'
                    : isWrongChoice
                      ? 'border-red-500 bg-red-50 font-semibold text-red-800'
                      : isLocked
                        ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500 opacity-50'
                        : 'border-slate-300 bg-white font-medium text-slate-800 hover:border-[#0b3d91] hover:bg-slate-50'
                }`}
              >
                <span className="break-words">
                  <span className="mr-2 font-mono text-xs opacity-75">{idx + 1} ·</span>
                  {tr(opt.text)}
                </span>
                {isCorrectChoice && (
                  <span aria-hidden="true" className="shrink-0 font-bold">
                    ✓
                  </span>
                )}
                {isWrongChoice && (
                  <span aria-hidden="true" className="shrink-0 font-bold">
                    ✕
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Phản hồi chấm */}
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
