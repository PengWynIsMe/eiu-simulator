import { useEffect, useState, type MutableRefObject } from 'react';
import type { RegistrationRow } from '../../../types/silver';
import { useT } from '../../text';
import { useSilver } from '../adapter';
import { fmt, ST } from '../text';
import ConfirmDialog from '../parts/ConfirmDialog';
import EmptyView from '../parts/EmptyView';
import Panel from '../parts/Panel';
import PrimaryButton from '../parts/PrimaryButton';
import SecondaryButton from '../parts/SecondaryButton';
import WeekGrid from '../parts/WeekGrid';

interface RegistrationProps {
  exitHandlerRef: MutableRefObject<(() => void) | null>;
}

const MIN_COURSES = 3;

function getStatusNote(row: RegistrationRow, tr: (t: { vi: string; en: string }) => string): string | null {
  if (row.locked) return tr(ST.lockedCore);
  switch (row.status.code) {
    case 'missing-prereq':
      return fmt(tr(ST.needPrereq), { codes: row.status.missing.join(', ') });
    case 'needs-confirmation':
      return tr(ST.needConfirm);
    case 'no-content':
      return tr(ST.noContent);
    case 'done':
      return `✓ ${tr(ST.alreadyDone)}`;
    case 'available':
      return null;
  }
}

/** Màn hình đăng ký môn học cho học kỳ chuyên ngành. */
export default function Registration({ exitHandlerRef }: RegistrationProps) {
  const tr = useT();
  const registration = useSilver((s) => s.registration);
  const toggleCourse = useSilver((s) => s.toggleCourse);
  const resetRegistration = useSilver((s) => s.resetRegistration);
  const confirmRegistration = useSilver((s) => s.confirmRegistration);
  const exitRun = useSilver((s) => s.exitRun);

  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);

  useEffect(() => {
    exitHandlerRef.current = () => setExitConfirmOpen(true);
    return () => {
      exitHandlerRef.current = null;
    };
  }, [exitHandlerRef]);

  if (!registration || registration.rows.length === 0) {
    return <EmptyView />;
  }

  const selectedCount = registration.rows.filter((r) => r.selected).length;
  const totalsText = fmt(tr(ST.totals), {
    n: selectedCount,
    c: registration.credits,
    m: registration.minutes,
  });

  const problemText =
    registration.problem === 'too-few'
      ? fmt(tr(ST.tooFew), { min: MIN_COURSES })
      : registration.problem === 'too-many'
        ? fmt(tr(ST.tooMany), { max: registration.maxCourses })
        : null;

  const suggestedRows = registration.rows.filter((r) => r.status.code === 'available' && r.suggested);
  const otherRows = registration.rows.filter((r) => r.status.code === 'available' && !r.suggested);
  const unavailableRows = registration.rows.filter((r) => r.status.code !== 'available');

  const rowGroups = [
    { key: 'suggested', label: tr(ST.suggested), rows: suggestedRows },
    { key: 'others', label: tr(ST.others), rows: otherRows },
    { key: 'unavailable', label: tr(ST.unavailable), rows: unavailableRows },
  ].filter((g) => g.rows.length > 0);

  const weekSummaryBlock = (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5" aria-live="polite">
        <p className="text-sm font-bold text-[#0b3d91]">{totalsText}</p>
        {problemText && (
          <p className="mt-1.5 text-[13px] font-semibold text-red-700">
            <span aria-hidden="true" className="mr-1">
              ✕
            </span>
            {problemText}
          </p>
        )}
        {registration.minutes > 35 && (
          <p className="mt-1.5 text-[13px] font-medium text-amber-800">
            <span aria-hidden="true" className="mr-1">
              ⚠
            </span>
            {tr(ST.longTerm)}
          </p>
        )}
      </div>

      <p className="text-xs text-slate-500">{tr(ST.slotNote)}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <Panel className="space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <h2 className="text-lg font-bold text-[#0b3d91] sm:text-xl">
            {tr(ST.regTitle)} — {registration.chapterId}
          </h2>
          <p className="mt-1 text-[15px] leading-6 text-slate-600">
            {fmt(tr(ST.regHelp), { min: MIN_COURSES, max: registration.maxCourses })}
          </p>
        </div>

        {/* 1440: 3:2, 768: 1:1, 360: 1 cột */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-5">
          {/* Danh sách môn */}
          <div className="space-y-5 md:col-span-1 lg:col-span-3">
            {rowGroups.map((group) => (
              <section key={group.key} aria-label={group.label} className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">
                  {group.label}
                </h3>
                <div className="space-y-2">
                  {group.rows.map((row) => {
                    const disabled = row.locked || row.status.code !== 'available';
                    const statusNote = getStatusNote(row, tr);
                    const isBlocked = row.locked || row.status.code !== 'available';

                    return (
                      <label
                        key={row.code}
                        className={`flex items-start gap-3 rounded-xl border p-3 transition ${
                          row.selected
                            ? 'border-[#0b3d91] bg-sky-50/60'
                            : row.status.code !== 'available'
                              ? 'border-slate-200 bg-slate-100/70 opacity-75'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <input
                          type="checkbox"
                          checked={row.selected}
                          disabled={disabled}
                          onChange={() => toggleCourse(row.code)}
                          className="mt-1 h-4 w-4 shrink-0 accent-[#0b3d91] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                        />

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {isBlocked && row.status.code !== 'done' && (
                              <span aria-hidden="true" className="text-sm">
                                🔒
                              </span>
                            )}
                            <span className="font-bold text-[#0b3d91]">{row.code}</span>
                            <span className="break-words text-[15px] font-medium text-slate-800">
                              {tr(row.name)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                              {fmt(tr(ST.credits), { n: row.credits })}
                            </span>
                            {row.lab && (
                              <span className="rounded bg-indigo-50 px-2 py-0.5 font-medium text-indigo-800">
                                {tr(ST.hasLab)}
                              </span>
                            )}
                            {row.tier === 'core' && (
                              <span className="rounded border border-amber-300 bg-amber-100 px-2 py-0.5 font-semibold text-amber-900">
                                {tr(ST.core)}
                              </span>
                            )}
                            {row.tier === 'summary' && (
                              <span className="rounded border border-sky-200 bg-sky-100 px-2 py-0.5 font-medium text-sky-900">
                                {tr(ST.summaryTier)}
                              </span>
                            )}
                            {row.tier === 'quick' && (
                              <span className="rounded border border-slate-300 bg-slate-200 px-2 py-0.5 font-medium text-slate-700">
                                {tr(ST.quick)}
                              </span>
                            )}
                          </div>

                          {row.tier === 'quick' && (
                            <p className="text-[12px] text-slate-500">{tr(ST.quickTip)}</p>
                          )}

                          {statusNote && (
                            <p className="text-[13px] font-medium text-slate-600">{statusNote}</p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* Cột phải: Tuần dự kiến (gọn trong <details> ở 360px) */}
          <div className="space-y-4 md:col-span-1 lg:col-span-2">
            <details className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 md:hidden">
              <summary className="cursor-pointer text-sm font-bold text-[#0b3d91] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
                {tr(ST.week)}
              </summary>
              <div className="mt-3 space-y-3">
                <WeekGrid meetings={registration.meetings} />
                <p className="text-xs text-slate-500">{tr(ST.slotNote)}</p>
              </div>
            </details>

            <div className="hidden space-y-3 md:block">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">
                {tr(ST.week)}
              </h3>
              <WeekGrid meetings={registration.meetings} />
              {weekSummaryBlock}
            </div>
          </div>
        </div>
      </Panel>

      {/* Chân màn dính đáy: hiện tóm tắt ở 360px + hai nút hành động */}
      <div className="sticky bottom-0 z-10 space-y-2 rounded-t-2xl border border-b-0 border-slate-200/80 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg sm:px-5 sm:py-3.5">
        <div className="md:hidden" aria-live="polite">
          <p className="text-xs font-bold text-[#0b3d91]">{totalsText}</p>
          {problemText && (
            <p className="text-xs font-semibold text-red-700">
              <span aria-hidden="true" className="mr-1">
                ✕
              </span>
              {problemText}
            </p>
          )}
          {registration.minutes > 35 && (
            <p className="text-xs font-medium text-amber-800">
              <span aria-hidden="true" className="mr-1">
                ⚠
              </span>
              {tr(ST.longTerm)}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <SecondaryButton onClick={resetRegistration}>{tr(ST.useSuggested)}</SecondaryButton>
          <PrimaryButton
            disabled={registration.problem !== null}
            onClick={confirmRegistration}
          >
            {tr(ST.confirmReg)}
          </PrimaryButton>
        </div>
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
