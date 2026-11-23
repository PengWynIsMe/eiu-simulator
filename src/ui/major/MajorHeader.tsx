import type { Major } from '../../types';
import { UI_TEXT, useT } from '../text';
import { FACULTY_TEXT } from './facultyText';

export default function MajorHeader({ major }: { major: Major }) {
  const tr = useT();
  const { programCode, totalCredits } = major.curriculum;
  return (
    <div>
      <h3 className="text-base font-bold leading-snug text-white">{tr(major.name)}</h3>
      <p className="mt-0.5 text-xs text-sky-300/90">{tr(major.degree)}</p>
      <p className="mt-1 text-[11px] text-slate-400">
        {[
          tr(FACULTY_TEXT[major.facultyId]),
          totalCredits !== null ? tr(UI_TEXT.totalCredits, { n: totalCredits }) : null,
          programCode !== null ? tr(UI_TEXT.programCode, { code: programCode }) : null,
        ]
          .filter((x): x is string => x !== null)
          .join(' · ')}
      </p>
    </div>
  );
}
