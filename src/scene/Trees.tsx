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

const TREE_COLORS = ['#3d6a2e', '#487c35', '#578e3f', '#365d27', '#4c823a'];

export default function Trees() {
  const { layout, buildings } = campus;

  const trees = useMemo(() => {
    const rng = createPrng(20261112);
    const result: TreeData[] = [];
    const minSpacing = 3.8;

    const isValidPosition = (pt: Vec2): boolean => {
      // 1. Phải nằm trong ranh giới trường EIU
      if (!isPointInPolygon(pt, layout.boundary)) return false;

      // 2. Không đè vào bất kỳ tòa nhà nào (cách tường tối thiểu 3.5m)
      for (const b of buildings) {
        if (isPointInPolygon(pt, b.shape.outer)) return false;
        const outer = b.shape.outer;
        for (let i = 0; i < outer.length; i++) {
          const p1 = outer[i];
          const p2 = outer[(i + 1) % outer.length];
          if (p1 && p2 && distToSegment(pt, p1, p2) < 3.5) return false;
        }
      }

      // 3. Không đè vào đường (cách mép đường tối thiểu 1.5m)
      for (const road of layout.roads) {
        let width = 7;
        if (road.kind === 'street') width = (road.lanes ?? 2) * 3.5;
        else if (road.kind === 'footway') width = 2.5;
        const safeDist = width / 2 + 1.5;

        for (let i = 0; i < road.points.length - 1; i++) {
          const p1 = road.points[i];
          const p2 = road.points[i + 1];
          if (p1 && p2 && distToSegment(pt, p1, p2) < safeDist) return false;
        }
      }

      // 4. Không đè vào vành đường vòng xoay (bán kính 74m đến 85.5m)
      const dCenter = Math.hypot(pt[0], pt[1]);
      if (dCenter >= 73.8 && dCenter <= 85.5) return false;

      // 5. Không đè vào các bãi giữ xe
      for (const p of layout.parking) {
        if (isPointInPolygon(pt, p)) return false;
        for (let i = 0; i < p.length; i++) {
          const p1 = p[i];
          const p2 = p[(i + 1) % p.length];
          if (p1 && p2 && distToSegment(pt, p1, p2) < 2.5) return false;
        }
      }

      // 6. Khoảng cách với các cây đã tạo
      for (const t of result) {
        if (Math.hypot(pt[0] - t.x, pt[1] - t.z) < minSpacing) return false;
      }

      return true;
    };

    const addTree = (pt: Vec2) => {
      if (result.length >= 480) return;
      if (!isValidPosition(pt)) return;

      const rotY = rng() * Math.PI * 2;
      const scaleXZ = 0.85 + rng() * 0.35;
      const scaleY = 0.85 + rng() * 0.45;
      const color = TREE_COLORS[Math.floor(rng() * TREE_COLORS.length)] ?? '#487c35';

      result.push({ x: pt[0], z: pt[1], rotY, scaleXZ, scaleY, color });
    };

    // A. Hàng cây dọc các tuyến đường nội bộ và đường phố
    for (const road of layout.roads) {
      if (road.kind === 'bridge') continue;
      let width = 7;
      if (road.kind === 'street') width = (road.lanes ?? 2) * 3.5;
      else if (road.kind === 'footway') width = 2.5;

      const offsetDist = width / 2 + 3.0;

      for (let i = 0; i < road.points.length - 1; i++) {
        const p1 = road.points[i];
        const p2 = road.points[i + 1];
        if (!p1 || !p2) continue;

        const dx = p2[0] - p1[0];
        const dz = p2[1] - p1[1];
        const len = Math.hypot(dx, dz);
        if (len < 5) continue;

        const nx = -dz / len;
        const nz = dx / len;
        const steps = Math.floor(len / 11);

        for (let s = 1; s <= steps; s++) {
          const t = s / (steps + 1);
          const px = p1[0] + dx * t;
          const pz = p1[1] + dz * t;

          // Bên phải đường
          const jx1 = (rng() - 0.5) * 1.5;
          const jz1 = (rng() - 0.5) * 1.5;
          addTree([px + nx * offsetDist + jx1, pz + nz * offsetDist + jz1]);

          // Bên trái đường
          const jx2 = (rng() - 0.5) * 1.5;
          const jz2 = (rng() - 0.5) * 1.5;
          addTree([px - nx * offsetDist + jx2, pz - nz * offsetDist + jz2]);
        }
      }
    }

    // B. Vành cây quanh vòng xoay và thảm cỏ quảng trường
    for (let step = 0; step < 40; step++) {
      const angle = (step / 40) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Hàng cây ngoài vành đường (r ≈ 89m)
      addTree([cosA * 89 + (rng() - 0.5) * 2, sinA * 89 + (rng() - 0.5) * 2]);
      // Cây bên trong bãi cỏ vòng xoay (r ≈ 68m)
      addTree([cosA * 68 + (rng() - 0.5) * 2, sinA * 68 + (rng() - 0.5) * 2]);
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
      const steps = Math.floor(len / 14);

      for (let s = 1; s <= steps; s++) {
        const t = s / (steps + 1);
        const px = p1[0] + dx * t + (rng() - 0.5) * 3;
        const pz = p1[1] + dz * t + (rng() - 0.5) * 3;
        addTree([px, pz]);
      }
    }

    // D. Điền cây vào các khoảng sân cỏ trống trong khuôn viên
    let attempts = 0;
    while (result.length < 420 && attempts < 1000) {
      attempts++;
      const candX = (rng() - 0.5) * 550;
      const candZ = (rng() - 0.5) * 550;
      addTree([candX, candZ]);
    }

    return result;
  }, [layout, buildings]);

  const trunkGeo = useMemo(() => {
    const g = new CylinderGeometry(0.18, 0.28, 2.0, 5);
    g.translate(0, 1.0, 0);
    return g;
  }, []);

  const canopyGeo = useMemo(() => {
    const g = new IcosahedronGeometry(1.5, 1);
    g.translate(0, 2.7, 0);
    return g;
  }, []);

  const trunkMat = useMemo(
    () => new MeshStandardMaterial({ color: '#543d2b', flatShading: true, roughness: 0.9 }),
    [],
  );

  const canopyMat = useMemo(
    () => new MeshStandardMaterial({ color: '#447833', flatShading: true, roughness: 0.8 }),
    [],
  );

  const trunkRef = useRef<InstancedMesh>(null);
  const canopyRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const trunkMesh = trunkRef.current;
    const canopyMesh = canopyRef.current;
    if (!trunkMesh || !canopyMesh) return;

    const dummy = new Object3D();
    const col = new Color();

    trees.forEach((t, i) => {
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
  }, [trees]);

  return (
    <group>
      {/* 1 draw call cho thân */}
      <instancedMesh
        ref={trunkRef}
        args={[trunkGeo, trunkMat, trees.length]}
        castShadow
        receiveShadow
      />
      {/* 1 draw call cho tán */}
      <instancedMesh
        ref={canopyRef}
        args={[canopyGeo, canopyMat, trees.length]}
        castShadow
        receiveShadow
      />
    </group>
  );
}
