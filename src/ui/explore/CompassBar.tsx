import { useEffect } from 'react';
import { useExploreStore } from '../../store/useExploreStore';
import { useWalkStore } from '../../store/useWalkStore';
import { useLangStore } from '../../store/useLangStore';

const DIRS_VI = ['B', 'ĐB', 'Đ', 'ĐN', 'N', 'TN', 'T', 'TB'] as const;
const DIRS_EN = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

export default function CompassBar() {
  const walkMode = useWalkStore((s) => s.walkMode);
  const interior = useWalkStore((s) => s.interior);
  const playerYaw = useExploreStore((s) => s.playerYaw);
  const toast = useExploreStore((s) => s.toast);
  const clearToast = useExploreStore((s) => s.clearToast);
  const lang = useLangStore((s) => s.lang);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(clearToast, 3200);
    return () => window.clearTimeout(timer);
  }, [toast, clearToast]);

  // Trong hệ tọa độ: -Z là Bắc (yaw = -PI/2), +X là Đông (yaw = 0)
  const bearingDeg = (((playerYaw * 180) / Math.PI + 90) % 360 + 360) % 360;
  const idx = Math.round(bearingDeg / 45) % 8;
  const dirs = lang === 'en' ? DIRS_EN : DIRS_VI;
  const left = dirs[(idx + 7) % 8];
  const center = dirs[idx];
  const right = dirs[(idx + 1) % 8];

  return (
    <div className={`pointer-events-none fixed left-[62%] z-30 flex -translate-x-1/2 flex-col items-center gap-1.5 sm:left-1/2 ${interior ? 'top-28 sm:top-32' : 'top-14 sm:top-16'}`}>
      {walkMode && !interior && (
        <div className="flex items-center gap-3 rounded-full border border-white/20 bg-slate-950/70 px-4 py-1 text-[11px] font-semibold tracking-wider text-slate-300 shadow-lg backdrop-blur-md">
          <span className="opacity-65">{left}</span>
          <span className="text-slate-500">·</span>
          <span className="rounded bg-amber-400/20 px-2 py-0.5 text-xs font-bold text-amber-300">
            {center} {Math.round(bearingDeg)}°
          </span>
          <span className="text-slate-500">·</span>
          <span className="opacity-65">{right}</span>
        </div>
      )}

      {toast && (
        <div className="rounded-full border border-emerald-300/50 bg-slate-950/90 px-4 py-1.5 text-xs font-semibold text-emerald-200 shadow-xl backdrop-blur-md">
          {toast.text[lang] || toast.text.vi}
        </div>
      )}
    </div>
  );
}
