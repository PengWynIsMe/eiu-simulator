import { useCallback, useEffect, useRef, useState } from 'react';
import { UI_TEXT, useT } from '../text';
import { useSilver } from '../silver/adapter';
import { useSilverPresentation } from '../silver/presentation';
import { useActivityStore } from '../../store/useActivityStore';
import { useWalkStore } from '../../store/useWalkStore';
import LangToggle from '../major/LangToggle';
import MuteButton from '../lesson/MuteButton';
import ConfirmDialog from '../silver/parts/ConfirmDialog';
import { LABEL_BY_SPEAKER, STYLE_BY_SPEAKER } from '../silver/parts/Avatar';
import { ST } from '../silver/text';
import DialogueView from '../lesson/views/DialogueView';
import SlideView from '../lesson/views/SlideView';
import Question from '../silver/steps/Question';
import Choice from '../silver/steps/Choice';
import Order from '../silver/steps/Order';
import WorldNavigationCard from './WorldNavigationCard';
import WorldDesktop from './WorldDesktop';
import HomeExtraSlot from './HomeExtraSlot';
import WorldDayCard from './WorldDayCard';
import { useTrackRightColumn } from '../ActionPrompt';
import { fmt, ST_W } from './text';

/**
 * Lớp UI 2D phục vụ trải nghiệm 3D world của IT Silver.
 * Chỉ hiển thị khi screen === 'play' và presentation.mode === 'world'.
 * Bố cục mép màn hình:
 * - Thoại: dải thấp mỏng ở đáy màn hình (max 640px).
 * - Câu hỏi / Slide / Đề: cột mép phải 360–400 px trên desktop; tấm đáy max 45% trên mobile.
 * - Khoảng giữa 55–60% luôn trống để quan sát lớp học, màn hình TV 3D và giảng viên.
 */
export default function WorldLayer() {
  const tr = useT();
  const { mode } = useSilverPresentation();
  const screen = useSilver((s) => s.screen);
  const play = useSilver((s) => s.play);
  const week = useSilver((s) => s.week);
  const openWeek = useSilver((s) => s.openWeek);
  const nextStep = useSilver((s) => s.nextStep);
  const skipItem = useSilver((s) => s.skipItem);
  const exitRun = useSilver((s) => s.exitRun);

  const phase = useActivityStore((s) => s.phase);
  const seated = useActivityStore((s) => s.seated);
  const screenOpen = useActivityStore((s) => s.screenOpen);
  const standUp = useActivityStore((s) => s.standUp);

  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);

  const lastNextClickRef = useRef(0);

  // Tự động bật walkMode nếu chưa bật khi vào màn play ở chế độ 3D world
  useEffect(() => {
    if (screen === 'play' && mode === 'world') {
      if (!useWalkStore.getState().walkMode) {
        useWalkStore.setState({ walkMode: true });
      }
    }
  }, [screen, mode]);

  const handleNextClick = useCallback(() => {
    const now = performance.now();
    if (!play?.canContinue || now - lastNextClickRef.current < 300) return;
    lastNextClickRef.current = now;
    nextStep();
  }, [play?.canContinue, nextStep]);

  // Phím Enter để Tiếp theo thứ tự ưu tiên spec (không kích hoạt đúp khi nút đang focus)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.repeat) return;
      // Chỉ khi đang trò chuyện/ngồi học trong 3D: đang đi lại thì Enter không được nhảy bước
      if (mode !== 'world' || screen !== 'play' || phase !== 'engaged' || screenOpen) return;
      if (e.defaultPrevented) return;
      // Không kích hoạt khi alertdialog đang mở
      if (typeof document !== 'undefined' && document.querySelector('[role="alertdialog"]')) return;
      // Không kích hoạt khi đang gõ trong ô nhập
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable]')) return;
      // Không kích hoạt hai lần khi một nút đang được focus (click mặc định của trình duyệt sẽ tự gọi)
      if (e.target instanceof HTMLButtonElement || (document.activeElement instanceof HTMLButtonElement)) return;
      if (play?.canContinue) {
        e.preventDefault();
        handleNextClick();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mode, screen, phase, screenOpen, play?.canContinue, handleNextClick]);

  const isEngaged = phase === 'engaged';
  const isRightCol = isEngaged && Boolean(
    play && (play.step.type === 'choice' || play.step.type === 'slide' || play.step.type === 'question' || play.step.type === 'order')
  );
  const rightColRef = useTrackRightColumn(isRightCol);

  // Chỉ hiển thị phần 3D Play layer khi đang ở màn chơi của chế độ 3D world
  if (screen !== 'play' || mode !== 'world' || !play) {
    return <HomeExtraSlot />;
  }

  const stepKey = play.item.id && play.step.id ? `${play.item.id}:${play.step.id}` : null;
  const isLastStep = play.stepIndex + 1 >= play.stepCount;

  const sceneTitle = play.item.scene ? tr(play.item.scene.title) : '';
  const currentSpeaker = 'speaker' in play.step ? play.step.speaker : 'narrator';
  const speakerName = currentSpeaker === 'narrator'
    ? ''
    : tr(LABEL_BY_SPEAKER[currentSpeaker as keyof typeof LABEL_BY_SPEAKER]);
  const speakerStyle = currentSpeaker !== 'narrator' ? STYLE_BY_SPEAKER[currentSpeaker] : undefined;

  return (
    <>
      <HomeExtraSlot />
      <WorldDayCard />

      {/* Thanh trên: tên cảnh, môn học, tiến độ, ngôn ngữ, âm thanh, nút Đứng dậy, Thoát */}
      <header data-world-layer="true" className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-1 p-1.5 sm:gap-2 sm:p-4">
        <div className="pointer-events-auto flex min-w-0 items-center gap-1 rounded-xl bg-white/90 px-2 py-1 shadow-md backdrop-blur-md sm:gap-3 sm:px-3 sm:py-1.5">
          <span className="truncate max-w-[80px] xs:max-w-[120px] sm:max-w-none text-xs font-bold text-[#0b3d91] sm:text-sm">
            {sceneTitle}
          </span>
          {play.item.courseCode && (
            <span className="hidden text-xs font-semibold text-slate-500 sm:inline">
              · {play.item.courseCode}
            </span>
          )}
          <span className="shrink-0 text-[10px] font-medium text-slate-600 border-l border-slate-200 pl-1 sm:text-xs sm:pl-2">
            {fmt(tr(ST_W.stepN), { i: play.stepIndex + 1, n: play.stepCount })}
          </span>
        </div>

        <div className="pointer-events-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {isEngaged && seated && !screenOpen && (
            <button
              type="button"
              onClick={standUp}
              className="inline-flex min-h-[30px] items-center gap-0.5 rounded-lg border border-slate-300 bg-white/95 px-1.5 text-[10px] font-bold text-slate-800 shadow hover:bg-slate-50 active:scale-95 sm:min-h-[36px] sm:gap-1.5 sm:px-3 sm:text-xs"
            >
              <span>{tr(ST_W.standUp)}</span>
              <span className="hidden text-[10px] text-slate-400 sm:inline">(Esc)</span>
            </button>
          )}

          {week && play.item.meeting && (
            <button
              type="button"
              data-silver-open-week="true"
              onClick={openWeek}
              className="inline-flex min-h-[30px] items-center gap-0.5 rounded-lg border border-slate-300 bg-white/90 px-1.5 text-[10px] font-medium text-slate-700 shadow hover:bg-slate-50 active:scale-95 sm:min-h-[36px] sm:gap-1 sm:px-2.5 sm:text-xs"
              title={tr(ST.weekTitle)}
            >
              <span aria-hidden="true">📅</span>
              <span className="hidden sm:inline">{tr(ST.weekTitle)}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSkipConfirmOpen(true)}
            className="inline-flex min-h-[30px] items-center rounded-lg border border-slate-300 bg-white/90 px-1.5 text-[10px] font-medium text-slate-700 shadow hover:bg-slate-50 active:scale-95 sm:min-h-[36px] sm:px-3 sm:text-xs"
            title={tr(ST_W.skip)}
          >
            {tr(ST_W.skip)}
          </button>

          <button
            type="button"
            onClick={() => setExitConfirmOpen(true)}
            className="inline-flex min-h-[30px] items-center rounded-lg border border-slate-300 bg-white/90 px-1.5 text-[10px] font-medium text-red-600 shadow hover:bg-red-50 active:scale-95 sm:min-h-[36px] sm:px-3 sm:text-xs"
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
        <>
          {/* say -> DialogueView ở dải thấp đáy màn hình phụ đề */}
          {play.step.type === 'say' && (
            <div className="pointer-events-none fixed inset-x-0 bottom-3 z-30 px-3 sm:bottom-5 sm:px-4">
              <DialogueView
                key={stepKey ?? undefined}
                speakerName={speakerName}
                showAvatar={currentSpeaker !== 'narrator'}
                avatarBg={speakerStyle?.bg}
                avatarTextColor={speakerStyle?.text}
                avatarInitial={speakerStyle?.initial}
                italic={currentSpeaker === 'narrator'}
                text={tr(play.step.text)}
                options={[]}
                selectedOptionId={null}
                reply={null}
                nextLabel={isLastStep ? tr(ST_W.finish) : tr(ST_W.next)}
                hotkeys={true}
                onNext={play.canContinue ? handleNextClick : undefined}
              />
            </div>
          )}

          {/* Cột mép phải (desktop/tablet ngang) hoặc tấm dưới (mobile): choice, slide, question, order */}
          {(play.step.type === 'choice' || play.step.type === 'slide' || play.step.type === 'question' || play.step.type === 'order') && (
            <div
              ref={rightColRef}
              className="pointer-events-none fixed bottom-0 inset-x-0 z-30 p-2.5 sm:p-4 sm:landscape:bottom-4 sm:landscape:top-16 sm:landscape:right-4 sm:landscape:left-auto sm:landscape:w-[320px] sm:landscape:max-h-none lg:bottom-4 lg:top-16 lg:right-4 lg:left-auto lg:w-[380px] xl:w-[400px] lg:max-h-none flex flex-col justify-end"
            >
              {/* choice -> Choice của đồng đội trong khung thẻ */}
              {play.step.type === 'choice' && (
                <div className="pointer-events-auto max-h-[45vh] sm:max-h-[calc(100vh-6rem)] w-full overflow-y-auto rounded-2xl bg-white p-4 sm:p-5 shadow-2xl">
                  <Choice key={stepKey ?? undefined} step={play.step} feedback={play.feedback} />
                  {play.canContinue && (
                    <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={handleNextClick}
                        className="min-h-[44px] rounded-xl bg-[#f5b700] px-5 text-sm font-bold text-slate-900 shadow hover:brightness-105 active:scale-95"
                      >
                        {isLastStep ? tr(ST_W.finish) : tr(ST_W.next)}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* slide -> SlideView compact + TV */}
              {play.step.type === 'slide' && (
                <div className="pointer-events-auto w-full">
                  <SlideView
                    key={stepKey ?? undefined}
                    title={tr(play.step.title)}
                    body={tr(play.step.body)}
                    code={play.step.code}
                    compact={true}
                    zoomInLabel={tr(ST_W.zoomSlide)}
                    zoomOutLabel={tr(ST_W.minimizeSlide)}
                    expandLabel={tr(ST_W.expandNav)}
                    collapseLabel={tr(ST_W.collapseNav)}
                    seeAllLabel={tr(UI_TEXT.seeAll)}
                    nextLabel={isLastStep ? tr(ST_W.finish) : tr(ST_W.next)}
                    onNext={play.canContinue ? handleNextClick : undefined}
                  />
                </div>
              )}

              {/* question -> Question của đồng đội trong khung thẻ tờ đề dạng giấy */}
              {play.step.type === 'question' && (
                <div data-silver-paper="true" className="pointer-events-auto max-h-[45vh] sm:max-h-[calc(100vh-6rem)] w-full overflow-y-auto rounded-2xl border border-amber-200/80 bg-[#fffdfa] p-4 sm:p-5 shadow-2xl">
                  <Question key={stepKey ?? undefined} step={play.step} feedback={play.feedback} />
                  {play.canContinue && (
                    <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={handleNextClick}
                        className="min-h-[44px] rounded-xl bg-[#f5b700] px-5 text-sm font-bold text-slate-900 shadow hover:brightness-105 active:scale-95"
                      >
                        {isLastStep ? tr(ST_W.finish) : tr(ST_W.next)}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* order -> Order của đồng đội trong khung thẻ tờ đề dạng giấy */}
              {play.step.type === 'order' && (
                <div data-silver-paper="true" className="pointer-events-auto max-h-[45vh] sm:max-h-[calc(100vh-6rem)] w-full overflow-y-auto rounded-2xl border border-amber-200/80 bg-[#fffdfa] p-4 sm:p-5 shadow-2xl">
                  <Order key={stepKey ?? undefined} step={play.step} feedback={play.feedback} />
                  {play.canContinue && (
                    <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={handleNextClick}
                        className="min-h-[44px] rounded-xl bg-[#f5b700] px-5 text-sm font-bold text-slate-900 shadow hover:brightness-105 active:scale-95"
                      >
                        {isLastStep ? tr(ST_W.finish) : tr(ST_W.next)}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* code -> WorldDesktop */}
          {play.step.type === 'code' && (
            <WorldDesktop
              key={stepKey ?? undefined}
              step={play.step}
              feedback={play.feedback}
              hint={play.hint}
              onNext={handleNextClick}
            />
          )}
        </>
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

if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__SILVER_DEV__ = {
    useSilver,
    useActivityStore,
    useWalkStore,
  };
}

