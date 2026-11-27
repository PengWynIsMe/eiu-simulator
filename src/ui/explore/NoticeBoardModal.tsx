import { CAMPUS_NOTICES } from '../../data/explore';
import { useExploreStore } from '../../store/useExploreStore';
import { useLangStore } from '../../store/useLangStore';
import { UI_TEXT, useT } from '../text';

export default function NoticeBoardModal() {
  const tr = useT();
  const lang = useLangStore((s) => s.lang);
  const noticeBoardOpen = useExploreStore((s) => s.noticeBoardOpen);
  const setNoticeBoardOpen = useExploreStore((s) => s.setNoticeBoardOpen);

  if (!noticeBoardOpen) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tr(UI_TEXT.exploreNoticeTitle)}
        className="w-full max-w-lg rounded-3xl border border-white/15 bg-slate-900 p-5 text-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-lg font-bold">📌 {tr(UI_TEXT.exploreNoticeTitle)}</h2>
          <button
            type="button"
            onClick={() => setNoticeBoardOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm hover:bg-white/20"
            aria-label={tr(UI_TEXT.close)}
          >
            ✕
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {CAMPUS_NOTICES.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
              <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">
                {item.tag[lang]}
              </span>
              <h3 className="mt-1.5 text-sm font-bold text-white">{item.title[lang]}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">{item.body[lang]}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setNoticeBoardOpen(false);
              useExploreStore.getState().setMapOpen(true);
            }}
            className="rounded-xl bg-sky-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-sky-400"
          >
            🗺️ {tr(UI_TEXT.exploreMapBtn)}
          </button>
          <button
            type="button"
            onClick={() => {
              setNoticeBoardOpen(false);
              useExploreStore.getState().setQuizOpen(true);
            }}
            className="rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300"
          >
            🧩 {tr(UI_TEXT.exploreQuizBtn)}
          </button>
        </div>
      </div>
    </div>
  );
}
