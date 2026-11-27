import { useExploreStore } from '../../store/useExploreStore';
import { useLangStore } from '../../store/useLangStore';
import { UI_TEXT, useT } from '../text';

export default function ShuttleHud() {
  const tr = useT();
  const lang = useLangStore((s) => s.lang);
  const shuttleActive = useExploreStore((s) => s.shuttleActive);
  const shuttleSpeed = useExploreStore((s) => s.shuttleSpeed);
  const shuttleCam = useExploreStore((s) => s.shuttleCam);
  const shuttleT = useExploreStore((s) => s.shuttleT);
  const narration = useExploreStore((s) => s.shuttleNarration);

  const toggleShuttleSpeed = useExploreStore((s) => s.toggleShuttleSpeed);
  const toggleShuttleCam = useExploreStore((s) => s.toggleShuttleCam);
  const skipShuttleNextStop = useExploreStore((s) => s.skipShuttleNextStop);
  const exitShuttle = useExploreStore((s) => s.exitShuttle);

  if (!shuttleActive) return null;

  const pct = Math.round(shuttleT * 100);

  return (
    <div className="pointer-events-auto fixed bottom-4 left-1/2 z-40 flex w-[min(94vw,540px)] -translate-x-1/2 flex-col gap-2">
      {/* Hộp thuyết minh bác tài / hướng dẫn viên */}
      <div className="rounded-2xl border border-sky-400/35 bg-slate-950/88 p-3.5 text-white shadow-2xl backdrop-blur-md">
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-bold text-amber-300">
              🚐 {tr(UI_TEXT.exploreShuttleBadge)}
            </span>
            {narration && (
              <span className="text-xs font-bold text-sky-300 sm:text-sm">
                {narration.title[lang] || narration.title.vi}
              </span>
            )}
          </div>
          <span className="text-[11px] font-mono text-slate-400">{pct}%</span>
        </div>
        {narration && (
          <p className="text-xs leading-relaxed text-slate-200 sm:text-sm">
            {narration.text[lang] || narration.text.vi}
          </p>
        )}
      </div>

      {/* Thanh nút điều khiển xe điện */}
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/15 bg-slate-950/90 px-3 py-1.5 shadow-xl backdrop-blur-md">
        <button
          type="button"
          onClick={toggleShuttleCam}
          className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
        >
          🎥 {tr(UI_TEXT.exploreShuttleCam)} · {shuttleCam === 'first' ? '1st' : '3rd'}
        </button>

        <button
          type="button"
          onClick={toggleShuttleSpeed}
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            shuttleSpeed === 4 ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          ⏩ x{shuttleSpeed}
        </button>

        <button
          type="button"
          onClick={skipShuttleNextStop}
          className="rounded-full bg-sky-500/85 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-400"
        >
          ⏭ {tr(UI_TEXT.exploreShuttleNext)}
        </button>

        <button
          type="button"
          onClick={exitShuttle}
          className="rounded-full bg-rose-500/90 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-400"
        >
          {tr(UI_TEXT.exploreShuttleExit)}
        </button>
      </div>
    </div>
  );
}
