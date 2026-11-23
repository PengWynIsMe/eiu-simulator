import { useEffect, useState, type MutableRefObject } from 'react';
import type { Grade } from '../../../types/silver';
import { useT } from '../../text';
import { useSilver } from '../adapter';
import { fmt, ST } from '../text';
import ConfirmDialog from '../parts/ConfirmDialog';
import EmptyView from '../parts/EmptyView';
import Panel from '../parts/Panel';
import PrimaryButton from '../parts/PrimaryButton';

interface TranscriptProps {
  exitHandlerRef: MutableRefObject<(() => void) | null>;
}

const GRADE_COLOR: Record<Grade, string> = {
  A: 'text-emerald-700',
  B: 'text-[#0b3d91]',
  C: 'text-amber-700',
  D: 'text-slate-600',
};

/** Màn hình bảng điểm Anh văn của nhân vật cuối học kỳ Level 1..5. */
export default function Transcript({ exitHandlerRef }: TranscriptProps) {
  const tr = useT();
  const transcript = useSilver((s) => s.transcript);
  const confirmTranscript = useSilver((s) => s.confirmTranscript);
  const exitRun = useSilver((s) => s.exitRun);

  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);

  useEffect(() => {
    exitHandlerRef.current = () => setExitConfirmOpen(true);
    return () => {
      exitHandlerRef.current = null;
    };
  }, [exitHandlerRef]);

  if (!transcript) {
    return <EmptyView />;
  }

  const skills: { key: string; label: string; grade: Grade }[] = [
    { key: 'listening', label: tr(ST.listening), grade: transcript.listening },
    { key: 'reading', label: tr(ST.reading), grade: transcript.reading },
    { key: 'writing', label: tr(ST.writing), grade: transcript.writing },
    { key: 'speaking', label: tr(ST.speaking), grade: transcript.speaking },
  ];

  return (
    <Panel className="mx-auto max-w-2xl space-y-5">
      <h2 className="text-center text-lg font-bold text-[#0b3d91] sm:text-xl">
        {fmt(tr(ST.trTitle), { n: transcript.level })}
      </h2>

      {/* 2x2 ở 360px, 1x4 từ 768px */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {skills.map((skill) => (
          <div
            key={skill.key}
            role="group"
            aria-label={`${skill.label}: ${skill.grade}`}
            className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-center"
          >
            <span aria-hidden="true" className="text-sm font-medium text-slate-600">
              {skill.label}
            </span>
            <span
              aria-hidden="true"
              className={`mt-1 text-3xl font-extrabold ${GRADE_COLOR[skill.grade]}`}
            >
              {skill.grade}
            </span>
          </div>
        ))}
      </div>

      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-1 text-sm font-bold text-emerald-800">
          <span aria-hidden="true">✓</span>
          {fmt(tr(ST.passed), { n: transcript.level })}
        </span>
      </div>

      <p className="text-center text-[13px] leading-5 text-slate-600">{tr(ST.trNote)}</p>

      <div className="flex justify-end border-t border-slate-200 pt-4">
        <PrimaryButton onClick={confirmTranscript}>{tr(ST.continue)}</PrimaryButton>
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
    </Panel>
  );
}
