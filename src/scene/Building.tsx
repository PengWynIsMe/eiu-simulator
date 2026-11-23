import { useMemo } from 'react';
import { Shape, ExtrudeGeometry, Path, BoxGeometry, BufferGeometry } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Html } from '@react-three/drei';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import type { Building, Vec2 } from '../types';
import { useCampusStore } from '../store/useCampusStore';
import { useReviewStore } from '../store/useReviewStore';
import { useSnowStore } from '../store/useSnowStore';
import { getCameraPose } from './cameraUtils';
import BlockFacade from './kit/BlockFacade';
import TwinWingBlock from './kit/TwinWingBlock';
import ParkingShed from './zone1/ParkingShed';
import MainGate from './zone1/MainGate';
import { Block6BBI, CoveredB3B6Corridor } from './zone1/Block6BBI';
import { HighlandsKiosk, FamiPizzaKiosk } from './zone1/Kiosks';
import CanteenBlock from './zone2/CanteenBlock';
import { TwoLevelParking, LongParkingShed } from './zone2/ParkingStructures';
import { BackGate, PowerSubstation } from './zone2/ServiceStructures';

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

interface BuildingSubProps {
  building: Building;
  isHovered?: boolean;
  isSelected?: boolean;
}

/** Tòa nhà dựng mức 1 cơ bản: khối đùn phẳng và mái chìa xám sáng */
function StandardBuildingBlock({ building, isHovered, isSelected }: BuildingSubProps) {
  const { kind, height, color, shape: buildingShape } = building;
  const isSnowing = useSnowStore((s) => s.isSnowing);

  const emissiveColor = isSelected ? '#60a5fa' : isHovered ? '#38bdf8' : '#000000';
  const emissiveIntensity = isSelected ? 0.35 : isHovered ? 0.2 : 0;

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
          <meshStandardMaterial
            color={isSnowing ? '#eef2f6' : '#949da6'}
            metalness={0.2}
            roughness={0.6}
            flatShading
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
          />
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
          <meshStandardMaterial
            color={color}
            flatShading
            roughness={0.8}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      )}

      {/* Mái chìa nhô ra 0.8m màu xám sáng #8d9196 / phủ tuyết #f8fafc */}
      {roofGeometry && (
        <mesh geometry={roofGeometry} rotation-x={-Math.PI / 2} position-y={height} castShadow receiveShadow>
          <meshStandardMaterial
            color={isSnowing ? '#f8fafc' : '#8d9196'}
            flatShading
            roughness={0.65}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity * 0.5}
          />
        </mesh>
      )}
    </group>
  );
}

export default function BuildingView({ building }: { building: Building }) {
  // Subscribe riêng từng tòa nhà để tránh re-render cả khuôn viên khi chỉ hover 1 tòa
  const isHovered = useCampusStore((s) => s.hoveredBuildingId === building.id);
  const isSelected = useCampusStore((s) => s.selectedBuildingId === building.id);

  const { camera, controls } = useThree();

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    useCampusStore.getState().setHovered(building.id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (useCampusStore.getState().hoveredBuildingId === building.id) {
      useCampusStore.getState().setHovered(null);
      document.body.style.cursor = 'auto';
    }
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // Bỏ qua nếu là thao tác kéo xoay camera
    if (e.delta > 4) return;

    if (useReviewStore.getState().reviewMode) {
      const pose = getCameraPose(controls, camera);
      useReviewStore.getState().setDraft({
        targetId: building.id,
        point: [e.point.x, e.point.y, e.point.z],
        camera: pose,
      });
    } else {
      useCampusStore.getState().selectBuilding(building.id);
    }
  };

  const labelHeight = Math.max(building.height, building.id === 'cong-chinh' ? 6.5 : 4.0) + 2.5;

  let content = null;
  if (building.id === 'cong-chinh') {
    content = <MainGate isHovered={isHovered} isSelected={isSelected} />;
  } else if (building.id === 'cong-phu') {
    content = <BackGate isHovered={isHovered} isSelected={isSelected} />;
  } else if (building.id === 'tram-dien') {
    content = <PowerSubstation building={building} isHovered={isHovered} isSelected={isSelected} />;
  } else if (building.id === 'nha-xe-b5') {
    content = <ParkingShed isHovered={isHovered} isSelected={isSelected} />;
  } else if (building.id === 'nha-xe-can-tin') {
    content = <LongParkingShed building={building} isHovered={isHovered} isSelected={isSelected} />;
  } else if (building.id === 'nha-xe-2-tang') {
    content = <TwoLevelParking building={building} isHovered={isHovered} isSelected={isSelected} />;
  } else if (building.id === 'highlands') {
    content = <HighlandsKiosk building={building} isHovered={isHovered} isSelected={isSelected} />;
  } else if (building.id === 'fami-pizza') {
    content = <FamiPizzaKiosk building={building} isHovered={isHovered} isSelected={isSelected} />;
  } else if (building.id === 'hanh-lang-b3-b6') {
    content = <CoveredB3B6Corridor building={building} isHovered={isHovered} isSelected={isSelected} />;
  } else if (building.id === 'b6') {
    content = <Block6BBI building={building} isHovered={isHovered} isSelected={isSelected} />;
  } else if (building.id === 'can-tin') {
    content = <CanteenBlock building={building} isHovered={isHovered} isSelected={isSelected} />;
  } else if (
    building.id === 'b8' ||
    building.id === 'b9' ||
    building.id === 'b10' ||
    building.id === 'b11'
  ) {
    content = <TwinWingBlock building={building} isHovered={isHovered} isSelected={isSelected} />;
  } else if (
    building.detailLevel === 2 &&
    (building.kind === 'academic' || building.kind === 'library' || building.kind === 'admin')
  ) {
    content = <BlockFacade building={building} isHovered={isHovered} isSelected={isSelected} />;
  } else {
    content = <StandardBuildingBlock building={building} isHovered={isHovered} isSelected={isSelected} />;
  }

  return (
    <group
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {content}

      {/* Nhãn tên viết tắt hiển thị khi hover hoặc khi tòa đang được chọn */}
      {(isHovered || isSelected) && (
        <Html
          position={[building.center[0], labelHeight, building.center[1]]}
          center
          zIndexRange={[10, 0]}
          style={{ pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap' }}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 text-white text-xs font-semibold shadow-lg border border-slate-700/80 backdrop-blur-sm pointer-events-none select-none transform -translate-y-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isSelected ? 'bg-amber-400 ring-2 ring-amber-300/40' : 'bg-blue-400 ring-2 ring-blue-300/40'
              }`}
            />
            <span>{building.shortName}</span>
          </div>
        </Html>
      )}
    </group>
  );
}
