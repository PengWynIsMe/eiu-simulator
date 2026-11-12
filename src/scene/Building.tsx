import { useMemo } from 'react';
import { Shape, ExtrudeGeometry, Path, BoxGeometry, BufferGeometry } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Building, Vec2 } from '../types';

/** Chuyển [x, z] sang [x, -z] trên mặt phẳng XY để khi xoay -90° quanh X sẽ khớp với hệ tọa độ thế giới. */
function toShapePoints(pts: Vec2[]): [number, number][] {
  return pts.map(([x, z]) => [x, -z]);
}

/** Mở rộng đa giác ra ngoài một khoảng distance (m) để tạo mái chìa. */
function expandPolygon(pts: [number, number][], distance: number): [number, number][] {
  const n = pts.length;
  if (n < 3) return pts;

  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const pi = pts[i];
    const pj = pts[j];
    if (pi && pj) {
      area += pi[0] * pj[1] - pj[0] * pi[1];
    }
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

    // Pháp tuyến ra ngoài của 2 cạnh
    const n1x = isCCW ? dy1 / len1 : -dy1 / len1;
    const n1y = isCCW ? -dx1 / len1 : dx1 / len1;

    const n2x = isCCW ? dy2 / len2 : -dy2 / len2;
    const n2y = isCCW ? -dx2 / len2 : dx2 / len2;

    // Vector phân giác
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

export default function BuildingView({ building }: { building: Building }) {
  const { kind, height, color, shape: buildingShape } = building;

  // Trường hợp nhà giữ xe: mái tôn trên cột (không tường), cao ~3 m
  const parkingData = useMemo(() => {
    if (kind !== 'parking') return null;

    const shape = new Shape();
    const pts = toShapePoints(buildingShape.outer);
    pts.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));

    // Mái tôn phẳng dày 0.15m
    const roofGeo = new ExtrudeGeometry(shape, { depth: 0.15, bevelEnabled: false });

    // Dựng các cột đỡ quanh viền chu vi
    const pillarGeos: BufferGeometry[] = [];
    const outer = buildingShape.outer;
    const pillarHeight = 2.85;

    for (let i = 0; i < outer.length; i++) {
      const p1 = outer[i];
      const p2 = outer[(i + 1) % outer.length];
      if (!p1 || !p2) continue;

      const dx = p2[0] - p1[0];
      const dz = p2[1] - p1[1];
      const segLen = Math.hypot(dx, dz);
      const steps = Math.max(1, Math.round(segLen / 7));

      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const px = p1[0] + dx * t;
        const pz = p1[1] + dz * t;

        const pGeo = new BoxGeometry(0.25, pillarHeight, 0.25);
        pGeo.translate(px, pillarHeight / 2, pz);
        pillarGeos.push(pGeo);
      }
    }

    const mergedPillars = pillarGeos.length > 0 ? BufferGeometryUtils.mergeGeometries(pillarGeos) : null;
    pillarGeos.forEach((g) => g.dispose());

    return { roofGeo, pillarsGeo: mergedPillars };
  }, [kind, buildingShape]);

  // Hình học thân tòa nhà
  const bodyGeometry = useMemo(() => {
    if (kind === 'parking') return null;

    const shape = new Shape();
    const outerPts = toShapePoints(buildingShape.outer);
    outerPts.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));

    buildingShape.holes.forEach((hole) => {
      const path = new Path();
      const holePts = toShapePoints(hole);
      holePts.forEach(([x, y], i) => (i === 0 ? path.moveTo(x, y) : path.lineTo(x, y)));
      shape.holes.push(path);
    });

    const bodyHeight = kind === 'gate' ? Math.min(height, 4.2) : height;
    return new ExtrudeGeometry(shape, { depth: bodyHeight, bevelEnabled: false });
  }, [kind, height, buildingShape]);

  // Mái chìa cho các tòa chính (academic, library, admin, canteen)
  const roofGeometry = useMemo(() => {
    const hasOverhangRoof = kind === 'academic' || kind === 'library' || kind === 'admin' || kind === 'canteen';
    if (!hasOverhangRoof) return null;

    const outerPts = toShapePoints(buildingShape.outer);
    const expandedOuter = expandPolygon(outerPts, 1.2);

    const shape = new Shape();
    expandedOuter.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));

    // Giữ nguyên lỗ sân trong để không che sân trời B8–B11
    buildingShape.holes.forEach((hole) => {
      const path = new Path();
      const holePts = toShapePoints(hole);
      holePts.forEach(([x, y], i) => (i === 0 ? path.moveTo(x, y) : path.lineTo(x, y)));
      shape.holes.push(path);
    });

    return new ExtrudeGeometry(shape, { depth: 0.4, bevelEnabled: false });
  }, [kind, buildingShape]);

  if (kind === 'parking' && parkingData) {
    return (
      <group>
        {/* Mái tôn nhà xe */}
        <mesh geometry={parkingData.roofGeo} rotation-x={-Math.PI / 2} position-y={2.85} castShadow receiveShadow>
          <meshStandardMaterial color="#8e9aa8" metalness={0.2} roughness={0.6} flatShading />
        </mesh>
        {/* Cột đỡ kim loại */}
        {parkingData.pillarsGeo && (
          <mesh geometry={parkingData.pillarsGeo} castShadow receiveShadow>
            <meshStandardMaterial color="#3e4752" roughness={0.7} />
          </mesh>
        )}
      </group>
    );
  }

  return (
    <group>
      {/* Thân tòa nhà */}
      {bodyGeometry && (
        <mesh geometry={bodyGeometry} rotation-x={-Math.PI / 2} castShadow receiveShadow>
          <meshStandardMaterial color={color} flatShading roughness={0.8} />
        </mesh>
      )}

      {/* Mái chìa nhô ra 1.2m màu xám đậm */}
      {roofGeometry && (
        <mesh geometry={roofGeometry} rotation-x={-Math.PI / 2} position-y={height} castShadow receiveShadow>
          <meshStandardMaterial color="#374151" flatShading roughness={0.7} />
        </mesh>
      )}
    </group>
  );
}
