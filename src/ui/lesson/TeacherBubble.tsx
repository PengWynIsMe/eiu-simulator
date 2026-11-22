import { useEffect, useState } from 'react';
import { useLessonStore } from '../../store/useLessonStore';

/**
 * Bong bóng nhỏ hiện câu thầy đáp lại (lastResult.explain của bước hội thoại trước) trong 3 giây
 * kể từ lúc bước mới xuất hiện. Component cha mount lại theo bước (key) nên mỗi bước hiện đúng 1 lần.
 */
export default function TeacherBubble({ teacherName }: { teacherName: string }) {
  // Chụp câu đáp lúc mount: các lần chọn sau trong cùng bước không làm bong bóng hiện lại.
  const [reply] = useState(() => useLessonStore.getState().lastResult?.explain);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => setVisible(false), 3000);
    return () => window.clearTimeout(id);
  }, []);

  if (!reply || !visible) return null;
  return (
    <div className="pointer-events-none mb-2 w-fit max-w-full rounded-2xl rounded-bl-sm bg-white px-4 py-2 text-sm text-slate-800 shadow-lg">
      <span className="font-semibold text-[#0b3d91]">{teacherName}: </span>
      {reply}
    </div>
  );
}
