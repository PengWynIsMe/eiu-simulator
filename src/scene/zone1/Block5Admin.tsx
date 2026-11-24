import { useEffect, useMemo } from 'react';
import { BufferGeometry } from 'three';
import { FLOOR_HEIGHT } from '../../data';
import { useSnowStore } from '../../store/useSnowStore';
import { useWalkStore } from '../../store/useWalkStore';
import type { Building } from '../../types';
import { addBox, safeMerge } from '../kit/geometryHelpers';

interface Block5AdminProps {
  building: Building;
  isHovered?: boolean;
  isSelected?: boolean;
}

const B4_LOCAL_ORIGIN_X = 91.5;
const B4_LOCAL_ORIGIN_Z = -97.4;
const B4_LOCAL_ROT_Y = -0.10912;

/**
 * Khối nhà Block 5 — Tòa nhà Hành chính (3 tầng = 11.4 m), tách rỗng phần góc Tây Bắc
 * (`u = 67.0..77.5, v = 0..28.0`) để tạo Sảnh lớn thông tầng B4–B5 có hồ nước ở giữa.
 */
export default function Block5Admin({ building, isHovered, isSelected }: Block5AdminProps) {
  const isSnowing = useSnowStore((s) => s.isSnowing);
  const walkMode = useWalkStore((s) => s.walkMode);
  const activeSelected = Boolean(isSelected && !walkMode);
  const activeHovered = Boolean(isHovered && !walkMode);
  const emissiveColor = activeSelected ? '#60a5fa' : activeHovered ? '#38bdf8' : '#000000';
  const emissiveIntensity = activeSelected ? 0.14 : activeHovered ? 0.08 : 0;
  const totalH = building.height;

  const {
    stuccoGeo,
    creamGeo,
    glassGeo,
    darkSteelGeo,
    roofSoffitGeo,
    roofDeckGeo,
  } = useMemo(() => {
    const stucco: BufferGeometry[] = [];
    const cream: BufferGeometry[] = [];
    const glass: BufferGeometry[] = [];
    const darkSteels: BufferGeometry[] = [];
    const roofSoffits: BufferGeometry[] = [];
    const roofDecks: BufferGeometry[] = [];

    // 2 cánh đặc của Block 5 nằm ngoài Sảnh chung B4–B5:
    // - Cánh Đông: u = 77.5..98.4, v = 0.0..42.96
    // - Cánh Tây Nam: u = 64.23..77.5, v = 28.08..42.96
    addBox(stucco, 77.5, 98.4, 0.0, totalH, 0.0, 42.96);
    addBox(stucco, 64.23, 77.5, 0.0, totalH, 28.08, 42.96);

    // Gờ chỉ sàn & cột vuông kem đặc trưng dọc các mặt ngoài Block 5
    for (let f = 1; f < building.floors; f++) {
      const y = f * FLOOR_HEIGHT;
      addBox(cream, 77.45, 98.58, y - 0.12, y + 0.14, -0.18, 43.14);
      addBox(cream, 64.05, 77.5, y - 0.12, y + 0.14, 28.06, 43.14);
    }

    // Dải cửa sổ băng ngang + ô văng kem mặt Đông (u = 98.4), Bắc (v = 0), Nam (v = 42.96), Tây Nam (u = 64.23)
    for (let f = 0; f < building.floors; f++) {
      const yBase = f * FLOOR_HEIGHT;
      const wMin = yBase + (f === 0 ? 1.15 : 1.45);
      const wMax = yBase + (f === 0 ? 3.25 : 2.82);

      // Mặt Đông (u = 98.4)
      addBox(glass, 98.36, 98.46, wMin, wMax, 1.8, 41.2);
      // Mặt Bắc (v = 0.0)
      addBox(glass, 78.8, 97.0, wMin, wMax, -0.06, 0.06);
      // Mặt Nam (v = 42.96)
      addBox(glass, 65.8, 97.0, wMin, wMax, 42.9, 43.02);
      // Mặt Tây khối Tây Nam (u = 64.23, v = 28.2..42.96)
      addBox(glass, 64.17, 64.29, wMin, wMax, 29.4, 41.6);
      // Mặt hướng vào sảnh B4–B5 ở tường Tây Cánh Đông (u = 77.5, v = 1.5..26.5) & Bắc Cánh Tây Nam
      addBox(glass, 77.44, 77.54, wMin, wMax, 2.2, 25.8);
      addBox(glass, 65.2, 76.5, wMin, wMax, 28.04, 28.14);

      if (f >= 1) {
        addBox(cream, 98.32, 99.1, wMax - 0.02, wMax + 0.16, -0.35, 43.3);
        addBox(cream, 77.5, 98.85, wMax - 0.02, wMax + 0.16, -0.78, 0.25);
        addBox(cream, 63.8, 98.85, wMax - 0.02, wMax + 0.16, 42.75, 43.74);
        addBox(cream, 63.45, 64.45, wMax - 0.02, wMax + 0.16, 28.08, 43.35);
      }

      // Đố dọc cửa sổ thép tối màu
      for (let v = 3.0; v <= 41.0; v += 3.2) {
        addBox(darkSteels, 98.38, 98.48, wMin, wMax, v - 0.03, v + 0.03);
      }
      for (let u = 66.5; u <= 96.5; u += 3.2) {
        addBox(darkSteels, u - 0.03, u + 0.03, wMin, wMax, 42.92, 43.04);
      }
    }

    // Hệ cột đứng màu kem chia nhịp mặt đứng ngoài B5
    for (const u of [64.25, 70.8, 77.5, 84.5, 91.5, 98.35]) {
      if (u >= 77.5) {
        addBox(cream, u - 0.28, u + 0.28, 0.0, totalH, -0.22, 0.28);
      }
      addBox(cream, u - 0.28, u + 0.28, 0.0, totalH, 42.68, 43.18);
    }
    for (const v of [0.25, 9.2, 18.8, 28.1, 35.5, 42.75]) {
      addBox(cream, 98.12, 98.62, 0.0, totalH, v - 0.28, v + 0.28);
      if (v >= 28.08) {
        addBox(cream, 64.0, 64.5, 0.0, totalH, v - 0.28, v + 0.28);
      }
    }

    // Mái chìa kem & sàn mái tôn ghi sáng nối tiếp liền mạch với mái sảnh B4–B5
    addBox(roofSoffits, 77.5, 99.6, totalH, totalH + 0.28, -1.2, 44.16);
    addBox(roofSoffits, 63.03, 77.5, totalH, totalH + 0.28, 28.06, 44.16);
    addBox(roofDecks, 77.6, 98.8, totalH + 0.28, totalH + 0.52, -0.3, 43.25);
    addBox(roofDecks, 64.0, 77.6, totalH + 0.28, totalH + 0.52, 28.1, 43.25);

    return {
      stuccoGeo: safeMerge(stucco),
      creamGeo: safeMerge(cream),
      glassGeo: safeMerge(glass),
      darkSteelGeo: safeMerge(darkSteels),
      roofSoffitGeo: safeMerge(roofSoffits),
      roofDeckGeo: safeMerge(roofDecks),
    };
  }, [building.floors, totalH]);

  useEffect(() => {
    return () => {
      stuccoGeo?.dispose();
      creamGeo?.dispose();
      glassGeo?.dispose();
      darkSteelGeo?.dispose();
      roofSoffitGeo?.dispose();
      roofDeckGeo?.dispose();
    };
  }, [stuccoGeo, creamGeo, glassGeo, darkSteelGeo, roofSoffitGeo, roofDeckGeo]);

  return (
    <group position={[B4_LOCAL_ORIGIN_X, 0, B4_LOCAL_ORIGIN_Z]} rotation-y={-B4_LOCAL_ROT_Y}>
      {stuccoGeo && (
        <mesh geometry={stuccoGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color="#684c4f"
            roughness={0.76}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity * 0.75}
          />
        </mesh>
      )}
      {creamGeo && (
        <mesh geometry={creamGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color={isSnowing ? '#f1f5f9' : '#e6dfd3'}
            roughness={0.65}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity * 0.7}
          />
        </mesh>
      )}
      {glassGeo && (
        <mesh geometry={glassGeo}>
          <meshStandardMaterial color="#1f4259" transparent opacity={0.74} roughness={0.14} metalness={0.4} />
        </mesh>
      )}
      {darkSteelGeo && (
        <mesh geometry={darkSteelGeo}>
          <meshStandardMaterial color="#1c2128" roughness={0.45} metalness={0.55} />
        </mesh>
      )}
      {roofSoffitGeo && (
        <mesh geometry={roofSoffitGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color={isSnowing ? '#f8fafc' : '#e6dfd3'}
            roughness={0.68}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity * 0.5}
          />
        </mesh>
      )}
      {roofDeckGeo && (
        <mesh geometry={roofDeckGeo} receiveShadow>
          <meshStandardMaterial
            color={isSnowing ? '#f8fafc' : '#b5bac0'}
            roughness={0.72}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity * 0.4}
          />
        </mesh>
      )}
    </group>
  );
}
