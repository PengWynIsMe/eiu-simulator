import { Component, useEffect, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import Campus from './scene/Campus';
import { OVERVIEW_CAMERA } from './scene/CameraRig';
import TopBar from './ui/TopBar';
import ReviewPanel from './ui/ReviewPanel';
import WalkHud from './ui/walk/WalkHud';
import InteriorHud from './ui/interior/InteriorHud';
import LessonLayer from './ui/lesson/LessonLayer';
import SilverLayer from './ui/silver/SilverLayer';
import WorldLayer from './ui/silverWorld/WorldLayer';
import BuildingPanel from './ui/BuildingPanel';
import SnowIntroOverlay from './ui/snow/SnowIntroOverlay';
import { attachWebglCanvas } from './ui/silver/presentation';
import { useWalkStore } from './store/useWalkStore';
import { useReviewStore } from './store/useReviewStore';
import { useSnowStore } from './store/useSnowStore';
import { useCampusStore } from './store/useCampusStore';

interface WebglErrorBoundaryProps {
  children: ReactNode;
}

interface WebglErrorBoundaryState {
  hasError: boolean;
}

class WebglErrorBoundary extends Component<WebglErrorBoundaryProps, WebglErrorBoundaryState> {
  constructor(props: WebglErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): WebglErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error) {
    console.warn('[WebglErrorBoundary] WebGL / Canvas failed:', error);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 p-6 text-center text-white z-0">
          <div className="max-w-md rounded-2xl border border-white/10 bg-slate-800/90 p-5 shadow-2xl backdrop-blur-md">
            <p className="text-sm font-semibold text-amber-300 mb-1">
              Trình duyệt không hỗ trợ WebGL hoặc đã mất ngữ cảnh đồ họa. Đang dùng chế độ 2D.
            </p>
            <p className="text-xs text-slate-400">
              WebGL is not supported or GPU context was lost. Running in 2D mode.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const reviewMode = useReviewStore((s) => s.reviewMode);
  const walkMode = useWalkStore((s) => s.walkMode);
  const isCinematicActive = useSnowStore((s) => s.isCinematicActive);

  useEffect(() => {
    void useReviewStore.getState().load();

    // Giữ trạng thái reviewMode khi Vite dev server reload sau khi ghi file (bọc try/catch phòng khi storage bị chặn)
    try {
      const savedReviewMode = sessionStorage.getItem('campussim.reviewMode');
      if (savedReviewMode === 'true' && !useReviewStore.getState().reviewMode) {
        useReviewStore.getState().toggleReviewMode();
      }
    } catch {
      // bỏ qua lỗi storage bị chặn
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
    try {
      sessionStorage.setItem('campussim.reviewMode', String(reviewMode));
    } catch {
      // bỏ qua lỗi storage bị chặn
    }
  }, [reviewMode]);

  return (
    <div className="relative h-full w-full">
      <WebglErrorBoundary>
        <Canvas
          shadows
          dpr={[1, 2]}
          onCreated={({ gl, scene }) => {
            attachWebglCanvas(gl.domElement);
            if (import.meta.env.DEV) {
              (window as unknown as Record<string, unknown>).__gl = gl;
              (window as unknown as Record<string, unknown>).__scene = scene;
            }
          }}
          camera={{
            position: [OVERVIEW_CAMERA.position[0], OVERVIEW_CAMERA.position[1], OVERVIEW_CAMERA.position[2]],
            fov: 45,
            near: 0.35,
            far: 2000,
          }}
        >
          <Campus />
        </Canvas>
      </WebglErrorBoundary>
      <SnowIntroOverlay />
      {!isCinematicActive && <TopBar />}
      {!isCinematicActive && reviewMode && <ReviewPanel />}
      {!isCinematicActive && !reviewMode && !walkMode && <BuildingPanel />}
      {/* Luồng C (T09) — giữ nguyên dòng này */}
      {!isCinematicActive && <WalkHud />}
      {/* T12 — nội thất: nút vào/ra, chọn tầng thang máy, thẻ phòng */}
      {!isCinematicActive && <InteriorHud />}
      {!isCinematicActive && <LessonLayer />}
      {!isCinematicActive && <SilverLayer />}
      <WorldLayer />
    </div>
  );
}
