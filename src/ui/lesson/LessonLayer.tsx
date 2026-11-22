import { useEffect } from 'react';
import { useLessonStore } from '../../store/useLessonStore';
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
  const phase = useLessonStore((s) => s.phase);
  const desktopOpen = useLessonStore((s) => s.desktopOpen);
  const reviewMode = useReviewStore((s) => s.reviewMode);

  // Esc khi đang ở máy ảo → thu máy lại. Bắt ở pha capture để WalkHud không thoát chế độ đi bộ theo.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const s = useLessonStore.getState();
      if (s.phase !== 'exercise' || !s.desktopOpen) return;
      event.stopPropagation();
      s.closeDesktop();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);

  if (phase === 'idle') return reviewMode ? null : <LessonStarter />;

  const exercise = phase === 'exercise';
  return (
    <>
      <div className="fixed left-3 top-14 z-[45] flex flex-col items-start gap-2 sm:left-4 sm:top-16">
        {(phase === 'goToClass' || phase === 'findSeat') && <LessonHud />}
        {!(exercise && desktopOpen) && <ExitButton />}
        {exercise && !desktopOpen && (
          <button
            type="button"
            onClick={() => useLessonStore.getState().openDesktop()}
            className="min-h-[44px] rounded-xl bg-[#0b3d91] px-4 text-sm font-semibold text-white shadow-lg hover:brightness-110"
          >
            {TEXT.lessonReopenDesktop}
          </button>
        )}
      </div>

      {phase === 'dialogue' && <DialogueBox />}
      {phase === 'lecture' && <SlideViewer />}
      {phase === 'question' && <QuestionCard />}
      {exercise && <EiuDesktop open={desktopOpen} exitSlot={<ExitButton dark />} />}
      {phase === 'summary' && <LessonSummary />}
    </>
  );
}
