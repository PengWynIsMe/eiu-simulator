import { useEffect, useRef, useState } from 'react';
import { useT } from '../text';
import { useSilver } from '../silver/adapter';
import { useSilverPresentation } from '../silver/presentation';
import { useActivityStore } from '../../store/useActivityStore';
import { useWalkStore } from '../../store/useWalkStore';
import LangToggle from '../major/LangToggle';
import MuteButton from '../lesson/MuteButton';
import ConfirmDialog from '../silver/parts/ConfirmDialog';
import { LABEL_BY_SPEAKER } from '../silver/parts/Avatar';
import DialogueView from '../lesson/views/DialogueView';
import SlideView from '../lesson/views/SlideView';
import QuestionView from '../lesson/views/QuestionView';
import WorldNavigationCard from './WorldNavigationCard';
import WorldOrder from './WorldOrder';
import WorldDesktop from './WorldDesktop';
import HomeExtraSlot from './HomeExtraSlot';
import { fmt, ST_W } from './text';

const SPEAKER_STYLE: Record<string, { bg: string; text: string; initial: string }> = {
  thanh: { bg: '#0b3d91', text: '#ffffff', initial: 'T' },
  quyen: { bg: '#0f766e', text: '#ffffff', initial: 'Q' },
  han: { bg: '#b45309', text: '#ffffff', initial: 'H' },
  teacher: { bg: '#475569', text: '#ffffff', initial: 'GV' },
  examiner: { bg: '#334155', text: '#ffffff', initial: 'GK' },
  guide: { bg: '#0369a1', text: '#ffffff', initial: 'HD' },
  player: { bg: '#f5b700', text: '#0f172a', initial: 'B' },
};

/**
 * Lớp UI 2D phục vụ trải nghiệm 3D world của IT Silver.
 * Chỉ hiển thị khi screen === 'play' và presentation.mode === 'world'.
 */
export default function WorldLayer() {
  const tr = useT();
  const { mode } = useSilverPresentation();
  const screen = useSilver((s) => s.screen);
  const play = useSilver((s) => s.play);
  const nextStep = useSilver((s) => s.nextStep);
  const skipItem = useSilver((s) => s.skipItem);
  const exitRun = useSilver((s) => s.exitRun);
  const answer = useSilver((s) => s.answer);
  const retry = useSilver((s) => s.retry);
  const revealAnswer = useSilver((s) => s.revealAnswer);

  const phase = useActivityStore((s) => s.phase);
  const seated = useActivityStore((s) => s.seated);
  const screenOpen = useActivityStore((s) => s.screenOpen);
  const standUp = useActivityStore((s) => s.standUp);

  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [chosenOptionId, setChosenOptionId] = useState<string | null>(null);

  const prevStepKeyRef = useRef<string | null>(null);
  const lastNextClickRef = useRef(0);

  // Tự động bật walkMode nếu chưa bật khi vào màn play ở chế độ 3D world
  useEffect(() => {
    if (screen === 'play' && mode === 'world') {
      if (!useWalkStore.getState().walkMode) {
        useWalkStore.setState({ walkMode: true });
      }
    }
  }, [screen, mode]);

  const stepKey = play?.item.id && play.step.id ? `${play.item.id}:${play.step.id}` : null;

  useEffect(() => {
    if (stepKey && stepKey !== prevStepKeyRef.current) {
      setChosenOptionId(null);
      prevStepKeyRef.current = stepKey;
    }
  }, [stepKey]);

  // Chỉ hiển thị phần 3D Play layer khi đang ở màn chơi của chế độ 3D world
  if (screen !== 'play' || mode !== 'world' || !play) {
    return <HomeExtraSlot />;
  }

  const isLastStep = play.stepIndex + 1 >= play.stepCount;
  const isEngaged = phase === 'engaged';

  const handleNextClick = () => {
    const now = performance.now();
    if (!play.canContinue || now - lastNextClickRef.current < 300) return;
    lastNextClickRef.current = now;
    nextStep();
  };

  const sceneTitle = play.item.scene ? tr(play.item.scene.title) : '';
  const currentSpeaker = 'speaker' in play.step ? play.step.speaker : 'narrator';
  const speakerName = currentSpeaker === 'narrator'
    ? ''
    : tr(LABEL_BY_SPEAKER[currentSpeaker as keyof typeof LABEL_BY_SPEAKER]);
  const speakerStyle = SPEAKER_STYLE[currentSpeaker];

  return (
    <>
      <HomeExtraSlot />

      {/* Thanh trên: tên cảnh, môn học, tiến độ, ngôn ngữ, âm thanh, nút Đứng dậy, Thoát */}
      <header data-world-layer="true" className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-1 p-1.5 sm:gap-2 sm:p-4">
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl bg-white/90 px-2 py-1 shadow-md backdrop-blur-md sm:gap-3 sm:px-3 sm:py-1.5">
          <span className="max-w-[110px] truncate font-bold text-[#0b3d91] text-xs sm:max-w-none sm:text-sm">
            {sceneTitle}
          </span>
          {play.item.courseCode && (
            <span className="hidden text-xs font-semibold text-slate-500 sm:inline">
              · {play.item.courseCode}
            </span>
          )}
          <span className="text-[11px] font-medium text-slate-600 border-l border-slate-200 pl-1.5 sm:text-xs sm:pl-2">
            {fmt(tr(ST_W.stepN), { i: play.stepIndex + 1, n: play.stepCount })}
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1 sm:gap-2">
          {isEngaged && seated && !screenOpen && (
            <button
              type="button"
              onClick={standUp}
              className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-slate-300 bg-white/95 px-2 text-[11px] font-bold text-slate-800 shadow hover:bg-slate-50 active:scale-95 sm:min-h-[36px] sm:gap-1.5 sm:px-3 sm:text-xs"
            >
              <span>{tr(ST_W.standUp)}</span>
              <span className="hidden text-[10px] text-slate-400 sm:inline">(Esc)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSkipConfirmOpen(true)}
            className="inline-flex min-h-[32px] items-center rounded-lg border border-slate-300 bg-white/90 px-2 text-[11px] font-medium text-slate-700 shadow hover:bg-slate-50 active:scale-95 sm:min-h-[36px] sm:px-3 sm:text-xs"
            title={tr(ST_W.skip)}
          >
            {tr(ST_W.skip)}
          </button>

          <button
            type="button"
            onClick={() => setExitConfirmOpen(true)}
            className="inline-flex min-h-[32px] items-center rounded-lg border border-slate-300 bg-white/90 px-2 text-[11px] font-medium text-red-600 shadow hover:bg-red-50 active:scale-95 sm:min-h-[36px] sm:px-3 sm:text-xs"
            title={tr(ST_W.exit)}
          >
            {tr(ST_W.exit)}
          </button>

          <LangToggle />
          <MuteButton />
        </div>
      </header>

      {/* Giai đoạn travel hoặc near: hiện thẻ góc trái chỉ đường */}
      {!isEngaged && (
        <WorldNavigationCard
          onSkip={() => setSkipConfirmOpen(true)}
          onExit={() => setExitConfirmOpen(true)}
        />
      )}

      {/* Giai đoạn engaged: hiển thị view tương ứng theo play.step */}
      {isEngaged && (
        <main className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-end p-4 pb-6 sm:p-6 sm:pb-8">
          {/* say hoặc choice -> DialogueView */}
          {(play.step.type === 'say' || play.step.type === 'choice') && (
            <div className="mx-auto w-full max-w-2xl">
              <DialogueView
                speakerName={speakerName}
                showAvatar={currentSpeaker !== 'narrator'}
                avatarBg={speakerStyle?.bg}
                avatarTextColor={speakerStyle?.text}
                avatarInitial={speakerStyle?.initial}
                italic={currentSpeaker === 'narrator'}
                text={tr(play.step.text)}
                options={play.step.type === 'choice' ? play.step.options.map((o) => ({ id: o.id, text: tr(o.text) })) : []}
                selectedOptionId={play.feedback?.kind === 'choice' ? play.feedback.optionId : null}
                reply={play.feedback?.kind === 'choice' && play.feedback.reply ? tr(play.feedback.reply) : null}
                nextLabel={isLastStep ? tr(ST_W.finish) : tr(ST_W.next)}
                hotkeys={true}
                onChoose={(optId) => answer(optId)}
                onNext={play.canContinue ? handleNextClick : undefined}
              />
            </div>
          )}

          {/* slide -> SlideView compact + TV */}
          {play.step.type === 'slide' && (
            <div className="mx-auto w-full max-w-lg">
              <SlideView
                title={tr(play.step.title)}
                body={tr(play.step.body)}
                code={play.step.code}
                compact={true}
                nextLabel={isLastStep ? tr(ST_W.finish) : tr(ST_W.next)}
                onNext={play.canContinue ? handleNextClick : undefined}
              />
            </div>
          )}

          {/* question -> QuestionView */}
          {play.step.type === 'question' && (
            <div className="mx-auto w-full max-w-xl">
              <QuestionView
                speakerName={tr(LABEL_BY_SPEAKER['teacher'])}
                avatarBg={SPEAKER_STYLE['teacher']?.bg}
                avatarTextColor={SPEAKER_STYLE['teacher']?.text}
                avatarInitial={SPEAKER_STYLE['teacher']?.initial}
                prompt={tr(play.step.prompt)}
                code={play.step.code}
                options={play.step.options.map((o) => ({ id: o.id, text: tr(o.text) }))}
                chosenId={chosenOptionId}
                locked={play.feedback !== null}
                result={
                  play.feedback?.kind === 'graded'
                    ? {
                        correct: play.feedback.correct,
                        explain: play.feedback.explain ? tr(play.feedback.explain) : undefined,
                        revealed: play.feedback.revealed,
                        correctAnswerId: play.feedback.correctAnswer,
                      }
                    : null
                }
                nextLabel={isLastStep ? tr(ST_W.finish) : tr(ST_W.next)}
                retryLabel={tr(ST_W.retry)}
                revealLabel={tr(ST_W.reveal)}
                hotkeys={true}
                onChoose={(id) => {
                  setChosenOptionId(id);
                  answer(id);
                }}
                onNext={play.canContinue ? handleNextClick : undefined}
                onRetry={() => {
                  setChosenOptionId(null);
                  retry();
                }}
                onReveal={() => revealAnswer()}
              />
            </div>
          )}

          {/* order -> WorldOrder */}
          {play.step.type === 'order' && (
            <div className="mx-auto w-full max-w-xl">
              <WorldOrder
                step={play.step}
                feedback={play.feedback}
                onNext={handleNextClick}
              />
            </div>
          )}

          {/* code -> WorldDesktop */}
          {play.step.type === 'code' && (
            <WorldDesktop
              step={play.step}
              feedback={play.feedback}
              hint={play.hint}
              onNext={handleNextClick}
            />
          )}
        </main>
      )}

      {/* Hộp thoại xác nhận bỏ qua cảnh */}
      <ConfirmDialog
        open={skipConfirmOpen}
        title={tr(ST_W.confirmSkipTitle)}
        body={tr(ST_W.confirmSkipBody)}
        onCancel={() => setSkipConfirmOpen(false)}
        onConfirm={() => {
          setSkipConfirmOpen(false);
          skipItem();
        }}
      />

      {/* Hộp thoại xác nhận thoát lượt chơi */}
      <ConfirmDialog
        open={exitConfirmOpen}
        title={tr(ST_W.confirmExitTitle)}
        body={tr(ST_W.confirmExitBody)}
        onCancel={() => setExitConfirmOpen(false)}
        onConfirm={() => {
          setExitConfirmOpen(false);
          exitRun();
        }}
      />
    </>
  );
}
