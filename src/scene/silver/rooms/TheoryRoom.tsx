import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  BoxGeometry,
  type BufferGeometry,
  type InstancedMesh,
  type Matrix4,
} from 'three';
import type { Classroom } from '../../../types';
import { createInstanceMatrix } from '../../interior/InteriorFurniture';
import { toWorld } from '../../interior/layouts/b8';
import { makeTheoryChairGeometry, makeTheoryDeskGeometry } from './theoryGeometries';

export interface TheoryRoomProps {
  room: Classroom;
}

interface InstancedBatchProps {
  matrices: readonly Matrix4[];
  geometry: BufferGeometry;
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
 * - Bàn học sinh (mặt bàn mỏng + 4 chân + tấm chắn), ghế tựa (mặt ngồi 0.45m), bàn GV, bảng trắng, khung TV.
 * - Mỗi loại đúng 1 instancedMesh (tổng cộng 5 draw calls <= 10).
 * - Bàn ghế sinh trực tiếp từ dữ liệu room trong classrooms.json.
 * - Hướng ghế học sinh quay tự động theo room.studentFacing.
 * - Khung TV lùi sâu vào tường (mặt trước lùi sau màn >= 5 mm) để không che ProjectorScreen.
 * - Toàn bộ geometry tự tạo được dispose sạch khi unmount.
 */
export default function TheoryRoom({ room }: TheoryRoomProps) {
  // 1. Geometries
  const chairGeom = useMemo(() => makeTheoryChairGeometry(), []);
  const deskGeom = useMemo(
    () => makeTheoryDeskGeometry(room.desk.depth, room.desk.height, room.desk.width, 'front'),
    [room.desk.depth, room.desk.height, room.desk.width],
  );
  const teacherDeskGeom = useMemo(
    () => makeTheoryDeskGeometry(room.teacherDesk.depth, room.teacherDesk.height, room.teacherDesk.width, 'back'),
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

    // Hướng quay ghế học sinh theo room.studentFacing (không viết cứng Math.PI)
    const studentChairRotY = Math.atan2(room.studentFacing[1], room.studentFacing[0]);

    // Bàn và ghế học sinh
    for (const seat of room.seats) {
      desks.push(
        createInstanceMatrix(toWorld, seat.deskU, seat.v, 0, 0, 1, 1, 1),
      );
      chairs.push(
        createInstanceMatrix(toWorld, seat.u, seat.v, 0, studentChairRotY, 1, 1, 1),
      );
    }

    // Bàn giáo viên
    const teacherDesks: Matrix4[] = [
      createInstanceMatrix(
        toWorld,
        room.teacherDesk.u,
        room.teacherDesk.v,
        0,
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

    // Khung TV bao quanh màn ProjectorScreen:
    // Đẩy lùi vào tường 0.016 m theo hướng projectorScreen.facing để mặt trước khung
    // thụt sau mặt màn chiếu 6 mm (>= 5 mm), không che ProjectorScreen.
    const tvFrames: Matrix4[] = [
      createInstanceMatrix(
        toWorld,
        room.projectorScreen.u - room.projectorScreen.facing[0] * 0.016,
        room.projectorScreen.v - room.projectorScreen.facing[1] * 0.016,
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
      {/* 1. Bàn học sinh (InstancedMesh: #d4a373, mặt bàn mỏng + chân rỗng + tấm chắn) */}
      <InstancedBatch
        matrices={deskMatrices}
        geometry={deskGeom}
        color="#d4a373"
        roughness={0.6}
        metalness={0.05}
      />

      {/* 2. Ghế học sinh (InstancedMesh: #334155, mặt ngồi cao 0.45m, có tựa lưng) */}
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
