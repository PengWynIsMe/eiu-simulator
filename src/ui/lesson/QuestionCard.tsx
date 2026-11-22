import { getLesson } from '../../data';
import { getCurrentStep, useLessonStore } from '../../store/useLessonStore';
import { TEXT } from '../text';
import CodeBlock from '../desktop/CodeBlock';
import { Avatar } from './DialogueBox';

export default function QuestionCard() {
  const lessonId = useLessonStore((s) => s.lessonId);
  const step = useLessonStore(getCurrentStep);
  const lastResult = useLessonStore((s) => s.lastResult);
  const answers = useLessonStore((s) => s.answers);
  if (step?.type !== 'question') return null;
  const teacherName = (lessonId ? getLesson(lessonId)?.teacherName : undefined) ?? '';
  const chosen = answers[step.id];
  const solved = lastResult?.correct === true;

  const optionStyle = (id: string) => {
    if (!lastResult || id !== chosen) return 'border-slate-300 text-slate-800 hover:border-[#0b3d91] hover:bg-slate-50';
    return lastResult.correct ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-red-500 bg-red-50 text-red-800';
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6">
      <div className="pointer-events-auto max-h-[85vh] w-full max-w-xl space-y-3 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center gap-3">
          <Avatar name={teacherName} />
          <div>
            <div className="text-sm font-bold text-[#0b3d91]">{teacherName}</div>
            <p className="text-[15px] text-slate-800">{step.prompt}</p>
          </div>
        </div>
        {step.code && <CodeBlock code={step.code} />}
        <div className="grid gap-2">
          {step.options.map((o) => (
            <button
              key={o.id}
              type="button"
              disabled={solved}
              onClick={() => useLessonStore.getState().chooseOption(o.id)}
              className={`min-h-[44px] rounded-xl border-2 px-4 py-2 text-left text-sm font-medium ${optionStyle(o.id)}`}
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}
            >
              {o.text}
            </button>
          ))}
        </div>
        {lastResult?.explain && (
          <p className={`rounded-xl p-3 text-sm ${lastResult.correct ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>{lastResult.explain}</p>
        )}
        {solved && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => useLessonStore.getState().nextStep()}
              className="min-h-[44px] rounded-xl bg-[#f5b700] px-6 text-sm font-bold text-slate-900 hover:brightness-105"
            >
              {TEXT.lessonNext}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
