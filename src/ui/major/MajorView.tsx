import { useMemo, useState } from 'react';
import type { ElectiveGroup, Major, StudyYear } from '../../types';
import { UI_TEXT, useT } from '../text';
import MajorCourses from './MajorCourses';
import MajorHeader from './MajorHeader';
import MajorOverview from './MajorOverview';
import MajorSpecializations from './MajorSpecializations';

type SubTab = 'overview' | 'courses' | 'specs';

/** Một ngành: đầu + 3 tab con + chân. Dùng `key={major.id}` ở nơi gọi để đổi ngành thì về Tổng quan / Năm 1 / Chung. */
export default function MajorView({ major }: { major: Major }) {
  const tr = useT();
  const [tab, setTab] = useState<SubTab>('overview');
  const [year, setYear] = useState<StudyYear>(1);
  const [specId, setSpecId] = useState<string | null>(null);

  const cur = major.curriculum;
  const hasSpecs = cur.specializations.length > 0;
  const otherGroups = useMemo<ElectiveGroup[]>(() => {
    const inSpec = new Set(cur.specializations.flatMap((s) => s.electiveGroupIds));
    return cur.electiveGroups.filter((g) => g.specializationId === undefined && !inSpec.has(g.id));
  }, [cur]);

  const tabs: { id: SubTab; label: string }[] = [
    { id: 'overview', label: tr(UI_TEXT.overview) },
    { id: 'courses', label: tr(UI_TEXT.courses) },
    ...(hasSpecs ? [{ id: 'specs' as const, label: tr(UI_TEXT.specializations) }] : []),
  ];

  return (
    <div className="space-y-3">
      <MajorHeader major={major} />

      <div className="-mx-4 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-white/10 px-4" role="tablist">
        {tabs.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={tab === x.id}
            onClick={() => setTab(x.id)}
            className={`min-h-10 shrink-0 whitespace-nowrap border-b-2 px-3 text-xs font-semibold transition ${
              tab === x.id ? 'border-sky-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <MajorOverview major={major} />}
      {tab === 'courses' && (
        <MajorCourses
          major={major}
          year={year}
          specId={specId}
          otherGroups={hasSpecs ? [] : otherGroups}
          onYear={setYear}
          onSpec={setSpecId}
        />
      )}
      {tab === 'specs' && hasSpecs && <MajorSpecializations major={major} otherGroups={otherGroups} />}

      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-2.5 text-[11px] text-slate-400">
        <span>
          {cur.source.year === null
            ? tr(UI_TEXT.sourceNoYear, { file: cur.source.file })
            : tr(UI_TEXT.source, { file: cur.source.file, year: cur.source.year })}
        </span>
        {major.contentStatus === 'chua-duyet' && (
          <span className="rounded bg-amber-400/20 px-1.5 py-0.5 font-semibold text-amber-300">{tr(UI_TEXT.contentDraft)}</span>
        )}
      </div>
    </div>
  );
}
