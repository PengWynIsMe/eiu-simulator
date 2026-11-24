export interface WallLine {
  p1x?: number;
  p1z?: number;
  p2x?: number;
  p2z?: number;
  x1?: number;
  z1?: number;
  x2?: number;
  z2?: number;
}

export interface FocusedCameraParams {
  playerPos: readonly [number, number, number];
  targetPos: readonly [number, number, number];
  wallLines?: readonly WallLine[];
}

export interface FocusedCameraResult {
  camPos: [number, number, number];
  lookAt: [number, number, number];
}

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
 * Camera nói chuyện góc nhìn thứ nhất (nhìn bằng mắt người chơi):
 * - Mắt người chơi: cao 1.5 m so với sàn người chơi đứng.
 * - Điểm nhìn (lookAt): vào mặt người nói, cao 1.3 m so với sàn người nói.
 * - Khoảng cách: nếu gần hơn 1.6 m thì lùi camera tối đa tới 1.8 m (khoảng 1.6–2.0 m) nhưng không xuyên tường.
 */
export function selectFocusedCameraPosition({
  playerPos,
  targetPos,
  wallLines = [],
}: FocusedCameraParams): FocusedCameraResult {
  const lookAt: [number, number, number] = [targetPos[0], targetPos[1] + 1.3, targetPos[2]];
  const eyeY = playerPos[1] + 1.5;

  const dx = playerPos[0] - targetPos[0];
  const dz = playerPos[2] - targetPos[2];
  const dist = Math.hypot(dx, dz);

  if (dist >= 1.6) {
    return { camPos: [playerPos[0], eyeY, playerPos[2]], lookAt };
  }

  const dirX = dist > 1e-4 ? dx / dist : 0;
  const dirZ = dist > 1e-4 ? dz / dist : 1;
  const desiredDist = 1.8;

  let chosenDist = desiredDist;
  const startX = playerPos[0];
  const startZ = playerPos[2];
  const endX = targetPos[0] + dirX * desiredDist;
  const endZ = targetPos[2] + dirZ * desiredDist;

  // Kiểm tra va chạm với tường/lan can trên đường lùi
  for (const w of wallLines) {
    const wx1 = w.p1x ?? w.x1 ?? 0;
    const wz1 = w.p1z ?? w.z1 ?? 0;
    const wx2 = w.p2x ?? w.x2 ?? 0;
    const wz2 = w.p2z ?? w.z2 ?? 0;
    if (lineSegmentsIntersect(startX, startZ, endX, endZ, wx1, wz1, wx2, wz2)) {
      // Có tường cản: không lùi qua tường, giữ nguyên vị trí mắt an toàn
      chosenDist = dist;
      break;
    }
  }

  const camPos: [number, number, number] = [
    targetPos[0] + dirX * chosenDist,
    eyeY,
    targetPos[2] + dirZ * chosenDist,
  ];

  return { camPos, lookAt };
}
