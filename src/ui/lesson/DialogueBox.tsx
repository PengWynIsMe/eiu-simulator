import { getLesson } from '../../data';
import { getCurrentStep, useLessonStore } from '../../store/useLessonStore';
import { TEXT } from '../text';
import TeacherBubble from './TeacherBubble';
import DialogueView, { Avatar } from './views/DialogueView';

export { Avatar };

export default function DialogueBox() {
  const lessonId = useLessonStore((s) => s.lessonId);
  const step = useLessonStore(getCurrentStep);
  const teacherName = (lessonId ? getLesson(lessonId)?.teacherName : undefined) ?? '';

  if (step?.type !== 'dialogue') return null;
  const speakerName = step.speaker === 'teacher' ? teacherName : TEXT.lessonYou;
  const hasOptions = Boolean(step.options && step.options.length > 0);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 px-3 sm:bottom-5 sm:px-4">
      <div className="mx-auto w-full max-w-[640px]">
        <TeacherBubble key={step.id} teacherName={teacherName} />
        <DialogueView
          speakerName={speakerName}
          avatarTone={step.speaker === 'teacher' ? 'blue' : 'gold'}
          text={step.text}
          options={step.options}
          onChoose={(id) => useLessonStore.getState().chooseOption(id)}
          onNext={hasOptions ? undefined : () => useLessonStore.getState().nextStep()}
        />
      </div>
    </div>
  );
}
