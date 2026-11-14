import { useMemo } from 'react';
import { Matrix4, Vector3, Quaternion, Euler, BoxGeometry, CylinderGeometry } from 'three';
import { FLOOR_HEIGHT } from '../../data';
import type { Vec2 } from '../../types';
import { b3Layout } from './layouts/b3';
import { b8Layout } from './layouts/b8';

interface FurnitureProps {
  buildingId: string;
  floor: number;
}

/**
 * Tính góc quay Euler Y trong không gian thế giới (Three.js) cho một hướng quay địa phương.
 */
export function getLocalFacingYaw(toWorld: (u: number, v: number) => Vec2, localRotY = 0): number {
  const dirU = Math.cos(localRotY);
  const dirV = Math.sin(localRotY);
  const p0 = toWorld(0, 0);
  const p1 = toWorld(dirU, dirV);
  return -Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
}

/**
 * Tạo Matrix4 cho một object ở tọa độ địa phương chuyển đổi thẳng sang hệ tọa độ thế giới.
 */
export function createInstanceMatrix(
  toWorld: (u: number, v: number) => Vec2,
  u: number,
  v: number,
  y: number,
  localRotY = 0,
  scaleX = 1,
  scaleY = 1,
  scaleZ = 1
): Matrix4 {
  const [worldX, worldZ] = toWorld(u, v);
  const yaw = getLocalFacingYaw(toWorld, localRotY);
  const position = new Vector3(worldX, y, worldZ);
  const rotation = new Quaternion().setFromEuler(new Euler(0, yaw, 0));
  const scale = new Vector3(scaleX, scaleY, scaleZ);
  return new Matrix4().compose(position, rotation, scale);
}

export default function InteriorFurniture({ buildingId, floor }: FurnitureProps) {
  if (buildingId.toLowerCase() === 'b8') {
    return <B8Furniture floor={floor} />;
  }
  return <B3Furniture floor={floor} />;
}

// =============================================================================
// NỘI THẤT BLOCK 8: KHU PHÒNG HỌC ĐA NĂNG
// =============================================================================

function B8Furniture({ floor }: { floor: number }) {
  const layout = b8Layout;
  const toWorld = layout.toWorld;
  const rooms = layout.getFloorRooms(floor);

  // 1. Cột kết cấu bê tông dọc theo hành lang & vách phòng
  const columnMatrices = useMemo(() => {
    const matrices: Matrix4[] = [];
    // Hàng cột dọc hành lang Bắc (v = 10.5) và Nam (v = 31.3)
    const gridU = [0, 8.6, 17.2, 25.8, 34.4, 41.4, 45.8, 54.4, 63.0, 71.6, 80.2, 88.8, 97.4, 104.5, 111.2];
    for (const u of gridU) {
      matrices.push(createInstanceMatrix(toWorld, u, 10.5, FLOOR_HEIGHT / 2, 0, 0.5, FLOOR_HEIGHT, 0.5));
      matrices.push(createInstanceMatrix(toWorld, u, 31.3, FLOOR_HEIGHT / 2, 0, 0.5, FLOOR_HEIGHT, 0.5));
    }
    return matrices;
  }, [toWorld]);

  // 2. Bàn học sinh / sinh viên trong các phòng học (hàng lối)
  const deskMatrices = useMemo(() => {
    const matrices: Matrix4[] = [];

    for (const room of rooms) {
      if (!room.code.includes('.B8')) continue;

      const roomWidth = room.maxU - room.minU;
      const isNorth = room.minV === 0;

      if (isNorth) {
        // Cánh Bắc: Bảng ở v = 0.2, bàn xếp quay mặt về phía Bắc (v tăng dần)
        const cols = roomWidth > 12 ? 4 : 2;
        const colSpacing = roomWidth / (cols + 1);
        const rows = [3.5, 6.0, 8.5];

        for (let c = 1; c <= cols; c++) {
          const u = room.minU + c * colSpacing;
          for (const v of rows) {
            matrices.push(createInstanceMatrix(toWorld, u, v, 0.38, 0, 2.0, 0.75, 0.6));
          }
        }
      } else {
        // Cánh Nam: Bảng ở v = 44.0, bàn xếp quay mặt về phía Nam
        const cols = roomWidth > 12 ? 4 : 2;
        const colSpacing = roomWidth / (cols + 1);
        const rows = [34.0, 36.5, 39.0, 41.5];

        for (let c = 1; c <= cols; c++) {
          const u = room.minU + c * colSpacing;
          for (const v of rows) {
            matrices.push(createInstanceMatrix(toWorld, u, v, 0.38, Math.PI, 2.0, 0.75, 0.6));
          }
        }
      }
    }

    return matrices;
  }, [rooms, toWorld]);

  // 3. Ghế sinh viên
  const chairMatrices = useMemo(() => {
    const matrices: Matrix4[] = [];

    for (const room of rooms) {
      if (!room.code.includes('.B8')) continue;

      const roomWidth = room.maxU - room.minU;
      const isNorth = room.minV === 0;

      if (isNorth) {
        const cols = roomWidth > 12 ? 4 : 2;
        const colSpacing = roomWidth / (cols + 1);
        const rows = [4.1, 6.6, 9.1];

        for (let c = 1; c <= cols; c++) {
          const u = room.minU + c * colSpacing;
          for (const v of rows) {
            matrices.push(createInstanceMatrix(toWorld, u - 0.5, v, 0.42, 0, 0.45, 0.82, 0.45));
            matrices.push(createInstanceMatrix(toWorld, u + 0.5, v, 0.42, 0, 0.45, 0.82, 0.45));
          }
        }
      } else {
        const cols = roomWidth > 12 ? 4 : 2;
        const colSpacing = roomWidth / (cols + 1);
        const rows = [33.4, 35.9, 38.4, 40.9];

        for (let c = 1; c <= cols; c++) {
          const u = room.minU + c * colSpacing;
          for (const v of rows) {
            matrices.push(createInstanceMatrix(toWorld, u - 0.5, v, 0.42, Math.PI, 0.45, 0.82, 0.45));
            matrices.push(createInstanceMatrix(toWorld, u + 0.5, v, 0.42, Math.PI, 0.45, 0.82, 0.45));
          }
        }
      }
    }

    return matrices;
  }, [rooms, toWorld]);

  // 4. Bảng từ ở đầu mỗi phòng học
  const boardMatrices = useMemo(() => {
    const matrices: Matrix4[] = [];

    for (const room of rooms) {
      if (!room.code.includes('.B8')) continue;
      const centerU = (room.minU + room.maxU) / 2;
      const isNorth = room.minV === 0;

      if (isNorth) {
        // Gắn tường Bắc
        matrices.push(createInstanceMatrix(toWorld, centerU, 0.15, 1.8, 0, 3.8, 1.3, 0.06));
      } else {
        // Gắn tường Nam
        matrices.push(createInstanceMatrix(toWorld, centerU, 44.05, 1.8, Math.PI, 3.8, 1.3, 0.06));
      }
    }

    return matrices;
  }, [rooms, toWorld]);

  // 5. Lan can inox bảo vệ sân trong (chỉ tầng 2, 3, 4)
  const railingMatrices = useMemo(() => {
    if (floor === 1) return [];
    const matrices: Matrix4[] = [];

    // Các đoạn mép sân trong:
    const edges = [
      // Sân Tây
      { u1: 6.8, v1: 14.5, u2: 41.4, v2: 14.5 },
      { u1: 6.8, v1: 27.3, u2: 41.4, v2: 27.3 },
      { u1: 6.8, v1: 14.5, u2: 6.8, v2: 27.3 },
      { u1: 41.4, v1: 14.5, u2: 41.4, v2: 27.3 },
      // Sân Đông
      { u1: 45.8, v1: 14.5, u2: 105.4, v2: 14.5 },
      { u1: 45.8, v1: 27.3, u2: 105.4, v2: 27.3 },
      { u1: 45.8, v1: 14.5, u2: 45.8, v2: 18.5 },
      { u1: 45.8, v1: 22.5, u2: 45.8, v2: 27.3 },
      { u1: 105.4, v1: 14.5, u2: 105.4, v2: 27.3 },
    ];

    for (const e of edges) {
      const len = Math.hypot(e.u2 - e.u1, e.v2 - e.v1);
      const midU = (e.u1 + e.u2) / 2;
      const midV = (e.v1 + e.v2) / 2;
      const angle = Math.atan2(e.v2 - e.v1, e.u2 - e.u1);

      // Thanh tay vịn trên cùng (y = 1.05)
      matrices.push(createInstanceMatrix(toWorld, midU, midV, 1.05, angle, len, 0.05, 0.05));
      // Thanh giữa (y = 0.6)
      matrices.push(createInstanceMatrix(toWorld, midU, midV, 0.6, angle, len, 0.04, 0.04));
      // Thanh dưới (y = 0.15)
      matrices.push(createInstanceMatrix(toWorld, midU, midV, 0.15, angle, len, 0.04, 0.04));

      // Trụ đứng cách nhau ~2m
      const postCount = Math.max(2, Math.floor(len / 2.0));
      for (let i = 0; i <= postCount; i++) {
        const t = i / postCount;
        const pu = e.u1 + t * (e.u2 - e.u1);
        const pv = e.v1 + t * (e.v2 - e.v1);
        matrices.push(createInstanceMatrix(toWorld, pu, pv, 0.55, 0, 0.05, 1.1, 0.05));
      }
    }

    return matrices;
  }, [floor, toWorld]);

  // 6. Viền sàn xanh dương đặc trưng dọc mép lan can sân trong (chỉ tầng 2, 3, 4)
  const blueTrimMatrices = useMemo(() => {
    if (floor === 1) return [];
    const matrices: Matrix4[] = [];

    // Mép Bắc sân trong (v = 14.5) viền lùi vào hành lang ở v = 14.3
    const lenWest = 41.4 - 6.8;
    matrices.push(createInstanceMatrix(toWorld, (6.8 + 41.4) / 2, 14.3, 0.005, 0, lenWest, 0.01, 0.35));
    const lenEast = 105.4 - 45.8;
    matrices.push(createInstanceMatrix(toWorld, (45.8 + 105.4) / 2, 14.3, 0.005, 0, lenEast, 0.01, 0.35));

    // Mép Nam sân trong (v = 27.3) viền lùi vào hành lang ở v = 27.5
    matrices.push(createInstanceMatrix(toWorld, (6.8 + 41.4) / 2, 27.5, 0.005, 0, lenWest, 0.01, 0.35));
    matrices.push(createInstanceMatrix(toWorld, (45.8 + 105.4) / 2, 27.5, 0.005, 0, lenEast, 0.01, 0.35));

    return matrices;
  }, [floor, toWorld]);

  // 7. Lam che nắng trên hành lang mở nhìn ra sân trong (chỉ tầng 2, 3, 4)
  const louverMatrices = useMemo(() => {
    if (floor === 1) return [];
    const matrices: Matrix4[] = [];

    // Lam nhôm ngang ở độ cao 3.2m - 3.6m
    const louverHeights = [3.2, 3.4, 3.6];
    const lenWest = 41.4 - 6.8;
    const lenEast = 105.4 - 45.8;

    for (const y of louverHeights) {
      // Dãy Bắc nhìn vào sân trong
      matrices.push(createInstanceMatrix(toWorld, (6.8 + 41.4) / 2, 14.5, y, 0, lenWest, 0.04, 0.25));
      matrices.push(createInstanceMatrix(toWorld, (45.8 + 105.4) / 2, 14.5, y, 0, lenEast, 0.04, 0.25));
      // Dãy Nam nhìn vào sân trong
      matrices.push(createInstanceMatrix(toWorld, (6.8 + 41.4) / 2, 27.3, y, 0, lenWest, 0.04, 0.25));
      matrices.push(createInstanceMatrix(toWorld, (45.8 + 105.4) / 2, 27.3, y, 0, lenEast, 0.04, 0.25));
    }

    return matrices;
  }, [floor, toWorld]);

  // 8. Cây xanh & bồn cây trong sân trong ở tầng 1 (hiển thị khi đứng ở bất kỳ tầng nào)
  const courtyardTrees = useMemo(() => {
    // Độ cao tầng trệt so với tầng hiện tại
    const groundElevation = -(floor - 1) * FLOOR_HEIGHT;

    // Vị trí các cây lớn trong sân trong (u, v)
    const treeLocs: [number, number][] = [
      // Sân Tây
      [15.0, 20.9],
      [26.0, 20.9],
      [36.0, 20.9],
      // Sân Đông
      [58.0, 20.9],
      [70.0, 20.9],
      [82.0, 20.9],
      [94.0, 20.9],
    ];

    const planterMatrices: Matrix4[] = [];
    const trunkMatrices: Matrix4[] = [];
    const foliageMatrices: Matrix4[] = [];

    for (const [u, v] of treeLocs) {
      // Bồn cây vuông bằng đá
      planterMatrices.push(createInstanceMatrix(toWorld, u, v, groundElevation + 0.35, 0, 3.2, 0.7, 3.2));
      // Thân cây cao vươn lên
      trunkMatrices.push(createInstanceMatrix(toWorld, u, v, groundElevation + 4.5, 0, 0.45, 8.0, 0.45));
      // Tán lá xanh um tùm
      foliageMatrices.push(createInstanceMatrix(toWorld, u, v, groundElevation + 8.5, 0, 5.0, 6.0, 5.0));
    }

    return { planterMatrices, trunkMatrices, foliageMatrices };
  }, [floor, toWorld]);

  // 9. Cầu thang bộ (4 cụm cầu thang)
  const stairSteps = useMemo(() => {
    const matrices: Matrix4[] = [];
    const stepCount = 14;

    const stairLocations = [
      { startU: 2.0, startV: 5.0, dirU: 0.3, dirV: 0 },   // Tây Bắc
      { startU: 2.0, startV: 38.0, dirU: 0.3, dirV: 0 },  // Tây Nam
      { startU: 42.0, startV: 18.5, dirU: 0, dirV: 0.3 }, // Giữa
      { startU: 100.0, startV: 20.0, dirU: 0.3, dirV: 0 }, // Đông
    ];

    for (const st of stairLocations) {
      for (let i = 0; i < stepCount; i++) {
        const u = st.startU + i * st.dirU;
        const v = st.startV + i * st.dirV;
        const y = (i / stepCount) * FLOOR_HEIGHT + 0.12;
        matrices.push(createInstanceMatrix(toWorld, u, v, y, 0, 1.4, 0.22, 1.2));
      }
    }

    return matrices;
  }, [toWorld]);

  const boxGeo = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const cylinderGeo = useMemo(() => new CylinderGeometry(0.5, 0.5, 1, 12), []);

  return (
    <group>
      {/* 1. Cột bê tông */}
      {columnMatrices.length > 0 && (
        <instancedMesh
          args={[boxGeo, undefined, columnMatrices.length]}
          castShadow
          receiveShadow
          onUpdate={(self) => {
            columnMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#42322c" roughness={0.8} />
        </instancedMesh>
      )}

      {/* 2. Bàn học sinh / sinh viên */}
      {deskMatrices.length > 0 && (
        <instancedMesh
          args={[boxGeo, undefined, deskMatrices.length]}
          castShadow
          receiveShadow
          onUpdate={(self) => {
            deskMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#d4a373" roughness={0.6} />
        </instancedMesh>
      )}

      {/* 3. Ghế sinh viên */}
      {chairMatrices.length > 0 && (
        <instancedMesh
          args={[boxGeo, undefined, chairMatrices.length]}
          castShadow
          receiveShadow
          onUpdate={(self) => {
            chairMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </instancedMesh>
      )}

      {/* 4. Bảng từ */}
      {boardMatrices.length > 0 && (
        <instancedMesh
          args={[boxGeo, undefined, boardMatrices.length]}
          receiveShadow
          onUpdate={(self) => {
            boardMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#064e3b" roughness={0.3} metalness={0.1} />
        </instancedMesh>
      )}

      {/* 5. Lan can inox sân trong */}
      {railingMatrices.length > 0 && (
        <instancedMesh
          args={[boxGeo, undefined, railingMatrices.length]}
          castShadow
          receiveShadow
          onUpdate={(self) => {
            railingMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
        </instancedMesh>
      )}

      {/* 6. Viền sàn xanh dương */}
      {blueTrimMatrices.length > 0 && (
        <instancedMesh
          args={[boxGeo, undefined, blueTrimMatrices.length]}
          receiveShadow
          onUpdate={(self) => {
            blueTrimMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#0284c7" roughness={0.3} />
        </instancedMesh>
      )}

      {/* 7. Lam che nắng */}
      {louverMatrices.length > 0 && (
        <instancedMesh
          args={[boxGeo, undefined, louverMatrices.length]}
          castShadow
          onUpdate={(self) => {
            louverMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.25} />
        </instancedMesh>
      )}

      {/* 8. Cây xanh & bồn cây sân trong */}
      {courtyardTrees.planterMatrices.length > 0 && (
        <>
          {/* Bồn cây đá */}
          <instancedMesh
            args={[boxGeo, undefined, courtyardTrees.planterMatrices.length]}
            castShadow
            receiveShadow
            onUpdate={(self) => {
              courtyardTrees.planterMatrices.forEach((m, i) => self.setMatrixAt(i, m));
              self.instanceMatrix.needsUpdate = true;
            }}
          >
            <meshStandardMaterial color="#475569" roughness={0.7} />
          </instancedMesh>
          {/* Thân cây gỗ */}
          <instancedMesh
            args={[cylinderGeo, undefined, courtyardTrees.trunkMatrices.length]}
            castShadow
            receiveShadow
            onUpdate={(self) => {
              courtyardTrees.trunkMatrices.forEach((m, i) => self.setMatrixAt(i, m));
              self.instanceMatrix.needsUpdate = true;
            }}
          >
            <meshStandardMaterial color="#5c3d2e" roughness={0.9} />
          </instancedMesh>
          {/* Tán lá xanh um tùm */}
          <instancedMesh
            args={[cylinderGeo, undefined, courtyardTrees.foliageMatrices.length]}
            castShadow
            receiveShadow
            onUpdate={(self) => {
              courtyardTrees.foliageMatrices.forEach((m, i) => self.setMatrixAt(i, m));
              self.instanceMatrix.needsUpdate = true;
            }}
          >
            <meshStandardMaterial color="#16a34a" roughness={0.8} />
          </instancedMesh>
        </>
      )}

      {/* 9. Bậc thang bộ */}
      {stairSteps.length > 0 && (
        <instancedMesh
          args={[boxGeo, undefined, stairSteps.length]}
          castShadow
          receiveShadow
          onUpdate={(self) => {
            stairSteps.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#64748b" roughness={0.7} />
        </instancedMesh>
      )}

      {/* 10. Buồng thang máy duy nhất của B8 (ở nhịp giữa) */}
      <B8ElevatorBooth floor={floor} />
    </group>
  );
}

/**
 * Buồng thang máy B8 tại nhịp giữa
 */
function B8ElevatorBooth({ floor }: { floor: number }) {
  const [worldX, worldZ] = b8Layout.elevator.posWorld;
  const yaw = getLocalFacingYaw(b8Layout.toWorld, 0);
  const ledColors = ['#38bdf8', '#34d399', '#f59e0b', '#ec4899'];
  const ledColor = ledColors[floor - 1] ?? '#38bdf8';

  return (
    <group position={[worldX, 0, worldZ]} rotation-y={yaw}>
      {/* Khung buồng thang máy */}
      <mesh position={[-0.05, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 2.6, 2.4]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Cửa inox sáng */}
      <mesh position={[-0.12, 1.2, -0.52]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 2.35, 1.0]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[-0.12, 1.2, 0.52]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 2.35, 1.0]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Bảng số tầng LED sáng bên trên */}
      <mesh position={[-0.18, 2.6, 0]}>
        <boxGeometry args={[0.05, 0.35, 0.7]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-0.22, 2.6, 0]}>
        <boxGeometry args={[0.01, 0.18, 0.35]} />
        <meshStandardMaterial
          color={ledColor}
          emissive={ledColor}
          emissiveIntensity={1.2}
          roughness={0.1}
        />
      </mesh>

      <pointLight position={[-0.8, 2.4, 0]} color={ledColor} intensity={0.6} distance={3.5} />
    </group>
  );
}

// =============================================================================
// NỘI THẤT BLOCK 3: KHOA QUẢN TRỊ KINH DOANH (BẢO LƯU T12)
// =============================================================================

function B3Furniture({ floor }: { floor: number }) {
  const toWorld = b3Layout.toWorld;

  const columnMatrices = useMemo(() => {
    const matrices: Matrix4[] = [];
    const gridU = [-64, -56, -48, -40, -32, -24, -16, -8, 8, 16, 24, 32];
    const gridV = [8, 16, 24, 32];

    for (const u of gridU) {
      for (const v of gridV) {
        const insideEast = u >= 0 && u <= 34 && v >= 4 && v <= 36;
        const insideWest = u >= -68 && u < 0 && v >= 14 && v <= 38;
        if (!insideEast && !insideWest) continue;

        if (floor === 1 && u >= 12 && u <= 20 && v <= 6) continue;
        if (u >= 18 && u <= 26 && v >= 16 && v <= 24) continue;
        if (floor >= 2 && u >= -68 && u <= -20 && v >= 14 && v <= 38) continue;

        matrices.push(createInstanceMatrix(toWorld, u, v, FLOOR_HEIGHT / 2, 0, 0.55, FLOOR_HEIGHT, 0.55));
      }
    }
    return matrices;
  }, [floor, toWorld]);

  const blueChairMatrices = useMemo(() => {
    const matrices: Matrix4[] = [];

    if (floor === 1) {
      for (let row = 0; row < 5; row++) {
        const v = 30 + row * 1.6;
        for (let col = 0; col < 12; col++) {
          const u = -34 + col * 2.3;
          matrices.push(createInstanceMatrix(toWorld, u, v, 0.42, 0, 0.55, 0.8, 0.5));
        }
      }
    } else if (floor === 2) {
      for (let row = 0; row < 12; row++) {
        const u = -22 - row * 2.8;
        const tierElevation = (11 - row) * 0.18;
        for (let col = 0; col < 18; col++) {
          if (col === 8 || col === 9) continue;
          const v = 15.5 + col * 1.2;
          matrices.push(createInstanceMatrix(toWorld, u, v, 0.45 + tierElevation, Math.PI, 0.58, 0.85, 0.52));
        }
      }
    }
    return matrices;
  }, [floor, toWorld]);

  const deskMatrices = useMemo(() => {
    const matrices: Matrix4[] = [];

    if (floor === 1) {
      for (let row = 0; row < 4; row++) {
        const v = 15 + row * 2.2;
        for (let col = 0; col < 6; col++) {
          const u = -44 + col * 3.8;
          matrices.push(createInstanceMatrix(toWorld, u, v, 0.38, 0, 2.0, 0.75, 0.6));
        }
      }
      for (let row = 0; row < 4; row++) {
        const v = 15 + row * 2.2;
        for (let col = 0; col < 5; col++) {
          const u = -68 + col * 3.8;
          matrices.push(createInstanceMatrix(toWorld, u, v, 0.38, 0, 2.0, 0.75, 0.6));
        }
      }
      matrices.push(createInstanceMatrix(toWorld, 5.0, 18.0, 0.38, Math.PI / 2, 4.5, 0.76, 1.8));
      matrices.push(createInstanceMatrix(toWorld, 16.0, 8.0, 0.55, 0, 3.2, 1.1, 0.9));
    } else if (floor === 2) {
      for (const centerU of [-9, 27]) {
        for (const centerV of [18, 31]) {
          for (let r = 0; r < 3; r++) {
            const v = centerV - 3 + r * 2.4;
            matrices.push(createInstanceMatrix(toWorld, centerU, v, 0.38, 0, 5.0, 0.75, 0.65));
          }
        }
      }
    } else if (floor === 3) {
      for (const centerU of [27]) {
        for (const centerV of [11, 31]) {
          for (let r = 0; r < 3; r++) {
            const v = centerV - 3 + r * 2.4;
            matrices.push(createInstanceMatrix(toWorld, centerU, v, 0.38, 0, 5.0, 0.75, 0.65));
          }
        }
      }
      matrices.push(createInstanceMatrix(toWorld, -2.0, 18.0, 0.38, 0, 3.0, 0.75, 1.2));
    }

    return matrices;
  }, [floor, toWorld]);

  const deskChairMatrices = useMemo(() => {
    const matrices: Matrix4[] = [];

    if (floor === 1) {
      for (let i = 0; i < 6; i++) {
        matrices.push(createInstanceMatrix(toWorld, 3.0 + i * 0.8, 16.5, 0.42, 0, 0.45, 0.85, 0.45));
        matrices.push(createInstanceMatrix(toWorld, 3.0 + i * 0.8, 19.5, 0.42, Math.PI, 0.45, 0.85, 0.45));
      }
      for (let i = 0; i < 4; i++) {
        matrices.push(createInstanceMatrix(toWorld, -15 + i * 3.2, 17, 0.42, 0, 0.48, 0.85, 0.48));
        matrices.push(createInstanceMatrix(toWorld, 24 + i * 2.8, 30, 0.42, 0, 0.48, 0.85, 0.48));
      }
    } else if (floor >= 2) {
      for (let i = 0; i < 12; i++) {
        matrices.push(createInstanceMatrix(toWorld, 22 + (i % 4) * 2.5, 9 + Math.floor(i / 4) * 2.4, 0.42, 0, 0.45, 0.82, 0.45));
      }
    }

    return matrices;
  }, [floor, toWorld]);

  const plantMatrices = useMemo(() => {
    const matrices: Matrix4[] = [];

    if (floor === 1) {
      matrices.push(createInstanceMatrix(toWorld, 10.0, 4.0, 0.6, 0, 0.8, 1.4, 0.8));
      matrices.push(createInstanceMatrix(toWorld, 22.0, 4.0, 0.6, 0, 0.8, 1.4, 0.8));
      matrices.push(createInstanceMatrix(toWorld, 12.0, 14.0, 0.6, 0, 0.8, 1.4, 0.8));
      matrices.push(createInstanceMatrix(toWorld, -38.0, 26.0, 0.6, 0, 0.8, 1.4, 0.8));
      matrices.push(createInstanceMatrix(toWorld, -55.0, 36.0, 0.6, 0, 0.8, 1.4, 0.8));
      matrices.push(createInstanceMatrix(toWorld, 18.0, 26.0, 0.6, 0, 0.8, 1.4, 0.8));
    } else if (floor === 2) {
      matrices.push(createInstanceMatrix(toWorld, 16.0, 18.0, 0.6, 0, 0.8, 1.4, 0.8));
      matrices.push(createInstanceMatrix(toWorld, -16.0, 22.0, 0.6, 0, 0.8, 1.4, 0.8));
      matrices.push(createInstanceMatrix(toWorld, -16.0, 29.0, 0.6, 0, 0.8, 1.4, 0.8));
    } else if (floor === 3) {
      matrices.push(createInstanceMatrix(toWorld, 16.0, 18.0, 0.6, 0, 0.8, 1.4, 0.8));
      matrices.push(createInstanceMatrix(toWorld, -16.0, 26.0, 0.6, 0, 0.8, 1.4, 0.8));
    }

    return matrices;
  }, [floor, toWorld]);

  const boardMatrices = useMemo(() => {
    const matrices: Matrix4[] = [];

    if (floor === 1) {
      matrices.push(createInstanceMatrix(toWorld, -34.0, 12.2, 1.8, 0, 4.0, 1.4, 0.08));
      matrices.push(createInstanceMatrix(toWorld, -58.0, 12.2, 1.8, 0, 4.0, 1.4, 0.08));
      matrices.push(createInstanceMatrix(toWorld, 5.0, 12.2, 1.8, 0, 3.2, 1.3, 0.08));
    } else if (floor === 2) {
      matrices.push(createInstanceMatrix(toWorld, -69.5, 26.0, 2.8, Math.PI / 2, 0.1, 3.2, 10.0));
      matrices.push(createInstanceMatrix(toWorld, -9.0, 12.2, 1.8, 0, 4.5, 1.4, 0.08));
      matrices.push(createInstanceMatrix(toWorld, 27.0, 4.2, 1.8, 0, 4.5, 1.4, 0.08));
    } else if (floor === 3) {
      matrices.push(createInstanceMatrix(toWorld, 27.0, 4.2, 1.8, 0, 4.5, 1.4, 0.08));
    }

    return matrices;
  }, [floor, toWorld]);

  const columnGeo = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const chairGeo = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const deskGeo = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const plantPotGeo = useMemo(() => new CylinderGeometry(0.35, 0.25, 0.5, 10), []);
  const plantFoliageGeo = useMemo(() => new CylinderGeometry(0.1, 0.6, 0.9, 8), []);
  const boardGeo = useMemo(() => new BoxGeometry(1, 1, 1), []);

  return (
    <group>
      {columnMatrices.length > 0 && (
        <instancedMesh
          args={[columnGeo, undefined, columnMatrices.length]}
          castShadow
          receiveShadow
          onUpdate={(self) => {
            columnMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#f1f5f9" roughness={0.7} />
        </instancedMesh>
      )}

      {blueChairMatrices.length > 0 && (
        <instancedMesh
          args={[chairGeo, undefined, blueChairMatrices.length]}
          castShadow
          receiveShadow
          onUpdate={(self) => {
            blueChairMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#1d4ed8" roughness={0.5} />
        </instancedMesh>
      )}

      {deskMatrices.length > 0 && (
        <instancedMesh
          args={[deskGeo, undefined, deskMatrices.length]}
          castShadow
          receiveShadow
          onUpdate={(self) => {
            deskMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#d4a373" roughness={0.6} />
        </instancedMesh>
      )}

      {deskChairMatrices.length > 0 && (
        <instancedMesh
          args={[chairGeo, undefined, deskChairMatrices.length]}
          castShadow
          receiveShadow
          onUpdate={(self) => {
            deskChairMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </instancedMesh>
      )}

      {plantMatrices.length > 0 && (
        <>
          <instancedMesh
            args={[plantPotGeo, undefined, plantMatrices.length]}
            castShadow
            receiveShadow
            onUpdate={(self) => {
              plantMatrices.forEach((m, i) => {
                const potMatrix = m.clone().multiply(new Matrix4().makeTranslation(0, -0.3, 0));
                self.setMatrixAt(i, potMatrix);
              });
              self.instanceMatrix.needsUpdate = true;
            }}
          >
            <meshStandardMaterial color="#ffffff" roughness={0.4} />
          </instancedMesh>
          <instancedMesh
            args={[plantFoliageGeo, undefined, plantMatrices.length]}
            castShadow
            receiveShadow
            onUpdate={(self) => {
              plantMatrices.forEach((m, i) => {
                const leafMatrix = m.clone().multiply(new Matrix4().makeTranslation(0, 0.35, 0));
                self.setMatrixAt(i, leafMatrix);
              });
              self.instanceMatrix.needsUpdate = true;
            }}
          >
            <meshStandardMaterial color="#15803d" roughness={0.8} />
          </instancedMesh>
        </>
      )}

      {boardMatrices.length > 0 && (
        <instancedMesh
          args={[boardGeo, undefined, boardMatrices.length]}
          receiveShadow
          onUpdate={(self) => {
            boardMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.1} />
        </instancedMesh>
      )}

      <ColorfulStairs />
      <B3ElevatorBooth floor={floor} />
      {floor === 2 && <AuditoriumStage />}
    </group>
  );
}

function ColorfulStairs() {
  const toWorld = b3Layout.toWorld;
  const steps = useMemo(() => {
    const items = [];
    const colors = ['#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6'];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const u = 25.0 + (i / count) * 4.0;
      const v = 20.0;
      const y = (i / count) * FLOOR_HEIGHT;
      const matrix = createInstanceMatrix(toWorld, u, v, y + 0.12, 0, 0.45, 0.24, 2.2);
      items.push({ matrix, color: colors[i % colors.length] });
    }
    return items;
  }, [toWorld]);

  const boxGeo = useMemo(() => new BoxGeometry(1, 1, 1), []);

  return (
    <group>
      {steps.map((st, i) => (
        <mesh
          key={i}
          geometry={boxGeo}
          castShadow
          receiveShadow
          onUpdate={(self) => {
            self.applyMatrix4(st.matrix);
          }}
        >
          <meshStandardMaterial color={st.color} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function B3ElevatorBooth({ floor }: { floor: number }) {
  const [worldX, worldZ] = b3Layout.elevator.posWorld;
  const yaw = getLocalFacingYaw(b3Layout.toWorld, 0);
  const ledColor = floor === 1 ? '#38bdf8' : floor === 2 ? '#34d399' : '#f59e0b';

  return (
    <group position={[worldX, 0, worldZ]} rotation-y={yaw}>
      <mesh position={[-0.05, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 2.6, 2.4]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[-0.12, 1.2, -0.52]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 2.35, 1.0]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[-0.12, 1.2, 0.52]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 2.35, 1.0]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[-0.18, 2.6, 0]}>
        <boxGeometry args={[0.05, 0.35, 0.7]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-0.22, 2.6, 0]}>
        <boxGeometry args={[0.01, 0.18, 0.35]} />
        <meshStandardMaterial
          color={ledColor}
          emissive={ledColor}
          emissiveIntensity={1.2}
          roughness={0.1}
        />
      </mesh>
      <pointLight position={[-0.8, 2.4, 0]} color={ledColor} intensity={0.5} distance={3.5} />
    </group>
  );
}

function AuditoriumStage() {
  const [worldX, worldZ] = b3Layout.toWorld(-65.0, 26.0);
  const yaw = getLocalFacingYaw(b3Layout.toWorld, 0);

  return (
    <group position={[worldX, 0, worldZ]} rotation-y={yaw}>
      <mesh position={[0, 0.325, 0]} castShadow receiveShadow>
        <boxGeometry args={[8.0, 0.65, 18.0]} />
        <meshStandardMaterial color="#292524" roughness={0.7} />
      </mesh>
      <mesh position={[2.5, 1.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 1.0, 0.8]} />
        <meshStandardMaterial color="#78350f" roughness={0.4} />
      </mesh>
      <pointLight position={[1.0, 3.5, 0]} color="#fbbf24" intensity={1.8} distance={15} />
    </group>
  );
}
