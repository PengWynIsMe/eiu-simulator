import { useMemo } from 'react';
import type { BufferGeometry } from 'three';
import { FLOOR_HEIGHT } from '../../data';
import type { Building, Vec2 } from '../../types';
import {
  addBox,
  computePrincipalAxis,
  createExtrudedPolygon,
  expandShapePolygon,
  safeMerge,
  stripClosingPoint,
} from '../kit/geometryHelpers';

interface BuildingSubProps {
  building: Building;
  isHovered?: boolean;
  isSelected?: boolean;
}

/**
 * Block 6 — Vườn ươm Doanh nghiệp Becamex (BBI, 2 tầng = 7.6 m).
 * Mô phỏng sảnh trung tâm vách kính thông thoáng nối với hành lang B3–B6 ở phía Bắc,
 * mảng tường xanh điểm nhấn nội thất, 2 tầng phân tách rõ + cửa sổ dải ngang & mái che giếng sáng.
 */
export function Block6BBI({ building, isHovered, isSelected }: BuildingSubProps) {
  const emissiveColor = isSelected ? '#60a5fa' : isHovered ? '#38bdf8' : '#000000';
  const emissiveIntensity = isSelected ? 0.25 : isHovered ? 0.16 : 0;

  const {
    originX,
    originZ,
    rotY,
    wallsGeo,
    slabsGeo,
    glassGeo,
    accentGeo,
    louversGeo,
    roofGeo,
  } = useMemo(() => {
    const outerPts = stripClosingPoint(building.shape.outer);
    const p0 = outerPts[0] ?? ([173.8, 77.5] as Vec2);
    const pEastNorth = outerPts[3] ?? ([207.9, 73.8] as Vec2);

    const dx = pEastNorth[0] - p0[0];
    const dz = pEastNorth[1] - p0[1];
    const len = Math.hypot(dx, dz) || 1;
    const ux = dx / len;
    const uz = dz / len;
    const vx = -uz;
    const vz = ux;
    const groupRotY = Math.atan2(-uz, ux);

    const toUV = ([x, z]: Vec2): Vec2 => [
      (x - p0[0]) * ux + (z - p0[1]) * uz,
      (x - p0[0]) * vx + (z - p0[1]) * vz,
    ];
    const outerUV = outerPts.map(toUV);
    const outerShape: Vec2[] = outerUV.map(([u, v]) => [u, -v]);

    let maxU = 34.3;
    let maxV = 47.7;
    for (const [u, v] of outerUV) {
      if (u > maxU) maxU = u;
      if (v > maxV) maxV = v;
    }

    const totalH = Math.max(2, building.floors) * FLOOR_HEIGHT; // 7.6 m

    const wallGeos: BufferGeometry[] = [];
    const slabGeos: BufferGeometry[] = [];
    const glassGeos: BufferGeometry[] = [];
    const accentGeos: BufferGeometry[] = [];
    const louverGeos: BufferGeometry[] = [];
    const roofGeos: BufferGeometry[] = [];

    // 1. Bệ nền, sàn tầng 2 & diềm mái
    const slabShape = expandShapePolygon(outerShape, 0.25);
    slabGeos.push(createExtrudedPolygon(slabShape, [], 0.0, 0.26));
    // Tầng 2 mở khoảng sảnh thông tầng giữa cánh (u = 10.5..18.5)
    addBox(slabGeos, 0, maxU, FLOOR_HEIGHT - 0.14, FLOOR_HEIGHT + 0.24, -0.22, maxV + 0.22);
    slabGeos.push(createExtrudedPolygon(slabShape, [], totalH - 0.14, 0.24));

    // 2. Thân công trình: Tầng 1 chừa lõi sảnh kính trung tâm thẳng trục hành lang B3–B6 (u = 9.8..18.0)
    // Cánh Tây (Hội trường đa năng P.102)
    addBox(wallGeos, 0.1, 9.8, 0.26, FLOOR_HEIGHT - 0.14, 0.1, maxV - 0.1);
    // Cánh Đông (Văn phòng ươm tạo P.100–P.109 & 100.B6 An ninh mạng)
    addBox(wallGeos, 18.0, maxU - 0.1, 0.26, FLOOR_HEIGHT - 0.14, 0.1, maxV - 0.1);
    // Tường điểm nhấn xanh dương BBI bên trong sảnh chính (quan sát thấy trong tour 360)
    addBox(accentGeos, 11.2, 16.8, 0.26, FLOOR_HEIGHT + 1.2, maxV * 0.42, maxV * 0.56);
    // Cầu thang dốc kiến trúc chéo giữa sảnh BBI
    addBox(slabGeos, 13.0, 15.2, 0.26, FLOOR_HEIGHT, maxV * 0.25, maxV * 0.36);

    // Mặt kính thông thoáng ở cả đầu Bắc (tiếp nối hành lang B3–B6) & Nam của sảnh BBI
    addBox(glassGeos, 9.8, 18.0, 0.26, FLOOR_HEIGHT + 0.1, 0.06, 0.35);
    addBox(glassGeos, 9.8, 18.0, 0.26, FLOOR_HEIGHT + 0.1, maxV - 0.35, maxV - 0.06);

    // Tầng 2: Toàn khối (Phòng 206 Đoàn TN – Hội SV & không gian làm việc chung)
    addBox(wallGeos, 0.1, maxU - 0.1, FLOOR_HEIGHT + 0.24, totalH - 0.14, 0.1, maxV - 0.1);

    // 3. Cửa sổ 2 tầng & lam chắn nắng 4 mặt
    for (let f = 0; f < 2; f++) {
      const fBase = f * FLOOR_HEIGHT;
      const winMinY = fBase + 0.95;
      const winMaxY = fBase + 2.75;

      // Mặt Bắc & Nam
      if (f === 1) {
        addBox(glassGeos, 1.5, maxU - 1.5, winMinY, winMaxY, 0.0, 0.15);
        addBox(glassGeos, 1.5, maxU - 1.5, winMinY, winMaxY, maxV - 0.15, maxV);
      } else {
        addBox(glassGeos, 1.4, 9.0, winMinY, winMaxY, 0.0, 0.15);
        addBox(glassGeos, 18.8, maxU - 1.4, winMinY, winMaxY, 0.0, 0.15);
        addBox(glassGeos, 1.4, 9.0, winMinY, winMaxY, maxV - 0.15, maxV);
        addBox(glassGeos, 18.8, maxU - 1.4, winMinY, winMaxY, maxV - 0.15, maxV);
      }

      // Mặt Tây & Đông
      addBox(glassGeos, 0.0, 0.15, winMinY, winMaxY, 2.5, maxV - 2.5);
      addBox(glassGeos, maxU - 0.15, maxU, winMinY, winMaxY, 2.5, maxV - 2.5);

      // Lam ngang + lam đứng mặt Tây/Đông
      addBox(louverGeos, 1.2, maxU - 1.2, winMaxY + 0.05, winMaxY + 0.16, -0.45, 0.05);
      addBox(louverGeos, 1.2, maxU - 1.2, winMaxY + 0.05, winMaxY + 0.16, maxV - 0.05, maxV + 0.45);
      for (let vFin = 4.0; vFin <= maxV - 4.0; vFin += 4.2) {
        addBox(louverGeos, -0.35, 0.04, fBase + 0.4, fBase + 3.4, vFin - 0.06, vFin + 0.06);
        addBox(louverGeos, maxU - 0.04, maxU + 0.35, fBase + 0.4, fBase + 3.4, vFin - 0.06, vFin + 0.06);
      }
    }

    // Mái đón lối vào phía Bắc (khớp hành lang nối B3–B6)
    addBox(louverGeos, 9.4, 18.4, FLOOR_HEIGHT - 0.35, FLOOR_HEIGHT - 0.1, -1.6, 0.15);

    // 4. Mái chìa + tum giếng sáng trung tâm trên nóc
    const roofShape = expandShapePolygon(outerShape, 0.9);
    roofGeos.push(createExtrudedPolygon(roofShape, [], totalH + 0.1, 0.38));
    addBox(roofGeos, 10.2, 17.6, totalH + 0.48, totalH + 1.05, 4.0, maxV - 4.0);
    addBox(glassGeos, 10.6, 17.2, totalH + 0.95, totalH + 1.12, 4.4, maxV - 4.4);

    return {
      originX: p0[0],
      originZ: p0[1],
      rotY: groupRotY,
      wallsGeo: safeMerge(wallGeos),
      slabsGeo: safeMerge(slabGeos),
      glassGeo: safeMerge(glassGeos),
      accentGeo: safeMerge(accentGeos),
      louversGeo: safeMerge(louverGeos),
      roofGeo: safeMerge(roofGeos),
    };
  }, [building]);

  return (
    <group position={[originX, 0, originZ]} rotation={[0, rotY, 0]}>
      {wallsGeo && (
        <mesh geometry={wallsGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color={building.color}
            roughness={0.8}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      )}
      {slabsGeo && (
        <mesh geometry={slabsGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#e5e7eb" roughness={0.7} />
        </mesh>
      )}
      {glassGeo && (
        <mesh geometry={glassGeo}>
          <meshStandardMaterial
            color="#1e3a4c"
            roughness={0.18}
            metalness={0.6}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity * 0.4}
          />
        </mesh>
      )}
      {accentGeo && (
        <mesh geometry={accentGeo}>
          <meshStandardMaterial color="#1d4ed8" roughness={0.65} />
        </mesh>
      )}
      {louversGeo && (
        <mesh geometry={louversGeo} receiveShadow>
          <meshStandardMaterial color="#cbd5e1" roughness={0.55} />
        </mesh>
      )}
      {roofGeo && (
        <mesh geometry={roofGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color="#8d9196"
            roughness={0.75}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity * 0.45}
          />
        </mesh>
      )}
    </group>
  );
}

/**
 * Hành lang nối có mái che giữa Block 3 ↔ Block 6 (`hanh-lang-b3-b6`).
 * Thay thế khối hộp đặc bằng hành lang cột thép thông thoáng có mái che.
 */
export function CoveredB3B6Corridor({ building, isHovered, isSelected }: BuildingSubProps) {
  const emissiveColor = isSelected ? '#60a5fa' : isHovered ? '#38bdf8' : '#000000';
  const emissiveIntensity = isSelected ? 0.25 : isHovered ? 0.16 : 0;

  const { originX, originZ, rotY, plinthGeo, columnsGeo, roofGeo } = useMemo(() => {
    const axis = computePrincipalAxis(building.shape.outer);
    const { maxU, maxV } = axis;
    const plinthGeos: BufferGeometry[] = [];
    const colGeos: BufferGeometry[] = [];
    const roofGeos: BufferGeometry[] = [];

    // Nền lối đi lát gạch sáng
    addBox(plinthGeos, 0, maxU, 0.0, 0.18, 0.3, maxV - 0.3);

    // Hàng cột thép 2 bên & lan can thấp
    const numCols = Math.max(3, Math.round(maxU / 4.2));
    for (let i = 0; i <= numCols; i++) {
      const u = 0.4 + (i / numCols) * (maxU - 0.8);
      addBox(colGeos, u - 0.12, u + 0.12, 0.18, 3.25, 0.65, 0.89);
      addBox(colGeos, u - 0.12, u + 0.12, 0.18, 3.25, maxV - 0.89, maxV - 0.65);
    }
    addBox(colGeos, 0.3, maxU - 0.3, 0.9, 0.98, 0.72, 0.82);
    addBox(colGeos, 0.3, maxU - 0.3, 0.9, 0.98, maxV - 0.82, maxV - 0.72);

    // Mái che thông thoáng trên cao
    addBox(roofGeos, -0.2, maxU + 0.2, 3.22, 3.5, 0.25, maxV - 0.25);

    return {
      originX: axis.originX,
      originZ: axis.originZ,
      rotY: axis.rotY,
      plinthGeo: safeMerge(plinthGeos),
      columnsGeo: safeMerge(colGeos),
      roofGeo: safeMerge(roofGeos),
    };
  }, [building]);

  return (
    <group position={[originX, 0, originZ]} rotation={[0, rotY, 0]}>
      {plinthGeo && (
        <mesh geometry={plinthGeo} receiveShadow>
          <meshStandardMaterial color="#d6d3d1" roughness={0.85} />
        </mesh>
      )}
      {columnsGeo && (
        <mesh geometry={columnsGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#334155" roughness={0.6} metalness={0.3} />
        </mesh>
      )}
      {roofGeo && (
        <mesh geometry={roofGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color="#64748b"
            roughness={0.65}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      )}
    </group>
  );
}
