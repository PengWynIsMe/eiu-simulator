import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Text } from '@react-three/drei';
import {
  BoxGeometry,
  CylinderGeometry,
  Euler,
  Matrix4,
  Quaternion,
  Vector3,
  type BufferGeometry,
  type InstancedMesh,
} from 'three';
import { FLOOR_HEIGHT } from '../../data';
import { getStage } from '../../data/silver/stages';
import { useActivityStore } from '../../store/useActivityStore';
import { useSilverStore } from '../../store/useSilverStore';
import type { Vec2 } from '../../types';
import { createInstanceMatrix, getLocalFacingYaw } from './InteriorFurniture';
import {
  B8_EAST_HOLE_UV,
  B8_EXIT_SIGNS,
  B8_PCCC_POINTS,
  B8_PLANTERS,
  B8_SWITCHBACK_STAIRS,
  B8_TREE_UV,
  B8_WEST_HOLE_UV,
  b8Layout,
  getFloorRooms,
  getFloorWalls,
  toWorld,
} from './layouts/b8';
import { addSwitchbackFlight, makeRampSlabMatrix } from './stairMesh';
import SalixAlbaTrees, { type SalixAlbaInstance } from '../trees/SalixAlbaTrees';
import B8ComputerLabs from './B8ComputerLabs';

const UP_VEC = new Vector3(0, 1, 0);
const LOCAL_X_VEC = new Vector3(1, 0, 0);
const LOUVER_TILT_RAD = (35 * Math.PI) / 180;

const WEST_COL_US = [13.75, 22.75, 31.75, 40.75, 49.75] as const;
const EAST_COL_US = Array.from({ length: 9 }, (_, i) => 54.35 + i * 7.5375);

// Chép từ B11Furniture.tsx (đồng nghiệp) — kiểu thang chữ U
function makeTiltedBoxMatrix(
  p1: readonly [number, number, number],
  p2: readonly [number, number, number],
  radius: number
): Matrix4 {
  const a = new Vector3(p1[0], p1[1], p1[2]);
  const b = new Vector3(p2[0], p2[1], p2[2]);
  const dir = new Vector3().subVectors(b, a);
  const len = dir.length();
  if (len < 0.01) return new Matrix4().makeScale(0, 0, 0);
  const mid = new Vector3().addVectors(a, b).multiplyScalar(0.5);
  const quat = new Quaternion().setFromUnitVectors(UP_VEC, dir.normalize());
  return new Matrix4().compose(mid, quat, new Vector3(radius * 2, len, radius * 2));
}

/** Tạo ma trận hộp có góc nghiêng quanh trục cục bộ u (dùng cho lá lam che nắng nghiêng 35°). */
function createTiltedLouverMatrix(
  u: number,
  v: number,
  y: number,
  localYaw: number,
  tiltX: number,
  scaleX: number,
  scaleY: number,
  scaleZ: number
): Matrix4 {
  const [worldX, worldZ] = toWorld(u, v);
  const yaw = getLocalFacingYaw(toWorld, localYaw);
  const qYaw = new Quaternion().setFromEuler(new Euler(0, yaw, 0));
  const qTilt = new Quaternion().setFromAxisAngle(LOCAL_X_VEC, tiltX);
  const quat = qYaw.multiply(qTilt);
  return new Matrix4().compose(new Vector3(worldX, y, worldZ), quat, new Vector3(scaleX, scaleY, scaleZ));
}

/** Hàm giả-ngẫu-nhiên cố định seed (Mulberry32) cho hoa lan ý. */
function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Dựng 1 nhịp lam che nắng trắng có khung 0.05 m và 6 lá nghiêng 35° (y: 2.45 → 3.35). */
function addB8FramedLouverBay(
  matrices: Matrix4[],
  fixedV: number,
  uStart: number,
  uEnd: number,
  baseY: number,
  tiltSign: 1 | -1
): void {
  const s1 = uStart + 0.25;
  const s2 = uEnd - 0.25;
  const clearLen = s2 - s1;
  if (clearLen < 0.6) return;

  const midU = (s1 + s2) * 0.5;
  const frame = 0.05;
  const yBottom = baseY + 2.45;
  const yTop = baseY + 3.35;
  const frameH = yTop - yBottom;
  const yMid = (yBottom + yTop) * 0.5;
  const frameDepth = 0.16;

  // Thanh khung ngang trên & dưới
  matrices.push(createInstanceMatrix(toWorld, midU, fixedV, yBottom + frame * 0.5, 0, clearLen, frame, frameDepth));
  matrices.push(createInstanceMatrix(toWorld, midU, fixedV, yTop - frame * 0.5, 0, clearLen, frame, frameDepth));

  // Đố đứng hai đầu & chia ô
  const cells = Math.max(2, Math.round(clearLen / 1.8));
  for (let i = 0; i <= cells; i++) {
    const uPos = s1 + (clearLen * i) / cells;
    matrices.push(createInstanceMatrix(toWorld, uPos, fixedV, yMid, 0, frame, frameH, frameDepth + 0.01));
  }

  // 6 lá lam nghiêng 35°
  const innerLen = clearLen - frame;
  for (let k = 0; k < 6; k++) {
    const ly = baseY + 2.55 + k * (0.7 / 5);
    matrices.push(createTiltedLouverMatrix(midU, fixedV, ly, 0, tiltSign * LOUVER_TILT_RAD, innerLen, 0.025, 0.13));
  }
}

/** Dựng 1 đoạn lan can inox 4 thanh (y 0.30 / 0.55 / 0.80 / 1.10) + trụ 0.04 cách ≤ 1.8 m. */
function addB8RailingSegment(
  matrices: Matrix4[],
  u1: number,
  v1: number,
  u2: number,
  v2: number,
  baseY: number
): void {
  const du = u2 - u1;
  const dv = v2 - v1;
  const len = Math.hypot(du, dv);
  if (len < 0.2) return;

  const cu = (u1 + u2) * 0.5;
  const cv = (v1 + v2) * 0.5;
  const yaw = -Math.atan2(dv, du);

  for (const ry of [0.3, 0.55, 0.8, 1.1]) {
    const thickness = ry > 1.0 ? 0.05 : 0.03;
    matrices.push(createInstanceMatrix(toWorld, cu, cv, baseY + ry, yaw, len, thickness, thickness));
  }

  const posts = Math.max(2, Math.floor(len / 1.8) + 1);
  for (let i = 0; i < posts; i++) {
    const t = posts === 1 ? 0.5 : i / (posts - 1);
    const pu = u1 + du * t;
    const pv = v1 + dv * t;
    // Trụ đứng từ mặt gờ (0.15) lên tới tay vịn (1.10) -> cao 0.95 m
    matrices.push(createInstanceMatrix(toWorld, pu, pv, baseY + 0.625, 0, 0.04, 0.95, 0.04));
  }
}

/** Dựng gờ bê tông chân lan can dọc theo các cạnh đa giác lỗ giếng trời. */
function addHolePolygonCurbsAndRailings(
  curbMatrices: Matrix4[],
  railingMatrices: Matrix4[],
  holePts: readonly Vec2[],
  baseY: number
): void {
  const n = holePts.length;
  for (let i = 0; i < n; i++) {
    const p1 = holePts[i];
    const p2 = holePts[(i + 1) % n];
    if (!p1 || !p2) continue;
    const du = p2[0] - p1[0];
    const dv = p2[1] - p1[1];
    const len = Math.hypot(du, dv);
    if (len < 0.2) continue;

    const cu = (p1[0] + p2[0]) * 0.5;
    const cv = (p1[1] + p2[1]) * 0.5;
    const yaw = -Math.atan2(dv, du);

    curbMatrices.push(createInstanceMatrix(toWorld, cu, cv, baseY + 0.075, yaw, len + 0.2, 0.15, 0.2));
    addB8RailingSegment(railingMatrices, p1[0], p1[1], p2[0], p2[1], baseY);
  }
}

interface InstancedBatchProps {
  readonly batchKey: string;
  readonly matrices: readonly Matrix4[];
  readonly geometry: BufferGeometry;
  readonly color: string;
  readonly roughness?: number;
  readonly metalness?: number;
  readonly emissive?: string;
  readonly emissiveIntensity?: number;
  readonly transparent?: boolean;
  readonly opacity?: number;
  readonly castShadow?: boolean;
  readonly polygonOffset?: boolean;
  readonly polygonOffsetFactor?: number;
  readonly polygonOffsetUnits?: number;
}

function InstancedBatch({
  batchKey,
  matrices,
  geometry,
  color,
  roughness = 0.65,
  metalness = 0.08,
  emissive = '#000000',
  emissiveIntensity = 0,
  transparent = false,
  opacity = 1,
  castShadow = true,
  polygonOffset = false,
  polygonOffsetFactor = 0,
  polygonOffsetUnits = 0,
}: InstancedBatchProps) {
  const meshRef = useRef<InstancedMesh | null>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < matrices.length; i++) {
      const mat = matrices[i];
      if (mat) mesh.setMatrixAt(i, mat);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices]);

  if (matrices.length === 0) return null;
  return (
    <instancedMesh
      ref={meshRef}
      key={`${batchKey}-${matrices.length}`}
      args={[geometry, undefined, matrices.length]}
      castShadow={castShadow}
      receiveShadow
    >
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        transparent={transparent}
        opacity={opacity}
        polygonOffset={polygonOffset}
        polygonOffsetFactor={polygonOffsetFactor}
        polygonOffsetUnits={polygonOffsetUnits}
      />
    </instancedMesh>
  );
}

/**
 * Nội thất & kiến trúc chi tiết 4 tầng Block 8:
 * - Cột kem, dầm biên, dầm ngang hành lang, lam chắn nắng 6 lá nghiêng 35° có khung, đèn trần tròn, thùng rác inox
 * - Tầng 2–4: gờ bê tông, lan can inox 4 thanh, dải sàn xanh dương, sàn hành lang bê tông mài
 * - Tủ PCCC đỏ + kệ bình + sơ đồ thoát hiểm, biển EXIT xanh, cửa sổ giả mặt tường hành lang
 * - Sân vườn tầng trệt: lát đá, bồn đá tối, thảm lan ý + hoa trắng, cây cao 13 m tán 3 khối + giàn chống thép 4 chân
 */
export default function B8Furniture({
  floor,
  showUpperFloors = true,
}: {
  floor: number;
  showUpperFloors?: boolean;
}) {
  const isSilverActive = useActivityStore((s) => s.activity?.source === 'silver');
  const stageRoomCode = useSilverStore((s) => {
    const item = s.play?.item;
    return item?.scene?.id ? getStage(item.scene.id)?.roomCode : null;
  });

  const sharedGeos = useMemo(() => {
    const box = new BoxGeometry(1, 1, 1);
    const cyl = new CylinderGeometry(0.5, 0.5, 1, 12);
    return { box, cyl };
  }, []);

  useEffect(() => {
    return () => {
      sharedGeos.box.dispose();
      sharedGeos.cyl.dispose();
    };
  }, [sharedGeos]);

  const data = useMemo(() => {
    const creamStruct: Matrix4[] = [];
    const whiteLouvers: Matrix4[] = [];
    const warmLights: Matrix4[] = [];
    const binSteel: Matrix4[] = [];
    const railingSteel: Matrix4[] = [];
    const blueEdgeTrim: Matrix4[] = [];
    const corridorFloor: Matrix4[] = [];
    const redPccc: Matrix4[] = [];
    const whiteBoards: Matrix4[] = [];
    const greenExit: Matrix4[] = [];
    const exitRods: Matrix4[] = [];
    const windowFrames: Matrix4[] = [];
    const wallBrown: Matrix4[] = [];

    // 1. Kết cấu lặp 4 tầng (1–4, ẩn tầng trên khi bật Top-Down)
    for (let f = 1; f <= 4; f++) {
      if (!showUpperFloors && f > floor) continue;
      const dy = (f - floor) * FLOOR_HEIGHT;

      // Cột vuông kem (0.5 x 0.5 x 3.8) + dầm ngang trần hành lang
      for (let i = 0; i < WEST_COL_US.length; i++) {
        const u = WEST_COL_US[i];
        if (u === undefined) continue;
        creamStruct.push(createInstanceMatrix(toWorld, u, -197.25, dy + FLOOR_HEIGHT * 0.5, 0, 0.5, FLOOR_HEIGHT, 0.5));
        creamStruct.push(createInstanceMatrix(toWorld, u, -179.85, dy + FLOOR_HEIGHT * 0.5, 0, 0.5, FLOOR_HEIGHT, 0.5));

        creamStruct.push(createInstanceMatrix(toWorld, u, -198.625, dy + 3.625, 0, 0.3, 0.35, 2.75));
        creamStruct.push(createInstanceMatrix(toWorld, u, -178.775, dy + 3.625, 0, 0.3, 0.35, 2.15));

        if (i % 2 === 1) {
          binSteel.push(createInstanceMatrix(toWorld, u, -197.75, dy + 0.375, 0, 0.36, 0.75, 0.36));
          binSteel.push(createInstanceMatrix(toWorld, u, -179.35, dy + 0.375, 0, 0.36, 0.75, 0.36));
        }
      }

      for (let i = 0; i < EAST_COL_US.length; i++) {
        const u = EAST_COL_US[i];
        if (u === undefined) continue;
        creamStruct.push(createInstanceMatrix(toWorld, u, -196.75, dy + FLOOR_HEIGHT * 0.5, 0, 0.5, FLOOR_HEIGHT, 0.5));
        creamStruct.push(createInstanceMatrix(toWorld, u, -179.35, dy + FLOOR_HEIGHT * 0.5, 0, 0.5, FLOOR_HEIGHT, 0.5));

        creamStruct.push(createInstanceMatrix(toWorld, u, -198.375, dy + 3.625, 0, 0.3, 0.35, 3.25));
        creamStruct.push(createInstanceMatrix(toWorld, u, -178.525, dy + 3.625, 0, 0.3, 0.35, 1.65));

        if (i % 2 === 1) {
          binSteel.push(createInstanceMatrix(toWorld, u, -197.25, dy + 0.375, 0, 0.36, 0.75, 0.36));
          binSteel.push(createInstanceMatrix(toWorld, u, -178.85, dy + 0.375, 0, 0.36, 0.75, 0.36));
        }
      }

      // Dầm biên mặt giếng trời (cao 0.45: y 3.35→3.8, dày 0.3)
      // Sân Tây
      creamStruct.push(createInstanceMatrix(toWorld, 31.75, -197.15, dy + 3.575, 0, 36.5, 0.45, 0.3));
      creamStruct.push(createInstanceMatrix(toWorld, 31.75, -179.95, dy + 3.575, 0, 36.5, 0.45, 0.3));
      creamStruct.push(createInstanceMatrix(toWorld, 13.65, -188.55, dy + 3.575, Math.PI / 2, 16.9, 0.45, 0.3));
      creamStruct.push(createInstanceMatrix(toWorld, 49.85, -188.55, dy + 3.575, Math.PI / 2, 16.9, 0.45, 0.3));
      // Sân Đông
      creamStruct.push(createInstanceMatrix(toWorld, 84.5, -196.65, dy + 3.575, 0, 60.8, 0.45, 0.3));
      creamStruct.push(createInstanceMatrix(toWorld, 84.5, -179.45, dy + 3.575, 0, 60.8, 0.45, 0.3));
      creamStruct.push(createInstanceMatrix(toWorld, 54.25, -193.35, dy + 3.575, Math.PI / 2, 6.3, 0.45, 0.3));
      creamStruct.push(createInstanceMatrix(toWorld, 54.25, -183.05, dy + 3.575, Math.PI / 2, 6.9, 0.45, 0.3));
      creamStruct.push(createInstanceMatrix(toWorld, 114.75, -193.4, dy + 3.575, Math.PI / 2, 6.2, 0.45, 0.3));
      creamStruct.push(createInstanceMatrix(toWorld, 114.75, -182.2, dy + 3.575, Math.PI / 2, 5.2, 0.45, 0.3));

      // Lam che nắng có khung giữa các cột trên 2 mép dài Bắc/Nam mỗi sân
      for (let i = 0; i < WEST_COL_US.length - 1; i++) {
        const u1 = WEST_COL_US[i];
        const u2 = WEST_COL_US[i + 1];
        if (u1 === undefined || u2 === undefined) continue;
        addB8FramedLouverBay(whiteLouvers, -197.25, u1, u2, dy, 1);
        addB8FramedLouverBay(whiteLouvers, -179.85, u1, u2, dy, -1);
      }
      for (let i = 0; i < EAST_COL_US.length - 1; i++) {
        const u1 = EAST_COL_US[i];
        const u2 = EAST_COL_US[i + 1];
        if (u1 === undefined || u2 === undefined) continue;
        addB8FramedLouverBay(whiteLouvers, -196.75, u1, u2, dy, 1);
        addB8FramedLouverBay(whiteLouvers, -179.35, u1, u2, dy, -1);
      }

      // Đèn trần tròn dọc tim hành lang cách 3.0 m (đặt ở 3.59 m để lộ dưới bản sàn tầng trên dày 0.18 m từ 3.62→3.80)
      for (let u = 14.5; u <= 49.5; u += 3.0) {
        warmLights.push(createInstanceMatrix(toWorld, u, -198.5, dy + 3.59, 0, 0.2, 0.06, 0.2));
        warmLights.push(createInstanceMatrix(toWorld, u, -178.9, dy + 3.59, 0, 0.2, 0.06, 0.2));
      }
      for (let u = 55.5; u <= 114.5; u += 3.0) {
        warmLights.push(createInstanceMatrix(toWorld, u, -198.25, dy + 3.59, 0, 0.2, 0.06, 0.2));
        warmLights.push(createInstanceMatrix(toWorld, u, -178.65, dy + 3.59, 0, 0.2, 0.06, 0.2));
      }

      // Trang thiết bị trên tường hành lang (Tủ PCCC + kệ bình + sơ đồ thoát hiểm + biển EXIT)
      for (const p of B8_PCCC_POINTS) {
        const frontOffset = p.facingV * 0.1;
        // Tủ PCCC đỏ 0.6 x 0.8 x 0.2, đáy y = 1.0
        redPccc.push(createInstanceMatrix(toWorld, p.u, p.v + frontOffset, dy + 1.4, 0, 0.6, 0.8, 0.2));
        // Bảng "PCCC" trắng nhỏ phía trên cửa tủ
        whiteBoards.push(createInstanceMatrix(toWorld, p.u, p.v + frontOffset + p.facingV * 0.105, dy + 1.66, 0, 0.34, 0.12, 0.01));

        // Kệ bình chữa cháy lệch u +0.7
        redPccc.push(createInstanceMatrix(toWorld, p.u + 0.7, p.v + p.facingV * 0.12, dy + 0.075, 0, 0.4, 0.15, 0.25));
        redPccc.push(createInstanceMatrix(toWorld, p.u + 0.6, p.v + p.facingV * 0.12, dy + 0.4, 0, 0.16, 0.5, 0.16));
        redPccc.push(createInstanceMatrix(toWorld, p.u + 0.8, p.v + p.facingV * 0.12, dy + 0.4, 0, 0.16, 0.5, 0.16));

        // Sơ đồ thoát hiểm lệch u -0.8, tâm y = 1.5
        whiteBoards.push(createInstanceMatrix(toWorld, p.u - 0.8, p.v + p.facingV * 0.02, dy + 1.5, 0, 0.6, 0.45, 0.02));
      }

      for (const [eu, ev] of B8_EXIT_SIGNS) {
        greenExit.push(createInstanceMatrix(toWorld, eu, ev, dy + 2.9, 0, 0.4, 0.15, 0.03));
        exitRods.push(createInstanceMatrix(toWorld, eu - 0.14, ev, dy + 3.3875, 0, 0.01, 0.825, 0.01));
        exitRods.push(createInstanceMatrix(toWorld, eu + 0.14, ev, dy + 3.3875, 0, 0.01, 0.825, 0.01));
      }

      // Ô cửa sổ kính thật trên tường phòng ↔ hành lang (bệ tường 0→0.95, tường trên 2.45→3.8, khung nhôm #9ca3af)
      const fWalls = getFloorWalls(f);
      for (const wall of fWalls) {
        if (!wall.isGlass) continue;
        const len = Math.hypot(wall.u2 - wall.u1, wall.v2 - wall.v1);
        if (len < 0.2) continue;
        const midU = (wall.u1 + wall.u2) * 0.5;
        const wallV = wall.v1;

        // Bệ tường dưới (0 → 0.95) & tường trên (2.45 → 3.80)
        wallBrown.push(createInstanceMatrix(toWorld, midU, wallV, dy + 0.475, 0, len, 0.95, 0.22));
        wallBrown.push(createInstanceMatrix(toWorld, midU, wallV, dy + 3.125, 0, len, 1.35, 0.22));

        // Khung nhôm ngang tại y = 0.95 và y = 2.45 + đố đứng mỗi ~1.2 m
        windowFrames.push(createInstanceMatrix(toWorld, midU, wallV, dy + 0.95, 0, len, 0.05, 0.08));
        windowFrames.push(createInstanceMatrix(toWorld, midU, wallV, dy + 2.45, 0, len, 0.05, 0.08));
        const mullionCount = Math.max(1, Math.round(len / 1.2));
        for (let m = 0; m <= mullionCount; m++) {
          const mu = wall.u1 + ((wall.u2 - wall.u1) * m) / mullionCount;
          windowFrames.push(createInstanceMatrix(toWorld, mu, wallV, dy + 1.7, 0, 0.04, 1.5, 0.08));
        }
      }

      // Chỉ tầng 2–4: gờ bê tông, lan can inox 4 thanh, dải sàn xanh dương, sàn hành lang bê tông mài
      if (f >= 2) {
        addHolePolygonCurbsAndRailings(creamStruct, railingSteel, B8_WEST_HOLE_UV, dy);
        addHolePolygonCurbsAndRailings(creamStruct, railingSteel, B8_EAST_HOLE_UV, dy);

        // Dải sàn xanh dương rộng 0.6 m sát gờ (tâm +0.03, dày 0.02 → mặt trên +0.04)
        // Sân Tây
        blueEdgeTrim.push(createInstanceMatrix(toWorld, 31.75, -197.4, dy + 0.03, 0, 37.9, 0.02, 0.6));
        blueEdgeTrim.push(createInstanceMatrix(toWorld, 31.75, -179.7, dy + 0.03, 0, 37.9, 0.02, 0.6));
        blueEdgeTrim.push(createInstanceMatrix(toWorld, 13.1, -188.55, dy + 0.03, Math.PI / 2, 17.1, 0.02, 0.6));
        blueEdgeTrim.push(createInstanceMatrix(toWorld, 50.4, -188.55, dy + 0.03, Math.PI / 2, 17.1, 0.02, 0.6));
        // Sân Đông
        blueEdgeTrim.push(createInstanceMatrix(toWorld, 84.5, -196.9, dy + 0.03, 0, 62.2, 0.02, 0.6));
        blueEdgeTrim.push(createInstanceMatrix(toWorld, 84.5, -179.2, dy + 0.03, 0, 62.2, 0.02, 0.6));
        blueEdgeTrim.push(createInstanceMatrix(toWorld, 53.7, -193.4, dy + 0.03, Math.PI / 2, 6.4, 0.02, 0.6));
        blueEdgeTrim.push(createInstanceMatrix(toWorld, 53.7, -183.0, dy + 0.03, Math.PI / 2, 7.0, 0.02, 0.6));
        blueEdgeTrim.push(createInstanceMatrix(toWorld, 115.3, -193.45, dy + 0.03, Math.PI / 2, 6.3, 0.02, 0.6));
        blueEdgeTrim.push(createInstanceMatrix(toWorld, 115.3, -182.15, dy + 0.03, Math.PI / 2, 5.3, 0.02, 0.6));

        // Sàn hành lang mở bê tông mài (#a3a8ad, tâm +0.01, dày 0.02 → mặt trên +0.02)
        corridorFloor.push(createInstanceMatrix(toWorld, 31.75, -198.5, dy + 0.01, 0, 36.5, 0.02, 3.0));
        corridorFloor.push(createInstanceMatrix(toWorld, 31.75, -178.9, dy + 0.01, 0, 36.5, 0.02, 2.4));
        corridorFloor.push(createInstanceMatrix(toWorld, 84.5, -198.25, dy + 0.01, 0, 60.8, 0.02, 3.5));
        corridorFloor.push(createInstanceMatrix(toWorld, 84.5, -178.65, dy + 0.01, 0, 60.8, 0.02, 1.9));
      }
    }

    // 2. Bàn ghế lớp học ở tầng đang đứng
    const rooms = getFloorRooms(floor);
    const desksWood: Matrix4[] = [];
    const chairsSlate: Matrix4[] = [];
    const boardsGreen: Matrix4[] = [];
    const teacherDesks: Matrix4[] = [];

    for (const room of rooms) {
      if (!room.code.includes('.B8') || room.code.includes('102') || room.code.startsWith('WC')) continue;

      // Khi phòng là sân khấu Silver đang hoạt động thì không vẽ bàn khối cùng phòng
      if (isSilverActive && stageRoomCode === room.code) continue;

      const vCenter = (room.minV + room.maxV) / 2;
      const isNorth = room.maxV <= -200.0;
      if (floor === 4 && isNorth) continue;

      boardsGreen.push(createInstanceMatrix(toWorld, room.minU + 0.05, vCenter, 1.5, 0, 0.06, 1.2, 3.5));
      teacherDesks.push(createInstanceMatrix(toWorld, room.minU + 1.2, vCenter, 0.375, 0, 0.7, 0.75, 1.4));
      chairsSlate.push(createInstanceMatrix(toWorld, room.minU + 0.65, vCenter, 0.41, 0, 0.45, 0.82, 0.45));

      const deskPitchU = 0.9;
      const deskWidthU = 0.5;
      const deskLengthV = 1.2;
      const aisleV = 0.7;
      const desksPerRow = 4;
      const totalDesksSpanV = desksPerRow * deskLengthV + (desksPerRow - 1) * aisleV;

      const vAvailableStart = isNorth ? room.minV + 0.6 : room.minV + 1.0;
      const vAvailableEnd = isNorth ? room.maxV - 1.0 : room.maxV - 0.6;
      const marginV = Math.max(0, (vAvailableEnd - vAvailableStart - totalDesksSpanV) / 2);

      for (let u = room.minU + 2.4; u + deskWidthU <= room.maxU - 0.6; u += deskPitchU) {
        for (let col = 0; col < desksPerRow; col++) {
          const v = vAvailableStart + marginV + col * (deskLengthV + aisleV) + deskLengthV / 2;
          desksWood.push(createInstanceMatrix(toWorld, u, v, 0.375, 0, deskWidthU, 0.75, deskLengthV));
          chairsSlate.push(createInstanceMatrix(toWorld, u + 0.42, v - 0.3, 0.41, Math.PI, 0.42, 0.82, 0.42));
          chairsSlate.push(createInstanceMatrix(toWorld, u + 0.42, v + 0.3, 0.41, Math.PI, 0.42, 0.82, 0.42));
        }
      }
    }

    // 3. Sân vườn tầng trệt (giữ vị trí bồn & cây của T15a, đổi sang cây Salix alba)
    const groundY = -(floor - 1) * FLOOR_HEIGHT;
    const courtyardPaving: Matrix4[] = [];
    const planterRims: Matrix4[] = [];
    const lilyFoliage: Matrix4[] = [];
    const lilyFlowers: Matrix4[] = [];
    const salixTrees: SalixAlbaInstance[] = [];
    const treeStakes: Matrix4[] = [];

    // Nền lát đá phủ cả sân (#a8abad, dày 0.04 → mặt trên groundY + 0.04)
    const pavingTop = groundY + 0.04;
    courtyardPaving.push(createInstanceMatrix(toWorld, 31.75, -188.55, groundY + 0.02, 0, 36.5, 0.04, 16.9));
    courtyardPaving.push(createInstanceMatrix(toWorld, 84.5, -188.05, groundY + 0.02, 0, 60.8, 0.04, 16.9));

    const rng = createSeededRng(202608);
    for (const p of B8_PLANTERS) {
      const halfU = p.lenU * 0.5;
      const halfV = p.widthV * 0.5;
      const rimThick = 0.15;
      const rimH = 0.15;
      const rimY = pavingTop + rimH * 0.5;

      // Gờ bồn cây đá tối #3f3f46 (4 cạnh)
      planterRims.push(createInstanceMatrix(toWorld, p.centerU, p.centerV - halfV + rimThick * 0.5, rimY, 0, p.lenU, rimH, rimThick));
      planterRims.push(createInstanceMatrix(toWorld, p.centerU, p.centerV + halfV - rimThick * 0.5, rimY, 0, p.lenU, rimH, rimThick));
      planterRims.push(createInstanceMatrix(toWorld, p.centerU - halfU + rimThick * 0.5, p.centerV, rimY, 0, rimThick, rimH, p.widthV - rimThick * 2));
      planterRims.push(createInstanceMatrix(toWorld, p.centerU + halfU - rimThick * 0.5, p.centerV, rimY, 0, rimThick, rimH, p.widthV - rimThick * 2));

      // Thảm lan ý #2f5d34 cao 0.45 m
      const innerLenU = p.lenU - rimThick * 2;
      const innerWidthV = p.widthV - rimThick * 2;
      lilyFoliage.push(createInstanceMatrix(toWorld, p.centerU, p.centerV, pavingTop + 0.225, 0, innerLenU, 0.45, innerWidthV));

      // Hoa trắng hộp 0.08 m, ~1 bông / 0.8 m²
      const flowerCount = Math.max(8, Math.round((innerLenU * innerWidthV) / 0.8));
      for (let i = 0; i < flowerCount; i++) {
        const fu = p.centerU + (rng() - 0.5) * (innerLenU - 0.4);
        const fv = p.centerV + (rng() - 0.5) * (innerWidthV - 0.4);
        lilyFlowers.push(createInstanceMatrix(toWorld, fu, fv, pavingTop + 0.48, rng() * Math.PI, 0.08, 0.08, 0.08));
      }
    }

    for (const [tu, tv] of B8_TREE_UV) {
      const [wx, wz] = toWorld(tu, tv);
      const idx = salixTrees.length;

      // Cây 3D Salix alba cắm vào bồn sân trong tầng trệt (groundY + 0.45 m), tán vươn tới tầm tầng 4
      salixTrees.push({
        x: wx,
        y: groundY + 0.45,
        z: wz,
        rotY: (idx * 1.37) % (Math.PI * 2),
        scaleXZ: 0.9,
        scaleY: 0.96 + (idx % 3) * 0.04,
      });

      // Giàn chống thép 4 chân Ø0.08 từ cách gốc 1.2 m chụm vào thân ở cao 3.0 m
      const topPt = [wx, pavingTop + 3.0, wz] as const;
      for (const [du, dv] of [
        [1.2, 0],
        [-1.2, 0],
        [0, 1.2],
        [0, -1.2],
      ] as const) {
        const [bx, bz] = toWorld(tu + du, tv + dv);
        treeStakes.push(makeTiltedBoxMatrix([bx, pavingTop, bz], topPt, 0.04));
      }
    }

    // 4. Cầu thang bộ chữ U kiểu B11 (dùng chung thông số chuẩn B8_SWITCHBACK_STAIRS)
    const stairSteps: Matrix4[] = [];
    const stairSoffits: Matrix4[] = [];
    const stairRails: Matrix4[] = [];

    for (let f = 1; f <= 3; f++) {
      if (!showUpperFloors && f > floor) continue;
      const dy = (f - floor) * FLOOR_HEIGHT;

      for (const st of B8_SWITCHBACK_STAIRS) {
        const midY = dy + st.landRatio * FLOOR_HEIGHT;

        addSwitchbackFlight(
          toWorld,
          stairSteps,
          stairSoffits,
          stairRails,
          st.f1[0],
          st.f1[1],
          dy,
          st.f1[2],
          st.f1[3],
          midY,
          st.width,
          st.steps1
        );
        addSwitchbackFlight(
          toWorld,
          stairSteps,
          stairSoffits,
          stairRails,
          st.f2[0],
          st.f2[1],
          midY,
          st.f2[2],
          st.f2[3],
          dy + FLOOR_HEIGHT,
          st.width,
          st.steps2
        );

        // Chiếu nghỉ: bản bê tông dưới + mặt đá đen trên cùng y = midY
        stairSoffits.push(
          createInstanceMatrix(toWorld, st.land[0], st.land[1], midY - 0.1, 0, st.land[2], 0.16, st.land[3])
        );
        stairSteps.push(
          createInstanceMatrix(toWorld, st.land[0], st.land[1], midY - 0.02, 0, st.land[2], 0.04, st.land[3])
        );

        // Lan can chiếu nghỉ (lưng & 2 hông) cùng kiểu 3 thanh + trụ đứng
        const [backLu, backLv] = [st.backRail[0], st.backRail[1]];
        const [backRu, backRv] = [st.backRail[2], st.backRail[3]];
        for (const ry of [0.44, 0.74, 1.04]) {
          const thick = ry > 1.0 ? 0.05 : 0.028;
          stairRails.push(
            makeRampSlabMatrix(toWorld, backLu, backLv, midY + ry, backRu, backRv, midY + ry, thick, thick)
          );
        }
        for (const t of [0, 0.325, 0.675, 1]) {
          const pu = backLu + (backRu - backLu) * t;
          const pv = backLv + (backRv - backLv) * t;
          stairRails.push(createInstanceMatrix(toWorld, pu, pv, midY + 0.52, 0, 0.04, 1.04, 0.04));
        }

        // 2 lan can hông chiếu nghỉ
        const isAlongV = st.f1[2] === st.f1[0];
        const sideRails: [number, number, number, number][] = isAlongV
          ? [
              [backLu, st.f1[3], backLu, backLv],
              [backRu, st.f1[3], backRu, backRv],
            ]
          : [
              [st.f1[2], backLv, backLu, backLv],
              [st.f1[2], backRv, backRu, backRv],
            ];
        for (const [su1, sv1, su2, sv2] of sideRails) {
          for (const ry of [0.44, 0.74, 1.04]) {
            const thick = ry > 1.0 ? 0.05 : 0.028;
            stairRails.push(
              makeRampSlabMatrix(toWorld, su1, sv1, midY + ry, su2, sv2, midY + ry, thick, thick)
            );
          }
        }
      }
    }

    return {
      creamStruct,
      whiteLouvers,
      warmLights,
      binSteel,
      railingSteel,
      blueEdgeTrim,
      corridorFloor,
      redPccc,
      whiteBoards,
      greenExit,
      exitRods,
      windowFrames,
      wallBrown,
      desksWood,
      chairsSlate,
      boardsGreen,
      teacherDesks,
      courtyardPaving,
      planterRims,
      lilyFoliage,
      lilyFlowers,
      salixTrees,
      treeStakes,
      stairSteps,
      stairSoffits,
      stairRails,
    };
  }, [floor, showUpperFloors, isSilverActive, stageRoomCode]);

  return (
    <group key={floor}>
      <InstancedBatch batchKey="b8-cream" matrices={data.creamStruct} geometry={sharedGeos.box} color="#d6cec2" roughness={0.78} />
      <InstancedBatch batchKey="b8-louver" matrices={data.whiteLouvers} geometry={sharedGeos.box} color="#f1f3f4" roughness={0.5} />
      <InstancedBatch
        batchKey="b8-light"
        matrices={data.warmLights}
        geometry={sharedGeos.cyl}
        color="#fefce8"
        emissive="#fef08a"
        emissiveIntensity={0.65}
        castShadow={false}
      />
      <InstancedBatch batchKey="b8-bin" matrices={data.binSteel} geometry={sharedGeos.cyl} color="#d8dde3" metalness={0.35} roughness={0.3} />
      <InstancedBatch batchKey="b8-rail" matrices={data.railingSteel} geometry={sharedGeos.box} color="#d8dde3" metalness={0.35} roughness={0.3} />
      <InstancedBatch
        batchKey="b8-blue"
        matrices={data.blueEdgeTrim}
        geometry={sharedGeos.box}
        color="#2f7fc1"
        roughness={0.4}
        castShadow={false}
        polygonOffset
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-4}
      />
      <InstancedBatch
        batchKey="b8-corr"
        matrices={data.corridorFloor}
        geometry={sharedGeos.box}
        color="#a3a8ad"
        roughness={0.5}
        castShadow={false}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-2}
      />
      <InstancedBatch batchKey="b8-pccc" matrices={data.redPccc} geometry={sharedGeos.box} color="#dc2626" roughness={0.35} />
      <InstancedBatch batchKey="b8-boardW" matrices={data.whiteBoards} geometry={sharedGeos.box} color="#f8fafc" roughness={0.3} castShadow={false} />
      <InstancedBatch
        batchKey="b8-exit"
        matrices={data.greenExit}
        geometry={sharedGeos.box}
        color="#16a34a"
        emissive="#16a34a"
        emissiveIntensity={0.9}
        castShadow={false}
      />
      <InstancedBatch batchKey="b8-exit-rod" matrices={data.exitRods} geometry={sharedGeos.cyl} color="#9ca3af" metalness={0.7} roughness={0.3} castShadow={false} />
      <InstancedBatch batchKey="b8-win-frame" matrices={data.windowFrames} geometry={sharedGeos.box} color="#9ca3af" metalness={0.5} roughness={0.35} />
      <InstancedBatch batchKey="b8-wall-brown" matrices={data.wallBrown} geometry={sharedGeos.box} color="#42322c" roughness={0.85} />

      <InstancedBatch batchKey="b8-desk" matrices={data.desksWood} geometry={sharedGeos.box} color="#d4a373" roughness={0.6} />
      <InstancedBatch batchKey="b8-chair" matrices={data.chairsSlate} geometry={sharedGeos.box} color="#334155" roughness={0.6} />
      <InstancedBatch batchKey="b8-tdesk" matrices={data.teacherDesks} geometry={sharedGeos.box} color="#b45309" roughness={0.5} />
      <InstancedBatch batchKey="b8-boardG" matrices={data.boardsGreen} geometry={sharedGeos.box} color="#064e3b" roughness={0.3} metalness={0.1} castShadow={false} />

      <InstancedBatch
        batchKey="b8-paving"
        matrices={data.courtyardPaving}
        geometry={sharedGeos.box}
        color="#a8abad"
        roughness={0.75}
        castShadow={false}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-2}
      />
      <InstancedBatch batchKey="b8-rim" matrices={data.planterRims} geometry={sharedGeos.box} color="#3f3f46" roughness={0.8} />
      <InstancedBatch batchKey="b8-lily" matrices={data.lilyFoliage} geometry={sharedGeos.box} color="#2f5d34" roughness={0.85} />
      <InstancedBatch batchKey="b8-flower" matrices={data.lilyFlowers} geometry={sharedGeos.box} color="#f8fafc" roughness={0.5} castShadow={false} />
      <SalixAlbaTrees instances={data.salixTrees} />
      <InstancedBatch batchKey="b8-stakes" matrices={data.treeStakes} geometry={sharedGeos.cyl} color="#9ca3af" metalness={0.7} roughness={0.3} />

      <InstancedBatch batchKey="b8-step" matrices={data.stairSteps} geometry={sharedGeos.box} color="#1e293b" metalness={0.4} roughness={0.45} />
      <InstancedBatch batchKey="b8-soffit" matrices={data.stairSoffits} geometry={sharedGeos.box} color="#d6cec2" roughness={0.78} />
      <InstancedBatch batchKey="b8-srail" matrices={data.stairRails} geometry={sharedGeos.box} color="#d8dde3" metalness={0.35} roughness={0.3} />

      {floor === 4 && <B8ComputerLabs />}

      {[1, 2, 3, 4].map((boothFloor) => {
        if (!showUpperFloors && boothFloor > floor) return null;
        return (
          <B8ElevatorBooth
            key={boothFloor}
            boothFloor={boothFloor}
            yOffset={(boothFloor - floor) * FLOOR_HEIGHT}
            isCurrentFloor={boothFloor === floor}
          />
        );
      })}
    </group>
  );
}

/** Sảnh thang máy B8 kiểu B11 dựng ở mọi tầng 1–4 */
function B8ElevatorBooth({
  boothFloor,
  yOffset,
  isCurrentFloor,
}: {
  boothFloor: number;
  yOffset: number;
  isCurrentFloor: boolean;
}) {
  const [worldX, worldZ] = b8Layout.elevator.posWorld;
  const yaw = getLocalFacingYaw(b8Layout.toWorld, 0);
  const ledColors = ['#38bdf8', '#34d399', '#f59e0b', '#ec4899'];
  const ledColor = ledColors[(boothFloor - 1) % ledColors.length] ?? '#38bdf8';

  return (
    <group position={[worldX, yOffset, worldZ]} rotation-y={yaw}>
      {/* Khung đá marble kem be */}
      <mesh position={[0.04, 1.32, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.18, 2.64, 2.55]} />
        <meshStandardMaterial color="#d6c8b4" roughness={0.45} />
      </mesh>
      {/* 2 cánh cửa inox xước */}
      <mesh position={[-0.06, 1.2, -0.52]} castShadow receiveShadow>
        <boxGeometry args={[0.05, 2.34, 0.98]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[-0.06, 1.2, 0.52]} castShadow receiveShadow>
        <boxGeometry args={[0.05, 2.34, 0.98]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Khe giữa 2 cánh cửa */}
      <mesh position={[-0.065, 1.2, 0]}>
        <boxGeometry args={[0.06, 2.34, 0.02]} />
        <meshStandardMaterial color="#475569" roughness={0.6} />
      </mesh>
      {/* Bảng nút gọi thang + 2 nút tròn ▲▼ */}
      <mesh position={[-0.07, 1.25, 1.15]}>
        <boxGeometry args={[0.04, 0.34, 0.14]} />
        <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[-0.09, 1.31, 1.15]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.01, 12]} />
        <meshStandardMaterial color="#e2e8f0" emissive="#e2e8f0" emissiveIntensity={0.4} roughness={0.25} />
      </mesh>
      <mesh position={[-0.09, 1.19, 1.15]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.01, 12]} />
        <meshStandardMaterial color="#e2e8f0" emissive="#e2e8f0" emissiveIntensity={0.4} roughness={0.25} />
      </mesh>
      {/* Màn LED báo tầng phía trên */}
      <mesh position={[-0.08, 2.55, 0]}>
        <boxGeometry args={[0.05, 0.24, 0.56]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <Text
        position={[-0.11, 2.55, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        fontSize={0.16}
        color={ledColor}
        anchorX="center"
        anchorY="middle"
      >
        {String(boothFloor)}
      </Text>
      {isCurrentFloor && (
        <pointLight position={[-0.9, 2.4, 0]} color={ledColor} intensity={0.65} distance={4.5} />
      )}
    </group>
  );
}
