export interface WallLine {
  p1x: number;
  p1z: number;
  p2x: number;
  p2z: number;
}

export interface FocusedCameraParams {
  playerPos: readonly [number, number, number];
  targetPos: readonly [number, number, number];
  wallLines?: readonly WallLine[];
  /** Kiểm tra tia nhìn từ camera tới mặt nhân vật có bị che bởi vật cản 3D (cột, thân cây...) hay không */
  isObstacleBetween?: (from: [number, number, number], to: [number, number, number]) => boolean;
}

export interface FocusedCameraResult {
  camPos: [number, number, number];
  lookAt: [number, number, number];
}

/** Chiều cao mắt thật của model nhân vật chibi (scale 2.0) */
export const CHIBI_EYE_HEIGHT = 1.05;
/** Điểm nhìn ngang ngực để tâm mặt nằm ở 35–45% chiều cao màn hình (FOV 45°) */
export const CHIBI_LOOK_HEIGHT = 0.87;
/** Khoảng cách chuẩn quan sát nhân vật chibi (2.0–2.4 m) */
export const DIALOGUE_CAMERA_DIST = 2.2;

/** Kiểm tra giao điểm giữa 2 đoạn thẳng 2D trên mặt phẳng X-Z. */
export function lineSegmentsIntersect(
  x1: number, z1: number, x2: number, z2: number,
  x3: number, z3: number, x4: number, z4: number
): boolean {
  const ccw = (ax: number, az: number, bx: number, bz: number, cx: number, cz: number) =>
    (cz - az) * (bx - ax) > (bz - az) * (cx - ax);
  return (
    ccw(x1, z1, x3, z3, x4, z4) !== ccw(x2, z2, x3, z3, x4, z4) &&
    ccw(x1, z1, x2, z2, x3, z3) !== ccw(x1, z1, x2, z2, x4, z4)
  );
}

/**
 * Camera nói chuyện góc nhìn thứ nhất (nhìn bằng mắt thật của nhân vật chibi):
 * - Camera cao bằng mắt thật: cao 1.05 m so với sàn người chơi đứng.
 * - Điểm nhìn (lookAt): cao 0.87 m so với sàn người nói để tâm mặt ở 35–45% chiều cao màn.
 * - Khoảng cách: 2.0–2.4 m (chuẩn 2.2 m).
 * - Tránh vật cản (cột, thân cây che mặt): xoay quanh người nói theo từng 20 độ tới 120 độ,
 *   chọn góc đầu tiên thông; trong nhà vẫn không xuyên tường.
 */
export function selectFocusedCameraPosition({
  playerPos,
  targetPos,
  wallLines = [],
  isObstacleBetween,
}: FocusedCameraParams): FocusedCameraResult {
  const lookAt: [number, number, number] = [targetPos[0], targetPos[1] + CHIBI_LOOK_HEIGHT, targetPos[2]];
  const targetFace: [number, number, number] = [targetPos[0], targetPos[1] + CHIBI_EYE_HEIGHT, targetPos[2]];
  const eyeY = playerPos[1] + CHIBI_EYE_HEIGHT;

  const dx = playerPos[0] - targetPos[0];
  const dz = playerPos[2] - targetPos[2];
  const dist = Math.hypot(dx, dz);
  const baseAngle = dist > 1e-4 ? Math.atan2(dx, dz) : 0;
  const desiredDist = DIALOGUE_CAMERA_DIST;

  // Các góc lệch thử nghiệm: 0°, 20°, -20°, 40°, -40°... tới 120°, -120°
  const angleOffsetsDeg = [0, 20, -20, 40, -40, 60, -60, 80, -80, 100, -100, 120, -120];

  let fallbackCamPos: [number, number, number] | null = null;

  for (const offsetDeg of angleOffsetsDeg) {
    const angle = baseAngle + (offsetDeg * Math.PI) / 180;
    const camX = targetPos[0] + desiredDist * Math.sin(angle);
    const camZ = targetPos[2] + desiredDist * Math.cos(angle);
    const candidateCamPos: [number, number, number] = [camX, eyeY, camZ];

    // 1. Kiểm tra va chạm với tường trong nhà (đoạn nối camPos -> targetPos không cắt tường)
    let hitsWall = false;
    for (const w of wallLines) {
      if (lineSegmentsIntersect(camX, camZ, targetPos[0], targetPos[2], w.p1x, w.p1z, w.p2x, w.p2z)) {
        hitsWall = true;
        break;
      }
    }
    if (hitsWall) continue;

    // Lưu candidate đầu tiên không xuyên tường làm fallback nếu mọi góc đều bị cây/cột che
    if (!fallbackCamPos) {
      fallbackCamPos = candidateCamPos;
    }

    // 2. Kiểm tra vật cản 3D (cột, thân cây) chắn tia nhìn từ camera tới mặt người nói
    if (isObstacleBetween && isObstacleBetween(candidateCamPos, targetFace)) {
      continue;
    }

    // Góc này hoàn toàn thông suốt!
    return { camPos: candidateCamPos, lookAt };
  }

  // Nếu mọi góc đều bị che, dùng vị trí fallback không xuyên tường đầu tiên
  if (fallbackCamPos) {
    return { camPos: fallbackCamPos, lookAt };
  }

  // Fallback an toàn tuyệt đối tại vị trí hiện tại của người chơi
  return { camPos: [playerPos[0], eyeY, playerPos[2]], lookAt };
}
