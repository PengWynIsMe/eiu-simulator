import { useMemo } from 'react';
import { MEDIAN_BASE, MEDIAN_HEIGHT, MEDIAN_PLANTERS } from './medianLayout';
import { BoxGeometry, CylinderGeometry, BufferGeometry } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import Pond from './Pond';
import Bridges from './Bridges';
import PondTerraces from './PondTerraces';

export default function Zone1() {
  // 1. Cột cờ trên thềm quảng trường tròn (campus_14)
  const { flagpolesGeo, flagsGeo } = useMemo(() => {
    const poles: BufferGeometry[] = [];
    const flags: BufferGeometry[] = [];

    const numFlags = 7;
    const startX = 66;
    const startZ = -18;
    const endZ = 12;
    const poleH = 9.0;

    for (let i = 0; i < numFlags; i++) {
      const t = i / (numFlags - 1);
      const z = startZ + (endZ - startZ) * t;
      // Uốn nhẹ theo cung tròn của quảng trường
      const x = startX - Math.sin(t * Math.PI) * 2.5;

      // Cột inox
      const pole = new CylinderGeometry(0.06, 0.08, poleH, 8);
      pole.translate(x, 0.3 + poleH / 2, z);
      poles.push(pole);

      // Lá cờ đỏ
      const flag = new BoxGeometry(1.6, 1.0, 0.04);
      flag.translate(x + 0.8, 0.3 + poleH - 0.7, z);
      flags.push(flag);
    }

    const mergedPoles = BufferGeometryUtils.mergeGeometries(poles);
    const mergedFlags = BufferGeometryUtils.mergeGeometries(flags);

    poles.forEach((p) => p.dispose());
    flags.forEach((f) => f.dispose());

    return { flagpolesGeo: mergedPoles, flagsGeo: mergedFlags };
  }, []);

  // 2. Bồn cây dải phân cách giữa các làn đường vào từ cổng chính (campus, ve-tinh-khu-cong-2026)
  const medianPlantersGeo = useMemo(() => {
    const planters: BufferGeometry[] = [];
    MEDIAN_PLANTERS.forEach((m) => {
      const box = new BoxGeometry(m.w, MEDIAN_HEIGHT, m.d);
      box.translate(m.x, MEDIAN_BASE + MEDIAN_HEIGHT / 2, m.z);
      planters.push(box);
    });

    const merged = BufferGeometryUtils.mergeGeometries(planters);
    planters.forEach((p) => p.dispose());
    return merged;
  }, []);

  return (
    <group>
      {/* 3 hồ nước bậc thang */}
      <Pond />
      <PondTerraces />

      {/* 2 cầu mái tôn xanh nối Block 4 ↔ Block 3 */}
      <Bridges />

      {/* Hàng cột cờ trên quảng trường tròn */}
      {flagpolesGeo && (
        <mesh geometry={flagpolesGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
        </mesh>
      )}
      {flagsGeo && (
        <mesh geometry={flagsGeo} castShadow>
          <meshStandardMaterial color="#dc2626" roughness={0.6} />
        </mesh>
      )}

      {/* Bồn cây dải phân cách làn đường vào */}
      {medianPlantersGeo && (
        <mesh geometry={medianPlantersGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
      )}
    </group>
  );
}
