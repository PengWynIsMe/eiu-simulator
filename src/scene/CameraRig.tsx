import { useEffect, useRef } from 'react';
import { CameraControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Box3, Vector3 } from 'three';
import type { Building } from '../types';
import { getBuilding } from '../data';
import { useCampusStore } from '../store/useCampusStore';
import { useReviewStore } from '../store/useReviewStore';
import { useSnowStore } from '../store/useSnowStore';

/** Góc nhìn toàn cảnh mặc định: từ phía cổng chính (+X) nhìn vào quảng trường, trên cao ~220 m. */
export const OVERVIEW_CAMERA = {
  position: [380, 220, -20] as const,
  target: [40, 0, -20] as const,
};

/**
 * Tính vị trí camera và điểm nhìn (target) khi bay tới một tòa nhà:
 * - Góc nhìn: từ phía cổng chính (+X) hơi chếch lên ~35°.
 * - Khoảng cách tính theo cạnh dài khung nền (tối thiểu ~40 m để ki-ốt không zoom quá sát).
 * - Desktop: dời sang trái một chút để panel thông tin bên phải (~400 px) không che tòa.
 * - Điện thoại: panel ở dưới → dời điểm nhìn lên để tòa nằm ở nửa trên màn hình.
 */
export function computeBuildingCameraPose(
  building: Building,
  viewport: { width: number; height: number },
): { position: [number, number, number]; target: [number, number, number] } {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const [x, z] of building.shape.outer) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const sizeX = maxX - minX;
  const sizeZ = maxZ - minZ;
  const maxDim = Math.max(sizeX, sizeZ);

  const bCenterX = (minX + maxX) * 0.5;
  const bCenterZ = (minZ + maxZ) * 0.5;
  const bCenterY = Math.max(building.height * 0.45, 1.5);

  // Góc nhìn: từ phía cổng chính (+X) hơi chếch lên ~35°
  const pitch = (35 * Math.PI) / 180;
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  const aspect = viewport.width / Math.max(viewport.height, 1);
  const isMobile = viewport.width < 768;

  // Khoảng cách theo cạnh dài khung nền (ki-ốt tối thiểu ~45 m)
  const baseDist = Math.max(maxDim * 1.25 + 15, 45);
  // Điện thoại màn hình dọc hẹp: lùi xa hơn theo tỷ lệ khung hình để tòa nhà không bị tràn mép
  const distance = isMobile ? Math.max(baseDist * (1.15 / Math.max(aspect, 0.5)), 45) : baseDist;

  let targetX = bCenterX;
  let targetY = bCenterY;
  let targetZ = bCenterZ;

  if (isMobile) {
    // Điện thoại: panel ở dưới (~50-58vh) → dời điểm nhìn lên
    // (camera & target dời xuống trong screen space để tòa nhà nổi lên nửa trên màn hình)
    const vShift = 0.35 * distance;
    targetX = bCenterX + vShift * sinP;
    targetY = Math.max(0.5, bCenterY - vShift * cosP);
  } else {
    // Desktop: panel ở bên phải (~400 px) → dời sang trái một chút
    // (dời target & camera theo trục screen-right -Z để tòa nhà hiện ở vùng trống bên trái)
    const shiftRight = Math.min(0.20 * distance, 35);
    targetZ = bCenterZ - shiftRight;
  }

  const camX = targetX + distance * cosP;
  const camY = targetY + distance * sinP;
  const camZ = targetZ;

  return {
    position: [camX, camY, camZ],
    target: [targetX, targetY, targetZ],
  };
}

export default function CameraRig() {
  const controlsRef = useRef<CameraControls>(null);
  const { size } = useThree();
  const sizeRef = useRef(size);
  sizeRef.current = size;

  const selectedBuildingId = useCampusStore((s) => s.selectedBuildingId);
  const reviewMode = useReviewStore((s) => s.reviewMode);
  const isCinematicActive = useSnowStore((s) => s.isCinematicActive);
  const cameraRequest = useReviewStore((s) => s.cameraRequest);
  const clearCameraRequest = useReviewStore((s) => s.clearCameraRequest);

  const isFirstMount = useRef(true);
  const prevBuildingIdRef = useRef<string | null>(null);

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

  // Bay tới tòa nhà khi chọn / bay về toàn cảnh khi bỏ chọn
  useEffect(() => {
    // Nếu có cameraRequest đang chờ thì ưu tiên cameraRequest thắng
    if (useReviewStore.getState().cameraRequest) return;
    // Đang ở chế độ góp ý: không bay (bấm tòa chỉ tạo draft)
    if (reviewMode) return;

    const controls = controlsRef.current;
    if (!controls) return;

    // Lần đầu mở app: không bay (đã được OVERVIEW_CAMERA khởi tạo không hiệu ứng)
    if (isFirstMount.current) {
      isFirstMount.current = false;
      prevBuildingIdRef.current = selectedBuildingId;
      if (!selectedBuildingId) return;
    }

    if (selectedBuildingId) {
      const building = getBuilding(selectedBuildingId);
      if (building) {
        const { position, target } = computeBuildingCameraPose(building, sizeRef.current);
        controls.setLookAt(
          position[0],
          position[1],
          position[2],
          target[0],
          target[1],
          target[2],
          true,
        );
      }
    } else if (prevBuildingIdRef.current !== null) {
      // Vừa bấm "Về tổng quan" / đóng panel (từ có id thành null)
      controls.setLookAt(
        OVERVIEW_CAMERA.position[0],
        OVERVIEW_CAMERA.position[1],
        OVERVIEW_CAMERA.position[2],
        OVERVIEW_CAMERA.target[0],
        OVERVIEW_CAMERA.target[1],
        OVERVIEW_CAMERA.target[2],
        true,
      );
    }

    prevBuildingIdRef.current = selectedBuildingId;
  }, [selectedBuildingId, reviewMode]);

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      minDistance={isCinematicActive ? 5 : 30}
      maxDistance={700}
      maxPolarAngle={isCinematicActive ? 1.52 : 1.35}
    />
  );
}
