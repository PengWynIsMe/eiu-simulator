import { useMemo } from 'react';
import { BoxGeometry, BufferGeometry } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

interface BasinDef {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const BASINS: BasinDef[] = [
  // Hồ 1 (phía Tây, gần quảng trường vòng xoay)
  { minX: 93, maxX: 104, minZ: -62, maxZ: -14 },
  // Hồ 2 (ở giữa, ngăn cách bởi 2 cây cầu)
  { minX: 110, maxX: 120, minZ: -62, maxZ: -14 },
  // Hồ 3 (phía Đông, gần Highlands Coffee)
  { minX: 127, maxX: 142, minZ: -62, maxZ: -14 },
];

export default function Pond() {
  const { rimGeometry, waterGeometry, basinFloorGeometry } = useMemo(() => {
    const rimGeos: BufferGeometry[] = [];
    const waterGeos: BufferGeometry[] = [];
    const floorGeos: BufferGeometry[] = [];

    const groundY = 0.15;
    const rimHeight = 0.6; // Cao ~0.6m so với mặt đất
    const rimTopY = groundY + rimHeight;
    const rimThickness = 0.4;
    const waterY = rimTopY - 0.08; // Mặt nước thấp hơn thành hồ 8cm

    BASINS.forEach((b) => {
      const w = b.maxX - b.minX;
      const d = b.maxZ - b.minZ;
      const midX = (b.minX + b.maxX) / 2;
      const midZ = (b.minZ + b.maxZ) / 2;

      // 1. Đáy hồ
      const floor = new BoxGeometry(w - rimThickness * 2, 0.05, d - rimThickness * 2);
      floor.translate(midX, groundY + 0.025, midZ);
      floorGeos.push(floor);

      // 2. Mặt nước xanh ngọc
      const water = new BoxGeometry(w - rimThickness * 2, 0.04, d - rimThickness * 2);
      water.translate(midX, waterY, midZ);
      waterGeos.push(water);

      // 3. Bốn cạnh thành hồ bao quanh
      // Cạnh Bắc & Nam
      const rimNorth = new BoxGeometry(w, rimHeight, rimThickness);
      rimNorth.translate(midX, groundY + rimHeight / 2, b.minZ + rimThickness / 2);
      rimGeos.push(rimNorth);

      const rimSouth = new BoxGeometry(w, rimHeight, rimThickness);
      rimSouth.translate(midX, groundY + rimHeight / 2, b.maxZ - rimThickness / 2);
      rimGeos.push(rimSouth);

      // Cạnh Tây & Đông
      const rimWest = new BoxGeometry(rimThickness, rimHeight, d - rimThickness * 2);
      rimWest.translate(b.minX + rimThickness / 2, groundY + rimHeight / 2, midZ);
      rimGeos.push(rimWest);

      const rimEast = new BoxGeometry(rimThickness, rimHeight, d - rimThickness * 2);
      rimEast.translate(b.maxX - rimThickness / 2, groundY + rimHeight / 2, midZ);
      rimGeos.push(rimEast);
    });

    const mergedRim = BufferGeometryUtils.mergeGeometries(rimGeos);
    const mergedWater = BufferGeometryUtils.mergeGeometries(waterGeos);
    const mergedFloor = BufferGeometryUtils.mergeGeometries(floorGeos);

    rimGeos.forEach((g) => g.dispose());
    waterGeos.forEach((g) => g.dispose());
    floorGeos.forEach((g) => g.dispose());

    return { rimGeometry: mergedRim, waterGeometry: mergedWater, basinFloorGeometry: mergedFloor };
  }, []);

  return (
    <group>
      {/* Đáy hồ lót gạch xanh */}
      <mesh geometry={basinFloorGeometry} receiveShadow>
        <meshStandardMaterial color="#0284c7" roughness={0.7} />
      </mesh>

      {/* Mặt nước xanh ngọc phẳng, hơi phản chiếu */}
      <mesh geometry={waterGeometry} receiveShadow>
        <meshStandardMaterial
          color="#06b6d4"
          roughness={0.12}
          metalness={0.15}
        />
      </mesh>

      {/* Thành hồ bê tông cao 0.6m so với mặt đất */}
      <mesh geometry={rimGeometry} castShadow receiveShadow>
        <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
      </mesh>
    </group>
  );
}
