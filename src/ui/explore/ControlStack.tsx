import { useState } from 'react';
import { useExploreStore, type MoveMode } from '../../store/useExploreStore';
import { useWalkStore } from '../../store/useWalkStore';
import { useCampusStore } from '../../store/useCampusStore';
import { UI_TEXT, useT } from '../text';

const BTN_CIRCLE =
  'flex h-10 w-10 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition active:scale-95 sm:h-11 sm:w-11';

export default function ControlStack() {
  const tr = useT();
  const [fanOpen, setFanOpen] = useState(false);

  const walkMode = useWalkStore((s) => s.walkMode);
  const interior = useWalkStore((s) => s.interior);
  const selectedBuildingId = useCampusStore((s) => s.selectedBuildingId);

  const shuttleActive = useExploreStore((s) => s.shuttleActive);
  const droneView = useExploreStore((s) => s.droneView);
  const moveMode = useExploreStore((s) => s.moveMode);
  const musicEnabled = useExploreStore((s) => s.musicEnabled);

  const setMapOpen = useExploreStore((s) => s.setMapOpen);
  const boardShuttle = useExploreStore((s) => s.boardShuttle);
  const exitShuttle = useExploreStore((s) => s.exitShuttle);
  const toggleDroneView = useExploreStore((s) => s.toggleDroneView);
  const setMoveMode = useExploreStore((s) => s.setMoveMode);
  const setBikeModalOpen = useExploreStore((s) => s.setBikeModalOpen);
  const requestPhoto = useExploreStore((s) => s.requestPhoto);
  const toggleMusic = useExploreStore((s) => s.toggleMusic);

  // Khi đang mở BuildingPanel bên phải ở chế độ tổng quan, nhường mép phải cho panel thông tin
  if (!walkMode && selectedBuildingId) return null;

  const modeIcon = moveMode === 'bike' ? '🚲' : moveMode === 'run' ? '🏃' : '🚶';

  const selectMode = (mode: MoveMode) => {
    setMoveMode(mode);
    setFanOpen(false);
  };

  return (
    <div className="pointer-events-auto fixed bottom-20 right-3 z-40 flex flex-col items-end gap-2 sm:bottom-6 sm:right-5">
      {/* Nút Bản đồ 2D */}
      <button
        type="button"
        onClick={() => setMapOpen(true)}
        title={`${tr(UI_TEXT.exploreMapBtn)} (M)`}
        aria-label={tr(UI_TEXT.exploreMapBtn)}
        className={`${BTN_CIRCLE} border-white/30 bg-slate-950/80 text-lg text-white hover:bg-slate-900`}
      >
        🗺️
      </button>

      {/* Nút Xe điện tham quan */}
      {!interior && (
        <button
          type="button"
          onClick={() => (shuttleActive ? exitShuttle() : boardShuttle())}
          aria-pressed={shuttleActive}
          title={shuttleActive ? tr(UI_TEXT.exploreShuttleExit) : tr(UI_TEXT.exploreShuttleBoard)}
          aria-label={tr(UI_TEXT.exploreShuttleBtn)}
          className={`${BTN_CIRCLE} text-lg ${
            shuttleActive
              ? 'border-amber-300 bg-amber-500 text-slate-950 ring-2 ring-amber-300/60'
              : 'border-white/30 bg-slate-950/80 text-white hover:bg-slate-900'
          }`}
        >
          🚐
        </button>
      )}

      {/* Các nút chỉ dùng khi đang tự di chuyển ngoài khuôn viên */}
      {walkMode && !interior && !shuttleActive && (
        <>
          <button
            type="button"
            onClick={toggleDroneView}
            aria-pressed={droneView}
            title={tr(UI_TEXT.exploreDroneBtn)}
            aria-label={tr(UI_TEXT.exploreDroneBtn)}
            className={`${BTN_CIRCLE} text-lg ${
              droneView
                ? 'border-sky-300 bg-sky-600 text-white ring-2 ring-sky-300/60'
                : 'border-white/30 bg-slate-950/80 text-white hover:bg-slate-900'
            }`}
          >
            🚁
          </button>

          {/* Quạt chọn chế độ di chuyển: Đi bộ / Chạy / Xe đạp */}
          <div className="relative flex items-center gap-1.5">
            {fanOpen && (
              <div className="flex items-center gap-1 rounded-full border border-white/25 bg-slate-950/90 p-1 shadow-2xl backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => selectMode('walk')}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                    moveMode === 'walk' ? 'bg-emerald-500 text-slate-950' : 'text-white hover:bg-white/10'
                  }`}
                >
                  <span>🚶</span>
                  <span className="hidden sm:inline">{tr(UI_TEXT.exploreModeWalk)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectMode('run')}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                    moveMode === 'run' ? 'bg-amber-400 text-slate-950' : 'text-white hover:bg-white/10'
                  }`}
                >
                  <span>🏃</span>
                  <span className="hidden sm:inline">{tr(UI_TEXT.exploreModeRun)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectMode('bike')}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                    moveMode === 'bike' ? 'bg-sky-400 text-slate-950' : 'text-white hover:bg-white/10'
                  }`}
                >
                  <span>🚲</span>
                  <span className="hidden sm:inline">{tr(UI_TEXT.exploreModeBike)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFanOpen(false);
                    setBikeModalOpen(true);
                  }}
                  title={tr(UI_TEXT.exploreBikeCustomize)}
                  aria-label={tr(UI_TEXT.exploreBikeCustomize)}
                  className="rounded-full bg-white/15 px-2 py-1.5 text-xs text-white hover:bg-white/25"
                >
                  🎨
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setFanOpen((v) => !v)}
              aria-expanded={fanOpen}
              title={tr(UI_TEXT.exploreModeBike)}
              aria-label={tr(UI_TEXT.exploreModeWalk)}
              className={`${BTN_CIRCLE} text-lg ${
                moveMode === 'bike'
                  ? 'border-sky-300 bg-sky-600 text-white'
                  : moveMode === 'run'
                    ? 'border-amber-300 bg-amber-600 text-white'
                    : 'border-white/30 bg-slate-950/80 text-white hover:bg-slate-900'
              }`}
            >
              {modeIcon}
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }))}
            title={tr(UI_TEXT.exploreCameraBtn)}
            aria-label={tr(UI_TEXT.exploreCameraBtn)}
            className={`${BTN_CIRCLE} border-white/30 bg-slate-950/80 text-base text-white hover:bg-slate-900`}
          >
            🎥
          </button>
        </>
      )}

      {/* Nút Chụp ảnh */}
      <button
        type="button"
        onClick={requestPhoto}
        title={tr(UI_TEXT.explorePhotoBtn)}
        aria-label={tr(UI_TEXT.explorePhotoBtn)}
        className={`${BTN_CIRCLE} border-white/30 bg-slate-950/80 text-base text-white hover:bg-slate-900`}
      >
        📷
      </button>

      {/* Nút Nhạc nền thư giãn */}
      <button
        type="button"
        onClick={toggleMusic}
        aria-pressed={musicEnabled}
        title={tr(UI_TEXT.exploreMusicBtn)}
        aria-label={tr(UI_TEXT.exploreMusicBtn)}
        className={`${BTN_CIRCLE} text-base ${
          musicEnabled
            ? 'border-emerald-300 bg-emerald-600 text-white ring-2 ring-emerald-300/60'
            : 'border-white/30 bg-slate-950/80 text-white hover:bg-slate-900'
        }`}
      >
        🎵
      </button>
    </div>
  );
}
