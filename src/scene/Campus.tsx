// BẢN XEM BỐ CỤC TẠM (T01) — chỉ để kiểm tra hệ tọa độ và khung nền OSM.
// Gemini sẽ thay bằng Ground / Building / Trees / CameraRig thật từ T02.
import { useMemo } from 'react';
import { Shape, ExtrudeGeometry, Path } from 'three';
import { CameraControls, Line } from '@react-three/drei';
import { campus } from '../data';
import type { Building, RoadKind, Vec2 } from '../types';

const ROAD_COLOR: Record<RoadKind, string> = {
  street: '#6b7280',
  internal: '#9ca3af',
  footway: '#16a34a',
  bridge: '#2563eb',
};

// Footprint [x, z] → Shape trên mặt phẳng XY với y = -z, để sau khi xoay -90° quanh X thì khớp lại z.
function toShapePoints(pts: Vec2[]): [number, number][] {
  return pts.map(([x, z]) => [x, -z]);
}

function BuildingBlock({ building }: { building: Building }) {
  const geometry = useMemo(() => {
    const shape = new Shape();
    toShapePoints(building.shape.outer).forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
    building.shape.holes.forEach((hole) => {
      const path = new Path();
      toShapePoints(hole).forEach(([x, y], i) => (i === 0 ? path.moveTo(x, y) : path.lineTo(x, y)));
      shape.holes.push(path);
    });
    return new ExtrudeGeometry(shape, { depth: building.height, bevelEnabled: false });
  }, [building]);

  return (
    <mesh geometry={geometry} rotation-x={-Math.PI / 2} castShadow>
      <meshStandardMaterial color={building.zone === 1 ? building.color : '#c7c2c9'} flatShading />
    </mesh>
  );
}

export default function Campus() {
  const { layout, buildings } = campus;
  const boundary = useMemo(
    () => [...layout.boundary, layout.boundary[0] ?? [0, 0]].map(([x, z]): [number, number, number] => [x, 0.05, z]),
    [layout.boundary],
  );

  return (
    <>
      <CameraControls makeDefault minDistance={40} maxDistance={900} maxPolarAngle={1.35} />
      <hemisphereLight args={['#ffffff', '#8aa080', 1.2]} />
      <directionalLight position={[200, 300, 150]} intensity={1.6} />

      <mesh rotation-x={-Math.PI / 2} position-y={-0.05}>
        <planeGeometry args={[900, 900]} />
        <meshStandardMaterial color="#a9c49a" />
      </mesh>

      <Line points={boundary} color="#4d7c0f" lineWidth={2} />
      <mesh rotation-x={-Math.PI / 2} position-y={0.02}>
        <ringGeometry args={[layout.roundabout.radius - 4, layout.roundabout.radius + 4, 64]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>
      {layout.roads.map((road, i) => (
        <Line
          key={i}
          points={road.points.map(([x, z]): [number, number, number] => [x, 0.1, z])}
          color={ROAD_COLOR[road.kind]}
          lineWidth={road.kind === 'street' ? 4 : 2}
        />
      ))}

      {buildings.map((b) => (
        <BuildingBlock key={b.id} building={b} />
      ))}
    </>
  );
}
