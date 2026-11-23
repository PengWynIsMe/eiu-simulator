import { useMemo } from 'react';
import { BoxGeometry, CylinderGeometry, BufferGeometry, Float32BufferAttribute, DoubleSide, type BufferGeometry as BufferGeometryType } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Vec2 } from '../../types';
import { addBox } from '../kit/geometryHelpers';
import { GRASS, INTERNAL } from '../groundLevels';
import { getOrCreateVineTexture, getOrCreateCanopyTexture, addVineCurtain, addPostVines, addCanopyQuad } from './vineTexture';

const ALL_CORRIDORS: readonly { readonly points: readonly Vec2[]; readonly roofH: number; readonly width: number }[] = [
  // B9 ↔ B10
  {
    points: [
      [-118.2, -124.8],
      [-115.9, -112.7],
      [-131.1, -109.8],
      [-129.5, -102.0],
    ],
    roofH: 3.0,
    width: 2.4,
  },
  // B8 ↔ B11
  {
    points: [
      [16.1, -174.2],
      [17.7, -165.1],
      [27.9, -166.4],
      [31.4, -155.7],
    ],
    roofH: 3.0,
    width: 2.4,
  },
  // B11 ↔ B10
  {
    points: [
      [-51.8, -99.5],
      [-21.0, -104.5],
    ],
    roofH: 3.45,
    width: 2.6,
  },
  // B11 ↔ B5
  {
    points: [
      [100.7, -144.6],
      [153.7, -152.1],
    ],
    roofH: 3.0,
    width: 2.4,
  },
  // B11 ↔ B4
  {
    points: [
      [43.0, -132.0],
      [92.0, -96.0],
    ],
    roofH: 3.0,
    width: 2.6,
  },
];

/**
 * CampusGreenery — Hệ thống ngoại cảnh xanh theo clip thực tế:
 * 1. Rèm dây leo buông rủ hai bên các hành lang mái che (t017s).
 * 2. Đèn thả trần hình tròn bên trong hành lang.
 * 3. Giàn vòm dây leo vắt ngang đường nội bộ kèm vạch qua đường ngựa vằn (t037s).
 * 4. Vườn cây ăn trái (cây bưởi trĩu quả tròn xanh, hồng xiêm) kèm cọc chống tre 3 chân và lối đi gạch đỏ (t021s, t025s, t029s, t033s).
 */
export default function CampusGreenery() {
  const {
    corridorVinesGeo,
    corridorLampsGeo,
    roadPergolaSteelGeo,
    roadPergolaVinesGeo,
    roadPergolaCanopyGeo,
    zebraCrossingGeo,
    brickPathsGeo,
  } = useMemo(() => {
    const corridorLamps: BufferGeometryType[] = [];
    const roadSteels: BufferGeometryType[] = [];
    const zebras: BufferGeometryType[] = [];
    const brickPaths: BufferGeometryType[] = [];

    // ==========================================
    // 1. RÈM DÂY LEO BUÔNG RỦ DỌC CÁC HÀNH LANG (t017s) — Dải quad mỏng, texture alpha lá rủ mềm
    // ==========================================
    const cvPos: number[] = [];
    const cvNorm: number[] = [];
    const cvUvs: number[] = [];
    const cvInd: number[] = [];

    for (const corridor of ALL_CORRIDORS) {
      for (let s = 0; s < corridor.points.length - 1; s++) {
        const p1 = corridor.points[s];
        const p2 = corridor.points[s + 1];
        if (!p1 || !p2) continue;

        const dx = p2[0] - p1[0];
        const dz = p2[1] - p1[1];
        const len = Math.hypot(dx, dz);
        if (len < 0.5) continue;

        const nx = -dz / len;
        const nz = dx / len;
        const halfW = corridor.width * 0.5;

        // Số tấm rèm dọc mép hành lang (~1.0m mỗi tấm)
        const numPanels = Math.max(1, Math.round(len / 1.0));
        for (let i = 0; i < numPanels; i++) {
          const t0 = i / numPanels;
          const t1 = (i + 1) / numPanels;
          const midT = (t0 + t1) * 0.5;
          const midPx = p1[0] + dx * midT;
          const midPz = p1[1] + dz * midT;

          // Hai bên mép hành lang mái che (t017s)
          for (const side of [-1, 1]) {
            const pa: [number, number] = [
              p1[0] + dx * t0 + nx * (halfW * side),
              p1[1] + dz * t0 + nz * (halfW * side),
            ];
            const pb: [number, number] = [
              p1[0] + dx * t1 + nx * (halfW * side),
              p1[1] + dz * t1 + nz * (halfW * side),
            ];

            // Rèm buông rủ tha thướt tự nhiên từ 1.0m tới 1.9m (ngang tầm mắt người đi bộ theo t017s)
            const drop1 = 1.45 + Math.sin(i * 1.8 + side * 1.3) * 0.45;
            addVineCurtain(cvPos, cvNorm, cvUvs, cvInd, pa, pb, corridor.roofH, drop1, nx * side, nz * side, 0);

            // Dải rèm so le thứ hai lệch nhẹ 6cm vào trong để tạo độ dày 3D rực rỡ
            const drop2 = 1.25 + Math.cos(i * 1.5 + side * 0.7) * 0.35;
            addVineCurtain(cvPos, cvNorm, cvUvs, cvInd, pa, pb, corridor.roofH, drop2, nx * side, nz * side, -0.06);

            // Dây leo quấn bám dọc thân cột thép tại mỗi nhịp
            if (i % 4 === 0) {
              addPostVines(cvPos, cvNorm, cvUvs, cvInd, [pa[0], pa[1]], corridor.roofH, 0.45, 0.12);
            }
          }

          // Đèn thả trần ở tim hành lang (mỗi ~3.5m)
          if (i % 3 === 0) {
            const lampY = corridor.roofH - 0.35;
            const wire = new CylinderGeometry(0.015, 0.015, 0.35, 4);
            wire.translate(midPx, corridor.roofH - 0.175, midPz);
            corridorLamps.push(wire);

            const shade = new CylinderGeometry(0.14, 0.18, 0.08, 8);
            shade.translate(midPx, lampY, midPz);
            corridorLamps.push(shade);
          }
        }
      }
    }

    const corridorVinesGeo = new BufferGeometry();
    corridorVinesGeo.setAttribute('position', new Float32BufferAttribute(cvPos, 3));
    corridorVinesGeo.setAttribute('normal', new Float32BufferAttribute(cvNorm, 3));
    corridorVinesGeo.setAttribute('uv', new Float32BufferAttribute(cvUvs, 2));
    corridorVinesGeo.setIndex(cvInd);

    // ==========================================
    // 2. GIÀN VÒM DÂY LEO VẮT NGANG ĐƯỜNG NỘI BỘ (t037s)
    // ==========================================
    // Vị trí trục đường giữa B10 và B11 (x = -36.4, z = -102.0)
    const archCenterX = -36.4;
    const archCenterZ = -102.0;
    const archSpan = 9.4; // bắc ngang đường rộng ~8m
    const archH = 4.8;
    const archDepth = 4.5;
    const roadAngle = Math.atan2(-5.0, 30.8); // hướng tim đường

    const cosR = Math.cos(roadAngle);
    const sinR = Math.sin(roadAngle);
    // Vector dọc trục giàn ngang đường (vuông góc với tim đường)
    const spanDirX = Math.cos(roadAngle + Math.PI / 2);
    const spanDirZ = Math.sin(roadAngle + Math.PI / 2);

    // Cột thép 2 bên vỉa hè
    const pLeftX = archCenterX - spanDirX * (archSpan * 0.5);
    const pLeftZ = archCenterZ - spanDirZ * (archSpan * 0.5);
    const pRightX = archCenterX + spanDirX * (archSpan * 0.5);
    const pRightZ = archCenterZ + spanDirZ * (archSpan * 0.5);

    const archCols: readonly (readonly [number, number])[] = [
      [pLeftX - 1.2, pLeftZ],
      [pLeftX + 1.2, pLeftZ],
      [pRightX - 1.2, pRightZ],
      [pRightX + 1.2, pRightZ],
    ];
    for (const [colX, colZ] of archCols) {
      const col = new BoxGeometry(0.25, archH, 0.25);
      col.translate(colX, archH * 0.5, colZ);
      roadSteels.push(col);
    }

    // Xà ngang đỉnh giàn thép
    const topTruss = new BoxGeometry(archSpan + 1.2, 0.35, archDepth);
    topTruss.rotateY(-roadAngle);
    topTruss.translate(archCenterX, archH + 0.15, archCenterZ);
    roadSteels.push(topTruss);

    // Tán lá xanh & rèm buông rủ qua đường (t037s)
    const rvPos: number[] = [];
    const rvNorm: number[] = [];
    const rvUvs: number[] = [];
    const rvInd: number[] = [];

    const canPos: number[] = [];
    const canNorm: number[] = [];
    const canUvs: number[] = [];
    const canInd: number[] = [];

    // 4 góc của nóc giàn pergola
    const halfD = archDepth * 0.5;
    const fLeft: [number, number] = [pLeftX - cosR * halfD, pLeftZ - sinR * halfD];
    const fRight: [number, number] = [pRightX - cosR * halfD, pRightZ - sinR * halfD];
    const bRight: [number, number] = [pRightX + cosR * halfD, pRightZ + sinR * halfD];
    const bLeft: [number, number] = [pLeftX + cosR * halfD, pLeftZ + sinR * halfD];

    // Mặt phẳng tán lá che phủ nóc giàn (2 lớp đan xen)
    addCanopyQuad(canPos, canNorm, canUvs, canInd, [fLeft, fRight, bRight, bLeft], archH + 0.22);
    addCanopyQuad(canPos, canNorm, canUvs, canInd, [fLeft, fRight, bRight, bLeft], archH + 0.38);

    // Rèm dây leo rủ buông từ xà trước & xà sau bắc ngang qua đường (t037s)
    const numDrapes = 12;
    for (let k = 0; k < numDrapes; k++) {
      const u0 = k / numDrapes;
      const u1 = (k + 1) / numDrapes;

      // Xà trước
      const fa: [number, number] = [fLeft[0] + (fRight[0] - fLeft[0]) * u0, fLeft[1] + (fRight[1] - fLeft[1]) * u0];
      const fb: [number, number] = [fLeft[0] + (fRight[0] - fLeft[0]) * u1, fLeft[1] + (fRight[1] - fLeft[1]) * u1];
      const dropF = 1.1 + Math.sin(k * 2.1) * 0.55 + Math.cos(k * 1.3) * 0.35;
      addVineCurtain(rvPos, rvNorm, rvUvs, rvInd, fa, fb, archH + 0.2, dropF, -cosR, -sinR, 0);

      // Xà sau
      const ba: [number, number] = [bRight[0] + (bLeft[0] - bRight[0]) * u0, bRight[1] + (bLeft[1] - bRight[1]) * u0];
      const bb: [number, number] = [bRight[0] + (bLeft[0] - bRight[0]) * u1, bRight[1] + (bLeft[1] - bRight[1]) * u1];
      const dropB = 1.1 + Math.cos(k * 2.1) * 0.55 + Math.sin(k * 1.3) * 0.35;
      addVineCurtain(rvPos, rvNorm, rvUvs, rvInd, ba, bb, archH + 0.2, dropB, cosR, sinR, 0);
    }

    // Hai bên sườn giàn
    addVineCurtain(rvPos, rvNorm, rvUvs, rvInd, fLeft, bLeft, archH + 0.2, 1.4, -spanDirX, -spanDirZ, 0);
    addVineCurtain(rvPos, rvNorm, rvUvs, rvInd, bRight, fRight, archH + 0.2, 1.4, spanDirX, spanDirZ, 0);

    const roadPergolaVinesGeo = new BufferGeometry();
    roadPergolaVinesGeo.setAttribute('position', new Float32BufferAttribute(rvPos, 3));
    roadPergolaVinesGeo.setAttribute('normal', new Float32BufferAttribute(rvNorm, 3));
    roadPergolaVinesGeo.setAttribute('uv', new Float32BufferAttribute(rvUvs, 2));
    roadPergolaVinesGeo.setIndex(rvInd);

    const roadPergolaCanopyGeo = new BufferGeometry();
    roadPergolaCanopyGeo.setAttribute('position', new Float32BufferAttribute(canPos, 3));
    roadPergolaCanopyGeo.setAttribute('normal', new Float32BufferAttribute(canNorm, 3));
    roadPergolaCanopyGeo.setAttribute('uv', new Float32BufferAttribute(canUvs, 2));
    roadPergolaCanopyGeo.setIndex(canInd);

    // Vạch sang đường cho người đi bộ (Zebra crossing) dưới giàn vòm
    const numStripes = 8;
    for (let i = 0; i < numStripes; i++) {
      const offset = (i - (numStripes - 1) * 0.5) * 0.95;
      const zx = archCenterX + Math.sin(roadAngle) * offset;
      const zz = archCenterZ - Math.cos(roadAngle) * offset;
      const stripe = new BoxGeometry(3.6, 0.01, 0.45);
      stripe.rotateY(-roadAngle);
      stripe.translate(zx, INTERNAL + 0.005, zz);
      zebras.push(stripe);
    }

    // ==========================================
    // 3. LỐI ĐI GẠCH ĐỎ SÂN VƯỜN SINH THÁI (t029s)
    // (Cây xanh trong vườn được chuyển sang hệ thống cây chung trong Trees.tsx)
    // ==========================================
    const orchardPlots: readonly { cx: number; cz: number }[] = [
      { cx: 45.0, cz: -75.0 },
      { cx: 52.0, cz: -78.0 },
      { cx: 38.0, cz: -72.0 },
      { cx: 48.0, cz: -142.0 },
      { cx: 38.0, cz: -138.0 },
      { cx: 108.0, cz: -48.0 },
      { cx: 116.0, cz: -38.0 },
    ];

    orchardPlots.forEach((p) => {
      // Lối đi lát gạch đỏ kết nối sân vườn (t029s)
      const pathW = 0.9;
      const pathLen = 5.2;
      addBox(brickPaths, p.cx - pathW * 0.5, p.cx + pathW * 0.5, GRASS, GRASS + 0.02, p.cz + 1.2, p.cz + 1.2 + pathLen);
    });

    const safe = (arrGeos: BufferGeometry[]) => (arrGeos.length > 0 ? BufferGeometryUtils.mergeGeometries(arrGeos) : null);

    const mergedCorridorLamps = safe(corridorLamps);
    const mergedRoadSteels = safe(roadSteels);
    const mergedZebras = safe(zebras);
    const mergedBrickPaths = safe(brickPaths);

    corridorLamps.forEach((g) => g.dispose());
    roadSteels.forEach((g) => g.dispose());
    zebras.forEach((g) => g.dispose());
    brickPaths.forEach((g) => g.dispose());

    return {
      corridorVinesGeo,
      corridorLampsGeo: mergedCorridorLamps,
      roadPergolaSteelGeo: mergedRoadSteels,
      roadPergolaVinesGeo,
      roadPergolaCanopyGeo,
      zebraCrossingGeo: mergedZebras,
      brickPathsGeo: mergedBrickPaths,
    };
  }, []);

  const vineTexture = useMemo(() => getOrCreateVineTexture(), []);
  const canopyTexture = useMemo(() => getOrCreateCanopyTexture(), []);

  return (
    <group>
      {/* 1. Rèm dây leo rủ dọc hành lang (t017s, walk-eiu/00) */}
      {corridorVinesGeo && (
        <mesh geometry={corridorVinesGeo} castShadow>
          <meshStandardMaterial
            map={vineTexture ?? undefined}
            transparent
            alphaTest={0.15}
            depthWrite
            side={DoubleSide}
            roughness={0.65}
            color="#ffffff"
            emissive="#84cc16"
            emissiveIntensity={0.06}
          />
        </mesh>
      )}

      {/* 2. Đèn thả trần hành lang */}
      {corridorLampsGeo && (
        <mesh geometry={corridorLampsGeo}>
          <meshStandardMaterial color="#f1f5f9" emissive="#fef08a" emissiveIntensity={0.4} roughness={0.3} />
        </mesh>
      )}

      {/* 3. Khung thép giàn vòm qua đường (t037s) */}
      {roadPergolaSteelGeo && (
        <mesh geometry={roadPergolaSteelGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
      )}

      {/* 4. Rèm dây leo rủ buông vắt ngang đường (t037s) */}
      {roadPergolaVinesGeo && (
        <mesh geometry={roadPergolaVinesGeo} castShadow>
          <meshStandardMaterial
            map={vineTexture ?? undefined}
            transparent
            alphaTest={0.15}
            depthWrite
            side={DoubleSide}
            roughness={0.65}
            color="#ffffff"
            emissive="#84cc16"
            emissiveIntensity={0.06}
          />
        </mesh>
      )}

      {/* 4b. Mảng tán lá đan xen phủ trên nóc giàn vòm */}
      {roadPergolaCanopyGeo && (
        <mesh geometry={roadPergolaCanopyGeo} castShadow receiveShadow>
          <meshStandardMaterial
            map={canopyTexture ?? undefined}
            transparent
            alphaTest={0.18}
            depthWrite
            side={DoubleSide}
            roughness={0.65}
            color="#ffffff"
            emissive="#84cc16"
            emissiveIntensity={0.05}
          />
        </mesh>
      )}

      {/* 5. Vạch ngựa vằn qua đường */}
      {zebraCrossingGeo && (
        <mesh geometry={zebraCrossingGeo} receiveShadow>
          <meshStandardMaterial color="#ffffff" roughness={0.65} />
        </mesh>
      )}

      {/* 6. Lối đi gạch đỏ sân vườn (t029s) */}
      {brickPathsGeo && (
        <mesh geometry={brickPathsGeo} receiveShadow>
          <meshStandardMaterial color="#b91c1c" roughness={0.85} />
        </mesh>
      )}
    </group>
  );
}
