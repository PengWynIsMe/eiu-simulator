import { useEffect, useMemo } from 'react';
import { BoxGeometry, BufferGeometry, CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
import { useFrame } from '@react-three/fiber';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { POND_BASINS, POND_ROTATION_Y } from './pondLayout';
import { useSnowStore } from '../../store/useSnowStore';
import { GRASS, POND_RIM } from '../groundLevels';

function createWaterRippleTexture(): CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#12b6d4';
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y += 8) {
      for (let x = 0; x < size; x += 8) {
        const wave = Math.sin((x / size) * Math.PI * 4 + (y / size) * Math.PI * 2)
          * Math.cos((y / size) * Math.PI * 6 - (x / size) * Math.PI * 2);
        if (wave > 0.35) {
          ctx.fillStyle = `rgba(224, 247, 255, ${(wave - 0.35) * 0.45})`;
          ctx.fillRect(x, y, 7, 4);
        } else if (wave < -0.35) {
          ctx.fillStyle = `rgba(3, 105, 161, ${(-wave - 0.35) * 0.35})`;
          ctx.fillRect(x, y, 6, 4);
        }
      }
    }
  }
  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(6, 4);
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export default function Pond() {
  const isSnowing = useSnowStore((s) => s.isSnowing);
  const waterTex = useMemo(() => createWaterRippleTexture(), []);
  useEffect(() => () => waterTex.dispose(), [waterTex]);

  useFrame((_, delta) => {
    if (isSnowing) return;
    const dt = Math.min(delta, 0.05);
    waterTex.offset.x = (waterTex.offset.x + dt * 0.035) % 1;
    waterTex.offset.y = (waterTex.offset.y + dt * 0.018) % 1;
  });

  const { rimGeometry, waterGeometry, basinFloorGeometry } = useMemo(() => {
    const rimGeos: BufferGeometry[] = [];
    const waterGeos: BufferGeometry[] = [];
    const floorGeos: BufferGeometry[] = [];

    const groundY = GRASS;
    const rimTopY = POND_RIM;
    const rimHeight = rimTopY - groundY; // Cao ~0.53m so với mặt đất/cỏ
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

      {/* Mặt nước xanh ngọc gợn sóng / đóng băng khi tuyết rơi */}
      <mesh geometry={waterGeometry} receiveShadow>
        <meshStandardMaterial
          map={isSnowing ? null : waterTex}
          color={isSnowing ? '#93c5fd' : '#38bdf8'}
          roughness={isSnowing ? 0.35 : 0.14}
          metalness={isSnowing ? 0.05 : 0.18}
          transparent
          opacity={isSnowing ? 0.96 : 0.84}
        />
      </mesh>

      {/* Thành hồ bê tông cao 0.6m so với mặt đất */}
      <mesh geometry={rimGeometry} castShadow receiveShadow>
        <meshStandardMaterial color={isSnowing ? '#e2e8f0' : '#cbd5e1'} roughness={0.6} />
      </mesh>
    </group>
  );
}
