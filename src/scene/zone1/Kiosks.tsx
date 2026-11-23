import { useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute, DoubleSide } from 'three';
import type { Building } from '../../types';
import { addBox, addCylinder, safeMerge } from '../kit/geometryHelpers';
import { add3DTextAlongZ } from '../kit/blockText';
import { getOrCreateVineTexture, addVineCurtain } from '../nature/vineTexture';

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
 * Highlands Coffee — Ki-ốt kiểu toa tàu bo góc màu đỏ đặc trưng,
 * chữ 3D "HIGHLANDS" trắng trên nóc, sàn gỗ đỏ ngoài trời, khu bàn ghế cafe laptop,
 * rèm dây leo rủ và vách gạch hoa gió (đối chiếu clip t041s, t045s, t049s).
 */
export function HighlandsKiosk({ building, isHovered, isSelected }: KioskProps) {
  const emissiveColor = isSelected ? '#60a5fa' : isHovered ? '#38bdf8' : '#000000';
  const emissiveIntensity = isSelected ? 0.25 : isHovered ? 0.16 : 0;

  const { cx, cz } = getBboxCenter(building);

  const {
    deckGeo,
    kioskRedGeo,
    kioskWhiteGeo,
    glassGeo,
    interiorGeo,
    menuGeo,
    seatingGeo,
    steelGeo,
    vinesGeo,
    screenGeo,
  } = useMemo(() => {
    const decks: BufferGeometry[] = [];
    const reds: BufferGeometry[] = [];
    const whites: BufferGeometry[] = [];
    const glass: BufferGeometry[] = [];
    const interiors: BufferGeometry[] = [];
    const menus: BufferGeometry[] = [];
    const seatings: BufferGeometry[] = [];
    const steels: BufferGeometry[] = [];
    const screens: BufferGeometry[] = [];

    // ==========================================
    // 1. SÀN GỖ ĐỎ NGOÀI TRỜI (TIMBER DECKING)
    // ==========================================
    // Sàn nâng cao 0.20m, kích thước 10.4m x 9.2m
    const deckMinX = -5.6;
    const deckMaxX = 4.8;
    const deckMinZ = -4.6;
    const deckMaxZ = 4.6;
    const deckH = 0.20;

    addBox(decks, deckMinX, deckMaxX, 0.0, deckH, deckMinZ, deckMaxZ);
    // Bậc tam cấp bước lên sàn ở hướng Tây (-X) và Nam (+Z)
    addBox(decks, deckMinX - 0.45, deckMinX, 0.0, deckH * 0.5, deckMinZ + 0.6, deckMaxZ - 0.6);
    addBox(decks, deckMinX + 0.6, deckMaxX - 0.6, 0.0, deckH * 0.5, deckMaxZ, deckMaxZ + 0.45);

    // ==========================================
    // 2. THÂN KI-ỐT TOA TÀU ĐỎ HIGHLANDS
    // ==========================================
    // Thân ki-ốt đặt tại X in [1.2, 4.4], Z in [-3.8, 3.8] (dài 7.6m, rộng 3.2m, cao 3.5m)
    const kMinX = 1.2;
    const kMaxX = 4.4;
    const kMinZ = -3.8;
    const kMaxZ = 3.8;
    const kBaseY = deckH;
    const kRoofY = kBaseY + 3.3;

    // Nửa dưới màu đỏ mận đặc trưng Highlands (Y: deckH -> 1.35)
    addBox(reds, kMinX, kMaxX, kBaseY, kBaseY + 1.15, kMinZ, kMaxZ);

    // Tường sau (+X) và 2 tường hồi (Z = -3.8 và Z = +3.8) sơn đỏ
    addBox(reds, kMaxX - 0.25, kMaxX, kBaseY + 1.15, kRoofY - 0.35, kMinZ, kMaxZ);
    addBox(reds, kMinX, kMaxX, kBaseY + 1.15, kRoofY - 0.35, kMinZ, kMinZ + 0.4);
    addBox(reds, kMinX, kMaxX, kBaseY + 1.15, kRoofY - 0.35, kMaxZ - 0.4, kMaxZ);

    // Khe hút gió/lam đen chân ki-ốt
    addBox(steels, kMinX - 0.02, kMinX + 0.02, kBaseY + 0.08, kBaseY + 0.32, kMinZ + 0.5, kMaxZ - 0.5);

    const corners: readonly (readonly [number, number])[] = [
      [kMinX + 0.35, kMinZ + 0.35],
      [kMaxX - 0.35, kMinZ + 0.35],
      [kMinX + 0.35, kMaxZ - 0.35],
      [kMaxX - 0.35, kMaxZ - 0.35],
    ];
    for (const [bx, bz] of corners) {
      addCylinder(reds, 0.35, 0.35, 2.6, 12, bx, kBaseY + 1.3, bz);
    }

    // Biển logo tròn đỏ bên hông phía Bắc (Z = kMinZ - 0.02)
    addCylinder(reds, 0.46, 0.46, 0.06, 16, (kMinX + kMaxX) * 0.5, kBaseY + 1.9, kMinZ - 0.02, Math.PI / 2);
    addCylinder(whites, 0.42, 0.42, 0.08, 16, (kMinX + kMaxX) * 0.5, kBaseY + 1.9, kMinZ - 0.02, Math.PI / 2);
    addCylinder(reds, 0.36, 0.36, 0.10, 16, (kMinX + kMaxX) * 0.5, kBaseY + 1.9, kMinZ - 0.02, Math.PI / 2);

    // ==========================================
    // 3. MÁI BO CONG & CHỮ NỔI 3D "HIGHLANDS"
    // ==========================================
    // Fascia màu đỏ toa tàu để làm nền nổi bật cho chữ HIGHLANDS trắng
    addBox(reds, kMinX - 0.08, kMaxX + 0.08, kRoofY - 0.4, kRoofY + 0.10, kMinZ - 0.08, kMaxZ + 0.08);
    // Viền mép trên nóc màu trắng kem / bạc sáng
    addBox(whites, kMinX - 0.1, kMaxX + 0.1, kRoofY + 0.10, kRoofY + 0.16, kMinZ - 0.1, kMaxZ + 0.1);
    // Bo vòm nóc phía trên
    addBox(whites, kMinX + 0.2, kMaxX - 0.2, kRoofY + 0.16, kRoofY + 0.36, kMinZ + 0.2, kMaxZ - 0.2);

    // Chữ 3D "HIGHLANDS" màu trắng nổi trên fascia mặt tiền (hướng -X nhìn ra hồ)
    add3DTextAlongZ(
      whites,
      'HIGHLANDS',
      kMinX - 0.12,
      kRoofY - 0.32,
      -2.4,
      0.46,
      0.44,
      0.08,
      0.14,
      1
    );

    // ==========================================
    // 4. CỬA KÍNH PANORAMA & NỘI THẤT QUẦY BAR
    // ==========================================
    // Mặt kính trong suốt phục vụ
    addBox(glass, kMinX - 0.02, kMinX + 0.04, kBaseY + 1.15, kRoofY - 0.4, kMinZ + 0.4, kMaxZ - 0.4);
    // Khung kính chia ô
    for (let i = 0; i <= 3; i++) {
      const z = kMinZ + 0.4 + (i / 3) * (kMaxZ - kMinZ - 0.8);
      addBox(steels, kMinX - 0.04, kMinX + 0.06, kBaseY + 1.15, kRoofY - 0.4, z - 0.03, z + 0.03);
    }
    // Gờ bệ quầy bar
    addBox(steels, kMinX - 0.18, kMinX + 0.25, kBaseY + 1.12, kBaseY + 1.20, kMinZ + 0.4, kMaxZ - 0.4);

    // Bên trong: quầy pha chế + máy pha cafe
    addBox(interiors, kMinX + 0.35, kMinX + 1.15, kBaseY, kBaseY + 1.05, kMinZ + 0.5, kMaxZ - 0.5);
    // Kệ đồ uống phía sau
    addBox(interiors, kMaxX - 0.45, kMaxX - 0.05, kBaseY + 0.6, kRoofY - 0.6, kMinZ + 0.5, kMaxZ - 0.5);
    // Bảng menu màu xanh lá sáng đèn (Green menu board)
    addBox(menus, kMinX + 0.15, kMinX + 0.22, kRoofY - 0.95, kRoofY - 0.45, kMinZ + 0.6, kMaxZ - 0.6);

    // Máy pha espresso trên quầy
    addBox(steels, kMinX + 0.45, kMinX + 0.95, kBaseY + 1.05, kBaseY + 1.45, -0.6, 0.4);

    // ==========================================
    // 5. KHU BÀN GHẾ CAFE NGOÀI TRỜI (LAPTOP & COFFEE)
    // ==========================================
    // 4 bàn cafe chữ nhật gỗ tối + khung kim loại
    const tablePositions = [
      { x: -1.2, z: -2.2 },
      { x: -1.2, z: 1.8 },
      { x: -3.6, z: -2.2 },
      { x: -3.6, z: 1.8 },
    ];

    tablePositions.forEach((tp) => {
      // Mặt bàn chữ nhật
      addBox(seatings, tp.x - 0.7, tp.x + 0.7, kBaseY + 0.68, kBaseY + 0.73, tp.z - 0.45, tp.z + 0.45);
      // Chân bàn thép đen
      addBox(steels, tp.x - 0.04, tp.x + 0.04, kBaseY, kBaseY + 0.68, tp.z - 0.04, tp.z + 0.04);
      addBox(steels, tp.x - 0.35, tp.x + 0.35, kBaseY, kBaseY + 0.03, tp.z - 0.35, tp.z + 0.35);

      // 4 ghế tựa nan sắt quanh bàn
      for (const dz of [-0.65, 0.65]) {
        for (const dx of [-0.35, 0.35]) {
          const gx = tp.x + dx;
          const gz = tp.z + dz;
          // Mặt ngồi
          addBox(steels, gx - 0.2, gx + 0.2, kBaseY + 0.42, kBaseY + 0.45, gz - 0.2, gz + 0.2);
          // Chân ghế
          addCylinder(steels, 0.015, 0.015, 0.42, 6, gx - 0.16, kBaseY + 0.21, gz - 0.16);
          addCylinder(steels, 0.015, 0.015, 0.42, 6, gx + 0.16, kBaseY + 0.21, gz - 0.16);
          addCylinder(steels, 0.015, 0.015, 0.42, 6, gx - 0.16, kBaseY + 0.21, gz + 0.16);
          addCylinder(steels, 0.015, 0.015, 0.42, 6, gx + 0.16, kBaseY + 0.21, gz + 0.16);
          // Lưng tựa nan ngang
          const backZ = gz + (dz > 0 ? 0.18 : -0.18);
          addBox(steels, gx - 0.2, gx + 0.2, kBaseY + 0.45, kBaseY + 0.85, backZ - 0.02, backZ + 0.02);
        }
      }

      // Laptop bạc & ly cafe trên bàn
      addBox(whites, tp.x - 0.35, tp.x - 0.05, kBaseY + 0.73, kBaseY + 0.74, tp.z - 0.2, tp.z + 0.05);
      addBox(whites, tp.x - 0.35, tp.x - 0.05, kBaseY + 0.74, kBaseY + 0.94, tp.z - 0.2, tp.z - 0.18);
      addCylinder(whites, 0.04, 0.03, 0.10, 8, tp.x + 0.25, kBaseY + 0.78, tp.z + 0.15);
    });

    // ==========================================
    // 6. KHUNG PERGOLA THÉP ĐEN & RÈM DÂY LEO RỦ
    // ==========================================
    // Cột thép đen đỡ mái hiên ngoài trời
    const pergolaH = 3.2;
    for (const pz of [-4.2, 0.0, 4.2]) {
      addBox(steels, deckMinX + 0.1, deckMinX + 0.26, kBaseY, kBaseY + pergolaH, pz - 0.08, pz + 0.08);
      // Xà ngang nối từ cột tới nóc ki-ốt
      addBox(steels, deckMinX + 0.1, kMinX + 0.1, kBaseY + pergolaH - 0.12, kBaseY + pergolaH, pz - 0.06, pz + 0.06);
    }
    // Dầm dọc chạy dọc mép hiên
    addBox(steels, deckMinX + 0.08, deckMinX + 0.28, kBaseY + pergolaH - 0.12, kBaseY + pergolaH, deckMinZ + 0.2, deckMaxZ - 0.2);

    // Mái kính / lam che nắng phía trên
    addBox(glass, deckMinX + 0.1, kMinX + 0.1, kBaseY + pergolaH, kBaseY + pergolaH + 0.05, deckMinZ + 0.3, deckMaxZ - 0.3);

    // Rèm dây leo buông rủ (hanging vines) từ xà mép hiên và khu bàn cafe (t041s, t045s) — Quad lá mỏng, texture alpha rủ mềm
    const vPos: number[] = [];
    const vNorm: number[] = [];
    const vUvs: number[] = [];
    const vInd: number[] = [];

    const topY = kBaseY + pergolaH;
    const numEavesPanels = 14;
    const eavesSpanZ = (deckMaxZ - 0.4) - (deckMinZ + 0.4);
    const eavesStepZ = eavesSpanZ / numEavesPanels;
    const vx = deckMinX + 0.18;

    for (let v = 0; v < numEavesPanels; v++) {
      const z0 = deckMinZ + 0.4 + v * eavesStepZ;
      const z1 = z0 + eavesStepZ;
      const vLen = 0.85 + Math.sin(v * 1.8) * 0.45 + Math.cos(v * 1.1) * 0.25;

      addVineCurtain(vPos, vNorm, vUvs, vInd, [vx, z0], [vx, z1], topY, vLen, -1, 0, 0);
      // Dải so le lùi vào trong một chút
      const vLen2 = 0.70 + Math.cos(v * 1.6) * 0.35;
      addVineCurtain(vPos, vNorm, vUvs, vInd, [vx, z0], [vx, z1], topY, vLen2, -1, 0, 0.06);
    }

    // Hàng rèm dây leo rủ trước dãy bàn cafe
    const tableSpanZ = 6.4;
    const numTablePanels = 8;
    const tableStepZ = tableSpanZ / numTablePanels;
    const tx = -1.6;

    for (let v = 0; v < numTablePanels; v++) {
      const z0 = -3.2 + v * tableStepZ;
      const z1 = z0 + tableStepZ;
      const vLen = 0.80 + Math.sin(v * 2.2) * 0.40;
      addVineCurtain(vPos, vNorm, vUvs, vInd, [tx, z0], [tx, z1], topY, vLen, -1, 0, 0);
    }

    const vinesGeo = new BufferGeometry();
    vinesGeo.setAttribute('position', new Float32BufferAttribute(vPos, 3));
    vinesGeo.setAttribute('normal', new Float32BufferAttribute(vNorm, 3));
    vinesGeo.setAttribute('uv', new Float32BufferAttribute(vUvs, 2));
    vinesGeo.setIndex(vInd);

    // ==========================================
    // 7. VÁCH GẠCH HOA GIÓ (BREEZE BLOCK SCREEN)
    // ==========================================
    // Vách ngăn trang trí ở cạnh Nam (Z = deckMaxZ - 0.3)
    const screenZ = deckMaxZ - 0.35;
    const screenW = 3.6;
    const screenH = 2.2;
    addBox(screens, deckMinX + 0.6, deckMinX + 0.6 + screenW, kBaseY, kBaseY + screenH, screenZ - 0.08, screenZ + 0.08);

    return {
      deckGeo: safeMerge(decks),
      kioskRedGeo: safeMerge(reds),
      kioskWhiteGeo: safeMerge(whites),
      glassGeo: safeMerge(glass),
      interiorGeo: safeMerge(interiors),
      menuGeo: safeMerge(menus),
      seatingGeo: safeMerge(seatings),
      steelGeo: safeMerge(steels),
      vinesGeo,
      screenGeo: safeMerge(screens),
    };
  }, []);

  const vineTexture = useMemo(() => getOrCreateVineTexture(), []);

  return (
    <group position={[cx, 0, cz]}>
      {/* 1. Sàn gỗ decking màu nâu đỏ ấm */}
      {deckGeo && (
        <mesh geometry={deckGeo} receiveShadow>
          <meshStandardMaterial color="#853826" roughness={0.82} />
        </mesh>
      )}

      {/* 2. Thân toa tàu đỏ mận Highlands */}
      {kioskRedGeo && (
        <mesh geometry={kioskRedGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color="#a81d22"
            roughness={0.48}
            metalness={0.12}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      )}

      {/* 3. Fascia nóc trắng & chữ 3D HIGHLANDS */}
      {kioskWhiteGeo && (
        <mesh geometry={kioskWhiteGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.25} roughness={0.3} />
        </mesh>
      )}

      {/* 4. Cửa kính panorama & mái kính */}
      {glassGeo && (
        <mesh geometry={glassGeo}>
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.45} roughness={0.1} metalness={0.8} />
        </mesh>
      )}

      {/* 5. Nội thất quầy bar gỗ & kệ */}
      {interiorGeo && (
        <mesh geometry={interiorGeo} receiveShadow>
          <meshStandardMaterial color="#b45309" roughness={0.7} />
        </mesh>
      )}

      {/* 6. Bảng menu xanh lá sáng đèn */}
      {menuGeo && (
        <mesh geometry={menuGeo}>
          <meshStandardMaterial color="#15803d" emissive="#16a34a" emissiveIntensity={0.5} roughness={0.4} />
        </mesh>
      )}

      {/* 7. Bàn cafe gỗ xám tối */}
      {seatingGeo && (
        <mesh geometry={seatingGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#334155" roughness={0.75} />
        </mesh>
      )}

      {/* 8. Khung thép hộp & ghế nan kim loại đen */}
      {steelGeo && (
        <mesh geometry={steelGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#1e293b" roughness={0.55} metalness={0.65} />
        </mesh>
      )}

      {/* 9. Rèm dây leo buông rủ xanh mướt (t041s, t045s) */}
      {vinesGeo && (
        <mesh geometry={vinesGeo} castShadow>
          <meshStandardMaterial
            map={vineTexture ?? undefined}
            transparent
            alphaTest={0.15}
            depthWrite
            side={DoubleSide}
            roughness={0.65}
            color="#ffffff"
            emissive="#84cc16"
            emissiveIntensity={0.06}
          />
        </mesh>
      )}

      {/* 10. Vách gạch hoa gió */}
      {screenGeo && (
        <mesh geometry={screenGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
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
