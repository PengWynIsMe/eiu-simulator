import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  BoxGeometry,
  CylinderGeometry,
  type InstancedMesh,
  type Matrix4,
} from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Classroom } from '../../../types';
import { createInstanceMatrix } from '../../interior/InteriorFurniture';
import { toWorld } from '../../interior/layouts/b8';

export interface TheoryRoomProps {
  room: Classroom;
}

/**
 * Tạo hình học ghế học sinh / giáo viên chuẩn:
 * - Mặt ngồi tại độ cao chuẩn 0.45 m (kích thước 0.42 x 0.025 x 0.42 m).
 * - 4 chân kim loại vững chãi từ mặt đất lên mặt ngồi.
 * - Tựa lưng bản rộng (0.40 x 0.26 x 0.025 m) tại tầm lưng người ngồi (y = 0.73 m).
 * - 2 thanh ống đỡ tựa lưng từ chân sau.
 * Ghế tạo sẵn hướng nhìn về +u, xoay yaw = Math.PI để quay về phía -u (hướng nhìn bảng B8).
 */
export function makeTheoryChairGeometry() {
  const h = 0.45;
  const seatThick = 0.025;
  const legR = 0.012;
  const legH = h - seatThick;
  const backPostH = 0.38;

  const part = (sx: number, sy: number, sz: number, px: number, py: number, pz: number) => {
    const b = new BoxGeometry(sx, sy, sz);
    b.translate(px, py, pz);
    return b;
  };

  const makeLeg = (x: number, z: number) => {
    const leg = new CylinderGeometry(legR, legR, legH, 8);
    leg.translate(x, legH / 2, z);
    return leg;
  };

  const makeBackPost = (x: number, z: number) => {
    const p = new CylinderGeometry(legR, legR, backPostH, 8);
    p.translate(x, h + backPostH / 2 - 0.04, z);
    return p;
  };

  const parts = [
    // Mặt ngồi gỗ / đệm (0.42 x 0.025 x 0.42) tại y = 0.45 m
    part(0.42, seatThick, 0.42, 0, h - seatThick / 2, 0),
    // Tựa lưng (0.025 x 0.26 x 0.40) tại x = -0.19 m
    part(0.025, 0.26, 0.4, -0.19, h + 0.28, 0),
    // 4 chân
    makeLeg(0.16, 0.16),
    makeLeg(0.16, -0.16),
    makeLeg(-0.16, 0.16),
    makeLeg(-0.16, -0.16),
    // 2 ống kim loại đỡ lưng
    makeBackPost(-0.18, 0.14),
    makeBackPost(-0.18, -0.14),
  ];

  const merged = BufferGeometryUtils.mergeGeometries(parts, false);
  for (const p of parts) {
    p.dispose();
  }
  return merged;
}

interface InstancedBatchProps {
  matrices: readonly Matrix4[];
  geometry: BoxGeometry | ReturnType<typeof makeTheoryChairGeometry>;
  color: string;
  roughness?: number;
  metalness?: number;
}

function InstancedBatch({
  matrices,
  geometry,
  color,
  roughness = 0.6,
  metalness = 0,
}: InstancedBatchProps) {
  const meshRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || matrices.length === 0) return;
    for (let i = 0; i < matrices.length; i++) {
      const m = matrices[i];
      if (m) mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices]);

  if (matrices.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, matrices.length]}>
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </instancedMesh>
  );
}

/**
 * Phòng lý thuyết 3D (206, 207, 311.B8):
 * - Bàn học sinh, ghế, bàn GV, bảng trắng, khung TV.
 * - Mỗi loại đúng 1 instancedMesh (tổng cộng 5 draw calls <= 10).
 * - Bàn ghế sinh trực tiếp từ dữ liệu room trong classrooms.json.
 * - Toàn bộ geometry tự tạo được dispose sạch khi unmount.
 */
export default function TheoryRoom({ room }: TheoryRoomProps) {
  // 1. Geometries
  const chairGeom = useMemo(() => makeTheoryChairGeometry(), []);
  const deskGeom = useMemo(
    () => new BoxGeometry(room.desk.depth, room.desk.height, room.desk.width),
    [room.desk.depth, room.desk.height, room.desk.width],
  );
  const teacherDeskGeom = useMemo(
    () => new BoxGeometry(room.teacherDesk.depth, room.teacherDesk.height, room.teacherDesk.width),
    [room.teacherDesk.depth, room.teacherDesk.height, room.teacherDesk.width],
  );
  const whiteboardGeom = useMemo(
    () => new BoxGeometry(0.02, room.whiteboard.height, room.whiteboard.width),
    [room.whiteboard.height, room.whiteboard.width],
  );
  const tvFrameGeom = useMemo(
    () => new BoxGeometry(0.05, room.projectorScreen.height + 0.1, room.projectorScreen.width + 0.1),
    [room.projectorScreen.height, room.projectorScreen.width],
  );

  useEffect(() => {
    return () => {
      chairGeom.dispose();
      deskGeom.dispose();
      teacherDeskGeom.dispose();
      whiteboardGeom.dispose();
      tvFrameGeom.dispose();
    };
  }, [chairGeom, deskGeom, teacherDeskGeom, whiteboardGeom, tvFrameGeom]);

  // 2. Matrices calculation
  const { deskMatrices, chairMatrices, teacherDeskMatrices, whiteboardMatrices, tvFrameMatrices } = useMemo(() => {
    const desks: Matrix4[] = [];
    const chairs: Matrix4[] = [];

    // Bàn và ghế học sinh
    for (const seat of room.seats) {
      desks.push(
        createInstanceMatrix(toWorld, seat.deskU, seat.v, room.desk.height / 2, 0, 1, 1, 1),
      );
      // Ghế học sinh xoay Math.PI để quay mặt về phía bảng (-u)
      chairs.push(
        createInstanceMatrix(toWorld, seat.u, seat.v, 0, Math.PI, 1, 1, 1),
      );
    }

    // Ghế giáo viên (quay mặt về phía học sinh, rotY = 0)
    chairs.push(
      createInstanceMatrix(toWorld, room.teacherSpots.desk.u, room.teacherSpots.desk.v, 0, 0, 1, 1, 1),
    );

    // Bàn giáo viên
    const teacherDesks: Matrix4[] = [
      createInstanceMatrix(
        toWorld,
        room.teacherDesk.u,
        room.teacherDesk.v,
        room.teacherDesk.height / 2,
        0,
        1,
        1,
        1,
      ),
    ];

    // Bảng trắng
    const whiteboards: Matrix4[] = [
      createInstanceMatrix(
        toWorld,
        room.whiteboard.u,
        room.whiteboard.v,
        room.whiteboard.bottom + room.whiteboard.height / 2,
        0,
        1,
        1,
        1,
      ),
    ];

    // Khung TV bao quanh màn ProjectorScreen
    const tvFrames: Matrix4[] = [
      createInstanceMatrix(
        toWorld,
        room.projectorScreen.u,
        room.projectorScreen.v,
        room.projectorScreen.bottom + room.projectorScreen.height / 2,
        0,
        1,
        1,
        1,
      ),
    ];

    return {
      deskMatrices: desks,
      chairMatrices: chairs,
      teacherDeskMatrices: teacherDesks,
      whiteboardMatrices: whiteboards,
      tvFrameMatrices: tvFrames,
    };
  }, [room]);

  return (
    <group>
      {/* 1. Bàn học sinh (InstancedMesh: #d4a373) */}
      <InstancedBatch
        matrices={deskMatrices}
        geometry={deskGeom}
        color="#d4a373"
        roughness={0.6}
        metalness={0.05}
      />

      {/* 2. Ghế học sinh + ghế GV (InstancedMesh: #334155, mặt ngồi cao 0.45m, có tựa lưng) */}
      <InstancedBatch
        matrices={chairMatrices}
        geometry={chairGeom}
        color="#334155"
        roughness={0.6}
        metalness={0.08}
      />

      {/* 3. Bàn giáo viên (InstancedMesh: #d4a373) */}
      <InstancedBatch
        matrices={teacherDeskMatrices}
        geometry={teacherDeskGeom}
        color="#d4a373"
        roughness={0.6}
        metalness={0.05}
      />

      {/* 4. Bảng trắng (InstancedMesh: #ffffff) */}
      <InstancedBatch
        matrices={whiteboardMatrices}
        geometry={whiteboardGeom}
        color="#ffffff"
        roughness={0.3}
        metalness={0.05}
      />

      {/* 5. Khung viền TV đen bao quanh (InstancedMesh: #1e293b) */}
      <InstancedBatch
        matrices={tvFrameMatrices}
        geometry={tvFrameGeom}
        color="#1e293b"
        roughness={0.5}
        metalness={0.1}
      />
    </group>
  );
}
