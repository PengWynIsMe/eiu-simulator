import { useT } from '../../text';
import { useSilver } from '../adapter';
import { ST } from '../text';
import EmptyView from '../parts/EmptyView';
import Panel from '../parts/Panel';
import PrimaryButton from '../parts/PrimaryButton';
import SecondaryButton from '../parts/SecondaryButton';

/** Màn hình tóm tắt câu chuyện khi người chơi vào thẳng một chương sau. */
export default function Recap() {
  const tr = useT();
  const recap = useSilver((s) => s.recap);
  const confirmRecap = useSilver((s) => s.confirmRecap);
  const exitRun = useSilver((s) => s.exitRun);

  if (!recap) {
    return <EmptyView />;
  }

  return (
    <Panel className="mx-auto max-w-xl">
      <h2 className="text-lg font-bold text-[#0b3d91] sm:text-xl">{tr(ST.recapTitle)}</h2>
      <p className="mt-3 text-[15px] leading-6 text-slate-700">{tr(recap.text)}</p>
      <p className="mt-3 text-[13px] leading-5 text-slate-500">{tr(ST.recapNote)}</p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <SecondaryButton onClick={exitRun}>{tr(ST.home)}</SecondaryButton>
        <PrimaryButton onClick={confirmRecap}>{tr(ST.start)}</PrimaryButton>
      </div>
    </Panel>
  );
}
