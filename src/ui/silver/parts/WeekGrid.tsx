import type { LocalizedText } from '../../../types';
import type { Meeting, SessionKind } from '../../../types/silver';
import { useT } from '../../text';
import { ST } from '../text';

export interface WeekGridMeeting extends Meeting {
  done?: boolean;
  current?: boolean;
}

interface WeekGridProps {
  meetings: WeekGridMeeting[];
  names?: Record<string, LocalizedText>;
}

const COURSE_PALETTE = ['#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#ede9fe', '#e2e8f0'] as const;

function buildCourseColorMap(meetings: WeekGridMeeting[]): Map<string, string> {
  const map = new Map<string, string>();
  let idx = 0;
  for (const m of meetings) {
    if (!map.has(m.code)) {
      const color = COURSE_PALETTE[idx % COURSE_PALETTE.length] ?? '#e2e8f0';
      map.set(m.code, color);
      idx += 1;
    }
  }
  return map;
}

export function getKindLabel(kind: SessionKind, tr: (t: LocalizedText) => string): string {
  if (kind === 'lab') return tr(ST.lab);
  if (kind === 'project') return tr(ST.project);
  return tr(ST.theory);
}

/** Lịch tuần 6 cột × 4 ca (desktop/tablet) và danh sách theo ngày (360px). */
export default function WeekGrid({ meetings, names }: WeekGridProps) {
  const tr = useT();
  const days = tr(ST.days).split(' ');
  const slots = tr(ST.slots).split(' · ');
  const colors = buildCourseColorMap(meetings);

  const cellMap = new Map<string, WeekGridMeeting>();
  const spanned = new Set<string>();
  for (const m of meetings) {
    const key = `${m.day}-${m.slot}`;
    cellMap.set(key, m);
    if (m.length === 2 && m.slot < 3) {
      spanned.add(`${m.day}-${m.slot + 1}`);
    }
  }

  const getAriaLabel = (m: WeekGridMeeting): string => {
    const courseEntry = names?.[m.code];
    const courseName = courseEntry ? tr(courseEntry) : '';
    const kindLabel = getKindLabel(m.kind, tr);
    const dayLabel = days[m.day] ?? '';
    const slotLabel = slots[m.slot] ?? '';
    const statusText = m.current
      ? tr(ST.sNow)
      : m.done
        ? tr(ST.sDone)
        : m.done === false
          ? tr(ST.sLater)
          : '';
    return [m.code, courseName, kindLabel, dayLabel, slotLabel, statusText].filter(Boolean).join(', ');
  };

  return (
    <div>
      {/* Bảng 6x4 cho màn từ 640px trở lên */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr>
              <th className="w-20 border border-slate-200 bg-slate-100 p-2 font-semibold text-slate-600" />
              {days.map((day, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className="border border-slate-200 bg-slate-100 p-2 text-center font-bold text-[#0b3d91]"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slotLabel, slotIdx) => (
              <tr key={slotIdx}>
                <th
                  scope="row"
                  className="border border-slate-200 bg-slate-50 p-2 text-[11px] font-semibold text-slate-600"
                >
                  {slotLabel}
                </th>
                {days.map((_, dayIdx) => {
                  const key = `${dayIdx}-${slotIdx}`;
                  if (spanned.has(key)) return null;
                  const meeting = cellMap.get(key);
                  if (!meeting) {
                    return <td key={key} className="h-12 border border-slate-200 bg-white/70 p-1.5" />;
                  }
                  const bg = colors.get(meeting.code) ?? '#e2e8f0';
                  const isCurrent = Boolean(meeting.current);
                  const isDone = Boolean(meeting.done);
                  return (
                    <td
                      key={key}
                      rowSpan={meeting.length === 2 ? 2 : 1}
                      aria-label={getAriaLabel(meeting)}
                      style={{ backgroundColor: bg }}
                      className={`border border-slate-300 p-2 align-top transition ${
                        isCurrent
                          ? 'ring-2 ring-inset ring-[#f5b700]'
                          : isDone
                            ? 'opacity-75'
                            : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-bold text-slate-900">{meeting.code}</span>
                        {isDone && (
                          <span aria-hidden="true" className="font-bold text-emerald-700">
                            ✓
                          </span>
                        )}
                        {isCurrent && (
                          <span aria-hidden="true" className="font-bold text-[#0b3d91]">
                            ▶
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] font-medium text-slate-700">
                        {getKindLabel(meeting.kind, tr)}
                      </p>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Danh sách theo ngày cho màn 360px (bỏ ngày trống) */}
      <div className="space-y-2.5 sm:hidden">
        {days.map((dayLabel, dayIdx) => {
          const dayMeetings = meetings
            .filter((m) => m.day === dayIdx)
            .sort((a, b) => a.slot - b.slot);
          if (dayMeetings.length === 0) return null;

          return (
            <div key={dayIdx} className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
              <h4 className="mb-1.5 text-xs font-bold text-[#0b3d91]">{dayLabel}</h4>
              <ul className="space-y-1.5">
                {dayMeetings.map((m, idx) => {
                  const bg = colors.get(m.code) ?? '#e2e8f0';
                  const slotText =
                    m.length === 2 && slots[m.slot + 1]
                      ? `${slots[m.slot]} – ${slots[m.slot + 1]}`
                      : (slots[m.slot] ?? '');
                  return (
                    <li
                      key={`${m.code}-${m.slot}-${idx}`}
                      data-current={m.current ? 'true' : undefined}
                      aria-label={getAriaLabel(m)}
                      style={{ backgroundColor: bg }}
                      className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-xs ${
                        m.current
                          ? 'border-[#f5b700] ring-2 ring-[#f5b700]'
                          : m.done
                            ? 'border-slate-300 opacity-75'
                            : 'border-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900">
                          {m.code} · {getKindLabel(m.kind, tr)}
                        </p>
                        <p className="text-[11px] text-slate-700">{slotText}</p>
                      </div>
                      {m.done && (
                        <span aria-hidden="true" className="shrink-0 font-bold text-emerald-700">
                          ✓
                        </span>
                      )}
                      {m.current && (
                        <span aria-hidden="true" className="shrink-0 font-bold text-[#0b3d91]">
                          ▶
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
