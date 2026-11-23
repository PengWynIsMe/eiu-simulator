import { useMemo } from 'react';
import { Matrix4, Vector3, Quaternion, Euler, BoxGeometry, CylinderGeometry } from 'three';
import { FLOOR_HEIGHT } from '../../data';
import type { Vec2 } from '../../types';
import { b3Layout } from './layouts/b3';
import B8Furniture from './B8Furniture';
import B11Furniture from './B11Furniture';
import B4Furniture from './B4Furniture';

interface FurnitureProps {
  buildingId: string;
  floor: number;
  showUpperFloors?: boolean;
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

export default function InteriorFurniture({
  buildingId,
  floor,
  showUpperFloors = true,
}: FurnitureProps) {
  const id = buildingId.toLowerCase();
  if (id === 'b8') {
    return <B8Furniture floor={floor} showUpperFloors={showUpperFloors} />;
  }
  if (id === 'b11') {
    return <B11Furniture floor={floor} showUpperFloors={showUpperFloors} />;
  }
  if (id === 'b4') {
    return <B4Furniture floor={floor} showUpperFloors={showUpperFloors} />;
  }
  if (id === 'b3') {
    return <B3Furniture floor={floor} />;
  }
  return null;
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

      <ColorfulStairs floor={floor} />
      <B3ElevatorBooth floor={floor} />
      {floor === 2 && <AuditoriumStage />}
    </group>
  );
}

function ColorfulStairs({ floor }: { floor: number }) {
  const toWorld = b3Layout.toWorld;
  const steps = useMemo(() => {
    const items: { matrix: Matrix4; color: string }[] = [];
    const colors = ['#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6'];
    const count = 12;
    const offsets: number[] = [];
    if (floor < 3) offsets.push(0);
    if (floor > 1) offsets.push(-FLOOR_HEIGHT);

    for (const dy of offsets) {
      for (let i = 0; i < count; i++) {
        const t = (i + 0.5) / count;
        const u = 25.0 + t * 4.0;
        const v = 20.0;
        const y = dy + ((i + 1) / count) * FLOOR_HEIGHT - 0.16;
        const matrix = createInstanceMatrix(toWorld, u, v, y, 0, 0.42, 0.34, 2.2);
        items.push({ matrix, color: colors[i % colors.length] ?? '#3b82f6' });
      }
    }
    return items;
  }, [floor, toWorld]);

  const boxGeo = useMemo(() => new BoxGeometry(1, 1, 1), []);

  return (
    <group key={`b3-stairs-${floor}`}>
      {steps.map((st, i) => (
        <mesh
          key={i}
          geometry={boxGeo}
          matrixAutoUpdate={false}
          matrix={st.matrix}
          castShadow
          receiveShadow
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
