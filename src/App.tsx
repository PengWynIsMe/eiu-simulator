import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import Campus from './scene/Campus';
import { OVERVIEW_CAMERA } from './scene/CameraRig';
import TopBar from './ui/TopBar';
import ReviewPanel from './ui/ReviewPanel';
import WalkHud from './ui/walk/WalkHud';
import InteriorHud from './ui/interior/InteriorHud';
import BuildingPanel from './ui/BuildingPanel';
import { useWalkStore } from './store/useWalkStore';
import { useReviewStore } from './store/useReviewStore';

export default function App() {
  const reviewMode = useReviewStore((s) => s.reviewMode);
  const walkMode = useWalkStore((s) => s.walkMode);

  useEffect(() => {
    void useReviewStore.getState().load();

    // Giữ trạng thái reviewMode khi Vite dev server reload sau khi ghi file
    const savedReviewMode = sessionStorage.getItem('campussim.reviewMode');
    if (savedReviewMode === 'true' && !useReviewStore.getState().reviewMode) {
      useReviewStore.getState().toggleReviewMode();
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
        camera={{
          position: [OVERVIEW_CAMERA.position[0], OVERVIEW_CAMERA.position[1], OVERVIEW_CAMERA.position[2]],
          fov: 45,
          near: 5,
          far: 2500,
        }}
      >
        <Campus />
      </Canvas>
      <TopBar />
      {reviewMode && <ReviewPanel />}
      {!reviewMode && !walkMode && <BuildingPanel />}
      {/* Luồng C (T09) — giữ nguyên dòng này */}
      <WalkHud />
      {/* T12 — nội thất: nút vào/ra, chọn tầng thang máy, thẻ phòng */}
      <InteriorHud />
    </div>
  );
}
