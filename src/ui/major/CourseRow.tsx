import type { Course } from '../../types';
import { UI_TEXT, useT } from '../text';

interface Props {
  course: Course;
  /** Tên chuyên ngành nếu môn này là môn bắt buộc riêng của chuyên ngành đang lọc. */
  tag?: string;
  /** Dấu `*` khi năm của môn suy từ mã môn trong một bản BM08. */
  inferredMark?: boolean;
}

export default function CourseRow({ course, tag, inferredMark }: Props) {
  const tr = useT();
  return (
    <li className="flex items-start gap-2 rounded-lg border border-white/5 bg-slate-800/75 px-2.5 py-1.5 text-xs leading-relaxed text-slate-200">
      <span className="mt-px shrink-0 rounded bg-sky-500/20 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-sky-300">{course.code}</span>
      <span className="min-w-0 flex-1 break-words">
        {tr(course.name)}
        {inferredMark && <span className="ml-0.5 text-amber-300">*</span>}
        {tag && <span className="ml-1.5 rounded bg-emerald-400/15 px-1 py-0.5 text-[10px] text-emerald-300">{tag}</span>}
      </span>
      {course.semester !== undefined && (
        <span className="mt-px shrink-0 text-[10px] text-slate-400">{tr(UI_TEXT.semesterN, { n: course.semester })}</span>
      )}
      <span className="shrink-0 font-semibold text-slate-300">{tr(UI_TEXT.credits, { n: course.credits })}</span>
    </li>
  );
}
