import { useLayoutEffect, useMemo, useRef } from 'react';
import { Text } from '@react-three/drei';
import {
  BoxGeometry,
  CylinderGeometry,
  Matrix4,
  type BufferGeometry,
  type InstancedMesh,
} from 'three';
import { FLOOR_HEIGHT } from '../../data';
import { createInstanceMatrix } from './InteriorFurniture';
import {
  toWorld,
  getLocalFacingYaw,
  B4_ELEVATOR_POS_LOCAL,
  B4_SWITCHBACK_STAIR,
} from './layouts/b4';
import { addSwitchbackFlight } from './stairMesh';

interface FurnitureProps {
  floor: number;
  showUpperFloors?: boolean;
}

interface InstancedBatchProps {
  readonly batchKey: string;
  readonly matrices: readonly Matrix4[];
  readonly geometry: BufferGeometry;
  readonly color: string;
  readonly roughness?: number;
  readonly metalness?: number;
  readonly emissive?: string;
  readonly emissiveIntensity?: number;
  readonly transparent?: boolean;
  readonly opacity?: number;
  readonly castShadow?: boolean;
  readonly polygonOffset?: boolean;
  readonly polygonOffsetFactor?: number;
  readonly polygonOffsetUnits?: number;
}

function InstancedBatch({
  matrices,
  geometry,
  color,
  roughness = 0.65,
  metalness = 0.08,
  emissive = '#000000',
  emissiveIntensity = 0,
  transparent = false,
  opacity = 1,
  castShadow = true,
  polygonOffset = false,
  polygonOffsetFactor = 0,
  polygonOffsetUnits = 0,
}: InstancedBatchProps) {
  const meshRef = useRef<InstancedMesh | null>(null);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const count = matrices.length;
    for (let i = 0; i < count; i++) {
      const mat = matrices[i];
      if (mat) meshRef.current.setMatrixAt(i, mat);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  if (matrices.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, matrices.length]}
      castShadow={castShadow}
      receiveShadow={castShadow}
    >
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        transparent={transparent}
        opacity={opacity}
        polygonOffset={polygonOffset}
        polygonOffsetFactor={polygonOffsetFactor}
        polygonOffsetUnits={polygonOffsetUnits}
      />
    </instancedMesh>
  );
}

// Bổ sung lan can kính cho thông tầng (Atrium void)
function addGlassRailing(
  postsSteel: Matrix4[],
  glassPanels: Matrix4[],
  handrails: Matrix4[],
  u1: number,
  v1: number,
  u2: number,
  v2: number,
  dy: number
) {
  const len = Math.hypot(u2 - u1, v2 - v1);
  if (len < 0.2) return;
  const midU = (u1 + u2) * 0.5;
  const midV = (v1 + v2) * 0.5;
  const angle = Math.atan2(v2 - v1, u2 - u1);

  // Tay vịn tròn inox phía trên ở y = 1.05m
  handrails.push(createInstanceMatrix(toWorld, midU, midV, dy + 1.05, angle, len, 0.05, 0.05));

  // Tấm kính cường lực trong suốt ở giữa y = 0.55m
  glassPanels.push(createInstanceMatrix(toWorld, midU, midV, dy + 0.55, angle, len - 0.06, 0.85, 0.03));

  // Trụ đứng inox mỗi ~1.5 m
  const postCount = Math.max(2, Math.round(len / 1.5) + 1);
  for (let i = 0; i < postCount; i++) {
    const t = i / (postCount - 1);
    const pu = u1 + t * (u2 - u1);
    const pv = v1 + t * (v2 - v1);
    postsSteel.push(createInstanceMatrix(toWorld, pu, pv, dy + 0.525, 0, 0.05, 1.05, 0.05));
  }
}

export default function B4Furniture({ floor, showUpperFloors = true }: FurnitureProps) {
  const sharedGeos = useMemo(() => {
    return {
      box: new BoxGeometry(1, 1, 1),
      cyl: new CylinderGeometry(0.5, 0.5, 1, 16),
    };
  }, []);

  const data = useMemo(() => {
    const whiteCols: Matrix4[] = [];
    const redColTops: Matrix4[] = [];
    const hvacDucts: Matrix4[] = [];
    const ledLights: Matrix4[] = [];
    const oakTables: Matrix4[] = [];
    const steelTableLegs: Matrix4[] = [];
    const tolixChairs: Matrix4[] = [];
    const walnutDesks: Matrix4[] = [];
    const computerScreens: Matrix4[] = [];
    const keyboards: Matrix4[] = [];
    const studentChairs: Matrix4[] = [];
    const greyTables: Matrix4[] = [];
    const tealChairs: Matrix4[] = [];
    const carrelsDividers: Matrix4[] = [];
    const bookshelves: Matrix4[] = [];
    const bookSpines: Matrix4[] = [];
    const librarianCounter: Matrix4[] = [];
    const postersBack: Matrix4[] = [];
    const groupMeetingTables: Matrix4[] = [];
    const cassetteAc: Matrix4[] = [];
    const dropCeilings: Matrix4[] = [];
    const railingSteel: Matrix4[] = [];
    const railingGlass: Matrix4[] = [];
    const railingHandrails: Matrix4[] = [];
    const pottedPlanters: Matrix4[] = [];
    const plantFoliage: Matrix4[] = [];
    const stairSteps: Matrix4[] = [];
    const stairSoffits: Matrix4[] = [];
    const stairRails: Matrix4[] = [];

    const minF = 1;
    const maxF = showUpperFloors ? 3 : floor;

    for (let f = minF; f <= maxF; f++) {
      const dy = (f - floor) * FLOOR_HEIGHT;

      // 1. Lưới cột bê tông trắng (0.7m x 0.7m) & dải viền đỏ đỉnh cột
      const colUs = [8, 18, 28, 38, 48, 58];
      const colVs = [8, 20];
      for (const u of colUs) {
        for (const v of colVs) {
          // Bỏ qua nếu rơi vào khoảng thông tầng tầng 2
          if (f === 2 && u >= 22 && u <= 36 && v >= 16 && v <= 26) continue;

          whiteCols.push(createInstanceMatrix(toWorld, u, v, dy + FLOOR_HEIGHT * 0.5, 0, 0.7, FLOOR_HEIGHT, 0.7));
          redColTops.push(createInstanceMatrix(toWorld, u, v, dy + FLOOR_HEIGHT - 0.25, 0, 0.72, 0.5, 0.72));
        }
      }

      // 2. Trần hở công nghiệp: Hệ thống ống gió HVAC chữ nhật & thanh đèn LED thả dài
      // Ống gió chính chạy dọc trục dài (v = 14)
      hvacDucts.push(createInstanceMatrix(toWorld, 33.5, 14.0, dy + 3.48, 0, 62.0, 0.45, 1.1));
      // Các ống gió nhánh rẽ sang Bắc (v = 7) và Nam (v = 21)
      hvacDucts.push(createInstanceMatrix(toWorld, 20.0, 7.5, dy + 3.52, Math.PI / 2, 11.0, 0.35, 0.7));
      hvacDucts.push(createInstanceMatrix(toWorld, 48.0, 7.5, dy + 3.52, Math.PI / 2, 11.0, 0.35, 0.7));
      hvacDucts.push(createInstanceMatrix(toWorld, 14.0, 21.0, dy + 3.52, Math.PI / 2, 12.0, 0.35, 0.7));
      hvacDucts.push(createInstanceMatrix(toWorld, 52.0, 21.0, dy + 3.52, Math.PI / 2, 12.0, 0.35, 0.7));

      // Dãy đèn LED tuýp treo thả trần ở cao độ y = 3.25m
      for (let u = 6.0; u <= 62.0; u += 5.5) {
        for (const v of [5.0, 11.0, 17.0, 23.0]) {
          if (f === 2 && u >= 22 && u <= 36 && v >= 16 && v <= 26) continue;
          ledLights.push(createInstanceMatrix(toWorld, u, v, dy + 3.25, 0, 2.4, 0.06, 0.1));
        }
      }

      // 3. Cây xanh chậu nội thất dọc vách kính phía Nam & cạnh cột
      for (const u of [6, 14, 22, 34, 42, 50, 58, 64]) {
        pottedPlanters.push(createInstanceMatrix(toWorld, u, 27.2, dy + 0.3, 0, 0.55, 0.6, 0.55));
        plantFoliage.push(createInstanceMatrix(toWorld, u, 27.2, dy + 0.95, 0, 0.9, 0.8, 0.9));
      }

      // 4. Poster màu EIU trên vách kính phía Nam (Tầng 1 & 2)
      // (Được render chi tiết bằng các group 3D kèm Text ở mục 15 để đảm bảo hướng nhìn chuẩn xác)

      // =========================================================================
      // NỘI THẤT CHI TIẾT TỪNG TẦNG
      // =========================================================================
      if (f === 1) {
        // --- TẦNG 1: Sảnh đón, Bàn đọc gỗ-sắt mặt Nam, Máy tính OPAC, Quầy thủ thư ---
        // A. Quầy thủ thư (L-shaped counter)
        librarianCounter.push(createInstanceMatrix(toWorld, 26.5, 15.0, dy + 0.55, 0, 4.5, 1.1, 0.8));
        librarianCounter.push(createInstanceMatrix(toWorld, 24.2, 16.5, dy + 0.55, Math.PI / 2, 2.2, 1.1, 0.8));
        // Máy tính thủ thư
        computerScreens.push(createInstanceMatrix(toWorld, 26.5, 15.0, dy + 1.35, 0, 0.55, 0.4, 0.08));
        keyboards.push(createInstanceMatrix(toWorld, 26.5, 15.3, dy + 1.12, 0, 0.4, 0.02, 0.15));

        // B. Bàn đọc gỗ sáng chân sắt đen mặt Nam (u = 6..22 & 34..44, v = 22..25)
        for (const u of [8.0, 14.0, 20.0, 36.0, 42.0]) {
          for (const v of [21.5, 24.8]) {
            // Mặt bàn gỗ sáng
            oakTables.push(createInstanceMatrix(toWorld, u, v, dy + 0.73, 0, 2.4, 0.06, 1.0));
            // 2 chân khung sắt đen 2 đầu
            steelTableLegs.push(createInstanceMatrix(toWorld, u - 1.05, v, dy + 0.35, 0, 0.08, 0.7, 0.9));
            steelTableLegs.push(createInstanceMatrix(toWorld, u + 1.05, v, dy + 0.35, 0, 0.08, 0.7, 0.9));

            // Ghế Tolix sắt đen bao quanh (4 ghế/bàn)
            tolixChairs.push(createInstanceMatrix(toWorld, u - 0.6, v - 0.7, dy + 0.45, 0, 0.42, 0.84, 0.42));
            tolixChairs.push(createInstanceMatrix(toWorld, u + 0.6, v - 0.7, dy + 0.45, 0, 0.42, 0.84, 0.42));
            tolixChairs.push(createInstanceMatrix(toWorld, u - 0.6, v + 0.7, dy + 0.45, Math.PI, 0.42, 0.84, 0.42));
            tolixChairs.push(createInstanceMatrix(toWorld, u + 0.6, v + 0.7, dy + 0.45, Math.PI, 0.42, 0.84, 0.42));
          }
        }

        // C. Khu máy tính tra cứu OPAC (u = 48..62, v = 15..24): 3 dãy bàn đôi
        for (let row = 0; row < 3; row++) {
          const v = 15.5 + row * 4.2;
          for (let col = 0; col < 5; col++) {
            const u = 49.0 + col * 2.8;
            // Bàn gỗ tối màu
            walnutDesks.push(createInstanceMatrix(toWorld, u, v, dy + 0.72, 0, 2.2, 0.05, 1.3));
            steelTableLegs.push(createInstanceMatrix(toWorld, u - 0.95, v, dy + 0.35, 0, 0.06, 0.7, 1.2));
            steelTableLegs.push(createInstanceMatrix(toWorld, u + 0.95, v, dy + 0.35, 0, 0.06, 0.7, 1.2));

            // 2 máy All-in-One trắng đối diện
            // Phía Nam nhìn về Bắc
            computerScreens.push(createInstanceMatrix(toWorld, u, v - 0.25, dy + 1.05, 0, 0.52, 0.36, 0.06));
            keyboards.push(createInstanceMatrix(toWorld, u, v - 0.48, dy + 0.75, 0, 0.4, 0.02, 0.14));
            studentChairs.push(createInstanceMatrix(toWorld, u, v - 0.85, dy + 0.45, 0, 0.45, 0.8, 0.45));

            // Phía Bắc nhìn về Nam
            computerScreens.push(createInstanceMatrix(toWorld, u, v + 0.25, dy + 1.05, Math.PI, 0.52, 0.36, 0.06));
            keyboards.push(createInstanceMatrix(toWorld, u, v + 0.48, dy + 0.75, Math.PI, 0.4, 0.02, 0.14));
            studentChairs.push(createInstanceMatrix(toWorld, u, v + 0.85, dy + 0.45, Math.PI, 0.45, 0.8, 0.45));
          }
        }

        // D. Kệ sách mở phía Tây (u = 4..18, v = 4..14)
        for (let col = 0; col < 4; col++) {
          const u = 6.0 + col * 3.6;
          for (let row = 0; row < 2; row++) {
            const v = 5.5 + row * 5.0;
            bookshelves.push(createInstanceMatrix(toWorld, u, v, dy + 1.1, 0, 2.6, 2.2, 0.65));
            // Gáy sách trên 4 tầng kệ
            for (let shelf = 0; shelf < 4; shelf++) {
              const sy = dy + 0.35 + shelf * 0.5;
              bookSpines.push(createInstanceMatrix(toWorld, u, v - 0.15, sy, 0, 2.4, 0.28, 0.22));
              bookSpines.push(createInstanceMatrix(toWorld, u, v + 0.15, sy, 0, 2.4, 0.28, 0.22));
            }
          }
        }
      }

      if (f === 2) {
        // --- TẦNG 2: Thông tầng lan can kính, Dãy phòng họp nhóm 01..06, Zone B carrels ---
        // A. Lan can kính quanh khoảng thông tầng (u: 22..36, v: 16..26)
        addGlassRailing(railingSteel, railingGlass, railingHandrails, 22.0, 16.0, 36.0, 16.0, dy);
        addGlassRailing(railingSteel, railingGlass, railingHandrails, 36.0, 16.0, 36.0, 26.0, dy);
        addGlassRailing(railingSteel, railingGlass, railingHandrails, 36.0, 26.0, 22.0, 26.0, dy);
        addGlassRailing(railingSteel, railingGlass, railingHandrails, 22.0, 26.0, 22.0, 16.0, dy);

        // B. Dãy phòng họp nhóm kính 01 đến 06 dọc tường Bắc (u: 38..65, v: 0..8)
        const roomCenters = [40.25, 44.75, 49.25, 53.75, 58.25, 62.75];
        for (const ru of roomCenters) {
          // Trần thạch cao hạ trần trắng bên trong phòng
          dropCeilings.push(createInstanceMatrix(toWorld, ru, 4.0, dy + 3.25, 0, 4.2, 0.05, 7.8));
          // Máy lạnh cassette âm trần
          cassetteAc.push(createInstanceMatrix(toWorld, ru, 4.0, dy + 3.22, 0, 0.9, 0.08, 0.9));
          // Bàn họp dài gỗ sẫm
          groupMeetingTables.push(createInstanceMatrix(toWorld, ru, 4.0, dy + 0.73, 0, 2.8, 0.06, 1.2));
          steelTableLegs.push(createInstanceMatrix(toWorld, ru - 1.1, 4.0, dy + 0.35, 0, 0.08, 0.7, 1.0));
          steelTableLegs.push(createInstanceMatrix(toWorld, ru + 1.1, 4.0, dy + 0.35, 0, 0.08, 0.7, 1.0));

          // Ghế nệm xanh ngọc (teal) quanh bàn họp (6 ghế/phòng)
          tealChairs.push(createInstanceMatrix(toWorld, ru - 0.8, 3.2, dy + 0.45, 0, 0.45, 0.82, 0.45));
          tealChairs.push(createInstanceMatrix(toWorld, ru, 3.2, dy + 0.45, 0, 0.45, 0.82, 0.45));
          tealChairs.push(createInstanceMatrix(toWorld, ru + 0.8, 3.2, dy + 0.45, 0, 0.45, 0.82, 0.45));
          tealChairs.push(createInstanceMatrix(toWorld, ru - 0.8, 4.8, dy + 0.45, Math.PI, 0.45, 0.82, 0.45));
          tealChairs.push(createInstanceMatrix(toWorld, ru, 4.8, dy + 0.45, Math.PI, 0.45, 0.82, 0.45));
          tealChairs.push(createInstanceMatrix(toWorld, ru + 0.8, 4.8, dy + 0.45, Math.PI, 0.45, 0.82, 0.45));
        }

        // C. Khu tự học Zone B với bàn carrels và ghế teal (u = 42..62, v = 15..24)
        for (let col = 0; col < 4; col++) {
          const u = 44.0 + col * 4.8;
          for (const v of [16.0, 21.0]) {
            greyTables.push(createInstanceMatrix(toWorld, u, v, dy + 0.73, 0, 3.6, 0.05, 1.2));
            steelTableLegs.push(createInstanceMatrix(toWorld, u - 1.6, v, dy + 0.35, 0, 0.06, 0.7, 1.1));
            steelTableLegs.push(createInstanceMatrix(toWorld, u + 1.6, v, dy + 0.35, 0, 0.06, 0.7, 1.1));

            // Vách ngăn cá nhân carrels
            carrelsDividers.push(createInstanceMatrix(toWorld, u, v, dy + 1.05, 0, 3.6, 0.45, 0.04));
            carrelsDividers.push(createInstanceMatrix(toWorld, u - 1.2, v, dy + 1.05, Math.PI / 2, 1.1, 0.45, 0.04));
            carrelsDividers.push(createInstanceMatrix(toWorld, u, v, dy + 1.05, Math.PI / 2, 1.1, 0.45, 0.04));
            carrelsDividers.push(createInstanceMatrix(toWorld, u + 1.2, v, dy + 1.05, Math.PI / 2, 1.1, 0.45, 0.04));

            // Ghế teal cho mỗi vị trí tự học
            for (const offset of [-1.2, 0, 1.2]) {
              tealChairs.push(createInstanceMatrix(toWorld, u + offset, v - 0.8, dy + 0.45, 0, 0.45, 0.82, 0.45));
              tealChairs.push(createInstanceMatrix(toWorld, u + offset, v + 0.8, dy + 0.45, Math.PI, 0.45, 0.82, 0.45));
            }
          }
        }

        // D. Kệ sách học thuật chuyên ngành phía Tây (u = 4..18, v = 4..24)
        for (let col = 0; col < 4; col++) {
          const u = 6.0 + col * 3.6;
          for (let row = 0; row < 4; row++) {
            const v = 6.0 + row * 5.2;
            bookshelves.push(createInstanceMatrix(toWorld, u, v, dy + 1.1, 0, 2.6, 2.2, 0.65));
            for (let shelf = 0; shelf < 4; shelf++) {
              const sy = dy + 0.35 + shelf * 0.5;
              bookSpines.push(createInstanceMatrix(toWorld, u, v - 0.15, sy, 0, 2.4, 0.28, 0.22));
              bookSpines.push(createInstanceMatrix(toWorld, u, v + 0.15, sy, 0, 2.4, 0.28, 0.22));
            }
          }
        }
      }

      if (f === 3) {
        // --- TẦNG 3: Không gian yên tĩnh cao độ (Silent Study Zone) & Nghiên cứu ---
        for (let col = 0; col < 5; col++) {
          const u = 8.0 + col * 5.2;
          for (const v of [11.0, 18.0]) {
            greyTables.push(createInstanceMatrix(toWorld, u, v, dy + 0.73, 0, 3.8, 0.05, 1.2));
            steelTableLegs.push(createInstanceMatrix(toWorld, u - 1.7, v, dy + 0.35, 0, 0.06, 0.7, 1.1));
            steelTableLegs.push(createInstanceMatrix(toWorld, u + 1.7, v, dy + 0.35, 0, 0.06, 0.7, 1.1));

            for (const offset of [-1.2, 0, 1.2]) {
              tealChairs.push(createInstanceMatrix(toWorld, u + offset, v - 0.8, dy + 0.45, 0, 0.45, 0.82, 0.45));
              tealChairs.push(createInstanceMatrix(toWorld, u + offset, v + 0.8, dy + 0.45, Math.PI, 0.45, 0.82, 0.45));
            }
          }
        }

        for (let col = 0; col < 5; col++) {
          const u = 40.0 + col * 5.0;
          for (const v of [11.0, 18.0]) {
            oakTables.push(createInstanceMatrix(toWorld, u, v, dy + 0.73, 0, 3.8, 0.06, 1.2));
            steelTableLegs.push(createInstanceMatrix(toWorld, u - 1.7, v, dy + 0.35, 0, 0.08, 0.7, 1.1));
            steelTableLegs.push(createInstanceMatrix(toWorld, u + 1.7, v, dy + 0.35, 0, 0.08, 0.7, 1.1));

            for (const offset of [-1.2, 0, 1.2]) {
              studentChairs.push(createInstanceMatrix(toWorld, u + offset, v - 0.8, dy + 0.45, 0, 0.45, 0.8, 0.45));
              studentChairs.push(createInstanceMatrix(toWorld, u + offset, v + 0.8, dy + 0.45, Math.PI, 0.45, 0.8, 0.45));
            }
          }
        }
      }

      // 5. Cầu thang bộ (kết nối f lên f+1 nếu f < 3)
      if (f < 3) {
        const st = B4_SWITCHBACK_STAIR;
        const midY = dy + st.landRatio * FLOOR_HEIGHT;
        addSwitchbackFlight(
          toWorld,
          stairSteps,
          stairSoffits,
          stairRails,
          st.f1[0],
          st.f1[1],
          dy,
          st.f1[2],
          st.f1[3],
          midY,
          st.width,
          st.steps1
        );
        addSwitchbackFlight(
          toWorld,
          stairSteps,
          stairSoffits,
          stairRails,
          st.f2[0],
          st.f2[1],
          midY,
          st.f2[2],
          st.f2[3],
          dy + FLOOR_HEIGHT,
          st.width,
          st.steps2
        );
      }
    }

    return {
      whiteCols,
      redColTops,
      hvacDucts,
      ledLights,
      oakTables,
      steelTableLegs,
      tolixChairs,
      walnutDesks,
      computerScreens,
      keyboards,
      studentChairs,
      greyTables,
      tealChairs,
      carrelsDividers,
      bookshelves,
      bookSpines,
      librarianCounter,
      postersBack,
      groupMeetingTables,
      cassetteAc,
      dropCeilings,
      railingSteel,
      railingGlass,
      railingHandrails,
      pottedPlanters,
      plantFoliage,
      stairSteps,
      stairSoffits,
      stairRails,
    };
  }, [floor, showUpperFloors]);

  // Vị trí thang máy
  const [eleX, eleZ] = toWorld(B4_ELEVATOR_POS_LOCAL[0], B4_ELEVATOR_POS_LOCAL[1]);
  const eleYaw = getLocalFacingYaw(Math.PI / 2);

  // Vị trí cột ZONE A & ZONE B để gắn chữ 3D đỏ
  const [zoneAX, zoneAZ] = toWorld(18.0, 20.0);
  const [zoneBX, zoneBZ] = toWorld(38.0, 20.0);
  const colFrontYaw = getLocalFacingYaw(Math.PI / 2);

  return (
    <group key={floor}>
      {/* 1. Kết cấu cột & trần công nghiệp */}
      <InstancedBatch batchKey="b4-cols" matrices={data.whiteCols} geometry={sharedGeos.box} color="#f8fafc" roughness={0.7} />
      <InstancedBatch batchKey="b4-red-tops" matrices={data.redColTops} geometry={sharedGeos.box} color="#dc2626" roughness={0.4} />
      <InstancedBatch batchKey="b4-hvac" matrices={data.hvacDucts} geometry={sharedGeos.box} color="#64748b" metalness={0.4} roughness={0.5} />
      <InstancedBatch
        batchKey="b4-led"
        matrices={data.ledLights}
        geometry={sharedGeos.box}
        color="#ffffff"
        emissive="#ffffff"
        emissiveIntensity={0.85}
        castShadow={false}
      />

      {/* 2. Bàn ghế gỗ-sắt & Tolix */}
      <InstancedBatch batchKey="b4-oak-tables" matrices={data.oakTables} geometry={sharedGeos.box} color="#d4a373" roughness={0.55} />
      <InstancedBatch batchKey="b4-table-legs" matrices={data.steelTableLegs} geometry={sharedGeos.box} color="#18181b" metalness={0.6} roughness={0.4} />
      <InstancedBatch batchKey="b4-tolix" matrices={data.tolixChairs} geometry={sharedGeos.box} color="#1e2022" metalness={0.5} roughness={0.4} />

      {/* 3. Máy tính OPAC & ghế học sinh */}
      <InstancedBatch batchKey="b4-walnut-desks" matrices={data.walnutDesks} geometry={sharedGeos.box} color="#3d2817" roughness={0.6} />
      <InstancedBatch
        batchKey="b4-pc-screens"
        matrices={data.computerScreens}
        geometry={sharedGeos.box}
        color="#f8fafc"
        emissive="#ffffff"
        emissiveIntensity={0.25}
      />
      <InstancedBatch batchKey="b4-keyboards" matrices={data.keyboards} geometry={sharedGeos.box} color="#e2e8f0" roughness={0.4} />
      <InstancedBatch batchKey="b4-stud-chairs" matrices={data.studentChairs} geometry={sharedGeos.box} color="#27272a" roughness={0.6} />

      {/* 4. Bàn xám + ghế teal & vách carrels */}
      <InstancedBatch batchKey="b4-grey-tables" matrices={data.greyTables} geometry={sharedGeos.box} color="#94a3b8" roughness={0.5} />
      <InstancedBatch batchKey="b4-teal-chairs" matrices={data.tealChairs} geometry={sharedGeos.box} color="#0d9488" roughness={0.4} />
      <InstancedBatch batchKey="b4-carrels" matrices={data.carrelsDividers} geometry={sharedGeos.box} color="#cbd5e1" roughness={0.6} />

      {/* 5. Kệ sách & gáy sách */}
      <InstancedBatch batchKey="b4-shelves" matrices={data.bookshelves} geometry={sharedGeos.box} color="#475569" roughness={0.7} />
      <InstancedBatch batchKey="b4-spines" matrices={data.bookSpines} geometry={sharedGeos.box} color="#b45309" roughness={0.8} />

      {/* 6. Quầy thủ thư */}
      <InstancedBatch batchKey="b4-counter" matrices={data.librarianCounter} geometry={sharedGeos.box} color="#f8fafc" roughness={0.3} metalness={0.1} />

      {/* 7. Poster màu sắc mặt Nam */}
      <InstancedBatch batchKey="b4-posters" matrices={data.postersBack} geometry={sharedGeos.box} color="#4338ca" roughness={0.3} />

      {/* 8. Phòng họp nhóm & máy lạnh cassette */}
      <InstancedBatch batchKey="b4-meeting-tbl" matrices={data.groupMeetingTables} geometry={sharedGeos.box} color="#451a03" roughness={0.5} />
      <InstancedBatch batchKey="b4-cassette" matrices={data.cassetteAc} geometry={sharedGeos.box} color="#f1f5f9" roughness={0.4} />
      <InstancedBatch batchKey="b4-drop-ceil" matrices={data.dropCeilings} geometry={sharedGeos.box} color="#ffffff" roughness={0.8} />

      {/* 9. Lan can thông tầng (Atrium) */}
      <InstancedBatch batchKey="b4-rail-steel" matrices={data.railingSteel} geometry={sharedGeos.box} color="#e2e8f0" metalness={0.8} roughness={0.2} />
      <InstancedBatch batchKey="b4-rail-hand" matrices={data.railingHandrails} geometry={sharedGeos.cyl} color="#e2e8f0" metalness={0.85} roughness={0.15} />
      <InstancedBatch
        batchKey="b4-rail-glass"
        matrices={data.railingGlass}
        geometry={sharedGeos.box}
        color="#bae6fd"
        transparent
        opacity={0.35}
        roughness={0.1}
        metalness={0.2}
      />

      {/* 10. Cây xanh */}
      <InstancedBatch batchKey="b4-planters" matrices={data.pottedPlanters} geometry={sharedGeos.box} color="#e2e8f0" roughness={0.8} />
      <InstancedBatch batchKey="b4-foliage" matrices={data.plantFoliage} geometry={sharedGeos.box} color="#15803d" roughness={0.7} />

      {/* 11. Cầu thang bộ */}
      <InstancedBatch batchKey="b4-steps" matrices={data.stairSteps} geometry={sharedGeos.box} color="#1e293b" metalness={0.4} roughness={0.45} />
      <InstancedBatch batchKey="b4-soffit" matrices={data.stairSoffits} geometry={sharedGeos.box} color="#f8fafc" roughness={0.7} />
      <InstancedBatch batchKey="b4-srail" matrices={data.stairRails} geometry={sharedGeos.box} color="#d8dde3" metalness={0.4} roughness={0.3} />

      {/* 12. Chữ 3D đỏ lớn trên cột ZONE A & ZONE B (đặc trưng từ ảnh 11, 16, 17) */}
      <group position={[zoneBX, 1.8, zoneBZ]} rotation-y={colFrontYaw}>
        <Text position={[0, 0, 0.36]} fontSize={0.35} color="#dc2626" font={undefined} anchorX="center" anchorY="middle">
          {'Z\nO\nN\nE\n\nB'}
        </Text>
      </group>

      <group position={[zoneAX, 1.8, zoneAZ]} rotation-y={colFrontYaw}>
        <Text position={[0, 0, 0.36]} fontSize={0.35} color="#dc2626" font={undefined} anchorX="center" anchorY="middle">
          {'Z\nO\nN\nE\n\nA'}
        </Text>
      </group>

      {/* 13. Thang máy Thư viện B4 */}
      <group position={[eleX, 0, eleZ]} rotation-y={eleYaw}>
        {/* Khung ngoài thang máy */}
        <mesh position={[0, 1.4, 0]}>
          <boxGeometry args={[2.4, 2.8, 0.3]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Cửa inox thang máy */}
        <mesh position={[0, 1.15, 0.05]}>
          <boxGeometry args={[1.5, 2.3, 0.05]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Bảng hiển thị tầng LED */}
        <mesh position={[0, 2.5, 0.16]}>
          <boxGeometry args={[0.5, 0.2, 0.05]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <Text position={[0, 2.5, 0.2]} fontSize={0.12} color="#38bdf8" anchorX="center" anchorY="middle">
          {`TẦNG ${floor}`}
        </Text>
      </group>

      {/* 14. Biển mica 4 dải màu chuẩn EIU trên cửa phòng họp nhóm tầng 2 (ảnh 13, 14) */}
      {floor === 2 && (
        <group>
          {[
            { u: 40.2, num: '01' },
            { u: 44.7, num: '02' },
            { u: 49.2, num: '03' },
            { u: 53.7, num: '04' },
            { u: 58.2, num: '05' },
            { u: 62.7, num: '06' },
          ].map(({ u, num }) => {
            const [wx, wz] = toWorld(u + 0.8, 8.0);
            const yaw = getLocalFacingYaw(Math.PI / 2);
            return (
              <group key={num} position={[wx, 1.6, wz]} rotation-y={yaw}>
                {/* Dải 1 (Xanh lá EIU) */}
                <mesh position={[0, 0.25, 0.05]}>
                  <boxGeometry args={[0.32, 0.1, 0.02]} />
                  <meshStandardMaterial color="#15803d" />
                </mesh>
                <Text position={[0, 0.25, 0.07]} fontSize={0.05} color="#ffffff" anchorX="center" anchorY="middle">
                  EIU
                </Text>
                {/* Dải 2 (Xanh rêu - Số phòng) */}
                <mesh position={[0, 0.15, 0.05]}>
                  <boxGeometry args={[0.32, 0.1, 0.02]} />
                  <meshStandardMaterial color="#65a30d" />
                </mesh>
                <Text position={[0, 0.15, 0.07]} fontSize={0.07} color="#ffffff" anchorX="center" anchorY="middle">
                  {num}
                </Text>
                {/* Dải 3 (Cam - Tên phòng) */}
                <mesh position={[0, 0.05, 0.05]}>
                  <boxGeometry args={[0.32, 0.1, 0.02]} />
                  <meshStandardMaterial color="#ea580c" />
                </mesh>
                <Text position={[0, 0.05, 0.07]} fontSize={0.035} color="#ffffff" anchorX="center" anchorY="middle">
                  {'Phòng họp nhóm\nGroup Study'}
                </Text>
                {/* Dải 4 (Đỏ rượu - THƯ VIỆN) */}
                <mesh position={[0, -0.05, 0.05]}>
                  <boxGeometry args={[0.32, 0.1, 0.02]} />
                  <meshStandardMaterial color="#991b1b" />
                </mesh>
                <Text position={[0, -0.05, 0.07]} fontSize={0.035} color="#ffffff" anchorX="center" anchorY="middle">
                  {'THƯ VIỆN / Library'}
                </Text>
                {/* Bàn phím số điện tử bên cạnh */}
                <mesh position={[0.22, 0.05, 0.05]}>
                  <boxGeometry args={[0.08, 0.18, 0.03]} />
                  <meshStandardMaterial color="#18181b" />
                </mesh>
              </group>
            );
          })}
        </group>
      )}

      {/* 15. Biển chữ các poster lớn phía Nam */}
      <group>
        {/* Poster Tím */}
        <group position={[toWorld(12.0, 27.85)[0], 2.0, toWorld(12.0, 27.85)[1]]} rotation-y={getLocalFacingYaw(-Math.PI / 2)}>
          <mesh>
            <boxGeometry args={[1.2, 1.5, 0.02]} />
            <meshStandardMaterial color="#581c87" />
          </mesh>
          <Text position={[0, 0.2, 0.02]} fontSize={0.07} color="#f3e8ff" maxWidth={1.1} textAlign="center" anchorX="center" anchorY="middle">
            {"Save one person\nYOU'RE A HERO\n\nSave hundreds\nYOU'RE A NURSE"}
          </Text>
        </group>

        {/* Poster Xanh lá */}
        <group position={[toWorld(16.5, 27.85)[0], 2.0, toWorld(16.5, 27.85)[1]]} rotation-y={getLocalFacingYaw(-Math.PI / 2)}>
          <mesh>
            <boxGeometry args={[1.3, 1.5, 0.02]} />
            <meshStandardMaterial color="#15803d" />
          </mesh>
          <Text position={[0, 0.2, 0.02]} fontSize={0.08} color="#ffffff" maxWidth={1.2} textAlign="center" anchorX="center" anchorY="middle">
            {'dám\nƯỚC MƠ\n\ndám\nTHỰC HIỆN'}
          </Text>
        </group>

        {/* Poster Xanh ngọc */}
        <group position={[toWorld(21.0, 27.85)[0], 2.0, toWorld(21.0, 27.85)[1]]} rotation-y={getLocalFacingYaw(-Math.PI / 2)}>
          <mesh>
            <boxGeometry args={[1.3, 1.5, 0.02]} />
            <meshStandardMaterial color="#0f766e" />
          </mesh>
          <Text position={[0, 0.1, 0.02]} fontSize={0.075} color="#ccfbf1" maxWidth={1.2} textAlign="center" anchorX="center" anchorY="middle">
            {'Building the future\nWITH IDEAS'}
          </Text>
        </group>

        {/* Poster Đỏ Sứ Mạng */}
        <group position={[toWorld(33.0, 27.85)[0], 2.0, toWorld(33.0, 27.85)[1]]} rotation-y={getLocalFacingYaw(-Math.PI / 2)}>
          <mesh>
            <boxGeometry args={[1.1, 1.5, 0.02]} />
            <meshStandardMaterial color="#b91c1c" />
          </mesh>
          <Text position={[0, 0.2, 0.02]} fontSize={0.08} color="#ffffff" maxWidth={1.0} textAlign="center" anchorX="center" anchorY="middle">
            {'SỨ MẠNG\nEIU'}
          </Text>
        </group>

        {/* Poster Đỏ Tầm Nhìn */}
        <group position={[toWorld(36.5, 27.85)[0], 2.0, toWorld(36.5, 27.85)[1]]} rotation-y={getLocalFacingYaw(-Math.PI / 2)}>
          <mesh>
            <boxGeometry args={[1.1, 1.5, 0.02]} />
            <meshStandardMaterial color="#991b1b" />
          </mesh>
          <Text position={[0, 0.2, 0.02]} fontSize={0.08} color="#ffffff" maxWidth={1.0} textAlign="center" anchorX="center" anchorY="middle">
            {'TẦM NHÌN\nVISION'}
          </Text>
        </group>

        {/* Poster Xanh dương Giá Trị Cốt Lõi */}
        <group position={[toWorld(40.0, 27.85)[0], 2.0, toWorld(40.0, 27.85)[1]]} rotation-y={getLocalFacingYaw(-Math.PI / 2)}>
          <mesh>
            <boxGeometry args={[1.1, 1.5, 0.02]} />
            <meshStandardMaterial color="#1d4ed8" />
          </mesh>
          <Text position={[0, 0.2, 0.02]} fontSize={0.075} color="#ffffff" maxWidth={1.0} textAlign="center" anchorX="center" anchorY="middle">
            {'GIÁ TRỊ CỐT LÕI\nCORE VALUES'}
          </Text>
        </group>

        {/* Poster OPAC trắng */}
        <group position={[toWorld(48.0, 27.85)[0], 2.0, toWorld(48.0, 27.85)[1]]} rotation-y={getLocalFacingYaw(-Math.PI / 2)}>
          <mesh>
            <boxGeometry args={[0.9, 1.2, 0.02]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          <Text position={[0, 0.1, 0.02]} fontSize={0.06} color="#0f172a" maxWidth={0.8} textAlign="center" anchorX="center" anchorY="middle">
            {'LIBRARY OPAC\n\nCỔNG TRA CỨU'}
          </Text>
        </group>

        <group position={[toWorld(52.0, 27.85)[0], 2.0, toWorld(52.0, 27.85)[1]]} rotation-y={getLocalFacingYaw(-Math.PI / 2)}>
          <mesh>
            <boxGeometry args={[0.9, 1.2, 0.02]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          <Text position={[0, 0.1, 0.02]} fontSize={0.06} color="#0f172a" maxWidth={0.8} textAlign="center" anchorX="center" anchorY="middle">
            {'ONLINE\nDATABASES'}
          </Text>
        </group>
      </group>
    </group>
  );
}
