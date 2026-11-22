import { useEffect, useState } from 'react';
import { getLesson } from '../../data';
import { getCurrentStep, useLessonStore } from '../../store/useLessonStore';
import { TEXT } from '../text';
import { Avatar } from './DialogueBox';

const mmss = (ms: number) => {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

export default function LessonSummary() {
  const lessonId = useLessonStore((s) => s.lessonId);
  const step = useLessonStore(getCurrentStep);
  const stars = useLessonStore((s) => s.stars);
  const hintsUsed = useLessonStore((s) => s.hintsUsed);
  const startedAt = useLessonStore((s) => s.startedAt);
  const finishedAt = useLessonStore((s) => s.finishedAt);
  const [stamped, setStamped] = useState(false);

  useEffect(() => {
    // Trễ một nhịp để trình duyệt vẽ trạng thái đầu (to, mờ) rồi mới thu nhỏ lại = hiệu ứng đóng dấu.
    const id = window.setTimeout(() => setStamped(true), 350);
    return () => window.clearTimeout(id);
  }, []);

  const lesson = lessonId ? getLesson(lessonId) : undefined;
  if (!lesson || step?.type !== 'summary') return null;
  const elapsed = startedAt !== null && finishedAt !== null ? finishedAt - startedAt : 0;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6">
      <div className="pointer-events-auto max-h-[92vh] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl bg-white p-6 text-center shadow-2xl">
        <h2 className="text-2xl font-bold text-[#0b3d91]">{TEXT.summaryTitle}</h2>
        <div className="text-4xl tracking-widest" aria-label={`${stars}/3`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={i < stars ? 'text-[#f5b700]' : 'text-slate-300'}>
              {i < stars ? '★' : '☆'}
            </span>
          ))}
        </div>
        <div className="flex justify-center gap-6 text-sm text-slate-600">
          <span>
            {TEXT.summaryTime}: <b className="tabular-nums text-slate-800">{mmss(elapsed)}</b>
          </span>
          <span>
            {TEXT.summaryHints}: <b className="text-slate-800">{hintsUsed}</b>
          </span>
        </div>

        <div className="flex justify-center py-2">
          <div
            className={`flex h-28 w-28 items-center justify-center rounded-full border-4 border-red-600 p-2 text-center text-xs font-extrabold uppercase leading-4 text-red-600 transition-all duration-300 ease-out ${
              stamped ? 'opacity-90' : 'opacity-0'
            }`}
            style={{ transform: `rotate(-12deg) scale(${stamped ? 1 : 1.6})` }}
          >
            {lesson.passportStamp}
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-left">
          <Avatar name={lesson.teacherName} />
          <p className="text-sm leading-6 text-slate-700">{step.text}</p>
        </div>
        <button
          type="button"
          onClick={() => useLessonStore.getState().endLesson()}
          className="min-h-[44px] w-full rounded-xl bg-[#0b3d91] px-6 text-sm font-bold text-white hover:brightness-110"
        >
          {TEXT.summaryBack}
        </button>
      </div>
    </div>
  );
}
