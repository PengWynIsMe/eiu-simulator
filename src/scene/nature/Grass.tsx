import { useEffect, useMemo } from 'react';
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedMesh,
  MeshLambertMaterial,
} from 'three';
import { useFrame } from '@react-three/fiber';
import { campus } from '../../data';
import { BRIDGE_WIDTH, FOOTWAY_WIDTH, GRASS, ROAD_WIDTH, ROUNDABOUT_GRASS, ROUNDABOUT_ROAD_WIDTH, STREET_LANE_WIDTH } from '../groundLevels';
import { isPointInPond } from '../zone1/pondLayout';
import { buildGrassMask, type GrassMaskRoad } from './grassMask';
import { applyWind } from './wind';

/** Số ngọn tối đa (ngân sách PLAN mục 5). */
export const GRASS_MAX_BLADES = 40000;
/** Bán kính mọc cỏ quanh camera (m). */
const RADIUS = 70;
/** Camera dời quá khoảng này thì dựng lại ma trận (m). */
const REBUILD_DISTANCE = 8;
/** Cao hơn mức này (camera tổng quan) thì ẩn cỏ. */
const HIDE_ABOVE_Y = 150;
/** Khoảng cách giữa các ô lưới cỏ (m). */
const SPACING = 0.7;
/** Cỏ thấp dần về 0 trong khoảng cách tới camera này — phải ≤ RADIUS - REBUILD_DISTANCE để mép lưới không "nhảy". */
const FADE_NEAR = 40;
const FADE_FAR = 62;

/** Ngọn cỏ cao 1 đơn vị (scale theo instance 0.25–0.45 m): 3 tam giác chéo nhau 60°, gốc đậm → ngọn sáng. */
function createBladeGeometry(): BufferGeometry {
  const base = new Color('#4a7536');
  const tip = new Color('#a8d066');
  const positions: number[] = [];
  const colors: number[] = [];
  const halfW = 0.04;
  for (let k = 0; k < 3; k++) {
    const a = (k * Math.PI) / 3;
    const dx = Math.cos(a);
    const dz = Math.sin(a);
    positions.push(-dx * halfW, 0, -dz * halfW, dx * halfW, 0, dz * halfW, dx * 0.03, 1, dz * 0.03);
    colors.push(base.r, base.g, base.b, base.r, base.g, base.b, tip.r, tip.g, tip.b);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
  return geo;
}

/** Băm 2 số nguyên → số nguyên 32 bit không dấu (ổn định, không phụ thuộc thứ tự gọi). */
function hash2(i: number, j: number): number {
  let h = Math.imul(i | 0, 0x27d4eb2d) ^ Math.imul(j | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

interface GrassState {
  mesh: InstancedMesh;
  geo: BufferGeometry;
  mat: MeshLambertMaterial;
}

/** Cỏ lay gió phủ các bãi xanh quanh camera. 1 instancedMesh ≤ 40 000 ngọn; vị trí cố định theo lưới băm. */
export default function Grass() {
  const mask = useMemo(() => {
    const roads: GrassMaskRoad[] = campus.layout.roads.map((r) => {
      let width = ROAD_WIDTH;
      if (r.kind === 'street') width = (r.lanes ?? 2) * STREET_LANE_WIDTH;
      else if (r.kind === 'footway') width = FOOTWAY_WIDTH;
      else if (r.kind === 'bridge') width = BRIDGE_WIDTH;
      return { points: r.points, width };
    });
    return buildGrassMask({
      boundary: campus.layout.boundary,
      roads,
      buildingOuters: campus.buildings.map((b) => b.shape.outer),
      parking: campus.layout.parking,
      roundabout: { radius: campus.layout.roundabout.radius, roadWidth: ROUNDABOUT_ROAD_WIDTH },
      isBlocked: (x, z) => isPointInPond(x, z, 1.2),
      roadMargin: 0.5,
      solidMargin: 0.4,
    });
  }, []);

  const state = useMemo<GrassState>(() => {
    const geo = createBladeGeometry();
    const mat = new MeshLambertMaterial({ vertexColors: true, side: DoubleSide });
    applyWind(mat, { strength: 0.16, heightFalloff: 1, distanceFade: [FADE_NEAR, FADE_FAR], upNormal: true });
    const mesh = new InstancedMesh(geo, mat, GRASS_MAX_BLADES);
    mesh.instanceColor = new InstancedBufferAttribute(new Float32Array(GRASS_MAX_BLADES * 3), 3);
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.receiveShadow = true;
    // Cỏ không nhận click/hover: bỏ qua raycast để click vẫn xuống Ground (và khỏi tốn CPU dò 40 000 ngọn).
    mesh.raycast = () => undefined;
    return { mesh, geo, mat };
  }, []);

  useEffect(
    () => () => {
      state.geo.dispose();
      state.mat.dispose();
      state.mesh.dispose();
    },
    [state],
  );

  // Vị trí tâm lần dựng gần nhất (số thuần, không tạo object mỗi khung).
  const last = useMemo(() => ({ x: 1e9, z: 1e9 }), []);

  useFrame(({ camera }) => {
    const { mesh } = state;
    const cx = camera.position.x;
    const cz = camera.position.z;
    const show = camera.position.y < HIDE_ABOVE_Y;
    if (mesh.visible !== show) mesh.visible = show;
    if (!show) return;
    if (Math.hypot(cx - last.x, cz - last.z) < REBUILD_DISTANCE) return;
    last.x = cx;
    last.z = cz;

    const mArr = mesh.instanceMatrix.array as Float32Array;
    const cArr = (mesh.instanceColor as InstancedBufferAttribute).array as Float32Array;
    const rbInner = mask.roundaboutInner;
    const rSq = RADIUS * RADIUS;
    const i0 = Math.floor((cx - RADIUS) / SPACING);
    const i1 = Math.floor((cx + RADIUS) / SPACING);
    const j0 = Math.floor((cz - RADIUS) / SPACING);
    const j1 = Math.floor((cz + RADIUS) / SPACING);
    let n = 0;
    for (let i = i0; i <= i1 && n < GRASS_MAX_BLADES; i++) {
      for (let j = j0; j <= j1 && n < GRASS_MAX_BLADES; j++) {
        const h = hash2(i, j);
        const x = (i + 0.5 + ((h & 1023) / 1023 - 0.5) * 0.9) * SPACING;
        const z = (j + 0.5 + (((h >>> 10) & 1023) / 1023 - 0.5) * 0.9) * SPACING;
        const dx = x - cx;
        const dz = z - cz;
        if (dx * dx + dz * dz > rSq) continue;
        if (!mask.isGrass(x, z)) continue;

        const h2 = hash2(h, 7919);
        const ang = (((h >>> 20) & 1023) / 1023) * Math.PI * 2;
        const height = 0.25 + ((h2 & 1023) / 1023) * 0.2;
        const tint = 0.82 + (((h2 >>> 10) & 1023) / 1023) * 0.36;
        const cs = Math.cos(ang);
        const sn = Math.sin(ang);
        const y = Math.hypot(x, z) < rbInner ? ROUNDABOUT_GRASS : GRASS;
        const o = n * 16;
        mArr[o] = cs;
        mArr[o + 1] = 0;
        mArr[o + 2] = -sn;
        mArr[o + 3] = 0;
        mArr[o + 4] = 0;
        mArr[o + 5] = height;
        mArr[o + 6] = 0;
        mArr[o + 7] = 0;
        mArr[o + 8] = sn;
        mArr[o + 9] = 0;
        mArr[o + 10] = cs;
        mArr[o + 11] = 0;
        mArr[o + 12] = x;
        mArr[o + 13] = y;
        mArr[o + 14] = z;
        mArr[o + 15] = 1;
        const c = n * 3;
        cArr[c] = tint;
        cArr[c + 1] = tint;
        cArr[c + 2] = tint;
        n++;
      }
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return <primitive object={state.mesh} />;
}
