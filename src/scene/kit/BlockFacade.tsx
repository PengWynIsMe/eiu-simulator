import { useMemo } from 'react';
import {
  Shape,
  ExtrudeGeometry,
  Path,
  BoxGeometry,
  BufferGeometry,
} from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Building, Vec2 } from '../../types';
import { FLOOR_HEIGHT } from '../../data';

function toShapePoints(pts: Vec2[]): [number, number][] {
  return pts.map(([x, z]) => [x, -z]);
}

/** Mở rộng đa giác theo pháp tuyến phân giác góc. */
function expandPolygon(pts: [number, number][], distance: number): [number, number][] {
  const n = pts.length;
  if (n < 3) return pts;

  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const pi = pts[i];
    const pj = pts[j];
    if (pi && pj) area += pi[0] * pj[1] - pj[0] * pi[1];
  }
  const isCCW = area > 0;

  const result: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const curr = pts[i];
    const next = pts[(i + 1) % n];
    if (!prev || !curr || !next) continue;

    const dx1 = curr[0] - prev[0];
    const dy1 = curr[1] - prev[1];
    const len1 = Math.hypot(dx1, dy1) || 1;

    const dx2 = next[0] - curr[0];
    const dy2 = next[1] - curr[1];
    const len2 = Math.hypot(dx2, dy2) || 1;

    const n1x = isCCW ? dy1 / len1 : -dy1 / len1;
    const n1y = isCCW ? -dx1 / len1 : dx1 / len1;

    const n2x = isCCW ? dy2 / len2 : -dy2 / len2;
    const n2y = isCCW ? -dx2 / len2 : dx2 / len2;

    const bx = n1x + n2x;
    const by = n1y + n2y;
    const bLen = Math.hypot(bx, by);

    if (bLen < 1e-4) {
      result.push([curr[0] + n1x * distance, curr[1] + n1y * distance]);
    } else {
      const bNormX = bx / bLen;
      const bNormY = by / bLen;
      const cosHalf = bNormX * n1x + bNormY * n1y;
      const miter = Math.min(distance / Math.max(cosHalf, 0.5), distance * 2);
      result.push([curr[0] + bNormX * miter, curr[1] + bNormY * miter]);
    }
  }
  return result;
}

export default function BlockFacade({ building }: { building: Building }) {
  const { height, floors, color, shape: buildingShape, id } = building;

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

  // 2. Viền chỉ sàn sáng màu giữa các tầng (horizontal floor slabs)
  const floorSlabsGeometry = useMemo(() => {
    const outerPts = toShapePoints(buildingShape.outer);
    const expanded = expandPolygon(outerPts, 0.15);
    const shape = new Shape();
    expanded.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));

    const geos: BufferGeometry[] = [];
    for (let f = 1; f < floors; f++) {
      const slabGeo = new ExtrudeGeometry(shape, { depth: 0.25, bevelEnabled: false });
      slabGeo.rotateX(-Math.PI / 2);
      slabGeo.translate(0, f * FLOOR_HEIGHT - 0.125, 0);
      geos.push(slabGeo);
    }

    if (geos.length === 0) return null;
    const merged = BufferGeometryUtils.mergeGeometries(geos);
    geos.forEach((g) => g.dispose());
    return merged;
  }, [floors, buildingShape]);

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
    const outerPts = toShapePoints(buildingShape.outer);
    const expandedOuter = expandPolygon(outerPts, 0.8);
    const shape = new Shape();
    expandedOuter.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));

    buildingShape.holes.forEach((hole) => {
      const path = new Path();
      const holePts = toShapePoints(hole);
      holePts.forEach(([x, y], i) => (i === 0 ? path.moveTo(x, y) : path.lineTo(x, y)));
      shape.holes.push(path);
    });

    return new ExtrudeGeometry(shape, { depth: 0.4, bevelEnabled: false });
  }, [buildingShape]);

  // 5. Pin mặt trời trên mái Thư viện (Block 4)
  const solarPanelsGeometry = useMemo(() => {
    if (id !== 'b4') return null;

    const panels: BufferGeometry[] = [];
    const rows = 4;
    const cols = 6;
    const startX = 110;
    const startZ = -88;
    const pW = 5.0;
    const pD = 2.8;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const pGeo = new BoxGeometry(pW, 0.08, pD);
        pGeo.translate(startX + c * (pW + 1.2), height + 0.45, startZ + r * (pD + 1.2));
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
        <meshStandardMaterial color={color} flatShading roughness={0.8} />
      </mesh>

      {/* Viền chỉ sàn phân tầng sáng màu */}
      {floorSlabsGeometry && (
        <mesh geometry={floorSlabsGeometry} castShadow receiveShadow>
          <meshStandardMaterial color="#e5e7eb" roughness={0.6} />
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

      {/* Mái chìa xám sáng nhô ra 0.8m */}
      <mesh geometry={roofGeometry} rotation-x={-Math.PI / 2} position-y={height} castShadow receiveShadow>
        <meshStandardMaterial color="#8d9196" flatShading roughness={0.65} />
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
