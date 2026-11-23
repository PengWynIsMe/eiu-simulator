import { useState } from 'react';
import type { ElectiveGroup } from '../../types';
import { UI_TEXT, useT } from '../text';
import CourseRow from './CourseRow';

interface BlockProps {
  group: ElectiveGroup;
  /** Dòng nhãn; mặc định là tên nhóm + điều kiện. */
  label?: string;
}

/** Một nhóm tự chọn: dòng viền đứt, bấm mở danh sách môn + điều kiện. */
export function ElectiveGroupBlock({ group, label }: BlockProps) {
  const tr = useT();
  const [open, setOpen] = useState(false);
  const total = group.courses.length;
  const condition =
    group.minCredits !== undefined
      ? tr(UI_TEXT.chooseCredits, { n: group.minCredits, m: total })
      : tr(UI_TEXT.chooseCourses, { n: group.minCourses ?? 0, m: total });

  return (
    <li className="list-none rounded-lg border border-dashed border-slate-500/70 bg-slate-800/30">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-10 w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-xs text-slate-200"
      >
        <span className="min-w-0 break-words">{label ?? `${tr(group.title)} — ${condition}`}</span>
        <span className="shrink-0 text-slate-400">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="space-y-1.5 border-t border-dashed border-slate-500/50 px-2.5 py-2">
          <p className="text-[11px] font-medium text-sky-300">{condition}</p>
          {group.note && <p className="text-[11px] leading-relaxed text-slate-400">{tr(group.note)}</p>}
          <ul className="space-y-1.5">
            {group.courses.map((c) => (
              <CourseRow key={c.code} course={c} />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

export default function ElectiveGroupList({ groups }: { groups: ElectiveGroup[] }) {
  if (groups.length === 0) return null;
  return (
    <ul className="space-y-1.5">
      {groups.map((g) => (
        <ElectiveGroupBlock key={g.id} group={g} />
      ))}
    </ul>
  );
}
