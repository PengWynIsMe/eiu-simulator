import { getLesson } from '../../data';
import { getCurrentStep, useLessonStore } from '../../store/useLessonStore';
import { TEXT } from '../text';
import TeacherBubble from './TeacherBubble';
import SlideView from './views/SlideView';

/** Bản 2D của màn chiếu: một slide hiện tại của bước `lecture`. */
export default function SlideViewer() {
  const lessonId = useLessonStore((s) => s.lessonId);
  const step = useLessonStore(getCurrentStep);
  const slideIndex = useLessonStore((s) => s.slideIndex);
  if (step?.type !== 'lecture') return null;
  const slide = step.slides[slideIndex];
  if (!slide) return null;
  const teacherName = (lessonId ? getLesson(lessonId)?.teacherName : undefined) ?? '';

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6">
      <div className="max-h-full w-full max-w-2xl">
        <TeacherBubble key={step.id} teacherName={teacherName} />
        <SlideView
          title={slide.title}
          body={slide.body}
          code={slide.code}
          slideIndex={slideIndex}
          slideCount={step.slides.length}
          slideAriaLabel={`${TEXT.lessonSlideLabel} ${slideIndex + 1}/${step.slides.length}`}
          nextLabel={TEXT.lessonNext}
          onNext={() => useLessonStore.getState().nextSlide()}
        />
      </div>
    </div>
  );
}
