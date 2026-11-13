import { useMemo } from 'react';
import type { BufferGeometry } from 'three';
import type { Building } from '../../types';
import { addBox, addCylinder, safeMerge } from './../kit/geometryHelpers';

interface KioskProps {
  building: Building;
  isHovered?: boolean;
  isSelected?: boolean;
}

function getBboxCenter(building: Building): { cx: number; cz: number } {
  const [cx, cz] = building.center;
  return { cx, cz };
}

/**
 * Highlands Coffee — Ki-ốt xe buýt đỏ đặc trưng cạnh hồ nước và Block 4.
 * Dựa theo ảnh trong Sổ tay Sinh viên EIU 2026–2027 trang 27.
 */
export function HighlandsKiosk({ building, isHovered, isSelected }: KioskProps) {
  const emissiveColor = isSelected ? '#60a5fa' : isHovered ? '#38bdf8' : '#000000';
  const emissiveIntensity = isSelected ? 0.25 : isHovered ? 0.16 : 0;

  const { cx, cz } = getBboxCenter(building);

  const { deckGeo, busBodyGeo, glassGeo, trimGeo, darkGeo } = useMemo(() => {
    const decks: BufferGeometry[] = [];
    const bodies: BufferGeometry[] = [];
    const glass: BufferGeometry[] = [];
    const trims: BufferGeometry[] = [];
    const darks: BufferGeometry[] = [];

    // Nền patio lát gạch & bệ xe
    addBox(decks, -5.8, 5.8, 0.0, 0.18, -3.8, 3.8);

    // 4 bánh xe đen gầm xe buýt
    for (const bx of [-2.4, 2.2]) {
      for (const bz of [-1.25, 1.25]) {
        addCylinder(darks, 0.42, 0.42, 0.28, 12, bx, 0.42, bz, Math.PI / 2);
      }
    }

    // Thân xe buýt đỏ Highlands (lùi nhẹ về rìa Đông để chừa sân ngồi phía hồ Tây)
    addBox(bodies, -2.5, 4.6, 0.45, 3.35, -1.65, 1.65);
    // Đầu mũi xe bo nhẹ ở phía Bắc (-z)
    addBox(bodies, -2.3, 4.4, 0.45, 2.55, -2.1, -1.65);

    // Cửa kính phục vụ quầy bar & kính lái
    addBox(glass, -2.58, -2.42, 1.35, 2.65, -1.25, 1.25);
    addBox(glass, 4.52, 4.66, 1.45, 2.65, -1.25, 1.25);
    addBox(glass, -2.15, 4.25, 1.55, 2.55, -2.14, -2.02);
    addBox(glass, -1.8, 3.8, 1.45, 2.55, 1.6, 1.72);

    // Viền bảng hiệu & mái hiên trắng chữ "HIGHLANDS" quay ra quảng trường hồ nước
    addBox(trims, -3.6, -2.45, 2.7, 3.05, -1.75, 1.75);
    addBox(trims, -2.6, 4.7, 3.35, 3.55, -1.75, 1.75);
    addBox(trims, -0.5, 2.5, 3.55, 3.9, -0.9, 0.9); // Cụm điều hòa nóc xe

    // 3 bộ bàn ghế & dù che ngoài trời phía Tây quay ra hồ
    for (const tz of [-2.2, 0.0, 2.2]) {
      addCylinder(darks, 0.05, 0.05, 2.35, 6, -4.2, 1.35, tz);
      addCylinder(trims, 0.55, 0.55, 0.06, 8, -4.2, 0.92, tz);
      addCylinder(bodies, 0.25, 1.05, 0.42, 8, -4.2, 2.62, tz);
    }

    return {
      deckGeo: safeMerge(decks),
      busBodyGeo: safeMerge(bodies),
      glassGeo: safeMerge(glass),
      trimGeo: safeMerge(trims),
      darkGeo: safeMerge(darks),
    };
  }, []);

  return (
    <group position={[cx, 0, cz]}>
      {deckGeo && (
        <mesh geometry={deckGeo} receiveShadow>
          <meshStandardMaterial color="#d6d3d1" roughness={0.88} />
        </mesh>
      )}
      {busBodyGeo && (
        <mesh geometry={busBodyGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color={building.color}
            roughness={0.55}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      )}
      {glassGeo && (
        <mesh geometry={glassGeo}>
          <meshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.55} />
        </mesh>
      )}
      {trimGeo && (
        <mesh geometry={trimGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
        </mesh>
      )}
      {darkGeo && (
        <mesh geometry={darkGeo} castShadow>
          <meshStandardMaterial color="#1f2937" roughness={0.75} />
        </mesh>
      )}
    </group>
  );
}

/** Fami Pizza — Ki-ốt ăn uống mái hiên & sân gỗ ngoài trời gần trục B4–B11. */
export function FamiPizzaKiosk({ building, isHovered, isSelected }: KioskProps) {
  const emissiveColor = isSelected ? '#60a5fa' : isHovered ? '#38bdf8' : '#000000';
  const emissiveIntensity = isSelected ? 0.25 : isHovered ? 0.16 : 0;

  const { cx, cz } = getBboxCenter(building);

  const { deckGeo, wallGeo, glassGeo, canopyGeo, accentGeo } = useMemo(() => {
    const decks: BufferGeometry[] = [];
    const walls: BufferGeometry[] = [];
    const glass: BufferGeometry[] = [];
    const canopies: BufferGeometry[] = [];
    const accents: BufferGeometry[] = [];

    // Sàn gỗ patio
    addBox(decks, -4.8, 4.8, 0.0, 0.16, -4.8, 4.8);
    // Thân quầy Fami Pizza
    addBox(walls, -3.4, 2.2, 0.16, 3.2, -3.4, 2.2);
    // Cửa kính phục vụ quầy
    addBox(glass, -3.48, -3.32, 1.0, 2.55, -2.5, 1.4);
    addBox(glass, -2.6, 1.4, 1.0, 2.55, 2.12, 2.28);
    // Mái hiên rộng che sân ngồi ngoài trời
    addBox(canopies, -4.6, 4.4, 3.2, 3.48, -4.2, 4.4);
    addBox(canopies, -4.4, -4.2, 0.16, 3.2, 4.0, 4.2);
    addBox(canopies, 4.0, 4.2, 0.16, 3.2, 4.0, 4.2);
    addBox(canopies, 4.0, 4.2, 0.16, 3.2, -4.0, -3.8);
    // Bàn ngoài trời & dải biển hiệu sáng
    addBox(accents, -3.5, 2.3, 3.48, 3.85, -3.5, 2.3);
    for (const tz of [0.8, 3.1]) {
      addCylinder(canopies, 0.04, 0.04, 0.78, 6, 3.2, 0.55, tz);
      addCylinder(accents, 0.65, 0.65, 0.08, 8, 3.2, 0.94, tz);
    }

    return {
      deckGeo: safeMerge(decks),
      wallGeo: safeMerge(walls),
      glassGeo: safeMerge(glass),
      canopyGeo: safeMerge(canopies),
      accentGeo: safeMerge(accents),
    };
  }, []);

  return (
    <group position={[cx, 0, cz]}>
      {deckGeo && (
        <mesh geometry={deckGeo} receiveShadow>
          <meshStandardMaterial color="#b08968" roughness={0.85} />
        </mesh>
      )}
      {wallGeo && (
        <mesh geometry={wallGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color={building.color}
            roughness={0.75}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      )}
      {glassGeo && (
        <mesh geometry={glassGeo}>
          <meshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.5} />
        </mesh>
      )}
      {canopyGeo && (
        <mesh geometry={canopyGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
      )}
      {accentGeo && (
        <mesh geometry={accentGeo} castShadow>
          <meshStandardMaterial color="#f8fafc" roughness={0.6} />
        </mesh>
      )}
    </group>
  );
}
