import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { useT } from '../../text';
import { useSilver } from '../adapter';
import { fmt, ST } from '../text';
import ConfirmDialog from '../parts/ConfirmDialog';
import EmptyView from '../parts/EmptyView';
import Panel from '../parts/Panel';
import PrimaryButton from '../parts/PrimaryButton';
import WeekGrid, { getKindLabel } from '../parts/WeekGrid';

interface WeekProps {
  exitHandlerRef: MutableRefObject<(() => void) | null>;
}

/** Màn hình tuần học: xem lịch đã xếp và vào từng buổi học kế tiếp. */
export default function Week({ exitHandlerRef }: WeekProps) {
  const tr = useT();
  const week = useSilver((s) => s.week);
  const playNext = useSilver((s) => s.playNext);
  const exitRun = useSilver((s) => s.exitRun);

  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    exitHandlerRef.current = () => setExitConfirmOpen(true);
    return () => {
      exitHandlerRef.current = null;
    };
  }, [exitHandlerRef]);

  const meetingsCount = week?.meetings.length ?? 0;
  const doneCount = week ? week.meetings.filter((m) => m.done).length : 0;

  useEffect(() => {
    if (meetingsCount === 0) return;
    const currentEl = rootRef.current?.querySelector<HTMLElement>('[data-current="true"]');
    currentEl?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  }, [week?.chapterId, doneCount, meetingsCount]);

  if (!week || week.meetings.length === 0) {
    return <EmptyView />;
  }

  const total = week.meetings.length;
  const current = week.meetings.find((m) => m.current);
  const days = tr(ST.days).split(' ');
  const slots = tr(ST.slots).split(' · ');

  let nextSessionSummary = '';
  if (current) {
    const nameObj = week.names[current.code];
    const courseName = nameObj ? tr(nameObj) : current.code;
    const kindLabel = getKindLabel(current.kind, tr);
    const dayLabel = days[current.day] ?? '';
    const slotLabel = slots[current.slot] ?? '';
    nextSessionSummary = fmt(tr(ST.nextSession), {
      name: `${courseName} — ${kindLabel} · ${dayLabel}, ${slotLabel}`,
    });
  }

  return (
    <div ref={rootRef} className="space-y-4">
      <Panel className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <h2 className="text-lg font-bold text-[#0b3d91] sm:text-xl">
            {tr(ST.weekTitle)} — {week.chapterId}
          </h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-[#0b3d91]">
            {fmt(tr(ST.sessions), { i: doneCount, n: total })}
          </span>
        </div>

        {doneCount === 0 && current && (
          <p className="rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-[14px] text-sky-900">
            {tr(ST.weekStart)}
          </p>
        )}

        <WeekGrid meetings={week.meetings} names={week.names} />

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <span>
            <span aria-hidden="true" className="mr-1 font-bold text-emerald-700">
              ✓
            </span>
            {tr(ST.sDone)}
          </span>
          <span>
            <span aria-hidden="true" className="mr-1 font-bold text-[#0b3d91]">
              ▶
            </span>
            {tr(ST.sNow)}
          </span>
          <span>{tr(ST.sLater)}</span>
        </div>
      </Panel>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-lg backdrop-blur-sm sm:px-5 sm:py-3.5">
        <p className="min-w-0 flex-1 text-[14px] font-medium text-slate-700">
          {current ? nextSessionSummary : tr(ST.weekDone)}
        </p>
        <PrimaryButton onClick={playNext}>
          {current ? tr(ST.enter) : tr(ST.toExam)}
        </PrimaryButton>
      </div>

      <ConfirmDialog
        open={exitConfirmOpen}
        title={tr(ST.exit)}
        body={tr(ST.confirmExit)}
        onCancel={() => setExitConfirmOpen(false)}
        onConfirm={() => {
          setExitConfirmOpen(false);
          exitRun();
        }}
      />
    </div>
  );
}
