import { useMemo } from 'react';
import { BoxGeometry, BufferGeometry } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { POND_BASINS, POND_ROTATION_Y } from './pondLayout';
import { useSnowStore } from '../../store/useSnowStore';

export default function Pond() {
  const isSnowing = useSnowStore((s) => s.isSnowing);
  const { rimGeometry, waterGeometry, basinFloorGeometry } = useMemo(() => {
    const rimGeos: BufferGeometry[] = [];
    const waterGeos: BufferGeometry[] = [];
    const floorGeos: BufferGeometry[] = [];

    const groundY = 0.15;
    const rimHeight = 0.6; // Cao ~0.6m so với mặt đất
    const rimTopY = groundY + rimHeight;
    const rimThickness = 0.4;
    const waterY = rimTopY - 0.08; // Mặt nước thấp hơn thành hồ 8cm

    POND_BASINS.forEach((b) => {
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
    });

    const mergedRim = BufferGeometryUtils.mergeGeometries(rimGeos);
    const mergedWater = BufferGeometryUtils.mergeGeometries(waterGeos);
    const mergedFloor = BufferGeometryUtils.mergeGeometries(floorGeos);

    mergedRim.rotateY(POND_ROTATION_Y);
    mergedWater.rotateY(POND_ROTATION_Y);
    mergedFloor.rotateY(POND_ROTATION_Y);

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

      {/* Mặt nước xanh ngọc phẳng / đóng băng khi tuyết rơi */}
      <mesh geometry={waterGeometry} receiveShadow>
        <meshStandardMaterial
          color={isSnowing ? '#93c5fd' : '#06b6d4'}
          roughness={isSnowing ? 0.35 : 0.12}
          metalness={isSnowing ? 0.05 : 0.15}
        />
      </mesh>

      {/* Thành hồ bê tông cao 0.6m so với mặt đất */}
      <mesh geometry={rimGeometry} castShadow receiveShadow>
        <meshStandardMaterial color={isSnowing ? '#e2e8f0' : '#cbd5e1'} roughness={0.6} />
      </mesh>
    </group>
  );
}
