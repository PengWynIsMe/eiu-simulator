import { getLesson } from '../../data';
import { getCurrentStep, useLessonStore } from '../../store/useLessonStore';
import { TEXT } from '../text';
import CodeBlock from '../desktop/CodeBlock';
import TeacherBubble from './TeacherBubble';

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
        <div className="pointer-events-auto max-h-[80vh] space-y-3 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
          <h2 className="text-xl font-bold text-[#0b3d91] sm:text-2xl">{slide.title}</h2>
          {slide.code && <CodeBlock code={slide.code} />}
          <p className="text-[15px] leading-7 text-slate-700">{slide.body}</p>
          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-2" aria-label={`${TEXT.lessonSlideLabel} ${slideIndex + 1}/${step.slides.length}`}>
              {step.slides.map((_, i) => (
                <span key={i} className={`h-3 w-3 rounded-full ${i === slideIndex ? 'bg-[#0b3d91]' : 'bg-slate-300'}`} />
              ))}
            </div>
            <button
              type="button"
              onClick={() => useLessonStore.getState().nextSlide()}
              className="min-h-[44px] rounded-xl bg-[#f5b700] px-6 text-sm font-bold text-slate-900 hover:brightness-105"
            >
              {TEXT.lessonNext}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
