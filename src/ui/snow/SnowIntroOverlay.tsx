import { useState } from 'react';
import { useSnowStore } from '../../store/useSnowStore';
import LangToggle from '../major/LangToggle';
import { UI_TEXT, useT } from '../text';

export default function SnowIntroOverlay() {
  const isCinematicActive = useSnowStore((s) => s.isCinematicActive);
  const endCinematic = useSnowStore((s) => s.endCinematic);

  const [copied, setCopied] = useState(false);
  const tr = useT();

  if (!isCinematicActive) return null;

  const handleShare = () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('snow', '1');
    void navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex flex-col justify-between p-4 sm:p-8 select-none transition-opacity duration-700">
      {/* Lớp viền tối nhẹ góc màn hình (vignette) tạo cảm giác điện ảnh */}
      <div className="pointer-events-none absolute inset-0 bg-radial-gradient from-transparent via-slate-950/10 to-slate-950/40" />

      {/* Góc trên: Nút đổi ngôn ngữ & Bỏ qua */}
      <div className="pointer-events-auto relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-slate-900/60 px-3 py-1 text-xs font-medium text-sky-200 shadow-lg backdrop-blur-md border border-sky-400/30">
            <span className="text-sm">❄️</span>
            <span>{tr(UI_TEXT.winterBadge)}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút ngôn ngữ dùng chung (cùng trạng thái với TopBar) */}
          <LangToggle />

          {/* Nút Bỏ qua */}
          <button
            type="button"
            onClick={endCinematic}
            className="rounded-lg bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 shadow-lg backdrop-blur-md border border-white/10 hover:bg-slate-800/80 hover:text-white transition-all"
          >
            {tr(UI_TEXT.skipIntro)}
          </button>
        </div>
      </div>

      {/* Trung tâm phía dưới: Tiêu đề lớn & Nút Vào tham quan */}
      <div className="pointer-events-auto relative z-10 mx-auto max-w-xl text-center pb-6 sm:pb-10">
        <div className="inline-block rounded-2xl bg-slate-950/65 p-6 sm:p-8 shadow-2xl backdrop-blur-md border border-white/20">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
            {tr(UI_TEXT.cinematicTitle)}
          </h2>
          <p className="mt-2 text-sm sm:text-base font-normal text-sky-100/90 drop-shadow">
            {tr(UI_TEXT.cinematicSubtitle)}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {/* Nút Vào tham quan */}
            <button
              type="button"
              onClick={endCinematic}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-sky-500/30 ring-2 ring-sky-300/60 hover:from-sky-400 hover:to-blue-500 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <span>{tr(UI_TEXT.enterCampus)}</span>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>

            {/* Nút Chia sẻ */}
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-3 text-sm font-medium text-white shadow backdrop-blur-md border border-white/20 hover:bg-white/25 active:scale-95 transition-all duration-200"
              title={tr(UI_TEXT.shareSnow)}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
              </svg>
              <span>{copied ? tr(UI_TEXT.shareCopied) : tr(UI_TEXT.shareSnow)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
