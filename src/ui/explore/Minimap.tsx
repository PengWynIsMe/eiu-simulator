import { useMemo } from 'react';
import { campus } from '../../data';
import { CAMPUS_POIS, SHUTTLE_STOP_POS } from '../../data/explore';
import { useExploreStore } from '../../store/useExploreStore';
import { useWalkStore } from '../../store/useWalkStore';
import { useCampusStore } from '../../store/useCampusStore';
import { UI_TEXT, useT } from '../text';
import type { Vec2 } from '../../types';

function toSvgPoints(pts: readonly Vec2[]): string {
  return pts.map(([x, z]) => `${x.toFixed(1)},${z.toFixed(1)}`).join(' ');
}

export default function Minimap() {
  const tr = useT();
  const walkMode = useWalkStore((s) => s.walkMode);
  const interior = useWalkStore((s) => s.interior);
  const playerPos = useWalkStore((s) => s.playerPos);
  const playerYaw = useExploreStore((s) => s.playerYaw);
  const navTarget = useExploreStore((s) => s.navTarget);
  const discoveredPoiIds = useExploreStore((s) => s.discoveredPoiIds);
  const shuttleActive = useExploreStore((s) => s.shuttleActive);
  const setMapOpen = useExploreStore((s) => s.setMapOpen);
  const setQuizOpen = useExploreStore((s) => s.setQuizOpen);
  const clearNavTarget = useExploreStore((s) => s.clearNavTarget);
  const selectedBuildingId = useCampusStore((s) => s.selectedBuildingId);

  const staticPaths = useMemo(() => {
    const boundary = toSvgPoints(campus.layout.boundary);
    const buildings = campus.buildings.map((b) => ({
      id: b.id,
      pts: toSvgPoints(b.shape.outer),
      isAcademic: b.kind === 'academic' || b.kind === 'library',
    }));
    const roads = campus.layout.roads
      .filter((r) => r.kind === 'internal' || r.kind === 'bridge')
      .map((r, idx) => ({ key: idx, pts: toSvgPoints(r.points) }));
    return { boundary, buildings, roads };
  }, []);

  if (interior) return null;

  const px = walkMode ? playerPos.x : 0;
  const pz = walkMode ? playerPos.z : 0;
  // Trong SVG: +X phải, +Y xuống (trùng +Z thế giới). Camera nhìn theo (cos(yaw), sin(yaw)), mũi tên mặc định hướng lên (-Y).
  const deg = (playerYaw * 180) / Math.PI + 90;
  const discoveredSet = new Set(discoveredPoiIds);
  const viewHalf = walkMode ? 175 : 285;

  const locationLabel = shuttleActive
    ? tr(UI_TEXT.exploreShuttleBadge)
    : walkMode
      ? Math.hypot(px, pz) < 92
        ? tr(UI_TEXT.exploreZoneRoundabout)
        : pz < -80
          ? tr(UI_TEXT.exploreZone2Label)
          : tr(UI_TEXT.exploreZone1Label)
      : selectedBuildingId
        ? campus.buildings.find((b) => b.id === selectedBuildingId)?.shortName ?? tr(UI_TEXT.exploreZoneOutdoor)
        : tr(UI_TEXT.exploreZoneOutdoor);

  const navDist = navTarget ? Math.round(Math.hypot((walkMode ? playerPos.x : 244) - navTarget.pos[0], (walkMode ? playerPos.z : -28) - navTarget.pos[1])) : null;

  return (
    <div className="pointer-events-none fixed left-2.5 top-14 z-30 flex flex-col items-start gap-1.5 sm:left-4 sm:top-16 sm:flex-row">
      {/* Minimap tròn (bấm mở Bản đồ 2D) */}
      <button
        type="button"
        onClick={() => setMapOpen(true)}
        title={tr(UI_TEXT.exploreMapTitle)}
        aria-label={tr(UI_TEXT.exploreMapBtn)}
        className="pointer-events-auto group relative h-[86px] w-[86px] shrink-0 overflow-hidden rounded-full border-2 border-white/80 bg-slate-900/90 shadow-xl ring-2 ring-slate-950/30 transition hover:scale-105 sm:h-[112px] sm:w-[112px]"
      >
        <svg
          viewBox={`${px - viewHalf} ${pz - viewHalf} ${viewHalf * 2} ${viewHalf * 2}`}
          className="h-full w-full"
        >
          <polygon points={staticPaths.boundary} fill="#1b3a2c" stroke="#34d399" strokeOpacity="0.35" strokeWidth="2.5" />
          <circle
            cx={campus.layout.roundabout.center[0]}
            cy={campus.layout.roundabout.center[1]}
            r={campus.layout.roundabout.radius}
            fill="none"
            stroke="#64748b"
            strokeWidth="8"
          />
          {staticPaths.roads.map((r) => (
            <polyline key={r.key} points={r.pts} fill="none" stroke="#64748b" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {staticPaths.buildings.map((b) => (
            <polygon
              key={b.id}
              points={b.pts}
              fill={b.id === selectedBuildingId ? '#f59e0b' : b.isAcademic ? '#94a3b8' : '#64748b'}
              stroke="#0f172a"
              strokeWidth="1.2"
            />
          ))}

          {/* Đường dẫn nét đứt vàng trên minimap */}
          {navTarget && (
            <line
              x1={walkMode ? playerPos.x : 244}
              y1={walkMode ? playerPos.z : -28}
              x2={navTarget.pos[0]}
              y2={navTarget.pos[1]}
              stroke="#facc15"
              strokeWidth="5"
              strokeDasharray="10 8"
              strokeLinecap="round"
            />
          )}

          {/* Các điểm khám phá POI */}
          {CAMPUS_POIS.map((poi) => {
            const isTarget = navTarget?.id === poi.id;
            const found = discoveredSet.has(poi.id);
            return (
              <circle
                key={poi.id}
                cx={poi.pos[0]}
                cy={poi.pos[1]}
                r={isTarget ? 11 : 6}
                fill={isTarget ? '#facc15' : found ? '#10b981' : '#38bdf8'}
                stroke="#0f172a"
                strokeWidth="2"
              />
            );
          })}

          {/* Trạm xe điện */}
          <circle cx={SHUTTLE_STOP_POS[0]} cy={SHUTTLE_STOP_POS[1]} r={6} fill="#f59e0b" />

          {/* Mũi tên người chơi */}
          {walkMode && (
            <g transform={`translate(${px}, ${pz}) rotate(${deg})`}>
              <polygon points="0,-16 11,12 0,6 -11,12" fill="#38bdf8" stroke="#ffffff" strokeWidth="2.5" />
            </g>
          )}
        </svg>
        <span className="absolute inset-x-0 bottom-0.5 text-center text-[9px] font-bold uppercase tracking-wider text-white/90 drop-shadow sm:text-[10px]">
          {tr(UI_TEXT.exploreMapBtn)} · M
        </span>
      </button>

      {/* Cụm thông tin vị trí + tiến độ khám phá + câu hỏi */}
      <div className="pointer-events-auto hidden flex-col gap-1.5 sm:flex">
        <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/75 px-3 py-1 text-xs font-medium text-white shadow-lg backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="max-w-[200px] truncate">{locationLabel}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className="flex items-center gap-1 rounded-full border border-amber-300/35 bg-slate-950/75 px-2.5 py-1 text-[11px] font-semibold text-amber-200 shadow backdrop-blur-md hover:bg-slate-900"
          >
            <span>✨</span>
            <span>{tr(UI_TEXT.exploreDiscoveredBadge, { done: discoveredPoiIds.length, total: CAMPUS_POIS.length })}</span>
          </button>

          <button
            type="button"
            onClick={() => setQuizOpen(true)}
            className="flex items-center gap-1 rounded-full border border-sky-300/35 bg-slate-950/75 px-2.5 py-1 text-[11px] font-semibold text-sky-200 shadow backdrop-blur-md hover:bg-slate-900"
          >
            <span>🧩</span>
            <span>{tr(UI_TEXT.exploreQuizBtn)}</span>
          </button>
        </div>

        {navTarget && navDist !== null && (
          <div className="flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-950/85 px-2.5 py-1 text-[11px] font-semibold text-amber-200 shadow backdrop-blur-md">
            <span>🧭 {tr(navTarget.label)} · {navDist} m</span>
            <button
              type="button"
              onClick={clearNavTarget}
              className="rounded-full bg-white/15 px-1.5 text-[10px] text-white hover:bg-white/25"
              aria-label={tr(UI_TEXT.exploreStopGuide)}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Badge rút gọn trên điện thoại */}
      <div className="pointer-events-auto flex flex-col gap-1 sm:hidden">
        <button
          type="button"
          onClick={() => setQuizOpen(true)}
          className="flex items-center gap-1 rounded-full border border-amber-300/40 bg-slate-950/80 px-2 py-0.5 text-[10px] font-semibold text-amber-200 shadow backdrop-blur-md"
        >
          <span>✨ {discoveredPoiIds.length}/{CAMPUS_POIS.length}</span>
          <span className="text-sky-300">· Quiz</span>
        </button>
        {navTarget && navDist !== null && (
          <button
            type="button"
            onClick={clearNavTarget}
            className="flex items-center gap-1 rounded-full border border-amber-400/50 bg-amber-950/90 px-2 py-0.5 text-[10px] font-semibold text-amber-200 shadow"
          >
            <span>🧭 {navDist}m</span>
            <span>✕</span>
          </button>
        )}
      </div>
    </div>
  );
}
