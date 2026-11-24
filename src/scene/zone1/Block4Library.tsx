import { useEffect, useMemo } from 'react';
import { Text } from '@react-three/drei';
import type { BufferGeometry } from 'three';
import { FLOOR_HEIGHT } from '../../data';
import { useSnowStore } from '../../store/useSnowStore';
import type { Building } from '../../types';
import {
  addBox,
  addRotatedBox,
  createExtrudedPolygon,
  expandShapePolygon,
  safeMerge,
  stripClosingPoint,
  toShapePoints,
} from '../kit/geometryHelpers';

interface Block4LibraryProps {
  building: Building;
  isHovered?: boolean;
  isSelected?: boolean;
}

const B4_LOCAL_ORIGIN_X = 91.5;
const B4_LOCAL_ORIGIN_Z = -97.4;
const B4_LOCAL_ROT_Y = -0.10912; // -6.25°
const U_LEN = 67.0;
const V_LEN = 28.0;

/**
 * Mặt đứng ngoại thất Thư viện EIU (Block 4 — 3 tầng = 11.4 m).
 * Dựng đúng theo khung nền OSM `w602270475` và ảnh thực tế từ tour 360° eiu_lib:
 * - Tầng 1 vách kính suốt khung trắng (góc Tây Bắc kính không khung nối sân pergola ngoài trời) + dải poster màu EIU.
 * - Tầng 2–3 dải cửa sổ băng ngang khung trắng trên nền tường bê tông ghi sáng.
 * - Đầu Đông giáp B5 nổi bật hàng cột cao 3 tầng, dầm cầu nối và 3 banner dọc EIU (đỏ, cam, xanh lá).
 * - Mái bằng chìa 0.8 m phủ tuyết theo mùa, mang 24 tấm pin mặt trời và khung giếng trời.
 */
export default function Block4Library({ building, isHovered, isSelected }: Block4LibraryProps) {
  const isSnowing = useSnowStore((s) => s.isSnowing);
  const emissiveColor = isSelected ? '#60a5fa' : isHovered ? '#38bdf8' : '#000000';
  const emissiveIntensity = isSelected ? 0.3 : isHovered ? 0.18 : 0;
  const totalH = building.height;

  const {
    bodyGeo,
    spandrelGeo,
    frameGeo,
    glassGeo,
    darkSteelGeo,
    patioGeo,
    solarGeo,
    roofGeo,
    bannerRedGeo,
    bannerTealGeo,
    bannerAmberGeo,
  } = useMemo(() => {
    const bodies: BufferGeometry[] = [];
    const spandrels: BufferGeometry[] = [];
    const frames: BufferGeometry[] = [];
    const glass: BufferGeometry[] = [];
    const darkSteels: BufferGeometry[] = [];
    const patios: BufferGeometry[] = [];
    const solars: BufferGeometry[] = [];
    const bannerReds: BufferGeometry[] = [];
    const bannerTeals: BufferGeometry[] = [];
    const bannerAmbers: BufferGeometry[] = [];

    // 1. Lõi thân nhà lùi nhẹ bên trong vách kính (tạo chiều sâu kiến trúc)
    addBox(bodies, 0.35, U_LEN - 0.35, 0.0, totalH - 0.05, 0.35, V_LEN - 0.35);

    // 2. Dải chỉ sàn & tường lửng bê tông trắng xám quanh chu vi các tầng
    // Bệ móng tầng 1
    addBox(spandrels, -0.1, U_LEN + 0.1, 0.0, 0.22, -0.1, V_LEN + 0.1);
    for (let f = 1; f < building.floors; f++) {
      const yBase = f * FLOOR_HEIGHT;
      // Chỉ sàn nhô nhẹ + tường lửng dưới băng cửa sổ (yBase..yBase+1.05) + dầm trên cửa sổ
      addBox(spandrels, -0.15, U_LEN + 0.15, yBase - 0.14, yBase + 0.16, -0.15, V_LEN + 0.15);
      addBox(spandrels, 0.05, U_LEN - 0.05, yBase + 0.16, yBase + 1.05, 0.05, 0.32);
      addBox(spandrels, 0.05, U_LEN - 0.05, yBase + 0.16, yBase + 1.05, V_LEN - 0.32, V_LEN - 0.05);
      addBox(spandrels, U_LEN - 0.32, U_LEN - 0.05, yBase + 0.16, yBase + 1.05, 0.05, V_LEN - 0.05);

      addBox(spandrels, 0.05, U_LEN - 0.05, yBase + 2.85, yBase + FLOOR_HEIGHT - 0.14, 0.05, 0.32);
      addBox(spandrels, 0.05, U_LEN - 0.05, yBase + 2.85, yBase + FLOOR_HEIGHT - 0.14, V_LEN - 0.32, V_LEN - 0.05);
      addBox(spandrels, U_LEN - 0.32, U_LEN - 0.05, yBase + 2.85, yBase + FLOOR_HEIGHT - 0.14, 0.05, V_LEN - 0.05);
    }
    // Tường đặc góc lõi thang Tây (u: 0..11.5) tầng 1–3
    addBox(spandrels, 0.0, 11.5, FLOOR_HEIGHT, totalH, 0.0, 0.35);
    addBox(spandrels, 0.0, 11.5, FLOOR_HEIGHT, totalH, V_LEN - 0.35, V_LEN);
    addBox(spandrels, 0.0, 0.35, 0.0, totalH, 0.0, V_LEN);

    // 3. Tầng 1: Vách kính suốt khung nhôm trắng (Bắc & Nam) + Cửa chính mặt Đông + Poster kính màu
    addBox(glass, 0.5, U_LEN - 0.2, 0.24, FLOOR_HEIGHT - 0.16, 0.06, 0.2);
    addBox(glass, 0.5, U_LEN - 0.2, 0.24, FLOOR_HEIGHT - 0.16, V_LEN - 0.2, V_LEN - 0.06);
    addBox(glass, U_LEN - 0.2, U_LEN - 0.04, 0.24, FLOOR_HEIGHT - 0.16, 0.2, V_LEN - 0.2);

    // Đố kính đứng Tầng 1
    for (let u = 11.5; u <= U_LEN; u += 2.5) {
      addBox(frames, u - 0.04, u + 0.04, 0.22, FLOOR_HEIGHT - 0.14, 0.04, 0.24);
      addBox(frames, u - 0.04, u + 0.04, 0.22, FLOOR_HEIGHT - 0.14, V_LEN - 0.24, V_LEN - 0.04);
    }
    // Khung ngang phân ô Tầng 1
    addBox(frames, 11.5, U_LEN, 2.5, 2.58, 0.04, 0.24);
    addBox(frames, 11.5, U_LEN, 2.5, 2.58, V_LEN - 0.24, V_LEN - 0.04);

    // Dải poster màu EIU mặt Nam tầng 1 nhìn ra hồ nước
    addBox(bannerReds, 36.0, 44.5, 0.95, 2.45, V_LEN - 0.05, V_LEN + 0.04);
    addBox(bannerTeals, 20.5, 29.0, 0.95, 2.45, V_LEN - 0.05, V_LEN + 0.04);
    addBox(bannerAmbers, 31.0, 35.0, 0.95, 2.45, V_LEN - 0.05, V_LEN + 0.04);

    // 4. Tầng 2–3: Cửa sổ băng ngang rộng khung trắng (u: 11.5..67)
    for (let f = 1; f < building.floors; f++) {
      const yMin = f * FLOOR_HEIGHT + 1.05;
      const yMax = f * FLOOR_HEIGHT + 2.85;
      addBox(glass, 11.5, U_LEN - 0.1, yMin, yMax, 0.08, 0.2);
      addBox(glass, 11.5, U_LEN - 0.1, yMin, yMax, V_LEN - 0.2, V_LEN - 0.08);
      addBox(glass, U_LEN - 0.2, U_LEN - 0.06, yMin, yMax, 0.2, V_LEN - 0.2);

      addBox(frames, 11.5, U_LEN, yMin - 0.03, yMin + 0.04, 0.04, 0.24);
      addBox(frames, 11.5, U_LEN, yMax - 0.04, yMax + 0.03, 0.04, 0.24);
      addBox(frames, 11.5, U_LEN, yMin - 0.03, yMin + 0.04, V_LEN - 0.24, V_LEN - 0.04);
      addBox(frames, 11.5, U_LEN, yMax - 0.04, yMax + 0.03, V_LEN - 0.24, V_LEN - 0.04);

      for (let u = 11.5; u <= U_LEN; u += 2.5) {
        addBox(frames, u - 0.04, u + 0.04, yMin, yMax, 0.05, 0.23);
        addBox(frames, u - 0.04, u + 0.04, yMin, yMax, V_LEN - 0.23, V_LEN - 0.05);
      }
      for (let v = 2.0; v <= V_LEN - 2.0; v += 3.0) {
        addBox(frames, U_LEN - 0.23, U_LEN - 0.04, yMin, yMax, v - 0.04, v + 0.04);
      }
    }

    // 5. Đầu Đông giáp hành lang sảnh B4–B5: Hệ cột 3 tầng + Khung cửa kính đen + Banner dọc EIU
    for (const pv of [2.5, 10.2, 17.8, 25.5]) {
      addBox(spandrels, U_LEN - 0.45, U_LEN + 0.25, 0.0, totalH, pv - 0.32, pv + 0.32);
    }
    addBox(darkSteels, U_LEN - 0.1, U_LEN + 0.1, 0.2, FLOOR_HEIGHT - 0.1, 12.1, 12.22);
    addBox(darkSteels, U_LEN - 0.1, U_LEN + 0.1, 0.2, FLOOR_HEIGHT - 0.1, 15.78, 15.9);
    addBox(darkSteels, U_LEN - 0.1, U_LEN + 0.1, 2.5, 2.62, 12.1, 15.9);
    // 3 dải banner dọc treo ở sảnh Đông (đỏ, xanh ngọc, cam)
    addBox(bannerReds, U_LEN + 0.26, U_LEN + 0.34, 4.2, 7.6, 4.5, 5.4);
    addBox(bannerAmbers, U_LEN + 0.26, U_LEN + 0.34, 4.2, 7.6, 13.5, 14.4);
    addBox(bannerTeals, U_LEN + 0.26, U_LEN + 0.34, 4.2, 7.6, 22.5, 23.4);

    // 6. Sân Pergola ngoài trời góc Tây Bắc ngoài Góc trao đổi sách (u: 1..12, v: -5.5..0)
    addBox(patios, 0.8, 12.2, 0.04, 0.22, -5.6, 0.05);
    addBox(darkSteels, 0.8, 12.2, 3.18, 3.32, -5.6, -0.05);
    for (const pu of [1.0, 6.5, 12.0]) {
      addBox(darkSteels, pu - 0.08, pu + 0.08, 0.22, 3.2, -5.5, -5.34);
    }
    // Lan can gạch hoa gió & 2 bàn ngoài trời sân pergola
    addBox(spandrels, 1.0, 12.0, 0.22, 1.05, -5.55, -5.42);
    for (const tu of [4.2, 8.8]) {
      addBox(darkSteels, tu - 0.65, tu + 0.65, 0.92, 0.98, -3.3, -2.3);
      addBox(darkSteels, tu - 0.06, tu + 0.06, 0.22, 0.92, -2.86, -2.74);
    }

    // 7. 24 tấm pin mặt trời trên mái (4 hàng × 6 cột) + 2 ô giếng trời
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        const lu = 14.0 + c * 6.4;
        const lv = 6.2 + r * 5.1;
        addRotatedBox(solars, 5.0, 0.1, 2.8, lu, totalH + 0.48, lv, 0, 0.12, 0);
      }
    }
    addBox(frames, 51.0, 56.5, totalH + 0.35, totalH + 0.52, 11.5, 16.5);
    addBox(glass, 51.2, 56.3, totalH + 0.46, totalH + 0.54, 11.7, 16.3);

    // 8. Mái chìa 0.8 m theo đúng footprint OSM (trong hệ tọa độ thế giới, giữ nguyên footprint)
    const outerShape = toShapePoints(stripClosingPoint(building.shape.outer));
    const expandedOuter = expandShapePolygon(outerShape, 0.8);
    const holesShape = building.shape.holes.map((h) => toShapePoints(stripClosingPoint(h)));
    const roofExtrude = createExtrudedPolygon(expandedOuter, holesShape, totalH, 0.38);

    return {
      bodyGeo: safeMerge(bodies),
      spandrelGeo: safeMerge(spandrels),
      frameGeo: safeMerge(frames),
      glassGeo: safeMerge(glass),
      darkSteelGeo: safeMerge(darkSteels),
      patioGeo: safeMerge(patios),
      solarGeo: safeMerge(solars),
      roofGeo: roofExtrude,
      bannerRedGeo: safeMerge(bannerReds),
      bannerTealGeo: safeMerge(bannerTeals),
      bannerAmberGeo: safeMerge(bannerAmbers),
    };
  }, [building.floors, building.shape, totalH]);

  useEffect(() => {
    return () => {
      bodyGeo?.dispose();
      spandrelGeo?.dispose();
      frameGeo?.dispose();
      glassGeo?.dispose();
      darkSteelGeo?.dispose();
      patioGeo?.dispose();
      solarGeo?.dispose();
      roofGeo?.dispose();
      bannerRedGeo?.dispose();
      bannerTealGeo?.dispose();
      bannerAmberGeo?.dispose();
    };
  }, [
    bodyGeo,
    spandrelGeo,
    frameGeo,
    glassGeo,
    darkSteelGeo,
    patioGeo,
    solarGeo,
    roofGeo,
    bannerRedGeo,
    bannerTealGeo,
    bannerAmberGeo,
  ]);

  return (
    <group>
      {/* Mái chìa thế giới theo đúng đa giác OSM */}
      {roofGeo && (
        <mesh geometry={roofGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color={isSnowing ? '#f8fafc' : '#8d9196'}
            roughness={0.65}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity * 0.5}
          />
        </mesh>
      )}

      {/* Toàn bộ kiến trúc mặt đứng & sân pergola xoay đúng trục B4 */}
      <group position={[B4_LOCAL_ORIGIN_X, 0, B4_LOCAL_ORIGIN_Z]} rotation-y={-B4_LOCAL_ROT_Y}>
        {bodyGeo && (
          <mesh geometry={bodyGeo} castShadow receiveShadow>
            <meshStandardMaterial
              color="#334155"
              roughness={0.85}
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        )}
        {spandrelGeo && (
          <mesh geometry={spandrelGeo} castShadow receiveShadow>
            <meshStandardMaterial
              color={isSnowing ? '#f1f5f9' : '#e2e6ec'}
              roughness={0.68}
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity * 0.7}
            />
          </mesh>
        )}
        {frameGeo && (
          <mesh geometry={frameGeo}>
            <meshStandardMaterial color="#f8fafc" roughness={0.35} metalness={0.2} />
          </mesh>
        )}
        {glassGeo && (
          <mesh geometry={glassGeo}>
            <meshStandardMaterial color="#1e3a52" roughness={0.14} metalness={0.55} />
          </mesh>
        )}
        {darkSteelGeo && (
          <mesh geometry={darkSteelGeo} castShadow>
            <meshStandardMaterial color="#1e293b" roughness={0.45} metalness={0.5} />
          </mesh>
        )}
        {patioGeo && (
          <mesh geometry={patioGeo} receiveShadow>
            <meshStandardMaterial color="#94a3b8" roughness={0.8} />
          </mesh>
        )}
        {solarGeo && (
          <mesh geometry={solarGeo} castShadow>
            <meshStandardMaterial color="#1e3a5f" roughness={0.3} metalness={0.6} />
          </mesh>
        )}
        {bannerRedGeo && (
          <mesh geometry={bannerRedGeo}>
            <meshStandardMaterial color="#b91c1c" roughness={0.45} />
          </mesh>
        )}
        {bannerTealGeo && (
          <mesh geometry={bannerTealGeo}>
            <meshStandardMaterial color="#0f766e" roughness={0.45} />
          </mesh>
        )}
        {bannerAmberGeo && (
          <mesh geometry={bannerAmberGeo}>
            <meshStandardMaterial color="#d97706" roughness={0.45} />
          </mesh>
        )}

        {/* Biển hiệu EIU LIBRARY trên diềm mái mặt Nam nhìn ra hồ & quảng trường */}
        <group position={[33.5, totalH - 0.52, V_LEN + 0.08]}>
          <mesh>
            <boxGeometry args={[12.5, 0.92, 0.14]} />
            <meshStandardMaterial color="#0b3d6e" roughness={0.4} />
          </mesh>
          <Text position={[0, 0.02, 0.09]} fontSize={0.48} color="#facc15" anchorX="center" anchorY="middle">
            THƯ VIỆN EIU · EIU LIBRARY
          </Text>
        </group>
      </group>
    </group>
  );
}
