import { useEffect, useMemo } from 'react';
import {
  BoxGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  IcosahedronGeometry,
  Matrix4,
  Quaternion,
  Shape,
  Vector3,
  type BufferGeometry,
} from 'three';
import { FLOOR_HEIGHT } from '../../data';
import type { Vec2 } from '../../types';
import { safeMerge } from '../kit/geometryHelpers';
import {
  B8_EAST_HOLE_UV,
  B8_EX,
  B8_PLANTERS,
  B8_TREE_UV,
  B8_WEST_HOLE_UV,
  toWorld,
} from '../interior/layouts/b8';

const UP_VEC = new Vector3(0, 1, 0);
const B8_WORLD_YAW = Math.atan2(-B8_EX[1], B8_EX[0]);
const GROUND_TOP = 0.19;

const WEST_COL_US = [13.75, 22.75, 31.75, 40.75, 49.75] as const;
const EAST_COL_US = Array.from({ length: 9 }, (_, i) => 54.35 + i * 7.5375);

function toNonIndexed(geo: BufferGeometry): BufferGeometry {
  const nonIdx = geo.index ? geo.toNonIndexed() : geo;
  if (geo !== nonIdx) geo.dispose();
  return nonIdx;
}

function makeOrientedBox(
  u: number,
  v: number,
  y: number,
  w: number,
  h: number,
  d: number,
  extraYaw = 0
): BufferGeometry {
  const geo = toNonIndexed(new BoxGeometry(w, h, d));
  const [wx, wz] = toWorld(u, v);
  geo.rotateY(B8_WORLD_YAW + extraYaw);
  geo.translate(wx, y, wz);
  return geo;
}

function makeStrutBetween(
  p1: readonly [number, number, number],
  p2: readonly [number, number, number],
  radius: number
): BufferGeometry {
  const a = new Vector3(p1[0], p1[1], p1[2]);
  const b = new Vector3(p2[0], p2[1], p2[2]);
  const dir = new Vector3().subVectors(b, a);
  const len = dir.length();
  const mid = new Vector3().addVectors(a, b).multiplyScalar(0.5);

  const geo = toNonIndexed(new CylinderGeometry(radius, radius, len, 6));
  const quat = new Quaternion().setFromUnitVectors(UP_VEC, dir.normalize());
  geo.applyMatrix4(new Matrix4().compose(mid, quat, new Vector3(1, 1, 1)));
  return geo;
}

function makeCourtyardPolygonSlab(holeUv: readonly Vec2[], yBottom: number, depth: number): BufferGeometry {
  const shape = new Shape();
  holeUv.forEach(([u, v], i) => {
    const [wx, wz] = toWorld(u, v);
    if (i === 0) shape.moveTo(wx, -wz);
    else shape.lineTo(wx, -wz);
  });
  shape.closePath();

  const extrude = new ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  extrude.rotateX(-Math.PI / 2);
  extrude.translate(0, yBottom, 0);
  return toNonIndexed(extrude);
}

function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Chi tiết sân vườn & mặt đứng sân trong Block 8 nhìn từ bản đồ ngoài trời:
 * - Nền đá sân trong (#a8abad), 8 bồn đá tối + thảm lan ý + hoa trắng
 * - 8 cây cao 13 m tán 3 khối icosahedron + giàn chống thép 4 chân
 * - Lam chắn nắng trắng & dải sàn xanh dương mép sân tầng 2–4
 */
export default function Block8Details() {
  const geometries = useMemo(() => {
    const stoneParts: BufferGeometry[] = [];
    const rimParts: BufferGeometry[] = [];
    const foliageParts: BufferGeometry[] = [];
    const flowerParts: BufferGeometry[] = [];
    const trunkParts: BufferGeometry[] = [];
    const canopyDarkParts: BufferGeometry[] = [];
    const canopyLightParts: BufferGeometry[] = [];
    const steelParts: BufferGeometry[] = [];
    const whiteLouverParts: BufferGeometry[] = [];
    const blueTrimParts: BufferGeometry[] = [];

    // 1. Nền đá sân phủ 2 lỗ sân B8_WEST_HOLE_UV, B8_EAST_HOLE_UV (dày 0.04, mặt trên 0.19)
    stoneParts.push(makeCourtyardPolygonSlab(B8_WEST_HOLE_UV, GROUND_TOP - 0.04, 0.04));
    stoneParts.push(makeCourtyardPolygonSlab(B8_EAST_HOLE_UV, GROUND_TOP - 0.04, 0.04));

    // 2. Bồn cây: gờ đá tối cao 0.15, thảm lan ý cao 0.45, hoa trắng hộp 0.08 rải PRNG cố định
    const rng = createSeededRng(202608);
    for (const p of B8_PLANTERS) {
      const halfU = p.lenU * 0.5;
      const halfV = p.widthV * 0.5;
      const rimThick = 0.15;
      const rimH = 0.15;
      const rimY = GROUND_TOP + rimH * 0.5;

      rimParts.push(makeOrientedBox(p.centerU, p.centerV - halfV + rimThick * 0.5, rimY, p.lenU, rimH, rimThick));
      rimParts.push(makeOrientedBox(p.centerU, p.centerV + halfV - rimThick * 0.5, rimY, p.lenU, rimH, rimThick));
      rimParts.push(makeOrientedBox(p.centerU - halfU + rimThick * 0.5, p.centerV, rimY, rimThick, rimH, p.widthV - rimThick * 2));
      rimParts.push(makeOrientedBox(p.centerU + halfU - rimThick * 0.5, p.centerV, rimY, rimThick, rimH, p.widthV - rimThick * 2));

      const innerLenU = p.lenU - rimThick * 2;
      const innerWidthV = p.widthV - rimThick * 2;
      foliageParts.push(makeOrientedBox(p.centerU, p.centerV, GROUND_TOP + 0.225, innerLenU, 0.45, innerWidthV));

      const flowerCount = Math.max(8, Math.round((innerLenU * innerWidthV) / 0.8));
      for (let i = 0; i < flowerCount; i++) {
        const fu = p.centerU + (rng() - 0.5) * (innerLenU - 0.4);
        const fv = p.centerV + (rng() - 0.5) * (innerWidthV - 0.4);
        flowerParts.push(makeOrientedBox(fu, fv, GROUND_TOP + 0.48, 0.08, 0.08, 0.08, rng() * Math.PI));
      }
    }

    // 3. Cây cao 13.0 m, tán 3 khối icosahedron, giàn chống 4 chân
    for (const [tu, tv] of B8_TREE_UV) {
      const [wx, wz] = toWorld(tu, tv);

      const trunk = toNonIndexed(new CylinderGeometry(0.175, 0.175, 13.0, 8));
      trunk.translate(wx, GROUND_TOP + 6.5, wz);
      trunkParts.push(trunk);

      const addCanopy = (
        target: BufferGeometry[],
        du: number,
        dv: number,
        dy: number,
        sx: number,
        sy: number,
        sz: number,
        rot: number
      ) => {
        const geo = toNonIndexed(new IcosahedronGeometry(0.5, 1));
        const [cx, cz] = toWorld(tu + du, tv + dv);
        geo.scale(sx, sy, sz);
        geo.rotateY(B8_WORLD_YAW + rot);
        geo.translate(cx, GROUND_TOP + dy, cz);
        target.push(geo);
      };

      addCanopy(canopyDarkParts, -0.3, 0.2, 9.5, 5.6, 4.2, 5.4, 0);
      addCanopy(canopyLightParts, 0.4, -0.2, 11.5, 5.0, 4.0, 4.8, 0.7);
      addCanopy(canopyDarkParts, -0.1, -0.1, 13.0, 4.2, 3.6, 4.2, 1.3);

      for (const [du, dv] of [
        [1.2, 0],
        [-1.2, 0],
        [0, 1.2],
        [0, -1.2],
      ] as const) {
        const [bx, bz] = toWorld(tu + du, tv + dv);
        steelParts.push(makeStrutBetween([bx, GROUND_TOP, bz], [wx, GROUND_TOP + 3.0, wz], 0.04));
      }
    }

    // 4. Lam trắng & dải xanh mép sàn tầng 2–4 trên 2 mép dài Bắc/Nam mỗi sân
    const pushFramedLouver = (fixedV: number, u1: number, u2: number, centerY: number) => {
      const s1 = u1 + 0.25;
      const s2 = u2 - 0.25;
      const clearLen = s2 - s1;
      if (clearLen < 0.6) return;

      const midU = (s1 + s2) * 0.5;
      const frameH = 0.9;
      const yBottom = centerY - frameH * 0.5;
      const yTop = centerY + frameH * 0.5;

      whiteLouverParts.push(makeOrientedBox(midU, fixedV, yBottom + 0.025, clearLen, 0.05, 0.16));
      whiteLouverParts.push(makeOrientedBox(midU, fixedV, yTop - 0.025, clearLen, 0.05, 0.16));
      for (const offset of [-0.27, -0.09, 0.09, 0.27]) {
        whiteLouverParts.push(makeOrientedBox(midU, fixedV, centerY + offset, clearLen - 0.05, 0.04, 0.13));
      }

      const cells = Math.max(2, Math.round(clearLen / 1.8));
      for (let i = 0; i <= cells; i++) {
        whiteLouverParts.push(makeOrientedBox(s1 + (clearLen * i) / cells, fixedV, centerY, 0.05, frameH, 0.17));
      }
    };

    for (let fl = 2; fl <= 4; fl++) {
      const louverCenterY = fl * FLOOR_HEIGHT - 1.35;
      for (let i = 0; i < WEST_COL_US.length - 1; i++) {
        const u1 = WEST_COL_US[i];
        const u2 = WEST_COL_US[i + 1];
        if (u1 === undefined || u2 === undefined) continue;
        pushFramedLouver(-197.0, u1, u2, louverCenterY);
        pushFramedLouver(-180.1, u1, u2, louverCenterY);
      }
      for (let i = 0; i < EAST_COL_US.length - 1; i++) {
        const u1 = EAST_COL_US[i];
        const u2 = EAST_COL_US[i + 1];
        if (u1 === undefined || u2 === undefined) continue;
        pushFramedLouver(-196.5, u1, u2, louverCenterY);
        pushFramedLouver(-179.6, u1, u2, louverCenterY);
      }

      const slabEdgeY = (fl - 1) * FLOOR_HEIGHT - 0.02;
      blueTrimParts.push(makeOrientedBox(31.75, -197.0, slabEdgeY, 36.5, 0.14, 0.12));
      blueTrimParts.push(makeOrientedBox(31.75, -180.1, slabEdgeY, 36.5, 0.14, 0.12));
      blueTrimParts.push(makeOrientedBox(84.5, -196.5, slabEdgeY, 60.8, 0.14, 0.12));
      blueTrimParts.push(makeOrientedBox(84.5, -179.6, slabEdgeY, 60.8, 0.14, 0.12));
    }

    return {
      stoneGeo: safeMerge(stoneParts),
      rimGeo: safeMerge(rimParts),
      foliageGeo: safeMerge(foliageParts),
      flowerGeo: safeMerge(flowerParts),
      trunkGeo: safeMerge(trunkParts),
      canopyDarkGeo: safeMerge(canopyDarkParts),
      canopyLightGeo: safeMerge(canopyLightParts),
      steelGeo: safeMerge(steelParts),
      whiteLouverGeo: safeMerge(whiteLouverParts),
      blueTrimGeo: safeMerge(blueTrimParts),
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(geometries).forEach((geo) => geo?.dispose());
    };
  }, [geometries]);

  return (
    <group>
      {geometries.stoneGeo && (
        <mesh geometry={geometries.stoneGeo} receiveShadow>
          <meshStandardMaterial color="#a8abad" roughness={0.8} />
        </mesh>
      )}
      {geometries.rimGeo && (
        <mesh geometry={geometries.rimGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#3f3f46" roughness={0.82} />
        </mesh>
      )}
      {geometries.foliageGeo && (
        <mesh geometry={geometries.foliageGeo} receiveShadow>
          <meshStandardMaterial color="#2f5d34" roughness={0.88} />
        </mesh>
      )}
      {geometries.flowerGeo && (
        <mesh geometry={geometries.flowerGeo}>
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
      )}
      {geometries.trunkGeo && (
        <mesh geometry={geometries.trunkGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#4a3a2e" roughness={0.9} />
        </mesh>
      )}
      {geometries.canopyDarkGeo && (
        <mesh geometry={geometries.canopyDarkGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#3f7d3a" flatShading roughness={0.85} />
        </mesh>
      )}
      {geometries.canopyLightGeo && (
        <mesh geometry={geometries.canopyLightGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#4f8f45" flatShading roughness={0.85} />
        </mesh>
      )}
      {geometries.steelGeo && (
        <mesh geometry={geometries.steelGeo} castShadow>
          <meshStandardMaterial color="#9ca3af" metalness={0.7} roughness={0.3} />
        </mesh>
      )}
      {geometries.whiteLouverGeo && (
        <mesh geometry={geometries.whiteLouverGeo} castShadow>
          <meshStandardMaterial color="#f1f3f4" roughness={0.52} />
        </mesh>
      )}
      {geometries.blueTrimGeo && (
        <mesh geometry={geometries.blueTrimGeo}>
          <meshStandardMaterial color="#2f7fc1" roughness={0.4} />
        </mesh>
      )}
    </group>
  );
}
