import { getLesson } from '../../data';
import { getCurrentStep, useLessonStore } from '../../store/useLessonStore';
import { TEXT, UI_TEXT, useT } from '../text';
import TeacherBubble from './TeacherBubble';
import SlideView from './views/SlideView';
import { useTrackRightColumn } from '../ActionPrompt';

/** Bản 2D của màn chiếu: cột mép phải hiển thị ghi chú ngắn, nút Phóng to và nút Tiếp. */
export default function SlideViewer() {
  const tr = useT();
  const lessonId = useLessonStore((s) => s.lessonId);
  const step = useLessonStore(getCurrentStep);
  const slideIndex = useLessonStore((s) => s.slideIndex);
  const containerRef = useTrackRightColumn(step?.type === 'lecture');

  if (step?.type !== 'lecture') return null;
  const slide = step.slides[slideIndex];
  if (!slide) return null;
  const teacherName = (lessonId ? getLesson(lessonId)?.teacherName : undefined) ?? '';

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed bottom-0 inset-x-0 z-40 p-2.5 sm:p-4 sm:landscape:bottom-4 sm:landscape:top-16 sm:landscape:right-4 sm:landscape:left-auto sm:landscape:w-[320px] lg:bottom-4 lg:top-16 lg:right-4 lg:left-auto lg:w-[380px] xl:w-[400px] flex flex-col justify-end"
    >
      <div className="pointer-events-auto self-start">
        <TeacherBubble key={step.id} teacherName={teacherName} />
      </div>
      <SlideView
        title={slide.title}
        body={slide.body}
        code={slide.code}
        slideIndex={slideIndex}
        slideCount={step.slides.length}
        slideAriaLabel={`${TEXT.lessonSlideLabel} ${slideIndex + 1}/${step.slides.length}`}
        compact={true}
        zoomInLabel={TEXT.lessonZoomSlide}
        zoomOutLabel={TEXT.lessonMinimizeSlide}
        expandLabel={tr(UI_TEXT.expand)}
        collapseLabel={tr(UI_TEXT.collapse)}
        seeAllLabel={tr(UI_TEXT.seeAll)}
        nextLabel={TEXT.lessonNext}
        onNext={() => useLessonStore.getState().nextSlide()}
      />
    </div>
  );
}
