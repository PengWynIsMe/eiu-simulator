import { useState } from 'react';
import { useLessonStore } from '../../store/useLessonStore';
import { TEXT } from '../text';

/** Nút "Thoát buổi học" có bước xác nhận ngay tại chỗ. */
export default function ExitButton({ dark = false }: { dark?: boolean }) {
  const [asking, setAsking] = useState(false);
  const base = dark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-white/90 text-slate-700 shadow hover:bg-white';

  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className={`rounded-lg px-2.5 py-1 text-xs font-medium ${base}`}>
        {TEXT.lessonExit}
      </button>
    );
  }
  return (
    <span className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs ${base}`}>
      {TEXT.lessonExitConfirm}
      <button type="button" onClick={() => useLessonStore.getState().endLesson()} className="rounded bg-red-600 px-2 py-0.5 font-semibold text-white">
        {TEXT.lessonExitYes}
      </button>
      <button type="button" onClick={() => setAsking(false)} className="rounded bg-slate-200 px-2 py-0.5 text-slate-800">
        {TEXT.lessonExitNo}
      </button>
    </span>
  );
}
