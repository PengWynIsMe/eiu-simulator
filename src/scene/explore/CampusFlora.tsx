import { useEffect, useMemo } from 'react';
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  MeshLambertMaterial,
  Object3D,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildFreeMask } from '../street/streetLayout';
import { getGroundHeight } from '../walk/groundHeight';
import { useSnowStore } from '../../store/useSnowStore';
import type { Vec2 } from '../../types';

const NO_RAYCAST = () => undefined;

const BLOSSOM_PALETTE = ['#e11d74', '#fb7185', '#fbbf24', '#fef3c7', '#c084fc'] as const;

function hash01(i: number, j: number): number {
  let h = Math.imul(i | 0, 0x27d4eb2d) ^ Math.imul(j | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}

/** Tạo một bụi cây hữu cơ gồm 6 tán lá phồng gối lên nhau, tô màu đỉnh chuyển sắc từ gốc lên ngọn. */
function createBushClusterGeometry(): BufferGeometry {
  const puffs: readonly { x: number; y: number; z: number; rx: number; ry: number; rz: number }[] = [
    { x: 0.0, y: 0.38, z: 0.0, rx: 0.56, ry: 0.44, rz: 0.54 },
    { x: -0.36, y: 0.25, z: 0.16, rx: 0.44, ry: 0.34, rz: 0.42 },
    { x: 0.38, y: 0.26, z: -0.14, rx: 0.46, ry: 0.35, rz: 0.42 },
    { x: 0.14, y: 0.24, z: 0.38, rx: 0.42, ry: 0.32, rz: 0.4 },
    { x: -0.18, y: 0.24, z: -0.36, rx: 0.43, ry: 0.33, rz: 0.41 },
    { x: 0.06, y: 0.54, z: 0.04, rx: 0.38, ry: 0.3, rz: 0.36 },
  ];

  const parts: BufferGeometry[] = puffs.map((p) => {
    const g = new IcosahedronGeometry(1, 1);
    g.scale(p.rx, p.ry, p.rz);
    g.translate(p.x, p.y, p.z);
    return g;
  });

  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  if (!merged) throw new Error('CampusFlora: không gộp được bụi cây');

  const pos = merged.getAttribute('position');
  const colors = new Float32Array(pos.count * 3);
  const dark = new Color('#245930');
  const mid = new Color('#3b8742');
  const tip = new Color('#67b855');
  const tmp = new Color();

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = Math.max(0, Math.min(1, y / 0.85));
    if (t < 0.45) tmp.copy(dark).lerp(mid, t / 0.45);
    else tmp.copy(mid).lerp(tip, (t - 0.45) / 0.55);
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  merged.setAttribute('color', new Float32BufferAttribute(colors, 3));
  return merged;
}

interface ShrubPlacement {
  x: number;
  y: number;
  z: number;
  scale: number;
  yaw: number;
  color: string;
  accentColor: string;
}

const FLOWERS_PER_BUSH = 12;

export default function CampusFlora() {
  const isSnowing = useSnowStore((s) => s.isSnowing);

  const { bushMesh, flowerMesh, dispose } = useMemo(() => {
    const mask = buildFreeMask();
    const spots: ShrubPlacement[] = [];

    const tryAdd = (x: number, z: number, seed: number) => {
      if (!mask.isGrass(x, z)) return;
      if (!mask.isGrass(x + 0.9, z) || !mask.isGrass(x - 0.9, z)) return;
      if (!mask.isGrass(x, z + 0.9) || !mask.isGrass(x, z - 0.9)) return;
      if (spots.some((s) => Math.hypot(s.x - x, s.z - z) < 3.6)) return;
      const cIdx = seed % BLOSSOM_PALETTE.length;
      spots.push({
        x,
        y: getGroundHeight(x, z),
        z,
        scale: 0.78 + hash01(seed, 11) * 0.48,
        yaw: hash01(seed, 29) * Math.PI * 2,
        color: BLOSSOM_PALETTE[cIdx] ?? '#e11d74',
        accentColor: BLOSSOM_PALETTE[(cIdx + 2) % BLOSSOM_PALETTE.length] ?? '#fbbf24',
      });
    };

    // 1. Vành đai hoa quanh mép trong và ngoài quảng trường vòng xoay
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      tryAdd(Math.cos(a) * 72.5, Math.sin(a) * 72.5, 100 + i);
      if (i % 2 === 0) tryAdd(Math.cos(a + 0.05) * 87.5, Math.sin(a + 0.05) * 87.5, 200 + i);
    }

    // 2. Cụm hoa trang trí ven các trục đường & sân Zone 1 + Zone 2
    const anchors: readonly Vec2[] = [
      [246, -42], [240, -16], [220, -40], [186, -44],
      [148, -42], [116, -48], [155, 18], [136, 36],
      [96, -54], [62, -62], [44, -92], [22, -104],
      [-24, -98], [-82, -74], [-4, -148], [88, -220],
    ];
    anchors.forEach(([ax, az], idx) => {
      for (let k = 0; k < 5; k++) {
        const ang = hash01(idx, k * 7) * Math.PI * 2;
        const rad = 2.5 + hash01(idx, k * 13) * 8.5;
        tryAdd(ax + Math.cos(ang) * rad, az + Math.sin(ang) * rad, 500 + idx * 10 + k);
      }
    });

    const bushGeo = createBushClusterGeometry();
    const bushMat = new MeshLambertMaterial({ vertexColors: true });
    const bushMesh = new InstancedMesh(bushGeo, bushMat, Math.max(1, spots.length));

    const flowerGeo = new IcosahedronGeometry(0.092, 0);
    const flowerMat = new MeshLambertMaterial({ color: '#ffffff' });
    const flowerMesh = new InstancedMesh(flowerGeo, flowerMat, Math.max(1, spots.length * FLOWERS_PER_BUSH));

    const dummy = new Object3D();
    const m = new Matrix4();
    const c = new Color();

    spots.forEach((s, i) => {
      dummy.position.set(s.x, s.y, s.z);
      dummy.rotation.set(0, s.yaw, 0);
      dummy.scale.setScalar(s.scale);
      dummy.updateMatrix();
      m.copy(dummy.matrix);
      bushMesh.setMatrixAt(i, m);

      for (let k = 0; k < FLOWERS_PER_BUSH; k++) {
        const ang = s.yaw + (k / FLOWERS_PER_BUSH) * Math.PI * 2 + hash01(i, k * 3) * 0.4;
        const ringR = (0.22 + hash01(i, k * 7) * 0.42) * s.scale;
        const fy = s.y + (0.42 + hash01(i, k * 11) * 0.34) * s.scale;
        dummy.position.set(
          s.x + Math.cos(ang) * ringR,
          fy,
          s.z + Math.sin(ang) * ringR,
        );
        dummy.rotation.set(hash01(i, k) * 2, ang, 0);
        dummy.scale.setScalar(s.scale * (0.7 + hash01(i, k * 17) * 0.55));
        dummy.updateMatrix();
        m.copy(dummy.matrix);
        const fIdx = i * FLOWERS_PER_BUSH + k;
        flowerMesh.setMatrixAt(fIdx, m);
        flowerMesh.setColorAt(fIdx, c.set(k % 4 === 0 ? s.accentColor : s.color));
      }
    });

    bushMesh.count = spots.length;
    bushMesh.instanceMatrix.needsUpdate = true;
    bushMesh.computeBoundingSphere();
    bushMesh.raycast = NO_RAYCAST;

    flowerMesh.count = spots.length * FLOWERS_PER_BUSH;
    flowerMesh.instanceMatrix.needsUpdate = true;
    if (flowerMesh.instanceColor) flowerMesh.instanceColor.needsUpdate = true;
    flowerMesh.computeBoundingSphere();
    flowerMesh.raycast = NO_RAYCAST;

    return {
      bushMesh,
      flowerMesh,
      dispose: () => {
        bushGeo.dispose();
        bushMat.dispose();
        bushMesh.dispose();
        flowerGeo.dispose();
        flowerMat.dispose();
        flowerMesh.dispose();
      },
    };
  }, []);

  useEffect(() => dispose, [dispose]);

  useEffect(() => {
    const mat = bushMesh.material as MeshLambertMaterial;
    mat.color.set(isSnowing ? '#dbeafe' : '#ffffff');
  }, [bushMesh, isSnowing]);

  return (
    <group>
      <primitive object={bushMesh} />
      {!isSnowing && <primitive object={flowerMesh} />}
    </group>
  );
}
