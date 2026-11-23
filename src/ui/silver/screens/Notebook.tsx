import { useT } from '../../text';
import { useSilver } from '../adapter';
import { fmt, ST } from '../text';
import MemoryPage from '../parts/MemoryPage';
import Panel from '../parts/Panel';
import SecondaryButton from '../parts/SecondaryButton';

/** Màn hình sổ kỷ niệm tập hợp các trang đã lưu theo từng chương. */
export default function Notebook() {
  const tr = useT();
  const notebook = useSilver((s) => s.notebook);
  const openHome = useSilver((s) => s.openHome);

  if (notebook.length === 0) {
    return (
      <Panel className="mx-auto max-w-md space-y-4 text-center">
        <div aria-hidden="true" className="text-4xl">
          📖
        </div>
        <h2 className="text-lg font-bold text-[#0b3d91]">{tr(ST.nbTitle)}</h2>
        <p className="text-[15px] leading-6 text-slate-600">{tr(ST.nbEmpty)}</p>
        <div className="pt-1">
          <SecondaryButton onClick={openHome}>{tr(ST.home)}</SecondaryButton>
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="mb-4 space-y-4 sm:mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-bold text-[#0b3d91] sm:text-xl">{tr(ST.nbTitle)}</h2>
          <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-[#0b3d91]">
            {fmt(tr(ST.nbCount), { n: notebook.length })}
          </span>
        </div>

        <SecondaryButton onClick={openHome}>{tr(ST.home)}</SecondaryButton>
      </div>

      {/* 1440px: 2 trang một hàng; nhỏ hơn: 1 cột */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {notebook.map((page, idx) => (
          <MemoryPage key={`${page.chapterId}-${idx}`} page={page} />
        ))}
      </div>
    </Panel>
  );
}
