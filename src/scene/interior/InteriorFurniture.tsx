import { useMemo } from 'react';
import { Matrix4, Vector3, Quaternion, Euler, BoxGeometry, CylinderGeometry } from 'three';
import { toWorld } from './b3Layout';
import { FLOOR_HEIGHT } from '../../data';

interface FurnitureProps {
  floor: number;
}

/**
 * Tính góc quay Euler Y trong không gian thế giới (Three.js) cho một hướng quay địa phương trong mặt phẳng UV.
 */
export function getLocalFacingYaw(localRotY = 0): number {
  const dirU = Math.cos(localRotY);
  const dirV = Math.sin(localRotY);
  const p0 = toWorld(0, 0);
  const p1 = toWorld(dirU, dirV);
  return -Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
}

/**
 * Tạo Matrix4 cho một object ở tọa độ địa phương B3 (u, v, y) chuyển đổi thẳng sang hệ tọa độ thế giới.
 */
function createInstanceMatrix(
  u: number,
  v: number,
  y: number,
  localRotY = 0,
  scaleX = 1,
  scaleY = 1,
  scaleZ = 1
): Matrix4 {
  const [worldX, worldZ] = toWorld(u, v);
  const yaw = getLocalFacingYaw(localRotY);
  const position = new Vector3(worldX, y, worldZ);
  const rotation = new Quaternion().setFromEuler(new Euler(0, yaw, 0));
  const scale = new Vector3(scaleX, scaleY, scaleZ);
  return new Matrix4().compose(position, rotation, scale);
}

export default function InteriorFurniture({ floor }: FurnitureProps) {
  // 1. Cột kết cấu bê tông (Lưới ~8m)
  const columnMatrices = useMemo(() => {
    const matrices: Matrix4[] = [];
    const gridU = [-64, -56, -48, -40, -32, -24, -16, -8, 8, 16, 24, 32];
    const gridV = [8, 16, 24, 32];

    for (const u of gridU) {
      for (const v of gridV) {
        // Chỉ đặt cột bên trong diện tích sàn
        const insideEast = u >= 0 && u <= 34 && v >= 4 && v <= 36;
        const insideWest = u >= -68 && u < 0 && v >= 14 && v <= 38;
        if (!insideEast && !insideWest) continue;

        // Tránh đặt ngay cửa chính, thang máy, lối đi trung tâm
        if (floor === 1 && u >= 12 && u <= 20 && v <= 6) continue;
        if (u >= 18 && u <= 26 && v >= 16 && v <= 24) continue; // khu thang máy & cầu thang
        if (floor >= 2 && u >= -68 && u <= -20 && v >= 14 && v <= 38) continue; // hội trường 200.B3 không có cột giữa

        matrices.push(createInstanceMatrix(u, v, FLOOR_HEIGHT / 2, 0, 0.55, FLOOR_HEIGHT, 0.55));
      }
    }
    return matrices;
  }, [floor]);

  // 2. Ghế hội thảo & hội trường (Màu xanh dương đặc trưng EIU B3)
  const blueChairMatrices = useMemo(() => {
    const matrices: Matrix4[] = [];

    if (floor === 1) {
      // Khu vực hội thảo tầng 1 (u ∈ [-36, -6], v ∈ [30, 38])
      for (let row = 0; row < 5; row++) {
        const v = 30 + row * 1.6;
        for (let col = 0; col < 12; col++) {
          const u = -34 + col * 2.3;
          matrices.push(createInstanceMatrix(u, v, 0.42, 0, 0.55, 0.8, 0.5));
        }
      }
    } else if (floor === 2) {
      // Hội trường lớn 200.B3 (u ∈ [-60, -22], v ∈ [15, 37]) - Bậc thang hướng về sân khấu phía Tây
      for (let row = 0; row < 12; row++) {
        const u = -22 - row * 2.8;
        const tierElevation = (11 - row) * 0.18; // Bậc nâng dần từ sân khấu
        for (let col = 0; col < 18; col++) {
          // Lối đi ở giữa
          if (col === 8 || col === 9) continue;
          const v = 15.5 + col * 1.2;
          matrices.push(createInstanceMatrix(u, v, 0.45 + tierElevation, Math.PI, 0.58, 0.85, 0.52));
        }
      }
    }
    return matrices;
  }, [floor]);

  // 3. Bàn học sinh / sinh viên (Phòng học lý thuyết và giảng đường)
  const deskMatrices = useMemo(() => {
    const matrices: Matrix4[] = [];

    if (floor === 1) {
      // Phòng 102–103.B3: Các dãy bàn học sinh viên
      for (let row = 0; row < 4; row++) {
        const v = 15 + row * 2.2;
        for (let col = 0; col < 6; col++) {
          const u = -44 + col * 3.8;
          matrices.push(createInstanceMatrix(u, v, 0.38, 0, 2.0, 0.75, 0.6));
        }
      }
      // Phòng P.107
      for (let row = 0; row < 4; row++) {
        const v = 15 + row * 2.2;
        for (let col = 0; col < 5; col++) {
          const u = -68 + col * 3.8;
          matrices.push(createInstanceMatrix(u, v, 0.38, 0, 2.0, 0.75, 0.6));
        }
      }
      // Phòng họp 101.B3: Bàn họp lớn hội nghị ở giữa
      matrices.push(createInstanceMatrix(5.0, 18.0, 0.38, Math.PI / 2, 4.5, 0.76, 1.8));
      // Bàn lễ tân sảnh chính
      matrices.push(createInstanceMatrix(16.0, 8.0, 0.55, 0, 3.2, 1.1, 0.9));
    } else if (floor === 2) {
      // Giảng đường 201–204
      for (const centerU of [-9, 27]) {
        for (const centerV of [18, 31]) {
          for (let r = 0; r < 3; r++) {
            const v = centerV - 3 + r * 2.4;
            matrices.push(createInstanceMatrix(centerU, v, 0.38, 0, 5.0, 0.75, 0.65));
          }
        }
      }
    } else if (floor === 3) {
      // Giảng đường 301, 302 và Văn phòng QTKD 303
      for (const centerU of [27]) {
        for (const centerV of [11, 31]) {
          for (let r = 0; r < 3; r++) {
            const v = centerV - 3 + r * 2.4;
            matrices.push(createInstanceMatrix(centerU, v, 0.38, 0, 5.0, 0.75, 0.65));
          }
        }
      }
      // Văn phòng 303.B3
      matrices.push(createInstanceMatrix(-2.0, 18.0, 0.38, 0, 3.0, 0.75, 1.2));
    }

    return matrices;
  }, [floor]);

  // 4. Ghế làm việc / ghế văn phòng / ghế họp (Màu đen/xám)
  const deskChairMatrices = useMemo(() => {
    const matrices: Matrix4[] = [];

    if (floor === 1) {
      // Ghế quanh bàn họp 101.B3
      for (let i = 0; i < 6; i++) {
        matrices.push(createInstanceMatrix(3.0 + i * 0.8, 16.5, 0.42, 0, 0.45, 0.85, 0.45));
        matrices.push(createInstanceMatrix(3.0 + i * 0.8, 19.5, 0.42, Math.PI, 0.45, 0.85, 0.45));
      }
      // Ghế trong văn phòng 104–105.B3 & OCE 108–110.B3
      for (let i = 0; i < 4; i++) {
        matrices.push(createInstanceMatrix(-15 + i * 3.2, 17, 0.42, 0, 0.48, 0.85, 0.48));
        matrices.push(createInstanceMatrix(24 + i * 2.8, 30, 0.42, 0, 0.48, 0.85, 0.48));
      }
    } else if (floor >= 2) {
      // Giảng đường
      for (let i = 0; i < 12; i++) {
        matrices.push(createInstanceMatrix(22 + (i % 4) * 2.5, 9 + Math.floor(i / 4) * 2.4, 0.42, 0, 0.45, 0.82, 0.45));
      }
    }

    return matrices;
  }, [floor]);

  // 5. Cây xanh trong chậu (Potted Plants)
  const plantMatrices = useMemo(() => {
    const matrices: Matrix4[] = [];

    if (floor === 1) {
      // Sảnh chính & không gian chung
      matrices.push(createInstanceMatrix(10.0, 4.0, 0.6, 0, 0.8, 1.4, 0.8));
      matrices.push(createInstanceMatrix(22.0, 4.0, 0.6, 0, 0.8, 1.4, 0.8));
      matrices.push(createInstanceMatrix(12.0, 14.0, 0.6, 0, 0.8, 1.4, 0.8));
      matrices.push(createInstanceMatrix(-38.0, 26.0, 0.6, 0, 0.8, 1.4, 0.8));
      matrices.push(createInstanceMatrix(-55.0, 36.0, 0.6, 0, 0.8, 1.4, 0.8));
      matrices.push(createInstanceMatrix(18.0, 26.0, 0.6, 0, 0.8, 1.4, 0.8));
    } else if (floor === 2) {
      matrices.push(createInstanceMatrix(16.0, 18.0, 0.6, 0, 0.8, 1.4, 0.8));
      matrices.push(createInstanceMatrix(-16.0, 22.0, 0.6, 0, 0.8, 1.4, 0.8));
      matrices.push(createInstanceMatrix(-16.0, 29.0, 0.6, 0, 0.8, 1.4, 0.8));
    } else if (floor === 3) {
      matrices.push(createInstanceMatrix(16.0, 18.0, 0.6, 0, 0.8, 1.4, 0.8));
      matrices.push(createInstanceMatrix(-16.0, 26.0, 0.6, 0, 0.8, 1.4, 0.8));
    }

    return matrices;
  }, [floor]);

  // 6. Bảng viết / màn chiếu gắn tường
  const boardMatrices = useMemo(() => {
    const matrices: Matrix4[] = [];

    if (floor === 1) {
      matrices.push(createInstanceMatrix(-34.0, 12.2, 1.8, 0, 4.0, 1.4, 0.08));
      matrices.push(createInstanceMatrix(-58.0, 12.2, 1.8, 0, 4.0, 1.4, 0.08));
      matrices.push(createInstanceMatrix(5.0, 12.2, 1.8, 0, 3.2, 1.3, 0.08));
    } else if (floor === 2) {
      // Màn hình hội trường lớn 200.B3
      matrices.push(createInstanceMatrix(-69.5, 26.0, 2.8, Math.PI / 2, 0.1, 3.2, 10.0));
      // Bảng các giảng đường
      matrices.push(createInstanceMatrix(-9.0, 12.2, 1.8, 0, 4.5, 1.4, 0.08));
      matrices.push(createInstanceMatrix(27.0, 4.2, 1.8, 0, 4.5, 1.4, 0.08));
    } else if (floor === 3) {
      matrices.push(createInstanceMatrix(27.0, 4.2, 1.8, 0, 4.5, 1.4, 0.08));
    }

    return matrices;
  }, [floor]);

  // Geometries dùng lại
  const columnGeo = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const chairGeo = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const deskGeo = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const plantPotGeo = useMemo(() => new CylinderGeometry(0.35, 0.25, 0.5, 10), []);
  const plantFoliageGeo = useMemo(() => new CylinderGeometry(0.1, 0.6, 0.9, 8), []);
  const boardGeo = useMemo(() => new BoxGeometry(1, 1, 1), []);

  return (
    <group>
      {/* 1. Cột bê tông */}
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

      {/* 2. Ghế xanh dương hội thảo / hội trường */}
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

      {/* 3. Bàn học sinh / bàn họp */}
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

      {/* 4. Ghế làm việc đen / xám */}
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

      {/* 5. Cây xanh trong chậu: chậu trắng + tán lá xanh */}
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

      {/* 6. Bảng từ / màn chiếu */}
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

      {/* 7. Cầu thang nhiều màu (Vị trí u = 26, v = 20) */}
      <ColorfulStairs />

      {/* 8. Thang máy (Vị trí u = 20, v = 20) */}
      <ElevatorBooth floor={floor} />

      {/* 9. Sân khấu hội trường 200.B3 (Chỉ tầng 2) */}
      {floor === 2 && <AuditoriumStage />}
    </group>
  );
}

/**
 * Cầu thang nhiều màu đặc trưng thấy trong tour 360 Block 3 EIU.
 */
function ColorfulStairs() {
  const steps = useMemo(() => {
    const items = [];
    const colors = ['#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6'];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const u = 25.0 + (i / count) * 4.0;
      const v = 20.0;
      const y = (i / count) * FLOOR_HEIGHT;
      const matrix = createInstanceMatrix(u, v, y + 0.12, 0, 0.45, 0.24, 2.2);
      items.push({ matrix, color: colors[i % colors.length] });
    }
    return items;
  }, []);

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

/**
 * Buồng thang máy với cửa thép inox sáng bóng và bảng điện tử hiển thị tầng.
 */
function ElevatorBooth({ floor }: { floor: number }) {
  const [worldX, worldZ] = toWorld(20.0, 20.0);
  const yaw = getLocalFacingYaw(0);
  const ledColor = floor === 1 ? '#38bdf8' : floor === 2 ? '#34d399' : '#f59e0b';

  return (
    <group position={[worldX, 0, worldZ]} rotation-y={yaw}>
      {/* Khung cửa thang máy */}
      <mesh position={[-0.05, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 2.6, 2.4]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Cửa inox đôi */}
      <mesh position={[-0.12, 1.2, -0.52]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 2.35, 1.0]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[-0.12, 1.2, 0.52]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 2.35, 1.0]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
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

      {/* Đèn chỉ báo tầng hiện tại */}
      <pointLight position={[-0.8, 2.4, 0]} color={ledColor} intensity={0.5} distance={3.5} />
    </group>
  );
}

/**
 * Sân khấu lớn cho Hội trường 200.B3 ở Tầng 2.
 */
function AuditoriumStage() {
  const [worldX, worldZ] = toWorld(-65.0, 26.0);
  const yaw = getLocalFacingYaw(0);

  return (
    <group position={[worldX, 0, worldZ]} rotation-y={yaw}>
      {/* Sàn sân khấu nâng cao 0.65m */}
      <mesh position={[0, 0.325, 0]} castShadow receiveShadow>
        <boxGeometry args={[8.0, 0.65, 18.0]} />
        <meshStandardMaterial color="#292524" roughness={0.7} />
      </mesh>

      {/* Bục phát biểu (Podium) */}
      <mesh position={[2.5, 1.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 1.0, 0.8]} />
        <meshStandardMaterial color="#78350f" roughness={0.4} />
      </mesh>

      {/* Dải đèn sân khấu ấm */}
      <pointLight position={[1.0, 3.5, 0]} color="#fbbf24" intensity={1.8} distance={15} />
    </group>
  );
}
