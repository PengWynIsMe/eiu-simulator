import { useMemo } from 'react';
import type { BufferGeometry } from 'three';
import type { Building } from '../../types';
import { CANTEEN_PARKING_DECK } from '../groundLevels';
import StaticInstances, { type StaticInstance } from '../kit/StaticInstances';
import {
  addBox,
  addRotatedBox,
  computePrincipalAxis,
  safeMerge,
} from '../kit/geometryHelpers';

interface ParkingProps {
  building: Building;
  isHovered?: boolean;
  isSelected?: boolean;
}

/**
 * Nhà giữ xe 2 tầng (`nha-xe-2-tang`, tầng trên + tầng hầm) cạnh đường Lê Duẩn gần B9/B10.
 * Có sàn tầng trên có lan can an toàn, mái tôn răng cưa phía trên, và dốc xuống tầng hầm.
 */
export function TwoLevelParking({ building, isHovered, isSelected }: ParkingProps) {
  const emissiveColor = isSelected ? '#60a5fa' : isHovered ? '#38bdf8' : '#000000';
  const emissiveIntensity = isSelected ? 0.24 : isHovered ? 0.16 : 0;

  const { originX, originZ, rotY, concreteGeo, steelGeo, roofGeo, rampVoidGeo } = useMemo(() => {
    const axis = computePrincipalAxis(building.shape.outer);
    const { maxU, maxV } = axis;
    const DECK_Y = 2.7;
    const ROOF_Y = 5.4;

    const concreteGeos: BufferGeometry[] = [];
    const steelGeos: BufferGeometry[] = [];
    const roofGeos: BufferGeometry[] = [];
    const voids: BufferGeometry[] = [];

    // Nền tầng trệt + thành hầm bao (dọc rìa để thấy phần hầm)
    addBox(concreteGeos, 0, maxU, 0.0, 0.25, 0, maxV);
    // Dải cửa tối gợi không gian tầng hầm mặt phía Nam
    addBox(voids, 12.0, maxU - 2.0, 0.25, DECK_Y - 0.15, 0.4, maxV - 0.4);

    // Lối dốc nghiêng đi xuống hầm ở phía Tây (u = 2..12 m)
    addBox(concreteGeos, 1.5, 12.2, 0.25, 1.4, maxV - 4.4, maxV - 4.05); // gờ lan can dốc
    addRotatedBox(concreteGeos, 10.5, 0.22, 3.4, 7.0, 1.35, maxV - 2.3, 0, 0, -0.24);
    addBox(voids, 11.4, 12.8, 0.25, 2.5, maxV - 4.0, maxV - 0.6); // miệng cửa hầm

    // Sàn tầng trên (nhô nhẹ 0.3 m)
    addBox(concreteGeos, 11.0, maxU + 0.2, DECK_Y, DECK_Y + 0.28, -0.2, maxV + 0.2);

    // Lan can bảo vệ tầng trên
    for (const railY of [DECK_Y + 0.65, DECK_Y + 1.05]) {
      addBox(steelGeos, 11.1, maxU + 0.1, railY, railY + 0.06, -0.15, -0.05);
      addBox(steelGeos, 11.1, maxU + 0.1, railY, railY + 0.06, maxV + 0.05, maxV + 0.15);
      addBox(steelGeos, maxU + 0.05, maxU + 0.15, railY, railY + 0.06, -0.1, maxV + 0.1);
    }

    // Hệ cột thép chịu lực đỡ tầng trên và mái (chừa thoáng trên ram dốc hầm u < 11)
    const numCols = 9;
    for (let i = 0; i <= numCols; i++) {
      const u = 0.6 + (i / numCols) * (maxU - 1.2);
      if (u < 10.6) continue;
      for (const cv of [0.5, maxV * 0.5, maxV - 0.5]) {
        addBox(steelGeos, u - 0.14, u + 0.14, 0.25, ROOF_Y + 0.1, cv - 0.14, cv + 0.14);
      }
    }

    // Mái tôn răng cưa 7 nhịp che phần sàn 2 tầng (để hở phần ram dốc hầm phía Tây u = 0..10.8)
    const bays = 7;
    const roofStartU = 10.6;
    const bayLen = (maxU + 0.4 - roofStartU) / bays;
    for (let i = 0; i < bays; i++) {
      const midU = roofStartU + (i + 0.5) * bayLen;
      addRotatedBox(roofGeos, bayLen + 0.25, 0.14, maxV + 1.0, midU, ROOF_Y + 0.32, maxV * 0.5, 0, 0, 0.14);
    }

    return {
      originX: axis.originX,
      originZ: axis.originZ,
      rotY: axis.rotY,
      concreteGeo: safeMerge(concreteGeos),
      steelGeo: safeMerge(steelGeos),
      roofGeo: safeMerge(roofGeos),
      rampVoidGeo: safeMerge(voids),
    };
  }, [building]);

  return (
    <group position={[originX, 0, originZ]} rotation={[0, rotY, 0]}>
      {concreteGeo && (
        <mesh geometry={concreteGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#d6d3d1" roughness={0.85} />
        </mesh>
      )}
      {rampVoidGeo && (
        <mesh geometry={rampVoidGeo} receiveShadow>
          <meshStandardMaterial color="#334155" roughness={0.85} />
        </mesh>
      )}
      {steelGeo && (
        <mesh geometry={steelGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#3e4752" roughness={0.65} />
        </mesh>
      )}
      {roofGeo && (
        <mesh geometry={roofGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color="#949da6"
            metalness={0.25}
            roughness={0.55}
            flatShading
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      )}
    </group>
  );
}

/**
 * Nhà giữ xe cạnh Căn tin (`nha-xe-can-tin`, ~121 m × 13 m).
 * Giữ nền và lưới cột hiện có, dựng nhịp chữ A liên tiếp dọc cạnh dài.
 */
export function LongParkingShed({ building, isHovered, isSelected }: ParkingProps) {
  const emissiveColor = isSelected ? '#60a5fa' : isHovered ? '#38bdf8' : '#000000';
  const emissiveIntensity = isSelected ? 0.24 : isHovered ? 0.16 : 0;

  const { originX, originZ, rotY, maxU, maxV, steel, roofs } = useMemo(() => {
    const axis = computePrincipalAxis(building.shape.outer);
    const { maxU, maxV } = axis;
    const steel: StaticInstance[] = [];
    const roofs: StaticInstance[] = [];
    const bays = 15;
    const bayLen = maxU / bays;
    const eave = 3.28;
    const rise = 0.72;
    const halfBay = bayLen / 2;
    const pitch = Math.atan2(rise, halfBay);
    const slopeLength = Math.hypot(halfBay, rise);

    for (let i = 0; i <= bays; i++) {
      const u = i === 0 ? 0.4 : i === bays ? maxU - 0.4 : i * bayLen;
      for (const cv of [0.45, maxV * 0.5, maxV - 0.45]) {
        steel.push({
          position: [u, (CANTEEN_PARKING_DECK + eave) / 2, cv],
          scale: [0.24, eave - CANTEEN_PARKING_DECK, 0.24],
        });
      }
      steel.push({ position: [u, eave - 0.09, maxV / 2], scale: [0.15, 0.18, maxV] });
      if (i === bays) break;

      for (const side of [-1, 1]) {
        const midU = (i + 0.5) * bayLen + side * halfBay / 2;
        const y = eave + rise / 2;
        const rotation: [number, number, number] = [0, 0, -side * pitch];
        roofs.push({ position: [midU, y, maxV / 2], scale: [slopeLength + 0.025, 0.12, maxV + 0.65], rotation });
        for (const v of [0.45, maxV / 2, maxV - 0.45]) {
          steel.push({ position: [midU, y - 0.14, v], scale: [slopeLength, 0.17, 0.1], rotation });
        }
      }
    }

    return { ...axis, steel, roofs };
  }, [building]);

  return (
    <group position={[originX, 0, originZ]} rotation={[0, rotY, 0]}>
      <mesh position={[maxU / 2, CANTEEN_PARKING_DECK / 2, maxV / 2]} receiveShadow>
        <boxGeometry args={[maxU, CANTEEN_PARKING_DECK, maxV]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-2} />
      </mesh>
      <StaticInstances items={steel} pickable receiveShadow>
        <boxGeometry />
        <meshStandardMaterial color="#64748b" roughness={0.65} metalness={0.22} />
      </StaticInstances>
      <StaticInstances items={roofs} pickable castShadow receiveShadow>
        <boxGeometry />
        <meshStandardMaterial
          color="#f1f3f4"
          metalness={0.22}
          roughness={0.6}
          flatShading
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </StaticInstances>
    </group>
  );
}
