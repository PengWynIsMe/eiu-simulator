import { useEffect, useState, useRef } from 'react';
import { useWalkStore } from '../../store/useWalkStore';
import { getBuilding, getBuildingDetail } from '../../data';
import { getInteriorLayout } from '../../scene/interior/layouts';
import LibraryHud from './LibraryHud';

interface ProximityState {
  interactive: {
    id: string;
    type: 'exterior-door' | 'interior-door' | 'elevator';
    label: string;
    buildingId?: string;
  } | null;
  activeRoom: {
    code: string;
    name: string;
    note?: string;
  } | null;
}

export default function InteriorHud() {
  const walkMode = useWalkStore((s) => s.walkMode);
  const interior = useWalkStore((s) => s.interior);

  const [proximity, setProximity] = useState<ProximityState>({ interactive: null, activeRoom: null });
  const [elevatorOpen, setElevatorOpen] = useState(false);
  const [hoveredElevatorFloor, setHoveredElevatorFloor] = useState<number | null>(null);
  const [fadeOpacity, setFadeOpacity] = useState(0);

  const prevInterior = useRef<{ buildingId: string; floor: number } | null>(null);
  const skipNextFadeRef = useRef(false);

  // Xác định tòa nhà hiện tại (khi đang ở trong hoặc đang đứng trước cửa)
  const currentBuildingId = interior?.buildingId ?? proximity.interactive?.buildingId;
  const buildingInfo = currentBuildingId ? getBuilding(currentBuildingId) : undefined;
  const buildingDetail = currentBuildingId ? getBuildingDetail(currentBuildingId) : undefined;
  const layout = currentBuildingId ? getInteriorLayout(currentBuildingId) : undefined;
  const maxFloors = layout?.floors ?? buildingDetail?.floors?.length ?? 3;

  // Lắng nghe sự kiện tiệm cận tương tác từ WalkMode
  useEffect(() => {
    const handleProximity = (event: Event) => {
      const customEvent = event as CustomEvent<ProximityState>;
      setProximity(customEvent.detail);
    };

    const handleOpenElevator = () => {
      setElevatorOpen(true);
    };

    const handleStairWalkFloor = () => {
      skipNextFadeRef.current = true;
    };

    window.addEventListener('campussim:interior-proximity', handleProximity);
    window.addEventListener('campussim:open-elevator', handleOpenElevator);
    window.addEventListener('campussim:stair-walk-floor', handleStairWalkFloor);
    return () => {
      window.removeEventListener('campussim:interior-proximity', handleProximity);
      window.removeEventListener('campussim:open-elevator', handleOpenElevator);
      window.removeEventListener('campussim:stair-walk-floor', handleStairWalkFloor);
    };
  }, []);

  // Hiệu ứng Fade chuyển cảnh (~0.3s) khi vào, ra hoặc đổi tầng bằng thang máy (đi thang bộ liền mạch không chớp tối)
  useEffect(() => {
    const prev = prevInterior.current;
    const cur = interior;
    prevInterior.current = cur ? { ...cur } : null;

    if (skipNextFadeRef.current) {
      skipNextFadeRef.current = false;
      return;
    }

    setProximity({ interactive: null, activeRoom: null });

    const isEntering = !prev && cur;
    const isExiting = prev && !cur;
    const isChangingFloor = Boolean(prev && cur && prev.floor !== cur.floor);

    if (isEntering || isExiting || isChangingFloor) {
      setFadeOpacity(1);
      const timer = setTimeout(() => {
        setFadeOpacity(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [interior]);

  // Đóng bảng thang máy khi thoát chế độ đi bộ hoặc ra ngoài
  useEffect(() => {
    if (!walkMode || !interior) {
      setElevatorOpen(false);
    }
  }, [walkMode, interior]);

  // Phím tắt chọn tầng (1..maxFloors) và Escape cho bảng thang máy
  useEffect(() => {
    if (!elevatorOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable]')) return;
      const num = Number.parseInt(e.key, 10);
      if (!Number.isNaN(num) && num >= 1 && num <= maxFloors) {
        window.dispatchEvent(new CustomEvent('campussim:elevator-move'));
        useWalkStore.getState().setInteriorFloor(num);
        setElevatorOpen(false);
      } else if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        setHoveredElevatorFloor(null);
        setElevatorOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [elevatorOpen, maxFloors]);

  const handleActionClick = () => {
    const inter = proximity.interactive;
    if (!inter) return;
    if (inter.type === 'exterior-door' && inter.buildingId) {
      useWalkStore.getState().enterInterior(inter.buildingId);
    } else if (inter.type === 'interior-door') {
      useWalkStore.getState().exitInterior();
    } else if (inter.type === 'elevator') {
      setElevatorOpen(true);
    }
  };

  const handleFloorSelect = (targetFloor: number) => {
    window.dispatchEvent(new CustomEvent('campussim:elevator-move'));
    useWalkStore.getState().setInteriorFloor(targetFloor);
    setElevatorOpen(false);
  };

  const hasPhysicalStairs = Boolean(layout?.stepStairHeight);
  const stairCode = !hasPhysicalStairs && proximity.activeRoom?.code.startsWith('Thang bộ')
    ? proximity.activeRoom.code
    : null;
  const moveByStair = (targetFloor: number) => {
    if (!interior || !stairCode) return;
    window.dispatchEvent(new CustomEvent('campussim:stair-move', { detail: { stairCode, floor: targetFloor } }));
    useWalkStore.getState().setInteriorFloor(targetFloor);
  };

  useEffect(() => {
    if (!interior || elevatorOpen || !stairCode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]')) return;
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      const targetFloor = key === 'e' && interior.floor < maxFloors
        ? interior.floor + 1
        : key === 'q' && interior.floor > 1
          ? interior.floor - 1
          : null;
      if (targetFloor !== null) {
        window.dispatchEvent(new CustomEvent('campussim:stair-move', { detail: { stairCode, floor: targetFloor } }));
        useWalkStore.getState().setInteriorFloor(targetFloor);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [interior, elevatorOpen, stairCode, maxFloors]);

  const currentFloorLabel = interior
    ? interior.floor === 1
      ? 'Tầng 1 (Trệt)'
      : `Tầng ${interior.floor}`
    : '';

  // Danh sách các tầng của tòa nhà (xếp từ tầng cao nhất xuống tầng 1)
  const elevatorFloors = Array.from({ length: maxFloors }, (_, idx) => {
    const floorNum = maxFloors - idx;
    const detailFloor = buildingDetail?.floors?.find((f) => f.floorNumber === floorNum);

    let desc = detailFloor?.architecturalNote ?? '';
    if (!desc && detailFloor?.groups) {
      desc = detailFloor.groups
        .flatMap((g) => g.rooms.map((r) => r.code))
        .slice(0, 4)
        .join(' · ');
    }

    return {
      floorNum,
      label: detailFloor?.label ?? `Tầng ${floorNum}`,
      desc,
    };
  });

  if (!walkMode) return null;

  return (
    <>
      {/* 1. Màn mờ đen chuyển cảnh (Fade Transition) */}
      <div
        className="pointer-events-none fixed inset-0 z-50 bg-slate-950 transition-opacity duration-200 ease-out"
        style={{ opacity: fadeOpacity }}
        aria-hidden="true"
      />

      {/* 2. Thẻ thông tin tầng & phòng học / hành lang đang đứng */}
      {interior && (
        <div className="pointer-events-none fixed top-16 left-1/2 z-40 -translate-x-1/2">
          <div className="flex max-w-[260px] flex-col items-center rounded-2xl border border-sky-400/40 bg-slate-950/80 px-4 py-2 text-center shadow-xl backdrop-blur-md sm:max-w-xs">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-xs font-semibold text-sky-300">
                {currentFloorLabel}
              </span>
              {proximity.activeRoom && (
                <span className="text-sm font-bold text-sky-400">
                  {proximity.activeRoom.code}
                </span>
              )}
            </div>
            {proximity.activeRoom && (
              <div className="mt-1 text-sm font-medium text-white">
                {proximity.activeRoom.name}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Nút / Gợi ý tương tác (Nhấn [E] hoặc Chạm nút) */}
      {proximity.interactive && (
        <div className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 select-none md:bottom-20">
          <button
            type="button"
            onClick={handleActionClick}
            className="flex items-center gap-2.5 rounded-full border border-sky-300/60 bg-sky-950/85 px-5 py-3 text-sm font-semibold text-white shadow-2xl backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
          >
            <span className="hidden rounded bg-sky-500 px-2 py-0.5 text-xs font-bold text-white shadow md:inline-block">
              E
            </span>
            <span>{proximity.interactive.label}</span>
          </button>
        </div>
      )}

      {interior && stairCode && (
        <div className="fixed bottom-24 left-1/2 z-40 flex -translate-x-1/2 gap-2 select-none md:bottom-20">
          {interior.floor < maxFloors && <button type="button" onClick={() => moveByStair(interior.floor + 1)} className="rounded-full border border-sky-300/60 bg-sky-950/90 px-4 py-3 text-sm font-semibold text-white shadow-2xl">E · Lên tầng {interior.floor + 1}</button>}
          {interior.floor > 1 && <button type="button" onClick={() => moveByStair(interior.floor - 1)} className="rounded-full border border-sky-300/60 bg-sky-950/90 px-4 py-3 text-sm font-semibold text-white shadow-2xl">Q · Xuống tầng {interior.floor - 1}</button>}
        </div>
      )}

      {/* 4. Bảng điều khiển Thang máy (kiểu bảng nút thép tối + màn LED) */}
      {elevatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="elevator-modal-title"
            className="relative w-full max-w-xs rounded-2xl border-2 border-slate-500/70 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 p-5 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3">
              <div>
                <h3 id="elevator-modal-title" className="text-sm font-semibold tracking-wide text-slate-100">
                  {`Thang máy ${buildingInfo?.shortName ?? buildingInfo?.name ?? 'Tòa nhà'}`}
                </h3>
                <p className="text-[11px] text-slate-300">
                  {buildingDetail?.subtitle ?? buildingInfo?.name ?? ''}
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-600/60 hover:text-white"
                onClick={() => {
                  setHoveredElevatorFloor(null);
                  setElevatorOpen(false);
                }}
                aria-label="Đóng bảng thang máy"
              >
                ✕
              </button>
            </div>

            {/* Ô LED nhỏ phía trên hiện số tầng hiện tại + mũi tên ▲▼ */}
            {(() => {
              const curFloor = interior?.floor ?? 1;
              const isMovingUp = hoveredElevatorFloor !== null && hoveredElevatorFloor > curFloor;
              const isMovingDown = hoveredElevatorFloor !== null && hoveredElevatorFloor < curFloor;
              return (
                <div className="mb-4 flex items-center justify-center gap-4 rounded-xl border border-slate-600 bg-slate-950 px-4 py-2.5 shadow-inner">
                  <span className="font-mono text-2xl font-bold tracking-wider text-sky-400">
                    {curFloor}
                  </span>
                  <div className="flex flex-col leading-none">
                    <span className={`text-xs ${isMovingUp ? 'text-emerald-400' : 'text-slate-600'}`}>▲</span>
                    <span className={`text-xs ${isMovingDown ? 'text-amber-400' : 'text-slate-600'}`}>▼</span>
                  </div>
                </div>
              );
            })()}

            {/* Các nút tròn 1..maxFloors xếp dọc từ dưới lên */}
            <div className="flex flex-col gap-2.5">
              {elevatorFloors.map((f) => {
                const isCurrent = interior?.floor === f.floorNum;
                return (
                  <button
                    key={f.floorNum}
                    type="button"
                    disabled={isCurrent}
                    onMouseEnter={() => setHoveredElevatorFloor(f.floorNum)}
                    onMouseLeave={() => setHoveredElevatorFloor(null)}
                    onClick={() => {
                      setHoveredElevatorFloor(null);
                      handleFloorSelect(f.floorNum);
                    }}
                    className={`flex items-center gap-3.5 rounded-xl border px-3 py-2 text-left transition-all ${
                      isCurrent
                        ? 'border-sky-400/70 bg-slate-900/80'
                        : 'border-slate-600/60 bg-slate-900/50 hover:border-sky-300/70 hover:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-mono text-base font-bold transition-all ${
                        isCurrent
                          ? 'border-sky-400 bg-sky-500/25 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.6)]'
                          : 'border-slate-400/70 bg-slate-800 text-slate-100'
                      }`}
                    >
                      {f.floorNum}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{f.label}</span>
                        {isCurrent && (
                          <span className="rounded bg-sky-500/25 px-1.5 py-0.5 text-[10px] font-medium text-sky-300">
                            Hiện tại
                          </span>
                        )}
                      </div>
                      {f.desc && (
                        <div className="truncate text-[11px] text-slate-300">{f.desc}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {buildingDetail?.source?.label && (
              <p className="mt-3 text-center text-[10px] text-slate-400">
                {buildingDetail.source.label}
              </p>
            )}
          </div>
        </div>
      )}

      <LibraryHud />
    </>
  );
}
