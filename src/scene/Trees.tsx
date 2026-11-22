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
import { b11ToLocal } from './interior/layouts/b11';
import SalixAlbaTrees, { type SalixAlbaInstance } from './trees/SalixAlbaTrees';
import { isPointInPond } from './zone1/pondLayout';
import { applyWind } from './nature/wind';

/** Bộ sinh số giả ngẫu nhiên có hạt giống cố định (Mulberry32) để vị trí không đổi mỗi lần render. */
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

interface TreeData {
  x: number;
  z: number;
  rotY: number;
  scaleXZ: number;
  scaleY: number;
  color: string;
}

const TREE_COLORS = ['#38632a', '#447532', '#50853b', '#335b24', '#487d37'];

function isNearBlock11Precinct(x: number, z: number): boolean {
  const [u, v] = b11ToLocal(x, z);
  return u >= -24 && u <= 155 && v >= -164 && v <= -92;
}

export default function Trees() {
  const { layout, buildings } = campus;

  const { genericTrees, b11SalixTrees } = useMemo(() => {
    const rng = createPrng(20261113);
    const all: TreeData[] = [];
    const minSpacing = 5.8;

    const isValidPosition = (pt: Vec2): boolean => {
      // 1. Phải nằm trong ranh giới trường EIU
      if (!isPointInPolygon(pt, layout.boundary)) return false;

      // 2. Không đè vào bất kỳ tòa nhà nào (cách tường tối thiểu 5m cho cây lớn)
      for (const b of buildings) {
        if (isPointInPolygon(pt, b.shape.outer)) return false;
        const outer = b.shape.outer;
        for (let i = 0; i < outer.length; i++) {
          const p1 = outer[i];
          const p2 = outer[(i + 1) % outer.length];
          if (p1 && p2 && distToSegment(pt, p1, p2) < 5.0) return false;
        }
      }

      // 3. Không đè vào đường (tán cây lớn nên cách tim đường an toàn)
      for (const road of layout.roads) {
        let width = 7;
        if (road.kind === 'street') width = (road.lanes ?? 2) * 3.5;
        else if (road.kind === 'footway') width = 2.5;
        const safeDist = width / 2 + 2.8;

        for (let i = 0; i < road.points.length - 1; i++) {
          const p1 = road.points[i];
          const p2 = road.points[i + 1];
          if (p1 && p2 && distToSegment(pt, p1, p2) < safeDist) return false;
        }
      }

      // 4. Không đè vào vành đường vòng xoay (bán kính 73m đến 86m)
      const dCenter = Math.hypot(pt[0], pt[1]);
      if (dCenter >= 73.0 && dCenter <= 86.5) return false;

      // 4b. Không mọc cây bên trong hoặc quá sát lòng hồ nước giữa Block 4 và Block 3
      if (isPointInPond(pt[0], pt[1], 3.5)) return false;

      // 5. Không đè vào các bãi giữ xe
      for (const p of layout.parking) {
        if (isPointInPolygon(pt, p)) return false;
        for (let i = 0; i < p.length; i++) {
          const p1 = p[i];
          const p2 = p[(i + 1) % p.length];
          if (p1 && p2 && distToSegment(pt, p1, p2) < 4.0) return false;
        }
      }

      // 6. Khoảng cách với các cây đã tạo
      for (const t of all) {
        if (Math.hypot(pt[0] - t.x, pt[1] - t.z) < minSpacing) return false;
      }

      return true;
    };

    const addTree = (pt: Vec2) => {
      if (all.length >= 520) return;
      if (!isValidPosition(pt)) return;

      const rotY = rng() * Math.PI * 2;
      const scaleXZ = 0.85 + rng() * 0.35;
      const scaleY = 0.85 + rng() * 0.40;
      const color = TREE_COLORS[Math.floor(rng() * TREE_COLORS.length)] ?? '#447532';

      all.push({ x: pt[0], z: pt[1], rotY, scaleXZ, scaleY, color });
    };

    // A. Hàng cây dày dặn dọc các tuyến đường nội bộ và đường vào từ cổng
    for (const road of layout.roads) {
      if (road.kind === 'bridge') continue;
      let width = 7;
      if (road.kind === 'street') width = (road.lanes ?? 2) * 3.5;
      else if (road.kind === 'footway') width = 2.5;

      const offsetDist = width / 2 + 4.2;

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
        const steps = Math.floor(len / 10);

        for (let s = 1; s <= steps; s++) {
          const t = s / (steps + 1);
          const px = p1[0] + dx * t;
          const pz = p1[1] + dz * t;

          // Hàng cây hai bên đường
          const jx1 = (rng() - 0.5) * 1.5;
          const jz1 = (rng() - 0.5) * 1.5;
          addTree([px + nx * offsetDist + jx1, pz + nz * offsetDist + jz1]);

          const jx2 = (rng() - 0.5) * 1.5;
          const jz2 = (rng() - 0.5) * 1.5;
          addTree([px - nx * offsetDist + jx2, pz - nz * offsetDist + jz2]);
        }
      }
    }

    // B. Vành cây dày quanh vòng xoay và thảm cỏ quảng trường
    for (let step = 0; step < 48; step++) {
      const angle = (step / 48) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Cây bên ngoài vành đường (r ≈ 91m)
      addTree([cosA * 91 + (rng() - 0.5) * 2, sinA * 91 + (rng() - 0.5) * 2]);
      // Cây bên trong bãi cỏ vòng xoay (r ≈ 66m)
      addTree([cosA * 66 + (rng() - 0.5) * 2, sinA * 66 + (rng() - 0.5) * 2]);
    }

    // C. Hàng cây dọc viền khuôn viên
    const boundary = layout.boundary;
    for (let i = 0; i < boundary.length; i++) {
      const p1 = boundary[i];
      const p2 = boundary[(i + 1) % boundary.length];
      if (!p1 || !p2) continue;

      const dx = p2[0] - p1[0];
      const dz = p2[1] - p1[1];
      const len = Math.hypot(dx, dz);
      const steps = Math.floor(len / 13);

      for (let s = 1; s <= steps; s++) {
        const t = s / (steps + 1);
        const px = p1[0] + dx * t + (rng() - 0.5) * 3;
        const pz = p1[1] + dz * t + (rng() - 0.5) * 3;
        addTree([px, pz]);
      }
    }

    // D. Điền cây lớn vào các khoảng sân cỏ trống
    let attempts = 0;
    while (all.length < 480 && attempts < 1200) {
      attempts++;
      const candX = (rng() - 0.5) * 550;
      const candZ = (rng() - 0.5) * 550;
      addTree([candX, candZ]);
    }

    const generic: TreeData[] = [];
    const salix: SalixAlbaInstance[] = [];
    for (const t of all) {
      if (isNearBlock11Precinct(t.x, t.z)) {
        salix.push({
          x: t.x,
          y: 0,
          z: t.z,
          rotY: t.rotY,
          scaleXZ: t.scaleXZ * 0.82,
          scaleY: t.scaleY * 0.84,
        });
      } else {
        generic.push(t);
      }
    }

    return { genericTrees: generic, b11SalixTrees: salix };
  }, [layout, buildings]);

  // Cây to hơn: thân cao 4.5m, đường kính 0.9–1.2m
  const trunkGeo = useMemo(() => {
    const g = new CylinderGeometry(0.4, 0.6, 4.5, 6);
    g.translate(0, 2.25, 0);
    return g;
  }, []);

  // Tán to hơn: bán kính 3.6m (đường kính 7.2m, tổng chiều cao 9–12m)
  const canopyGeo = useMemo(() => {
    const g = new IcosahedronGeometry(3.6, 1);
    g.translate(0, 6.0, 0);
    return g;
  }, []);

  const trunkMat = useMemo(
    () => new MeshStandardMaterial({ color: '#523a27', flatShading: true, roughness: 0.9 }),
    [],
  );

  // Tán lá đung đưa theo gió trong vertex shader (ngọn lệch ≤ 0.15 m); thân giữ nguyên.
  const canopyMat = useMemo(() => {
    const m = new MeshStandardMaterial({ color: '#447532', flatShading: true, roughness: 0.8 });
    applyWind(m, { strength: 0.15, heightFalloff: 9.6 });
    return m;
  }, []);

  const trunkRef = useRef<InstancedMesh>(null);
  const canopyRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const trunkMesh = trunkRef.current;
    const canopyMesh = canopyRef.current;
    if (!trunkMesh || !canopyMesh) return;

    const dummy = new Object3D();
    const col = new Color();

    genericTrees.forEach((t, i) => {
      dummy.position.set(t.x, 0, t.z);
      dummy.rotation.set(0, t.rotY, 0);
      dummy.scale.set(t.scaleXZ, t.scaleY, t.scaleXZ);
      dummy.updateMatrix();

      trunkMesh.setMatrixAt(i, dummy.matrix);
      canopyMesh.setMatrixAt(i, dummy.matrix);

      col.set(t.color);
      canopyMesh.setColorAt(i, col);
    });

    trunkMesh.instanceMatrix.needsUpdate = true;
    canopyMesh.instanceMatrix.needsUpdate = true;
    if (canopyMesh.instanceColor) {
      canopyMesh.instanceColor.needsUpdate = true;
    }
  }, [genericTrees]);

  return (
    <group>
      {/* 1 draw call cho thân */}
      {genericTrees.length > 0 && (
        <instancedMesh
          ref={trunkRef}
          key={`generic-trunks-${genericTrees.length}`}
          args={[trunkGeo, trunkMat, genericTrees.length]}
          castShadow
          receiveShadow
        />
      )}
      {/* 1 draw call cho tán */}
      {genericTrees.length > 0 && (
        <instancedMesh
          ref={canopyRef}
          key={`generic-canopies-${genericTrees.length}`}
          args={[canopyGeo, canopyMat, genericTrees.length]}
          castShadow
          receiveShadow
        />
      )}
      {/* Cây 3D Salix alba quanh khuôn viên Block 11 */}
      <SalixAlbaTrees instances={b11SalixTrees} />
    </group>
  );
}
