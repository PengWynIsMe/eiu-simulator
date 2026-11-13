import { useEffect, useState, useRef } from 'react';
import { useWalkStore } from '../../store/useWalkStore';
import { getBuildingDetail } from '../../data';

interface ProximityState {
  interactive: {
    id: string;
    type: 'exterior-door' | 'interior-door' | 'elevator';
    label: string;
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

  // Đọc chi tiết thông tin các tầng từ dữ liệu chuẩn EIU
  const b3Detail = getBuildingDetail('b3');

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

  // Hiệu ứng Fade chuyển cảnh (~0.4s) khi vào, ra hoặc đổi tầng
  useEffect(() => {
    const prev = prevInterior.current;
    const cur = interior;
    prevInterior.current = cur ? { ...cur } : null;

    const isEntering = !prev && cur;
    const isExiting = prev && !cur;
    const isChangingFloor = prev && cur && prev.floor !== cur.floor;

    if (isEntering || isExiting || isChangingFloor) {
      // Fade in to black
      setFadeOpacity(1);
      const timer = setTimeout(() => {
        // Fade out from black
        setFadeOpacity(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [interior]);

  useEffect(() => {
    // Reset proximity ngay khi trạng thái interior thay đổi
    setProximity({ interactive: null, activeRoom: null });
  }, [interior]);

  // Đóng bảng thang máy khi thoát chế độ đi bộ hoặc ra ngoài
  useEffect(() => {
    if (!walkMode || !interior) {
      setElevatorOpen(false);
    }
  }, [walkMode, interior]);

  // Phím tắt 1, 2, 3 và Escape cho bảng thang máy
  useEffect(() => {
    if (!elevatorOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable]')) return;
      if (e.key === '1') {
        useWalkStore.getState().setInteriorFloor(1);
        setElevatorOpen(false);
      } else if (e.key === '2') {
        useWalkStore.getState().setInteriorFloor(2);
        setElevatorOpen(false);
      } else if (e.key === '3') {
        useWalkStore.getState().setInteriorFloor(3);
        setElevatorOpen(false);
      } else if (e.key === 'Escape') {
        setElevatorOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [elevatorOpen]);

  if (!walkMode) return null;

  const handleActionClick = () => {
    const inter = proximity.interactive;
    if (!inter) return;
    if (inter.type === 'exterior-door') {
      useWalkStore.getState().enterInterior('b3');
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

      {/* 4. Bảng điều khiển Thang máy Block 3 (Elevator Modal) */}
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
                    Thang máy Block 3
                  </h3>
                  <p className="text-xs text-slate-400">Khoa Quản trị Kinh doanh</p>
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
              {[
                {
                  floorNum: 3,
                  label: 'Tầng 3',
                  desc: 'Thông tầng 200.B3 · Giảng đường 5 & 6 · Văn phòng QTKD',
                },
                {
                  floorNum: 2,
                  label: 'Tầng 2',
                  desc: 'Hội trường 200.B3 (544 chỗ) · Giảng đường 1 đến 4',
                },
                {
                  floorNum: 1,
                  label: 'Tầng 1 (Trệt)',
                  desc: 'Sảnh đón tiếp · Văn phòng Khoa QTKD & Honors · Phòng VIP · Hội thảo · OCE',
                },
              ].map((f) => {
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

            {b3Detail?.subtitle && (
              <p className="mt-4 text-center text-xs text-slate-400">
                {b3Detail.subtitle}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
