import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import Campus from './scene/Campus';
import { OVERVIEW_CAMERA } from './scene/CameraRig';
import TopBar from './ui/TopBar';
import ReviewPanel from './ui/ReviewPanel';
import WalkHud from './ui/walk/WalkHud';
import InteriorHud from './ui/interior/InteriorHud';
import LessonLayer from './ui/lesson/LessonLayer';
import BuildingPanel from './ui/BuildingPanel';
import SnowIntroOverlay from './ui/snow/SnowIntroOverlay';
import { useWalkStore } from './store/useWalkStore';
import { useReviewStore } from './store/useReviewStore';
import { useSnowStore } from './store/useSnowStore';
import { useCampusStore } from './store/useCampusStore';

export default function App() {
  const reviewMode = useReviewStore((s) => s.reviewMode);
  const walkMode = useWalkStore((s) => s.walkMode);
  const isCinematicActive = useSnowStore((s) => s.isCinematicActive);

  useEffect(() => {
    void useReviewStore.getState().load();

    // Giữ trạng thái reviewMode khi Vite dev server reload sau khi ghi file
    const savedReviewMode = sessionStorage.getItem('campussim.reviewMode');
    if (savedReviewMode === 'true' && !useReviewStore.getState().reviewMode) {
      useReviewStore.getState().toggleReviewMode();
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const bId = params.get('building');
      if (bId) {
        setTimeout(() => useCampusStore.getState().selectBuilding(bId), 600);
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('campussim.reviewMode', String(reviewMode));
  }, [reviewMode]);

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__gl = gl;
        }}
        camera={{
          position: [OVERVIEW_CAMERA.position[0], OVERVIEW_CAMERA.position[1], OVERVIEW_CAMERA.position[2]],
          fov: 45,
          near: 0.3,
          far: 2500,
        }}
      >
        <Campus />
      </Canvas>
      <SnowIntroOverlay />
      {!isCinematicActive && <TopBar />}
      {!isCinematicActive && reviewMode && <ReviewPanel />}
      {!isCinematicActive && !reviewMode && !walkMode && <BuildingPanel />}
      {/* Luồng C (T09) — giữ nguyên dòng này */}
      {!isCinematicActive && <WalkHud />}
      {/* T12 — nội thất: nút vào/ra, chọn tầng thang máy, thẻ phòng */}
      {!isCinematicActive && <InteriorHud />}
      {!isCinematicActive && <LessonLayer />}
    </div>
  );
}
