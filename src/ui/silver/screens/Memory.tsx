import { useEffect, useState, type MutableRefObject } from 'react';
import { useT } from '../../text';
import { useSilver } from '../adapter';
import { ST } from '../text';
import ConfirmDialog from '../parts/ConfirmDialog';
import EmptyView from '../parts/EmptyView';
import MemoryPage from '../parts/MemoryPage';
import Panel from '../parts/Panel';
import PrimaryButton from '../parts/PrimaryButton';
import SecondaryButton from '../parts/SecondaryButton';

interface MemoryProps {
  exitHandlerRef: MutableRefObject<(() => void) | null>;
}

/** Màn hình xem và lưu trang kỷ niệm cuối chương. */
export default function Memory({ exitHandlerRef }: MemoryProps) {
  const tr = useT();
  const memory = useSilver((s) => s.memory);
  const pickPhoto = useSilver((s) => s.pickPhoto);
  const saveMemory = useSilver((s) => s.saveMemory);
  const exitRun = useSilver((s) => s.exitRun);

  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);

  useEffect(() => {
    exitHandlerRef.current = () => setExitConfirmOpen(true);
    return () => {
      exitHandlerRef.current = null;
    };
  }, [exitHandlerRef]);

  if (!memory) {
    return <EmptyView />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Panel className="space-y-4">
        <h2 className="text-lg font-bold text-[#0b3d91] sm:text-xl">{tr(ST.memTitle)}</h2>
        <MemoryPage page={memory} onPickPhoto={pickPhoto} />

        {memory.hasOld && (
          <p className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-[14px] font-medium text-amber-950">
            {tr(ST.memAsk)}
          </p>
        )}

        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-200 bg-white/95 pt-3 backdrop-blur-sm sm:bg-transparent">
          {memory.hasOld ? (
            <>
              <SecondaryButton onClick={() => saveMemory('keep-old')}>
                {tr(ST.keepOld)}
              </SecondaryButton>
              <PrimaryButton onClick={() => saveMemory('replace')}>
                {tr(ST.replaceMem)}
              </PrimaryButton>
            </>
          ) : (
            <PrimaryButton onClick={() => saveMemory('replace')}>
              {tr(ST.saveMem)}
            </PrimaryButton>
          )}
        </div>
      </Panel>

      <ConfirmDialog
        open={exitConfirmOpen}
        title={tr(ST.exit)}
        body={tr(ST.memExit)}
        onCancel={() => setExitConfirmOpen(false)}
        onConfirm={() => {
          setExitConfirmOpen(false);
          exitRun();
        }}
      />
    </div>
  );
}
