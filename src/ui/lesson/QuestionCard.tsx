import { getLesson } from '../../data';
import { getCurrentStep, useLessonStore } from '../../store/useLessonStore';
import { TEXT } from '../text';
import QuestionView from './views/QuestionView';

export default function QuestionCard() {
  const lessonId = useLessonStore((s) => s.lessonId);
  const step = useLessonStore(getCurrentStep);
  const lastResult = useLessonStore((s) => s.lastResult);
  const answers = useLessonStore((s) => s.answers);
  if (step?.type !== 'question') return null;
  const teacherName = (lessonId ? getLesson(lessonId)?.teacherName : undefined) ?? '';
  const chosen = answers[step.id];

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6">
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
