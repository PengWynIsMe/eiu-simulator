import { useMemo } from 'react';
import type { BufferGeometry } from 'three';
import type { Building } from '../../types';
import {
  addBox,
  addCylinder,
  computePrincipalAxis,
  safeMerge,
} from '../kit/geometryHelpers';

interface CanteenBlockProps {
  building: Building;
  isHovered?: boolean;
  isSelected?: boolean;
}

/**
 * Căn tin EIU (`can-tin`, ~64 m × 37 m).
 * Mô phỏng sảnh ăn uống trần cao thông thoáng, hệ vách kính lớn, mái hiên vươn rộng
 * với giếng thông gió nóc và sân ngồi pergola ngoài trời (Sổ tay SV trang 27).
 */
export default function CanteenBlock({ building, isHovered, isSelected }: CanteenBlockProps) {
  const emissiveColor = isSelected ? '#60a5fa' : isHovered ? '#38bdf8' : '#000000';
  const emissiveIntensity = isSelected ? 0.24 : isHovered ? 0.16 : 0;

  const {
    originX,
    originZ,
    rotY,
    plinthGeo,
    wallsGeo,
    glassGeo,
    steelGeo,
    roofGeo,
    tableGeo,
  } = useMemo(() => {
    const axis = computePrincipalAxis(building.shape.outer);
    const { maxU, maxV } = axis;
    const HALL_H = 4.6;

    const plinths: BufferGeometry[] = [];
    const walls: BufferGeometry[] = [];
    const glass: BufferGeometry[] = [];
    const steels: BufferGeometry[] = [];
    const roofs: BufferGeometry[] = [];
    const tables: BufferGeometry[] = [];

    // 1. Nền hiên mở rộng bao quanh sảnh chính + sân ngồi pergola phía Nam
    addBox(plinths, -1.4, maxU + 1.4, 0.0, 0.24, -1.4, maxV + 5.4);

    // 2. Khối tường khu bếp phía Bắc (v nhỏ) & thân sảnh chính
    addBox(walls, 0.6, maxU - 0.6, 0.24, HALL_H, 0.6, maxV * 0.45);
    // 2 đầu hồi Đông / Tây đặc xen kính
    addBox(walls, 0.6, 3.8, 0.24, HALL_H, maxV * 0.45, maxV - 0.6);
    addBox(walls, maxU - 3.8, maxU - 0.6, 0.24, HALL_H, maxV * 0.45, maxV - 0.6);
    // Phần lửng phía trên tường kính Nam & Đông/Tây
    addBox(walls, 3.8, maxU - 3.8, 3.55, HALL_H, maxV - 1.15, maxV - 0.6);

    // 3. Hệ vách kính thông thoáng mặt Nam, Đông, Tây & Bắc
    const bays = 8;
    const bayW = (maxU - 7.6) / bays;
    for (let i = 0; i < bays; i++) {
      const u1 = 3.8 + i * bayW;
      const u2 = u1 + bayW - 0.35;
      addBox(glass, u1 + 0.15, u2, 0.35, 3.55, maxV - 0.85, maxV - 0.68);
      addBox(glass, u1 + 0.15, u2, 2.2, 3.8, 0.52, 0.7);
      // Cột khung thép mặt đứng
      addBox(steels, u1 - 0.18, u1 + 0.18, 0.24, HALL_H + 0.1, maxV - 1.0, maxV - 0.55);
    }
    addBox(steels, maxU - 3.98, maxU - 3.62, 0.24, HALL_H + 0.1, maxV - 1.0, maxV - 0.55);
    addBox(glass, 0.52, 0.7, 0.6, 3.6, maxV * 0.48, maxV - 2.0);
    addBox(glass, maxU - 0.7, maxU - 0.52, 0.6, 3.6, maxV * 0.48, maxV - 2.0);

    // 4. Mái chính chìa gọn + mái thông gió giật cấp trung tâm (monitor roof)
    addBox(roofs, -1.2, maxU + 1.2, HALL_H, HALL_H + 0.42, -1.2, maxV + 1.0);
    addBox(walls, 7.5, maxU - 7.5, HALL_H + 0.42, HALL_H + 1.2, maxV * 0.33, maxV * 0.67);
    addBox(glass, 7.9, maxU - 7.9, HALL_H + 0.52, HALL_H + 1.12, maxV * 0.33 - 0.05, maxV * 0.67 + 0.05);
    addBox(roofs, 6.5, maxU - 6.5, HALL_H + 1.2, HALL_H + 1.56, maxV * 0.28, maxV * 0.72);

    // 5. Sân ngồi ngoài trời có giàn lam pergola hở đón sáng + bàn ghế gỗ phía Nam
    const patioStartV = maxV + 1.1;
    const patioEndV = maxV + 5.1;
    addBox(steels, 4.0, maxU - 4.0, 3.1, 3.24, patioStartV + 0.05, patioStartV + 0.25);
    addBox(steels, 4.0, maxU - 4.0, 3.1, 3.24, patioEndV - 0.25, patioEndV - 0.05);
    for (let su = 4.5; su <= maxU - 4.5; su += 1.4) {
      addBox(steels, su - 0.06, su + 0.06, 3.22, 3.34, patioStartV, patioEndV);
    }
    for (let pu = 6.0; pu <= maxU - 6.0; pu += 7.5) {
      addBox(steels, pu - 0.1, pu + 0.1, 0.24, 3.15, patioEndV - 0.28, patioEndV - 0.08);
      // Cụm bàn ghế gỗ ngoài trời dưới giàn pergola
      addBox(tables, pu - 1.3, pu + 1.3, 0.72, 0.84, patioStartV + 1.3, patioStartV + 2.7);
      addCylinder(steels, 0.06, 0.06, 0.48, 6, pu - 0.9, 0.48, patioStartV + 2.0);
      addCylinder(steels, 0.06, 0.06, 0.48, 6, pu + 0.9, 0.48, patioStartV + 2.0);
    }

    return {
      originX: axis.originX,
      originZ: axis.originZ,
      rotY: axis.rotY,
      plinthGeo: safeMerge(plinths),
      wallsGeo: safeMerge(walls),
      glassGeo: safeMerge(glass),
      steelGeo: safeMerge(steels),
      roofGeo: safeMerge(roofs),
      tableGeo: safeMerge(tables),
    };
  }, [building]);

  return (
    <group position={[originX, 0, originZ]} rotation={[0, rotY, 0]}>
      {plinthGeo && (
        <mesh geometry={plinthGeo} receiveShadow>
          <meshStandardMaterial color="#d6d3d1" roughness={0.85} />
        </mesh>
      )}
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
      {glassGeo && (
        <mesh geometry={glassGeo}>
          <meshStandardMaterial color="#33556e" roughness={0.22} metalness={0.45} />
        </mesh>
      )}
      {steelGeo && (
        <mesh geometry={steelGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#334155" roughness={0.6} metalness={0.35} />
        </mesh>
      )}
      {roofGeo && (
        <mesh geometry={roofGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color="#85909d"
            roughness={0.65}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity * 0.45}
          />
        </mesh>
      )}
      {tableGeo && (
        <mesh geometry={tableGeo} castShadow>
          <meshStandardMaterial color="#b45309" roughness={0.75} />
        </mesh>
      )}
    </group>
  );
}
