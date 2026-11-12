import { useMemo } from 'react';
import { Shape, ExtrudeGeometry, Path, BoxGeometry, BufferGeometry } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Building, Vec2 } from '../types';
import BlockFacade from './kit/BlockFacade';
import ParkingShed from './zone1/ParkingShed';
import MainGate from './zone1/MainGate';

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

/** Tòa nhà dựng mức 1 cơ bản: khối đùn phẳng và mái chìa xám sáng */
function StandardBuildingBlock({ building }: { building: Building }) {
  const { kind, height, color, shape: buildingShape } = building;

  // Trường hợp nhà giữ xe mức 1 (nha-xe-can-tin, nha-xe-2-tang)
  const parkingData = useMemo(() => {
    if (kind !== 'parking') return null;

    const shape = new Shape();
    const pts = toShapePoints(buildingShape.outer);
    pts.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));

    // Mái tôn phẳng dày 0.15m đặt ở độ cao 3.15m
    const roofGeo = new ExtrudeGeometry(shape, { depth: 0.15, bevelEnabled: false });

    // Dựng các cột đỡ quanh viền chu vi từ nền bãi xe (y = 0.3) lên mái (y = 3.15)
    const pillarGeos: BufferGeometry[] = [];
    const outer = buildingShape.outer;
    const pillarHeight = 2.85;
    const baseY = 0.3;

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
        pGeo.translate(px, baseY + pillarHeight / 2, pz);
        pillarGeos.push(pGeo);
      }
    }

    const mergedPillars = pillarGeos.length > 0 ? BufferGeometryUtils.mergeGeometries(pillarGeos) : null;
    pillarGeos.forEach((g) => g.dispose());

    return { roofGeo, pillarsGeo: mergedPillars };
  }, [kind, buildingShape]);

  // Hình học thân tòa nhà mức 1
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

  // Mái chìa cho các tòa mức 1: xám sáng ~#8d9196, nhô ra 0.8m
  const roofGeometry = useMemo(() => {
    const hasOverhangRoof = kind === 'academic' || kind === 'library' || kind === 'admin' || kind === 'canteen';
    if (!hasOverhangRoof) return null;

    const outerPts = toShapePoints(buildingShape.outer);
    const expandedOuter = expandPolygon(outerPts, 0.8);

    const shape = new Shape();
    expandedOuter.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));

    // Giữ nguyên lỗ sân trong cho B8–B11
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
        <mesh geometry={parkingData.roofGeo} rotation-x={-Math.PI / 2} position-y={3.15} castShadow receiveShadow>
          <meshStandardMaterial color="#949da6" metalness={0.2} roughness={0.6} flatShading />
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

      {/* Mái chìa nhô ra 0.8m màu xám sáng #8d9196 */}
      {roofGeometry && (
        <mesh geometry={roofGeometry} rotation-x={-Math.PI / 2} position-y={height} castShadow receiveShadow>
          <meshStandardMaterial color="#8d9196" flatShading roughness={0.65} />
        </mesh>
      )}
    </group>
  );
}

export default function BuildingView({ building }: { building: Building }) {
  // 1. Cổng chính khu vực 1 (vòm cung thấp tạm)
  if (building.id === 'cong-chinh') {
    return <MainGate />;
  }

  // 2. Nhà xe sau Block 5 (mái răng cưa dài)
  if (building.id === 'nha-xe-b5') {
    return <ParkingShed />;
  }

  // 3. Các tòa chính khu vực 1 có mức dựng 2 (Block 3, Block 4, Block 5)
  if (
    building.detailLevel === 2 &&
    (building.kind === 'academic' || building.kind === 'library' || building.kind === 'admin')
  ) {
    return <BlockFacade building={building} />;
  }

  // 4. Các tòa mức 1 còn lại (B6, B8–B11, Căn tin, nha-xe-can-tin, nha-xe-2-tang, trạm điện, ki-ốt...)
  return <StandardBuildingBlock building={building} />;
}
