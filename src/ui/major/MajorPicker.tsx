import type { Major } from '../../types';
import { useT } from '../text';
import { FACULTY_TEXT } from './facultyText';

interface Props {
  majors: Major[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Chip chọn ngành. Ngành thuộc ≥ 2 khoa → gom theo khoa có tiêu đề nhỏ. */
export default function MajorPicker({ majors, selectedId, onSelect }: Props) {
  const tr = useT();
  const faculties = [...new Set(majors.map((m) => m.facultyId))];
  const grouped = faculties.length >= 2;

  const chips = (list: Major[]) => (
    <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
      {list.map((m) => (
        <button
          key={m.id}
          type="button"
          aria-pressed={m.id === selectedId}
          onClick={() => onSelect(m.id)}
          className={`min-h-10 shrink-0 whitespace-nowrap rounded-full px-3.5 text-xs font-medium transition ${
            m.id === selectedId ? 'bg-sky-500 text-white shadow-sm' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
          }`}
        >
          {tr(m.name)}
        </button>
      ))}
    </div>
  );

  if (!grouped) return chips(majors);
  return (
    <div className="space-y-2">
      {faculties.map((f) => (
        <div key={f}>
          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{tr(FACULTY_TEXT[f])}</h4>
          {chips(majors.filter((m) => m.facultyId === f))}
        </div>
      ))}
    </div>
  );
}
