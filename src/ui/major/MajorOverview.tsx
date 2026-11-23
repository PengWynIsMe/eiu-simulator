import { useMemo } from 'react';
import type { Course, Major } from '../../types';
import { UI_TEXT, useT } from '../text';

function findCourse(major: Major, code: string): Course | undefined {
  const c = major.curriculum;
  for (const y of c.years) for (const x of y.courses) if (x.code === code) return x;
  for (const s of c.specializations) for (const x of s.requiredCourses) if (x.code === code) return x;
  for (const g of c.electiveGroups) for (const x of g.courses) if (x.code === code) return x;
  return undefined;
}

const heading = 'mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400';

export default function MajorOverview({ major }: { major: Major }) {
  const tr = useT();
  const highlights = useMemo(
    () => major.highlights.map((h) => ({ h, course: findCourse(major, h.code) })),
    [major],
  );

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-slate-200">{tr(major.summary)}</p>

      <div>
        <h4 className={heading}>{tr(UI_TEXT.highlights)}</h4>
        <ul className="space-y-1.5">
          {highlights.map(({ h, course }) => (
            <li key={h.code} className="rounded-lg border border-white/5 bg-slate-800/75 px-2.5 py-2 text-xs leading-relaxed text-slate-200">
              <div>
                <span className="mr-1 text-amber-300">⭐</span>
                <span className="mr-1.5 rounded bg-sky-500/20 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-sky-300">{h.code}</span>
                <span className="font-medium text-white">{course ? tr(course.name) : ''}</span>
              </div>
              <p className="mt-1 text-slate-300">{tr(h.why)}</p>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className={heading}>{tr(UI_TEXT.skills)}</h4>
        <ul className="flex flex-wrap gap-1.5">
          {major.skills.map((s) => (
            <li key={s.vi} className="rounded-full bg-sky-500/15 px-2.5 py-1 text-xs text-sky-100">{tr(s)}</li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className={heading}>{tr(UI_TEXT.careers)}</h4>
        <ul className="flex flex-wrap gap-1.5">
          {major.careers.map((s) => (
            <li key={s.vi} className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs text-emerald-100">{tr(s)}</li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className={heading}>
          {tr(UI_TEXT.dayInLife)} <span className="font-normal normal-case text-slate-500">({tr(UI_TEXT.illustrative)})</span>
        </h4>
        <ol className="space-y-1.5 border-l border-slate-600 pl-3">
          {major.dayInLife.map((d) => (
            <li key={d.time} className="relative text-xs leading-relaxed text-slate-200">
              <span className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-sky-400" />
              <span className="mr-2 font-mono font-semibold text-sky-300">{d.time}</span>
              {tr(d.text)}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
