import { useMemo, useRef, useState } from 'react';
import { campus } from '../../data';
import { CAMPUS_POIS, getSafeBuildingSpot, SHUTTLE_WAYPOINTS } from '../../data/explore';
import { useExploreStore } from '../../store/useExploreStore';
import { useWalkStore } from '../../store/useWalkStore';
import { useCampusStore } from '../../store/useCampusStore';
import { useLangStore } from '../../store/useLangStore';
import { UI_TEXT, useT } from '../text';
import type { Vec2 } from '../../types';

type MapFilter = 'all' | 'zone1' | 'zone2' | 'pois';

function toSvgPts(pts: readonly Vec2[]): string {
  return pts.map(([x, z]) => `${x.toFixed(1)},${z.toFixed(1)}`).join(' ');
}

export default function CampusMapModal() {
  const tr = useT();
  const lang = useLangStore((s) => s.lang);
  const mapOpen = useExploreStore((s) => s.mapOpen);
  const setMapOpen = useExploreStore((s) => s.setMapOpen);
  const navTarget = useExploreStore((s) => s.navTarget);
  const discoveredPoiIds = useExploreStore((s) => s.discoveredPoiIds);

  const walkMode = useWalkStore((s) => s.walkMode);
  const playerPos = useWalkStore((s) => s.playerPos);

  const [filter, setFilter] = useState<MapFilter>('all');
  const [selected, setSelected] = useState<{ kind: 'poi' | 'building'; id: string } | null>({ kind: 'poi', id: 'poi-b11' });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<[number, number]>([40, -60]);
  const dragRef = useRef<{ active: boolean; x: number; y: number; moved: boolean }>({ active: false, x: 0, y: 0, moved: false });

  const svgData = useMemo(() => {
    const boundary = toSvgPts(campus.layout.boundary);
    const shuttleLoop = toSvgPts(SHUTTLE_WAYPOINTS);
    const roads = campus.layout.roads.map((r, i) => ({
      key: i,
      kind: r.kind,
      pts: toSvgPts(r.points),
    }));
    const parking = campus.layout.parking.map((p, i) => ({ key: i, pts: toSvgPts(p) }));
    const buildings = campus.buildings.map((b) => ({
      b,
      pts: toSvgPts(b.shape.outer),
    }));
    return { boundary, shuttleLoop, roads, parking, buildings };
  }, []);

  if (!mapOpen) return null;

  const discoveredSet = new Set(discoveredPoiIds);
  const activePoi = selected?.kind === 'poi' ? CAMPUS_POIS.find((p) => p.id === selected.id) ?? null : null;
  const activeBuilding =
    selected?.kind === 'building'
      ? campus.buildings.find((b) => b.id === selected.id) ?? null
      : activePoi?.buildingId
        ? campus.buildings.find((b) => b.id === activePoi.buildingId) ?? null
        : null;

  const targetPos: Vec2 | null = activePoi
    ? activePoi.pos
    : activeBuilding
      ? getSafeBuildingSpot(activeBuilding.id)
      : null;

  const originX = walkMode ? playerPos.x : 244;
  const originZ = walkMode ? playerPos.z : -28;
  const distanceM = targetPos ? Math.round(Math.hypot(targetPos[0] - originX, targetPos[1] - originZ)) : null;
  const walkMin = distanceM !== null ? Math.max(1, Math.round(distanceM / 65)) : 1;
  const bikeMin = distanceM !== null ? Math.max(1, Math.round(distanceM / 220)) : 1;

  const viewW = 660 / zoom;
  const viewH = 560 / zoom;

  const handleStartWalkGuide = () => {
    if (!targetPos) return;
    const id = activePoi?.id ?? activeBuilding?.id ?? 'target';
    const label = activePoi
      ? activePoi.title
      : { vi: activeBuilding?.name ?? 'Điểm đến', en: activeBuilding?.name ?? 'Destination' };
    useCampusStore.getState().clearSelection();
    if (!useWalkStore.getState().walkMode) {
      useWalkStore.setState({ walkMode: true, interior: null, moveInput: { x: 0, y: 0 } });
    }
    const es = useExploreStore.getState();
    es.setNavTarget({ id, pos: targetPos, label, buildingId: activeBuilding?.id });
    es.showToast({
      vi: `Đang dẫn đường tới ${label.vi}`,
      en: `Guiding path set to ${label.en}`,
    });
    setMapOpen(false);
  };

  const handleTeleport = () => {
    if (!targetPos) return;
    const dx = (activeBuilding?.center[0] ?? targetPos[0]) - targetPos[0];
    const dz = (activeBuilding?.center[1] ?? targetPos[1]) - targetPos[1];
    const yaw = Math.hypot(dx, dz) > 0.2 ? Math.atan2(dz, dx) : Math.PI;
    useExploreStore.getState().requestTeleport(targetPos, yaw);
  };

  const handleViewBuilding = () => {
    if (!activeBuilding) return;
    useExploreStore.getState().exitShuttle();
    useWalkStore.getState().exitWalkMode();
    useCampusStore.getState().selectBuilding(activeBuilding.id);
    setMapOpen(false);
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-2 backdrop-blur-sm sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tr(UI_TEXT.exploreMapTitle)}
        className="flex h-[min(92vh,720px)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-slate-900 text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3 sm:px-6">
          <div>
            <h2 className="text-base font-bold sm:text-lg">{tr(UI_TEXT.exploreMapTitle)}</h2>
            <p className="text-xs text-slate-300">{tr(UI_TEXT.exploreMapSubtitle)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => useExploreStore.getState().boardShuttle()}
              className="rounded-full bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow hover:bg-amber-300"
            >
              🚐 {tr(UI_TEXT.exploreShuttleBoard)}
            </button>
            <button
              type="button"
              onClick={() => setMapOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm hover:bg-white/20"
              aria-label={tr(UI_TEXT.close)}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Bộ lọc khu vực */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 bg-slate-950/40 px-4 py-2 sm:px-6">
          {(
            [
              ['all', UI_TEXT.exploreFilterAll],
              ['zone1', UI_TEXT.exploreFilterZone1],
              ['zone2', UI_TEXT.exploreFilterZone2],
              ['pois', UI_TEXT.exploreFilterPois],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                filter === key ? 'bg-sky-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              {tr(label)}
            </button>
          ))}
          <span className="ml-auto text-xs font-semibold text-amber-300">
            ✨ {tr(UI_TEXT.exploreDiscoveredBadge, { done: discoveredPoiIds.length, total: CAMPUS_POIS.length })}
          </span>
        </div>

        {/* Thân modal: Bản đồ SVG + Panel thông tin */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Vùng bản đồ 2D */}
          <div
            className="relative min-h-[260px] flex-1 cursor-grab overflow-hidden bg-[#10221a] active:cursor-grabbing"
            onPointerDown={(e) => {
              dragRef.current = { active: true, x: e.clientX, y: e.clientY, moved: false };
            }}
            onPointerMove={(e) => {
              if (!dragRef.current.active) return;
              const dx = e.clientX - dragRef.current.x;
              const dy = e.clientY - dragRef.current.y;
              if (Math.hypot(dx, dy) > 4) dragRef.current.moved = true;
              dragRef.current.x = e.clientX;
              dragRef.current.y = e.clientY;
              setPan(([px, pz]) => [px - dx / zoom, pz - dy / zoom]);
            }}
            onPointerUp={() => {
              dragRef.current.active = false;
            }}
          >
            <svg
              viewBox={`${pan[0] - viewW / 2} ${pan[1] - viewH / 2} ${viewW} ${viewH}`}
              className="h-full w-full select-none"
            >
              <polygon points={svgData.boundary} fill="#1b3a2c" stroke="#34d399" strokeOpacity="0.4" strokeWidth="2" />
              {svgData.parking.map((p) => (
                <polygon key={p.key} points={p.pts} fill="#334155" />
              ))}
              <circle
                cx={campus.layout.roundabout.center[0]}
                cy={campus.layout.roundabout.center[1]}
                r={campus.layout.roundabout.radius}
                fill="none"
                stroke="#475569"
                strokeWidth="9"
              />
              {svgData.roads.map((r) => (
                <polyline
                  key={r.key}
                  points={r.pts}
                  fill="none"
                  stroke={r.kind === 'street' ? '#334155' : r.kind === 'bridge' ? '#38bdf8' : '#475569'}
                  strokeWidth={r.kind === 'street' ? 10 : r.kind === 'footway' ? 3 : 6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

              {/* Vòng tuyến xe điện */}
              <polygon
                points={svgData.shuttleLoop}
                fill="none"
                stroke="#38bdf8"
                strokeOpacity="0.35"
                strokeWidth="2.5"
                strokeDasharray="6 6"
              />

              {/* Các tòa nhà */}
              {svgData.buildings.map(({ b, pts }) => {
                const isSel = activeBuilding?.id === b.id;
                const dimmed = (filter === 'zone1' && b.zone !== 1) || (filter === 'zone2' && b.zone !== 2);
                return (
                  <g
                    key={b.id}
                    className="cursor-pointer"
                    opacity={dimmed ? 0.25 : 1}
                    onClick={() => {
                      if (!dragRef.current.moved) setSelected({ kind: 'building', id: b.id });
                    }}
                  >
                    <polygon
                      points={pts}
                      fill={isSel ? '#f59e0b' : b.majorIds.length > 0 ? '#60a5fa' : '#94a3b8'}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                    <text
                      x={b.center[0]}
                      y={b.center[1]}
                      fill="#0f172a"
                      fontSize="9"
                      fontWeight="700"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {b.shortName}
                    </text>
                  </g>
                );
              })}

              {/* Đường nét đứt vàng đang dẫn đường */}
              {navTarget && (
                <line
                  x1={originX}
                  y1={originZ}
                  x2={navTarget.pos[0]}
                  y2={navTarget.pos[1]}
                  stroke="#facc15"
                  strokeWidth="3.5"
                  strokeDasharray="8 6"
                />
              )}

              {/* Các điểm khám phá POI */}
              {CAMPUS_POIS.map((poi) => {
                const isSel = activePoi?.id === poi.id;
                const found = discoveredSet.has(poi.id);
                const dimmed = (filter === 'zone1' && poi.zone !== 1) || (filter === 'zone2' && poi.zone !== 2);
                return (
                  <g
                    key={poi.id}
                    className="cursor-pointer"
                    opacity={dimmed ? 0.3 : 1}
                    onClick={() => {
                      if (!dragRef.current.moved) setSelected({ kind: 'poi', id: poi.id });
                    }}
                  >
                    <circle
                      cx={poi.pos[0]}
                      cy={poi.pos[1]}
                      r={isSel ? 10 : 7}
                      fill={isSel ? '#facc15' : found ? '#10b981' : '#38bdf8'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  </g>
                );
              })}

              {/* Vị trí người chơi */}
              {walkMode && (
                <circle cx={playerPos.x} cy={playerPos.z} r={7} fill="#38bdf8" stroke="#ffffff" strokeWidth="2.5" />
              )}
            </svg>

            {/* Nút Zoom bản đồ */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/85 p-1 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.25).toFixed(2)))}
                className="h-7 w-7 rounded-full text-sm font-bold hover:bg-white/15"
                aria-label="Thu nhỏ bản đồ"
              >
                −
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setPan([40, -60]);
                }}
                className="px-2 text-[11px] font-semibold text-slate-300 hover:text-white"
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.6, +(z + 0.25).toFixed(2)))}
                className="h-7 w-7 rounded-full text-sm font-bold hover:bg-white/15"
                aria-label="Phóng to bản đồ"
              >
                +
              </button>
            </div>
          </div>

          {/* Cột thông tin điểm đang chọn */}
          <div className="flex w-full shrink-0 flex-col justify-between gap-3 border-t border-white/10 bg-slate-950/60 p-4 lg:w-80 lg:border-l lg:border-t-0">
            <div className="space-y-2.5 overflow-y-auto">
              {activePoi ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: activePoi.color }} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-sky-300">
                      {tr(UI_TEXT.zonePrefix)} {activePoi.zone}
                    </span>
                    {discoveredSet.has(activePoi.id) && (
                      <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        ✓
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white">{activePoi.title[lang]}</h3>
                  <p className="text-xs font-medium text-amber-300">{activePoi.subtitle[lang]}</p>
                  <p className="text-xs leading-relaxed text-slate-300">{activePoi.description[lang]}</p>
                </>
              ) : activeBuilding ? (
                <>
                  <span className="text-xs font-semibold uppercase tracking-wider text-sky-300">
                    {tr(UI_TEXT.zonePrefix)} {activeBuilding.zone} · {activeBuilding.floors} {tr(UI_TEXT.floorsUnit)}
                  </span>
                  <h3 className="text-base font-bold text-white">{activeBuilding.name}</h3>
                  {activeBuilding.notes && (
                    <p className="text-xs leading-relaxed text-slate-300">{activeBuilding.notes}</p>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-400">{tr(UI_TEXT.exploreMapSubtitle)}</p>
              )}

              {distanceM !== null && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs">
                  <div className="font-semibold text-amber-300">{tr(UI_TEXT.exploreDistanceMeters, { m: distanceM })}</div>
                  <div className="mt-0.5 text-slate-300">
                    {tr(UI_TEXT.exploreWalkEta, { min: walkMin, bmin: bikeMin })}
                  </div>
                </div>
              )}
            </div>

            {targetPos && (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleStartWalkGuide}
                  className="w-full rounded-xl bg-amber-400 px-3 py-2.5 text-xs font-bold text-slate-950 shadow hover:bg-amber-300"
                >
                  🧭 {tr(UI_TEXT.exploreGuideWalk)}
                </button>
                <button
                  type="button"
                  onClick={handleTeleport}
                  className="w-full rounded-xl bg-sky-500 px-3 py-2.5 text-xs font-bold text-white shadow hover:bg-sky-400"
                >
                  ⚡ {tr(UI_TEXT.exploreTeleport)}
                </button>
                {activeBuilding && (
                  <button
                    type="button"
                    onClick={handleViewBuilding}
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20"
                  >
                    🏛 {tr(UI_TEXT.exploreViewBuilding)}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
