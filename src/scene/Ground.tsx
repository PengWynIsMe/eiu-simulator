import { useMemo } from 'react';
import { Shape, BufferGeometry, Float32BufferAttribute } from 'three';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import { campus } from '../data';
import type { Road, Vec2 } from '../types';
import { useReviewStore } from '../store/useReviewStore';
import { useCampusStore } from '../store/useCampusStore';
import { getCameraPose } from './cameraUtils';

/** Chuyển [x, z] sang [x, -z] trên mặt phẳng XY để khi xoay -90° quanh X sẽ khớp với hệ tọa độ thế giới. */
function toShapePoints(pts: Vec2[]): [number, number][] {
  return pts.map(([x, z]) => [x, -z]);
}

/** Cắt đoạn thẳng [p1, p2] trong phạm vi bán kính maxR từ gốc [0, 0] để không dựng đường quá xa. */
function clipSegmentToRadius(p1: Vec2, p2: Vec2, maxR: number): [Vec2, Vec2] | null {
  const [x1, z1] = p1;
  const [x2, z2] = p2;
  const dx = x2 - x1;
  const dz = z2 - z1;
  const d1 = Math.hypot(x1, z1);
  const d2 = Math.hypot(x2, z2);

  // Cả hai điểm đều nằm trong phạm vi
  if (d1 <= maxR && d2 <= maxR) {
    return [p1, p2];
  }

  const a = dx * dx + dz * dz;
  if (a < 1e-6) {
    return d1 <= maxR ? [p1, p2] : null;
  }

  const b = 2 * (x1 * dx + z1 * dz);
  const c = x1 * x1 + z1 * z1 - maxR * maxR;
  const discr = b * b - 4 * a * c;
  if (discr < 0) return null;

  const sqrtD = Math.sqrt(discr);
  const tA = (-b - sqrtD) / (2 * a);
  const tB = (-b + sqrtD) / (2 * a);
  const tStart = Math.max(0, Math.min(tA, tB));
  const tEnd = Math.min(1, Math.max(tA, tB));

  if (tStart >= tEnd || tStart > 1 || tEnd < 0) return null;

  return [
    [x1 + tStart * dx, z1 + tStart * dz],
    [x1 + tEnd * dx, z1 + tEnd * dz],
  ];
}

/** Tạo BufferGeometry dạng dải ruy băng cho danh sách đường, không sinh tam giác trùng ở các khớp nối. */
function buildRoadGeometry(roads: Road[], elevation: number, maxRadius = 600): BufferGeometry | null {
  const positions: number[] = [];
  const normals: number[] = [];

  const addTriangle = (p1: [number, number, number], p2: [number, number, number], p3: [number, number, number]) => {
    positions.push(...p1, ...p2, ...p3);
    normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
  };

  roads.forEach((road) => {
    if (road.kind === 'bridge' || road.points.length < 2) return;

    let width = 7;
    if (road.kind === 'street') {
      width = (road.lanes ?? 2) * 3.5;
    } else if (road.kind === 'footway') {
      width = 2.5;
    }
    const hw = width / 2;

    for (let i = 0; i < road.points.length - 1; i++) {
      const p1 = road.points[i];
      const p2 = road.points[i + 1];
      if (!p1 || !p2) continue;

      const clipped = clipSegmentToRadius(p1, p2, maxRadius);
      if (!clipped) continue;

      const [A, B] = clipped;
      const dx = B[0] - A[0];
      const dz = B[1] - A[1];
      const len = Math.hypot(dx, dz);
      if (len < 0.05) continue;

      const nx = -dz / len;
      const nz = dx / len;

      const v0: [number, number, number] = [A[0] + nx * hw, elevation, A[1] + nz * hw];
      const v1: [number, number, number] = [A[0] - nx * hw, elevation, A[1] - nz * hw];
      const v2: [number, number, number] = [B[0] + nx * hw, elevation, B[1] + nz * hw];
      const v3: [number, number, number] = [B[0] - nx * hw, elevation, B[1] - nz * hw];

      // 2 tam giác của đoạn đường
      addTriangle(v0, v2, v1);
      addTriangle(v2, v3, v1);

      // Chỉ thêm bo tròn tại các điểm gấp khúc bên trong (không thêm trùng lặp ở cả hai đầu)
      if (i < road.points.length - 2) {
        const jointSteps = 8;
        for (let k = 0; k < jointSteps; k++) {
          const a1 = (k / jointSteps) * Math.PI * 2;
          const a2 = ((k + 1) / jointSteps) * Math.PI * 2;
          const jb1: [number, number, number] = [B[0] + Math.cos(a1) * hw, elevation, B[1] + Math.sin(a1) * hw];
          const jb2: [number, number, number] = [B[0] + Math.cos(a2) * hw, elevation, B[1] + Math.sin(a2) * hw];
          addTriangle([B[0], elevation, B[1]], jb2, jb1);
        }
      }
    }
  });

  if (positions.length === 0) return null;

  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  return geo;
}

export default function Ground() {
  const { layout } = campus;
  const { camera, controls } = useThree();

  // Đa giác ranh giới khuôn viên (màu cỏ bên trong tươi hơn)
  const boundaryShape = useMemo(() => {
    const shape = new Shape();
    const pts = toShapePoints(layout.boundary);
    pts.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
    return shape;
  }, [layout.boundary]);

  // Các bãi đỗ xe
  const parkingShapes = useMemo(
    () =>
      layout.parking.map((poly) => {
        const shape = new Shape();
        const pts = toShapePoints(poly);
        pts.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
        return shape;
      }),
    [layout.parking],
  );

  // Đường phố bao ngoài (street): rộng theo số làn, cắt bớt ngoài 600m — cao y = 0.45m
  const streetGeometry = useMemo(
    () => buildRoadGeometry(layout.roads.filter((r) => r.kind === 'street'), 0.45, 600),
    [layout.roads],
  );

  // Đường nội bộ (internal): rộng 7m — cao y = 0.60m
  const internalGeometry = useMemo(
    () => buildRoadGeometry(layout.roads.filter((r) => r.kind === 'internal'), 0.6, 600),
    [layout.roads],
  );

  // Lối đi bộ (footway): rộng 2.5m — cao y = 0.75m
  const footwayGeometry = useMemo(
    () => buildRoadGeometry(layout.roads.filter((r) => r.kind === 'footway'), 0.75, 600),
    [layout.roads],
  );

  const rbRadius = layout.roundabout.radius;
  const rbInner = rbRadius - 4.5;
  const rbOuter = rbRadius + 4.5;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    // Bỏ qua nếu là thao tác kéo xoay camera
    if (e.delta > 4) return;

    const reviewMode = useReviewStore.getState().reviewMode;
    if (reviewMode) {
      e.stopPropagation();
      const pose = getCameraPose(controls, camera);
      useReviewStore.getState().setDraft({
        targetId: null,
        point: [e.point.x, e.point.y, e.point.z],
        camera: pose,
      });
    } else {
      useCampusStore.getState().clearSelection();
    }
  };

  return (
    <group onClick={handleClick}>
      {/* 1. Đất cỏ lớn xung quanh (~2400m) — y = 0 */}
      <mesh rotation-x={-Math.PI / 2} position-y={0} receiveShadow>
        <planeGeometry args={[2400, 2400]} />
        <meshStandardMaterial color="#b2c9a6" roughness={0.9} />
      </mesh>

      {/* 2. Cỏ bên trong ranh giới trường EIU — y = 0.15 */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.15} receiveShadow>
        <shapeGeometry args={[boundaryShape]} />
        <meshStandardMaterial
          color="#9ec08d"
          roughness={0.9}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* 3. Bãi đỗ xe dạng mặt đường trải nhựa — y = 0.30 */}
      {parkingShapes.map((shape, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position-y={0.3} receiveShadow>
          <shapeGeometry args={[shape]} />
          <meshStandardMaterial
            color="#6f747d"
            roughness={0.8}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-1}
          />
        </mesh>
      ))}

      {/* 4. Vòng xoay: bãi cỏ trung tâm — y = 0.30 */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.3} receiveShadow>
        <circleGeometry args={[rbInner, 96]} />
        <meshStandardMaterial
          color="#91b681"
          roughness={0.9}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* 5. Vòng xoay: vành đường rộng 9m xám sáng — y = 0.45 */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.45} receiveShadow>
        <ringGeometry args={[rbInner, rbOuter, 96]} />
        <meshStandardMaterial
          color="#7b7f86"
          roughness={0.8}
          polygonOffset
          polygonOffsetFactor={-3}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* 6. Dải đường phố bao quanh xám nhựa sáng — y = 0.45 */}
      {streetGeometry && (
        <mesh geometry={streetGeometry} receiveShadow>
          <meshStandardMaterial
            color="#767a82"
            roughness={0.8}
            polygonOffset
            polygonOffsetFactor={-3}
            polygonOffsetUnits={-1}
          />
        </mesh>
      )}

      {/* 7. Dải đường nội bộ xám nhựa sáng — y = 0.60 */}
      {internalGeometry && (
        <mesh geometry={internalGeometry} receiveShadow>
          <meshStandardMaterial
            color="#7b7f86"
            roughness={0.8}
            polygonOffset
            polygonOffsetFactor={-4}
            polygonOffsetUnits={-1}
          />
        </mesh>
      )}

      {/* 8. Lối đi bộ lát gạch nhạt — y = 0.75 */}
      {footwayGeometry && (
        <mesh geometry={footwayGeometry} receiveShadow>
          <meshStandardMaterial
            color="#cfc3b4"
            roughness={0.8}
            polygonOffset
            polygonOffsetFactor={-5}
            polygonOffsetUnits={-1}
          />
        </mesh>
      )}
    </group>
  );
}
