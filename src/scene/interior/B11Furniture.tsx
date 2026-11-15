import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  BoxGeometry,
  CylinderGeometry,
  Matrix4,
  Quaternion,
  Vector3,
  type BufferGeometry,
  type InstancedMesh,
} from 'three';
import { FLOOR_HEIGHT } from '../../data';
import { createInstanceMatrix, getLocalFacingYaw } from './InteriorFurniture';
import {
  B11_BOUNDS,
  B11_ELEVATOR_LOCAL,
  B11_PCCC_POINTS,
  B11_PINGPONG_BOUNDS,
  B11_STAIRWELLS,
  B11_TREE_BEDS,
  b11ToWorld,
} from './layouts/b11';

const UP_VEC = new Vector3(0, 1, 0);

function makeTiltedBoxMatrix(
  p1: [number, number, number],
  p2: [number, number, number],
  radius: number
): Matrix4 {
  const a = new Vector3(p1[0], p1[1], p1[2]);
  const b = new Vector3(p2[0], p2[1], p2[2]);
  const dir = new Vector3().subVectors(b, a);
  const len = dir.length();
  const mid = new Vector3().addVectors(a, b).multiplyScalar(0.5);
  const quat = new Quaternion().setFromUnitVectors(UP_VEC, dir.normalize());
  return new Matrix4().compose(mid, quat, new Vector3(radius * 2, len, radius * 2));
}

function addRailingSegment(
  railMatrices: Matrix4[],
  postMatrices: Matrix4[],
  u1: number,
  v1: number,
  u2: number,
  v2: number,
  baseY = 0
): void {
  const du = u2 - u1;
  const dv = v2 - v1;
  const len = Math.hypot(du, dv);
  if (len < 0.2) return;

  const cu = (u1 + u2) * 0.5;
  const cv = (v1 + v2) * 0.5;
  const yaw = -Math.atan2(dv, du);

  // 4 thanh inox ngang (tay vịn trên + 3 thanh ngang như ảnh 2c912454)
  for (const ry of [0.34, 0.58, 0.82, 1.08]) {
    const thickness = ry > 1.0 ? 0.065 : 0.032;
    railMatrices.push(createInstanceMatrix(b11ToWorld, cu, cv, baseY + ry, yaw, len, thickness, thickness));
  }

  const posts = Math.max(2, Math.floor(len / 2.2) + 1);
  for (let i = 0; i < posts; i++) {
    const t = posts === 1 ? 0.5 : i / (posts - 1);
    const pu = u1 + du * t;
    const pv = v1 + dv * t;
    postMatrices.push(createInstanceMatrix(b11ToWorld, pu, pv, baseY + 0.54, 0, 0.045, 1.08, 0.045));
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
      />
    </instancedMesh>
  );
}

/**
 * Nội thất chi tiết chuẩn 4 tầng Block 11:
 * - Cột kem, dầm trần, lam chắn nắng 5 thanh & lan can inox 4 thanh + viền lam xanh dương
 * - Sân trong tầng trệt (bồn đá nổi, cây xanh có giàn cọc chống 4 chân, hoa lan ý trắng, ghế đá)
 * - 5 cầu thang bộ kèm máng cáp điện trần (ảnh 24a8477c), hộp thang máy khung đá (ảnh 86037173)
 * - Tủ PCCC đỏ, bình chữa cháy, bảng EXIT xanh, đèn thả trần hành lang
 * - Phòng DatBike 101/103, PTN 4.0, Skill Lab 307, CLB Bóng bàn 410.B11 (kính trong + 2 bàn bóng bàn), WC vách ngăn & bồn rửa đen
 */
export default function B11Furniture({
  floor,
  showUpperFloors = true,
}: {
  floor: number;
  showUpperFloors?: boolean;
}) {
  const sharedGeos = useMemo(() => {
    const box = new BoxGeometry(1, 1, 1);
    const cyl = new CylinderGeometry(0.5, 0.5, 1, 8);
    return { box, cyl };
  }, []);

  useEffect(() => {
    return () => {
      sharedGeos.box.dispose();
      sharedGeos.cyl.dispose();
    };
  }, [sharedGeos]);

  const data = useMemo(() => {
    const B = B11_BOUNDS;
    const creamColumns: Matrix4[] = [];
    const ceilingBeams: Matrix4[] = [];
    const whiteLouvers: Matrix4[] = [];
    const blueEdgeTrim: Matrix4[] = [];
    const steelParts: Matrix4[] = [];
    const darkGranite: Matrix4[] = [];
    const desksWood: Matrix4[] = [];
    const blackMetal: Matrix4[] = [];
    const chairsSlate: Matrix4[] = [];
    const boardsWhite: Matrix4[] = [];
    const redPccc: Matrix4[] = [];
    const greenExit: Matrix4[] = [];
    const warmLights: Matrix4[] = [];
    const glassMullions: Matrix4[] = [];
    const pingPongGreen: Matrix4[] = [];
    const bikeAccent: Matrix4[] = [];
    const clinicalWhite: Matrix4[] = [];
    const signYellow: Matrix4[] = [];

    // 1–3. Kết cấu lặp đầy đủ cả 4 tầng (1–4 trừ tầng trên khi bật Top-Down C)
    // Đứng ở Tầng Trệt (1) nhìn lên thấy rõ hệ cột kem, dầm trần, lam trắng 5 thanh, lan can inox & viền xanh của Tầng 2–4
    const colUs = [1.5, 8.2, 16.0, 23.8, 31.6, 39.4, 47.2, 55.2, 61.3, 64.95, 68.5, 77.8, 87.2, 96.6, 106.0, 115.35, 121.4];
    for (let f = 1; f <= 4; f++) {
      if (!showUpperFloors && f > floor) continue;
      const dy = (f - floor) * FLOOR_HEIGHT;

      // Cột kết cấu kem (#d6cec2) & dầm trần ngang dọc hành lang Bắc / Nam
      for (const u of colUs) {
        creamColumns.push(createInstanceMatrix(b11ToWorld, u, B.vCyN, dy + FLOOR_HEIGHT * 0.5, 0, 0.46, FLOOR_HEIGHT, 0.46));
        creamColumns.push(createInstanceMatrix(b11ToWorld, u, B.vCyS, dy + FLOOR_HEIGHT * 0.5, 0, 0.46, FLOOR_HEIGHT, 0.46));

        ceilingBeams.push(createInstanceMatrix(b11ToWorld, u, (B.vNCorrIn + B.vCyN) * 0.5, dy + FLOOR_HEIGHT - 0.16, 0, 0.34, 0.32, 3.7));
        ceilingBeams.push(createInstanceMatrix(b11ToWorld, u, (B.vCyS + B.vSCorrIn) * 0.5, dy + FLOOR_HEIGHT - 0.16, 0, 0.34, 0.32, 3.7));
      }

      // Đố nhôm vách kính mặt tiền hành lang
      for (const u of [16, 24, 32, 40, 48, 73, 82, 91, 100, 110]) {
        glassMullions.push(createInstanceMatrix(b11ToWorld, u, B.vNCorrIn, dy + FLOOR_HEIGHT * 0.42, 0, 0.08, FLOOR_HEIGHT * 0.84, 0.14));
        glassMullions.push(createInstanceMatrix(b11ToWorld, u, B.vSCorrIn, dy + FLOOR_HEIGHT * 0.42, 0, 0.08, FLOOR_HEIGHT * 0.84, 0.14));
      }

      // Đèn trần tròn ánh sáng ấm dọc hành lang Bắc & Nam & cầu giữa
      for (let u = 5; u <= 119; u += 7.5) {
        warmLights.push(createInstanceMatrix(b11ToWorld, u, (B.vNCorrIn + B.vCyN) * 0.5, dy + FLOOR_HEIGHT - 0.28, 0, 0.42, 0.08, 0.42));
        warmLights.push(createInstanceMatrix(b11ToWorld, u, (B.vCyS + B.vSCorrIn) * 0.5, dy + FLOOR_HEIGHT - 0.28, 0, 0.42, 0.08, 0.42));
      }
      for (let v = -133; v <= -120; v += 4.2) {
        warmLights.push(createInstanceMatrix(b11ToWorld, 63.1, v, dy + FLOOR_HEIGHT - 0.28, 0, 0.42, 0.08, 0.42));
        warmLights.push(createInstanceMatrix(b11ToWorld, 4.8, v, dy + FLOOR_HEIGHT - 0.28, 0, 0.42, 0.08, 0.42));
        warmLights.push(createInstanceMatrix(b11ToWorld, 118.4, v, dy + FLOOR_HEIGHT - 0.28, 0, 0.42, 0.08, 0.42));
      }

      // Hệ lam chắn nắng 5 thanh trắng dọc 2 sân trong & hai bên cầu nối giữa (ảnh thực tế B11)
      for (let b = 0; b < 5; b++) {
        const ly = dy + 2.62 + b * 0.2;
        whiteLouvers.push(createInstanceMatrix(b11ToWorld, 34.75, B.vCyN - 0.05, ly, 0, 53.1, 0.04, 0.15));
        whiteLouvers.push(createInstanceMatrix(b11ToWorld, 34.75, -120.4, ly, 0, 53.1, 0.04, 0.15));
        whiteLouvers.push(createInstanceMatrix(b11ToWorld, 92.4, B.vCyN - 0.05, ly, 0, 45.5, 0.04, 0.15));
        whiteLouvers.push(createInstanceMatrix(b11ToWorld, 88.8, -120.9, ly, 0, 38.2, 0.04, 0.15));
        whiteLouvers.push(createInstanceMatrix(b11ToWorld, 61.35, -126.45, ly, Math.PI / 2, 11.7, 0.04, 0.15));
        whiteLouvers.push(createInstanceMatrix(b11ToWorld, 64.9, -130.65, ly, Math.PI / 2, 3.3, 0.04, 0.15));
        whiteLouvers.push(createInstanceMatrix(b11ToWorld, 64.9, -122.95, ly, Math.PI / 2, 4.1, 0.04, 0.15));
      }

      // Lan can inox 4 thanh & dải viền xanh dương quanh sân trong ở mọi tầng trên (Tầng 2–4)
      if (f >= 2) {
        addRailingSegment(steelParts, steelParts, 8.2, -132.3, 61.3, -132.3, dy);
        addRailingSegment(steelParts, steelParts, 8.2, -120.4, 61.3, -120.4, dy);
        addRailingSegment(steelParts, steelParts, 8.2, -132.3, 8.2, -120.4, dy);
        addRailingSegment(steelParts, steelParts, 61.3, -132.3, 61.3, -120.4, dy);

        addRailingSegment(steelParts, steelParts, 64.95, -132.3, 115.35, -132.3, dy);
        addRailingSegment(steelParts, steelParts, 64.95, -120.9, 115.35, -120.9, dy);
        addRailingSegment(steelParts, steelParts, 64.95, -132.3, 64.95, -129.0, dy);
        addRailingSegment(steelParts, steelParts, 64.95, -125.0, 64.95, -120.9, dy);
        addRailingSegment(steelParts, steelParts, 115.35, -132.3, 115.35, -129.6, dy);
        addRailingSegment(steelParts, steelParts, 115.35, -123.7, 115.35, -120.9, dy);
        addRailingSegment(steelParts, steelParts, 108.05, -129.6, 115.35, -129.6, dy);
        addRailingSegment(steelParts, steelParts, 108.05, -129.6, 108.05, -123.7, dy);
        addRailingSegment(steelParts, steelParts, 108.05, -123.7, 115.35, -123.7, dy);

        blueEdgeTrim.push(createInstanceMatrix(b11ToWorld, 34.75, -132.3, dy - 0.05, 0, 53.1, 0.14, 0.1));
        blueEdgeTrim.push(createInstanceMatrix(b11ToWorld, 34.75, -120.4, dy - 0.05, 0, 53.1, 0.14, 0.1));
        blueEdgeTrim.push(createInstanceMatrix(b11ToWorld, 8.2, -126.35, dy - 0.05, Math.PI / 2, 11.9, 0.14, 0.1));
        blueEdgeTrim.push(createInstanceMatrix(b11ToWorld, 61.3, -126.35, dy - 0.05, Math.PI / 2, 11.9, 0.14, 0.1));
        blueEdgeTrim.push(createInstanceMatrix(b11ToWorld, 90.15, -132.3, dy - 0.05, 0, 50.4, 0.14, 0.1));
        blueEdgeTrim.push(createInstanceMatrix(b11ToWorld, 90.15, -120.9, dy - 0.05, 0, 50.4, 0.14, 0.1));
      }
    }

    if (showUpperFloors) {
      // Kim thu lôi trên đỉnh tháp thang máy vượt mái
      const roofY = (5 - floor) * FLOOR_HEIGHT;
      steelParts.push(createInstanceMatrix(b11ToWorld, 67.25, -127.0, roofY + 4.4, 0, 0.06, 3.0, 0.06));
    }

    // 4. Bậc cầu thang bộ đá đen & máng cáp điện đục lỗ chạy ngang trần cầu thang (ảnh 24a8477c)
    for (const sw of B11_STAIRWELLS) {
      const cu = (sw.minU + sw.maxU) * 0.5;
      const cv = (sw.minV + sw.maxV) * 0.5;
      const shiftU = sw.id === 'mn' ? 1.2 : 0; // Để trống sảnh cửa Bắc tại mn
      for (let s = 0; s < 10; s++) {
        const stepU = cu + shiftU - 1.2 + s * 0.28;
        const stepY = s * 0.22 + 0.11;
        darkGranite.push(createInstanceMatrix(b11ToWorld, stepU, cv, stepY, 0, 0.3, 0.2, 2.2));
      }
      // Tay vịn inox cầu thang
      steelParts.push(createInstanceMatrix(b11ToWorld, cu + shiftU, cv - 1.05, 1.35, 0, 2.8, 0.04, 0.04));
      steelParts.push(createInstanceMatrix(b11ToWorld, cu + shiftU, cv + 1.05, 1.35, 0, 2.8, 0.04, 0.04));

      // Máng cáp điện thép chạy vắt ngang trần buồng thang (đặc trưng ảnh 24a8477c)
      steelParts.push(createInstanceMatrix(b11ToWorld, cu, cv, FLOOR_HEIGHT - 0.45, Math.PI / 2, (sw.maxV - sw.minV) * 0.58, 0.09, 0.36));

      // Biển EXIT xanh treo trần cạnh mỗi đầu cầu thang
      greenExit.push(createInstanceMatrix(b11ToWorld, cu, cv < -130 ? B.vCyN - 1.1 : B.vCyS + 1.1, 2.75, 0, 0.65, 0.26, 0.05));
    }

    // 5. Cụm tủ PCCC, bình chữa cháy, sơ đồ thoát hiểm tại các điểm PCCC chuẩn (ảnh dbfc837a)
    for (const pt of B11_PCCC_POINTS) {
      const rot = (pt.facingYawDeg * Math.PI) / 180;
      redPccc.push(createInstanceMatrix(b11ToWorld, pt.u, pt.v, 1.15, rot, 0.72, 1.05, 0.22));
      redPccc.push(createInstanceMatrix(b11ToWorld, pt.u + 0.55, pt.v, 0.36, rot, 0.2, 0.65, 0.2));
      boardsWhite.push(createInstanceMatrix(b11ToWorld, pt.u - 0.75, pt.v, 1.48, rot, 0.55, 0.42, 0.04));
    }

    // 6. Bố trí Nhà vệ sinh WC Tây Bắc & WC Đông Bắc (ảnh 660e0503)
    const wcXPositions = [-6.4, -4.8, -3.2, 123.0, 125.0, 127.0, 132.5, 134.5, 136.5];
    for (const wu of wcXPositions) {
      boardsWhite.push(createInstanceMatrix(b11ToWorld, wu, B.vNOut + 1.8, 1.05, 0, 0.06, 2.0, 2.2));
    }
    for (const vu of [-5.2, 125.0, 135.0]) {
      // Bệ lavabo đá đen & gương soi đối diện buồng vệ sinh
      blackMetal.push(createInstanceMatrix(b11ToWorld, vu, B.vNCorrIn - 1.1, 0.85, 0, 2.8, 0.16, 0.65));
      steelParts.push(createInstanceMatrix(b11ToWorld, vu, B.vNOut + 0.1, 1.45, 0, 2.6, 0.9, 0.05));
    }

    // 7. Sân trong tầng trệt (nhìn trực tiếp ở tầng 1 & nhìn từ trên lan can tầng 2–4 xuống!)
    const groundOff = -(floor - 1) * FLOOR_HEIGHT;
    const stoneBeds: Matrix4[] = [];
    const trunks: Matrix4[] = [];
    const leaves: Matrix4[] = [];
    const lilies: Matrix4[] = [];

    for (const bed of B11_TREE_BEDS) {
      const cu = (bed.minU + bed.maxU) * 0.5;
      const cv = (bed.minV + bed.maxV) * 0.5;
      const lenU = bed.maxU - bed.minU;
      const lenV = bed.maxV - bed.minV;

      stoneBeds.push(createInstanceMatrix(b11ToWorld, cu, cv, groundOff + 0.25, 0, lenU, 0.5, lenV));
      for (const du of [-2.3, 2.3]) {
        const tu = cu + du;
        // Gốc cây cắm vào bồn đá tầng trệt (groundOff + 0.45 m), thân cao 11.8 m vươn ngọn lên ngang tầng 4
        trunks.push(createInstanceMatrix(b11ToWorld, tu, cv, groundOff + 6.35, 0, 0.28, 11.8, 0.28));
        leaves.push(createInstanceMatrix(b11ToWorld, tu, cv, groundOff + 12.6, 0, 2.9, 2.0, 2.9));
        leaves.push(createInstanceMatrix(b11ToWorld, tu, cv, groundOff + 14.0, 0, 2.0, 1.5, 2.0));
        lilies.push(createInstanceMatrix(b11ToWorld, tu + 0.85, cv - 0.5, groundOff + 0.68, 0.4, 0.28, 0.28, 0.28));

        const [wx, wz] = b11ToWorld(tu, cv);
        const legOffsets: readonly [number, number][] = [
          [-0.85, -0.85],
          [0.85, -0.85],
          [-0.85, 0.85],
          [0.85, 0.85],
        ];
        for (const [lu, lv] of legOffsets) {
          const [bx, bz] = b11ToWorld(tu + lu, cv + lv);
          steelParts.push(makeTiltedBoxMatrix([bx, groundOff + 0.52, bz], [wx, groundOff + 2.8, wz], 0.032));
        }
      }
    }
    // Ghế đá hàng cột sân trong
    for (const bu of [13.5, 21.0, 29.5, 38.0, 46.5, 76.0, 84.5, 93.0, 101.5]) {
      stoneBeds.push(createInstanceMatrix(b11ToWorld, bu, B.vCyN + 0.35, groundOff + 0.42, 0, 2.6, 0.14, 0.55));
      stoneBeds.push(createInstanceMatrix(b11ToWorld, bu, B.vCyS - 0.35, groundOff + 0.42, 0, 2.6, 0.14, 0.55));
    }

    // 8. Nội thất đặc trưng từng phòng theo TẦNG
    if (floor === 1) {
      // 108.B11 & 104.B11: Bàn thí nghiệm Công nghệ 4.0 / Robotics
      for (const tu of [14, 24, 34, 46, 74, 84, 96]) {
        for (const tv of [-144.2, -140.0]) {
          desksWood.push(createInstanceMatrix(b11ToWorld, tu, tv, 0.38, 0, 4.6, 0.76, 1.1));
          chairsSlate.push(createInstanceMatrix(b11ToWorld, tu - 1.2, tv + 0.9, 0.4, 0, 0.45, 0.8, 0.45));
          chairsSlate.push(createInstanceMatrix(b11ToWorld, tu + 1.2, tv + 0.9, 0.4, 0, 0.45, 0.8, 0.45));
        }
      }
      // 103.B11 & 101.B11: Xưởng Công ty Khởi nghiệp DatBike (bàn kỹ thuật + khung xe điện mẫu)
      for (const du of [15, 25, 37, 48, 68, 80, 94, 108]) {
        blackMetal.push(createInstanceMatrix(b11ToWorld, du, -112.5, 0.4, 0, 3.8, 0.8, 1.2));
        bikeAccent.push(createInstanceMatrix(b11ToWorld, du + 0.5, -108.5, 0.55, 0.25, 1.75, 0.95, 0.55));
        chairsSlate.push(createInstanceMatrix(b11ToWorld, du - 0.8, -113.6, 0.4, 0, 0.45, 0.8, 0.45));
      }
    } else if (floor === 2) {
      // 204.B11 FabLab & 202.B11 Thực hành Bắc
      for (const tu of [14, 24, 35, 47, 70, 82, 95, 106]) {
        for (const tv of [-144.0, -139.8]) {
          desksWood.push(createInstanceMatrix(b11ToWorld, tu, tv, 0.38, 0, 4.5, 0.76, 1.1));
          chairsSlate.push(createInstanceMatrix(b11ToWorld, tu, tv + 0.9, 0.4, 0, 0.5, 0.8, 0.5));
        }
      }
      // 217..201.B11 Cánh Nam (bộ thực hành Điện / PLC / Chiếu sáng)
      for (let u = 13; u <= 116; u += 9.5) {
        if (Math.abs(u - 58.4) < 3.6) continue;
        desksWood.push(createInstanceMatrix(b11ToWorld, u, -111.5, 0.38, 0, 4.2, 0.76, 0.95));
        blackMetal.push(createInstanceMatrix(b11ToWorld, u, -107.2, 0.65, 0, 3.4, 1.3, 0.7));
        boardsWhite.push(createInstanceMatrix(b11ToWorld, u, B.vSOut - 0.15, 1.65, 0, 3.2, 1.15, 0.08));
      }
    } else if (floor === 3) {
      // Cánh Bắc 324..302
      for (let u = 12; u <= 112; u += 8.6) {
        if (Math.abs(u - 58.4) < 3.4) continue;
        desksWood.push(createInstanceMatrix(b11ToWorld, u, -143.5, 0.38, 0, 3.6, 0.76, 0.85));
        desksWood.push(createInstanceMatrix(b11ToWorld, u, -140.5, 0.38, 0, 3.6, 0.76, 0.85));
        chairsSlate.push(createInstanceMatrix(b11ToWorld, u - 0.8, -139.7, 0.4, 0, 0.46, 0.8, 0.46));
        chairsSlate.push(createInstanceMatrix(b11ToWorld, u + 0.8, -139.7, 0.4, 0, 0.46, 0.8, 0.46));
        boardsWhite.push(createInstanceMatrix(b11ToWorld, u, B.vNOut + 0.15, 1.65, 0, 2.8, 1.1, 0.08));
      }
      // Cánh Nam: 307.B11 Skill Lab Điều dưỡng (giường bệnh thực hành trắng) + 305..301
      for (const bedU of [42.0, 46.5, 51.0]) {
        clinicalWhite.push(createInstanceMatrix(b11ToWorld, bedU, -110.5, 0.42, Math.PI / 2, 2.1, 0.68, 1.0));
        clinicalWhite.push(createInstanceMatrix(b11ToWorld, bedU, -106.5, 0.42, Math.PI / 2, 2.1, 0.68, 1.0));
      }
      for (const u of [15, 31, 66, 76, 86, 96, 106, 116]) {
        desksWood.push(createInstanceMatrix(b11ToWorld, u, -111.5, 0.38, 0, 4.0, 0.76, 0.85));
        chairsSlate.push(createInstanceMatrix(b11ToWorld, u, -110.6, 0.4, 0, 0.46, 0.8, 0.46));
      }
    } else if (floor === 4) {
      // Phòng 410.B11 — CLB Bóng bàn (a4045894): 2 bàn bóng bàn xanh nhìn rõ qua vách kính + bảng hiệu vàng 410
      const ppCenterU = (B11_PINGPONG_BOUNDS.minU + B11_PINGPONG_BOUNDS.maxU) * 0.5;
      for (const tv of [-144.2, -139.8]) {
        pingPongGreen.push(createInstanceMatrix(b11ToWorld, ppCenterU, tv, 0.76, 0, 2.74, 0.06, 1.52));
        boardsWhite.push(createInstanceMatrix(b11ToWorld, ppCenterU, tv + 0.02, 0.84, Math.PI / 2, 0.04, 0.15, 1.56));
        blackMetal.push(createInstanceMatrix(b11ToWorld, ppCenterU - 0.9, tv, 0.38, 0, 0.1, 0.74, 1.1));
        blackMetal.push(createInstanceMatrix(b11ToWorld, ppCenterU + 0.9, tv, 0.38, 0, 0.1, 0.74, 1.1));
      }
      signYellow.push(createInstanceMatrix(b11ToWorld, B11_PINGPONG_BOUNDS.minU + 0.8, B.vNCorrIn + 0.14, 1.95, 0, 0.45, 0.35, 0.05));

      // Các phòng VP Khoa 416/414 & Phòng máy CNTT 408..402 + cánh Nam 415..401
      for (let u = 12; u <= 112; u += 8.6) {
        if (Math.abs(u - 58.4) < 3.4) continue;
        if (u >= B11_PINGPONG_BOUNDS.minU && u <= B11_PINGPONG_BOUNDS.maxU) continue;
        desksWood.push(createInstanceMatrix(b11ToWorld, u, -143.2, 0.38, 0, 3.8, 0.76, 0.85));
        blackMetal.push(createInstanceMatrix(b11ToWorld, u - 0.9, -143.2, 0.95, 0, 0.6, 0.42, 0.08));
        blackMetal.push(createInstanceMatrix(b11ToWorld, u + 0.9, -143.2, 0.95, 0, 0.6, 0.42, 0.08));
        chairsSlate.push(createInstanceMatrix(b11ToWorld, u, -142.2, 0.4, 0, 0.46, 0.8, 0.46));
      }
      for (const u of [18, 28, 42, 50, 66, 76, 86, 96, 106, 116]) {
        desksWood.push(createInstanceMatrix(b11ToWorld, u, -110.5, 0.38, 0, 4.4, 0.76, 0.95));
        chairsSlate.push(createInstanceMatrix(b11ToWorld, u - 1.1, -109.5, 0.4, 0, 0.46, 0.8, 0.46));
        chairsSlate.push(createInstanceMatrix(b11ToWorld, u + 1.1, -109.5, 0.4, 0, 0.46, 0.8, 0.46));
        boardsWhite.push(createInstanceMatrix(b11ToWorld, u, B.vSOut - 0.15, 1.65, 0, 3.0, 1.1, 0.08));
      }
    }

    return {
      creamColumns,
      ceilingBeams,
      whiteLouvers,
      blueEdgeTrim,
      steelParts,
      darkGranite,
      desksWood,
      blackMetal,
      chairsSlate,
      boardsWhite,
      redPccc,
      greenExit,
      warmLights,
      glassMullions,
      pingPongGreen,
      bikeAccent,
      clinicalWhite,
      signYellow,
      stoneBeds,
      trunks,
      leaves,
      lilies,
    };
  }, [floor, showUpperFloors]);

  return (
    <group key={floor}>
      <InstancedBatch batchKey="col" matrices={data.creamColumns} geometry={sharedGeos.box} color="#d6cec2" roughness={0.78} />
      <InstancedBatch batchKey="beam" matrices={data.ceilingBeams} geometry={sharedGeos.box} color="#e2e8f0" roughness={0.75} castShadow={false} />
      <InstancedBatch batchKey="louver" matrices={data.whiteLouvers} geometry={sharedGeos.box} color="#f8fafc" roughness={0.5} />
      <InstancedBatch batchKey="blue" matrices={data.blueEdgeTrim} geometry={sharedGeos.box} color="#0284c7" roughness={0.4} castShadow={false} />
      <InstancedBatch batchKey="steel" matrices={data.steelParts} geometry={sharedGeos.box} color="#cbd5e1" metalness={0.82} roughness={0.22} />
      <InstancedBatch batchKey="granite" matrices={data.darkGranite} geometry={sharedGeos.box} color="#475569" roughness={0.65} />
      <InstancedBatch batchKey="desk" matrices={data.desksWood} geometry={sharedGeos.box} color="#d4a373" roughness={0.58} />
      <InstancedBatch batchKey="metal" matrices={data.blackMetal} geometry={sharedGeos.box} color="#1e293b" metalness={0.4} roughness={0.45} />
      <InstancedBatch batchKey="chair" matrices={data.chairsSlate} geometry={sharedGeos.box} color="#334155" roughness={0.65} />
      <InstancedBatch batchKey="board" matrices={data.boardsWhite} geometry={sharedGeos.box} color="#f8fafc" roughness={0.22} castShadow={false} />
      <InstancedBatch batchKey="pccc" matrices={data.redPccc} geometry={sharedGeos.box} color="#dc2626" roughness={0.35} />
      <InstancedBatch
        batchKey="exit"
        matrices={data.greenExit}
        geometry={sharedGeos.box}
        color="#10b981"
        emissive="#10b981"
        emissiveIntensity={0.85}
        castShadow={false}
      />
      <InstancedBatch
        batchKey="light"
        matrices={data.warmLights}
        geometry={sharedGeos.cyl}
        color="#fef9c3"
        emissive="#fef08a"
        emissiveIntensity={1.1}
        castShadow={false}
      />
      <InstancedBatch batchKey="mullion" matrices={data.glassMullions} geometry={sharedGeos.box} color="#94a3b8" metalness={0.6} roughness={0.35} />
      <InstancedBatch batchKey="pp" matrices={data.pingPongGreen} geometry={sharedGeos.box} color="#047857" roughness={0.35} />
      <InstancedBatch batchKey="bike" matrices={data.bikeAccent} geometry={sharedGeos.box} color="#ea580c" roughness={0.4} />
      <InstancedBatch batchKey="clinical" matrices={data.clinicalWhite} geometry={sharedGeos.box} color="#e2e8f0" roughness={0.4} />
      <InstancedBatch batchKey="signY" matrices={data.signYellow} geometry={sharedGeos.box} color="#facc15" roughness={0.4} />
      <InstancedBatch batchKey="bed" matrices={data.stoneBeds} geometry={sharedGeos.box} color="#b8bcc2" roughness={0.85} />
      <InstancedBatch batchKey="trunk" matrices={data.trunks} geometry={sharedGeos.cyl} color="#6d4c3d" roughness={0.9} />
      <InstancedBatch batchKey="leaf" matrices={data.leaves} geometry={sharedGeos.cyl} color="#2f7d44" roughness={0.85} />
      <InstancedBatch batchKey="lily" matrices={data.lilies} geometry={sharedGeos.box} color="#f8fafc" roughness={0.5} />

      <B11ElevatorBooth floor={floor} />
    </group>
  );
}

/** Hộp thang máy khung đá kem be + 2 cánh inox + bảng số tầng LED (ảnh 86037173) */
function B11ElevatorBooth({ floor }: { floor: number }) {
  const [worldX, worldZ] = b11ToWorld(B11_BOUNDS.uBridgeE, B11_ELEVATOR_LOCAL[1]);
  const yaw = getLocalFacingYaw(b11ToWorld, 0);
  const ledColors = ['#38bdf8', '#34d399', '#f59e0b', '#fb7185'];
  const ledColor = ledColors[(floor - 1) % ledColors.length] ?? '#38bdf8';

  return (
    <group position={[worldX, 0, worldZ]} rotation-y={yaw}>
      {/* Khung đá marble kem be bao quanh cửa thang máy (ảnh 86037173) */}
      <mesh position={[0.04, 1.32, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.18, 2.64, 2.55]} />
        <meshStandardMaterial color="#d6c8b4" roughness={0.45} />
      </mesh>
      {/* 2 cánh cửa inox xước mở sang hai bên */}
      <mesh position={[-0.06, 1.2, -0.52]} castShadow receiveShadow>
        <boxGeometry args={[0.05, 2.34, 0.98]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.22} />
      </mesh>
      <mesh position={[-0.06, 1.2, 0.52]} castShadow receiveShadow>
        <boxGeometry args={[0.05, 2.34, 0.98]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.22} />
      </mesh>
      {/* Bảng nút gọi tầng đen bên phải */}
      <mesh position={[-0.07, 1.25, 1.15]}>
        <boxGeometry args={[0.04, 0.34, 0.14]} />
        <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Màn hình LED báo tầng phía trên */}
      <mesh position={[-0.08, 2.55, 0]}>
        <boxGeometry args={[0.05, 0.24, 0.56]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-0.11, 2.55, 0]}>
        <boxGeometry args={[0.02, 0.14, 0.34]} />
        <meshStandardMaterial color={ledColor} emissive={ledColor} emissiveIntensity={1.2} />
      </mesh>
      <pointLight position={[-0.9, 2.4, 0]} color={ledColor} intensity={0.65} distance={4.5} />
    </group>
  );
}
