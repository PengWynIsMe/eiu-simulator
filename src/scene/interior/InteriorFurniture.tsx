import { useMemo } from 'react';
import { Matrix4, Vector3, Quaternion, Euler, BoxGeometry, CylinderGeometry } from 'three';
import { FLOOR_HEIGHT } from '../../data';
import type { Vec2 } from '../../types';
import { b3Layout } from './layouts/b3';
import { b8Layout } from './layouts/b8';
import B11Furniture from './B11Furniture';

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
    return <B8Furniture floor={floor} />;
  }
  if (id === 'b11') {
    return <B11Furniture floor={floor} showUpperFloors={showUpperFloors} />;
  }
  if (id === 'b3') {
    return <B3Furniture floor={floor} />;
  }
  return null;
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
    // Hàng cột dọc hành lang Bắc (v = -198.5) và Nam (v = -178.9)
    const gridU = [9.0, 18.0, 27.0, 36.0, 45.0, 52.0, 60.0, 68.0, 76.0, 84.0, 92.0, 100.0, 108.0, 116.0, 120.4];
    for (const u of gridU) {
      matrices.push(createInstanceMatrix(toWorld, u, -198.5, FLOOR_HEIGHT / 2, 0, 0.5, FLOOR_HEIGHT, 0.5));
      matrices.push(createInstanceMatrix(toWorld, u, -178.9, FLOOR_HEIGHT / 2, 0, 0.5, FLOOR_HEIGHT, 0.5));
    }
    return matrices;
  }, [toWorld]);

  // 2. Bàn ghế lớp học theo đúng mật độ thật (phòng thường 48–56 chỗ, phòng gộp ~100+ chỗ)
  const { deskMatrices, chairMatrices, boardMatrices, teacherDeskMatrices } = useMemo(() => {
    const desks: Matrix4[] = [];
    const chairs: Matrix4[] = [];
    const boards: Matrix4[] = [];
    const teacherDesks: Matrix4[] = [];

    for (const room of rooms) {
      if (!room.code.includes('.B8') || room.code.includes('102') || room.code.startsWith('WC')) continue;

      const vCenter = (room.minV + room.maxV) / 2;
      const isNorth = room.maxV <= -200.0;

      // a. Bảng gắn tường Tây (u = minU), mép dưới 0.9 m, cao 1.2 m (center y = 1.5 m)
      // Bảng rộng 3.5 m dọc theo v, dày 0.06 m dọc theo u
      boards.push(createInstanceMatrix(toWorld, room.minU + 0.05, vCenter, 1.5, 0, 0.06, 1.2, 3.5));

      // b. Bàn giáo viên 1.4 (v) x 0.7 (u) m, cao 0.75 m, cách bảng 1.2 m (u = minU + 1.2)
      teacherDesks.push(createInstanceMatrix(toWorld, room.minU + 1.2, vCenter, 0.375, 0, 0.7, 0.75, 1.4));
      // Ghế giáo viên ngồi phía sau bàn GV (u = minU + 0.65), quay mặt về phía Đông
      chairs.push(createInstanceMatrix(toWorld, room.minU + 0.65, vCenter, 0.41, 0, 0.45, 0.82, 0.45));

      // c. Bàn đôi học sinh: 1.2 m (v) x 0.5 m (u), cao 0.75 m + 2 ghế 0.42 x 0.42 m
      // Hàng đầu cách tường Tây 2.4 m, bước hàng 0.9 m theo u, tới khi còn cách tường Đông 0.6 m
      const deskPitchU = 0.9;
      const deskWidthU = 0.5;
      const deskLengthV = 1.2;
      const aisleV = 0.7;
      const desksPerRow = 4;
      const totalDesksSpanV = desksPerRow * deskLengthV + (desksPerRow - 1) * aisleV; // 4 * 1.2 + 3 * 0.7 = 6.9 m

      let vAvailableStart: number;
      let vAvailableEnd: number;
      if (isNorth) {
        // Cánh Bắc: cửa phía hành lang ở maxV (chừa 1.0 m), tường ngoài ở minV (cách 0.6 m)
        vAvailableStart = room.minV + 0.6;
        vAvailableEnd = room.maxV - 1.0;
      } else {
        // Cánh Nam: cửa phía hành lang ở minV (chừa 1.0 m), tường ngoài ở maxV (cách 0.6 m)
        vAvailableStart = room.minV + 1.0;
        vAvailableEnd = room.maxV - 0.6;
      }

      const availableSpanV = vAvailableEnd - vAvailableStart;
      const marginV = Math.max(0, (availableSpanV - totalDesksSpanV) / 2);

      for (let u = room.minU + 2.4; u + deskWidthU <= room.maxU - 0.6; u += deskPitchU) {
        for (let col = 0; col < desksPerRow; col++) {
          const v = vAvailableStart + marginV + col * (deskLengthV + aisleV) + deskLengthV / 2;
          // Bàn đôi: width 0.5 (u), height 0.75 (y), length 1.2 (v)
          desks.push(createInstanceMatrix(toWorld, u, v, 0.375, 0, deskWidthU, 0.75, deskLengthV));

          // 2 ghế ngồi phía sau bàn (u + 0.42 m), quay mặt về phía Tây (Math.PI)
          chairs.push(createInstanceMatrix(toWorld, u + 0.42, v - 0.3, 0.41, Math.PI, 0.42, 0.82, 0.42));
          chairs.push(createInstanceMatrix(toWorld, u + 0.42, v + 0.3, 0.41, Math.PI, 0.42, 0.82, 0.42));
        }
      }
    }

    return {
      deskMatrices: desks,
      chairMatrices: chairs,
      boardMatrices: boards,
      teacherDeskMatrices: teacherDesks,
    };
  }, [rooms, toWorld]);

  // 5. Lan can inox bảo vệ sân trong (chỉ tầng 2, 3, 4 — KHÔNG DÙNG KÍNH)
  const railingMatrices = useMemo(() => {
    if (floor === 1) return [];
    const matrices: Matrix4[] = [];

    // Các đoạn mép sân trong:
    const edges = [
      // Sân Tây
      { u1: 13.5, v1: -197.0, u2: 50.0, v2: -197.0 },
      { u1: 13.5, v1: -180.1, u2: 50.0, v2: -180.1 },
      { u1: 13.5, v1: -197.0, u2: 13.5, v2: -180.1 },
      { u1: 50.0, v1: -197.0, u2: 50.0, v2: -180.1 },
      // Sân Đông
      { u1: 54.1, v1: -196.5, u2: 114.9, v2: -196.5 },
      { u1: 54.1, v1: -179.6, u2: 114.9, v2: -179.6 },
      { u1: 54.1, v1: -196.5, u2: 54.1, v2: -190.2 },
      { u1: 54.1, v1: -186.5, u2: 54.1, v2: -179.6 },
      { u1: 114.9, v1: -196.5, u2: 114.9, v2: -190.3 },
      { u1: 114.9, v1: -184.8, u2: 114.9, v2: -179.6 },
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

    // Mép Bắc Sân Tây (v = -197.0) viền lùi vào hành lang ở v = -197.2
    const lenWestU = 50.0 - 13.5;
    const lenWestV = -180.1 - (-197.0);
    matrices.push(createInstanceMatrix(toWorld, (13.5 + 50.0) / 2, -197.2, 0.005, 0, lenWestU, 0.01, 0.35));
    // Mép Nam Sân Tây (v = -180.1) viền lùi vào hành lang ở v = -179.9
    matrices.push(createInstanceMatrix(toWorld, (13.5 + 50.0) / 2, -179.9, 0.005, 0, lenWestU, 0.01, 0.35));
    // Mép Tây Sân Tây
    matrices.push(createInstanceMatrix(toWorld, 13.3, (-197.0 + -180.1) / 2, 0.005, Math.PI / 2, lenWestV, 0.01, 0.35));
    // Mép Đông Sân Tây
    matrices.push(createInstanceMatrix(toWorld, 50.2, (-197.0 + -180.1) / 2, 0.005, Math.PI / 2, lenWestV, 0.01, 0.35));

    // Mép Sân Đông
    const lenEastU = 114.9 - 54.1;
    matrices.push(createInstanceMatrix(toWorld, (54.1 + 114.9) / 2, -196.7, 0.005, 0, lenEastU, 0.01, 0.35));
    matrices.push(createInstanceMatrix(toWorld, (54.1 + 114.9) / 2, -179.4, 0.005, 0, lenEastU, 0.01, 0.35));
    // Mép Tây Sân Đông (2 đoạn)
    const lenW1 = -190.2 - (-196.5);
    const lenW2 = -179.6 - (-186.5);
    matrices.push(createInstanceMatrix(toWorld, 53.9, (-196.5 + -190.2) / 2, 0.005, Math.PI / 2, lenW1, 0.01, 0.35));
    matrices.push(createInstanceMatrix(toWorld, 53.9, (-186.5 + -179.6) / 2, 0.005, Math.PI / 2, lenW2, 0.01, 0.35));
    // Mép Đông Sân Đông (2 đoạn)
    const lenE1 = -190.3 - (-196.5);
    const lenE2 = -179.6 - (-184.8);
    matrices.push(createInstanceMatrix(toWorld, 115.1, (-196.5 + -190.3) / 2, 0.005, Math.PI / 2, lenE1, 0.01, 0.35));
    matrices.push(createInstanceMatrix(toWorld, 115.1, (-184.8 + -179.6) / 2, 0.005, Math.PI / 2, lenE2, 0.01, 0.35));

    return matrices;
  }, [floor, toWorld]);

  // 7. Lam che nắng trên hành lang mở nhìn ra sân trong (chỉ tầng 2, 3, 4)
  const louverMatrices = useMemo(() => {
    if (floor === 1) return [];
    const matrices: Matrix4[] = [];

    const louverHeights = [3.2, 3.4, 3.6];
    const lenWest = 50.0 - 13.5;
    const lenEast = 114.9 - 54.1;

    for (const y of louverHeights) {
      // Dãy Bắc nhìn vào sân trong
      matrices.push(createInstanceMatrix(toWorld, (13.5 + 50.0) / 2, -197.0, y, 0, lenWest, 0.04, 0.25));
      matrices.push(createInstanceMatrix(toWorld, (54.1 + 114.9) / 2, -196.5, y, 0, lenEast, 0.04, 0.25));
      // Dãy Nam nhìn vào sân trong
      matrices.push(createInstanceMatrix(toWorld, (13.5 + 50.0) / 2, -180.1, y, 0, lenWest, 0.04, 0.25));
      matrices.push(createInstanceMatrix(toWorld, (54.1 + 114.9) / 2, -179.6, y, 0, lenEast, 0.04, 0.25));
    }

    return matrices;
  }, [floor, toWorld]);

  // 8. Sân trong — Vườn mở (lát gạch xám nhạt #c9c4bb + bồn cây viền bê tông cao 0.4 m, mặt cỏ #6f9a5b + cây lớn)
  const courtyardGarden = useMemo(() => {
    const groundElevation = -(floor - 1) * FLOOR_HEIGHT;

    const tileWalkwayMatrices: Matrix4[] = [];
    const planterRimMatrices: Matrix4[] = [];
    const planterSoilMatrices: Matrix4[] = [];
    const treeTrunkMatrices: Matrix4[] = [];
    const treeFoliageMatrices: Matrix4[] = [];

    // Danh sách các bồn cây chữ nhật:
    // Sân Tây: 3 bồn dọc giữa
    const westPlanters = [
      { centerU: 25.0, lenU: 8.5, centerV: -188.55, widthV: 5.0 },
      { centerU: 35.0, lenU: 8.5, centerV: -188.55, widthV: 5.0 },
      { centerU: 45.0, lenU: 7.2, centerV: -188.55, widthV: 5.0 },
    ];
    // Sân Đông: 5 bồn dọc giữa
    const eastPlanters = [
      { centerU: 65.0, lenU: 8.5, centerV: -188.05, widthV: 5.0 },
      { centerU: 75.0, lenU: 8.5, centerV: -188.05, widthV: 5.0 },
      { centerU: 85.0, lenU: 8.5, centerV: -188.05, widthV: 5.0 },
      { centerU: 95.0, lenU: 8.5, centerV: -188.05, widthV: 5.0 },
      { centerU: 104.0, lenU: 6.5, centerV: -188.05, widthV: 5.0 },
    ];

    // Tạo viền bê tông cao 0.4 m và mặt cỏ cao 0.35 m cho từng bồn cây
    for (const p of [...westPlanters, ...eastPlanters]) {
      // Viền bê tông bồn cây (cao 0.4 m)
      planterRimMatrices.push(
        createInstanceMatrix(toWorld, p.centerU, p.centerV, groundElevation + 0.2, 0, p.lenU, 0.4, p.widthV)
      );
      // Mặt cỏ xanh / cây bụi bên trong (cao 0.35 m)
      planterSoilMatrices.push(
        createInstanceMatrix(toWorld, p.centerU, p.centerV, groundElevation + 0.22, 0, p.lenU - 0.4, 0.38, p.widthV - 0.4)
      );
    }

    // Cây lớn: 1 cây mỗi ~12 m dọc bồn (tán rộng 6–8 m, cao 8–10 m)
    // Sân Tây 3 cây, Sân Đông 5 cây
    const treeLocs: [number, number][] = [
      // Sân Tây
      [25.0, -188.55],
      [35.0, -188.55],
      [45.0, -188.55],
      // Sân Đông
      [65.0, -188.05],
      [75.0, -188.05],
      [85.0, -188.05],
      [95.0, -188.05],
      [104.0, -188.05],
    ];

    for (const [u, v] of treeLocs) {
      // Thân cây cao 8 m vươn lên từ mặt đất
      treeTrunkMatrices.push(
        createInstanceMatrix(toWorld, u, v, groundElevation + 4.0, 0, 0.5, 8.0, 0.5)
      );
      // Tán lá xum xuê rộng 7.0 m, cao 7.0 m
      treeFoliageMatrices.push(
        createInstanceMatrix(toWorld, u, v, groundElevation + 8.0, 0, 7.0, 7.0, 7.0)
      );
    }

    // Viền lối lát gạch rộng 1.5 m sát mép sân, màu #c9c4bb
    // Sân Tây: [13.5, 50.0] x [-197.0, -180.1]
    const lenWestU = 50.0 - 13.5;
    const lenWestV = -180.1 - (-197.0);
    tileWalkwayMatrices.push(createInstanceMatrix(toWorld, (13.5 + 50.0) / 2, -197.0 + 0.75, groundElevation + 0.02, 0, lenWestU, 0.04, 1.5));
    tileWalkwayMatrices.push(createInstanceMatrix(toWorld, (13.5 + 50.0) / 2, -180.1 - 0.75, groundElevation + 0.02, 0, lenWestU, 0.04, 1.5));
    tileWalkwayMatrices.push(createInstanceMatrix(toWorld, 13.5 + 0.75, (-197.0 + -180.1) / 2, groundElevation + 0.02, 0, 1.5, 0.04, lenWestV));
    tileWalkwayMatrices.push(createInstanceMatrix(toWorld, 50.0 - 0.75, (-197.0 + -180.1) / 2, groundElevation + 0.02, 0, 1.5, 0.04, lenWestV));

    // Lối đi ngang 1.5 m cắt ngang giữa các bồn cây sân Tây
    tileWalkwayMatrices.push(createInstanceMatrix(toWorld, 30.0, -188.55, groundElevation + 0.02, 0, 1.5, 0.04, 5.0));
    tileWalkwayMatrices.push(createInstanceMatrix(toWorld, 40.0, -188.55, groundElevation + 0.02, 0, 1.5, 0.04, 5.0));

    // Sân Đông: [54.1, 114.9] x [-196.5, -179.6]
    const lenEastU = 114.9 - 54.1;
    const lenEastV = -179.6 - (-196.5);
    tileWalkwayMatrices.push(createInstanceMatrix(toWorld, (54.1 + 114.9) / 2, -196.5 + 0.75, groundElevation + 0.02, 0, lenEastU, 0.04, 1.5));
    tileWalkwayMatrices.push(createInstanceMatrix(toWorld, (54.1 + 114.9) / 2, -179.6 - 0.75, groundElevation + 0.02, 0, lenEastU, 0.04, 1.5));
    tileWalkwayMatrices.push(createInstanceMatrix(toWorld, 54.1 + 0.75, (-196.5 + -179.6) / 2, groundElevation + 0.02, 0, 1.5, 0.04, lenEastV));
    tileWalkwayMatrices.push(createInstanceMatrix(toWorld, 114.9 - 0.75, (-196.5 + -179.6) / 2, groundElevation + 0.02, 0, 1.5, 0.04, lenEastV));

    // Lối đi ngang 1.5 m cắt ngang giữa các bồn cây sân Đông
    tileWalkwayMatrices.push(createInstanceMatrix(toWorld, 70.0, -188.05, groundElevation + 0.02, 0, 1.5, 0.04, 5.0));
    tileWalkwayMatrices.push(createInstanceMatrix(toWorld, 80.0, -188.05, groundElevation + 0.02, 0, 1.5, 0.04, 5.0));
    tileWalkwayMatrices.push(createInstanceMatrix(toWorld, 90.0, -188.05, groundElevation + 0.02, 0, 1.5, 0.04, 5.0));
    tileWalkwayMatrices.push(createInstanceMatrix(toWorld, 100.0, -188.05, groundElevation + 0.02, 0, 1.5, 0.04, 5.0));

    return {
      tileWalkwayMatrices,
      planterRimMatrices,
      planterSoilMatrices,
      treeTrunkMatrices,
      treeFoliageMatrices,
    };
  }, [floor, toWorld]);

  // 9. Cầu thang bộ gấp 2 đoạn chuẩn kiến trúc (5 cụm: Tây Bắc, Giữa Bắc, Tây Nam, Giữa Nam, Lõi Đông)
  const stairData = useMemo(() => {
    const stepMatrices: Matrix4[] = [];
    const landingMatrices: Matrix4[] = [];
    const railMatrices: Matrix4[] = [];

    const RISE = FLOOR_HEIGHT / 24; // 0.15833 m (24 bậc / 3.8 m)
    const TREAD = 0.28; // 0.28 m
    const FLIGHT_W = 1.3; // 1.3 m
    const GAP = 0.2; // 0.2 m
    const LANDING_DEPTH = 1.3; // 1.3 m
    const LANDING_W = 2 * FLIGHT_W + GAP; // 2.8 m

    // Cấu hình 5 buồng thang
    interface StairConfig {
      axis: 'v' | 'u';
      corridorEdge: number; // Tọa độ mép giáp hành lang
      dir: 1 | -1;          // Hướng đoạn 1 đi xa hành lang
      centerCross: number;  // Tọa độ tâm theo trục ngang
    }

    const stairs: StairConfig[] = [
      // Tây Bắc: trục v, mép v = -200.0, đi về -v, tâm u = (9.0 + 13.1) / 2 = 11.05
      { axis: 'v', corridorEdge: -200.0, dir: -1, centerCross: 11.05 },
      // Giữa Bắc: trục v, mép v = -200.0, đi về -v, tâm u = (49.7 + 54.1) / 2 = 51.9
      { axis: 'v', corridorEdge: -200.0, dir: -1, centerCross: 51.9 },
      // Tây Nam: trục v, mép v = -177.7, đi về +v, tâm u = (9.7 + 13.5) / 2 = 11.6
      { axis: 'v', corridorEdge: -177.7, dir: 1, centerCross: 11.6 },
      // Giữa Nam: trục v, mép v = -177.7, đi về +v, tâm u = (50.0 + 53.7) / 2 = 51.85
      { axis: 'v', corridorEdge: -177.7, dir: 1, centerCross: 51.85 },
      // Lõi Đông: trục u, mép u = 114.5, đi về -u, tâm v = (-190.3 + -184.8) / 2 = -187.55
      { axis: 'u', corridorEdge: 114.5, dir: -1, centerCross: -187.55 },
    ];

    for (const st of stairs) {
      const isV = st.axis === 'v';

      // --- ĐOẠN 1 (Flight 1): 12 bậc đi từ hành lang lên chiếu nghỉ (y: 0 -> 1.9 m) ---
      // Đoạn 1 nằm ở nhánh bên phải khi nhìn từ hành lang vào
      const crossOffsetF1 = +(GAP / 2 + FLIGHT_W / 2); // +0.75 m

      for (let i = 0; i < 12; i++) {
        const distAlong = (i + 0.5) * TREAD;
        const mainCoord = st.corridorEdge + st.dir * distAlong;
        const crossCoord = st.centerCross + crossOffsetF1;

        const u = isV ? crossCoord : mainCoord;
        const v = isV ? mainCoord : crossCoord;

        // Bậc thấp nhất (i = 0): cao hơn sàn >= 0.02 m để tránh trùng mặt phẳng
        let stepH = RISE;
        let stepCenterY: number;
        if (i === 0) {
          stepH = RISE - 0.02;
          stepCenterY = 0.02 + stepH / 2;
        } else {
          stepCenterY = (i + 0.5) * RISE;
        }

        const sx = isV ? FLIGHT_W : TREAD;
        const sz = isV ? TREAD : FLIGHT_W;
        stepMatrices.push(createInstanceMatrix(toWorld, u, v, stepCenterY, 0, sx, stepH, sz));
      }

      // --- CHIẾU NGHỈ (Landing): ở đầu xa hành lang (y: 1.9 m) ---
      const landingCenterDist = 12 * TREAD + LANDING_DEPTH / 2; // 3.36 + 0.65 = 4.01 m
      const landingMainCoord = st.corridorEdge + st.dir * landingCenterDist;
      const landingCrossCoord = st.centerCross;

      const landingU = isV ? landingCrossCoord : landingMainCoord;
      const landingV = isV ? landingMainCoord : landingCrossCoord;

      const landingThickness = 0.16;
      const landingCenterY = 1.90 - landingThickness / 2; // 1.82 m (mặt trên đúng 1.90 m)
      const landingSx = isV ? LANDING_W : LANDING_DEPTH;
      const landingSz = isV ? LANDING_DEPTH : LANDING_W;
      landingMatrices.push(
        createInstanceMatrix(toWorld, landingU, landingV, landingCenterY, 0, landingSx, landingThickness, landingSz)
      );

      // --- ĐOẠN 2 (Flight 2): 12 bậc quay ngược về hành lang lên sàn tầng trên (y: 1.9 -> 3.8 m) ---
      // Đoạn 2 nằm ở nhánh bên trái khi nhìn từ hành lang vào
      const crossOffsetF2 = -(GAP / 2 + FLIGHT_W / 2); // -0.75 m

      for (let j = 0; j < 12; j++) {
        // Bắt đầu từ mép chiếu nghỉ (dist = 3.36 m) quay ngược về 0
        const distAlong = 12 * TREAD - (j + 0.5) * TREAD;
        const mainCoord = st.corridorEdge + st.dir * distAlong;
        const crossCoord = st.centerCross + crossOffsetF2;

        const u = isV ? crossCoord : mainCoord;
        const v = isV ? mainCoord : crossCoord;

        const stepCenterY = (12 + j + 0.5) * RISE;
        const sx = isV ? FLIGHT_W : TREAD;
        const sz = isV ? TREAD : FLIGHT_W;
        stepMatrices.push(createInstanceMatrix(toWorld, u, v, stepCenterY, 0, sx, RISE, sz));
      }

      // --- LAN CAN THANG INOX (Railings & Posts) ---
      // Các trụ đứng inox (0.04 x 0.04 m, cao 0.9 m)
      const postLocations = [
        // Chân thang Đoạn 1 (gần hành lang)
        { dist: 0.14, cross: crossOffsetF1 + FLIGHT_W / 2, baseY: 0 },
        { dist: 0.14, cross: crossOffsetF1 - FLIGHT_W / 2, baseY: 0 },
        // Giữa Đoạn 1
        { dist: 1.82, cross: crossOffsetF1 + FLIGHT_W / 2, baseY: 6 * RISE },
        { dist: 1.82, cross: crossOffsetF1 - FLIGHT_W / 2, baseY: 6 * RISE },
        // Mép chiếu nghỉ phía Đoạn 1
        { dist: 3.36, cross: crossOffsetF1 + FLIGHT_W / 2, baseY: 1.90 },
        { dist: 3.36, cross: crossOffsetF1 - FLIGHT_W / 2, baseY: 1.90 },
        // Lưng chiếu nghỉ (4 trụ)
        { dist: 4.66, cross: +LANDING_W / 2, baseY: 1.90 },
        { dist: 4.66, cross: +0.4, baseY: 1.90 },
        { dist: 4.66, cross: -0.4, baseY: 1.90 },
        { dist: 4.66, cross: -LANDING_W / 2, baseY: 1.90 },
        // Mép chiếu nghỉ phía Đoạn 2
        { dist: 3.36, cross: crossOffsetF2 + FLIGHT_W / 2, baseY: 1.90 },
        { dist: 3.36, cross: crossOffsetF2 - FLIGHT_W / 2, baseY: 1.90 },
        // Giữa Đoạn 2
        { dist: 1.82, cross: crossOffsetF2 + FLIGHT_W / 2, baseY: 18 * RISE },
        { dist: 1.82, cross: crossOffsetF2 - FLIGHT_W / 2, baseY: 18 * RISE },
        // Đỉnh thang Đoạn 2 (gần hành lang)
        { dist: 0.14, cross: crossOffsetF2 + FLIGHT_W / 2, baseY: 3.80 },
        { dist: 0.14, cross: crossOffsetF2 - FLIGHT_W / 2, baseY: 3.80 },
      ];

      for (const p of postLocations) {
        const mCoord = st.corridorEdge + st.dir * p.dist;
        const cCoord = st.centerCross + p.cross;
        const pu = isV ? cCoord : mCoord;
        const pv = isV ? mCoord : cCoord;
        railMatrices.push(
          createInstanceMatrix(toWorld, pu, pv, p.baseY + 0.45, 0, 0.04, 0.9, 0.04)
        );
      }

      // Thanh tay vịn ngang lưng chiếu nghỉ
      const backRailMCoord = st.corridorEdge + st.dir * 4.66;
      const backRailCCoord = st.centerCross;
      const backU = isV ? backRailCCoord : backRailMCoord;
      const backV = isV ? backRailMCoord : backRailCCoord;
      const backSx = isV ? LANDING_W : 0.04;
      const backSz = isV ? 0.04 : LANDING_W;
      railMatrices.push(
        createInstanceMatrix(toWorld, backU, backV, 1.90 + 0.9, 0, backSx, 0.04, backSz)
      );

      // Thanh tay vịn 2 bên hông chiếu nghỉ
      const sideDist = 3.36 + LANDING_DEPTH / 2;
      const sideMCoord = st.corridorEdge + st.dir * sideDist;
      for (const sideSign of [-1, 1]) {
        const sideCCoord = st.centerCross + sideSign * (LANDING_W / 2);
        const su = isV ? sideCCoord : sideMCoord;
        const sv = isV ? sideMCoord : sideCCoord;
        const ssx = isV ? 0.04 : LANDING_DEPTH;
        const ssz = isV ? LANDING_DEPTH : 0.04;
        railMatrices.push(
          createInstanceMatrix(toWorld, su, sv, 1.90 + 0.9, 0, ssx, 0.04, ssz)
        );
      }

      // Thanh tay vịn dốc cho Đoạn 1 & Đoạn 2 (thể hiện bằng 6 phân đoạn tay vịn liên tục)
      for (let s = 0; s < 6; s++) {
        const segDist1 = (s * 2 + 1) * TREAD;
        const segY1 = (s * 2 + 1) * RISE + 0.9;
        const segM1 = st.corridorEdge + st.dir * segDist1;
        // Tay vịn ngoài & trong Đoạn 1
        for (const sign of [-1, 1]) {
          const segC1 = st.centerCross + crossOffsetF1 + sign * (FLIGHT_W / 2);
          const su1 = isV ? segC1 : segM1;
          const sv1 = isV ? segM1 : segC1;
          railMatrices.push(
            createInstanceMatrix(toWorld, su1, sv1, segY1, 0, isV ? 0.04 : TREAD * 2, 0.04, isV ? TREAD * 2 : 0.04)
          );
        }

        // Tay vịn ngoài & trong Đoạn 2
        const segDist2 = 12 * TREAD - (s * 2 + 1) * TREAD;
        const segY2 = (12 + s * 2 + 1) * RISE + 0.9;
        const segM2 = st.corridorEdge + st.dir * segDist2;
        for (const sign of [-1, 1]) {
          const segC2 = st.centerCross + crossOffsetF2 + sign * (FLIGHT_W / 2);
          const su2 = isV ? segC2 : segM2;
          const sv2 = isV ? segM2 : segC2;
          railMatrices.push(
            createInstanceMatrix(toWorld, su2, sv2, segY2, 0, isV ? 0.04 : TREAD * 2, 0.04, isV ? TREAD * 2 : 0.04)
          );
        }
      }
    }

    return { stepMatrices, landingMatrices, railMatrices };
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

      {/* 2. Bàn học sinh / sinh viên (Bàn đôi 1.2 x 0.5 m) */}
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

      {/* 3. Ghế sinh viên & giáo viên */}
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

      {/* 4. Bàn giáo viên (1.4 x 0.7 m) */}
      {teacherDeskMatrices.length > 0 && (
        <instancedMesh
          args={[boxGeo, undefined, teacherDeskMatrices.length]}
          castShadow
          receiveShadow
          onUpdate={(self) => {
            teacherDeskMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#b45309" roughness={0.5} />
        </instancedMesh>
      )}

      {/* 5. Bảng từ (3.5 x 1.2 m) */}
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

      {/* 6. Lan can inox sân trong (tầng 2-4) */}
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

      {/* 7. Viền sàn xanh dương (tầng 2-4) */}
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

      {/* 8. Lam che nắng (tầng 2-4) */}
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

      {/* 9. Sân trong — Vườn mở (lối lát gạch, bồn cây bê tông + cỏ xanh, cây lớn) */}
      {courtyardGarden.tileWalkwayMatrices.length > 0 && (
        <instancedMesh
          args={[boxGeo, undefined, courtyardGarden.tileWalkwayMatrices.length]}
          receiveShadow
          onUpdate={(self) => {
            courtyardGarden.tileWalkwayMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#c9c4bb" roughness={0.7} />
        </instancedMesh>
      )}
      {courtyardGarden.planterRimMatrices.length > 0 && (
        <instancedMesh
          args={[boxGeo, undefined, courtyardGarden.planterRimMatrices.length]}
          castShadow
          receiveShadow
          onUpdate={(self) => {
            courtyardGarden.planterRimMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
        </instancedMesh>
      )}
      {courtyardGarden.planterSoilMatrices.length > 0 && (
        <instancedMesh
          args={[boxGeo, undefined, courtyardGarden.planterSoilMatrices.length]}
          receiveShadow
          onUpdate={(self) => {
            courtyardGarden.planterSoilMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#6f9a5b" roughness={0.8} />
        </instancedMesh>
      )}
      {courtyardGarden.treeTrunkMatrices.length > 0 && (
        <instancedMesh
          args={[cylinderGeo, undefined, courtyardGarden.treeTrunkMatrices.length]}
          castShadow
          receiveShadow
          onUpdate={(self) => {
            courtyardGarden.treeTrunkMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#5c3d2e" roughness={0.9} />
        </instancedMesh>
      )}
      {courtyardGarden.treeFoliageMatrices.length > 0 && (
        <instancedMesh
          args={[cylinderGeo, undefined, courtyardGarden.treeFoliageMatrices.length]}
          castShadow
          receiveShadow
          onUpdate={(self) => {
            courtyardGarden.treeFoliageMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#2d6a4f" roughness={0.8} />
        </instancedMesh>
      )}

      {/* 10. Cầu thang bộ gấp 2 đoạn */}
      {stairData.stepMatrices.length > 0 && (
        <instancedMesh
          args={[boxGeo, undefined, stairData.stepMatrices.length]}
          castShadow
          receiveShadow
          onUpdate={(self) => {
            stairData.stepMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#8c929c" roughness={0.8} />
        </instancedMesh>
      )}
      {stairData.landingMatrices.length > 0 && (
        <instancedMesh
          args={[boxGeo, undefined, stairData.landingMatrices.length]}
          castShadow
          receiveShadow
          onUpdate={(self) => {
            stairData.landingMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#8c929c" roughness={0.8} />
        </instancedMesh>
      )}
      {stairData.railMatrices.length > 0 && (
        <instancedMesh
          args={[boxGeo, undefined, stairData.railMatrices.length]}
          castShadow
          receiveShadow
          onUpdate={(self) => {
            stairData.railMatrices.forEach((m, i) => self.setMatrixAt(i, m));
            self.instanceMatrix.needsUpdate = true;
          }}
        >
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
        </instancedMesh>
      )}

      {/* 11. Buồng thang máy duy nhất của B8 (ở nhịp giữa) */}
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
