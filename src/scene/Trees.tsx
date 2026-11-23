import { useMemo, useLayoutEffect, useRef } from 'react';
import {
  CylinderGeometry,
  IcosahedronGeometry,
  MeshStandardMaterial,
  Object3D,
  Color,
  type InstancedMesh,
} from 'three';
import { campus } from '../data';
import type { Vec2 } from '../types';
import { isPointInPond } from './zone1/pondLayout';
import { applyWind } from './nature/wind';
import { useSnowStore } from '../store/useSnowStore';

/** Bộ sinh số giả ngẫu nhiên Mulberry32 với hạt giống cố định để vị trí không đổi mỗi lần render. */
function createPrng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Kiểm tra điểm [x, z] có nằm trong đa giác hay không (Ray casting). */
function isPointInPolygon(pt: Vec2, poly: Vec2[]): boolean {
  let inside = false;
  const [x, z] = pt;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const p1 = poly[i];
    const p2 = poly[j];
    if (!p1 || !p2) continue;
    const xi = p1[0];
    const zi = p1[1];
    const xj = p2[0];
    const zj = p2[1];
    const intersect = zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Khoảng cách từ điểm pt tới đoạn thẳng [p1, p2]. */
function distToSegment(pt: Vec2, p1: Vec2, p2: Vec2): number {
  const [x, z] = pt;
  const [x1, z1] = p1;
  const [x2, z2] = p2;
  const dx = x2 - x1;
  const dz = z2 - z1;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < 1e-6) return Math.hypot(x - x1, z - z1);

  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (z - z1) * dz) / lenSq));
  const projX = x1 + t * dx;
  const projZ = z1 + t * dz;
  return Math.hypot(x - projX, z - projZ);
}

interface TreeInstanceData {
  x: number;
  z: number;
  rotY: number;
  scaleXZ: number;
  scaleY: number;
  color: string;
}

const LARGE_TREE_COLORS = ['#38632a', '#447532', '#50853b', '#335b24', '#487d37'];
const STREET_TREE_COLORS = ['#2e5320', '#3b6628', '#497732', '#284719', '#3f6a27'];
const SHRUB_COLORS = ['#4d8232', '#5c993d', '#3f6d28', '#68a844', '#345e22'];

export default function Trees() {
  const { layout, buildings } = campus;

  const { largeTrees, streetTrees, shrubTrees } = useMemo(() => {
    const rng = createPrng(20261123);
    const large: TreeInstanceData[] = [];
    const street: TreeInstanceData[] = [];
    const shrubs: TreeInstanceData[] = [];

    // Kiểm tra không chạm hoặc xâm lấn vào bất kỳ tòa nhà nào
    const isTooCloseToBuilding = (pt: Vec2, minMargin: number): boolean => {
      for (const b of buildings) {
        if (isPointInPolygon(pt, b.shape.outer)) return true;
        const outer = b.shape.outer;
        for (let i = 0; i < outer.length; i++) {
          const p1 = outer[i];
          const p2 = outer[(i + 1) % outer.length];
          if (p1 && p2 && distToSegment(pt, p1, p2) < minMargin) return true;
        }
      }
      return false;
    };

    // Kiểm tra không đè vào lòng đường xe chạy hoặc bãi xe
    const isTooCloseToRoadOrParking = (pt: Vec2, margin: number): boolean => {
      for (const road of layout.roads) {
        let width = 7;
        if (road.kind === 'street') width = (road.lanes ?? 2) * 3.5;
        else if (road.kind === 'footway') width = 2.5;
        const safeDist = width / 2 + margin;

        for (let i = 0; i < road.points.length - 1; i++) {
          const p1 = road.points[i];
          const p2 = road.points[i + 1];
          if (p1 && p2 && distToSegment(pt, p1, p2) < safeDist) return true;
        }
      }

      // Vành lòng đường vòng xoay (bán kính 73m đến 86.5m)
      const dCenter = Math.hypot(pt[0], pt[1]);
      if (dCenter >= 73.0 - margin && dCenter <= 86.5 + margin) return true;

      // Lòng hồ nước
      if (isPointInPond(pt[0], pt[1], margin + 1.0)) return true;

      // Các bãi đỗ xe
      for (const p of layout.parking) {
        if (isPointInPolygon(pt, p)) return true;
        for (let i = 0; i < p.length; i++) {
          const p1 = p[i];
          const p2 = p[(i + 1) % p.length];
          if (p1 && p2 && distToSegment(pt, p1, p2) < margin) return true;
        }
      }
      return false;
    };

    // ----------------------------------------------------
    // 1. CÂY THÂN CAO HÀNG ĐƯỜNG (STREET TREES)
    // ----------------------------------------------------
    const addStreetTree = (pt: Vec2) => {
      if (!isPointInPolygon(pt, layout.boundary)) return;
      if (isTooCloseToBuilding(pt, 3.2)) return;
      if (isTooCloseToRoadOrParking(pt, 0.4)) return;

      // Khoảng cách tối thiểu giữa 2 cây hàng đường
      for (const t of street) {
        if (Math.hypot(pt[0] - t.x, pt[1] - t.z) < 6.8) return;
      }

      const rotY = rng() * Math.PI * 2;
      const scaleXZ = 0.88 + rng() * 0.28;
      const scaleY = 0.90 + rng() * 0.32;
      const color = STREET_TREE_COLORS[Math.floor(rng() * STREET_TREE_COLORS.length)] ?? '#3b6628';
      street.push({ x: pt[0], z: pt[1], rotY, scaleXZ, scaleY, color });
    };

    // Trồng hàng cây thẳng tắp hai bên các tuyến đường nội bộ & đường phố
    for (const road of layout.roads) {
      if (road.kind === 'bridge' || road.kind === 'footway') continue;
      let width = 7;
      if (road.kind === 'street') width = (road.lanes ?? 2) * 3.5;

      const offsetDist = width / 2 + 1.8; // Đứng trên vỉa hè / dải cỏ mép bó vỉa

      for (let i = 0; i < road.points.length - 1; i++) {
        const p1 = road.points[i];
        const p2 = road.points[i + 1];
        if (!p1 || !p2) continue;

        const dx = p2[0] - p1[0];
        const dz = p2[1] - p1[1];
        const len = Math.hypot(dx, dz);
        if (len < 6) continue;

        const nx = -dz / len;
        const nz = dx / len;
        const stepLen = road.kind === 'street' ? 14 : 10;
        const steps = Math.floor(len / stepLen);

        for (let s = 1; s <= steps; s++) {
          const t = s / (steps + 1);
          const px = p1[0] + dx * t;
          const pz = p1[1] + dz * t;

          addStreetTree([px + nx * offsetDist, pz + nz * offsetDist]);
          addStreetTree([px - nx * offsetDist, pz - nz * offsetDist]);
        }
      }
    }

    // Hàng cây cao phía sau dãy nhà xe máy Block 5 (thay thế cho cây nón cũ)
    const shedLen = 64;
    const shedAngle = 0.08;
    const shedMidX = 168.0;
    const shedMidZ = -118.0;
    for (let tz = -shedLen * 0.45; tz <= shedLen * 0.45; tz += 7.5) {
      const sx = shedMidX + Math.cos(shedAngle) * 5.2 - Math.sin(shedAngle) * tz;
      const sz = shedMidZ + Math.sin(shedAngle) * 5.2 + Math.cos(shedAngle) * tz;
      addStreetTree([sx, sz]);
    }

    // ----------------------------------------------------
    // 2. CÂY TÁN TRÒN LỚN (LARGE SHADE TREES)
    // ----------------------------------------------------
    const addLargeTree = (pt: Vec2) => {
      if (large.length >= 420) return;
      if (!isPointInPolygon(pt, layout.boundary)) return;
      if (isTooCloseToBuilding(pt, 5.0)) return;
      if (isTooCloseToRoadOrParking(pt, 2.5)) return;

      // Không đứng quá gần cây hàng đường hoặc cây lớn khác
      for (const t of street) {
        if (Math.hypot(pt[0] - t.x, pt[1] - t.z) < 6.5) return;
      }
      for (const t of large) {
        if (Math.hypot(pt[0] - t.x, pt[1] - t.z) < 8.2) return;
      }

      const rotY = rng() * Math.PI * 2;
      const scaleXZ = 0.85 + rng() * 0.35;
      const scaleY = 0.85 + rng() * 0.38;
      const color = LARGE_TREE_COLORS[Math.floor(rng() * LARGE_TREE_COLORS.length)] ?? '#447532';
      large.push({ x: pt[0], z: pt[1], rotY, scaleXZ, scaleY, color });
    };

    // Vành cây bóng mát quanh vòng xoay (trong bãi cỏ r=65m và ngoài vành đường r=91m)
    for (let step = 0; step < 42; step++) {
      const angle = (step / 42) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      addLargeTree([cosA * 91 + (rng() - 0.5) * 2, sinA * 91 + (rng() - 0.5) * 2]);
      addLargeTree([cosA * 65 + (rng() - 0.5) * 2, sinA * 65 + (rng() - 0.5) * 2]);
    }

    // Cây bóng mát viền theo ranh giới khuôn viên trường
    const boundary = layout.boundary;
    for (let i = 0; i < boundary.length; i++) {
      const p1 = boundary[i];
      const p2 = boundary[(i + 1) % boundary.length];
      if (!p1 || !p2) continue;

      const dx = p2[0] - p1[0];
      const dz = p2[1] - p1[1];
      const len = Math.hypot(dx, dz);
      const steps = Math.floor(len / 14);

      for (let s = 1; s <= steps; s++) {
        const t = s / (steps + 1);
        const px = p1[0] + dx * t + (rng() - 0.5) * 3;
        const pz = p1[1] + dz * t + (rng() - 0.5) * 3;
        addLargeTree([px, pz]);
      }
    }

    // Cây bóng mát trong các khu vườn và sân cỏ giữa các block
    const parkAreas: readonly [number, number, number][] = [
      [45, -75, 24],   // Sân vườn B8–B11
      [48, -140, 26],  // Sân vườn phía Tây B11
      [112, -42, 28],  // Sân cỏ B4–B3
      [-75, -135, 30], // Sân cỏ B9–B10
      [85, 20, 25],    // Bãi cỏ quanh hồ nước
      [-20, 20, 32],   // Sân cỏ quảng trường Tây Bắc
      [180, -45, 28],  // Sân cỏ cạnh cổng chính
    ];
    for (const [px, pz, r] of parkAreas) {
      for (let k = 0; k < 12; k++) {
        const ang = rng() * Math.PI * 2;
        const rad = Math.sqrt(rng()) * r;
        addLargeTree([px + Math.cos(ang) * rad, pz + Math.sin(ang) * rad]);
      }
    }

    // Điền đều vào các khoảng đất trống rộng toàn trường
    let attempts = 0;
    while (large.length < 380 && attempts < 1500) {
      attempts++;
      const candX = (rng() - 0.5) * 560;
      const candZ = (rng() - 0.5) * 560;
      addLargeTree([candX, candZ]);
    }

    // ----------------------------------------------------
    // 3. CÂY BỤI / CÂY CẢNH THẤP TẦNG (SHRUBS)
    // ----------------------------------------------------
    const addShrub = (pt: Vec2) => {
      if (shrubs.length >= 360) return;
      if (!isPointInPolygon(pt, layout.boundary)) return;
      if (isTooCloseToBuilding(pt, 1.2)) return;
      if (isTooCloseToRoadOrParking(pt, 0.2)) return;

      for (const s of shrubs) {
        if (Math.hypot(pt[0] - s.x, pt[1] - s.z) < 2.2) return;
      }

      const rotY = rng() * Math.PI * 2;
      const scaleXZ = 0.75 + rng() * 0.45;
      const scaleY = 0.70 + rng() * 0.40;
      const color = SHRUB_COLORS[Math.floor(rng() * SHRUB_COLORS.length)] ?? '#4d8232';
      shrubs.push({ x: pt[0], z: pt[1], rotY, scaleXZ, scaleY, color });
    };

    // Cây bụi mọc dọc các lối đi bộ (footway)
    for (const road of layout.roads) {
      if (road.kind !== 'footway') continue;
      for (let i = 0; i < road.points.length - 1; i++) {
        const p1 = road.points[i];
        const p2 = road.points[i + 1];
        if (!p1 || !p2) continue;

        const dx = p2[0] - p1[0];
        const dz = p2[1] - p1[1];
        const len = Math.hypot(dx, dz);
        if (len < 4) continue;

        const nx = -dz / len;
        const nz = dx / len;
        const steps = Math.floor(len / 6);

        for (let s = 1; s <= steps; s++) {
          const t = s / (steps + 1);
          const px = p1[0] + dx * t;
          const pz = p1[1] + dz * t;
          for (const side of [-1, 1]) {
            if (rng() > 0.35) {
              addShrub([px + nx * (1.8 * side) + (rng() - 0.5) * 0.5, pz + nz * (1.8 * side) + (rng() - 0.5) * 0.5]);
            }
          }
        }
      }
    }

    // Cây bụi điểm xuyết quanh chân đế các tòa nhà
    for (const b of buildings) {
      const outer = b.shape.outer;
      for (let i = 0; i < outer.length; i++) {
        const p1 = outer[i];
        const p2 = outer[(i + 1) % outer.length];
        if (!p1 || !p2) continue;

        const dx = p2[0] - p1[0];
        const dz = p2[1] - p1[1];
        const len = Math.hypot(dx, dz);
        if (len < 6) continue;

        const nx = -dz / len;
        const nz = dx / len;
        const steps = Math.floor(len / 8);

        for (let s = 1; s <= steps; s++) {
          if (rng() > 0.4) {
            const t = s / (steps + 1);
            const px = p1[0] + dx * t + nx * 2.0;
            const pz = p1[1] + dz * t + nz * 2.0;
            addShrub([px, pz]);
          }
        }
      }
    }

    // Cây bụi trong bãi cỏ vòng xoay trung tâm
    for (let step = 0; step < 28; step++) {
      const angle = (step / 28) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      addShrub([cosA * 54 + (rng() - 0.5) * 3, sinA * 54 + (rng() - 0.5) * 3]);
    }

    return { largeTrees: large, streetTrees: street, shrubTrees: shrubs };
  }, [layout, buildings]);

  // ------------------------------------------------------------------
  // GEOMETRY & MATERIALS
  // ------------------------------------------------------------------

  // 1. Thân cây bóng mát lớn: trụ 6 cạnh cao 4.2m, đường kính 0.7–1.1m
  const largeTrunkGeo = useMemo(() => {
    const g = new CylinderGeometry(0.35, 0.55, 4.2, 6);
    g.translate(0, 2.1, 0);
    return g;
  }, []);

  // Tán cây bóng mát lớn: icosahedron detail 1, bán kính 3.6m
  const largeCanopyGeo = useMemo(() => {
    const g = new IcosahedronGeometry(3.6, 1);
    g.translate(0, 5.8, 0);
    return g;
  }, []);

  // 2. Thân cây hàng đường: thon cao 6.5m, đường kính 0.36–0.56m
  const streetTrunkGeo = useMemo(() => {
    const g = new CylinderGeometry(0.18, 0.28, 6.5, 6);
    g.translate(0, 3.25, 0);
    return g;
  }, []);

  // Tán cây hàng đường: icosahedron vươn cao, bán kính 2.3m đặt ở độ cao 8.2m
  const streetCanopyGeo = useMemo(() => {
    const g = new IcosahedronGeometry(2.3, 1);
    g.scale(1.0, 1.35, 1.0);
    g.translate(0, 8.2, 0);
    return g;
  }, []);

  // 3. Cây bụi / cây cảnh thấp tầng: icosahedron detail 0 (20 tam giác), bán kính 1.2m
  const shrubGeo = useMemo(() => {
    const g = new IcosahedronGeometry(1.2, 0);
    g.scale(1.0, 0.85, 1.0);
    g.translate(0, 0.9, 0);
    return g;
  }, []);

  // Vật liệu thân cây dùng chung
  const trunkMat = useMemo(
    () => new MeshStandardMaterial({ color: '#523a27', flatShading: true, roughness: 0.9 }),
    [],
  );

  // Vật liệu tán cây bóng mát lớn đung đưa nhẹ theo gió
  const largeCanopyMat = useMemo(() => {
    const m = new MeshStandardMaterial({ color: '#447532', flatShading: true, roughness: 0.8 });
    applyWind(m, { strength: 0.15, heightFalloff: 9.6 });
    return m;
  }, []);

  // Vật liệu tán cây hàng đường
  const streetCanopyMat = useMemo(() => {
    const m = new MeshStandardMaterial({ color: '#3b6628', flatShading: true, roughness: 0.8 });
    applyWind(m, { strength: 0.12, heightFalloff: 10.0 });
    return m;
  }, []);

  // Vật liệu cây bụi
  const shrubMat = useMemo(() => {
    const m = new MeshStandardMaterial({ color: '#4d8232', flatShading: true, roughness: 0.85 });
    applyWind(m, { strength: 0.08, heightFalloff: 2.0 });
    return m;
  }, []);

  // Refs cho các InstancedMesh
  const largeTrunkRef = useRef<InstancedMesh>(null);
  const largeCanopyRef = useRef<InstancedMesh>(null);
  const streetTrunkRef = useRef<InstancedMesh>(null);
  const streetCanopyRef = useRef<InstancedMesh>(null);
  const shrubRef = useRef<InstancedMesh>(null);

  const isSnowing = useSnowStore((s) => s.isSnowing);

  // Cập nhật ma trận và màu sắc cho các InstancedMesh
  useLayoutEffect(() => {
    const dummy = new Object3D();
    const col = new Color();
    const snowTint = new Color('#e2eef8');

    // 1. Cây bóng mát lớn
    const lTrunk = largeTrunkRef.current;
    const lCanopy = largeCanopyRef.current;
    if (lTrunk && lCanopy) {
      largeTrees.forEach((t, i) => {
        dummy.position.set(t.x, 0, t.z);
        dummy.rotation.set(0, t.rotY, 0);
        dummy.scale.set(t.scaleXZ, t.scaleY, t.scaleXZ);
        dummy.updateMatrix();

        lTrunk.setMatrixAt(i, dummy.matrix);
        lCanopy.setMatrixAt(i, dummy.matrix);

        col.set(t.color);
        if (isSnowing) col.lerp(snowTint, 0.55);
        lCanopy.setColorAt(i, col);
      });
      lTrunk.instanceMatrix.needsUpdate = true;
      lCanopy.instanceMatrix.needsUpdate = true;
      if (lCanopy.instanceColor) lCanopy.instanceColor.needsUpdate = true;
    }

    // 2. Cây hàng đường
    const sTrunk = streetTrunkRef.current;
    const sCanopy = streetCanopyRef.current;
    if (sTrunk && sCanopy) {
      streetTrees.forEach((t, i) => {
        dummy.position.set(t.x, 0, t.z);
        dummy.rotation.set(0, t.rotY, 0);
        dummy.scale.set(t.scaleXZ, t.scaleY, t.scaleXZ);
        dummy.updateMatrix();

        sTrunk.setMatrixAt(i, dummy.matrix);
        sCanopy.setMatrixAt(i, dummy.matrix);

        col.set(t.color);
        if (isSnowing) col.lerp(snowTint, 0.55);
        sCanopy.setColorAt(i, col);
      });
      sTrunk.instanceMatrix.needsUpdate = true;
      sCanopy.instanceMatrix.needsUpdate = true;
      if (sCanopy.instanceColor) sCanopy.instanceColor.needsUpdate = true;
    }

    // 3. Cây bụi
    const shrubMesh = shrubRef.current;
    if (shrubMesh) {
      shrubTrees.forEach((t, i) => {
        dummy.position.set(t.x, 0, t.z);
        dummy.rotation.set(0, t.rotY, 0);
        dummy.scale.set(t.scaleXZ, t.scaleY, t.scaleXZ);
        dummy.updateMatrix();

        shrubMesh.setMatrixAt(i, dummy.matrix);

        col.set(t.color);
        if (isSnowing) col.lerp(snowTint, 0.55);
        shrubMesh.setColorAt(i, col);
      });
      shrubMesh.instanceMatrix.needsUpdate = true;
      if (shrubMesh.instanceColor) shrubMesh.instanceColor.needsUpdate = true;
    }
  }, [largeTrees, streetTrees, shrubTrees, isSnowing]);

  return (
    <group>
      {/* 1. Cây bóng mát lớn (2 draw calls: thân + tán) */}
      {largeTrees.length > 0 && (
        <>
          <instancedMesh
            ref={largeTrunkRef}
            key={`large-trunks-${largeTrees.length}`}
            args={[largeTrunkGeo, trunkMat, largeTrees.length]}
            castShadow
            receiveShadow
          />
          <instancedMesh
            ref={largeCanopyRef}
            key={`large-canopies-${largeTrees.length}`}
            args={[largeCanopyGeo, largeCanopyMat, largeTrees.length]}
            castShadow
            receiveShadow
          />
        </>
      )}

      {/* 2. Cây thân cao hàng đường (2 draw calls: thân + tán) */}
      {streetTrees.length > 0 && (
        <>
          <instancedMesh
            ref={streetTrunkRef}
            key={`street-trunks-${streetTrees.length}`}
            args={[streetTrunkGeo, trunkMat, streetTrees.length]}
            castShadow
            receiveShadow
          />
          <instancedMesh
            ref={streetCanopyRef}
            key={`street-canopies-${streetTrees.length}`}
            args={[streetCanopyGeo, streetCanopyMat, streetTrees.length]}
            castShadow
            receiveShadow
          />
        </>
      )}

      {/* 3. Cây bụi / cây cảnh thấp tầng (1 draw call) */}
      {shrubTrees.length > 0 && (
        <instancedMesh
          ref={shrubRef}
          key={`shrubs-${shrubTrees.length}`}
          args={[shrubGeo, shrubMat, shrubTrees.length]}
          castShadow
          receiveShadow
        />
      )}
    </group>
  );
}
