import { useEffect, useState, useRef } from 'react';
import { useWalkStore } from '../../store/useWalkStore';
import { getBuilding, getBuildingDetail } from '../../data';
import { getInteriorLayout } from '../../scene/interior/layouts';

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
  const [fadeOpacity, setFadeOpacity] = useState(0);

  const prevInterior = useRef<{ buildingId: string; floor: number } | null>(null);

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

    window.addEventListener('campussim:interior-proximity', handleProximity);
    window.addEventListener('campussim:open-elevator', handleOpenElevator);
    return () => {
      window.removeEventListener('campussim:interior-proximity', handleProximity);
      window.removeEventListener('campussim:open-elevator', handleOpenElevator);
    };
  }, []);

  // Hiệu ứng Fade chuyển cảnh (~0.3s) khi vào, ra hoặc đổi tầng
  useEffect(() => {
    const prev = prevInterior.current;
    const cur = interior;
    prevInterior.current = cur ? { ...cur } : null;

    const isEntering = !prev && cur;
    const isExiting = prev && !cur;
    const isChangingFloor = prev && cur && prev.floor !== cur.floor;

    if (isEntering || isExiting || isChangingFloor) {
      setFadeOpacity(1);
      const timer = setTimeout(() => {
        setFadeOpacity(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [interior]);

  useEffect(() => {
    setProximity({ interactive: null, activeRoom: null });
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
        useWalkStore.getState().setInteriorFloor(num);
        setElevatorOpen(false);
      } else if (e.key === 'Escape') {
        setElevatorOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [elevatorOpen, maxFloors]);

  if (!walkMode) return null;

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
    useWalkStore.getState().setInteriorFloor(targetFloor);
    setElevatorOpen(false);
  };

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

  return (
    <>
      {/* 1. Màn mờ đen chuyển cảnh (Fade Transition) */}
      <div
        className="pointer-events-none fixed inset-0 z-50 bg-slate-950 transition-opacity duration-200 ease-out"
        style={{ opacity: fadeOpacity }}
        aria-hidden="true"
      />

      {/* 2. Thẻ thông tin phòng học / không gian đang đứng (Active Room Card) */}
      {interior && proximity.activeRoom && (
        <div className="pointer-events-none fixed top-16 left-1/2 z-40 -translate-x-1/2">
          <div className="flex max-w-md flex-col items-center rounded-2xl border border-sky-400/40 bg-slate-950/80 px-5 py-3 text-center shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-xs font-semibold text-sky-300">
                {currentFloorLabel}
              </span>
              <span className="text-sm font-bold text-sky-400">
                {proximity.activeRoom.code}
              </span>
            </div>
            <div className="mt-1 text-sm font-medium text-white">
              {proximity.activeRoom.name}
            </div>
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

      {/* 4. Bảng điều khiển Thang máy (Elevator Modal) */}
      {elevatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="elevator-modal-title"
            className="relative w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900/95 p-6 text-white shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500 text-sm font-bold text-white">
                  ↕
                </span>
                <div>
                  <h3 id="elevator-modal-title" className="font-semibold text-white">
                    {`Thang máy ${buildingInfo?.shortName ?? buildingInfo?.name ?? 'Tòa nhà'}`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {buildingDetail?.subtitle ?? buildingInfo?.name ?? ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                onClick={() => setElevatorOpen(false)}
                aria-label="Đóng bảng thang máy"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2.5">
              {elevatorFloors.map((f) => {
                const isCurrent = interior?.floor === f.floorNum;
                return (
                  <button
                    key={f.floorNum}
                    type="button"
                    disabled={isCurrent}
                    onClick={() => handleFloorSelect(f.floorNum)}
                    className={`flex items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                      isCurrent
                        ? 'border-sky-500/80 bg-sky-950/40 opacity-80'
                        : 'border-slate-800 bg-slate-800/60 hover:border-sky-400 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{f.label}</span>
                        {isCurrent && (
                          <span className="rounded bg-sky-500/30 px-2 py-0.5 text-xs text-sky-300">
                            Đang ở đây
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-300">{f.desc}</div>
                    </div>
                    <span className="hidden rounded bg-slate-700 px-2 py-1 text-xs font-mono text-slate-300 md:inline-block">
                      Phím {f.floorNum}
                    </span>
                  </button>
                );
              })}
            </div>

            {buildingDetail?.source?.label && (
              <p className="mt-4 text-center text-[10px] text-slate-400">
                {buildingDetail.source.label}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
