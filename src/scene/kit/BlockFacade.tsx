import { useMemo } from 'react';
import {
  Shape,
  ExtrudeGeometry,
  Path,
  BoxGeometry,
  BufferGeometry,
} from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Building } from '../../types';
import { FLOOR_HEIGHT } from '../../data';
import { expandShapePolygon, stripClosingPoint, toShapePoints } from './geometryHelpers';
import { useSnowStore } from '../../store/useSnowStore';

interface BlockFacadeProps {
  building: Building;
  isHovered?: boolean;
  isSelected?: boolean;
}

export default function BlockFacade({ building, isHovered, isSelected }: BlockFacadeProps) {
  const { height, floors, color, shape: buildingShape, id } = building;
  const isSnowing = useSnowStore((s) => s.isSnowing);

  const emissiveColor = isSelected ? '#60a5fa' : isHovered ? '#38bdf8' : '#000000';
  const emissiveIntensity = isSelected ? 0.35 : isHovered ? 0.2 : 0;

  // 1. Thân tường chính của tòa nhà
  const bodyGeometry = useMemo(() => {
    const shape = new Shape();
    const outerPts = toShapePoints(buildingShape.outer);
    outerPts.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));

    buildingShape.holes.forEach((hole) => {
      const path = new Path();
      const holePts = toShapePoints(hole);
      holePts.forEach(([x, y], i) => (i === 0 ? path.moveTo(x, y) : path.lineTo(x, y)));
      shape.holes.push(path);
    });

    return new ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
  }, [height, buildingShape]);

  // 2. Viền chỉ sàn sáng màu giữa các tầng (plinth + các tầng + diềm mái)
  const floorSlabsGeometry = useMemo(() => {
    const outerPts = toShapePoints(stripClosingPoint(buildingShape.outer));
    const expanded = expandShapePolygon(outerPts, 0.16);
    const shape = new Shape();
    expanded.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
    buildingShape.holes.forEach((hole) => {
      const path = new Path();
      const holePts = toShapePoints(stripClosingPoint(hole));
      holePts.forEach(([x, y], i) => (i === 0 ? path.moveTo(x, y) : path.lineTo(x, y)));
      shape.holes.push(path);
    });

    const geos: BufferGeometry[] = [];
    const plinth = new ExtrudeGeometry(shape, { depth: 0.24, bevelEnabled: false });
    plinth.rotateX(-Math.PI / 2);
    geos.push(plinth);

    for (let f = 1; f < floors; f++) {
      const slabGeo = new ExtrudeGeometry(shape, { depth: 0.28, bevelEnabled: false });
      slabGeo.rotateX(-Math.PI / 2);
      slabGeo.translate(0, f * FLOOR_HEIGHT - 0.14, 0);
      geos.push(slabGeo);
    }

    const cornice = new ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false });
    cornice.rotateX(-Math.PI / 2);
    cornice.translate(0, height - 0.14, 0);
    geos.push(cornice);

    const merged = BufferGeometryUtils.mergeGeometries(geos);
    geos.forEach((g) => g.dispose());
    return merged;
  }, [floors, height, buildingShape]);

  // 3. Dải cửa sổ và lam che nắng dọc theo các mặt đứng
  const facadeDetailGeometry = useMemo(() => {
    const outer = buildingShape.outer;
    const windowGeos: BufferGeometry[] = [];
    const louverGeos: BufferGeometry[] = [];

    // Xác định chiều quay của đa giác trên mặt phẳng XZ
    let area = 0;
    for (let i = 0; i < outer.length; i++) {
      const p1 = outer[i];
      const p2 = outer[(i + 1) % outer.length];
      if (p1 && p2) area += p1[0] * p2[1] - p2[0] * p1[1];
    }
    const isCCW = area > 0;

    for (let i = 0; i < outer.length; i++) {
      const p1 = outer[i];
      const p2 = outer[(i + 1) % outer.length];
      if (!p1 || !p2) continue;

      const dx = p2[0] - p1[0];
      const dz = p2[1] - p1[1];
      const segLen = Math.hypot(dx, dz);
      if (segLen < 8) continue;

      const angle = Math.atan2(dz, dx);
      // Pháp tuyến hướng ra ngoài tường
      const nx = isCCW ? dz / segLen : -dz / segLen;
      const nz = isCCW ? -dx / segLen : dx / segLen;
      const midX = (p1[0] + p2[0]) / 2;
      const midZ = (p1[1] + p2[1]) / 2;

      for (let f = 0; f < floors; f++) {
        const floorBase = f * FLOOR_HEIGHT;
        const winH = 2.0;
        const winY = floorBase + 1.1 + winH / 2;

        // Dải cửa sổ kính sẫm màu
        const winW = segLen - 1.2;
        const winBox = new BoxGeometry(winW, winH, 0.12);
        winBox.rotateY(-angle);
        winBox.translate(midX + nx * 0.15, winY, midZ + nz * 0.15);
        windowGeos.push(winBox);

        // Các thanh lam che nắng đứng cách đều nhau ~2.5m
        const numLouvers = Math.floor(winW / 2.5);
        for (let l = 1; l <= numLouvers; l++) {
          const t = l / (numLouvers + 1) - 0.5;
          const lx = midX + Math.cos(angle) * (t * winW);
          const lz = midZ + Math.sin(angle) * (t * winW);

          const louver = new BoxGeometry(0.08, winH + 0.1, 0.35);
          louver.rotateY(-angle);
          louver.translate(lx + nx * 0.3, winY, lz + nz * 0.3);
          louverGeos.push(louver);
        }
      }
    }

    const mergedWindows = windowGeos.length > 0 ? BufferGeometryUtils.mergeGeometries(windowGeos) : null;
    const mergedLouvers = louverGeos.length > 0 ? BufferGeometryUtils.mergeGeometries(louverGeos) : null;
    windowGeos.forEach((g) => g.dispose());
    louverGeos.forEach((g) => g.dispose());

    return { windows: mergedWindows, louvers: mergedLouvers };
  }, [buildingShape, floors]);

  // 4. Mái chìa xám sáng nhô ra 0.8m
  const roofGeometry = useMemo(() => {
    const outerPts = toShapePoints(stripClosingPoint(buildingShape.outer));
    const expandedOuter = expandShapePolygon(outerPts, 0.8);
    const shape = new Shape();
    expandedOuter.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));

    buildingShape.holes.forEach((hole) => {
      const path = new Path();
      const holePts = toShapePoints(stripClosingPoint(hole));
      holePts.forEach(([x, y], i) => (i === 0 ? path.moveTo(x, y) : path.lineTo(x, y)));
      shape.holes.push(path);
    });

    return new ExtrudeGeometry(shape, { depth: 0.4, bevelEnabled: false });
  }, [buildingShape]);

  // 5. Pin mặt trời trên mái Thư viện (Block 4) — xoay khớp góc mái (-6.26°)
  const solarPanelsGeometry = useMemo(() => {
    if (id !== 'b4') return null;

    const panels: BufferGeometry[] = [];
    const rows = 4;
    const cols = 6;
    const centerX = 125;
    const centerZ = -86;
    const angleRad = 0.109; // ~6.26° khớp cạnh dài b4
    const pW = 5.0;
    const pD = 2.8;
    const gap = 1.1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const localX = (c - (cols - 1) / 2) * (pW + gap);
        const localZ = (r - (rows - 1) / 2) * (pD + gap);
        const pGeo = new BoxGeometry(pW, 0.1, pD);
        pGeo.rotateX(0.12); // Hơi nghiêng đón nắng
        pGeo.translate(localX, 0, localZ);
        pGeo.rotateY(angleRad);
        pGeo.translate(centerX, height + 0.46, centerZ);
        panels.push(pGeo);
      }
    }

    const merged = BufferGeometryUtils.mergeGeometries(panels);
    panels.forEach((p) => p.dispose());
    return merged;
  }, [id, height]);

  return (
    <group>
      {/* Thân tòa nhà */}
      <mesh geometry={bodyGeometry} rotation-x={-Math.PI / 2} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          flatShading
          roughness={0.8}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Viền chỉ sàn phân tầng sáng màu */}
      {floorSlabsGeometry && (
        <mesh geometry={floorSlabsGeometry} castShadow receiveShadow>
          <meshStandardMaterial color={isSnowing ? '#f1f5f9' : '#e5e7eb'} roughness={0.6} />
        </mesh>
      )}

      {/* Dải kính cửa sổ các tầng */}
      {facadeDetailGeometry.windows && (
        <mesh geometry={facadeDetailGeometry.windows} castShadow receiveShadow>
          <meshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.4} />
        </mesh>
      )}

      {/* Thanh lam che nắng */}
      {facadeDetailGeometry.louvers && (
        <mesh geometry={facadeDetailGeometry.louvers} castShadow receiveShadow>
          <meshStandardMaterial color="#d1d5db" roughness={0.5} />
        </mesh>
      )}

      {/* Mái chìa xám sáng nhô ra 0.8m / phủ tuyết #f8fafc */}
      <mesh geometry={roofGeometry} rotation-x={-Math.PI / 2} position-y={height} castShadow receiveShadow>
        <meshStandardMaterial
          color={isSnowing ? '#f8fafc' : '#8d9196'}
          flatShading
          roughness={0.65}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity * 0.5}
        />
      </mesh>

      {/* Mảng pin năng lượng mặt trời trên mái Block 4 */}
      {solarPanelsGeometry && (
        <mesh geometry={solarPanelsGeometry} castShadow receiveShadow>
          <meshStandardMaterial color="#1e3a5f" roughness={0.3} metalness={0.6} />
        </mesh>
      )}
    </group>
  );
}
