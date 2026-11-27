import { useEffect, useMemo } from 'react';
import { Shape, type BufferGeometry, type CanvasTexture } from 'three';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import { campus } from '../data';
import type { Vec2 } from '../types';
import { useReviewStore } from '../store/useReviewStore';
import { useCampusStore } from '../store/useCampusStore';
import { useSnowStore } from '../store/useSnowStore';
import { getCameraPose } from './cameraUtils';
import { FOOTWAY, FOOTWAY_WIDTH, GRASS, INTERNAL, PARKING, ROAD_WIDTH, ROUNDABOUT_GRASS, ROUNDABOUT_ROAD, ROUNDABOUT_ROAD_WIDTH, STREET, STREET_LANE_WIDTH, GROUND, BRIDGE_WIDTH, KERB_HEIGHT } from './groundLevels';
import {
  ASPHALT_TILE_LENGTH,
  BRICK_TILE_LENGTH,
  BRICK_TILE_WIDTH,
  createAsphaltTexture,
  createBrickTexture,
  createConcretePlazaTexture,
  createGrassTexture,
} from './street/roadTextures';
import { buildKerbGeometry, buildRingRibbon, buildRoadRibbon, type RoadStyle } from './street/roadGeometry';

/** Chuyển [x, z] sang [x, -z] trên mặt phẳng XY để khi xoay -90° quanh X sẽ khớp với hệ tọa độ thế giới. */
function toShapePoints(pts: Vec2[]): [number, number][] {
  return pts.map(([x, z]) => [x, -z]);
}

export default function Ground() {
  const { layout } = campus;
  const { camera, controls } = useThree();
  const isSnowing = useSnowStore((s) => s.isSnowing);

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

  const rbRadius = layout.roundabout.radius;
  const rbInner = rbRadius - ROUNDABOUT_ROAD_WIDTH / 2;
  const rbOuter = rbRadius + ROUNDABOUT_ROAD_WIDTH / 2;

  const gl = useThree((st) => st.gl);

  // Mặt đường: texture canvas tạo 1 lần. Đường phố chia nhóm theo số làn vì mỗi bề rộng cần vạch kẻ vừa khít.
  const surfaces = useMemo(() => {
    const aniso = gl.capabilities.getMaxAnisotropy();
    const textures: CanvasTexture[] = [];
    const geometries: BufferGeometry[] = [];
    const track = <T extends CanvasTexture | BufferGeometry>(item: T): T => {
      if ('isTexture' in item) textures.push(item as CanvasTexture);
      else geometries.push(item as BufferGeometry);
      return item;
    };

    const laneCounts = [...new Set(layout.roads.filter((r) => r.kind === 'street').map((r) => r.lanes ?? 2))].sort();
    const streets = laneCounts.map((lanes) => {
      const width = lanes * STREET_LANE_WIDTH;
      const style: RoadStyle = { width, elevation: STREET, texLength: ASPHALT_TILE_LENGTH, texWidth: width };
      const geo = buildRoadRibbon(layout.roads.filter((r) => r.kind === 'street' && (r.lanes ?? 2) === lanes), () => style, 600);
      const map = track(
        createAsphaltTexture(
          { widthM: width, base: '#5d6168', grain: 34, lanes, centerColor: 'yellow', dashM: 3, edgeLines: true },
          aniso,
        ),
      );
      return { lanes, geo: geo ? track(geo) : null, map };
    });

    const internalStyle: RoadStyle = { width: ROAD_WIDTH, elevation: INTERNAL, texLength: ASPHALT_TILE_LENGTH, texWidth: ROAD_WIDTH };
    const internalGeo = buildRoadRibbon(layout.roads.filter((r) => r.kind === 'internal'), () => internalStyle, 600);
    const internalMap = track(
      createAsphaltTexture(
        { widthM: ROAD_WIDTH, base: '#7d8188', grain: 20, lanes: 2, centerColor: 'white', dashM: 2, edgeLines: false },
        aniso,
      ),
    );

    const footStyle: RoadStyle = { width: FOOTWAY_WIDTH, elevation: FOOTWAY, texLength: BRICK_TILE_LENGTH, texWidth: BRICK_TILE_WIDTH };
    const footGeo = buildRoadRibbon(layout.roads.filter((r) => r.kind === 'footway'), () => footStyle, 600);
    const footMap = track(createBrickTexture('#cfc3b4', aniso));

    const ringGeo = track(buildRingRibbon(rbInner, rbOuter, 0, ASPHALT_TILE_LENGTH));
    const ringMap = track(
      createAsphaltTexture(
        { widthM: ROUNDABOUT_ROAD_WIDTH, base: '#62666d', grain: 30, lanes: 2, centerColor: 'yellow', dashM: 3, edgeLines: true },
        aniso,
      ),
    );

    const campusGrassMap = track(createGrassTexture('#9ec08d', aniso));
    campusGrassMap.repeat.set(0.06, 0.06);

    const roundaboutGrassMap = track(createGrassTexture('#91b681', aniso));
    roundaboutGrassMap.repeat.set(9, 9);

    const parkingMap = track(createConcretePlazaTexture('#6f747d', aniso));
    parkingMap.repeat.set(0.12, 0.12);

    // Bó vỉa dọc 2 mép đường nội bộ (nằm trong bề rộng 7 m, không đổi bề rộng đường).
    const kerbGeo = buildKerbGeometry({
      roads: layout.roads.filter((r) => r.kind === 'internal'),
      allRoads: layout.roads,
      halfWidth: ROAD_WIDTH / 2,
      baseY: INTERNAL,
      height: KERB_HEIGHT,
      thickness: 0.2,
      maxRadius: 600,
      onRoundabout: (x, z) => {
        const d = Math.hypot(x, z);
        return d > rbInner - 0.4 && d < rbOuter + 0.4;
      },
      widthOf: (r) => {
        if (r.kind === 'street') return (r.lanes ?? 2) * STREET_LANE_WIDTH;
        if (r.kind === 'footway') return FOOTWAY_WIDTH;
        if (r.kind === 'bridge') return BRIDGE_WIDTH;
        return ROAD_WIDTH;
      },
    });

    return {
      streets,
      internalGeo: internalGeo ? track(internalGeo) : null,
      internalMap,
      footGeo: footGeo ? track(footGeo) : null,
      footMap,
      ringGeo,
      ringMap,
      campusGrassMap,
      roundaboutGrassMap,
      parkingMap,
      kerbGeo: kerbGeo ? track(kerbGeo) : null,
      dispose: () => {
        textures.forEach((t) => t.dispose());
        geometries.forEach((g) => g.dispose());
      },
    };
  }, [gl, layout.roads, rbInner, rbOuter]);

  useEffect(() => surfaces.dispose, [surfaces]);

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
      <mesh rotation-x={-Math.PI / 2} position-y={GROUND} receiveShadow>
        <planeGeometry args={[2400, 2400]} />
        <meshStandardMaterial color={isSnowing ? '#dce5ee' : '#b2c9a6'} roughness={0.9} />
      </mesh>

      {/* 2. Cỏ bên trong ranh giới trường EIU — y = 0.15 */}
      <mesh rotation-x={-Math.PI / 2} position-y={GRASS} receiveShadow>
        <shapeGeometry args={[boundaryShape]} />
        <meshStandardMaterial
          map={isSnowing ? null : surfaces.campusGrassMap}
          color={isSnowing ? '#edf4fa' : '#ffffff'}
          roughness={0.9}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* 3. Bãi đỗ xe dạng mặt đường trải nhựa — y = 0.30 */}
      {parkingShapes.map((shape, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position-y={PARKING} receiveShadow>
          <shapeGeometry args={[shape]} />
          <meshStandardMaterial
            map={isSnowing ? null : surfaces.parkingMap}
            color={isSnowing ? '#4e545f' : '#ffffff'}
            roughness={0.82}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-1}
          />
        </mesh>
      ))}

      {/* 4. Vòng xoay: bãi cỏ trung tâm — y = 0.30 */}
      <mesh rotation-x={-Math.PI / 2} position-y={ROUNDABOUT_GRASS} receiveShadow>
        <circleGeometry args={[rbInner, 96]} />
        <meshStandardMaterial
          map={isSnowing ? null : surfaces.roundaboutGrassMap}
          color={isSnowing ? '#edf2f7' : '#ffffff'}
          roughness={0.9}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* 5. Vòng xoay: vành đường rộng 9m nhựa có vạch — y = 0.45 */}
      <mesh geometry={surfaces.ringGeo} position-y={ROUNDABOUT_ROAD} receiveShadow>
        <meshStandardMaterial
          map={surfaces.ringMap}
          roughness={0.85}
          polygonOffset
          polygonOffsetFactor={-3}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* 6. Dải đường phố bao quanh: nhựa + vạch vàng đứt + vạch mép trắng — y = 0.45 */}
      {surfaces.streets.map(
        ({ lanes, geo, map }) =>
          geo && (
            <mesh key={`street-${lanes}`} geometry={geo} receiveShadow>
              <meshStandardMaterial
                map={map}
                roughness={0.85}
                polygonOffset
                polygonOffsetFactor={-3}
                polygonOffsetUnits={-1}
              />
            </mesh>
          ),
      )}

      {/* 7. Dải đường nội bộ nhựa xám nhạt, vạch trắng đứt — y = 0.60 */}
      {surfaces.internalGeo && (
        <mesh geometry={surfaces.internalGeo} receiveShadow>
          <meshStandardMaterial
            map={surfaces.internalMap}
            roughness={0.85}
            polygonOffset
            polygonOffsetFactor={-4}
            polygonOffsetUnits={-1}
          />
        </mesh>
      )}

      {/* 7b. Bó vỉa 0.2 m × 0.15 m dọc 2 mép đường nội bộ */}
      {surfaces.kerbGeo && (
        <mesh geometry={surfaces.kerbGeo} receiveShadow>
          <meshStandardMaterial color={isSnowing ? '#dbe0e6' : '#b9bcc0'} roughness={0.9} />
        </mesh>
      )}

      {/* 8. Lối đi bộ lát gạch so le — y = 0.75 */}
      {surfaces.footGeo && (
        <mesh geometry={surfaces.footGeo} receiveShadow>
          <meshStandardMaterial
            map={surfaces.footMap}
            roughness={0.85}
            polygonOffset
            polygonOffsetFactor={-5}
            polygonOffsetUnits={-1}
          />
        </mesh>
      )}
    </group>
  );
}
