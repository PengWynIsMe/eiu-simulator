import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  BoxGeometry,
  CylinderGeometry,
  Euler,
  IcosahedronGeometry,
  Matrix4,
  Quaternion,
  Vector3,
  type BufferGeometry,
  type InstancedMesh,
} from 'three';
import { FLOOR_HEIGHT } from '../../data';
import type { Vec2 } from '../../types';
import { createInstanceMatrix, getLocalFacingYaw } from './InteriorFurniture';
import {
  B8_EAST_HOLE_UV,
  B8_EXIT_SIGNS,
  B8_PCCC_POINTS,
  B8_WEST_HOLE_UV,
  b8Layout,
  getFloorDoors,
  getFloorRooms,
  toWorld,
} from './layouts/b8';

const UP_VEC = new Vector3(0, 1, 0);
const LOCAL_X_VEC = new Vector3(1, 0, 0);
const LOUVER_TILT_RAD = (35 * Math.PI) / 180;

const WEST_COL_US = [13.75, 22.75, 31.75, 40.75, 49.75] as const;
const EAST_COL_US = Array.from({ length: 9 }, (_, i) => 54.35 + i * 7.5375);

/** Tạo ma trận cho thanh nghiêng 3D nối từ p1 tới p2 (dùng cho giàn chống thép 4 chân). */
function makeTiltedPipeMatrix(
  p1: readonly [number, number, number],
  p2: readonly [number, number, number],
  diameter: number
): Matrix4 {
  const a = new Vector3(p1[0], p1[1], p1[2]);
  const b = new Vector3(p2[0], p2[1], p2[2]);
  const dir = new Vector3().subVectors(b, a);
  const len = dir.length();
  if (len < 0.01) return new Matrix4().makeScale(0, 0, 0);
  const mid = new Vector3().addVectors(a, b).multiplyScalar(0.5);
  const quat = new Quaternion().setFromUnitVectors(UP_VEC, dir.normalize());
  return new Matrix4().compose(mid, quat, new Vector3(diameter, len, diameter));
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
  const sharedGeos = useMemo(() => {
    const box = new BoxGeometry(1, 1, 1);
    const cyl = new CylinderGeometry(0.5, 0.5, 1, 12);
    const canopy = new IcosahedronGeometry(0.5, 1);
    return { box, cyl, canopy };
  }, []);

  useEffect(() => {
    return () => {
      sharedGeos.box.dispose();
      sharedGeos.cyl.dispose();
      sharedGeos.canopy.dispose();
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
    const windowGlass: Matrix4[] = [];

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

      // Dải cửa sổ giả trên mặt tường phòng phía hành lang (giữa 2 cửa dài >= 3.0 m)
      const fRooms = getFloorRooms(f);
      const fDoors = getFloorDoors(f);
      for (const room of fRooms) {
        if (!room.code.includes('.B8')) continue;
        const isNorth = room.maxV <= -200.0;
        const isSouth = room.minV >= -178.0;
        if (!isNorth && !isSouth) continue;

        const roomDoors = fDoors
          .filter((d) => d.roomCode === room.code)
          .sort((a, b) => a.u1 - b.u1);
        if (roomDoors.length < 2) continue;

        const d1 = roomDoors[0];
        const d2 = roomDoors[1];
        if (!d1 || !d2) continue;
        const segLen = d2.u1 - d1.u2;
        if (segLen < 3.0) continue;

        const winU1 = d1.u2 + 0.6;
        const winU2 = d2.u1 - 0.6;
        const winLen = winU2 - winU1;
        if (winLen < 0.8) continue;

        const midU = (winU1 + winU2) * 0.5;
        const wallV = isNorth ? room.maxV + 0.12 : room.minV - 0.12;

        // Kính (y 1.0 → 2.4)
        windowGlass.push(createInstanceMatrix(toWorld, midU, wallV, dy + 1.7, 0, winLen - 0.06, 1.34, 0.02));
        // Khung nhôm ngang trên & dưới
        windowFrames.push(createInstanceMatrix(toWorld, midU, wallV, dy + 2.38, 0, winLen, 0.05, 0.04));
        windowFrames.push(createInstanceMatrix(toWorld, midU, wallV, dy + 1.02, 0, winLen, 0.05, 0.04));
        // Đố đứng mỗi ~1.2 m (gồm 2 đầu)
        const mullionCount = Math.max(1, Math.round(winLen / 1.2));
        for (let m = 0; m <= mullionCount; m++) {
          const mu = winU1 + (winLen * m) / mullionCount;
          windowFrames.push(createInstanceMatrix(toWorld, mu, wallV, dy + 1.7, 0, 0.045, 1.4, 0.04));
        }
      }

      // Chỉ tầng 2–4: gờ bê tông, lan can inox 4 thanh, dải sàn xanh dương, sàn hành lang bê tông mài
      if (f >= 2) {
        addHolePolygonCurbsAndRailings(creamStruct, railingSteel, B8_WEST_HOLE_UV, dy);
        addHolePolygonCurbsAndRailings(creamStruct, railingSteel, B8_EAST_HOLE_UV, dy);

        // Dải sàn xanh dương rộng 0.6 m sát gờ (phía hành lang, khép kín góc)
        // Sân Tây
        blueEdgeTrim.push(createInstanceMatrix(toWorld, 31.75, -197.4, dy + 0.005, 0, 37.9, 0.01, 0.6));
        blueEdgeTrim.push(createInstanceMatrix(toWorld, 31.75, -179.7, dy + 0.005, 0, 37.9, 0.01, 0.6));
        blueEdgeTrim.push(createInstanceMatrix(toWorld, 13.1, -188.55, dy + 0.005, Math.PI / 2, 17.1, 0.01, 0.6));
        blueEdgeTrim.push(createInstanceMatrix(toWorld, 50.4, -188.55, dy + 0.005, Math.PI / 2, 17.1, 0.01, 0.6));
        // Sân Đông
        blueEdgeTrim.push(createInstanceMatrix(toWorld, 84.5, -196.9, dy + 0.005, 0, 62.2, 0.01, 0.6));
        blueEdgeTrim.push(createInstanceMatrix(toWorld, 84.5, -179.2, dy + 0.005, 0, 62.2, 0.01, 0.6));
        blueEdgeTrim.push(createInstanceMatrix(toWorld, 53.7, -193.4, dy + 0.005, Math.PI / 2, 6.4, 0.01, 0.6));
        blueEdgeTrim.push(createInstanceMatrix(toWorld, 53.7, -183.0, dy + 0.005, Math.PI / 2, 7.0, 0.01, 0.6));
        blueEdgeTrim.push(createInstanceMatrix(toWorld, 115.3, -193.45, dy + 0.005, Math.PI / 2, 6.3, 0.01, 0.6));
        blueEdgeTrim.push(createInstanceMatrix(toWorld, 115.3, -182.15, dy + 0.005, Math.PI / 2, 5.3, 0.01, 0.6));

        // Sàn hành lang mở bê tông mài (#a3a8ad)
        corridorFloor.push(createInstanceMatrix(toWorld, 31.75, -198.5, dy + 0.002, 0, 36.5, 0.004, 3.0));
        corridorFloor.push(createInstanceMatrix(toWorld, 31.75, -178.9, dy + 0.002, 0, 36.5, 0.004, 2.4));
        corridorFloor.push(createInstanceMatrix(toWorld, 84.5, -198.25, dy + 0.002, 0, 60.8, 0.004, 3.5));
        corridorFloor.push(createInstanceMatrix(toWorld, 84.5, -178.65, dy + 0.002, 0, 60.8, 0.004, 1.9));
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

      const vCenter = (room.minV + room.maxV) / 2;
      const isNorth = room.maxV <= -200.0;

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

    // 3. Sân vườn tầng trệt (giữ vị trí bồn & cây của T15a, đổi cách dựng theo bảng)
    const groundY = -(floor - 1) * FLOOR_HEIGHT;
    const courtyardPaving: Matrix4[] = [];
    const planterRims: Matrix4[] = [];
    const lilyFoliage: Matrix4[] = [];
    const lilyFlowers: Matrix4[] = [];
    const treeTrunks: Matrix4[] = [];
    const canopyDark: Matrix4[] = [];
    const canopyLight: Matrix4[] = [];
    const treeStakes: Matrix4[] = [];

    // Nền lát đá phủ cả sân (#a8abad)
    courtyardPaving.push(createInstanceMatrix(toWorld, 31.75, -188.55, groundY + 0.01, 0, 36.5, 0.02, 16.9));
    courtyardPaving.push(createInstanceMatrix(toWorld, 84.5, -188.05, groundY + 0.01, 0, 60.8, 0.02, 16.9));

    const planters = [
      { centerU: 25.0, lenU: 8.5, centerV: -188.55, widthV: 5.0 },
      { centerU: 35.0, lenU: 8.5, centerV: -188.55, widthV: 5.0 },
      { centerU: 45.0, lenU: 7.2, centerV: -188.55, widthV: 5.0 },
      { centerU: 65.0, lenU: 8.5, centerV: -188.05, widthV: 5.0 },
      { centerU: 75.0, lenU: 8.5, centerV: -188.05, widthV: 5.0 },
      { centerU: 85.0, lenU: 8.5, centerV: -188.05, widthV: 5.0 },
      { centerU: 95.0, lenU: 8.5, centerV: -188.05, widthV: 5.0 },
      { centerU: 104.0, lenU: 6.5, centerV: -188.05, widthV: 5.0 },
    ];

    const rng = createSeededRng(202608);
    for (const p of planters) {
      const halfU = p.lenU * 0.5;
      const halfV = p.widthV * 0.5;
      const rimThick = 0.15;
      const rimH = 0.15;
      const rimY = groundY + rimH * 0.5;

      // Gờ bồn cây đá tối #3f3f46 (4 cạnh)
      planterRims.push(createInstanceMatrix(toWorld, p.centerU, p.centerV - halfV + rimThick * 0.5, rimY, 0, p.lenU, rimH, rimThick));
      planterRims.push(createInstanceMatrix(toWorld, p.centerU, p.centerV + halfV - rimThick * 0.5, rimY, 0, p.lenU, rimH, rimThick));
      planterRims.push(createInstanceMatrix(toWorld, p.centerU - halfU + rimThick * 0.5, p.centerV, rimY, 0, rimThick, rimH, p.widthV - rimThick * 2));
      planterRims.push(createInstanceMatrix(toWorld, p.centerU + halfU - rimThick * 0.5, p.centerV, rimY, 0, rimThick, rimH, p.widthV - rimThick * 2));

      // Thảm lan ý #2f5d34 cao 0.45 m
      const innerLenU = p.lenU - rimThick * 2;
      const innerWidthV = p.widthV - rimThick * 2;
      lilyFoliage.push(createInstanceMatrix(toWorld, p.centerU, p.centerV, groundY + 0.225, 0, innerLenU, 0.45, innerWidthV));

      // Hoa trắng hộp 0.08 m, ~1 bông / 0.8 m²
      const flowerCount = Math.max(8, Math.round((innerLenU * innerWidthV) / 0.8));
      for (let i = 0; i < flowerCount; i++) {
        const fu = p.centerU + (rng() - 0.5) * (innerLenU - 0.4);
        const fv = p.centerV + (rng() - 0.5) * (innerWidthV - 0.4);
        lilyFlowers.push(createInstanceMatrix(toWorld, fu, fv, groundY + 0.48, rng() * Math.PI, 0.08, 0.08, 0.08));
      }
    }

    const treeLocs: readonly [number, number][] = [
      [25.0, -188.55],
      [35.0, -188.55],
      [45.0, -188.55],
      [65.0, -188.05],
      [75.0, -188.05],
      [85.0, -188.05],
      [95.0, -188.05],
      [104.0, -188.05],
    ];

    for (const [tu, tv] of treeLocs) {
      // Thân cây Ø0.35, cao 13.0 m
      treeTrunks.push(createInstanceMatrix(toWorld, tu, tv, groundY + 6.5, 0, 0.35, 13.0, 0.35));

      // 3 khối icosahedron chồng lệch nhau (Ø4–6, tâm y 9.5 / 11.5 / 13.0)
      canopyDark.push(createInstanceMatrix(toWorld, tu - 0.3, tv + 0.2, groundY + 9.5, 0, 5.6, 4.2, 5.4));
      canopyLight.push(createInstanceMatrix(toWorld, tu + 0.4, tv - 0.2, groundY + 11.5, 0.7, 5.0, 4.0, 4.8));
      canopyDark.push(createInstanceMatrix(toWorld, tu - 0.1, tv - 0.1, groundY + 13.0, 1.3, 4.2, 3.6, 4.2));

      // Giàn chống thép 4 chân Ø0.08 từ cách gốc 1.2 m chụm vào thân ở cao 3.0 m
      const [topX, topZ] = toWorld(tu, tv);
      const topPt = [topX, groundY + 3.0, topZ] as const;
      for (const [du, dv] of [
        [1.2, 0],
        [-1.2, 0],
        [0, 1.2],
        [0, -1.2],
      ] as const) {
        const [bx, bz] = toWorld(tu + du, tv + dv);
        treeStakes.push(makeTiltedPipeMatrix([bx, groundY, bz], topPt, 0.08));
      }
    }

    // 4. Cầu thang bộ gấp 2 đoạn (dựng cho tầng 1–3 để nhìn lên/xuống giữa các tầng đều có thang)
    const stairSteps: Matrix4[] = [];
    const stairLandings: Matrix4[] = [];
    const stairRails: Matrix4[] = [];

    const RISE = FLOOR_HEIGHT / 24;
    const TREAD = 0.28;
    const FLIGHT_W = 1.3;
    const GAP = 0.2;
    const LANDING_DEPTH = 1.3;
    const LANDING_W = 2 * FLIGHT_W + GAP;

    const stairs = [
      { axis: 'v' as const, corridorEdge: -200.0, dir: -1 as const, centerCross: 11.05 },
      { axis: 'v' as const, corridorEdge: -200.0, dir: -1 as const, centerCross: 51.9 },
      { axis: 'v' as const, corridorEdge: -177.7, dir: 1 as const, centerCross: 11.6 },
      { axis: 'v' as const, corridorEdge: -177.7, dir: 1 as const, centerCross: 51.85 },
      { axis: 'u' as const, corridorEdge: 114.5, dir: -1 as const, centerCross: -187.55 },
    ];

    for (let f = 1; f <= 3; f++) {
      if (!showUpperFloors && f > floor) continue;
      const dy = (f - floor) * FLOOR_HEIGHT;

      for (const st of stairs) {
        const isV = st.axis === 'v';
        const crossOffsetF1 = +(GAP / 2 + FLIGHT_W / 2);

        for (let i = 0; i < 12; i++) {
          const distAlong = (i + 0.5) * TREAD;
          const mainCoord = st.corridorEdge + st.dir * distAlong;
          const crossCoord = st.centerCross + crossOffsetF1;
          const u = isV ? crossCoord : mainCoord;
          const v = isV ? mainCoord : crossCoord;
          const stepH = i === 0 ? RISE - 0.02 : RISE;
          const stepCenterY = dy + (i === 0 ? 0.02 + stepH / 2 : (i + 0.5) * RISE);
          stairSteps.push(
            createInstanceMatrix(toWorld, u, v, stepCenterY, 0, isV ? FLIGHT_W : TREAD, stepH, isV ? TREAD : FLIGHT_W)
          );
        }

        const landingMainCoord = st.corridorEdge + st.dir * (12 * TREAD + LANDING_DEPTH / 2);
        const landingU = isV ? st.centerCross : landingMainCoord;
        const landingV = isV ? landingMainCoord : st.centerCross;
        stairLandings.push(
          createInstanceMatrix(
            toWorld,
            landingU,
            landingV,
            dy + 1.9 - 0.08,
            0,
            isV ? LANDING_W : LANDING_DEPTH,
            0.16,
            isV ? LANDING_DEPTH : LANDING_W
          )
        );

        const crossOffsetF2 = -(GAP / 2 + FLIGHT_W / 2);
        for (let j = 0; j < 12; j++) {
          const distAlong = 12 * TREAD - (j + 0.5) * TREAD;
          const mainCoord = st.corridorEdge + st.dir * distAlong;
          const crossCoord = st.centerCross + crossOffsetF2;
          const u = isV ? crossCoord : mainCoord;
          const v = isV ? mainCoord : crossCoord;
          stairSteps.push(
            createInstanceMatrix(
              toWorld,
              u,
              v,
              dy + (12 + j + 0.5) * RISE,
              0,
              isV ? FLIGHT_W : TREAD,
              RISE,
              isV ? TREAD : FLIGHT_W
            )
          );
        }

        const postLocations = [
          { dist: 0.14, cross: crossOffsetF1 + FLIGHT_W / 2, baseY: 0 },
          { dist: 0.14, cross: crossOffsetF1 - FLIGHT_W / 2, baseY: 0 },
          { dist: 1.82, cross: crossOffsetF1 + FLIGHT_W / 2, baseY: 6 * RISE },
          { dist: 1.82, cross: crossOffsetF1 - FLIGHT_W / 2, baseY: 6 * RISE },
          { dist: 3.36, cross: crossOffsetF1 + FLIGHT_W / 2, baseY: 1.9 },
          { dist: 3.36, cross: crossOffsetF1 - FLIGHT_W / 2, baseY: 1.9 },
          { dist: 4.66, cross: +LANDING_W / 2, baseY: 1.9 },
          { dist: 4.66, cross: +0.4, baseY: 1.9 },
          { dist: 4.66, cross: -0.4, baseY: 1.9 },
          { dist: 4.66, cross: -LANDING_W / 2, baseY: 1.9 },
          { dist: 3.36, cross: crossOffsetF2 + FLIGHT_W / 2, baseY: 1.9 },
          { dist: 3.36, cross: crossOffsetF2 - FLIGHT_W / 2, baseY: 1.9 },
          { dist: 1.82, cross: crossOffsetF2 + FLIGHT_W / 2, baseY: 18 * RISE },
          { dist: 1.82, cross: crossOffsetF2 - FLIGHT_W / 2, baseY: 18 * RISE },
          { dist: 0.14, cross: crossOffsetF2 + FLIGHT_W / 2, baseY: 3.8 },
          { dist: 0.14, cross: crossOffsetF2 - FLIGHT_W / 2, baseY: 3.8 },
        ];

        for (const p of postLocations) {
          const mCoord = st.corridorEdge + st.dir * p.dist;
          const cCoord = st.centerCross + p.cross;
          stairRails.push(
            createInstanceMatrix(toWorld, isV ? cCoord : mCoord, isV ? mCoord : cCoord, dy + p.baseY + 0.45, 0, 0.04, 0.9, 0.04)
          );
        }

        const backM = st.corridorEdge + st.dir * 4.66;
        stairRails.push(
          createInstanceMatrix(
            toWorld,
            isV ? st.centerCross : backM,
            isV ? backM : st.centerCross,
            dy + 2.8,
            0,
            isV ? LANDING_W : 0.04,
            0.04,
            isV ? 0.04 : LANDING_W
          )
        );

        const sideM = st.corridorEdge + st.dir * (3.36 + LANDING_DEPTH / 2);
        for (const sideSign of [-1, 1]) {
          const sideC = st.centerCross + sideSign * (LANDING_W / 2);
          stairRails.push(
            createInstanceMatrix(
              toWorld,
              isV ? sideC : sideM,
              isV ? sideM : sideC,
              dy + 2.8,
              0,
              isV ? 0.04 : LANDING_DEPTH,
              0.04,
              isV ? LANDING_DEPTH : 0.04
            )
          );
        }

        for (let s = 0; s < 6; s++) {
          const segM1 = st.corridorEdge + st.dir * ((s * 2 + 1) * TREAD);
          const segY1 = dy + (s * 2 + 1) * RISE + 0.9;
          for (const sign of [-1, 1]) {
            const segC1 = st.centerCross + crossOffsetF1 + sign * (FLIGHT_W / 2);
            stairRails.push(
              createInstanceMatrix(toWorld, isV ? segC1 : segM1, isV ? segM1 : segC1, segY1, 0, isV ? 0.04 : TREAD * 2, 0.04, isV ? TREAD * 2 : 0.04)
            );
          }

          const segM2 = st.corridorEdge + st.dir * (12 * TREAD - (s * 2 + 1) * TREAD);
          const segY2 = dy + (12 + s * 2 + 1) * RISE + 0.9;
          for (const sign of [-1, 1]) {
            const segC2 = st.centerCross + crossOffsetF2 + sign * (FLIGHT_W / 2);
            stairRails.push(
              createInstanceMatrix(toWorld, isV ? segC2 : segM2, isV ? segM2 : segC2, segY2, 0, isV ? 0.04 : TREAD * 2, 0.04, isV ? TREAD * 2 : 0.04)
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
      windowGlass,
      desksWood,
      chairsSlate,
      boardsGreen,
      teacherDesks,
      courtyardPaving,
      planterRims,
      lilyFoliage,
      lilyFlowers,
      treeTrunks,
      canopyDark,
      canopyLight,
      treeStakes,
      stairSteps,
      stairLandings,
      stairRails,
    };
  }, [floor, showUpperFloors]);

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
      <InstancedBatch batchKey="b8-blue" matrices={data.blueEdgeTrim} geometry={sharedGeos.box} color="#2f7fc1" roughness={0.4} castShadow={false} />
      <InstancedBatch batchKey="b8-corr" matrices={data.corridorFloor} geometry={sharedGeos.box} color="#a3a8ad" roughness={0.5} castShadow={false} />
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
      <InstancedBatch
        batchKey="b8-win-glass"
        matrices={data.windowGlass}
        geometry={sharedGeos.box}
        color="#9fb8c8"
        transparent
        opacity={0.55}
        roughness={0.15}
        metalness={0.2}
        castShadow={false}
      />

      <InstancedBatch batchKey="b8-desk" matrices={data.desksWood} geometry={sharedGeos.box} color="#d4a373" roughness={0.6} />
      <InstancedBatch batchKey="b8-chair" matrices={data.chairsSlate} geometry={sharedGeos.box} color="#334155" roughness={0.6} />
      <InstancedBatch batchKey="b8-tdesk" matrices={data.teacherDesks} geometry={sharedGeos.box} color="#b45309" roughness={0.5} />
      <InstancedBatch batchKey="b8-boardG" matrices={data.boardsGreen} geometry={sharedGeos.box} color="#064e3b" roughness={0.3} metalness={0.1} castShadow={false} />

      <InstancedBatch batchKey="b8-paving" matrices={data.courtyardPaving} geometry={sharedGeos.box} color="#a8abad" roughness={0.75} castShadow={false} />
      <InstancedBatch batchKey="b8-rim" matrices={data.planterRims} geometry={sharedGeos.box} color="#3f3f46" roughness={0.8} />
      <InstancedBatch batchKey="b8-lily" matrices={data.lilyFoliage} geometry={sharedGeos.box} color="#2f5d34" roughness={0.85} />
      <InstancedBatch batchKey="b8-flower" matrices={data.lilyFlowers} geometry={sharedGeos.box} color="#f8fafc" roughness={0.5} castShadow={false} />
      <InstancedBatch batchKey="b8-trunk" matrices={data.treeTrunks} geometry={sharedGeos.cyl} color="#4a3a2e" roughness={0.9} />
      <InstancedBatch batchKey="b8-canopyD" matrices={data.canopyDark} geometry={sharedGeos.canopy} color="#3f7d3a" roughness={0.85} />
      <InstancedBatch batchKey="b8-canopyL" matrices={data.canopyLight} geometry={sharedGeos.canopy} color="#4f8f45" roughness={0.85} />
      <InstancedBatch batchKey="b8-stakes" matrices={data.treeStakes} geometry={sharedGeos.cyl} color="#9ca3af" metalness={0.7} roughness={0.3} />

      <InstancedBatch batchKey="b8-step" matrices={data.stairSteps} geometry={sharedGeos.box} color="#8c929c" roughness={0.8} />
      <InstancedBatch batchKey="b8-land" matrices={data.stairLandings} geometry={sharedGeos.box} color="#8c929c" roughness={0.8} />
      <InstancedBatch batchKey="b8-srail" matrices={data.stairRails} geometry={sharedGeos.box} color="#d8dde3" metalness={0.35} roughness={0.3} />

      <B8ElevatorBooth floor={floor} />
    </group>
  );
}

/** Buồng thang máy B8 tại nhịp giữa */
function B8ElevatorBooth({ floor }: { floor: number }) {
  const [worldX, worldZ] = b8Layout.elevator.posWorld;
  const yaw = getLocalFacingYaw(b8Layout.toWorld, 0);
  const ledColors = ['#38bdf8', '#34d399', '#f59e0b', '#ec4899'];
  const ledColor = ledColors[floor - 1] ?? '#38bdf8';

  return (
    <group position={[worldX, 0, worldZ]} rotation-y={yaw}>
      <mesh position={[-0.05, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 2.6, 2.4]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-0.12, 1.2, -0.52]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 2.35, 1.0]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[-0.12, 1.2, 0.52]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 2.35, 1.0]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[-0.18, 2.6, 0]}>
        <boxGeometry args={[0.05, 0.35, 0.7]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-0.22, 2.6, 0]}>
        <boxGeometry args={[0.01, 0.18, 0.35]} />
        <meshStandardMaterial color={ledColor} emissive={ledColor} emissiveIntensity={1.2} roughness={0.1} />
      </mesh>
      <pointLight position={[-0.8, 2.4, 0]} color={ledColor} intensity={0.6} distance={3.5} />
    </group>
  );
}
