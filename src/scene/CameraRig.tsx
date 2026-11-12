import { useEffect, useRef } from 'react';
import { CameraControls } from '@react-three/drei';
import { Box3, Vector3 } from 'three';
import { useReviewStore } from '../store/useReviewStore';

/** Góc nhìn toàn cảnh mặc định: từ phía cổng chính (+X) nhìn vào quảng trường, trên cao ~220 m. */
export const OVERVIEW_CAMERA = {
  position: [380, 220, -20] as const,
  target: [40, 0, -20] as const,
};

export default function CameraRig() {
  const controlsRef = useRef<CameraControls>(null);
  const cameraRequest = useReviewStore((s) => s.cameraRequest);
  const clearCameraRequest = useReviewStore((s) => s.clearCameraRequest);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    controls.setLookAt(
      OVERVIEW_CAMERA.position[0],
      OVERVIEW_CAMERA.position[1],
      OVERVIEW_CAMERA.position[2],
      OVERVIEW_CAMERA.target[0],
      OVERVIEW_CAMERA.target[1],
      OVERVIEW_CAMERA.target[2],
      false,
    );

    // Giới hạn camera trong phạm vi khuôn viên để không bay ra ngoài quá xa
    const boundaryBox = new Box3(
      new Vector3(-450, 0, -450),
      new Vector3(450, 300, 450),
    );
    controls.setBoundary(boundaryBox);
  }, []);

  // Xử lý yêu cầu điều khiển góc nhìn từ hộp thư cameraRequest (UI góp ý)
  useEffect(() => {
    if (!cameraRequest) return;
    const controls = controlsRef.current;
    if (!controls) return;

    const [px, py, pz] = cameraRequest.position;
    const [tx, ty, tz] = cameraRequest.target;

    controls.setLookAt(px, py, pz, tx, ty, tz, true);
    clearCameraRequest();
  }, [cameraRequest, clearCameraRequest]);

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      minDistance={30}
      maxDistance={700}
      maxPolarAngle={1.35}
    />
  );
}
