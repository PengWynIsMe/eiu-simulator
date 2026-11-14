import { useMemo } from 'react';
import {
  Shape,
  Path,
  ExtrudeGeometry,
  BoxGeometry,
  BufferGeometry,
} from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useWalkStore } from '../../store/useWalkStore';
import { FLOOR_HEIGHT } from '../../data';
import type { Vec2 } from '../../types';
import { getInteriorLayout } from './layouts';
import { b3Layout } from './layouts/b3';
import InteriorFurniture, { getLocalFacingYaw } from './InteriorFurniture';

export default function InteriorScene() {
  const interior = useWalkStore((s) => s.interior);
  const buildingId = interior?.buildingId ?? 'b3';
  const floor = interior?.floor ?? 1;

  const layout = useMemo(() => getInteriorLayout(buildingId) ?? b3Layout, [buildingId]);
  const isB8 = buildingId.toLowerCase() === 'b8';
  const isB11 = buildingId.toLowerCase() === 'b11';
  const isTwinWing = isB8 || isB11;

  // 1. Sàn tầng dựng trực tiếp trong hệ tọa độ thế giới (x, z)
  const floorGeometry = useMemo(() => {
    const floorPtsWorld: Vec2[] = layout.getFloorBoundaryPts(floor);
    if (!floorPtsWorld || floorPtsWorld.length < 3) return null;

    const shape = new Shape();
    floorPtsWorld.forEach(([x, z], i) => {
      // Quy ước chuẩn của dự án: điểm 2D Shape là [x, -z], sau đó rotateX(-PI/2)
      if (i === 0) shape.moveTo(x, -z);
      else shape.lineTo(x, -z);
    });
    shape.closePath();

    // Các lỗ khoét (giếng trời sân trong ở B8 tầng 2–4)
    if (layout.getFloorHoles) {
      const holesWorld = layout.getFloorHoles(floor);
      for (const holePts of holesWorld) {
        if (holePts.length < 3) continue;
        const holePath = new Path();
        holePts.forEach(([hx, hz], hi) => {
          if (hi === 0) holePath.moveTo(hx, -hz);
          else holePath.lineTo(hx, -hz);
        });
        holePath.closePath();
        shape.holes.push(holePath);
      }
    }

    const extrude = new ExtrudeGeometry(shape, { depth: 0.15, bevelEnabled: false });
    extrude.rotateX(-Math.PI / 2);
    extrude.translate(0, -0.15, 0); // Mặt sàn trên cùng nằm tại y = 0
    return extrude;
  }, [layout, floor]);

  // Sàn hội trường B3 bên dưới khi nhìn từ tầng 3
  const auditoriumFloorGeometry = useMemo(() => {
    if (isTwinWing || floor !== 3) return null;

    const voidPtsWorld: Vec2[] = [
      layout.toWorld(-72, 12),
      layout.toWorld(-18, 12),
      layout.toWorld(-18, 40.1),
      layout.toWorld(-72, 40.1),
    ];

    const shape = new Shape();
    voidPtsWorld.forEach(([x, z], i) => {
      if (i === 0) shape.moveTo(x, -z);
      else shape.lineTo(x, -z);
    });
    shape.closePath();

    const extrude = new ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
    extrude.rotateX(-Math.PI / 2);
    extrude.translate(0, -FLOOR_HEIGHT - 0.1, 0);
    return extrude;
  }, [layout, floor, isTwinWing]);

  // Nền lát đá sân trong B8 ở tầng trệt (nhìn thấy khi đứng ở tầng 2, 3, 4 nhìn xuống)
  const b8CourtyardGroundGeometry = useMemo(() => {
    if (floor === 1) return null;

    if (isB11 && layout.getFloorHoles) {
      const groundElevation = -(floor - 1) * FLOOR_HEIGHT - 0.1;
      const holesWorld = layout.getFloorHoles(floor);
      const geos: BufferGeometry[] = [];
      for (const holePts of holesWorld) {
        const shape = new Shape();
        holePts.forEach((pt, idx) => {
          const sx = pt[0];
          const sy = -pt[1];
          if (idx === 0) shape.moveTo(sx, sy);
          else shape.lineTo(sx, sy);
        });
        const ext = new ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
        ext.rotateX(-Math.PI / 2);
        ext.translate(0, groundElevation, 0);
        geos.push(ext);
      }
      if (geos.length === 0) return null;
      const merged = BufferGeometryUtils.mergeGeometries(geos);
      geos.forEach((g) => g.dispose());
      return merged;
    }

    if (!isB8) return null;

    const groundElevation = -(floor - 1) * FLOOR_HEIGHT - 0.1;
    const geos: BufferGeometry[] = [];

    // Nền sân Tây: [13.5, 50.0] x [-197.0, -180.1]
    const westPts: Vec2[] = [
      layout.toWorld(13.5, -197.0),
      layout.toWorld(50.0, -197.0),
      layout.toWorld(50.0, -180.1),
      layout.toWorld(13.5, -180.1),
    ];
    const shapeWest = new Shape();
    westPts.forEach(([x, z], i) => {
      if (i === 0) shapeWest.moveTo(x, -z);
      else shapeWest.lineTo(x, -z);
    });
    shapeWest.closePath();
    const extrudeWest = new ExtrudeGeometry(shapeWest, { depth: 0.1, bevelEnabled: false });
    extrudeWest.rotateX(-Math.PI / 2);
    extrudeWest.translate(0, groundElevation, 0);
    geos.push(extrudeWest);

    // Nền sân Đông: [54.1, 114.9] x [-196.5, -179.6]
    const eastPts: Vec2[] = [
      layout.toWorld(54.1, -196.5),
      layout.toWorld(114.9, -196.5),
      layout.toWorld(114.9, -179.6),
      layout.toWorld(54.1, -179.6),
    ];
    const shapeEast = new Shape();
    eastPts.forEach(([x, z], i) => {
      if (i === 0) shapeEast.moveTo(x, -z);
      else shapeEast.lineTo(x, -z);
    });
    shapeEast.closePath();
    const extrudeEast = new ExtrudeGeometry(shapeEast, { depth: 0.1, bevelEnabled: false });
    extrudeEast.rotateX(-Math.PI / 2);
    extrudeEast.translate(0, groundElevation, 0);
    geos.push(extrudeEast);

    const merged = BufferGeometryUtils.mergeGeometries(geos);
    geos.forEach((g) => g.dispose());
    return merged;
  }, [layout, floor, isB8, isB11]);

  // 2. Tường đặc và vách kính gộp theo tọa độ thế giới (B8 không có vách kính sân trong)
  const { solidWallsGeo, glassWallsGeo, baseboardsGeo } = useMemo(() => {
    const walls = layout.getFloorWalls(floor);
    const solidGeos: BufferGeometry[] = [];
    const glassGeos: BufferGeometry[] = [];
    const baseboardGeos: BufferGeometry[] = [];

    const wallHeight = FLOOR_HEIGHT;
    const baseboardHeight = 0.12;

    for (const wall of walls) {
      // Bỏ qua tường lan can vì đã được dựng bởi instancedMesh trong InteriorFurniture
      if (wall.isRailing) continue;

      const [x1, z1] = layout.toWorld(wall.u1, wall.v1);
      const [x2, z2] = layout.toWorld(wall.u2, wall.v2);

      const dx = x2 - x1;
      const dz = z2 - z1;
      const length = Math.hypot(dx, dz);
      if (length < 0.05) continue;

      const midX = (x1 + x2) / 2;
      const midZ = (z1 + z2) / 2;
      const angle = -Math.atan2(dz, dx);

      if (wall.isGlass && !isB8) {
        // Vách kính trong suốt (chỉ B3)
        const glassBox = new BoxGeometry(length, wallHeight - 0.2, 0.06);
        glassBox.rotateY(angle);
        glassBox.translate(midX, wallHeight / 2, midZ);
        glassGeos.push(glassBox);

        const sillBox = new BoxGeometry(length, 0.08, 0.12);
        sillBox.rotateY(angle);
        sillBox.translate(midX, 0.04, midZ);
        baseboardGeos.push(sillBox);
      } else {
        // Tường xây đặc
        const wallBox = new BoxGeometry(length, wallHeight, wall.thickness);
        wallBox.rotateY(angle);
        wallBox.translate(midX, wallHeight / 2, midZ);
        solidGeos.push(wallBox);

        // Len chân tường
        const baseBox = new BoxGeometry(length, baseboardHeight, wall.thickness + 0.04);
        baseBox.rotateY(angle);
        baseBox.translate(midX, baseboardHeight / 2, midZ);
        baseboardGeos.push(baseBox);
      }
    }

    const mergedSolid = solidGeos.length > 0 ? BufferGeometryUtils.mergeGeometries(solidGeos) : null;
    const mergedGlass = glassGeos.length > 0 ? BufferGeometryUtils.mergeGeometries(glassGeos) : null;
    const mergedBaseboards = baseboardGeos.length > 0 ? BufferGeometryUtils.mergeGeometries(baseboardGeos) : null;

    solidGeos.forEach((g) => g.dispose());
    glassGeos.forEach((g) => g.dispose());
    baseboardGeos.forEach((g) => g.dispose());

    return {
      solidWallsGeo: mergedSolid,
      glassWallsGeo: mergedGlass,
      baseboardsGeo: mergedBaseboards,
    };
  }, [layout, floor, isB8]);

  // 3. Biển tên phòng nhỏ gắn tường
  const roomSigns = useMemo(() => {
    const rooms = layout.getFloorRooms(floor);
    const yaw = getLocalFacingYaw(layout.toWorld, 0);

    return rooms
      .filter((r) => r.code.includes('.B') || r.code.startsWith('P.'))
      .map((room) => {
        const centerU = (room.minU + room.maxU) / 2;
        // Gắn ở mép hành lang
        const isNorth = isB11
          ? room.maxV <= -135.0
          : isB8
            ? room.maxV <= -200.0
            : room.minV === 0 || room.minV < 15;
        const edgeV = isNorth ? room.maxV : room.minV;
        const [worldX, worldZ] = layout.toWorld(centerU, edgeV);
        return {
          code: room.code,
          worldX,
          worldZ,
          yaw,
        };
      });
  }, [layout, floor, isB8, isB11]);

  // Tọa độ tâm tòa nhà để bố trí nguồn sáng
  const centerPos = useMemo(() => {
    if (isB11) return layout.toWorld(65.8, -125.8);
    return isB8 ? layout.toWorld(64.7, -188.1) : layout.toWorld(0, 20.0);
  }, [layout, isB8, isB11]);

  // Màu tường và sàn theo tài liệu thực tế của từng tòa
  const wallColor = isTwinWing ? '#42322c' : '#f8fafc'; // B8 & B11: nâu sẫm, B3: trắng sáng
  const baseboardColor = isTwinWing ? '#261e1b' : '#334155';
  const floorColor = isTwinWing ? '#cbd5e1' : '#f1f5f9'; // B8 & B11: gạch xám, B3: terrazzo sáng

  return (
    <group>
      <color attach="background" args={['#0f172a']} />

      {/* Chiếu sáng nội thất */}
      <ambientLight intensity={isTwinWing ? 0.95 : 0.8} color="#f8fafc" />

      <directionalLight
        position={[centerPos[0] + 20, 25, centerPos[1] - 20]}
        intensity={0.9}
        color="#fffbeb"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <pointLight position={[centerPos[0], 3.5, centerPos[1]]} intensity={0.7} distance={35} color="#fef08a" />
      {isB11 ? (
        <>
          {/* Đèn dọc 2 sân trong & cầu nối B11 */}
          <pointLight position={[layout.toWorld(34.7, -126.4)[0], 3.6, layout.toWorld(34.7, -126.4)[1]]} intensity={0.7} distance={42} color="#e0f2fe" />
          <pointLight position={[layout.toWorld(90.0, -126.6)[0], 3.6, layout.toWorld(90.0, -126.6)[1]]} intensity={0.7} distance={42} color="#e0f2fe" />
          <pointLight position={[layout.toWorld(63.1, -127.0)[0], 3.4, layout.toWorld(63.1, -127.0)[1]]} intensity={0.75} distance={20} color="#fffbeb" />
          <pointLight position={[layout.toWorld(118.4, -126.5)[0], 3.4, layout.toWorld(118.4, -126.5)[1]]} intensity={0.65} distance={24} color="#fffbeb" />
        </>
      ) : isB8 ? (
        <>
          {/* Đèn dọc 2 sân trong B8 */}
          <pointLight position={[layout.toWorld(31.7, -188.5)[0], 3.6, layout.toWorld(31.7, -188.5)[1]]} intensity={0.65} distance={30} color="#e0f2fe" />
          <pointLight position={[layout.toWorld(84.5, -188.0)[0], 3.6, layout.toWorld(84.5, -188.0)[1]]} intensity={0.65} distance={35} color="#e0f2fe" />
          <pointLight position={[layout.toWorld(53.5, -188.35)[0], 3.4, layout.toWorld(53.5, -188.35)[1]]} intensity={0.7} distance={15} color="#fffbeb" />
        </>
      ) : (
        <>
          <pointLight position={[layout.toWorld(16, 12)[0], 3.4, layout.toWorld(16, 12)[1]]} intensity={0.65} distance={20} color="#fef08a" />
          <pointLight position={[layout.toWorld(-20, 26)[0], 3.4, layout.toWorld(-20, 26)[1]]} intensity={0.55} distance={25} color="#e0f2fe" />
          <pointLight position={[layout.toWorld(-50, 26)[0], 3.4, layout.toWorld(-50, 26)[1]]} intensity={0.55} distance={25} color="#e0f2fe" />
        </>
      )}

      {/* 1. Mặt sàn thế giới */}
      {floorGeometry && (
        <mesh geometry={floorGeometry} receiveShadow>
          <meshStandardMaterial color={floorColor} roughness={0.45} metalness={0.05} />
        </mesh>
      )}

      {/* Sàn hội trường B3 nhìn từ tầng 3 */}
      {auditoriumFloorGeometry && (
        <mesh geometry={auditoriumFloorGeometry} receiveShadow>
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
      )}

      {/* Nền đá sân trong nhìn từ các tầng trên xuống */}
      {b8CourtyardGroundGeometry && (
        <mesh geometry={b8CourtyardGroundGeometry} receiveShadow>
          <meshStandardMaterial color={isB11 ? '#94a3b8' : '#475569'} roughness={0.7} />
        </mesh>
      )}

      {/* 2. Thân tường đặc */}
      {solidWallsGeo && (
        <mesh geometry={solidWallsGeo} castShadow receiveShadow>
          <meshStandardMaterial color={wallColor} roughness={0.85} flatShading />
        </mesh>
      )}

      {/* Len chân tường */}
      {baseboardsGeo && (
        <mesh geometry={baseboardsGeo} castShadow receiveShadow>
          <meshStandardMaterial color={baseboardColor} roughness={0.5} />
        </mesh>
      )}

      {/* 3. Vách kính trong suốt */}
      {glassWallsGeo && (
        <mesh geometry={glassWallsGeo}>
          <meshStandardMaterial
            color="#bae6fd"
            transparent
            opacity={0.35}
            roughness={0.1}
            metalness={0.2}
          />
        </mesh>
      )}

      {/* 4. Nội thất instancing */}
      <InteriorFurniture buildingId={buildingId} floor={floor} />

      {/* 5. Biển số phòng nhỏ gắn tường */}
      {roomSigns.map((sign, idx) => (
        <group key={idx} position={[sign.worldX, 2.3, sign.worldZ]} rotation-y={sign.yaw}>
          <mesh castShadow>
            <boxGeometry args={[1.2, 0.35, 0.05]} />
            <meshStandardMaterial color="#1e293b" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[1.1, 0.25, 0.01]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
