import { useMemo } from 'react';
import type { BufferGeometry } from 'three';
import type { Building } from '../../types';
import { addBox, computePrincipalAxis, safeMerge } from '../kit/geometryHelpers';

interface ServiceProps {
  building: Building;
  isHovered?: boolean;
  isSelected?: boolean;
}

/**
 * Cổng phụ (cổng sau, `cong-phu`) trên đường ra Lê Duẩn giữa B8 và B9.
 * Thay khối đặc chắn đường bằng cổng vòm ngang thoáng bên dưới, trụ cổng 2 bên, nhà bảo vệ và thanh chắn.
 */
export function BackGate({ isHovered, isSelected }: Omit<ServiceProps, 'building'>) {
  const emissiveColor = isSelected ? '#60a5fa' : isHovered ? '#38bdf8' : '#000000';
  const emissiveIntensity = isSelected ? 0.25 : isHovered ? 0.16 : 0;

  // Đường nội bộ chạy qua cổng có vectơ hướng Bắc-Tây-Bắc (-0.228, -0.974);
  // trục X cục bộ của cổng vuông góc đường là (+0.974, -0.228) => rotY = atan2(-uz, ux) = +0.229 rad.
  const gateX = -64.1;
  const gateZ = -238.0;
  const roadYaw = 0.229;

  const { pillarGeo, boothGeo, glassGeo, roofGeo, barGeo } = useMemo(() => {
    const pillars: BufferGeometry[] = [];
    const booths: BufferGeometry[] = [];
    const glass: BufferGeometry[] = [];
    const roofs: BufferGeometry[] = [];
    const bars: BufferGeometry[] = [];

    // 2 trụ cổng hai bên lòng đường (~11.6 m thông thủy cho xe qua lại)
    addBox(pillars, -7.2, -5.8, 0.0, 4.35, -1.35, 1.35);
    addBox(pillars, 5.8, 7.2, 0.0, 4.35, -1.35, 1.35);

    // Nhà bảo vệ gọn phía rìa Tây liền kề trụ cổng
    addBox(booths, -10.2, -7.2, 0.0, 3.15, -1.65, 1.65);
    addBox(glass, -7.28, -7.15, 1.15, 2.4, -1.15, 1.15);
    addBox(glass, -9.7, -7.6, 1.15, 2.4, -1.72, -1.58);
    addBox(glass, -9.7, -7.6, 1.15, 2.4, 1.58, 1.72);

    // Mái cổng ngang bắc qua toàn bộ lòng đường & chốt bảo vệ
    addBox(roofs, -11.0, 8.2, 4.3, 4.95, -2.35, 2.35);

    // Thanh chắn barrier ở 2 làn
    addBox(bars, -5.8, -0.7, 0.95, 1.09, -0.07, 0.07);
    addBox(bars, 0.7, 5.8, 0.95, 1.09, -0.07, 0.07);

    return {
      pillarGeo: safeMerge(pillars),
      boothGeo: safeMerge(booths),
      glassGeo: safeMerge(glass),
      roofGeo: safeMerge(roofs),
      barGeo: safeMerge(bars),
    };
  }, []);

  return (
    <group position={[gateX, 0, gateZ]} rotation={[0, roadYaw, 0]}>
      {pillarGeo && (
        <mesh geometry={pillarGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#e2e8f0" roughness={0.65} />
        </mesh>
      )}
      {boothGeo && (
        <mesh geometry={boothGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#f1f5f9" roughness={0.75} />
        </mesh>
      )}
      {glassGeo && (
        <mesh geometry={glassGeo}>
          <meshStandardMaterial color="#2b4c65" roughness={0.2} metalness={0.5} />
        </mesh>
      )}
      {roofGeo && (
        <mesh geometry={roofGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color="#475569"
            roughness={0.55}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      )}
      {barGeo && (
        <mesh geometry={barGeo} castShadow>
          <meshStandardMaterial color="#dc2626" roughness={0.45} />
        </mesh>
      )}
    </group>
  );
}

/**
 * Trạm điện (`tram-dien`) phía sau nhà giữ xe Block 5.
 * Bệ bê tông kỹ thuật, các dải lam thông gió biến áp và cửa kỹ thuật thép.
 */
export function PowerSubstation({ building, isHovered, isSelected }: ServiceProps) {
  const emissiveColor = isSelected ? '#60a5fa' : isHovered ? '#38bdf8' : '#000000';
  const emissiveIntensity = isSelected ? 0.25 : isHovered ? 0.16 : 0;

  const { originX, originZ, rotY, plinthGeo, wallGeo, louverGeo, capGeo } = useMemo(() => {
    const axis = computePrincipalAxis(building.shape.outer);
    const { maxU, maxV } = axis;
    const WALL_H = 3.8;

    const plinths: BufferGeometry[] = [];
    const walls: BufferGeometry[] = [];
    const louvers: BufferGeometry[] = [];
    const caps: BufferGeometry[] = [];

    addBox(plinths, -0.25, maxU + 0.25, 0.0, 0.28, -0.25, maxV + 0.25);
    addBox(walls, 0.0, maxU, 0.28, WALL_H, 0.0, maxV);
    addBox(caps, -0.35, maxU + 0.35, WALL_H, WALL_H + 0.32, -0.35, maxV + 0.35);

    // Dải lam thông gió kỹ thuật & cửa biến áp dọc 2 mặt dài
    const numVents = 4;
    const stepU = (maxU - 2.4) / numVents;
    for (let i = 0; i < numVents; i++) {
      const u1 = 1.4 + i * stepU;
      const u2 = u1 + stepU - 0.7;
      for (const yVent of [1.2, 1.8, 2.4, 3.0]) {
        addBox(louvers, u1, u2, yVent, yVent + 0.24, -0.06, 0.04);
        addBox(louvers, u1, u2, yVent, yVent + 0.24, maxV - 0.04, maxV + 0.06);
      }
    }
    // Cửa kỹ thuật thép ở 2 đầu hồi
    addBox(louvers, -0.06, 0.05, 0.28, 2.6, maxV * 0.3, maxV * 0.7);
    addBox(louvers, maxU - 0.05, maxU + 0.06, 0.28, 2.6, maxV * 0.3, maxV * 0.7);

    return {
      originX: axis.originX,
      originZ: axis.originZ,
      rotY: axis.rotY,
      plinthGeo: safeMerge(plinths),
      wallGeo: safeMerge(walls),
      louverGeo: safeMerge(louvers),
      capGeo: safeMerge(caps),
    };
  }, [building]);

  return (
    <group position={[originX, 0, originZ]} rotation={[0, rotY, 0]}>
      {plinthGeo && (
        <mesh geometry={plinthGeo} receiveShadow>
          <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
        </mesh>
      )}
      {wallGeo && (
        <mesh geometry={wallGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color={building.color}
            roughness={0.8}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      )}
      {louverGeo && (
        <mesh geometry={louverGeo}>
          <meshStandardMaterial color="#334155" roughness={0.6} metalness={0.3} />
        </mesh>
      )}
      {capGeo && (
        <mesh geometry={capGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#94a3b8" roughness={0.7} />
        </mesh>
      )}
    </group>
  );
}
