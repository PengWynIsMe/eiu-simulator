import { useMemo } from 'react';
import {
  Shape,
  ExtrudeGeometry,
  BoxGeometry,
  BufferGeometry,
} from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useWalkStore } from '../../store/useWalkStore';
import { FLOOR_HEIGHT } from '../../data';
import type { Vec2 } from '../../types';
import {
  getFloorWalls,
  getFloorRooms,
  toWorld,
} from './b3Layout';
import InteriorFurniture, { getLocalFacingYaw } from './InteriorFurniture';

export default function InteriorScene() {
  const interior = useWalkStore((s) => s.interior);
  const floor = interior?.floor ?? 1;

  // 1. Sàn tầng dựng trực tiếp trong hệ tọa độ thế giới (x, z)
  const floorGeometry = useMemo(() => {
    // Đa giác biên sàn tính sang tọa độ thế giới bằng toWorld
    const floorPtsWorld: Vec2[] =
      floor === 3
        ? [
            toWorld(-18, 12),
            toWorld(0, 12),
            toWorld(0, 0),
            toWorld(35.8, 0),
            toWorld(35.8, 40.1),
            toWorld(-18, 40.1),
          ]
        : [
            toWorld(-72, 12),
            toWorld(0, 12),
            toWorld(0, 0),
            toWorld(35.8, 0),
            toWorld(35.8, 40.1),
            toWorld(-72, 40.1),
          ];

    const shape = new Shape();
    floorPtsWorld.forEach(([x, z], i) => {
      // Quy ước chuẩn của dự án: điểm 2D Shape là [x, -z], sau đó rotateX(-PI/2)
      if (i === 0) shape.moveTo(x, -z);
      else shape.lineTo(x, -z);
    });
    shape.closePath();

    const extrude = new ExtrudeGeometry(shape, { depth: 0.15, bevelEnabled: false });
    extrude.rotateX(-Math.PI / 2);
    extrude.translate(0, -0.15, 0); // Mặt sàn trên cùng nằm tại y = 0
    return extrude;
  }, [floor]);

  // Sàn hội trường 200.B3 nhìn xuống qua khoảng thông tầng (chỉ tầng 3)
  const auditoriumFloorGeometry = useMemo(() => {
    if (floor !== 3) return null;

    const voidPtsWorld: Vec2[] = [
      toWorld(-72, 12),
      toWorld(-18, 12),
      toWorld(-18, 40.1),
      toWorld(-72, 40.1),
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
  }, [floor]);

  // 2. Tường đặc và vách kính gộp theo tọa độ thế giới
  const { solidWallsGeo, glassWallsGeo, baseboardsGeo } = useMemo(() => {
    const walls = getFloorWalls(floor);
    const solidGeos: BufferGeometry[] = [];
    const glassGeos: BufferGeometry[] = [];
    const baseboardGeos: BufferGeometry[] = [];

    const wallHeight = FLOOR_HEIGHT;
    const baseboardHeight = 0.12;

    for (const wall of walls) {
      // Đổi 2 điểm đầu mút sang tọa độ thế giới
      const [x1, z1] = toWorld(wall.u1, wall.v1);
      const [x2, z2] = toWorld(wall.u2, wall.v2);

      const dx = x2 - x1;
      const dz = z2 - z1;
      const length = Math.hypot(dx, dz);
      if (length < 0.05) continue;

      const midX = (x1 + x2) / 2;
      const midZ = (z1 + z2) / 2;
      // Góc quay của đoạn thẳng trên mặt phẳng XZ thế giới
      const angle = -Math.atan2(dz, dx);

      if (wall.isGlass) {
        // Vách kính trong suốt
        const glassBox = new BoxGeometry(length, wallHeight - 0.2, 0.06);
        glassBox.rotateY(angle);
        glassBox.translate(midX, wallHeight / 2, midZ);
        glassGeos.push(glassBox);

        // Khung nẹp chân vách kính
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

        // Len chân tường sẫm màu
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
  }, [floor]);

  // Biển hiệu tên phòng nhỏ gắn tường
  const roomSigns = useMemo(() => {
    const rooms = getFloorRooms(floor);
    const yaw = getLocalFacingYaw(0);
    return rooms.map((room) => {
      const centerU = (room.minU + room.maxU) / 2;
      const edgeV = room.minV < 24 ? room.maxV : room.minV;
      const [worldX, worldZ] = toWorld(centerU, edgeV);
      return {
        code: room.code,
        worldX,
        worldZ,
        yaw,
      };
    });
  }, [floor]);

  return (
    <group>
      <color attach="background" args={['#0f172a']} />
      {/* Chiếu sáng nội thất */}
      <ambientLight intensity={0.8} color="#f8fafc" />

      <directionalLight
        position={[toWorld(16, 0)[0] + 15, 20, toWorld(16, 0)[1] - 15]}
        intensity={0.9}
        color="#fffbeb"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <pointLight position={[toWorld(16, 12)[0], 3.4, toWorld(16, 12)[1]]} intensity={0.65} distance={20} color="#fef08a" />
      <pointLight position={[toWorld(-20, 26)[0], 3.4, toWorld(-20, 26)[1]]} intensity={0.55} distance={25} color="#e0f2fe" />
      <pointLight position={[toWorld(-50, 26)[0], 3.4, toWorld(-50, 26)[1]]} intensity={0.55} distance={25} color="#e0f2fe" />

      {/* 1. Mặt sàn Terrazzo thế giới */}
      {floorGeometry && (
        <mesh geometry={floorGeometry} receiveShadow>
          <meshStandardMaterial color="#f1f5f9" roughness={0.4} metalness={0.05} />
        </mesh>
      )}

      {/* Mặt sàn hội trường bên dưới khi nhìn từ tầng 3 */}
      {auditoriumFloorGeometry && (
        <mesh geometry={auditoriumFloorGeometry} receiveShadow>
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
      )}

      {/* 2. Thân tường đặc */}
      {solidWallsGeo && (
        <mesh geometry={solidWallsGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#f8fafc" roughness={0.85} flatShading />
        </mesh>
      )}

      {/* Len chân tường sẫm màu */}
      {baseboardsGeo && (
        <mesh geometry={baseboardsGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>
      )}

      {/* 3. Vách kính trong suốt phòng họp & sảnh */}
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
      <InteriorFurniture floor={floor} />

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
