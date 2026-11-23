import { useMemo } from 'react';
import type { BufferGeometry } from 'three';
import type { Building } from '../../types';
import {
  addBox,
  addCylinder,
  computePrincipalAxis,
  safeMerge,
} from '../kit/geometryHelpers';
import { add3DTextAlongX } from '../kit/blockText';

interface CanteenBlockProps {
  building: Building;
  isHovered?: boolean;
  isSelected?: boolean;
}

/**
 * Căn tin EIU (`can-tin`, ~64 m × 37 m).
 * Nâng cấp theo clip thực tế (t061s, t065s, t069s, t073s):
 * - Mặt tiền: Dải fascia màu nâu đỏ mận + chữ 3D "EIU CANTEEN" trắng nổi bật.
 * - Mảng tường cây xanh đứng (living wall) xen kẽ lam hoa gió caro màu gỗ và xanh ngọc (teal).
 * - Sân trước: Bãi cỏ xanh, ghế đá khối bê tông mài phẳng, xích đu đôi kiểu công viên, cây to có giàn chống 3 chân.
 * - Bên trong: Dãy quầy đồ ăn có biển sáng (GIẢI KHÁT, MÓN CƠM, MÓN NƯỚC, CASHIER) và các dãy bàn ăn học sinh ngăn nắp.
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
    fasciaMaroonGeo,
    lettersWhiteGeo,
    livingWallGeo,
    accentTealGeo,
    frontYardGeo,
  } = useMemo(() => {
    const axis = computePrincipalAxis(building.shape.outer);
    const { maxU, maxV } = axis;
    const HALL_H = 4.6;

    const plinths: BufferGeometry[] = [];
    const walls: BufferGeometry[] = [];
    const glass: BufferGeometry[] = [];
    const steels: BufferGeometry[] = [];
    const roofs: BufferGeometry[] = [];
    const maroons: BufferGeometry[] = [];
    const whites: BufferGeometry[] = [];
    const livingWalls: BufferGeometry[] = [];
    const teals: BufferGeometry[] = [];
    const frontYards: BufferGeometry[] = [];

    // ==========================================
    // 1. NỀN HIÊN & SẢNH CHÍNH
    // ==========================================
    addBox(plinths, -1.4, maxU + 1.4, 0.0, 0.24, -1.4, maxV + 5.4);

    // ==========================================
    // 2. KHỐI TƯỜNG CƠ BẢN
    // ==========================================
    // Khối tường khu bếp phía Bắc (V nhỏ)
    addBox(walls, 0.6, maxU - 0.6, 0.24, HALL_H, 0.6, maxV * 0.38);
    // Vách ngăn dưới bệ quầy phục vụ
    addBox(walls, 0.6, maxU - 0.6, 0.24, 1.15, maxV * 0.38, maxV * 0.44);
    // Dầm vách trên cao treo biển quầy đồ ăn (để hở ô giao đồ ăn Y: 1.15 -> 2.50)
    addBox(walls, 0.6, maxU - 0.6, 2.45, HALL_H, maxV * 0.38, maxV * 0.44);
    // 2 đầu hồi Đông / Tây đặc xen kính
    addBox(walls, 0.6, 3.8, 0.24, HALL_H, maxV * 0.38, maxV - 0.6);
    addBox(walls, maxU - 3.8, maxU - 0.6, 0.24, HALL_H, maxV * 0.38, maxV - 0.6);

    // ==========================================
    // 3. MẶT TIỀN: FASCIA NÂU ĐỎ & CHỮ 3D "EIU CANTEEN"
    // ==========================================
    // Dải fascia màu nâu đỏ mận (#6b2626) chạy dài trên cao mặt tiền (t073s)
    addBox(maroons, 3.6, maxU - 3.6, 3.45, HALL_H + 0.15, maxV - 0.72, maxV - 0.58);
    // Viền chỉ trên và dưới fascia màu trắng sáng
    addBox(whites, 3.4, maxU - 3.4, 3.40, 3.48, maxV - 0.74, maxV - 0.56);
    addBox(whites, 3.4, maxU - 3.4, HALL_H + 0.12, HALL_H + 0.22, maxV - 0.74, maxV - 0.56);

    // Chữ nổi 3D "EIU CANTEEN" màu trắng nổi trên fascia mặt tiền (hướng +V, quay về phía đường/sân trước)
    const textStartX = maxU * 0.5 - 7.5;
    add3DTextAlongX(
      whites,
      'EIU CANTEEN',
      textStartX,
      3.68,
      maxV - 0.52,
      0.82,
      0.80,
      0.10,
      0.22
    );

    // ==========================================
    // 4. MẢNG TƯỜNG CÂY XANH ĐỨNG & LAM CARO TEAL/GỖ
    // ==========================================
    // Mặt tiền có 8 nhịp cửa / tường
    const bays = 8;
    const bayW = (maxU - 7.6) / bays;
    for (let i = 0; i < bays; i++) {
      const u1 = 3.8 + i * bayW;
      const u2 = u1 + bayW - 0.35;

      // Cột khung thép mặt đứng
      addBox(steels, u1 - 0.18, u1 + 0.18, 0.24, HALL_H + 0.1, maxV - 0.85, maxV - 0.55);

      if (i === 1 || i === 4 || i === 6) {
        // Mảng tường cây xanh đứng (Living wall) bao phủ mặt ngoài (t073s)
        addBox(livingWalls, u1 + 0.12, u2 - 0.12, 0.24, 3.40, maxV - 0.78, maxV - 0.62);
      } else if (i === 2 || i === 5) {
        // Lam trang trí hoa văn ô vuông caro (màu gỗ nâu xen ô xanh ngọc teal)
        addBox(walls, u1 + 0.15, u2 - 0.15, 0.24, 3.40, maxV - 0.82, maxV - 0.75);
        // Các ô gạch hoa gió xanh ngọc teal
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 3; col++) {
            if ((row + col) % 2 === 0) {
              const ox = u1 + 0.35 + col * 0.9;
              const oy = 0.5 + row * 0.55;
              addBox(teals, ox, ox + 0.65, oy, oy + 0.42, maxV - 0.74, maxV - 0.68);
            }
          }
        }
      } else {
        // Cửa kính lớn lối vào sảnh ăn
        addBox(glass, u1 + 0.15, u2, 0.35, 3.40, maxV - 0.85, maxV - 0.68);
      }
    }
    addBox(steels, maxU - 3.98, maxU - 3.62, 0.24, HALL_H + 0.1, maxV - 0.85, maxV - 0.55);

    // Kính cửa 2 bên đầu hồi
    addBox(glass, 0.52, 0.7, 0.6, 3.6, maxV * 0.48, maxV - 2.0);
    addBox(glass, maxU - 0.7, maxU - 0.52, 0.6, 3.6, maxV * 0.48, maxV - 2.0);

    // ==========================================
    // 5. MÁI CHÍNH & MÁI THÔNG GIÓ GIẬT CẤP (MONITOR ROOF)
    // ==========================================
    addBox(roofs, -1.2, maxU + 1.2, HALL_H, HALL_H + 0.42, -1.2, maxV + 1.0);
    addBox(walls, 7.5, maxU - 7.5, HALL_H + 0.42, HALL_H + 1.2, maxV * 0.33, maxV * 0.67);
    addBox(glass, 7.9, maxU - 7.9, HALL_H + 0.52, HALL_H + 1.12, maxV * 0.33 - 0.05, maxV * 0.67 + 0.05);
    addBox(roofs, 6.5, maxU - 6.5, HALL_H + 1.2, HALL_H + 1.56, maxV * 0.28, maxV * 0.72);

    // ==========================================
    // 6. SÂN TRƯỚC: BÃI CỎ, GHẾ ĐÁ KHỐI, XÍCH ĐU, CÂY CHỐNG 3 CHÂN
    // ==========================================
    // Sân cỏ xanh mát phía trước (t061s, t073s)
    const yardStartV = maxV + 5.5;
    const yardEndV = maxV + 15.5;
    addBox(frontYards, 4.0, maxU - 4.0, 0.0, 0.16, yardStartV, yardEndV);

    // Ghế đá nguyên khối bê tông mài phẳng (t061s - nơi cô sinh viên ngồi uống ly trà đào)
    // Ghế đá 1 tại U = 18.0, V = yardStartV + 2.5
    addBox(plinths, 17.0, 19.4, 0.16, 0.62, yardStartV + 2.2, yardStartV + 2.9);
    // Ghế đá 2 tại U = 36.0, V = yardStartV + 2.5
    addBox(plinths, 35.0, 37.4, 0.16, 0.62, yardStartV + 2.2, yardStartV + 2.9);
    // Ghế đá 3 tại U = 48.0, V = yardStartV + 3.2
    addBox(plinths, 47.0, 49.4, 0.16, 0.62, yardStartV + 2.9, yardStartV + 3.6);

    // Cây lớn sân trước có khung chống thép 3 chân (t061s)
    const treeU = 20.2;
    const treeV = yardStartV + 3.4;
    // Thân cây to
    addCylinder(walls, 0.40, 0.45, 4.8, 8, treeU, 2.4, treeV);
    // Tán cây xanh xòe rộng
    addBox(livingWalls, treeU - 2.8, treeU + 2.8, 4.5, 7.5, treeV - 2.8, treeV + 2.8);
    // Khung chống thép 3 chân (tripod steel prop)
    for (let a = 0; a < 3; a++) {
      const ang = (a * 2 * Math.PI) / 3;
      const legX = treeU + Math.cos(ang) * 1.5;
      const legZ = treeV + Math.sin(ang) * 1.5;
      addBox(steels, legX - 0.05, legX + 0.05, 0.16, 2.6, legZ - 0.05, legZ + 0.05);
    }
    addBox(steels, treeU - 0.6, treeU + 0.6, 2.4, 2.55, treeV - 0.6, treeV + 0.6);

    // Xích đu công viên đôi (Swing set) tại U = 42.0, V = yardStartV + 4.5
    const swingU = 42.0;
    const swingV = yardStartV + 4.5;
    // Cột chữ A thép 2 bên
    addBox(steels, swingU - 2.2, swingU - 2.05, 0.16, 2.8, swingV - 0.7, swingV + 0.7);
    addBox(steels, swingU + 2.05, swingU + 2.2, 0.16, 2.8, swingV - 0.7, swingV + 0.7);
    // Xà ngang đỉnh
    addBox(steels, swingU - 2.3, swingU + 2.3, 2.75, 2.88, swingV - 0.08, swingV + 0.08);
    // 2 ghế xích đu treo
    for (const sx of [swingU - 1.0, swingU + 1.0]) {
      // Dây xích
      addCylinder(steels, 0.015, 0.015, 1.8, 4, sx - 0.32, 1.8, swingV);
      addCylinder(steels, 0.015, 0.015, 1.8, 4, sx + 0.32, 1.8, swingV);
      // Ghế ngồi màu xanh teal
      addBox(teals, sx - 0.38, sx + 0.38, 0.55, 0.62, swingV - 0.22, swingV + 0.22);
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
      fasciaMaroonGeo: safeMerge(maroons),
      lettersWhiteGeo: safeMerge(whites),
      livingWallGeo: safeMerge(livingWalls),
      accentTealGeo: safeMerge(teals),
      frontYardGeo: safeMerge(frontYards),
    };
  }, [building]);

  return (
    <group position={[originX, 0, originZ]} rotation={[0, rotY, 0]}>
      {/* 1. Nền hiên & bậc bê tông */}
      {plinthGeo && (
        <mesh geometry={plinthGeo} receiveShadow>
          <meshStandardMaterial color="#d6d3d1" roughness={0.85} />
        </mesh>
      )}

      {/* 2. Thân tường căn tin */}
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

      {/* 3. Fascia mặt tiền màu nâu đỏ mận (t073s) */}
      {fasciaMaroonGeo && (
        <mesh geometry={fasciaMaroonGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#6b2626" roughness={0.5} />
        </mesh>
      )}

      {/* 4. Chữ 3D EIU CANTEEN màu trắng & biển hiệu */}
      {lettersWhiteGeo && (
        <mesh geometry={lettersWhiteGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
      )}

      {/* 5. Mảng tường cây xanh đứng (Living vertical wall) */}
      {livingWallGeo && (
        <mesh geometry={livingWallGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#3f6212" roughness={0.88} />
        </mesh>
      )}

      {/* 6. Lam trang trí caro & xích đu xanh ngọc (Teal) */}
      {accentTealGeo && (
        <mesh geometry={accentTealGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#0d9488" roughness={0.55} />
        </mesh>
      )}

      {/* 7. Bãi cỏ sân trước căn tin */}
      {frontYardGeo && (
        <mesh geometry={frontYardGeo} receiveShadow>
          <meshStandardMaterial color="#4d7c0f" roughness={0.9} />
        </mesh>
      )}

      {/* 8. Cửa kính thông thoáng */}
      {glassGeo && (
        <mesh geometry={glassGeo}>
          <meshStandardMaterial color="#33556e" roughness={0.22} metalness={0.45} transparent opacity={0.6} />
        </mesh>
      )}

      {/* 9. Hệ khung thép, cột, xích đu, ghế */}
      {steelGeo && (
        <mesh geometry={steelGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#334155" roughness={0.6} metalness={0.4} />
        </mesh>
      )}

      {/* 10. Mái tôn căn tin */}
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
    </group>
  );
}
