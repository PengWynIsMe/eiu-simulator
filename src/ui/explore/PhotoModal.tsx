import { useExploreStore } from '../../store/useExploreStore';
import { UI_TEXT, useT } from '../text';

export default function PhotoModal() {
  const tr = useT();
  const capturedPhotoUrl = useExploreStore((s) => s.capturedPhotoUrl);
  const clearCapturedPhoto = useExploreStore((s) => s.clearCapturedPhoto);
  const requestPhoto = useExploreStore((s) => s.requestPhoto);

  if (!capturedPhotoUrl) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tr(UI_TEXT.explorePhotoTitle)}
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/15 bg-slate-900 p-4 text-white shadow-2xl sm:p-5"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold sm:text-lg">📷 {tr(UI_TEXT.explorePhotoTitle)}</h2>
          <button
            type="button"
            onClick={clearCapturedPhoto}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm hover:bg-white/20"
            aria-label={tr(UI_TEXT.close)}
          >
            ✕
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
          <img src={capturedPhotoUrl} alt={tr(UI_TEXT.explorePhotoTitle)} className="max-h-[60vh] w-full object-contain" />
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              clearCapturedPhoto();
              window.setTimeout(requestPhoto, 80);
            }}
            className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20"
          >
            🔄 {tr(UI_TEXT.explorePhotoRetake)}
          </button>
          <a
            href={capturedPhotoUrl}
            download="eiu-campus-snapshot.png"
            className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 shadow hover:bg-amber-300"
          >
            ⬇ {tr(UI_TEXT.explorePhotoDownload)}
          </a>
        </div>
      </div>
    </div>
  );
}
