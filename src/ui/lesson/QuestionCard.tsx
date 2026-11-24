import { useEffect } from 'react';
import { getLesson } from '../../data';
import { getCurrentStep, useLessonStore } from '../../store/useLessonStore';
import { TEXT } from '../text';
import QuestionView from './views/QuestionView';
import { setRightColumnWidth } from '../ActionPrompt';

export default function QuestionCard() {
  const lessonId = useLessonStore((s) => s.lessonId);
  const step = useLessonStore(getCurrentStep);
  const lastResult = useLessonStore((s) => s.lastResult);
  const answers = useLessonStore((s) => s.answers);

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

  if (step?.type !== 'question') return null;
  const teacherName = (lessonId ? getLesson(lessonId)?.teacherName : undefined) ?? '';
  const chosen = answers[step.id];

  return (
    <div className="pointer-events-none fixed bottom-0 inset-x-0 z-40 p-2.5 sm:p-4 sm:landscape:bottom-4 sm:landscape:top-16 sm:landscape:right-4 sm:landscape:left-auto sm:landscape:w-[320px] lg:bottom-4 lg:top-16 lg:right-4 lg:left-auto lg:w-[380px] xl:w-[400px] flex flex-col justify-end">
      <QuestionView
        speakerName={teacherName}
        prompt={step.prompt}
        code={step.code}
        options={step.options}
        chosenId={chosen}
        result={lastResult}
        nextLabel={TEXT.lessonNext}
        onChoose={(id) => useLessonStore.getState().chooseOption(id)}
        onNext={() => useLessonStore.getState().nextStep()}
      />
    </div>
  );
}
