import { useState } from 'react';
import type { ElectiveGroup, Major } from '../../types';
import { UI_TEXT, useT } from '../text';
import CourseRow from './CourseRow';
import ElectiveGroupList from './ElectiveGroupList';

interface Props {
  major: Major;
  otherGroups: ElectiveGroup[];
}

/** Mỗi chuyên ngành gập/mở: môn bắt buộc + nhóm tự chọn. Cuối tab: "Tự chọn khác". */
export default function MajorSpecializations({ major, otherGroups }: Props) {
  const tr = useT();
  const [openId, setOpenId] = useState<string | null>(null);
  const { specializations, electiveGroups } = major.curriculum;

  return (
    <div className="space-y-2">
      {specializations.map((s) => {
        const open = s.id === openId;
        const groups = electiveGroups.filter((g) => s.electiveGroupIds.includes(g.id) || g.specializationId === s.id);
        return (
          <section key={s.id} className="rounded-xl border border-white/10 bg-slate-800/45">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : s.id)}
              className="flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-semibold text-white"
            >
              <span className="min-w-0 break-words">{tr(s.name)}</span>
              <span className="shrink-0 text-slate-400">{open ? '▴' : '▾'}</span>
            </button>
            {open && (
              <div className="space-y-2 border-t border-white/10 px-3 py-2.5">
                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{tr(UI_TEXT.requiredCourses)}</h4>
                <ul className="space-y-1.5">
                  {s.requiredCourses.map((c) => (
                    <CourseRow key={c.code} course={c} />
                  ))}
                </ul>
                {groups.length > 0 && (
                  <>
                    <h4 className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{tr(UI_TEXT.electiveGroups)}</h4>
                    <ElectiveGroupList groups={groups} />
                  </>
                )}
              </div>
            )}
          </section>
        );
      })}

      {otherGroups.length > 0 && (
        <div className="pt-1">
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{tr(UI_TEXT.otherElectives)}</h4>
          <ElectiveGroupList groups={otherGroups} />
        </div>
      )}
    </div>
  );
}
