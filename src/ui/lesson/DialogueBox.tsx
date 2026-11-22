import { getLesson } from '../../data';
import { getCurrentStep, useLessonStore } from '../../store/useLessonStore';
import { TEXT } from '../text';
import { useTypewriter } from '../desktop/useTypewriter';
import TeacherBubble from './TeacherBubble';

/** Ảnh đại diện tròn: chữ cái đầu của tên (bỏ danh xưng "Thầy/Cô"). */
export function Avatar({ name, tone = 'blue' }: { name: string; tone?: 'blue' | 'gold' }) {
  const parts = name.trim().split(/\s+/);
  const initial = (parts[parts.length - 1] ?? name).charAt(0).toUpperCase();
  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white shadow ${
        tone === 'blue' ? 'bg-[#0b3d91]' : 'bg-[#f5b700] text-slate-900'
      }`}
    >
      {initial}
    </div>
  );
}

export default function DialogueBox() {
  const lessonId = useLessonStore((s) => s.lessonId);
  const step = useLessonStore(getCurrentStep);
  const teacherName = (lessonId ? getLesson(lessonId)?.teacherName : undefined) ?? '';
  const text = step?.type === 'dialogue' ? step.text : '';
  const { shown, done, skip } = useTypewriter(text, 30);

  if (step?.type !== 'dialogue') return null;
  const speakerName = step.speaker === 'teacher' ? teacherName : TEXT.lessonYou;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4">
      <div className="mx-auto max-w-3xl">
        <TeacherBubble key={step.id} teacherName={teacherName} />
        <div className="pointer-events-auto rounded-2xl bg-white p-4 shadow-2xl">
          <button type="button" onClick={skip} className="flex w-full cursor-pointer items-start gap-3 text-left" aria-label={speakerName}>
            <Avatar name={speakerName} tone={step.speaker === 'teacher' ? 'blue' : 'gold'} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-[#0b3d91]">{speakerName}</span>
              <span className="block min-h-[3rem] text-[15px] leading-6 text-slate-800">{shown}</span>
            </span>
          </button>
          <div className={`mt-3 flex flex-col gap-2 sm:flex-row ${done ? '' : 'invisible'}`}>
            {step.options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => useLessonStore.getState().chooseOption(o.id)}
                className="min-h-[44px] flex-1 rounded-xl border-2 border-[#0b3d91] px-4 py-2 text-sm font-medium text-[#0b3d91] hover:bg-[#0b3d91] hover:text-white"
              >
                {o.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
