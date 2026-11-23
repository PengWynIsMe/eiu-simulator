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
  readonly depthWrite?: boolean;
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
  depthWrite = true,
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
        depthWrite={depthWrite}
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

// Tạo ghế Tolix công nghiệp chân sắt mảnh + lưng tựa
function addTolixChair(
  seats: Matrix4[],
  backs: Matrix4[],
  legs: Matrix4[],
  u: number,
  v: number,
  dy: number,
  facingAngle: number
) {
  // Mặt ngồi ghế kim loại mỏng ở y = 0.44m
  seats.push(createInstanceMatrix(toWorld, u, v, dy + 0.44, facingAngle, 0.42, 0.025, 0.4));

  // Lưng tựa uốn cong thanh thoát ở mép sau ghế
  const backOffset = 0.18;
  const bu = u - Math.sin(facingAngle) * backOffset;
  const bv = v - Math.cos(facingAngle) * backOffset;
  backs.push(createInstanceMatrix(toWorld, bu, bv, dy + 0.65, facingAngle, 0.38, 0.38, 0.02));

  // 4 chân sắt thon mảnh ở 4 góc ghế
  const halfW = 0.17;
  const halfD = 0.16;
  const cosA = Math.cos(facingAngle);
  const sinA = Math.sin(facingAngle);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const lu = u + sx * halfW * cosA - sz * halfD * sinA;
      const lv = v + sx * halfW * sinA + sz * halfD * cosA;
      legs.push(createInstanceMatrix(toWorld, lu, lv, dy + 0.22, facingAngle, 0.025, 0.43, 0.025));
    }
  }
}

// Tạo ghế đệm xanh ngọc (Teal chair) thanh lịch ở Zone A & phòng họp
function addTealChair(
  seats: Matrix4[],
  backs: Matrix4[],
  legs: Matrix4[],
  u: number,
  v: number,
  dy: number,
  facingAngle: number
) {
  // Đệm ngồi êm ái dày 5cm màu xanh ngọc
  seats.push(createInstanceMatrix(toWorld, u, v, dy + 0.44, facingAngle, 0.44, 0.05, 0.42));

  // Tựa lưng cong nhẹ bọc nệm xanh ngọc
  const backOffset = 0.18;
  const bu = u - Math.sin(facingAngle) * backOffset;
  const bv = v - Math.cos(facingAngle) * backOffset;
  backs.push(createInstanceMatrix(toWorld, bu, bv, dy + 0.67, facingAngle, 0.42, 0.36, 0.04));

  // 4 chân kim loại thanh mảnh
  const halfW = 0.18;
  const halfD = 0.17;
  const cosA = Math.cos(facingAngle);
  const sinA = Math.sin(facingAngle);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const lu = u + sx * halfW * cosA - sz * halfD * sinA;
      const lv = v + sx * halfW * sinA + sz * halfD * cosA;
      legs.push(createInstanceMatrix(toWorld, lu, lv, dy + 0.21, facingAngle, 0.025, 0.42, 0.025));
    }
  }
}

// Dãy kệ sách thư viện màu trắng nhiều tầng có gáy sách màu và hồi kệ gỗ
function addWhiteBookshelf(
  shelfFrames: Matrix4[],
  shelfBoards: Matrix4[],
  endPanels: Matrix4[],
  shelfSigns: Matrix4[],
  booksRed: Matrix4[],
  booksBlue: Matrix4[],
  booksGold: Matrix4[],
  booksGreen: Matrix4[],
  booksWhite: Matrix4[],
  u: number,
  v: number,
  dy: number,
  rot: number
) {
  // 1. Khung kệ sắt màu trắng (2 trụ hồi + nóc + đế)
  shelfFrames.push(createInstanceMatrix(toWorld, u - 1.28, v, dy + 1.05, rot, 0.04, 2.1, 0.65));
  shelfFrames.push(createInstanceMatrix(toWorld, u + 1.28, v, dy + 1.05, rot, 0.04, 2.1, 0.65));
  shelfFrames.push(createInstanceMatrix(toWorld, u, v, dy + 2.08, rot, 2.6, 0.04, 0.65));
  shelfFrames.push(createInstanceMatrix(toWorld, u, v, dy + 0.04, rot, 2.6, 0.08, 0.65));

  // 2. 4 đợt kệ ngang màu trắng
  for (let s = 0; s < 4; s++) {
    const sy = dy + 0.45 + s * 0.42;
    shelfBoards.push(createInstanceMatrix(toWorld, u, v, sy, rot, 2.52, 0.03, 0.6));

    // 3. Hàng gáy sách nhiều màu xếp đều trên từng tầng
    const bookY = sy + 0.14;
    for (const side of [-0.15, 0.15]) {
      // 5 cụm sách với 5 màu sắc khác nhau
      booksBlue.push(createInstanceMatrix(toWorld, u - 0.9, v + side, bookY, rot, 0.45, 0.25, 0.22));
      booksRed.push(createInstanceMatrix(toWorld, u - 0.45, v + side, bookY, rot, 0.42, 0.24, 0.22));
      booksGold.push(createInstanceMatrix(toWorld, u, v + side, bookY, rot, 0.44, 0.26, 0.22));
      booksGreen.push(createInstanceMatrix(toWorld, u + 0.45, v + side, bookY, rot, 0.42, 0.25, 0.22));
      booksWhite.push(createInstanceMatrix(toWorld, u + 0.9, v + side, bookY, rot, 0.45, 0.24, 0.22));
    }
  }

  // 4. Hồi kệ ốp gỗ sồi trang trọng ở hai đầu dãy kệ
  endPanels.push(createInstanceMatrix(toWorld, u - 1.3, v, dy + 1.05, rot, 0.04, 2.1, 0.66));
  endPanels.push(createInstanceMatrix(toWorld, u + 1.3, v, dy + 1.05, rot, 0.04, 2.1, 0.66));

  // 5. Bảng hiệu phân loại sách DDC màu xanh tím EIU gắn trên hồi kệ
  shelfSigns.push(createInstanceMatrix(toWorld, u - 1.33, v, dy + 1.45, rot, 0.01, 0.65, 0.55));
  shelfSigns.push(createInstanceMatrix(toWorld, u + 1.33, v, dy + 1.45, rot, 0.01, 0.65, 0.55));
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
    const curtainFrames: Matrix4[] = [];
    const curtainGlass: Matrix4[] = [];
    const oakTables: Matrix4[] = [];
    const steelTableLegs: Matrix4[] = [];
    const tolixSeats: Matrix4[] = [];
    const tolixBacks: Matrix4[] = [];
    const tolixLegs: Matrix4[] = [];
    const walnutDesks: Matrix4[] = [];
    const computerScreens: Matrix4[] = [];
    const keyboards: Matrix4[] = [];
    const studentSeats: Matrix4[] = [];
    const studentBacks: Matrix4[] = [];
    const studentLegs: Matrix4[] = [];
    const greyTables: Matrix4[] = [];
    const tealSeats: Matrix4[] = [];
    const tealBacks: Matrix4[] = [];
    const tealLegs: Matrix4[] = [];
    const carrelsDividers: Matrix4[] = [];
    const shelfFrames: Matrix4[] = [];
    const shelfBoards: Matrix4[] = [];
    const shelfEndPanels: Matrix4[] = [];
    const shelfSigns: Matrix4[] = [];
    const booksRed: Matrix4[] = [];
    const booksBlue: Matrix4[] = [];
    const booksGold: Matrix4[] = [];
    const booksGreen: Matrix4[] = [];
    const booksWhite: Matrix4[] = [];
    const librarianCounter: Matrix4[] = [];
    const entranceGates: Matrix4[] = [];
    const gateFlaps: Matrix4[] = [];
    const entrancePlaques: Matrix4[] = [];
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
          if (f === 2 && u >= 22 && u <= 36 && v >= 16 && v <= 26) continue;
          whiteCols.push(createInstanceMatrix(toWorld, u, v, dy + FLOOR_HEIGHT * 0.5, 0, 0.7, FLOOR_HEIGHT, 0.7));
          redColTops.push(createInstanceMatrix(toWorld, u, v, dy + FLOOR_HEIGHT - 0.25, 0, 0.72, 0.5, 0.72));
        }
      }

      // 2. Vách kính mặt Nam (Mảng kính sáng + Khung nhôm đen công nghiệp)
      // Chạy suốt chiều dài mặt Nam (v = 28.0)
      curtainFrames.push(createInstanceMatrix(toWorld, 33.5, 28.0, dy + 0.06, 0, 67.0, 0.12, 0.08));
      curtainFrames.push(createInstanceMatrix(toWorld, 33.5, 28.0, dy + 3.74, 0, 67.0, 0.12, 0.08));
      curtainFrames.push(createInstanceMatrix(toWorld, 33.5, 28.0, dy + 1.2, 0, 67.0, 0.05, 0.06));
      curtainFrames.push(createInstanceMatrix(toWorld, 33.5, 28.0, dy + 2.4, 0, 67.0, 0.05, 0.06));
      // Các đố kính đứng màu đen cách nhau mỗi 2.5m
      for (let u = 0; u <= 67; u += 2.5) {
        curtainFrames.push(createInstanceMatrix(toWorld, u, 28.0, dy + 1.9, 0, 0.06, 3.6, 0.08));
      }
      // Tấm kính trong suốt của vách mặt Nam
      curtainGlass.push(createInstanceMatrix(toWorld, 33.5, 28.0, dy + 1.9, 0, 67.0, 3.6, 0.04));

      // 3. Trần hở công nghiệp: Hệ ống gió HVAC xám gọn sát trần & đèn LED tuýp thả
      // ĐẶC BIỆT: Không chạy qua khoảng thông tầng (u: 20..36, v: 15..27)
      // Ống gió chính chạy dọc trục v = 9.0 (né khoảng thông tầng)
      hvacDucts.push(createInstanceMatrix(toWorld, 33.5, 9.0, dy + 3.55, 0, 62.0, 0.35, 0.8));
      // Ống gió nhánh phía Đông
      hvacDucts.push(createInstanceMatrix(toWorld, 52.0, 18.5, dy + 3.55, Math.PI / 2, 16.0, 0.3, 0.6));
      // Ống gió nhánh phía Tây
      hvacDucts.push(createInstanceMatrix(toWorld, 14.0, 18.5, dy + 3.55, Math.PI / 2, 16.0, 0.3, 0.6));

      // Dãy đèn LED tuýp mảnh treo thả trần ở cao độ y = 3.3m
      for (let u = 6.0; u <= 62.0; u += 5.5) {
        for (const v of [6.0, 12.0, 18.0, 24.0]) {
          // Bỏ qua nếu rơi vào khoảng thông tầng tầng 2
          if (f === 2 && u >= 20 && u <= 38 && v >= 15 && v <= 27) continue;
          ledLights.push(createInstanceMatrix(toWorld, u, v, dy + 3.3, 0, 2.4, 0.04, 0.08));
        }
      }

      // =========================================================================
      // NỘI THẤT CHI TIẾT TỪNG TẦNG
      // =========================================================================
      if (f === 1) {
        // --- TẦNG 1: Sảnh đón, Bàn đọc Zone B, Máy tính OPAC, Kệ sách trắng, Cổng thẻ ---
        // A. Cổng barrier quẹt thẻ lối vào chính (ảnh t077s)
        entranceGates.push(createInstanceMatrix(toWorld, 28.2, 26.5, dy + 0.48, 0, 0.28, 0.95, 1.2));
        entranceGates.push(createInstanceMatrix(toWorld, 29.8, 26.5, dy + 0.48, 0, 0.28, 0.95, 1.2));
        gateFlaps.push(createInstanceMatrix(toWorld, 29.0, 26.5, dy + 0.55, 0, 0.55, 0.45, 0.02));

        // 4 bảng gỗ nhận diện EIU ốp tường sảnh đón (ảnh t077s)
        const plaqueTitles = [22.2, 23.4, 24.6, 25.8];
        for (const pu of plaqueTitles) {
          entrancePlaques.push(createInstanceMatrix(toWorld, pu, 14.8, dy + 1.85, 0, 0.9, 1.4, 0.03));
        }

        // B. Quầy thủ thư (L-shaped counter)
        librarianCounter.push(createInstanceMatrix(toWorld, 26.5, 15.0, dy + 0.55, 0, 4.5, 1.1, 0.8));
        librarianCounter.push(createInstanceMatrix(toWorld, 24.2, 16.5, dy + 0.55, Math.PI / 2, 2.2, 1.1, 0.8));
        computerScreens.push(createInstanceMatrix(toWorld, 26.5, 15.0, dy + 1.35, 0, 0.55, 0.4, 0.08));
        keyboards.push(createInstanceMatrix(toWorld, 26.5, 15.3, dy + 1.12, 0, 0.4, 0.02, 0.15));

        // C. Bàn đọc gỗ dài & ghế Tolix chân sắt công nghiệp mặt Nam (Zone B)
        for (const u of [8.0, 14.0, 20.0, 36.0, 42.0]) {
          for (const v of [21.5, 24.8]) {
            oakTables.push(createInstanceMatrix(toWorld, u, v, dy + 0.73, 0, 2.4, 0.06, 1.0));
            steelTableLegs.push(createInstanceMatrix(toWorld, u - 1.05, v, dy + 0.35, 0, 0.08, 0.7, 0.9));
            steelTableLegs.push(createInstanceMatrix(toWorld, u + 1.05, v, dy + 0.35, 0, 0.08, 0.7, 0.9));

            // Ghế Tolix công nghiệp chân sắt mảnh + lưng tựa
            addTolixChair(tolixSeats, tolixBacks, tolixLegs, u - 0.6, v - 0.65, dy, 0);
            addTolixChair(tolixSeats, tolixBacks, tolixLegs, u + 0.6, v - 0.65, dy, 0);
            addTolixChair(tolixSeats, tolixBacks, tolixLegs, u - 0.6, v + 0.65, dy, Math.PI);
            addTolixChair(tolixSeats, tolixBacks, tolixLegs, u + 0.6, v + 0.65, dy, Math.PI);
          }
        }

        // D. Dãy kệ sách trắng nhiều tầng có gáy sách màu (ảnh w025s, w023s, 14)
        // 1. Dãy kệ chính phía Tây (4 dãy đôi)
        for (let col = 0; col < 4; col++) {
          const u = 6.0 + col * 3.6;
          for (let row = 0; row < 2; row++) {
            const v = 5.5 + row * 4.8;
            addWhiteBookshelf(
              shelfFrames,
              shelfBoards,
              shelfEndPanels,
              shelfSigns,
              booksRed,
              booksBlue,
              booksGold,
              booksGreen,
              booksWhite,
              u,
              v,
              dy,
              0
            );
          }
        }
        // 2. Dãy kệ nổi bật gần Zone B để đứng tại Zone B (ảnh 05) nhìn thấy rõ ràng
        addWhiteBookshelf(
          shelfFrames,
          shelfBoards,
          shelfEndPanels,
          shelfSigns,
          booksRed,
          booksBlue,
          booksGold,
          booksGreen,
          booksWhite,
          10.5,
          18.0,
          dy,
          Math.PI / 2
        );
        addWhiteBookshelf(
          shelfFrames,
          shelfBoards,
          shelfEndPanels,
          shelfSigns,
          booksRed,
          booksBlue,
          booksGold,
          booksGreen,
          booksWhite,
          10.5,
          22.0,
          dy,
          Math.PI / 2
        );

        // E. Khu máy tính tra cứu OPAC (u = 48..62, v = 15..24): 3 dãy bàn đôi
        for (let row = 0; row < 3; row++) {
          const v = 15.5 + row * 4.2;
          for (let col = 0; col < 5; col++) {
            const u = 49.0 + col * 2.8;
            walnutDesks.push(createInstanceMatrix(toWorld, u, v, dy + 0.72, 0, 2.2, 0.05, 1.3));
            steelTableLegs.push(createInstanceMatrix(toWorld, u - 0.95, v, dy + 0.35, 0, 0.06, 0.7, 1.2));
            steelTableLegs.push(createInstanceMatrix(toWorld, u + 0.95, v, dy + 0.35, 0, 0.06, 0.7, 1.2));

            // 2 máy All-in-One trắng đối diện
            computerScreens.push(createInstanceMatrix(toWorld, u, v - 0.25, dy + 1.05, 0, 0.52, 0.36, 0.06));
            keyboards.push(createInstanceMatrix(toWorld, u, v - 0.48, dy + 0.75, 0, 0.4, 0.02, 0.14));
            // Ghế học sinh chân gỗ thanh thoát
            studentSeats.push(createInstanceMatrix(toWorld, u, v - 0.85, dy + 0.44, 0, 0.44, 0.04, 0.42));
            studentBacks.push(createInstanceMatrix(toWorld, u, v - 1.03, dy + 0.7, 0, 0.4, 0.36, 0.03));
            studentLegs.push(createInstanceMatrix(toWorld, u - 0.17, v - 0.85, dy + 0.22, 0, 0.025, 0.43, 0.025));
            studentLegs.push(createInstanceMatrix(toWorld, u + 0.17, v - 0.85, dy + 0.22, 0, 0.025, 0.43, 0.025));

            computerScreens.push(createInstanceMatrix(toWorld, u, v + 0.25, dy + 1.05, Math.PI, 0.52, 0.36, 0.06));
            keyboards.push(createInstanceMatrix(toWorld, u, v + 0.48, dy + 0.75, Math.PI, 0.4, 0.02, 0.14));
            studentSeats.push(createInstanceMatrix(toWorld, u, v + 0.85, dy + 0.44, Math.PI, 0.44, 0.04, 0.42));
            studentBacks.push(createInstanceMatrix(toWorld, u, v + 1.03, dy + 0.7, Math.PI, 0.4, 0.36, 0.03));
            studentLegs.push(createInstanceMatrix(toWorld, u - 0.17, v + 0.85, dy + 0.22, Math.PI, 0.025, 0.43, 0.025));
            studentLegs.push(createInstanceMatrix(toWorld, u + 0.17, v + 0.85, dy + 0.22, Math.PI, 0.025, 0.43, 0.025));
          }
        }

        // F. Chậu cây nội thất thanh lịch CHỈ đặt trên sàn tầng 1 dọc vách kính
        for (const u of [6, 14, 24, 38, 50, 62]) {
          pottedPlanters.push(createInstanceMatrix(toWorld, u, 27.4, 0.28, 0, 0.5, 0.55, 0.5));
          plantFoliage.push(createInstanceMatrix(toWorld, u, 27.4, 0.75, 0, 0.7, 0.5, 0.7));
        }
      }

      if (f === 2) {
        // --- TẦNG 2: Thông tầng lan can kính, Dãy phòng họp nhóm 01..06, Zone A carrels ---
        // A. Lan can kính quanh khoảng thông tầng (u: 22..36, v: 16..26)
        addGlassRailing(railingSteel, railingGlass, railingHandrails, 22.0, 16.0, 36.0, 16.0, dy);
        addGlassRailing(railingSteel, railingGlass, railingHandrails, 36.0, 16.0, 36.0, 26.0, dy);
        addGlassRailing(railingSteel, railingGlass, railingHandrails, 36.0, 26.0, 22.0, 26.0, dy);
        addGlassRailing(railingSteel, railingGlass, railingHandrails, 22.0, 26.0, 22.0, 16.0, dy);

        // B. Dãy phòng họp nhóm kính 01 đến 06 dọc tường Bắc (u: 38..65, v: 0..8)
        const roomCenters = [40.25, 44.75, 49.25, 53.75, 58.25, 62.75];
        for (const ru of roomCenters) {
          dropCeilings.push(createInstanceMatrix(toWorld, ru, 4.0, dy + 3.25, 0, 4.2, 0.05, 7.8));
          cassetteAc.push(createInstanceMatrix(toWorld, ru, 4.0, dy + 3.22, 0, 0.85, 0.04, 0.85));
          groupMeetingTables.push(createInstanceMatrix(toWorld, ru, 4.0, dy + 0.73, 0, 2.8, 0.06, 1.2));
          steelTableLegs.push(createInstanceMatrix(toWorld, ru - 1.1, 4.0, dy + 0.35, 0, 0.08, 0.7, 1.0));
          steelTableLegs.push(createInstanceMatrix(toWorld, ru + 1.1, 4.0, dy + 0.35, 0, 0.08, 0.7, 1.0));

          // Ghế nệm xanh ngọc (teal) quanh bàn họp (6 ghế/phòng)
          addTealChair(tealSeats, tealBacks, tealLegs, ru - 0.8, 3.2, dy, 0);
          addTealChair(tealSeats, tealBacks, tealLegs, ru, 3.2, dy, 0);
          addTealChair(tealSeats, tealBacks, tealLegs, ru + 0.8, 3.2, dy, 0);
          addTealChair(tealSeats, tealBacks, tealLegs, ru - 0.8, 4.8, dy, Math.PI);
          addTealChair(tealSeats, tealBacks, tealLegs, ru, 4.8, dy, Math.PI);
          addTealChair(tealSeats, tealBacks, tealLegs, ru + 0.8, 4.8, dy, Math.PI);
        }

        // C. Khu tự học Zone A với bàn carrels và ghế teal (u = 42..62, v = 15..24)
        for (let col = 0; col < 4; col++) {
          const u = 44.0 + col * 4.8;
          for (const v of [16.0, 21.0]) {
            greyTables.push(createInstanceMatrix(toWorld, u, v, dy + 0.73, 0, 3.6, 0.05, 1.2));
            steelTableLegs.push(createInstanceMatrix(toWorld, u - 1.6, v, dy + 0.35, 0, 0.06, 0.7, 1.1));
            steelTableLegs.push(createInstanceMatrix(toWorld, u + 1.6, v, dy + 0.35, 0, 0.06, 0.7, 1.1));

            carrelsDividers.push(createInstanceMatrix(toWorld, u, v, dy + 1.05, 0, 3.6, 0.45, 0.04));
            carrelsDividers.push(createInstanceMatrix(toWorld, u - 1.2, v, dy + 1.05, Math.PI / 2, 1.1, 0.45, 0.04));
            carrelsDividers.push(createInstanceMatrix(toWorld, u, v, dy + 1.05, Math.PI / 2, 1.1, 0.45, 0.04));
            carrelsDividers.push(createInstanceMatrix(toWorld, u + 1.2, v, dy + 1.05, Math.PI / 2, 1.1, 0.45, 0.04));

            for (const offset of [-1.2, 0, 1.2]) {
              addTealChair(tealSeats, tealBacks, tealLegs, u + offset, v - 0.8, dy, 0);
              addTealChair(tealSeats, tealBacks, tealLegs, u + offset, v + 0.8, dy, Math.PI);
            }
          }
        }

        // D. Kệ sách học thuật chuyên ngành phía Tây (u = 4..18, v = 4..24)
        for (let col = 0; col < 4; col++) {
          const u = 6.0 + col * 3.6;
          for (let row = 0; row < 4; row++) {
            const v = 6.0 + row * 5.0;
            addWhiteBookshelf(
              shelfFrames,
              shelfBoards,
              shelfEndPanels,
              shelfSigns,
              booksRed,
              booksBlue,
              booksGold,
              booksGreen,
              booksWhite,
              u,
              v,
              dy,
              0
            );
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
              addTealChair(tealSeats, tealBacks, tealLegs, u + offset, v - 0.8, dy, 0);
              addTealChair(tealSeats, tealBacks, tealLegs, u + offset, v + 0.8, dy, Math.PI);
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
              addTolixChair(tolixSeats, tolixBacks, tolixLegs, u + offset, v - 0.8, dy, 0);
              addTolixChair(tolixSeats, tolixBacks, tolixLegs, u + offset, v + 0.8, dy, Math.PI);
            }
          }
        }
      }

      // 4. Cầu thang bộ (kết nối f lên f+1 nếu f < 3)
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
      curtainFrames,
      curtainGlass,
      oakTables,
      steelTableLegs,
      tolixSeats,
      tolixBacks,
      tolixLegs,
      walnutDesks,
      computerScreens,
      keyboards,
      studentSeats,
      studentBacks,
      studentLegs,
      greyTables,
      tealSeats,
      tealBacks,
      tealLegs,
      carrelsDividers,
      shelfFrames,
      shelfBoards,
      shelfEndPanels,
      shelfSigns,
      booksRed,
      booksBlue,
      booksGold,
      booksGreen,
      booksWhite,
      librarianCounter,
      entranceGates,
      gateFlaps,
      entrancePlaques,
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
      <InstancedBatch batchKey="b4-hvac" matrices={data.hvacDucts} geometry={sharedGeos.box} color="#334155" metalness={0.3} roughness={0.5} />
      <InstancedBatch
        batchKey="b4-led"
        matrices={data.ledLights}
        geometry={sharedGeos.box}
        color="#ffffff"
        emissive="#ffffff"
        emissiveIntensity={1.0}
        castShadow={false}
      />

      {/* 2. Vách kính lớn mặt Nam & khung nhôm đen công nghiệp */}
      <InstancedBatch batchKey="b4-curtain-frames" matrices={data.curtainFrames} geometry={sharedGeos.box} color="#18181b" metalness={0.5} roughness={0.35} />
      <InstancedBatch
        batchKey="b4-curtain-glass"
        matrices={data.curtainGlass}
        geometry={sharedGeos.box}
        color="#bae6fd"
        transparent
        opacity={0.28}
        roughness={0.05}
        metalness={0.25}
        depthWrite={false}
      />

      {/* 3. Bàn đọc gỗ-sắt & ghế Tolix công nghiệp chân sắt mảnh */}
      <InstancedBatch batchKey="b4-oak-tables" matrices={data.oakTables} geometry={sharedGeos.box} color="#d4a373" roughness={0.6} />
      <InstancedBatch batchKey="b4-table-legs" matrices={data.steelTableLegs} geometry={sharedGeos.box} color="#18181b" metalness={0.6} roughness={0.4} />
      <InstancedBatch batchKey="b4-tolix-seats" matrices={data.tolixSeats} geometry={sharedGeos.box} color="#1e2022" metalness={0.5} roughness={0.4} />
      <InstancedBatch batchKey="b4-tolix-backs" matrices={data.tolixBacks} geometry={sharedGeos.box} color="#18181b" metalness={0.5} roughness={0.4} />
      <InstancedBatch batchKey="b4-tolix-legs" matrices={data.tolixLegs} geometry={sharedGeos.box} color="#18181b" metalness={0.6} roughness={0.35} />

      {/* 4. Máy tính OPAC & ghế học sinh chân gỗ */}
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
      <InstancedBatch batchKey="b4-stud-seats" matrices={data.studentSeats} geometry={sharedGeos.box} color="#27272a" roughness={0.6} />
      <InstancedBatch batchKey="b4-stud-backs" matrices={data.studentBacks} geometry={sharedGeos.box} color="#27272a" roughness={0.6} />
      <InstancedBatch batchKey="b4-stud-legs" matrices={data.studentLegs} geometry={sharedGeos.box} color="#c8a67a" roughness={0.6} />

      {/* 5. Bàn xám + ghế teal & vách carrels */}
      <InstancedBatch batchKey="b4-grey-tables" matrices={data.greyTables} geometry={sharedGeos.box} color="#94a3b8" roughness={0.5} />
      <InstancedBatch batchKey="b4-teal-seats" matrices={data.tealSeats} geometry={sharedGeos.box} color="#0d9488" roughness={0.4} />
      <InstancedBatch batchKey="b4-teal-backs" matrices={data.tealBacks} geometry={sharedGeos.box} color="#0d9488" roughness={0.4} />
      <InstancedBatch batchKey="b4-teal-legs" matrices={data.tealLegs} geometry={sharedGeos.box} color="#18181b" metalness={0.5} roughness={0.4} />
      <InstancedBatch batchKey="b4-carrels" matrices={data.carrelsDividers} geometry={sharedGeos.box} color="#cbd5e1" roughness={0.6} />

      {/* 6. Dãy kệ sách trắng nhiều tầng có gáy sách màu & bảng hiệu xanh tím EIU */}
      <InstancedBatch batchKey="b4-shelf-frames" matrices={data.shelfFrames} geometry={sharedGeos.box} color="#f8fafc" roughness={0.35} />
      <InstancedBatch batchKey="b4-shelf-boards" matrices={data.shelfBoards} geometry={sharedGeos.box} color="#f1f5f9" roughness={0.35} />
      <InstancedBatch batchKey="b4-shelf-ends" matrices={data.shelfEndPanels} geometry={sharedGeos.box} color="#d4a373" roughness={0.6} />
      <InstancedBatch batchKey="b4-shelf-signs" matrices={data.shelfSigns} geometry={sharedGeos.box} color="#3b82f6" roughness={0.3} />
      <InstancedBatch batchKey="b4-books-red" matrices={data.booksRed} geometry={sharedGeos.box} color="#dc2626" roughness={0.7} />
      <InstancedBatch batchKey="b4-books-blue" matrices={data.booksBlue} geometry={sharedGeos.box} color="#2563eb" roughness={0.7} />
      <InstancedBatch batchKey="b4-books-gold" matrices={data.booksGold} geometry={sharedGeos.box} color="#d97706" roughness={0.7} />
      <InstancedBatch batchKey="b4-books-green" matrices={data.booksGreen} geometry={sharedGeos.box} color="#059669" roughness={0.7} />
      <InstancedBatch batchKey="b4-books-white" matrices={data.booksWhite} geometry={sharedGeos.box} color="#f8fafc" roughness={0.7} />

      {/* 7. Quầy thủ thư & Cổng thẻ barrier */}
      <InstancedBatch batchKey="b4-counter" matrices={data.librarianCounter} geometry={sharedGeos.box} color="#f8fafc" roughness={0.3} metalness={0.1} />
      <InstancedBatch batchKey="b4-gates" matrices={data.entranceGates} geometry={sharedGeos.box} color="#cbd5e1" metalness={0.85} roughness={0.2} />
      <InstancedBatch
        batchKey="b4-flaps"
        matrices={data.gateFlaps}
        geometry={sharedGeos.box}
        color="#22c55e"
        emissive="#22c55e"
        emissiveIntensity={0.6}
        transparent
        opacity={0.6}
      />
      <InstancedBatch batchKey="b4-plaques" matrices={data.entrancePlaques} geometry={sharedGeos.box} color="#b45309" roughness={0.5} />

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

      {/* 10. Cây xanh nội thất thanh lịch đặt trên sàn */}
      <InstancedBatch batchKey="b4-planters" matrices={data.pottedPlanters} geometry={sharedGeos.cyl} color="#f8fafc" roughness={0.4} />
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
        <mesh position={[0, 1.4, 0]}>
          <boxGeometry args={[2.4, 2.8, 0.3]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.15, 0.05]}>
          <boxGeometry args={[1.5, 2.3, 0.05]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </mesh>
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
                <mesh position={[0, 0.25, 0.05]}>
                  <boxGeometry args={[0.32, 0.1, 0.02]} />
                  <meshStandardMaterial color="#15803d" />
                </mesh>
                <Text position={[0, 0.25, 0.07]} fontSize={0.05} color="#ffffff" anchorX="center" anchorY="middle">
                  EIU
                </Text>
                <mesh position={[0, 0.15, 0.05]}>
                  <boxGeometry args={[0.32, 0.1, 0.02]} />
                  <meshStandardMaterial color="#65a30d" />
                </mesh>
                <Text position={[0, 0.15, 0.07]} fontSize={0.07} color="#ffffff" anchorX="center" anchorY="middle">
                  {num}
                </Text>
                <mesh position={[0, 0.05, 0.05]}>
                  <boxGeometry args={[0.32, 0.1, 0.02]} />
                  <meshStandardMaterial color="#ea580c" />
                </mesh>
                <Text position={[0, 0.05, 0.07]} fontSize={0.035} color="#ffffff" anchorX="center" anchorY="middle">
                  {'Phòng họp nhóm\nGroup Study'}
                </Text>
                <mesh position={[0, -0.05, 0.05]}>
                  <boxGeometry args={[0.32, 0.1, 0.02]} />
                  <meshStandardMaterial color="#991b1b" />
                </mesh>
                <Text position={[0, -0.05, 0.07]} fontSize={0.035} color="#ffffff" anchorX="center" anchorY="middle">
                  {'THƯ VIỆN / Library'}
                </Text>
                <mesh position={[0.22, 0.05, 0.05]}>
                  <boxGeometry args={[0.08, 0.18, 0.03]} />
                  <meshStandardMaterial color="#18181b" />
                </mesh>
              </group>
            );
          })}
        </group>
      )}

      {/* 15. Poster màu EIU dán sát trực tiếp lên vách kính mặt Nam (v = 27.95, y = 1.85m) */}
      <group>
        {/* Poster Tím: Khoa Điều dưỡng */}
        <group position={[toWorld(12.5, 27.95)[0], 1.85, toWorld(12.5, 27.95)[1]]} rotation-y={getLocalFacingYaw(-Math.PI / 2)}>
          <mesh>
            <boxGeometry args={[1.2, 1.5, 0.005]} />
            <meshStandardMaterial color="#581c87" roughness={0.3} />
          </mesh>
          <Text position={[0, 0.2, 0.006]} fontSize={0.07} color="#f3e8ff" maxWidth={1.1} textAlign="center" anchorX="center" anchorY="middle">
            {"Save one person\nYOU'RE A HERO\n\nSave hundreds\nYOU'RE A NURSE"}
          </Text>
        </group>

        {/* Poster Xanh lá: Dám ước mơ dám thực hiện */}
        <group position={[toWorld(17.5, 27.95)[0], 1.85, toWorld(17.5, 27.95)[1]]} rotation-y={getLocalFacingYaw(-Math.PI / 2)}>
          <mesh>
            <boxGeometry args={[1.2, 1.5, 0.005]} />
            <meshStandardMaterial color="#15803d" roughness={0.3} />
          </mesh>
          <Text position={[0, 0.2, 0.006]} fontSize={0.08} color="#ffffff" maxWidth={1.1} textAlign="center" anchorX="center" anchorY="middle">
            {'dám\nƯỚC MƠ\n\ndám\nTHỰC HIỆN'}
          </Text>
        </group>

        {/* Poster Xanh ngọc: Building the future with ideas */}
        <group position={[toWorld(22.5, 27.95)[0], 1.85, toWorld(22.5, 27.95)[1]]} rotation-y={getLocalFacingYaw(-Math.PI / 2)}>
          <mesh>
            <boxGeometry args={[1.2, 1.5, 0.005]} />
            <meshStandardMaterial color="#0f766e" roughness={0.3} />
          </mesh>
          <Text position={[0, 0.1, 0.006]} fontSize={0.075} color="#ccfbf1" maxWidth={1.1} textAlign="center" anchorX="center" anchorY="middle">
            {'Building the future\nWITH IDEAS'}
          </Text>
        </group>

        {/* Poster Cam: Your journey starts here */}
        <group position={[toWorld(33.5, 27.95)[0], 1.85, toWorld(33.5, 27.95)[1]]} rotation-y={getLocalFacingYaw(-Math.PI / 2)}>
          <mesh>
            <boxGeometry args={[1.2, 1.5, 0.005]} />
            <meshStandardMaterial color="#c2410c" roughness={0.3} />
          </mesh>
          <Text position={[0, 0.15, 0.006]} fontSize={0.075} color="#fff7ed" maxWidth={1.1} textAlign="center" anchorX="center" anchorY="middle">
            {'YOUR JOURNEY\nSTARTS HERE\n\nEIU'}
          </Text>
        </group>

        {/* Poster Đỏ: Sứ mạng EIU */}
        <group position={[toWorld(37.5, 27.95)[0], 1.85, toWorld(37.5, 27.95)[1]]} rotation-y={getLocalFacingYaw(-Math.PI / 2)}>
          <mesh>
            <boxGeometry args={[1.1, 1.5, 0.005]} />
            <meshStandardMaterial color="#b91c1c" roughness={0.3} />
          </mesh>
          <Text position={[0, 0.2, 0.006]} fontSize={0.08} color="#ffffff" maxWidth={1.0} textAlign="center" anchorX="center" anchorY="middle">
            {'SỨ MẠNG\nEIU'}
          </Text>
        </group>

        {/* Poster Đỏ rượu: Tầm nhìn */}
        <group position={[toWorld(42.5, 27.95)[0], 1.85, toWorld(42.5, 27.95)[1]]} rotation-y={getLocalFacingYaw(-Math.PI / 2)}>
          <mesh>
            <boxGeometry args={[1.1, 1.5, 0.005]} />
            <meshStandardMaterial color="#991b1b" roughness={0.3} />
          </mesh>
          <Text position={[0, 0.2, 0.006]} fontSize={0.08} color="#ffffff" maxWidth={1.0} textAlign="center" anchorX="center" anchorY="middle">
            {'TẦM NHÌN\nVISION'}
          </Text>
        </group>

        {/* Poster Xanh dương: Giá trị cốt lõi */}
        <group position={[toWorld(47.5, 27.95)[0], 1.85, toWorld(47.5, 27.95)[1]]} rotation-y={getLocalFacingYaw(-Math.PI / 2)}>
          <mesh>
            <boxGeometry args={[1.1, 1.5, 0.005]} />
            <meshStandardMaterial color="#1d4ed8" roughness={0.3} />
          </mesh>
          <Text position={[0, 0.2, 0.006]} fontSize={0.075} color="#ffffff" maxWidth={1.0} textAlign="center" anchorX="center" anchorY="middle">
            {'GIÁ TRỊ CỐT LÕI\nCORE VALUES'}
          </Text>
        </group>

        {/* Poster OPAC trắng */}
        <group position={[toWorld(53.5, 27.95)[0], 1.85, toWorld(53.5, 27.95)[1]]} rotation-y={getLocalFacingYaw(-Math.PI / 2)}>
          <mesh>
            <boxGeometry args={[0.9, 1.2, 0.005]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} />
          </mesh>
          <Text position={[0, 0.1, 0.006]} fontSize={0.06} color="#0f172a" maxWidth={0.8} textAlign="center" anchorX="center" anchorY="middle">
            {'LIBRARY OPAC\n\nCỔNG TRA CỨU'}
          </Text>
        </group>

        {/* Poster Online Databases */}
        <group position={[toWorld(58.5, 27.95)[0], 1.85, toWorld(58.5, 27.95)[1]]} rotation-y={getLocalFacingYaw(-Math.PI / 2)}>
          <mesh>
            <boxGeometry args={[0.9, 1.2, 0.005]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} />
          </mesh>
          <Text position={[0, 0.1, 0.006]} fontSize={0.06} color="#0f172a" maxWidth={0.8} textAlign="center" anchorX="center" anchorY="middle">
            {'ONLINE\nDATABASES'}
          </Text>
        </group>
      </group>
    </group>
  );
}
