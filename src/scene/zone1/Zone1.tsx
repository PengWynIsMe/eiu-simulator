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

  // 3. Đoạn hành lang mái che nối hông Block 11 ↔ đầu Block 4 (campus_16–20)
  const walkwayB11B4 = useMemo(() => {
    // Nối từ hông B11 [43, -132] tới đầu B4 [92, -96]
    const p1x = 43;
    const p1z = -132;
    const p2x = 92;
    const p2z = -96;
    const dx = p2x - p1x;
    const dz = p2z - p1z;
    const len = Math.hypot(dx, dz);
    const angle = Math.atan2(dz, dx);
    const midX = (p1x + p2x) / 2;
    const midZ = (p1z + p2z) / 2;

    const roofH = 3.0;
    const roofW = 2.6;

    // Mái che phủ lá xanh
    const roof = new BoxGeometry(len, 0.2, roofW);
    roof.rotateY(-angle);
    roof.translate(midX, roofH, midZ);

    // Cột đỡ
    const posts: BufferGeometry[] = [roof];
    const numPosts = Math.floor(len / 4.5);
    const nx = -dz / len;
    const nz = dx / len;

    for (let i = 0; i <= numPosts; i++) {
      const t = i / numPosts - 0.5;
      const px = midX + Math.cos(angle) * (t * len);
      const pz = midZ + Math.sin(angle) * (t * len);

      const post1 = new BoxGeometry(0.12, roofH, 0.12);
      post1.translate(px + nx * (roofW / 2), roofH / 2, pz + nz * (roofW / 2));
      posts.push(post1);

      const post2 = new BoxGeometry(0.12, roofH, 0.12);
      post2.translate(px - nx * (roofW / 2), roofH / 2, pz - nz * (roofW / 2));
      posts.push(post2);
    }

    const merged = BufferGeometryUtils.mergeGeometries(posts);
    posts.forEach((p) => p.dispose());
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

      {/* Hành lang mái che nối B11 ↔ B4 */}
      {walkwayB11B4 && (
        <mesh geometry={walkwayB11B4} castShadow receiveShadow>
          <meshStandardMaterial color="#365314" roughness={0.75} />
        </mesh>
      )}
    </group>
  );
}
