import { useEffect, useMemo, useRef } from 'react';
import { CatmullRomCurve3, Vector3 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { CameraControls } from '@react-three/drei';
import { useSnowStore } from '../../store/useSnowStore';
import { OVERVIEW_CAMERA } from '../CameraRig';

/** Thời lượng bay điện ảnh (giây) */
const CINEMATIC_DURATION = 14.0;

export default function SnowCinematicCamera() {
  const isCinematicActive = useSnowStore((s) => s.isCinematicActive);
  const endCinematic = useSnowStore((s) => s.endCinematic);
  const controls = useThree((s) => s.controls) as CameraControls | null;

  const elapsedTimeRef = useRef(0);
  const tempPos = useMemo(() => new Vector3(), []);
  const tempTarget = useMemo(() => new Vector3(), []);

  // Đường cong bay của camera từ ngoài Cổng chính (+X) qua vòm cổng vào quảng trường trung tâm
  const { posCurve, targetCurve } = useMemo(() => {
    const pos = new CatmullRomCurve3([
      new Vector3(335, 18, -26), // Ngoài cổng chính, đường Nam Kỳ Khởi Nghĩa
      new Vector3(255, 12, -26), // Lướt qua vòm Cổng chính
      new Vector3(160, 16, -24), // Dọc đại lộ trung tâm, qua hồ nước tuyết trắng
      new Vector3(85, 38, -20),  // Bay vút lên cao, thu trọn tầm mắt quảng trường
      new Vector3(35, 52, -18),  // Góc nhìn trên cao quảng trường tròn
    ]);
    const target = new CatmullRomCurve3([
      new Vector3(220, 8, -26),
      new Vector3(150, 6, -26),
      new Vector3(60, 6, -20),
      new Vector3(10, 4, -15),
      new Vector3(-30, 4, -15),
    ]);
    return { posCurve: pos, targetCurve: target };
  }, []);

  // Reset thời gian khi bắt đầu cinematic
  useEffect(() => {
    if (isCinematicActive) {
      elapsedTimeRef.current = 0;
    }
  }, [isCinematicActive]);

  useFrame((_, delta) => {
    if (!isCinematicActive || !controls) return;

    elapsedTimeRef.current += delta;
    const progress = Math.min(elapsedTimeRef.current / CINEMATIC_DURATION, 1.0);

    // Easing mượt mà (smoothstep)
    const easedT = progress * progress * (3 - 2 * progress);

    posCurve.getPoint(easedT, tempPos);
    targetCurve.getPoint(easedT, tempTarget);

    // Khi đã đến cuối hành trình, trôi nhẹ nhàng trong tuyết trong khi chờ người dùng bấm "Vào tham quan"
    if (progress >= 1.0) {
      const extraTime = elapsedTimeRef.current - CINEMATIC_DURATION;
      tempPos.x += Math.sin(extraTime * 0.15) * 2.0;
      tempPos.z += Math.cos(extraTime * 0.12) * 2.0;
    }

    controls.setLookAt(
      tempPos.x,
      tempPos.y,
      tempPos.z,
      tempTarget.x,
      tempTarget.y,
      tempTarget.z,
      false,
    );
  });

  // Khi kết thúc cinematic, chuyển camera mượt mà về OVERVIEW_CAMERA
  const prevActiveRef = useRef(isCinematicActive);
  useEffect(() => {
    if (prevActiveRef.current && !isCinematicActive && controls) {
      controls.enabled = true;
      void controls.setLookAt(
        OVERVIEW_CAMERA.position[0],
        OVERVIEW_CAMERA.position[1],
        OVERVIEW_CAMERA.position[2],
        OVERVIEW_CAMERA.target[0],
        OVERVIEW_CAMERA.target[1],
        OVERVIEW_CAMERA.target[2],
        true,
      );
    }
    prevActiveRef.current = isCinematicActive;
  }, [isCinematicActive, controls]);

  // Cho phép bấm phím Escape hoặc phím Space để bỏ qua cảnh mở đầu
  useEffect(() => {
    if (!isCinematicActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        endCinematic();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCinematicActive, endCinematic]);

  return null;
}
