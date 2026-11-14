import { useMemo } from 'react';
import type { BufferGeometry } from 'three';
import { FLOOR_HEIGHT } from '../../data';
import type { Building, Vec2 } from '../../types';
import {
  addBox,
  addRotatedBox,
  computePrincipalAxis,
  createExtrudedPolygon,
  expandShapePolygon,
  safeMerge,
  signedArea2D,
  stripClosingPoint,
} from './geometryHelpers';

interface TwinWingBlockProps {
  building: Building;
  isHovered?: boolean;
  isSelected?: boolean;
}

interface BoxBounds2D {
  minU: number;
  maxU: number;
  minV: number;
  maxV: number;
}

interface AnalyzedHole extends BoxBounds2D {
  uvPts: Vec2[];
  notches: BoxBounds2D[];
}

function getBounds(pts: Vec2[]): BoxBounds2D {
  let minU = Number.POSITIVE_INFINITY;
  let maxU = Number.NEGATIVE_INFINITY;
  let minV = Number.POSITIVE_INFINITY;
  let maxV = Number.NEGATIVE_INFINITY;
  for (const [u, v] of pts) {
    if (u < minU) minU = u;
    if (u > maxU) maxU = u;
    if (v < minV) minV = v;
    if (v > maxV) maxV = v;
  }
  return { minU, maxU, minV, maxV };
}

/**
 * Nhận diện các cụm lõi nhô vào sân trong (thang máy trung tâm & tháp thang bộ Đông)
 * từ các đỉnh lùi sâu vào trong lòng lỗ giếng trời `hole`.
 */
function extractHoleNotches(pts: Vec2[], b: BoxBounds2D): BoxBounds2D[] {
  const insetPts = pts.filter(([, v]) => v > b.minV + 1.2 && v < b.maxV - 1.2);
  if (insetPts.length < 2) return [];

  const westNotchPts = insetPts.filter(([u]) => u < (b.minU + b.maxU) * 0.45);
  const eastNotchPts = insetPts.filter(([u]) => u >= (b.minU + b.maxU) * 0.45);
  const result: BoxBounds2D[] = [];

  if (westNotchPts.length >= 2) {
    const wb = getBounds(westNotchPts);
    result.push({
      minU: b.minU - 0.2,
      maxU: wb.maxU,
      minV: wb.minV,
      maxV: wb.maxV,
    });
  }
  if (eastNotchPts.length >= 2) {
    const eb = getBounds(eastNotchPts);
    result.push({
      minU: eb.minU,
      maxU: b.maxU + 0.6,
      minV: eb.minV,
      maxV: eb.maxV,
    });
  }
  return result;
}

/**
 * Tòa nhà học thuật 2 cánh song song quanh 2 giếng trời ("Twin-wing", 4 tầng = 15.2 m).
 * Dùng chung cho Block 8, Block 9, Block 10, Block 11: tự động bám chính xác polygon OSM
 * (`outer` + `holes`), dựng 4 tầng sàn cắt rỗng sân trong, hành lang mở + lan can,
 * tháp thang kính, dải cửa sổ, lam chắn nắng và mái chìa.
 */
export default function TwinWingBlock({ building, isHovered, isSelected }: TwinWingBlockProps) {
  const emissiveColor = isSelected ? '#60a5fa' : isHovered ? '#38bdf8' : '#000000';
  const emissiveIntensity = isSelected ? 0.24 : isHovered ? 0.16 : 0;

  const {
    originX,
    originZ,
    rotY,
    wallsGeo,
    slabsGeo,
    louversGeo,
    windowsGeo,
    stairGlassGeo,
    roofGeo,
    courtyardFloorGeo,
    planterGeo,
  } = useMemo(() => {
    const axis = computePrincipalAxis(building.shape.outer);
    const outerUV = stripClosingPoint(building.shape.outer).map(axis.toUV);
    const outerShape: Vec2[] = outerUV.map(([u, v]) => [u, -v]);

    const holesRaw: AnalyzedHole[] = building.shape.holes
      .map((hole) => {
        const uvPts = stripClosingPoint(hole).map(axis.toUV);
        const b = getBounds(uvPts);
        return {
          uvPts,
          ...b,
          notches: extractHoleNotches(uvPts, b),
        };
      })
      .sort((a, b) => a.minU - b.minU);

    const holesShapeExact: Vec2[][] = holesRaw.map((h) => h.uvPts.map(([u, v]) => [u, -v]));

    // Lùi cạnh Bắc / Nam của mỗi lỗ sân trong ra 2.15 m vào trong cánh nhà để tạo hành lang mở.
    const CORRIDOR_DEPTH = 2.15;
    const holesShapeRecessed: Vec2[][] = holesRaw.map((h) =>
      h.uvPts.map(([u, v]): Vec2 => {
        if (Math.abs(v - h.minV) < 0.75) {
          return [u, -(h.minV - CORRIDOR_DEPTH)];
        }
        if (Math.abs(v - h.maxV) < 0.75) {
          return [u, -(h.maxV + CORRIDOR_DEPTH)];
        }
        return [u, -v];
      })
    );

    const floors = Math.max(1, building.floors);
    const totalH = floors * FLOOR_HEIGHT;

    const wallGeos: BufferGeometry[] = [];
    const slabGeos: BufferGeometry[] = [];
    const louverGeos: BufferGeometry[] = [];
    const windowGeos: BufferGeometry[] = [];
    const stairGlassGeos: BufferGeometry[] = [];
    const roofGeos: BufferGeometry[] = [];
    const courtyardFloors: BufferGeometry[] = [];
    const planters: BufferGeometry[] = [];

    // 1. Bệ nền & 4 bản sàn phân tầng sáng màu (bám outer + giữ rỗng hoàn toàn holes)
    const slabOuter = expandShapePolygon(outerShape, 0.24);
    slabGeos.push(createExtrudedPolygon(slabOuter, holesShapeExact, 0.0, 0.26));
    for (let f = 1; f < floors; f++) {
      slabGeos.push(createExtrudedPolygon(slabOuter, holesShapeExact, f * FLOOR_HEIGHT - 0.14, 0.4));
    }
    slabGeos.push(createExtrudedPolygon(slabOuter, holesShapeExact, totalH - 0.14, 0.28));

    // 2. Mái chính nhô 0.85 m giữ rỗng 2 giếng trời + diềm hiên che hành lang trong
    const roofOuter = expandShapePolygon(outerShape, 0.85);
    roofGeos.push(createExtrudedPolygon(roofOuter, holesShapeExact, totalH + 0.14, 0.36));

    // 3. Thân tường chính từng tầng (lùi vào tạo hành lang giếng trời xung quanh)
    const wallOuterInset = expandShapePolygon(outerShape, -0.05);
    for (let f = 0; f < floors; f++) {
      const fBase = f * FLOOR_HEIGHT;
      const yMin = fBase + 0.26;
      const floorWallH = FLOOR_HEIGHT - 0.4;
      wallGeos.push(createExtrudedPolygon(wallOuterInset, holesShapeRecessed, yMin, floorWallH));
    }

    // 4. Mặt đứng NGOÀI: cửa sổ 4 tầng, trụ đứng, lam chắn nắng ngang & lam đứng đầu hồi
    const outerCCW = signedArea2D(outerUV) >= 0;
    const edgeCount = outerUV.length;
    for (let i = 0; i < edgeCount; i++) {
      const a = outerUV[i];
      const b = outerUV[(i + 1) % edgeCount];
      if (!a || !b) continue;

      const du = b[0] - a[0];
      const dv = b[1] - a[1];
      const segLen = Math.hypot(du, dv);
      if (segLen < 6.0) continue;

      const angle = Math.atan2(dv, du);
      const nu = outerCCW ? dv / segLen : -dv / segLen;
      const nv = outerCCW ? -du / segLen : du / segLen;
      const midU = (a[0] + b[0]) * 0.5;
      const midV = (a[1] + b[1]) * 0.5;
      const isLongWingFace = segLen >= 40;

      for (let f = 0; f < floors; f++) {
        const fBase = f * FLOOR_HEIGHT;
        const winY = fBase + 1.84;
        const winH = 1.64;

        if (isLongWingFace) {
          const numBays = Math.max(4, Math.round(segLen / 8.0));
          const bayStep = (segLen - 0.8) / numBays;

          for (let bay = 0; bay < numBays; bay++) {
            const tCenter = ((bay + 0.5) * bayStep + 0.4) / segLen - 0.5;
            const bu = midU + du * tCenter;
            const bv = midV + dv * tCenter;
            const winW = Math.max(2.0, bayStep - 0.55);

            addRotatedBox(windowGeos, winW, winH, 0.12, bu + nu * 0.02, winY, bv + nv * 0.02, -angle);
            addRotatedBox(
              louverGeos,
              winW + 0.15,
              0.1,
              0.5,
              bu + nu * 0.25,
              fBase + 2.76,
              bv + nv * 0.25,
              -angle
            );
          }

          // Trụ cột đứng chia nhịp dọc mặt tiền
          for (let p = 0; p <= numBays; p++) {
            const tPos = (p * bayStep + 0.4) / segLen - 0.5;
            const pu = midU + du * tPos;
            const pv = midV + dv * tPos;
            addRotatedBox(
              slabGeos,
              0.42,
              FLOOR_HEIGHT - 0.4,
              0.28,
              pu + nu * 0.05,
              fBase + 1.96,
              pv + nv * 0.05,
              -angle
            );
          }
        } else {
          // Mặt hồi / đầu cánh: 1 dải cửa sổ dài + các lam đứng trang trí
          const winW = Math.max(2.0, segLen - 2.6);
          addRotatedBox(windowGeos, winW, winH, 0.12, midU + nu * 0.02, winY, midV + nv * 0.02, -angle);
          const numFins = Math.max(2, Math.floor(winW / 3.0));
          for (let k = 1; k <= numFins; k++) {
            const t = k / (numFins + 1) - 0.5;
            const fu = midU + (du / segLen) * (t * winW);
            const fv = midV + (dv / segLen) * (t * winW);
            addRotatedBox(
              louverGeos,
              0.1,
              FLOOR_HEIGHT - 0.5,
              0.42,
              fu + nu * 0.2,
              fBase + 1.96,
              fv + nv * 0.2,
              -angle
            );
          }
        }
      }
    }

    // 5. Sân trong, hành lang mở có cột & lan can, lõi thang bộ / thang máy kính
    for (const h of holesRaw) {
      const spanStart = h.minU + 0.45;
      const spanEnd = h.maxU - 0.45;
      const spanLen = spanEnd - spanStart;
      if (spanLen < 4) continue;

      // Mái hiên giếng trời nhô che hành lang tầng 4
      addBox(roofGeos, h.minU, h.maxU, totalH + 0.14, totalH + 0.44, h.minV - 0.1, h.minV + 0.65);
      addBox(roofGeos, h.minU, h.maxU, totalH + 0.14, totalH + 0.44, h.maxV - 0.65, h.maxV + 0.1);

      for (let f = 0; f < floors; f++) {
        const fBase = f * FLOOR_HEIGHT;
        const yMin = fBase + 0.26;
        const yMax = (f + 1) * FLOOR_HEIGHT - 0.14;
        const winYMin = fBase + 1.02;
        const winYMax = fBase + 2.66;

        // Cửa sổ phòng học lùi sâu nhìn ra hành lang giếng trời
        const wallNorthV = h.minV - CORRIDOR_DEPTH;
        const wallSouthV = h.maxV + CORRIDOR_DEPTH;
        addBox(windowGeos, spanStart, spanEnd, winYMin, winYMax, wallNorthV - 0.04, wallNorthV + 0.08);
        addBox(windowGeos, spanStart, spanEnd, winYMin, winYMax, wallSouthV - 0.08, wallSouthV + 0.04);

        // Cột hành lang (~6.4 m)
        const numBays = Math.max(2, Math.round(spanLen / 6.4));
        const step = spanLen / numBays;
        for (let b = 0; b <= numBays; b++) {
          const cu = spanStart + b * step;
          addBox(slabGeos, cu - 0.18, cu + 0.18, yMin, yMax, h.minV - 0.35, h.minV);
          addBox(slabGeos, cu - 0.18, cu + 0.18, yMin, yMax, h.maxV, h.maxV + 0.35);
        }

        // Lan can hành lang mở ở Tầng 2–4
        if (f >= 1) {
          addBox(slabGeos, h.minU, h.maxU, fBase + 0.26, fBase + 0.56, h.minV - 0.2, h.minV - 0.04);
          addBox(slabGeos, h.minU, h.maxU, fBase + 0.26, fBase + 0.56, h.maxV + 0.04, h.maxV + 0.2);

          for (const railY of [fBase + 0.84, fBase + 1.16]) {
            addBox(louverGeos, h.minU, h.maxU, railY - 0.03, railY + 0.03, h.minV - 0.16, h.minV - 0.06);
            addBox(louverGeos, h.minU, h.maxU, railY - 0.03, railY + 0.03, h.maxV + 0.06, h.maxV + 0.16);
          }

          for (let pu = spanStart; pu <= spanEnd; pu += 3.2) {
            addBox(louverGeos, pu - 0.03, pu + 0.03, fBase + 0.56, fBase + 1.16, h.minV - 0.14, h.minV - 0.08);
            addBox(louverGeos, pu - 0.03, pu + 0.03, fBase + 0.56, fBase + 1.16, h.maxV + 0.08, h.maxV + 0.14);
          }
        }
      }

      // Mảng kính đứng tại các lõi thang máy / cầu thang nhô vào giếng trời + tum mái
      let floorSafeStart = h.minU;
      let floorSafeEnd = h.maxU;
      for (const n of h.notches) {
        const isWestNotch = n.minU < (h.minU + h.maxU) * 0.5;
        if (isWestNotch) {
          floorSafeStart = Math.max(floorSafeStart, n.maxU + 1.2);
        } else {
          floorSafeEnd = Math.min(floorSafeEnd, n.minU - 1.2);
        }

        const capHeight = isWestNotch ? 1.7 : 1.35;
        addBox(wallGeos, n.minU + 0.04, n.maxU - 0.04, 0.26, totalH + capHeight, n.minV + 0.04, n.maxV - 0.04);
        addBox(
          roofGeos,
          n.minU - 0.18,
          n.maxU + 0.18,
          totalH + capHeight,
          totalH + capHeight + 0.26,
          n.minV - 0.18,
          n.maxV + 0.18
        );
        // Vách kính đứng xanh-lục nhìn vào giếng trời
        const glassU1 = isWestNotch ? n.maxU - 0.06 : n.minU - 0.08;
        const glassU2 = isWestNotch ? n.maxU + 0.08 : n.minU + 0.06;
        addBox(stairGlassGeos, glassU1, glassU2, 0.55, totalH + capHeight - 0.35, n.minV + 0.55, n.maxV - 0.55);
        addBox(stairGlassGeos, n.minU + 0.65, n.maxU - 0.65, 0.55, totalH + capHeight - 0.35, n.minV - 0.06, n.minV + 0.08);
        addBox(stairGlassGeos, n.minU + 0.65, n.maxU - 0.65, 0.55, totalH + capHeight - 0.35, n.maxV - 0.08, n.maxV + 0.06);
      }

      // Mảng kính hành lang cầu nối 2 bên (Tây & Giữa) nhìn vào giếng trời
      addBox(stairGlassGeos, h.minU - 0.08, h.minU + 0.08, 0.55, totalH - 0.4, h.minV + 1.4, h.maxV - 1.4);
      if (h.notches.length === 0) {
        addBox(stairGlassGeos, h.maxU - 0.08, h.maxU + 0.08, 0.55, totalH - 0.4, h.minV + 1.4, h.maxV - 1.4);
      }

      // Lát gạch sân trong + bồn cây xanh trung tâm (tránh lõi thang máy/cầu thang)
      addBox(courtyardFloors, h.minU + 0.05, h.maxU - 0.05, 0.04, 0.14, h.minV + 0.05, h.maxV - 0.05);
      const midV = (h.minV + h.maxV) * 0.5;
      const clearSpan = floorSafeEnd - floorSafeStart;
      if (clearSpan > 14) {
        const halfClear = clearSpan * 0.45;
        const centerU = (floorSafeStart + floorSafeEnd) * 0.5;
        if (clearSpan > 34) {
          addBox(slabGeos, centerU - halfClear, centerU - 2.2, 0.14, 0.4, midV - 1.6, midV + 1.6);
          addBox(planters, centerU - halfClear + 0.3, centerU - 2.5, 0.36, 0.46, midV - 1.3, midV + 1.3);
          addBox(slabGeos, centerU + 2.2, centerU + halfClear, 0.14, 0.4, midV - 1.6, midV + 1.6);
          addBox(planters, centerU + 2.5, centerU + halfClear - 0.3, 0.36, 0.46, midV - 1.3, midV + 1.3);
        } else {
          addBox(slabGeos, centerU - halfClear * 0.7, centerU + halfClear * 0.7, 0.14, 0.4, midV - 1.5, midV + 1.5);
          addBox(planters, centerU - halfClear * 0.7 + 0.3, centerU + halfClear * 0.7 - 0.3, 0.36, 0.46, midV - 1.2, midV + 1.2);
        }
      }
    }

    // 6. Cụm thiết bị kỹ thuật trên mái cánh Bắc
    const unitStep = axis.maxU > 130 ? 4 : 3;
    for (let k = 0; k < unitStep; k++) {
      const ku = 24 + k * ((axis.maxU - 48) / Math.max(1, unitStep - 1));
      addBox(louverGeos, ku, ku + 3.0, totalH + 0.5, totalH + 1.2, 5.0, 7.8);
    }

    return {
      originX: axis.originX,
      originZ: axis.originZ,
      rotY: axis.rotY,
      wallsGeo: safeMerge(wallGeos),
      slabsGeo: safeMerge(slabGeos),
      louversGeo: safeMerge(louverGeos),
      windowsGeo: safeMerge(windowGeos),
      stairGlassGeo: safeMerge(stairGlassGeos),
      roofGeo: safeMerge(roofGeos),
      courtyardFloorGeo: safeMerge(courtyardFloors),
      planterGeo: safeMerge(planters),
    };
  }, [building]);

  return (
    <group position={[originX, 0, originZ]} rotation={[0, rotY, 0]}>
      {wallsGeo && (
        <mesh geometry={wallsGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color={building.color}
            roughness={0.82}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      )}
      {slabsGeo && (
        <mesh geometry={slabsGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color="#e5e7eb"
            roughness={0.75}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity * 0.45}
          />
        </mesh>
      )}
      {louversGeo && (
        <mesh geometry={louversGeo} receiveShadow>
          <meshStandardMaterial color="#cbd5e1" roughness={0.55} metalness={0.2} />
        </mesh>
      )}
      {windowsGeo && (
        <mesh geometry={windowsGeo}>
          <meshStandardMaterial
            color={building.id === 'b11' ? '#35536e' : '#1e293b'}
            roughness={0.22}
            metalness={0.55}
          />
        </mesh>
      )}
      {stairGlassGeo && (
        <mesh geometry={stairGlassGeo}>
          <meshStandardMaterial
            color="#2b6e7d"
            roughness={0.18}
            metalness={0.65}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity * 0.4}
          />
        </mesh>
      )}
      {roofGeo && (
        <mesh geometry={roofGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color="#8a8f96"
            roughness={0.78}
            metalness={0.1}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity * 0.4}
          />
        </mesh>
      )}
      {building.id !== 'b11' && courtyardFloorGeo && (
        <mesh geometry={courtyardFloorGeo} receiveShadow>
          <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
        </mesh>
      )}
      {building.id !== 'b11' && planterGeo && (
        <mesh geometry={planterGeo} receiveShadow>
          <meshStandardMaterial color="#4d7c0f" roughness={0.85} />
        </mesh>
      )}
    </group>
  );
}
