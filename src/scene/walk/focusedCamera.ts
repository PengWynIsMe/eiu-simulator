export interface Vec3Tuple {
  0: number;
  1: number;
  2: number;
}

export interface WallSegment {
  p1x: number;
  p1z: number;
  p2x: number;
  p2z: number;
}

export interface TreeObstacle {
  x: number;
  z: number;
  radius: number;
  yBottom?: number;
  yTop?: number;
}

export interface ActorObstacle {
  speaker: string;
  x: number;
  z: number;
  radius?: number;
}

export interface FocusedCameraParams {
  playerPos: readonly [number, number, number];
  targetPos: readonly [number, number, number];
  speakerHeadHeight?: number;
  playerHeadHeight?: number;
  isInterior?: boolean;
  wallLines?: readonly WallSegment[];
  ceilingHeight?: number;
  actors?: readonly ActorObstacle[];
  trees?: readonly TreeObstacle[];
  canopyY?: number;
}

export interface FocusedCandidate {
  name: string;
  camPos: [number, number, number];
  lookAt: [number, number, number];
  distToTarget: number;
  camHeight: number;
  isClear: boolean;
  penalty: number;
  reason?: string;
}

export interface FocusedCameraResult {
  camPos: [number, number, number];
  lookAt: [number, number, number];
  candidateName: string;
  isClear: boolean;
  score: number;
  candidatesTested: number;
}

/** Tính khoảng cách từ điểm (px, pz) tới đoạn thẳng (x1, z1) -> (x2, z2) trên mặt phẳng 2D. */
export function distToSegment2D(
  px: number,
  pz: number,
  x1: number,
  z1: number,
  x2: number,
  z2: number
): number {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < 1e-6) return Math.hypot(px - x1, pz - z1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (pz - z1) * dz) / lenSq));
  const projX = x1 + t * dx;
  const projZ = z1 + t * dz;
  return Math.hypot(px - projX, pz - projZ);
}

/** Kiểm tra hai đoạn thẳng 2D (p1->p2) và (q1->q2) có giao nhau không. */
export function lineSegmentsIntersect(
  p1x: number,
  p1z: number,
  p2x: number,
  p2z: number,
  q1x: number,
  q1z: number,
  q2x: number,
  q2z: number
): boolean {
  const d1x = p2x - p1x;
  const d1z = p2z - p1z;
  const d2x = q2x - q1x;
  const d2z = q2z - q1z;
  const cross = d1x * d2z - d1z * d2x;
  if (Math.abs(cross) < 1e-6) return false;

  const dx = q1x - p1x;
  const dz = q1z - p1z;
  const t1 = (dx * d2z - dz * d2x) / cross;
  const t2 = (dx * d1z - dz * d1x) / cross;

  return t1 > 0.05 && t1 < 0.95 && t2 >= 0.0 && t2 <= 1.0;
}

/**
 * Danh sách cây cối cố định quanh các khu vực giao tiếp ngoài trời
 * (đặc biệt là 2 cây liễu trước cửa Nam B8: [18.04, -162.42] và [17.36, -167.78]).
 */
export const OUTDOOR_FOCUS_TREES: readonly TreeObstacle[] = [
  { x: 18.04, z: -162.42, radius: 1.8, yBottom: 1.2, yTop: 5.5 },
  { x: 17.36, z: -167.78, radius: 1.8, yBottom: 1.2, yTop: 5.5 },
  { x: 25.33, z: -165.56, radius: 2.0, yBottom: 1.2, yTop: 5.5 },
  { x: 18.76, z: -174.67, radius: 2.0, yBottom: 1.2, yTop: 5.5 },
  { x: 13.44, z: -173.73, radius: 2.0, yBottom: 1.2, yTop: 5.5 },
  { x: -5.0, z: -150.0, radius: 2.0, yBottom: 1.2, yTop: 5.5 }, // Cạnh sân PE
  { x: -8.0, z: -158.0, radius: 2.0, yBottom: 1.2, yTop: 5.5 },
];

/**
 * Sinh danh sách các vị trí ứng viên camera focused (qua vai phải, qua vai trái, ngang hai người, v.v.).
 * Thỏa mãn cự ly 1.8–3.0m, cao độ 1.5–1.7m.
 */
export function generateFocusCandidates(
  px: number,
  py: number,
  pz: number,
  tx: number,
  ty: number,
  tz: number
): FocusedCandidate[] {
  const dx = tx - px;
  const dz = tz - pz;
  const dist = Math.hypot(dx, dz) || 1.0;
  const fx = dx / dist;
  const fz = dz / dist;
  const rx = -fz;
  const rz = fx;

  const mx = 0.5 * (px + tx);
  const my = 0.5 * (py + ty);
  const mz = 0.5 * (pz + tz);

  const lookAtSpeaker: [number, number, number] = [
    px * 0.25 + tx * 0.75,
    ty + 1.45,
    pz * 0.25 + tz * 0.75,
  ];

  const lookAtTwoShot: [number, number, number] = [
    mx * 0.6 + tx * 0.4,
    my + 1.45,
    mz * 0.6 + tz * 0.4,
  ];

  const candidates: FocusedCandidate[] = [
    // 1. Qua vai phải (Over-the-shoulder Right) - Cự ly ~2.0m, cao 1.6m
    {
      name: 'ots_right',
      camPos: [px - fx * 0.85 + rx * 0.65, py + 1.6, pz - fz * 0.85 + rz * 0.65],
      lookAt: lookAtSpeaker,
      distToTarget: Math.hypot(px - fx * 0.85 + rx * 0.65 - tx, pz - fz * 0.85 + rz * 0.65 - tz),
      camHeight: 1.6,
      isClear: true,
      penalty: 0,
    },
    // 2. Qua vai trái (Over-the-shoulder Left) - Cự ly ~2.0m, cao 1.6m
    {
      name: 'ots_left',
      camPos: [px - fx * 0.85 - rx * 0.65, py + 1.6, pz - fz * 0.85 - rz * 0.65],
      lookAt: lookAtSpeaker,
      distToTarget: Math.hypot(px - fx * 0.85 - rx * 0.65 - tx, pz - fz * 0.85 - rz * 0.65 - tz),
      camHeight: 1.6,
      isClear: true,
      penalty: 10, // Ưu tiên vai phải hơn vai trái một chút theo ngôn ngữ điện ảnh
    },
    // 3. Ngang hai người bên phải (Profile / Two-shot Right) - Cự ly 2.0m, cao 1.55m
    {
      name: 'profile_right_2m',
      camPos: [mx + rx * 2.0, py + 1.55, mz + rz * 2.0],
      lookAt: lookAtTwoShot,
      distToTarget: Math.hypot(mx + rx * 2.0 - tx, mz + rz * 2.0 - tz),
      camHeight: 1.55,
      isClear: true,
      penalty: 30,
    },
    // 4. Ngang hai người bên trái (Profile / Two-shot Left) - Cự ly 2.0m, cao 1.55m
    {
      name: 'profile_left_2m',
      camPos: [mx - rx * 2.0, py + 1.55, mz - rz * 2.0],
      lookAt: lookAtTwoShot,
      distToTarget: Math.hypot(mx - rx * 2.0 - tx, mz - rz * 2.0 - tz),
      camHeight: 1.55,
      isClear: true,
      penalty: 35,
    },
    // 5. Ngang hai người bên phải gần (Profile Right Tight 1.8m) - cao 1.52m
    {
      name: 'profile_right_1.8m',
      camPos: [mx + rx * 1.8, py + 1.52, mz + rz * 1.8],
      lookAt: lookAtTwoShot,
      distToTarget: Math.hypot(mx + rx * 1.8 - tx, mz + rz * 1.8 - tz),
      camHeight: 1.52,
      isClear: true,
      penalty: 40,
    },
    // 6. Ngang hai người bên trái gần (Profile Left Tight 1.8m) - cao 1.52m
    {
      name: 'profile_left_1.8m',
      camPos: [mx - rx * 1.8, py + 1.52, mz - rz * 1.8],
      lookAt: lookAtTwoShot,
      distToTarget: Math.hypot(mx - rx * 1.8 - tx, mz - rz * 1.8 - tz),
      camHeight: 1.52,
      isClear: true,
      penalty: 45,
    },
    // 7. Cận cảnh trực diện chếch phải 25 độ (Frontal Medium Right 2.1m) - cao 1.62m
    {
      name: 'frontal_right_2.1m',
      camPos: [
        tx - (fx * 0.906 + rx * 0.423) * 2.1,
        ty + 1.62,
        tz - (fz * 0.906 + rz * 0.423) * 2.1,
      ],
      lookAt: [tx, ty + 1.48, tz],
      distToTarget: 2.1,
      camHeight: 1.62,
      isClear: true,
      penalty: 60,
    },
    // 8. Cận cảnh trực diện chếch trái 25 độ (Frontal Medium Left 2.1m) - cao 1.62m
    {
      name: 'frontal_left_2.1m',
      camPos: [
        tx - (fx * 0.906 - rx * 0.423) * 2.1,
        ty + 1.62,
        tz - (fz * 0.906 - rz * 0.423) * 2.1,
      ],
      lookAt: [tx, ty + 1.48, tz],
      distToTarget: 2.1,
      camHeight: 1.62,
      isClear: true,
      penalty: 65,
    },
    // 9. Qua vai phải thấp (Over-the-shoulder Low 1.5m)
    {
      name: 'ots_right_low',
      camPos: [px - fx * 0.85 + rx * 0.65, py + 1.5, pz - fz * 0.85 + rz * 0.65],
      lookAt: lookAtSpeaker,
      distToTarget: Math.hypot(px - fx * 0.85 + rx * 0.65 - tx, pz - fz * 0.85 + rz * 0.65 - tz),
      camHeight: 1.5,
      isClear: true,
      penalty: 50,
    },
    // 10. Qua vai trái thấp (Over-the-shoulder Left Low 1.5m)
    {
      name: 'ots_left_low',
      camPos: [px - fx * 0.85 - rx * 0.65, py + 1.5, pz - fz * 0.85 - rz * 0.65],
      lookAt: lookAtSpeaker,
      distToTarget: Math.hypot(px - fx * 0.85 - rx * 0.65 - tx, pz - fz * 0.85 - rz * 0.65 - tz),
      camHeight: 1.5,
      isClear: true,
      penalty: 55,
    },
  ];

  return candidates;
}

/**
 * Đánh giá một candidate camera position:
 * - Kiểm tra tường trong nhà (không cắt tường, không đặt camera ngoài phòng).
 * - Kiểm tra mái che/trần (không vượt trần hoặc mái hiên canopy).
 * - Kiểm tra cành cây/tán cây (không nằm trong tán cây hoặc tia nhìn đâm xuyên qua tán lá).
 * - Kiểm tra diễn viên khác (không bị đầu người khác che khuất tia nhìn).
 * - Kiểm tra mặt người nói nằm trong 60% giữa màn (góc lệch < 13.5° so với trục nhìn).
 * - Kiểm tra thân người chơi không che mặt người nói.
 */
export function evaluateCandidate(
  c: FocusedCandidate,
  params: FocusedCameraParams
): { isClear: boolean; penalty: number; reason?: string } {
  let penalty = c.penalty;
  let hasObstacle = false;
  let blockReason: string | undefined;
  const [cx, cy, cz] = c.camPos;
  const [tx, ty, tz] = params.targetPos;
  const [px, py, pz] = params.playerPos;

  const headTy = ty + (params.speakerHeadHeight ?? 1.6);
  const headPy = py + (params.playerHeadHeight ?? 1.6);

  // 1. Kiểm tra tường trong nhà
  if (params.isInterior && params.wallLines && params.wallLines.length > 0) {
    for (const wall of params.wallLines) {
      // Tia nhìn từ camera tới mặt người nói cắt tường
      if (lineSegmentsIntersect(cx, cz, tx, tz, wall.p1x, wall.p1z, wall.p2x, wall.p2z)) {
        return { isClear: false, penalty: penalty + 10000, reason: 'wall_blocks_sight' };
      }
      // Đoạn nối từ người chơi tới camera cắt tường (camera bị đẩy ra ngoài phòng)
      if (lineSegmentsIntersect(px, pz, cx, cz, wall.p1x, wall.p1z, wall.p2x, wall.p2z)) {
        return { isClear: false, penalty: penalty + 10000, reason: 'camera_outside_wall' };
      }
      // Camera quá sát tường
      const distToWall = distToSegment2D(cx, cz, wall.p1x, wall.p1z, wall.p2x, wall.p2z);
      if (distToWall < 0.25) {
        return { isClear: false, penalty: penalty + 5000, reason: 'camera_too_close_to_wall' };
      }
    }
  }

  // 2. Kiểm tra trần nhà và mái hiên ngoài trời
  if (params.isInterior) {
    const ceil = params.ceilingHeight ?? 3.2;
    if (cy > py + ceil - 0.2) {
      return { isClear: false, penalty: penalty + 5000, reason: 'ceiling_collision' };
    }
  } else {
    // Ngoài trời: nếu ở khu vực cửa Nam B8 có mái hiên canopy (cao 3.04m)
    const canopyY = params.canopyY ?? 3.04;
    // Khu vực sân trước B8 cửa Nam x in [12, 22], z in [-172, -162]
    if (cx >= 12 && cx <= 22 && cz >= -172 && cz <= -162) {
      if (cy > canopyY - 0.6) {
        return { isClear: false, penalty: penalty + 4000, reason: 'canopy_roof_block' };
      }
    }
  }

  // 3. Kiểm tra cây cối ngoài trời (tán cây liễu che khuất)
  const treesToCheck = params.trees ?? (params.isInterior ? [] : OUTDOOR_FOCUS_TREES);
  for (const tree of treesToCheck) {
    const yBot = tree.yBottom ?? 1.2;
    const yTop = tree.yTop ?? 5.5;
    const r = tree.radius ?? 2.5;

    // a) Camera nằm bên trong tán lá cây
    const distCamTree = Math.hypot(cx - tree.x, cz - tree.z);
    if (distCamTree < r && cy >= yBot && cy <= yTop) {
      return { isClear: false, penalty: penalty + 3000, reason: 'camera_inside_tree' };
    }

    // b) Tia nhìn từ Camera tới Mặt người nói đi xuyên qua tán cây
    const distRayTree = distToSegment2D(tree.x, tree.z, cx, cz, tx, tz);
    if (distRayTree < r) {
      // Độ cao của tia nhìn ở điểm gần cây nhất
      const dTotal = Math.hypot(tx - cx, tz - cz);
      const dCamTree = Math.hypot(tree.x - cx, tree.z - cz);
      const frac = dTotal > 1e-4 ? Math.min(1, Math.max(0, dCamTree / dTotal)) : 0;
      const rayY = cy + (headTy - cy) * frac;
      if (rayY >= yBot && rayY <= yTop) {
        return { isClear: false, penalty: penalty + 2500, reason: 'tree_blocks_sight' };
      }
    }
  }

  // 4. Kiểm tra đầu người khác che (Other Actors)
  if (params.actors && params.actors.length > 0) {
    for (const actor of params.actors) {
      // Bỏ qua nếu là người nói
      if (Math.hypot(actor.x - tx, actor.z - tz) < 0.4) continue;
      // Bỏ qua nếu là người chơi
      if (Math.hypot(actor.x - px, actor.z - pz) < 0.4) continue;

      const actorRadius = actor.radius ?? 0.35;
      const distRayActor = distToSegment2D(actor.x, actor.z, cx, cz, tx, tz);
      if (distRayActor < actorRadius) {
        return { isClear: false, penalty: penalty + 2000, reason: `actor_${actor.speaker}_blocks_sight` };
      }
    }
  }

  // 5. Kiểm tra thân người chơi không đè trực tiếp lên mặt người nói
  // Vector nhìn từ Camera tới mặt người nói
  const vTx = tx - cx;
  const vTy = headTy - cy;
  const vTz = tz - cz;
  const lenT = Math.hypot(vTx, vTy, vTz);

  // Vector từ Camera tới đầu người chơi
  const vPx = px - cx;
  const vPy = headPy - cy;
  const vPz = pz - cz;
  const lenP = Math.hypot(vPx, vPy, vPz);

  if (lenT > 1e-4 && lenP > 1e-4) {
    const dot = (vTx * vPx + vTy * vPy + vTz * vPz) / (lenT * lenP);
    const angleRad = Math.acos(Math.max(-1, Math.min(1, dot)));
    // Nếu góc giữa đầu người chơi và mặt người nói < 7.0 độ, đầu người chơi che mất người nói
    if (angleRad < (7.0 * Math.PI) / 180) {
      return { isClear: false, penalty: penalty + 3500, reason: 'player_head_covers_speaker' };
    }
  }

  // 6. Kiểm tra mặt người nói nằm trong 60% giữa màn hình
  // Trục nhìn của camera: C -> LookAt
  const [lx, ly, lz] = c.lookAt;
  const vLx = lx - cx;
  const vLy = ly - cy;
  const vLz = lz - cz;
  const lenL = Math.hypot(vLx, vLy, vLz);

  if (lenT > 1e-4 && lenL > 1e-4) {
    const dotLook = (vTx * vLx + vTy * vLy + vTz * vLz) / (lenT * lenL);
    const angleFromCenter = Math.acos(Math.max(-1, Math.min(1, dotLook)));
    // Camera fov = 45 độ, nửa góc = 22.5 độ. 60% trung tâm = 22.5 * 0.6 = 13.5 độ (~0.235 rad)
    const maxCenterAngleRad = (13.5 * Math.PI) / 180;
    if (angleFromCenter > maxCenterAngleRad) {
      penalty += 800; // Phạt vì lệch ngoài vùng 60%
      hasObstacle = true;
      blockReason = 'speaker_outside_center_60';
    } else {
      // Càng gần trung tâm càng được điểm thưởng
      penalty -= Math.round((1 - angleFromCenter / maxCenterAngleRad) * 20);
    }
  }

  return { isClear: !hasObstacle, penalty, reason: blockReason };
}

/**
 * Hàm chọn vị trí camera focused MỘT LẦN duy nhất khi bắt đầu đối thoại:
 * Thử lần lượt các vị trí ứng viên và chọn vị trí đầu tiên thấy rõ mặt người nói,
 * không bị cành cây, mái che, tường, cột, đầu người khác che.
 * Nếu tất cả đều có vật cản, chọn vị trí có penalty thấp nhất (ít che nhất).
 */
export function selectFocusedCameraPosition(params: FocusedCameraParams): FocusedCameraResult {
  const [px, py, pz] = params.playerPos;
  const [tx, ty, tz] = params.targetPos;

  const candidates = generateFocusCandidates(px, py, pz, tx, ty, tz);
  const defaultFirst = candidates[0];
  if (!defaultFirst) {
    return {
      camPos: [px, py + 1.6, pz],
      lookAt: [tx, ty + 1.45, tz],
      candidateName: 'fallback',
      isClear: false,
      score: 9999,
      candidatesTested: 0,
    };
  }

  let bestCandidate: FocusedCandidate = defaultFirst;
  let minPenalty = Infinity;

  for (let i = 0; i < candidates.length; i++) {
    const cand = candidates[i];
    if (!cand) continue;
    const evalRes = evaluateCandidate(cand, params);
    cand.penalty = evalRes.penalty;
    cand.isClear = evalRes.isClear;
    cand.reason = evalRes.reason;

    if (evalRes.isClear) {
      // Vị trí đầu tiên hoàn toàn thông thoáng -> chọn ngay!
      return {
        camPos: cand.camPos,
        lookAt: cand.lookAt,
        candidateName: cand.name,
        isClear: true,
        score: cand.penalty,
        candidatesTested: i + 1,
      };
    }

    if (evalRes.penalty < minPenalty) {
      minPenalty = evalRes.penalty;
      bestCandidate = cand;
    }
  }

  // Không có vị trí nào hoàn hảo -> chọn vị trí ít che nhất
  return {
    camPos: bestCandidate.camPos,
    lookAt: bestCandidate.lookAt,
    candidateName: bestCandidate.name,
    isClear: bestCandidate.isClear,
    score: bestCandidate.penalty,
    candidatesTested: candidates.length,
  };
}
