import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { BoxGeometry, type InstancedMesh, type Matrix4 } from 'three';
import { createInstanceMatrix } from '../../interior/InteriorFurniture';
import { toWorld } from '../../interior/layouts/b8';
import { makeTheoryChairGeometry } from './TheoryRoom';

/**
 * Phòng thi vấn đáp 208.B8 (nói 1-1 theo PLAN-3D mục 3):
 * - 1 bàn phỏng vấn (77.2; -205.1), kích thước 0.7 m (u) x 1.2 m (v) x 0.75 m (cao).
 * - 2 ghế chính: Giám khảo (76.4; -205.1) nhìn +u; Người chơi (77.95; -205.1) nhìn -u.
 * - 3 ghế chờ dọc tường (v = -201.2) tại u = 79.5, 80.2, 80.9.
 * - Không có TV, không bảng, không bạn học nền.
 * - Màu sắc: bàn #d4a373, ghế #334155.
 */
export default function Room208() {
  const chairGeom = useMemo(() => makeTheoryChairGeometry(), []);
  const deskGeom = useMemo(() => new BoxGeometry(0.7, 0.75, 1.2), []);

  useEffect(() => {
    return () => {
      chairGeom.dispose();
      deskGeom.dispose();
    };
  }, [chairGeom, deskGeom]);

  const { deskMatrices, chairMatrices } = useMemo(() => {
    // 1 bàn phỏng vấn
    const desks: Matrix4[] = [
      createInstanceMatrix(toWorld, 77.2, -205.1, 0.375, 0, 1, 1, 1),
    ];

    // 5 ghế: giám khảo, người chơi, 3 ghế chờ
    const chairs: Matrix4[] = [
      // Giám khảo (nhìn +u, rotY = 0)
      createInstanceMatrix(toWorld, 76.4, -205.1, 0, 0, 1, 1, 1),
      // Người chơi (nhìn -u, rotY = Math.PI)
      createInstanceMatrix(toWorld, 77.95, -205.1, 0, Math.PI, 1, 1, 1),
      // 3 ghế chờ đặt sát tường Bắc, nhìn vào trong phòng (hướng -v, rotY = -Math.PI / 2)
      createInstanceMatrix(toWorld, 79.5, -201.2, 0, -Math.PI / 2, 1, 1, 1),
      createInstanceMatrix(toWorld, 80.2, -201.2, 0, -Math.PI / 2, 1, 1, 1),
      createInstanceMatrix(toWorld, 80.9, -201.2, 0, -Math.PI / 2, 1, 1, 1),
    ];

    return { deskMatrices: desks, chairMatrices: chairs };
  }, []);

  const deskRef = useRef<InstancedMesh>(null);
  const chairRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const deskMesh = deskRef.current;
    if (deskMesh) {
      for (let i = 0; i < deskMatrices.length; i++) {
        const m = deskMatrices[i];
        if (m) deskMesh.setMatrixAt(i, m);
      }
      deskMesh.instanceMatrix.needsUpdate = true;
      deskMesh.computeBoundingSphere();
    }
    const chairMesh = chairRef.current;
    if (chairMesh) {
      for (let i = 0; i < chairMatrices.length; i++) {
        const m = chairMatrices[i];
        if (m) chairMesh.setMatrixAt(i, m);
      }
      chairMesh.instanceMatrix.needsUpdate = true;
      chairMesh.computeBoundingSphere();
    }
  }, [deskMatrices, chairMatrices]);

  return (
    <group>
      {/* Bàn phỏng vấn */}
      <instancedMesh ref={deskRef} args={[deskGeom, undefined, deskMatrices.length]}>
        <meshStandardMaterial color="#d4a373" roughness={0.6} metalness={0.05} />
      </instancedMesh>

      {/* 5 ghế (ghế phỏng vấn + ghế chờ) */}
      <instancedMesh ref={chairRef} args={[chairGeom, undefined, chairMatrices.length]}>
        <meshStandardMaterial color="#334155" roughness={0.6} metalness={0.08} />
      </instancedMesh>
    </group>
  );
}
