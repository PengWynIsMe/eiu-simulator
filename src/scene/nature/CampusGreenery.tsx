import { useMemo } from 'react';
import { BoxGeometry, CylinderGeometry, type BufferGeometry } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Vec2 } from '../../types';
import { addBox, addCylinder } from '../kit/geometryHelpers';

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
    zebraCrossingGeo,
    fruitTreeWoodGeo,
    fruitTreeLeavesGeo,
    pomeloFruitsGeo,
    bambooStakesGeo,
    brickPathsGeo,
  } = useMemo(() => {
    const corridorVines: BufferGeometry[] = [];
    const corridorLamps: BufferGeometry[] = [];
    const roadSteels: BufferGeometry[] = [];
    const roadVines: BufferGeometry[] = [];
    const zebras: BufferGeometry[] = [];
    const fruitWoods: BufferGeometry[] = [];
    const fruitLeaves: BufferGeometry[] = [];
    const pomelos: BufferGeometry[] = [];
    const bamboos: BufferGeometry[] = [];
    const brickPaths: BufferGeometry[] = [];

    // ==========================================
    // 1. RÈM DÂY LEO BUÔNG RỦ DỌC CÁC HÀNH LANG (t017s)
    // ==========================================
    for (const corridor of ALL_CORRIDORS) {
      for (let s = 0; s < corridor.points.length - 1; s++) {
        const p1 = corridor.points[s];
        const p2 = corridor.points[s + 1];
        if (!p1 || !p2) continue;

        const dx = p2[0] - p1[0];
        const dz = p2[1] - p1[1];
        const len = Math.hypot(dx, dz);
        if (len < 1.0) continue;

        const angle = Math.atan2(dz, dx);
        const nx = -dz / len;
        const nz = dx / len;
        const halfW = corridor.width * 0.5;

        // Số dải rèm dây leo dọc đoạn hành lang (mỗi 1.2m có một dải rủ)
        const numStrands = Math.floor(len / 1.2);
        for (let i = 0; i <= numStrands; i++) {
          const t = i / Math.max(1, numStrands);
          const px = p1[0] + dx * t;
          const pz = p1[1] + dz * t;

          // Hai bên rìa mái che
          for (const side of [-1, 1]) {
            const edgeX = px + nx * (halfW * side);
            const edgeZ = pz + nz * (halfW * side);

            // Độ rủ biến thiên tự nhiên từ 0.7m đến 1.5m
            const vineDrop = 0.75 + Math.sin(i * 2.7 + side * 1.5) * 0.45;
            const topY = corridor.roofH;
            const strandW = 0.55;

            const vineBox = new BoxGeometry(strandW, vineDrop, 0.12);
            vineBox.rotateY(-angle);
            vineBox.translate(edgeX, topY - vineDrop * 0.5, edgeZ);
            corridorVines.push(vineBox);
          }

          // Đèn thả trần ở tim hành lang (mỗi 4m)
          if (i % 3 === 0) {
            const lampY = corridor.roofH - 0.35;
            const wire = new CylinderGeometry(0.015, 0.015, 0.35, 4);
            wire.translate(px, corridor.roofH - 0.175, pz);
            corridorLamps.push(wire);

            const shade = new CylinderGeometry(0.14, 0.18, 0.08, 8);
            shade.translate(px, lampY, pz);
            corridorLamps.push(shade);
          }
        }
      }
    }

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

    // Cột thép 2 bên vỉa hè
    const pLeftX = archCenterX - Math.cos(roadAngle + Math.PI / 2) * (archSpan * 0.5);
    const pLeftZ = archCenterZ - Math.sin(roadAngle + Math.PI / 2) * (archSpan * 0.5);
    const pRightX = archCenterX + Math.cos(roadAngle + Math.PI / 2) * (archSpan * 0.5);
    const pRightZ = archCenterZ + Math.sin(roadAngle + Math.PI / 2) * (archSpan * 0.5);

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

    // Mảng tán dây leo xanh phủ kín nóc giàn
    const roofVines = new BoxGeometry(archSpan + 1.6, 0.65, archDepth + 0.8);
    roofVines.rotateY(-roadAngle);
    roofVines.translate(archCenterX, archH + 0.55, archCenterZ);
    roadVines.push(roofVines);

    // Dây leo rủ xuống từ mép xà giàn qua đường (t037s)
    for (let d = -archSpan * 0.45; d <= archSpan * 0.45; d += 0.8) {
      const vx = archCenterX + Math.sin(roadAngle) * d;
      const vz = archCenterZ - Math.cos(roadAngle) * d;
      const vLen = 0.9 + Math.sin(d * 2.1) * 0.45;

      const drape1 = new BoxGeometry(0.65, vLen, 0.18);
      drape1.rotateY(-roadAngle);
      drape1.translate(vx, archH - vLen * 0.5, vz - archDepth * 0.45);
      roadVines.push(drape1);

      const drape2 = new BoxGeometry(0.65, vLen, 0.18);
      drape2.rotateY(-roadAngle);
      drape2.translate(vx, archH - vLen * 0.5, vz + archDepth * 0.45);
      roadVines.push(drape2);
    }

    // Vạch sang đường cho người đi bộ (Zebra crossing) dưới giàn vòm
    const numStripes = 8;
    for (let i = 0; i < numStripes; i++) {
      const offset = (i - (numStripes - 1) * 0.5) * 0.95;
      const zx = archCenterX + Math.sin(roadAngle) * offset;
      const zz = archCenterZ - Math.cos(roadAngle) * offset;
      const stripe = new BoxGeometry(3.6, 0.02, 0.45);
      stripe.rotateY(-roadAngle);
      stripe.translate(zx, 0.17, zz);
      zebras.push(stripe);
    }

    // ==========================================
    // 3. VƯỜN CÂY ĂN TRÁI & CỌC CHỐNG TRE (t021s, t025s, t029s, t033s)
    // ==========================================
    // Các vị trí vườn sinh thái giữa các block (sân B8–B11 và sân B4–B3)
    // (Đã bỏ 4 ô nằm trong footprint B11 khi gộp — cây chui vào thân tòa nhà.)
    const orchardPlots: readonly { cx: number; cz: number; kind: 'pomelo' | 'sapodilla' }[] = [
      { cx: 45.0, cz: -75.0, kind: 'pomelo' },
      { cx: 52.0, cz: -78.0, kind: 'sapodilla' },
      { cx: 38.0, cz: -72.0, kind: 'pomelo' },
      { cx: 48.0, cz: -142.0, kind: 'pomelo' },
      { cx: 38.0, cz: -138.0, kind: 'sapodilla' },
      { cx: 108.0, cz: -48.0, kind: 'pomelo' },
      { cx: 116.0, cz: -38.0, kind: 'sapodilla' },
    ];

    orchardPlots.forEach((p, plotIdx) => {
      // 1. Thân cây ăn trái
      const trunkH = p.kind === 'pomelo' ? 2.8 : 3.2;
      addCylinder(fruitWoods, 0.18, 0.24, trunkH, 7, p.cx, trunkH * 0.5, p.cz);

      // Cành cây phân nhánh
      addCylinder(fruitWoods, 0.08, 0.12, 1.4, 5, p.cx - 0.45, trunkH + 0.35, p.cz - 0.3, 0.4, 0.3);
      addCylinder(fruitWoods, 0.08, 0.12, 1.5, 5, p.cx + 0.45, trunkH + 0.4, p.cz + 0.25, -0.4, -0.3);

      // 2. Tán lá xum xuê
      const crownY = trunkH + 0.8;
      addBox(fruitLeaves, p.cx - 1.4, p.cx + 1.4, crownY - 0.6, crownY + 1.2, p.cz - 1.4, p.cz + 1.4);
      addBox(fruitLeaves, p.cx - 1.1, p.cx + 1.1, crownY + 0.9, crownY + 1.9, p.cz - 1.1, p.cz + 1.1);

      // 3. Cọc chống tre 3 chân (Tripod bamboo stakes) - đặc trưng vườn trường EIU
      for (let leg = 0; leg < 3; leg++) {
        const ang = (leg * 2 * Math.PI) / 3 + plotIdx;
        const stakeBaseX = p.cx + Math.cos(ang) * 0.95;
        const stakeBaseZ = p.cz + Math.sin(ang) * 0.95;
        const stakeTopX = p.cx + Math.cos(ang) * 0.25;
        const stakeTopZ = p.cz + Math.sin(ang) * 0.25;

        const slen = Math.hypot(stakeBaseX - stakeTopX, stakeBaseZ - stakeTopZ, 1.8);
        const stake = new CylinderGeometry(0.04, 0.045, slen, 5);
        stake.rotateX(0.38);
        stake.rotateY(-ang);
        stake.translate((stakeBaseX + stakeTopX) * 0.5, 0.9, (stakeBaseZ + stakeTopZ) * 0.5);
        bamboos.push(stake);
      }
      // Vòng đai thừng buộc ngang cọc ở độ cao 1.6m
      addCylinder(fruitWoods, 0.30, 0.30, 0.08, 8, p.cx, 1.6, p.cz);

      // 4. Trái cây trên cành:
      if (p.kind === 'pomelo') {
        // Quả bưởi tròn xanh trĩu cành (t029s, t033s)
        const fruitOffsets: readonly (readonly [number, number])[] = [
          [-0.65, 0.35],
          [0.72, -0.25],
          [-0.2, 0.75],
          [0.55, 0.65],
          [-0.8, -0.45],
        ];
        fruitOffsets.forEach(([fx, fz], fi) => {
          const fy = trunkH + 0.15 + (fi % 3) * 0.35;
          // Quả bưởi hình cầu tròn xanh
          addCylinder(pomelos, 0.14, 0.15, 0.28, 8, p.cx + fx, fy, p.cz + fz);
        });
      } else {
        // Quả hồng xiêm màu nâu trứng (t025s)
        const fruitOffsets: readonly (readonly [number, number])[] = [
          [-0.5, 0.4],
          [0.6, -0.3],
          [0.1, 0.65],
        ];
        fruitOffsets.forEach(([fx, fz], fi) => {
          const fy = trunkH + 0.25 + fi * 0.35;
          addCylinder(fruitWoods, 0.08, 0.10, 0.18, 6, p.cx + fx, fy, p.cz + fz);
        });
      }

      // 5. Lối đi lát gạch đỏ kết nối sân vườn (t029s)
      const pathW = 0.9;
      const pathLen = 5.2;
      addBox(brickPaths, p.cx - pathW * 0.5, p.cx + pathW * 0.5, 0.15, 0.18, p.cz + 1.2, p.cz + 1.2 + pathLen);
    });

    const safe = (arrGeos: BufferGeometry[]) => (arrGeos.length > 0 ? BufferGeometryUtils.mergeGeometries(arrGeos) : null);

    const mergedCorridorVines = safe(corridorVines);
    const mergedCorridorLamps = safe(corridorLamps);
    const mergedRoadSteels = safe(roadSteels);
    const mergedRoadVines = safe(roadVines);
    const mergedZebras = safe(zebras);
    const mergedFruitWoods = safe(fruitWoods);
    const mergedFruitLeaves = safe(fruitLeaves);
    const mergedPomelos = safe(pomelos);
    const mergedBamboos = safe(bamboos);
    const mergedBrickPaths = safe(brickPaths);

    corridorVines.forEach((g) => g.dispose());
    corridorLamps.forEach((g) => g.dispose());
    roadSteels.forEach((g) => g.dispose());
    roadVines.forEach((g) => g.dispose());
    zebras.forEach((g) => g.dispose());
    fruitWoods.forEach((g) => g.dispose());
    fruitLeaves.forEach((g) => g.dispose());
    pomelos.forEach((g) => g.dispose());
    bamboos.forEach((g) => g.dispose());
    brickPaths.forEach((g) => g.dispose());

    return {
      corridorVinesGeo: mergedCorridorVines,
      corridorLampsGeo: mergedCorridorLamps,
      roadPergolaSteelGeo: mergedRoadSteels,
      roadPergolaVinesGeo: mergedRoadVines,
      zebraCrossingGeo: mergedZebras,
      fruitTreeWoodGeo: mergedFruitWoods,
      fruitTreeLeavesGeo: mergedFruitLeaves,
      pomeloFruitsGeo: mergedPomelos,
      bambooStakesGeo: mergedBamboos,
      brickPathsGeo: mergedBrickPaths,
    };
  }, []);

  return (
    <group>
      {/* 1. Rèm dây leo rủ dọc hành lang (t017s) */}
      {corridorVinesGeo && (
        <mesh geometry={corridorVinesGeo} castShadow>
          <meshStandardMaterial color="#4d7c0f" roughness={0.88} />
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

      {/* 4. Tán & rèm dây leo vắt qua đường */}
      {roadPergolaVinesGeo && (
        <mesh geometry={roadPergolaVinesGeo} castShadow>
          <meshStandardMaterial color="#365314" roughness={0.85} />
        </mesh>
      )}

      {/* 5. Vạch ngựa vằn qua đường */}
      {zebraCrossingGeo && (
        <mesh geometry={zebraCrossingGeo} receiveShadow>
          <meshStandardMaterial color="#ffffff" roughness={0.65} />
        </mesh>
      )}

      {/* 6. Thân cây ăn trái & cành */}
      {fruitTreeWoodGeo && (
        <mesh geometry={fruitTreeWoodGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#451a03" roughness={0.9} />
        </mesh>
      )}

      {/* 7. Tán lá cây ăn trái */}
      {fruitTreeLeavesGeo && (
        <mesh geometry={fruitTreeLeavesGeo} castShadow>
          <meshStandardMaterial color="#65a30d" roughness={0.85} />
        </mesh>
      )}

      {/* 8. Quả bưởi tròn xanh trĩu cành (t029s, t033s) */}
      {pomeloFruitsGeo && (
        <mesh geometry={pomeloFruitsGeo} castShadow>
          <meshStandardMaterial color="#84cc16" roughness={0.5} />
        </mesh>
      )}

      {/* 9. Cọc chống tre 3 chân */}
      {bambooStakesGeo && (
        <mesh geometry={bambooStakesGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#d97706" roughness={0.75} />
        </mesh>
      )}

      {/* 10. Lối đi gạch đỏ sân vườn */}
      {brickPathsGeo && (
        <mesh geometry={brickPathsGeo} receiveShadow>
          <meshStandardMaterial color="#b91c1c" roughness={0.85} />
        </mesh>
      )}
    </group>
  );
}
