import { useEffect } from 'react';
import { getCurrentStep, useLessonStore } from '../../store/useLessonStore';
import { sfx } from '../audio/sfx';
import MuteButton from './MuteButton';
import { useReviewStore } from '../../store/useReviewStore';
import EiuDesktop from '../desktop/EiuDesktop';
import { TEXT } from '../text';
import DialogueBox from './DialogueBox';
import ExitButton from './ExitButton';
import LessonHud, { LessonStarter } from './LessonHud';
import LessonSummary from './LessonSummary';
import QuestionCard from './QuestionCard';
import SlideViewer from './SlideViewer';

/** Lớp UI 2D của buổi học: chọn thành phần theo `phase` của useLessonStore. */
export default function LessonLayer() {
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).__LESSON_STORE__ = useLessonStore;
  }
  const phase = useLessonStore((s) => s.phase);
  const desktopOpen = useLessonStore((s) => s.desktopOpen);
  const reviewMode = useReviewStore((s) => s.reviewMode);

  // Esc khi đang ở máy ảo → thu máy lại. Bắt ở pha capture để WalkHud không thoát chế độ đi bộ theo.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const s = useLessonStore.getState();
      if (s.phase !== 'exercise' || !s.desktopOpen) return;
      event.stopImmediatePropagation();
      event.stopPropagation();
      s.closeDesktop();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);

  // Âm thanh: chuông khi bắt đầu / tan học; ting / bụp theo kết quả câu hỏi và bài tập.
  useEffect(() => {
    if (phase === 'goToClass' || phase === 'summary') sfx.bell();
  }, [phase]);
  useEffect(
    () =>
      useLessonStore.subscribe((s, prev) => {
        if (s.lastResult === prev.lastResult || !s.lastResult) return;
        const type = getCurrentStep(s)?.type;
        if (type !== 'question' && type !== 'exercise') return;
        if (s.lastResult.correct) sfx.correct();
        else sfx.wrong();
      }),
    [],
  );

  if (phase === 'idle') return reviewMode ? null : <LessonStarter />;

  const exercise = phase === 'exercise';
  return (
    <>
      {/* Bốn góc: Góc phải trên = nút hệ thống (Mute, Exit) ngay dưới TopBar */}
      <div className="fixed right-3 top-14 z-[45] flex items-center gap-2 sm:right-4 sm:top-16">
        <MuteButton />
        {!(exercise && desktopOpen) && <ExitButton />}
      </div>

      {/* Góc trái trên: trạng thái buổi học + chỉ đường */}
      <div className="fixed left-3 top-14 z-[45] flex flex-col items-start gap-2 sm:left-4 sm:top-16">
        {(phase === 'goToClass' || phase === 'findSeat') && <LessonHud />}
      </div>

      {/* Khi máy ảo đang thu: nút mở lại máy tính ở giữa dưới */}
      {exercise && !desktopOpen && (
        <div className="fixed bottom-8 left-1/2 z-40 -translate-x-1/2 select-none">
          <button
            type="button"
            onClick={() => useLessonStore.getState().openDesktop()}
            className="flex min-h-[48px] items-center gap-2 rounded-2xl bg-[#0b3d91] px-5 py-3 text-sm font-bold text-white shadow-2xl transition hover:brightness-110 active:scale-95"
          >
            <span>🖥</span>
            <span>{TEXT.lessonReopenDesktop}</span>
          </button>
        </div>
      )}

      {phase === 'dialogue' && <DialogueBox />}
      {phase === 'lecture' && <SlideViewer />}
      {phase === 'question' && <QuestionCard />}
      {exercise && <EiuDesktop open={desktopOpen} exitSlot={<ExitButton dark />} />}
      {phase === 'summary' && <LessonSummary />}
    </>
  );
}
