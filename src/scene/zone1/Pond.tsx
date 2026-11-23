import { useMemo } from 'react';
import { BoxGeometry, CylinderGeometry, BufferGeometry } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { POND_BASINS, POND_ROTATION_Y } from './pondLayout';

/**
 * Hồ nước khuôn viên EIU — 3 hồ bậc thang.
 * Nâng cấp theo clip thực tế (t001s, t005s, t009s):
 * - Bậc thang bê tông giật cấp phía bờ Tây nhìn ra quảng trường vòng xoay.
 * - Gờ mép bậc thang có dải sơn màu vàng an toàn (#eab308) rực rỡ đặc trưng.
 * - Hàng chậu hoa giấy (bougainvillea) tròn màu tối xếp dọc bờ hồ với hoa hồng/cam nở rộ.
 * - Chậu đài đá trang trí phong cách công viên.
 */
export default function Pond() {
  const {
    rimGeometry,
    waterGeometry,
    basinFloorGeometry,
    yellowEdgeGeometry,
    potsGeometry,
    flowersPinkGeometry,
    flowersOrangeGeometry,
    urnGeometry,
  } = useMemo(() => {
    const rimGeos: BufferGeometry[] = [];
    const waterGeos: BufferGeometry[] = [];
    const floorGeos: BufferGeometry[] = [];
    const yellowGeos: BufferGeometry[] = [];
    const potGeos: BufferGeometry[] = [];
    const pinkGeos: BufferGeometry[] = [];
    const orangeGeos: BufferGeometry[] = [];
    const urnGeos: BufferGeometry[] = [];

    const groundY = 0.15;
    const rimHeight = 0.6; // Cao ~0.6m so với mặt đất
    const rimTopY = groundY + rimHeight;
    const rimThickness = 0.4;
    const waterY = rimTopY - 0.08; // Mặt nước thấp hơn thành hồ 8cm

    POND_BASINS.forEach((b, basinIdx) => {
      const w = b.maxU - b.minU;
      const d = b.maxV - b.minV;
      const midU = (b.minU + b.maxU) / 2;
      const midV = (b.minV + b.maxV) / 2;

      // 1. Đáy hồ
      const floor = new BoxGeometry(w - rimThickness * 2, 0.05, d - rimThickness * 2);
      floor.translate(midU, groundY + 0.025, midV);
      floorGeos.push(floor);

      // 2. Mặt nước xanh ngọc
      const water = new BoxGeometry(w - rimThickness * 2, 0.04, d - rimThickness * 2);
      water.translate(midU, waterY, midV);
      waterGeos.push(water);

      // 3. Bốn cạnh thành hồ bao quanh
      // Cạnh Bắc & Nam
      const rimNorth = new BoxGeometry(w, rimHeight, rimThickness);
      rimNorth.translate(midU, groundY + rimHeight / 2, b.minV + rimThickness / 2);
      rimGeos.push(rimNorth);

      const rimSouth = new BoxGeometry(w, rimHeight, rimThickness);
      rimSouth.translate(midU, groundY + rimHeight / 2, b.maxV - rimThickness / 2);
      rimGeos.push(rimSouth);

      // Cạnh Tây & Đông
      const rimWest = new BoxGeometry(rimThickness, rimHeight, d - rimThickness * 2);
      rimWest.translate(b.minU + rimThickness / 2, groundY + rimHeight / 2, midV);
      rimGeos.push(rimWest);

      const rimEast = new BoxGeometry(rimThickness, rimHeight, d - rimThickness * 2);
      rimEast.translate(b.maxU - rimThickness / 2, groundY + rimHeight / 2, midV);
      rimGeos.push(rimEast);

      // 4. BẬC THANG BÊ TÔNG BỜ TÂY & GỜ MÉT SƠN VÀNG (t001s, t005s)
      if (basinIdx === 0) {
        // Hồ 1 (phía Tây quảng trường): hệ 3 bậc thang bê tông giật cấp
        const numSteps = 3;
        const stepDepth = 0.65;
        const stepRise = 0.18;

        for (let s = 0; s < numSteps; s++) {
          const stepU = b.minU - (s + 0.5) * stepDepth;
          const stepY = groundY + (numSteps - s) * stepRise;

          // Bậc thang bê tông xám
          const stepBox = new BoxGeometry(stepDepth, stepY - groundY, d + 1.2);
          stepBox.translate(stepU, groundY + (stepY - groundY) * 0.5, midV);
          rimGeos.push(stepBox);

          // Gờ mép bậc thang sơn màu vàng an toàn (t001s, t005s)
          const yellowStripe = new BoxGeometry(0.12, 0.02, d + 1.2);
          yellowStripe.translate(stepU - stepDepth * 0.42, stepY + 0.01, midV);
          yellowGeos.push(yellowStripe);
        }

        // Hàng chậu hoa giấy (Bougainvillea) xếp dọc bậc thang bờ hồ (t001s, t005s, t009s)
        const potSpacing = 2.4;
        const numPots = Math.floor(d / potSpacing);
        for (let p = 0; p <= numPots; p++) {
          const potV = b.minV + 0.8 + p * potSpacing;
          const potU = b.minU - 1.2;
          const potBaseY = groundY + 2 * stepRise;

          // Thân chậu gốm tròn màu tối
          const pot = new CylinderGeometry(0.32, 0.22, 0.38, 10);
          pot.translate(potU, potBaseY + 0.19, potV);
          potGeos.push(pot);

          // Đất trong chậu
          const soil = new CylinderGeometry(0.28, 0.28, 0.05, 8);
          soil.translate(potU, potBaseY + 0.36, potV);
          rimGeos.push(soil);

          // Tán hoa giấy nở rộ (xen kẽ hồng cánh sen và cam rực rỡ)
          const flowerCluster = new CylinderGeometry(0.55, 0.35, 0.42, 8);
          flowerCluster.translate(potU, potBaseY + 0.58, potV);

          if (p % 2 === 0) {
            pinkGeos.push(flowerCluster);
          } else {
            orangeGeos.push(flowerCluster);
          }
        }

        // Đôn chậu hoa đài phun đá kiểu cổ (như thấy trong t001s góc trái)
        const urnV = midV - 5.5;
        const urnU = b.minU - 2.8;
        const urnBaseY = groundY;
        const urnPedestal = new CylinderGeometry(0.22, 0.28, 0.65, 8);
        urnPedestal.translate(urnU, urnBaseY + 0.325, urnV);
        urnGeos.push(urnPedestal);

        const urnBowl = new CylinderGeometry(0.52, 0.25, 0.32, 10);
        urnBowl.translate(urnU, urnBaseY + 0.78, urnV);
        urnGeos.push(urnBowl);

        const urnFlowers = new CylinderGeometry(0.62, 0.45, 0.35, 8);
        urnFlowers.translate(urnU, urnBaseY + 1.05, urnV);
        pinkGeos.push(urnFlowers);
      }
    });

    const safe = (arrGeos: BufferGeometry[]) => (arrGeos.length > 0 ? BufferGeometryUtils.mergeGeometries(arrGeos) : null);

    const mergedRim = safe(rimGeos);
    const mergedWater = safe(waterGeos);
    const mergedFloor = safe(floorGeos);
    const mergedYellow = safe(yellowGeos);
    const mergedPots = safe(potGeos);
    const mergedPink = safe(pinkGeos);
    const mergedOrange = safe(orangeGeos);
    const mergedUrn = safe(urnGeos);

    if (mergedRim) mergedRim.rotateY(POND_ROTATION_Y);
    if (mergedWater) mergedWater.rotateY(POND_ROTATION_Y);
    if (mergedFloor) mergedFloor.rotateY(POND_ROTATION_Y);
    if (mergedYellow) mergedYellow.rotateY(POND_ROTATION_Y);
    if (mergedPots) mergedPots.rotateY(POND_ROTATION_Y);
    if (mergedPink) mergedPink.rotateY(POND_ROTATION_Y);
    if (mergedOrange) mergedOrange.rotateY(POND_ROTATION_Y);
    if (mergedUrn) mergedUrn.rotateY(POND_ROTATION_Y);

    rimGeos.forEach((g) => g.dispose());
    waterGeos.forEach((g) => g.dispose());
    floorGeos.forEach((g) => g.dispose());
    yellowGeos.forEach((g) => g.dispose());
    potGeos.forEach((g) => g.dispose());
    pinkGeos.forEach((g) => g.dispose());
    orangeGeos.forEach((g) => g.dispose());
    urnGeos.forEach((g) => g.dispose());

    return {
      rimGeometry: mergedRim,
      waterGeometry: mergedWater,
      basinFloorGeometry: mergedFloor,
      yellowEdgeGeometry: mergedYellow,
      potsGeometry: mergedPots,
      flowersPinkGeometry: mergedPink,
      flowersOrangeGeometry: mergedOrange,
      urnGeometry: mergedUrn,
    };
  }, []);

  return (
    <group>
      {/* 1. Đáy hồ lót gạch xanh */}
      {basinFloorGeometry && (
        <mesh geometry={basinFloorGeometry} receiveShadow>
          <meshStandardMaterial color="#0284c7" roughness={0.7} />
        </mesh>
      )}

      {/* 2. Mặt nước xanh ngọc phẳng */}
      {waterGeometry && (
        <mesh geometry={waterGeometry} receiveShadow>
          <meshStandardMaterial
            color="#06b6d4"
            roughness={0.12}
            metalness={0.15}
          />
        </mesh>
      )}

      {/* 3. Thành hồ & bậc thang bê tông */}
      {rimGeometry && (
        <mesh geometry={rimGeometry} castShadow receiveShadow>
          <meshStandardMaterial color="#cbd5e1" roughness={0.65} />
        </mesh>
      )}

      {/* 4. Gờ mép bậc thang sơn màu vàng an toàn (t001s, t005s) */}
      {yellowEdgeGeometry && (
        <mesh geometry={yellowEdgeGeometry} receiveShadow>
          <meshStandardMaterial color="#eab308" roughness={0.5} />
        </mesh>
      )}

      {/* 5. Chậu gốm đen trồng hoa giấy */}
      {potsGeometry && (
        <mesh geometry={potsGeometry} castShadow receiveShadow>
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
      )}

      {/* 6. Hoa giấy hồng cánh sen nở rộ (t001s, t009s) */}
      {flowersPinkGeometry && (
        <mesh geometry={flowersPinkGeometry} castShadow>
          <meshStandardMaterial color="#ec4899" roughness={0.6} />
        </mesh>
      )}

      {/* 7. Hoa giấy cam rực rỡ (t001s) */}
      {flowersOrangeGeometry && (
        <mesh geometry={flowersOrangeGeometry} castShadow>
          <meshStandardMaterial color="#f97316" roughness={0.6} />
        </mesh>
      )}

      {/* 8. Đài đá trang trí phong cách công viên */}
      {urnGeometry && (
        <mesh geometry={urnGeometry} castShadow receiveShadow>
          <meshStandardMaterial color="#94a3b8" roughness={0.8} />
        </mesh>
      )}
    </group>
  );
}
