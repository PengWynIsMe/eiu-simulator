import { useMemo } from 'react';
import type { ElectiveGroup, Major, StudyYear } from '../../types';
import { UI_TEXT, useT } from '../text';
import CourseRow from './CourseRow';
import ElectiveGroupList, { ElectiveGroupBlock } from './ElectiveGroupList';

const YEARS: StudyYear[] = [1, 2, 3, 4];

interface Props {
  major: Major;
  year: StudyYear;
  /** null = "Chung". */
  specId: string | null;
  /** Nhóm tự chọn không thuộc chuyên ngành nào — chỉ hiện ở đây khi ngành không có chuyên ngành. */
  otherGroups: ElectiveGroup[];
  onYear: (y: StudyYear) => void;
  onSpec: (id: string | null) => void;
}

const chipClass = (active: boolean) =>
  `min-h-10 shrink-0 whitespace-nowrap rounded-full px-3.5 text-xs font-medium transition ${
    active ? 'bg-sky-500 text-white shadow-sm' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
  }`;

export default function MajorCourses({ major, year, specId, otherGroups, onYear, onSpec }: Props) {
  const tr = useT();
  const cur = major.curriculum;

  const view = useMemo(() => {
    const plan = cur.years.find((y) => y.year === year);
    const spec = specId === null ? undefined : cur.specializations.find((s) => s.id === specId);
    const groupById = new Map(cur.electiveGroups.map((g) => [g.id, g]));
    return {
      courses: plan?.courses ?? [],
      specCourses: spec ? spec.requiredCourses.filter((c) => c.year === year) : [],
      hasSpecCourses: specId === null && cur.specializations.some((s) => s.requiredCourses.some((c) => c.year === year)),
      slots: (plan?.electiveSlots ?? []).flatMap((s) => {
        const group = groupById.get(s.groupId);
        return group ? [{ slot: s, group }] : [];
      }),
    };
  }, [cur, year, specId]);

  const specName = specId === null ? undefined : cur.specializations.find((s) => s.id === specId)?.name;
  const marked = (code: string) => {
    const c = view.courses.find((x) => x.code === code);
    return !cur.yearsInferred && c?.yearSource === 'ma-mon';
  };
  const anyMark = view.courses.some((c) => marked(c.code));
  const empty = view.courses.length === 0 && view.specCourses.length === 0 && view.slots.length === 0;

  return (
    <div className="space-y-3">
      {cur.yearsInferred && (
        <p className="rounded-lg border border-amber-400/25 bg-amber-400/10 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-100">
          {tr(UI_TEXT.yearsInferredNote)}
        </p>
      )}

      <div className="-mx-4 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4" role="tablist">
        {YEARS.map((y) => (
          <button key={y} type="button" role="tab" aria-selected={y === year} onClick={() => onYear(y)} className={chipClass(y === year)}>
            {tr(UI_TEXT.yearN, { n: y })}
          </button>
        ))}
      </div>

      {cur.specializations.length > 0 && (
        <div className="-mx-4 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4">
          <button type="button" aria-pressed={specId === null} onClick={() => onSpec(null)} className={chipClass(specId === null)}>
            {tr(UI_TEXT.commonTrack)}
          </button>
          {cur.specializations.map((s) => (
            <button key={s.id} type="button" aria-pressed={s.id === specId} onClick={() => onSpec(s.id)} className={chipClass(s.id === specId)}>
              {tr(s.name)}
            </button>
          ))}
        </div>
      )}

      <ul className="space-y-1.5">
        {view.courses.map((c) => (
          <CourseRow key={c.code} course={c} inferredMark={marked(c.code)} />
        ))}
        {view.specCourses.map((c) => (
          <CourseRow key={`spec-${c.code}`} course={c} tag={specName ? tr(specName) : undefined} />
        ))}
        {view.slots.map(({ slot, group }) => (
          <ElectiveGroupBlock key={`${group.id}-${slot.semester ?? 0}`} group={group} label={tr(UI_TEXT.electiveSlot, { group: tr(group.title), n: slot.credits })} />
        ))}
      </ul>

      {view.hasSpecCourses && <p className="text-[11px] text-slate-400">{tr(UI_TEXT.pickSpecHint)}</p>}
      {empty && !view.hasSpecCourses && <p className="text-xs text-slate-400">{tr(UI_TEXT.noCourses)}</p>}
      {anyMark && <p className="text-[11px] text-slate-400">{tr(UI_TEXT.yearFromCodeMark)}</p>}

      {otherGroups.length > 0 && (
        <div>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{tr(UI_TEXT.otherElectives)}</h4>
          <ElectiveGroupList groups={otherGroups} />
        </div>
      )}
    </div>
  );
}
