import { useMemo } from 'react';
import { useT } from '../text';
import { useSilver } from '../silver/adapter';
import { useActivityStore } from '../../store/useActivityStore';
import { useWalkStore } from '../../store/useWalkStore';
import { useLangStore } from '../../store/useLangStore';
import { nextWaypoint } from '../../silverWorld/waypoint';
import { getSilverWaypointLayoutMap } from './layoutMap';
import { fmt, ST_W } from './text';

interface WorldNavigationCardProps {
  onSkip: () => void;
  onExit: () => void;
}

/**
 * Mũi tên la bàn chỉ hướng đến waypoint mục tiêu.
 * Bắc bản đồ = vector [0, -1] thế giới -> hướng lên trên màn hình.
 */
function Compass({ dx, dz }: { dx: number; dz: number }) {
  const deg = (Math.atan2(dx, -dz) * 180) / Math.PI;
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10 shrink-0 select-none" aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill="#0b3d91" opacity="0.1" stroke="#0b3d91" strokeWidth="1.5" />
      <text x="20" y="8" textAnchor="middle" fontSize="7" fill="#0b3d91" fontWeight="700">
        N
      </text>
      <g transform={`rotate(${deg} 20 20)`}>
        <polygon points="20,7 24,20 20,17 16,20" fill="#dc2626" />
        <polygon points="20,33 24,20 20,17 16,20" fill="#94a3b8" />
      </g>
    </svg>
  );
}

/**
 * Thẻ chỉ đường góc trái trong phase travel và near.
 * Hiển thị nơi đến, chặng, la bàn, khoảng cách mét, nút "Tới nơi luôn", "Bỏ qua cảnh", "Thoát".
 */
export default function WorldNavigationCard({ onSkip, onExit }: WorldNavigationCardProps) {
  const tr = useT();
  const lang = useLangStore((s) => s.lang);
  const play = useSilver((s) => s.play);
  const activity = useActivityStore((s) => s.activity);
  const inRange = useActivityStore((s) => s.inRange);
  const arriveNow = useActivityStore((s) => s.arriveNow);
  const interact = useActivityStore((s) => s.interact);
  const playerPos = useWalkStore((s) => s.playerPos);
  const interior = useWalkStore((s) => s.interior);

  const layoutMap = useMemo(() => getSilverWaypointLayoutMap(), []);

  const wp = useMemo(() => {
    if (!activity) return null;
    return nextWaypoint(playerPos, interior, activity.target, layoutMap);
  }, [activity, playerPos, interior, layoutMap]);

  if (!activity || !play) return null;

  const dx = (wp?.x ?? activity.target.x) - playerPos.x;
  const dz = (wp?.z ?? activity.target.z) - playerPos.z;
  const distance = Math.round(Math.hypot(dx, dz));

  const placeTitle = play.item.scene ? tr(play.item.scene.title) : tr(activity.prompt);
  const targetPlace = fmt(tr(ST_W.goTo), { place: placeTitle });

  // Xác định câu hướng dẫn chặng
  let legHint = '';
  if (wp?.hint === 'elevator') {
    const currentFloor = interior?.floor ?? 1;
    const targetFloor = wp.floor ?? 1;
    legHint = targetFloor > currentFloor
      ? fmt(tr(ST_W.upTo), { n: targetFloor })
      : fmt(tr(ST_W.downTo), { n: targetFloor });
  } else if (wp?.hint === 'door') {
    legHint = tr(ST_W.doorHint);
  } else if (wp?.hint === 'room') {
    legHint = tr(ST_W.roomHint);
  } else {
    // wp?.hint === 'target'
    if (activity.trigger === 'sit') {
      legHint = tr(ST_W.sit);
    } else if (activity.trigger === 'talk') {
      legHint = tr(ST_W.talk);
    } else if (activity.trigger === 'look') {
      legHint = tr(ST_W.look);
    } else {
      legHint = placeTitle;
    }
  }

  return (
    <>
      {/* Thẻ góc trái màn hình */}
      <div className="fixed left-3 top-14 z-30 w-72 max-w-[calc(100vw-1.5rem)] select-none rounded-2xl border border-white/60 bg-white/95 p-3.5 shadow-xl backdrop-blur-md transition-all sm:left-4 sm:top-16">
        {/* Nơi & chặng */}
        <div className="space-y-1">
          <div className="truncate text-xs font-semibold uppercase tracking-wider text-slate-500">
            {targetPlace}
          </div>
          <div className="text-sm font-bold text-[#0b3d91]">
            {legHint}
          </div>
        </div>

        {/* La bàn và số mét */}
        <div className="mt-2.5 flex items-center gap-3 border-t border-slate-100 pt-2.5">
          <Compass dx={dx} dz={dz} />
          <div className="flex-1 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{fmt(tr(ST_W.dist), { n: distance })}</span>
            {inRange && (
              <div className="text-xs font-medium text-emerald-600 animate-pulse">
                {activity.trigger === 'sit' ? tr(ST_W.sit) : tr(ST_W.talk)} (E)
              </div>
            )}
          </div>
        </div>

        {/* Các nút hành động: Tới nơi luôn, Bỏ qua cảnh, Thoát */}
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2.5">
          <button
            type="button"
            onClick={arriveNow}
            className="flex-1 min-h-[36px] rounded-lg bg-[#0b3d91] px-2.5 py-1 text-xs font-semibold text-white shadow transition hover:bg-blue-800 active:scale-95"
          >
            {tr(ST_W.arriveNow)}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="min-h-[36px] rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 active:scale-95"
          >
            {tr(ST_W.skip)}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="min-h-[36px] rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 active:scale-95"
          >
            {tr(ST_W.exit)}
          </button>
        </div>
      </div>

      {/* Nút tương tác E dạng cảm ứng cho thiết bị màn hình chạm khi trong tầm (inRange) */}
      {inRange && (
        <div className="fixed bottom-24 right-6 z-40 [@media(pointer:fine)]:hidden">
          <button
            type="button"
            onClick={interact}
            className="flex min-h-[48px] items-center gap-2 rounded-xl bg-[#f5b700] px-5 py-3 text-sm font-bold text-slate-900 shadow-2xl active:scale-95"
          >
            <span>{activity.prompt[lang]}</span>
            <span className="rounded bg-slate-900/15 px-1.5 py-0.5 text-xs">E</span>
          </button>
        </div>
      )}
    </>
  );
}
