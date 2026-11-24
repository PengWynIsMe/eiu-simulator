import { useEffect } from 'react';
import { getCurrentStep, useLessonStore } from '../../store/useLessonStore';
import { TEXT } from '../text';
import SlideView from './views/SlideView';
import { setRightColumnWidth } from '../ActionPrompt';

/** Bản 2D của màn chiếu: cột mép phải hiển thị ghi chú ngắn, nút Phóng to và nút Tiếp. */
export default function SlideViewer() {
  const step = useLessonStore(getCurrentStep);
  const slideIndex = useLessonStore((s) => s.slideIndex);

  useEffect(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
    if (w >= 1024) {
      setRightColumnWidth(380);
    } else if (w >= 640 && typeof window !== 'undefined' && window.matchMedia('(orientation: landscape)').matches) {
      setRightColumnWidth(320);
    } else {
      setRightColumnWidth(0);
    }
    return () => {
      setRightColumnWidth(0);
    };
  }, []);

  if (step?.type !== 'lecture') return null;
  const slide = step.slides[slideIndex];
  if (!slide) return null;

  return (
    <div className="pointer-events-none fixed bottom-0 inset-x-0 z-40 p-2.5 sm:p-4 sm:landscape:bottom-4 sm:landscape:top-16 sm:landscape:right-4 sm:landscape:left-auto sm:landscape:w-[320px] lg:bottom-4 lg:top-16 lg:right-4 lg:left-auto lg:w-[380px] xl:w-[400px] flex flex-col justify-end">
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
        nextLabel={TEXT.lessonNext}
        onNext={() => useLessonStore.getState().nextSlide()}
      />
    </div>
  );
}
