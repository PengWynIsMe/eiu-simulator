import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  IcosahedronGeometry,
  Matrix4,
  PlaneGeometry,
  type CanvasTexture,
  type Group,
  type InstancedMesh,
} from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { characterConfig, FLOOR_HEIGHT } from '../../data';
import CharacterModel, { type CharacterHandle } from '../characters/CharacterModel';
import { SIT_Y_OFFSET } from '../npc/sitPose';
import { createInstanceMatrix } from './InteriorFurniture';
import {
  B4_ELEVATOR_POS_LOCAL,
  B4_GRAND_STAIR,
  B4_REAR_STAIR,
  getLocalFacingYaw,
  toWorld,
} from './layouts/b4';
import { addSwitchbackFlight } from './stairMesh';
import {
  applyB4BookAtlasRows,
  B4_BOOK_ATLAS_ROW_INDEXES,
  getCarpetTexture,
  getDdcHeaderTexture,
  getLibraryBookStairAtlas,
  getOpacScreenTexture,
  getPosterTexture,
  getReclaimedWoodTexture,
  getRoomPlaqueTexture,
  getTurnstileArrowTexture,
  type B4PosterKind,
} from './b4Textures';

interface FurnitureProps {
  floor: number;
  showUpperFloors?: boolean;
}

interface InstancedBatchProps {
  readonly batchKey: string;
  readonly matrices: readonly Matrix4[];
  readonly geometry: BufferGeometry;
  readonly color: string;
  readonly roughness?: number;
  readonly metalness?: number;
  readonly emissive?: string;
  readonly emissiveIntensity?: number;
  readonly transparent?: boolean;
  readonly opacity?: number;
  readonly castShadow?: boolean;
  readonly depthWrite?: boolean;
}

function InstancedBatch({
  matrices,
  geometry,
  color,
  roughness = 0.65,
  metalness = 0.08,
  emissive = '#000000',
  emissiveIntensity = 0,
  transparent = false,
  opacity = 1,
  castShadow = false,
  depthWrite = true,
}: InstancedBatchProps) {
  const meshRef = useRef<InstancedMesh | null>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < matrices.length; i++) {
      const mat = matrices[i];
      if (mat) mesh.setMatrixAt(i, mat);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  if (matrices.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, matrices.length]}
      castShadow={castShadow}
      receiveShadow={castShadow}
      frustumCulled={false}
    >
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        transparent={transparent}
        opacity={opacity}
        depthWrite={depthWrite}
      />
    </instancedMesh>
  );
}

interface TexturedBatchProps {
  readonly matrices: readonly Matrix4[];
  readonly geometry: BufferGeometry;
  readonly texture: CanvasTexture;
  readonly emissiveIntensity?: number;
}

function TexturedPlaneBatch({
  matrices,
  geometry,
  texture,
  emissiveIntensity = 0.12,
}: TexturedBatchProps) {
  const meshRef = useRef<InstancedMesh | null>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < matrices.length; i++) {
      const mat = matrices[i];
      if (mat) mesh.setMatrixAt(i, mat);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  if (matrices.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, matrices.length]} frustumCulled={false}>
      <meshStandardMaterial
        map={texture}
        roughness={0.35}
        emissive="#ffffff"
        emissiveMap={texture}
        emissiveIntensity={emissiveIntensity}
        side={DoubleSide}
      />
    </instancedMesh>
  );
}

// =============================================================================
// HÌNH HỌC THẢM TẤM 2 TÔNG MÀU (GỘP CHỈ 2 DRAW CALL CHO CẢ 3 TẦNG)
// =============================================================================

function makeCarpetQuad(u1: number, u2: number, v1: number, v2: number, y: number): BufferGeometry {
  const p00 = toWorld(u1, v1);
  const p10 = toWorld(u2, v1);
  const p11 = toWorld(u2, v2);
  const p01 = toWorld(u1, v2);

  const geo = new BufferGeometry();
  const positions = new Float32Array([
    p00[0], y, p00[1],
    p01[0], y, p01[1],
    p11[0], y, p11[1],
    p00[0], y, p00[1],
    p11[0], y, p11[1],
    p10[0], y, p10[1],
  ]);
  const normals = new Float32Array([
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
  ]);
  const scale = 0.5; // 1 tile texture = 2m × 2m (4 tấm thảm 50×50 cm)
  const uvs = new Float32Array([
    u1 * scale, v1 * scale,
    u1 * scale, v2 * scale,
    u2 * scale, v2 * scale,
    u1 * scale, v1 * scale,
    u2 * scale, v2 * scale,
    u2 * scale, v1 * scale,
  ]);
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  return geo;
}

// =============================================================================
// CÁC HÀM HỖ TRỢ LẮP ĐỒ NỘI THẤT INSTANCED
// =============================================================================

function addGlassRailing(
  postsSteel: Matrix4[],
  glassPanels: Matrix4[],
  handrails: Matrix4[],
  u1: number,
  v1: number,
  u2: number,
  v2: number,
  dy: number
): void {
  const len = Math.hypot(u2 - u1, v2 - v1);
  if (len < 0.2) return;
  const midU = (u1 + u2) * 0.5;
  const midV = (v1 + v2) * 0.5;
  const angle = Math.atan2(v2 - v1, u2 - u1);

  handrails.push(createInstanceMatrix(toWorld, midU, midV, dy + 1.04, angle, len, 0.045, 0.045));
  glassPanels.push(createInstanceMatrix(toWorld, midU, midV, dy + 0.54, angle, len - 0.04, 0.88, 0.025));

  const postCount = Math.max(2, Math.round(len / 1.4) + 1);
  for (let i = 0; i < postCount; i++) {
    const t = i / (postCount - 1);
    const pu = u1 + t * (u2 - u1);
    const pv = v1 + t * (v2 - v1);
    postsSteel.push(createInstanceMatrix(toWorld, pu, pv, dy + 0.52, 0, 0.045, 1.04, 0.045));
  }
}

function addTolixChair(
  seats: Matrix4[],
  backs: Matrix4[],
  legs: Matrix4[],
  u: number,
  v: number,
  dy: number,
  facingAngle: number
): void {
  seats.push(createInstanceMatrix(toWorld, u, v, dy + 0.44, facingAngle, 0.41, 0.025, 0.4));
  const bu = u - Math.sin(facingAngle) * 0.18;
  const bv = v - Math.cos(facingAngle) * 0.18;
  backs.push(createInstanceMatrix(toWorld, bu, bv, dy + 0.65, facingAngle, 0.37, 0.38, 0.022));

  const cosA = Math.cos(facingAngle);
  const sinA = Math.sin(facingAngle);
  for (const sx of [-0.16, 0.16]) {
    for (const sz of [-0.16, 0.16]) {
      const lu = u + sx * cosA - sz * sinA;
      const lv = v + sx * sinA + sz * cosA;
      legs.push(createInstanceMatrix(toWorld, lu, lv, dy + 0.22, facingAngle, 0.024, 0.43, 0.024));
    }
  }
}

function addTealChair(
  seats: Matrix4[],
  backs: Matrix4[],
  legs: Matrix4[],
  u: number,
  v: number,
  dy: number,
  facingAngle: number
): void {
  seats.push(createInstanceMatrix(toWorld, u, v, dy + 0.44, facingAngle, 0.44, 0.05, 0.42));
  const bu = u - Math.sin(facingAngle) * 0.19;
  const bv = v - Math.cos(facingAngle) * 0.19;
  backs.push(createInstanceMatrix(toWorld, bu, bv, dy + 0.67, facingAngle, 0.42, 0.36, 0.04));

  const cosA = Math.cos(facingAngle);
  const sinA = Math.sin(facingAngle);
  for (const sx of [-0.18, 0.18]) {
    for (const sz of [-0.17, 0.17]) {
      const lu = u + sx * cosA - sz * sinA;
      const lv = v + sx * sinA + sz * cosA;
      legs.push(createInstanceMatrix(toWorld, lu, lv, dy + 0.21, facingAngle, 0.024, 0.42, 0.024));
    }
  }
}

function addLoungeChair(
  bodies: Matrix4[],
  cushions: Matrix4[],
  legs: Matrix4[],
  u: number,
  v: number,
  dy: number,
  facingAngle: number
): void {
  cushions.push(createInstanceMatrix(toWorld, u, v, dy + 0.38, facingAngle, 0.68, 0.16, 0.68));
  const bu = u - Math.sin(facingAngle) * 0.28;
  const bv = v - Math.cos(facingAngle) * 0.28;
  bodies.push(createInstanceMatrix(toWorld, bu, bv, dy + 0.62, facingAngle, 0.68, 0.46, 0.14));
  for (const side of [-0.31, 0.31]) {
    const au = u + Math.cos(facingAngle) * side;
    const av = v - Math.sin(facingAngle) * side;
    bodies.push(createInstanceMatrix(toWorld, au, av, dy + 0.5, facingAngle, 0.09, 0.32, 0.66));
  }
  const cosA = Math.cos(facingAngle);
  const sinA = Math.sin(facingAngle);
  for (const sx of [-0.27, 0.27]) {
    for (const sz of [-0.27, 0.27]) {
      legs.push(
        createInstanceMatrix(toWorld, u + sx * cosA - sz * sinA, v + sx * sinA + sz * cosA, dy + 0.15, facingAngle, 0.04, 0.3, 0.04)
      );
    }
  }
}

function addDswPcChair(
  shells: Matrix4[],
  legs: Matrix4[],
  u: number,
  v: number,
  dy: number,
  facingAngle: number
): void {
  shells.push(createInstanceMatrix(toWorld, u, v, dy + 0.44, facingAngle, 0.44, 0.04, 0.42));
  const bu = u - Math.sin(facingAngle) * 0.18;
  const bv = v - Math.cos(facingAngle) * 0.18;
  shells.push(createInstanceMatrix(toWorld, bu, bv, dy + 0.66, facingAngle, 0.42, 0.36, 0.03));

  const cosA = Math.cos(facingAngle);
  const sinA = Math.sin(facingAngle);
  for (const sx of [-0.16, 0.16]) {
    for (const sz of [-0.16, 0.16]) {
      legs.push(
        createInstanceMatrix(toWorld, u + sx * cosA - sz * sinA, v + sx * sinA + sz * cosA, dy + 0.22, facingAngle, 0.03, 0.43, 0.03)
      );
    }
  }
}

function addBookshelfRow(
  shelfFrames: Matrix4[],
  shelfBoards: Matrix4[],
  endPanels: Matrix4[],
  booksRed: Matrix4[],
  booksBlue: Matrix4[],
  booksGold: Matrix4[],
  booksGreen: Matrix4[],
  booksWhite: Matrix4[],
  u: number,
  vCenter: number,
  dy: number,
  lengthV = 5.0
): void {
  // Dãy kệ đôi 6 tầng quay dọc theo trục V (hồi kệ gỗ hướng ra hành lang trung tâm)
  const half = lengthV * 0.5;
  for (const dv of [-half + 0.05, 0, half - 0.05]) {
    shelfFrames.push(createInstanceMatrix(toWorld, u, vCenter + dv, dy + 1.08, 0, 0.62, 2.16, 0.05));
  }
  shelfFrames.push(createInstanceMatrix(toWorld, u, vCenter, dy + 2.14, 0, 0.62, 0.04, lengthV));
  shelfFrames.push(createInstanceMatrix(toWorld, u, vCenter, dy + 0.05, 0, 0.62, 0.1, lengthV));

  // 5 đợt kệ bên trong + 1 tầng đáy -> 6 tầng sách
  for (let s = 0; s < 6; s++) {
    const sy = dy + 0.12 + s * 0.36;
    if (s > 0) {
      shelfBoards.push(createInstanceMatrix(toWorld, u, vCenter, sy, 0, 0.58, 0.025, lengthV - 0.12));
    }
    const bookY = sy + 0.14;
    for (const sideU of [-0.16, 0.16]) {
      const segCount = 5;
      const segLen = (lengthV - 0.4) / segCount;
      for (let b = 0; b < segCount; b++) {
        const bv = vCenter - half + 0.2 + (b + 0.5) * segLen;
        const idx = (s * 3 + b + (sideU > 0 ? 1 : 0)) % 5;
        const h = 0.21 + ((s + b) % 3) * 0.03;
        const mat = createInstanceMatrix(toWorld, u + sideU, bv, bookY, 0, 0.22, h, segLen * 0.88);
        if (idx === 0) booksBlue.push(mat);
        else if (idx === 1) booksRed.push(mat);
        else if (idx === 2) booksGold.push(mat);
        else if (idx === 3) booksGreen.push(mat);
        else booksWhite.push(mat);
      }
    }
  }

  // Hai tấm hồi kệ ốp gỗ sồi
  endPanels.push(createInstanceMatrix(toWorld, u, vCenter - half, dy + 1.08, 0, 0.66, 2.16, 0.04));
  endPanels.push(createInstanceMatrix(toWorld, u, vCenter + half, dy + 1.08, 0, 0.66, 2.16, 0.04));
}

function addWallOrGlassSection(
  solidSpandrels: Matrix4[],
  windowFrames: Matrix4[],
  glassPanels: Matrix4[],
  u1: number,
  v1: number,
  u2: number,
  v2: number,
  dy: number,
  mode: 'full-glass-white' | 'full-glass-dark' | 'frameless-glass' | 'ribbon-window',
  mullionStep = 2.4
): void {
  const len = Math.hypot(u2 - u1, v2 - v1);
  if (len < 0.2) return;
  const midU = (u1 + u2) * 0.5;
  const midV = (v1 + v2) * 0.5;
  const angle = Math.atan2(v2 - v1, u2 - u1);
  const rot = angle;

  if (mode === 'ribbon-window') {
    // Tường lửng trắng dưới (y: 0..1.05) + dầm trên (y: 2.85..3.8) + băng cửa sổ kính ở giữa
    solidSpandrels.push(createInstanceMatrix(toWorld, midU, midV, dy + 0.525, rot, len, 1.05, 0.16));
    solidSpandrels.push(createInstanceMatrix(toWorld, midU, midV, dy + 3.325, rot, len, 0.95, 0.16));
    glassPanels.push(createInstanceMatrix(toWorld, midU, midV, dy + 1.95, rot, len, 1.76, 0.04));

    windowFrames.push(createInstanceMatrix(toWorld, midU, midV, dy + 1.07, rot, len, 0.06, 0.1));
    windowFrames.push(createInstanceMatrix(toWorld, midU, midV, dy + 2.83, rot, len, 0.06, 0.1));
    const count = Math.max(2, Math.round(len / mullionStep) + 1);
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      windowFrames.push(
        createInstanceMatrix(toWorld, u1 + t * (u2 - u1), v1 + t * (v2 - v1), dy + 1.95, rot, 0.06, 1.8, 0.1)
      );
    }
    return;
  }

  glassPanels.push(createInstanceMatrix(toWorld, midU, midV, dy + 1.9, rot, len, 3.6, 0.04));
  if (mode === 'frameless-glass') {
    windowFrames.push(createInstanceMatrix(toWorld, midU, midV, dy + 0.04, rot, len, 0.06, 0.08));
    windowFrames.push(createInstanceMatrix(toWorld, midU, midV, dy + 3.74, rot, len, 0.08, 0.08));
    return;
  }

  windowFrames.push(createInstanceMatrix(toWorld, midU, midV, dy + 0.05, rot, len, 0.1, 0.09));
  windowFrames.push(createInstanceMatrix(toWorld, midU, midV, dy + 2.55, rot, len, 0.06, 0.08));
  windowFrames.push(createInstanceMatrix(toWorld, midU, midV, dy + 3.74, rot, len, 0.12, 0.09));
  const count = Math.max(2, Math.round(len / mullionStep) + 1);
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    windowFrames.push(
      createInstanceMatrix(toWorld, u1 + t * (u2 - u1), v1 + t * (v2 - v1), dy + 1.9, rot, 0.06, 3.7, 0.09)
    );
  }
}

function addPottedPlant(
  pots: Matrix4[],
  stems: Matrix4[],
  leaves: Matrix4[],
  u: number,
  v: number,
  dy: number,
  scale = 1
): void {
  const s = scale;
  pots.push(createInstanceMatrix(toWorld, u, v, dy + 0.27 * s, 0, 0.5 * s, 0.54 * s, 0.5 * s));
  stems.push(createInstanceMatrix(toWorld, u, v, dy + 0.62 * s, 0, 0.07 * s, 0.42 * s, 0.07 * s));
  leaves.push(createInstanceMatrix(toWorld, u, v, dy + 0.92 * s, 0.2, 0.58 * s, 0.52 * s, 0.58 * s));
  leaves.push(createInstanceMatrix(toWorld, u + 0.17 * s, v - 0.12 * s, dy + 0.82 * s, 0.9, 0.44 * s, 0.4 * s, 0.44 * s));
  leaves.push(createInstanceMatrix(toWorld, u - 0.16 * s, v + 0.14 * s, dy + 0.86 * s, -0.7, 0.42 * s, 0.38 * s, 0.42 * s));
  leaves.push(createInstanceMatrix(toWorld, u + 0.04 * s, v + 0.16 * s, dy + 1.06 * s, 1.4, 0.36 * s, 0.34 * s, 0.36 * s));
}

function addLightBlueSofa(
  sofas: Matrix4[],
  oakWood: Matrix4[],
  u: number,
  v: number,
  dy: number,
  facingAngle: number
): void {
  const cosA = Math.cos(facingAngle);
  const sinA = Math.sin(facingAngle);
  const place = (sx: number, sz: number): [number, number] => [
    u + sx * cosA - sz * sinA,
    v + sx * sinA + sz * cosA,
  ];

  // Đệm ngồi & tựa lưng xanh dương nhạt (3 chỗ)
  const [su, sv] = place(0, 0.04);
  sofas.push(createInstanceMatrix(toWorld, su, sv, dy + 0.36, facingAngle, 1.92, 0.18, 0.7));
  const [bu, bv] = place(0, -0.26);
  sofas.push(createInstanceMatrix(toWorld, bu, bv, dy + 0.62, facingAngle, 1.92, 0.44, 0.18));

  // Khung gỗ sồi đế sofa & thanh tựa lưng sau
  const [fbu, fbv] = place(0, 0.02);
  oakWood.push(createInstanceMatrix(toWorld, fbu, fbv, dy + 0.24, facingAngle, 1.98, 0.06, 0.72));
  const [rbu, rbv] = place(0, -0.36);
  oakWood.push(createInstanceMatrix(toWorld, rbu, rbv, dy + 0.76, facingAngle, 1.98, 0.06, 0.05));

  // 2 tay vịn & 4 chân gỗ
  for (const sx of [-0.99, 0.99]) {
    const [au, av] = place(sx, 0);
    oakWood.push(createInstanceMatrix(toWorld, au, av, dy + 0.56, facingAngle, 0.07, 0.06, 0.76));
    for (const sz of [-0.34, 0.34]) {
      const [lu, lv] = place(sx, sz);
      oakWood.push(createInstanceMatrix(toWorld, lu, lv, dy + 0.28, facingAngle, 0.07, 0.56, 0.07));
    }
  }
}

function addSideTurnstile2Lane(
  stainlessSteel: Matrix4[],
  blackSteel: Matrix4[],
  blueFlaps: Matrix4[],
  clearGlass: Matrix4[],
  turnstileArrows: Matrix4[],
  whiteFrames: Matrix4[],
  uCenter: number,
  vPos: number,
  vWall: number,
  dy: number,
  facingOutAngle: number
): void {
  const outSign = facingOutAngle === 0 ? 1 : -1;
  // Khung cửa kính phụ phía trên (y: 2.55..3.8) & thảm chân cửa ra vào
  whiteFrames.push(createInstanceMatrix(toWorld, uCenter, vWall, dy + 2.55, 0, 3.0, 0.08, 0.1));
  clearGlass.push(createInstanceMatrix(toWorld, uCenter, vWall, dy + 3.15, 0, 3.0, 1.15, 0.04));
  blackSteel.push(createInstanceMatrix(toWorld, uCenter, vWall - outSign * 0.4, dy + 0.014, 0, 2.5, 0.015, 0.75));

  // 3 trụ máy quét thẻ inox = 2 lane đi qua (giống ảnh cửa phụ thực tế)
  for (const offset of [-1.02, 0, 1.02]) {
    const pu = uCenter + offset;
    stainlessSteel.push(createInstanceMatrix(toWorld, pu, vPos, dy + 0.5, 0, 0.2, 1.0, 1.2));
    blackSteel.push(createInstanceMatrix(toWorld, pu, vPos, dy + 1.01, 0, 0.18, 0.03, 1.12));
  }
  // Cánh kính xanh ở cả 2 lane
  for (const laneU of [uCenter - 0.51, uCenter + 0.51]) {
    blueFlaps.push(createInstanceMatrix(toWorld, laneU, vPos, dy + 0.6, 0, 0.68, 0.52, 0.02));
  }
  // Mũi tên xanh LED hướng ra cửa trên trụ làn vào
  turnstileArrows.push(
    createInstanceMatrix(toWorld, uCenter + 1.02, vPos + outSign * 0.61, dy + 0.72, facingOutAngle, 0.14, 0.14, 1)
  );
  // 2 vách kính chắn ngoài nối 2 trụ ngoài vào tường kính
  for (const side of [-1, 1]) {
    clearGlass.push(createInstanceMatrix(toWorld, uCenter + side * 1.28, vPos, dy + 0.54, 0, 0.36, 0.92, 0.02));
    stainlessSteel.push(createInstanceMatrix(toWorld, uCenter + side * 1.46, vPos - 0.25, dy + 0.52, 0, 0.045, 1.04, 0.045));
    stainlessSteel.push(createInstanceMatrix(toWorld, uCenter + side * 1.46, vPos + 0.25, dy + 0.52, 0, 0.045, 1.04, 0.045));
  }
}

function getCharacterLocalYaw(du: number, dv: number): number {
  const p0 = toWorld(0, 0);
  const p1 = toWorld(du, dv);
  return Math.atan2(p1[0] - p0[0], p1[1] - p0[1]);
}

function LibraryStaffNpc() {
  const groupRef = useRef<Group>(null);
  const handle = useRef<CharacterHandle>(null);
  const interactTimerRef = useRef(2.5);
  const [sx, sz] = useMemo(() => toWorld(43.9, 13.86), []);
  const yaw = useMemo(() => getCharacterLocalYaw(0, -1), []);

  useFrame((_, delta) => {
    interactTimerRef.current -= Math.min(delta, 0.1);
    if (interactTimerRef.current <= 0) {
      interactTimerRef.current = 6.5;
      handle.current?.playUpper('interact');
    }
  });

  return (
    <group ref={groupRef} position={[sx, SIT_Y_OFFSET, sz]} rotation={[0, yaw, 0]}>
      <CharacterModel ref={handle} url={characterConfig.roles.playerAlt} clip="sit" />
    </group>
  );
}

// =============================================================================
// CẦU THANG GÁY SÁCH TRUNG TÂM (GRAND CENTRAL BOOK-SPINE STAIRCASE)
// =============================================================================

function GrandBookStaircase({
  baseFloor,
  currentFloor,
}: {
  baseFloor: number;
  currentFloor: number;
}) {
  const bookAtlas = useMemo(() => getLibraryBookStairAtlas(), []);
  const dy = (baseFloor - currentFloor) * FLOOR_HEIGHT;

  const {
    treadsGeo,
    stringersGeo,
    railsGeo,
    glassGeo,
    spineMatrices,
  } = useMemo(() => {
    const spec = B4_GRAND_STAIR;
    const treads: BufferGeometry[] = [];
    const stringers: BufferGeometry[] = [];
    const rails: BufferGeometry[] = [];
    const glass: BufferGeometry[] = [];
    const spines: Matrix4[] = [];

    const n = spec.stepsPerFlight;
    const vMid = spec.centerV;
    const hw = spec.width * 0.5;
    const yaw = getLocalFacingYaw(0);

    const addBoxWorld = (list: BufferGeometry[], u: number, v: number, y: number, sx: number, sy: number, sz: number) => {
      const [wx, wz] = toWorld(u, v);
      const box = new BoxGeometry(sx, sy, sz);
      box.rotateY(yaw);
      box.translate(wx, y, wz);
      list.push(box);
    };

    // Vế 1 (u: 62.5 -> 58.3, y: 0 -> 1.9)
    const run1 = (spec.startU - spec.midStartU) / n;
    const rise1 = 1.9 / n;
    for (let i = 0; i < n; i++) {
      const u = spec.startU - (i + 0.5) * run1;
      const topY = (i + 1) * rise1;
      // Mặt bậc đá granite xám
      addBoxWorld(treads, u, vMid, dy + topY - 0.02, run1 + 0.04, 0.04, spec.width);
      // Mặt dựng dán gáy sách quay hướng Đông (+u)
      const faceU = spec.startU - i * run1 + 0.005;
      spines.push(createInstanceMatrix(toWorld, faceU, vMid, dy + topY - rise1 * 0.5, -Math.PI / 2, spec.width - 0.04, rise1 - 0.014, 1));
    }

    // Chiếu nghỉ giữa (u: 58.3 -> 56.7, y: 1.9)
    addBoxWorld(treads, (spec.midStartU + spec.midEndU) * 0.5, vMid, dy + 1.88, spec.midStartU - spec.midEndU + 0.08, 0.04, spec.width);
    addBoxWorld(stringers, (spec.midStartU + spec.midEndU) * 0.5, vMid, dy + 1.76, spec.midStartU - spec.midEndU + 0.1, 0.2, spec.width);

    // Vế 2 (u: 56.7 -> 52.5, y: 1.9 -> 3.8)
    const run2 = (spec.midEndU - spec.endU) / n;
    const rise2 = 1.9 / n;
    for (let i = 0; i < n; i++) {
      const u = spec.midEndU - (i + 0.5) * run2;
      const topY = 1.9 + (i + 1) * rise2;
      addBoxWorld(treads, u, vMid, dy + topY - 0.02, run2 + 0.04, 0.04, spec.width);
      const faceU = spec.midEndU - i * run2 + 0.005;
      spines.push(createInstanceMatrix(toWorld, faceU, vMid, dy + topY - rise2 * 0.5, -Math.PI / 2, spec.width - 0.04, rise2 - 0.014, 1));
    }

    // 2 dầm cốn răng cưa kép dưới gầm thang (kiến trúc thật ảnh step_444 & step_604)
    const makeBeam = (uA: number, yA: number, uB: number, yB: number, vOff: number) => {
      const len = Math.hypot(uB - uA, yB - yA);
      const pitch = -Math.atan2(yB - yA, uA - uB);
      const [wx, wz] = toWorld((uA + uB) * 0.5, vMid + vOff);
      const beam = new BoxGeometry(len, 0.24, 0.22);
      beam.rotateZ(pitch);
      beam.rotateY(yaw);
      beam.translate(wx, dy + (yA + yB) * 0.5 - 0.16, wz);
      stringers.push(beam);
    };
    for (const vOff of [-0.68, 0.68]) {
      makeBeam(spec.startU, 0, spec.midStartU, 1.9, vOff);
      makeBeam(spec.midEndU, 1.9, spec.endU, 3.8, vOff);
    }

    // Lan can kính + tay vịn inox sáng hai bên vế thang
    for (const side of [-1, 1]) {
      const vRail = vMid + side * (hw - 0.05);
      // Trụ đứng inox dọc cầu thang
      for (const [pu, py] of [
        [spec.startU, 0],
        [(spec.startU + spec.midStartU) * 0.5, 0.95],
        [spec.midStartU, 1.9],
        [spec.midEndU, 1.9],
        [(spec.midEndU + spec.endU) * 0.5, 2.85],
        [spec.endU, 3.8],
      ] as const) {
        addBoxWorld(rails, pu, vRail, dy + py + 0.52, 0.045, 1.04, 0.045);
      }
      // Tay vịn inox nghiêng & kính cường lực nghiêng
      const addSlopedRail = (uA: number, yA: number, uB: number, yB: number) => {
        const len = Math.hypot(uB - uA, yB - yA);
        const pitch = -Math.atan2(yB - yA, uA - uB);
        const [wx, wz] = toWorld((uA + uB) * 0.5, vRail);
        const bar = new BoxGeometry(len + 0.1, 0.05, 0.05);
        bar.rotateZ(pitch);
        bar.rotateY(yaw);
        bar.translate(wx, dy + (yA + yB) * 0.5 + 1.02, wz);
        rails.push(bar);

        const pane = new BoxGeometry(len, 0.85, 0.02);
        pane.rotateZ(pitch);
        pane.rotateY(yaw);
        pane.translate(wx, dy + (yA + yB) * 0.5 + 0.52, wz);
        glass.push(pane);
      };
      addSlopedRail(spec.startU, 0, spec.midStartU, 1.9);
      addSlopedRail(spec.midEndU, 1.9, spec.endU, 3.8);

      // Đoạn ngang trên chiếu nghỉ
      addBoxWorld(rails, (spec.midStartU + spec.midEndU) * 0.5, vRail, dy + 1.9 + 1.02, spec.midStartU - spec.midEndU, 0.05, 0.05);
      addBoxWorld(glass, (spec.midStartU + spec.midEndU) * 0.5, vRail, dy + 1.9 + 0.52, spec.midStartU - spec.midEndU, 0.85, 0.02);
    }

    return {
      treadsGeo: treads.length ? BufferGeometryUtils.mergeGeometries(treads) : null,
      stringersGeo: stringers.length ? BufferGeometryUtils.mergeGeometries(stringers) : null,
      railsGeo: rails.length ? BufferGeometryUtils.mergeGeometries(rails) : null,
      glassGeo: glass.length ? BufferGeometryUtils.mergeGeometries(glass) : null,
      spineMatrices: spines,
    };
  }, [dy]);

  useEffect(() => {
    return () => {
      treadsGeo?.dispose();
      stringersGeo?.dispose();
      railsGeo?.dispose();
      glassGeo?.dispose();
    };
  }, [treadsGeo, stringersGeo, railsGeo, glassGeo]);

  const spineMeshRef = useRef<InstancedMesh | null>(null);
  useLayoutEffect(() => {
    const mesh = spineMeshRef.current;
    if (!mesh) return;
    spineMatrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  }, [spineMatrices]);

  return (
    <group>
      {treadsGeo && (
        <mesh geometry={treadsGeo} receiveShadow>
          <meshStandardMaterial color="#64748b" roughness={0.55} metalness={0.05} />
        </mesh>
      )}
      {stringersGeo && (
        <mesh geometry={stringersGeo}>
          <meshStandardMaterial color="#cbd5e1" roughness={0.65} />
        </mesh>
      )}
      {railsGeo && (
        <mesh geometry={railsGeo}>
          <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.2} />
        </mesh>
      )}
      {glassGeo && (
        <mesh geometry={glassGeo}>
          <meshStandardMaterial color="#bae6fd" transparent opacity={0.3} depthWrite={false} roughness={0.1} metalness={0.2} />
        </mesh>
      )}
      {spineMatrices.length > 0 && (
        <instancedMesh ref={spineMeshRef} args={[undefined, undefined, spineMatrices.length]} frustumCulled={false}>
          <planeGeometry>
            <instancedBufferAttribute attach="attributes-bookRow" args={[B4_BOOK_ATLAS_ROW_INDEXES, 1]} />
          </planeGeometry>
          <meshStandardMaterial map={bookAtlas} onBeforeCompile={applyB4BookAtlasRows} roughness={0.55} />
        </instancedMesh>
      )}
    </group>
  );
}

// =============================================================================
// COMPONENT CHÍNH: NỘI THẤT THƯ VIỆN EIU (BLOCK 4)
// =============================================================================

export default function B4Furniture({ floor, showUpperFloors = true }: FurnitureProps) {
  const sharedGeos = useMemo(
    () => ({
      box: new BoxGeometry(1, 1, 1),
      cyl: new CylinderGeometry(0.5, 0.5, 1, 12),
      plane: new PlaneGeometry(1, 1),
      foliage: new IcosahedronGeometry(0.5, 1),
    }),
    []
  );

  useEffect(() => {
    return () => {
      sharedGeos.box.dispose();
      sharedGeos.cyl.dispose();
      sharedGeos.plane.dispose();
      sharedGeos.foliage.dispose();
    };
  }, [sharedGeos]);

  const data = useMemo(() => {
    const greyCarpetQuads: BufferGeometry[] = [];
    const tanCarpetQuads: BufferGeometry[] = [];

    const ceilingSlabs: Matrix4[] = [];
    const ceilingBeams: Matrix4[] = [];
    const hvacDucts: Matrix4[] = [];
    const firePipes: Matrix4[] = [];
    const ledLights: Matrix4[] = [];
    const drywallSoffits: Matrix4[] = [];
    const waffleWoodGrid: Matrix4[] = [];
    const metalMeshCeilings: Matrix4[] = [];
    const pendantShades: Matrix4[] = [];

    const whiteCols: Matrix4[] = [];
    const greyCols: Matrix4[] = [];
    const darkColCaps: Matrix4[] = [];
    const redColCaps: Matrix4[] = [];

    const solidSpandrels: Matrix4[] = [];
    const whiteFrames: Matrix4[] = [];
    const darkFrames: Matrix4[] = [];
    const clearGlass: Matrix4[] = [];
    const frostedGlass: Matrix4[] = [];

    const oakWood: Matrix4[] = [];
    const roundOakTables: Matrix4[] = [];
    const walnutWood: Matrix4[] = [];
    const greyTables: Matrix4[] = [];
    const blackSteel: Matrix4[] = [];
    const stainlessSteel: Matrix4[] = [];
    const blueFlaps: Matrix4[] = [];
    const concreteCounters: Matrix4[] = [];
    const lightGreyCabinets: Matrix4[] = [];

    const tolixSeats: Matrix4[] = [];
    const tolixBacks: Matrix4[] = [];
    const tolixLegs: Matrix4[] = [];
    const tealSeats: Matrix4[] = [];
    const tealBacks: Matrix4[] = [];
    const tealLegs: Matrix4[] = [];
    const dswShells: Matrix4[] = [];
    const dswLegs: Matrix4[] = [];
    const loungeBodies: Matrix4[] = [];
    const loungeCushions: Matrix4[] = [];
    const lightBlueSofas: Matrix4[] = [];
    const wavyTealSofas: Matrix4[] = [];

    const monitorBodies: Matrix4[] = [];
    const monitorScreens: Matrix4[] = [];
    const turnstileArrows: Matrix4[] = [];
    const keyboards: Matrix4[] = [];
    const fireExtinguishers: Matrix4[] = [];

    const shelfFrames: Matrix4[] = [];
    const shelfBoards: Matrix4[] = [];
    const shelfEndPanels: Matrix4[] = [];
    const booksRed: Matrix4[] = [];
    const booksBlue: Matrix4[] = [];
    const booksGold: Matrix4[] = [];
    const booksGreen: Matrix4[] = [];
    const booksWhite: Matrix4[] = [];
    const cubbyBinsTerra: Matrix4[] = [];
    const cubbyBinsBrown: Matrix4[] = [];

    const railPosts: Matrix4[] = [];
    const railGlass: Matrix4[] = [];
    const railHands: Matrix4[] = [];

    const plantPots: Matrix4[] = [];
    const plantLeaves: Matrix4[] = [];
    const orchidWhite: Matrix4[] = [];
    const orchidPurple: Matrix4[] = [];
    const stairSteps: Matrix4[] = [];
    const stairSoffits: Matrix4[] = [];
    const stairRails: Matrix4[] = [];

    const minF = 1;
    const maxF = showUpperFloors ? 3 : floor;

    for (let f = minF; f <= maxF; f++) {
      const dy = (f - floor) * FLOOR_HEIGHT;
      const renderCeiling = showUpperFloors || f < floor;

      // -----------------------------------------------------------------------
      // 1. THẢM TẤM 2 TÔNG MÀU (LỐI ĐI XÁM / KHU ĐỌC BE)
      // -----------------------------------------------------------------------
      const floorY = dy + 0.008;
      if (f === 1) {
        greyCarpetQuads.push(
          makeCarpetQuad(0.2, 67.0, 10.5, 17.5, floorY)
        );
        tanCarpetQuads.push(
          makeCarpetQuad(0.2, 66.8, 0.2, 10.5, floorY),
          makeCarpetQuad(11.5, 66.8, 17.5, 27.8, floorY)
        );
      } else if (f === 2) {
        greyCarpetQuads.push(
          makeCarpetQuad(0.2, 50.8, 10.5, 17.5, floorY),
          makeCarpetQuad(59.8, 67.0, 10.5, 17.5, floorY),
          makeCarpetQuad(50.8, 59.8, 10.5, 12.4, floorY),
          makeCarpetQuad(50.8, 59.8, 15.6, 17.5, floorY)
        );
        tanCarpetQuads.push(
          makeCarpetQuad(11.5, 66.8, 0.2, 10.5, floorY),
          makeCarpetQuad(11.5, 66.8, 17.5, 27.8, floorY)
        );
      } else {
        greyCarpetQuads.push(
          makeCarpetQuad(0.2, 50.8, 10.5, 17.5, floorY),
          makeCarpetQuad(59.8, 67.0, 10.5, 17.5, floorY),
          makeCarpetQuad(50.8, 59.8, 10.5, 12.4, floorY),
          makeCarpetQuad(50.8, 59.8, 15.6, 17.5, floorY),
          makeCarpetQuad(11.5, 27.5, 0.2, 10.5, floorY),
          makeCarpetQuad(39.5, 66.8, 0.2, 10.5, floorY),
          makeCarpetQuad(11.5, 27.5, 17.5, 27.8, floorY),
          makeCarpetQuad(39.5, 66.8, 17.5, 27.8, floorY)
        );
        tanCarpetQuads.push(
          makeCarpetQuad(27.5, 39.5, 0.2, 10.5, floorY),
          makeCarpetQuad(27.5, 39.5, 17.5, 27.8, floorY),
          makeCarpetQuad(17.5, 25.0, 1.2, 8.8, dy + 0.012),
          makeCarpetQuad(40.5, 48.0, 19.2, 26.8, dy + 0.012)
        );
      }

      // -----------------------------------------------------------------------
      // 2. TRẦN HỞ CÔNG NGHIỆP, ỐNG GIÓ, ĐÈN LED & ĐẶC TRƯNG TỪNG TẦNG
      // -----------------------------------------------------------------------
      if (renderCeiling) {
        // Trần sơn đen hở kỹ thuật (chừa 2 giếng thang)
        if (f === 3) {
          ceilingSlabs.push(createInstanceMatrix(toWorld, 33.5, 14.0, dy + 3.74, 0, 67.0, 0.08, 28.0));
        } else {
          ceilingSlabs.push(createInstanceMatrix(toWorld, 33.5, 6.2, dy + 3.74, 0, 67.0, 0.08, 12.4));
          ceilingSlabs.push(createInstanceMatrix(toWorld, 33.5, 21.8, dy + 3.74, 0, 67.0, 0.08, 12.4));
          ceilingSlabs.push(createInstanceMatrix(toWorld, 30.4, 14.0, dy + 3.74, 0, 40.8, 0.08, 3.2));
          ceilingSlabs.push(createInstanceMatrix(toWorld, 63.4, 14.0, dy + 3.74, 0, 7.2, 0.08, 3.2));
        }

        // Dầm bê tông đen ngang & dọc (dầm u = 56.5 chừa khoảng thông giếng thang ở Tầng 1–2)
        for (const u of [12.0, 23.0, 34.5, 46.0, 56.5]) {
          if (f < 3 && u === 56.5) {
            ceilingBeams.push(createInstanceMatrix(toWorld, u, 6.325, dy + 3.55, 0, 0.45, 0.34, 12.15));
            ceilingBeams.push(createInstanceMatrix(toWorld, u, 21.675, dy + 3.55, 0, 0.45, 0.34, 12.15));
          } else {
            ceilingBeams.push(createInstanceMatrix(toWorld, u, 14.0, dy + 3.55, 0, 0.45, 0.34, 27.5));
          }
        }
        ceilingBeams.push(createInstanceMatrix(toWorld, 33.5, 10.5, dy + 3.55, 0, 65.0, 0.34, 0.42));
        ceilingBeams.push(createInstanceMatrix(toWorld, 33.5, 17.5, dy + 3.55, 0, 65.0, 0.34, 0.42));

        // Ống gió HVAC bạc chạy dọc 2 cánh Bắc & Nam + ống PCCC đỏ
        hvacDucts.push(createInstanceMatrix(toWorld, 39.0, 6.2, dy + 3.44, 0, 52.0, 0.32, 0.72));
        hvacDucts.push(createInstanceMatrix(toWorld, 39.0, 21.8, dy + 3.44, 0, 52.0, 0.32, 0.72));
        firePipes.push(createInstanceMatrix(toWorld, 33.5, 11.2, dy + 3.36, 0, 56.0, 0.09, 0.09));

        if (f === 1) {
          // Trần thạch cao trắng khu tiền sảnh cổng quẹt thẻ
          drywallSoffits.push(createInstanceMatrix(toWorld, 66.1, 14.0, dy + 3.32, 0, 1.8, 0.06, 7.0));
          // Trần lưới kim loại & 2 đèn chụp đen Góc trao đổi sách
          metalMeshCeilings.push(createInstanceMatrix(toWorld, 5.8, 5.2, dy + 3.36, 0, 10.4, 0.04, 9.2));
          for (const [lu, lv] of [[4.5, 4.2], [8.2, 5.6]] as const) {
            blackSteel.push(createInstanceMatrix(toWorld, lu, lv, dy + 3.1, 0, 0.03, 0.55, 0.03));
            pendantShades.push(createInstanceMatrix(toWorld, lu, lv, dy + 2.75, 0, 0.55, 0.24, 0.55));
          }
          for (let u = 14.0; u <= 63.0; u += 5.5) {
            for (const v of [4.8, 14.0, 23.2]) {
              if (v === 14.0 && u >= 52.0) continue;
              ledLights.push(createInstanceMatrix(toWorld, u, v, dy + 3.25, 0, 2.2, 0.05, 0.14));
            }
          }
        } else if (f === 2) {
          // Dải trần thạch cao hành lang giữa với 2 dải đèn LED chạy suốt hành lang (step_394)
          drywallSoffits.push(createInstanceMatrix(toWorld, 31.8, 14.0, dy + 3.34, 0, 40.5, 0.08, 3.4));
          ledLights.push(createInstanceMatrix(toWorld, 31.8, 12.45, dy + 3.29, 0, 40.0, 0.04, 0.12));
          ledLights.push(createInstanceMatrix(toWorld, 31.8, 15.55, dy + 3.29, 0, 40.0, 0.04, 0.12));
          for (let u = 15.0; u <= 63.0; u += 5.5) {
            for (const v of [4.8, 20.5, 25.2]) {
              ledLights.push(createInstanceMatrix(toWorld, u, v, dy + 3.26, 0, 2.1, 0.05, 0.12));
            }
          }
        } else {
          // Tầng 3: Trần gỗ ô caro phía trên bàn tròn & khu đọc + Đèn LED zíc-zắc ở góc đọc sách
          for (let i = 0; i <= 12; i++) {
            const gu = 41.2 + (i / 12) * 8.4;
            waffleWoodGrid.push(createInstanceMatrix(toWorld, gu, 14.0, dy + 3.22, 0, 0.07, 0.18, 5.4));
          }
          for (let j = 0; j <= 8; j++) {
            const gv = 11.3 + (j / 8) * 5.4;
            waffleWoodGrid.push(createInstanceMatrix(toWorld, 45.4, gv, dy + 3.22, 0, 8.4, 0.18, 0.07));
          }
          // Đèn LED trên khu kệ sách
          for (const u of [14.5, 19.5, 42.5, 47.5, 54.5, 59.5]) {
            for (const v of [5.5, 22.5]) {
              ledLights.push(createInstanceMatrix(toWorld, u, v, dy + 3.26, 0, 2.4, 0.05, 0.1));
            }
          }
          // Đèn LED zíc-zắc trên Góc đọc sách cửa sổ Bắc & Nam (step_600_shot_1)
          for (const vBase of [4.2, 23.8]) {
            for (let z = 0; z < 4; z++) {
              const zu = 29.5 + z * 2.1;
              const zv = vBase + (z % 2 === 0 ? -0.5 : 0.5);
              const rotZ = z % 2 === 0 ? 0.45 : -0.45;
              ledLights.push(createInstanceMatrix(toWorld, zu, zv, dy + 3.22, rotZ, 2.4, 0.06, 0.12));
            }
          }
        }
      }

      // -----------------------------------------------------------------------
      // 3. LƯỚI CỘT CHỊU LỰC & BẢNG CHỮ ZONE A / B / C THEO ĐÚNG MÀU TỪNG TẦNG
      // -----------------------------------------------------------------------
      if (f === 1) {
        // Phía Bắc (bên phải từ cửa chính): 3 cột trắng độc lập (u = 52.0, 32.5, 22.0) + 1 trụ xám gắn cuối tường ngăn (u = 43.0)
        for (const u of [52.0, 32.5, 22.0]) {
          whiteCols.push(createInstanceMatrix(toWorld, u, 10.5, dy + FLOOR_HEIGHT * 0.5, 0, 0.65, FLOOR_HEIGHT, 0.65));
          darkColCaps.push(createInstanceMatrix(toWorld, u, 10.5, dy + 3.16, 0, 0.68, 0.46, 0.68));
        }
        concreteCounters.push(createInstanceMatrix(toWorld, 43.0, 10.5, dy + FLOOR_HEIGHT * 0.5, 0, 0.72, FLOOR_HEIGHT, 0.72));

        // Phía Nam (bên trái từ cửa chính): 4 cột trắng độc lập thẳng hàng (u = 52.0, 43.0, 32.5, 22.0)
        for (const u of [52.0, 43.0, 32.5, 22.0]) {
          whiteCols.push(createInstanceMatrix(toWorld, u, 17.5, dy + FLOOR_HEIGHT * 0.5, 0, 0.65, FLOOR_HEIGHT, 0.65));
          darkColCaps.push(createInstanceMatrix(toWorld, u, 17.5, dy + 3.16, 0, 0.68, 0.46, 0.68));
        }
      } else {
        for (const u of [14.0, 24.5, 34.5, 45.5, 56.5]) {
          for (const v of [10.5, 17.5]) {
            if (f === 3) {
              greyCols.push(createInstanceMatrix(toWorld, u, v, dy + FLOOR_HEIGHT * 0.5, 0, 0.65, FLOOR_HEIGHT, 0.65));
            } else {
              whiteCols.push(createInstanceMatrix(toWorld, u, v, dy + FLOOR_HEIGHT * 0.5, 0, 0.65, FLOOR_HEIGHT, 0.65));
              redColCaps.push(createInstanceMatrix(toWorld, u, v, dy + FLOOR_HEIGHT - 0.22, 0, 0.68, 0.44, 0.68));
              redColCaps.push(createInstanceMatrix(toWorld, u, v, dy + 0.08, 0, 0.68, 0.16, 0.68));
            }
          }
        }
      }

      // -----------------------------------------------------------------------
      // 4. MẶT DỰNG KÍNH & CỬA SỔ BĂNG NGANG BÊN NGOÀI
      // -----------------------------------------------------------------------
      if (f === 1) {
        addWallOrGlassSection(solidSpandrels, whiteFrames, clearGlass, 0.0, 0.05, 11.5, 0.05, dy, 'frameless-glass');
        addWallOrGlassSection(solidSpandrels, whiteFrames, clearGlass, 11.5, 0.05, 47.0, 0.05, dy, 'full-glass-white', 2.5);
        addWallOrGlassSection(solidSpandrels, whiteFrames, clearGlass, 50.0, 0.05, 67.0, 0.05, dy, 'full-glass-white', 2.5);
        addWallOrGlassSection(solidSpandrels, whiteFrames, clearGlass, 0.0, 27.95, 47.0, 27.95, dy, 'full-glass-white', 2.5);
        addWallOrGlassSection(solidSpandrels, whiteFrames, clearGlass, 50.0, 27.95, 67.0, 27.95, dy, 'full-glass-white', 2.5);
        // Vách kính lớn đầu Đông (cửa chính nhìn ra hồ B4–B5)
        addWallOrGlassSection(solidSpandrels, darkFrames, clearGlass, 66.95, 0.05, 66.95, 12.2, dy, 'full-glass-dark', 2.4);
        addWallOrGlassSection(solidSpandrels, darkFrames, clearGlass, 66.95, 15.8, 66.95, 27.95, dy, 'full-glass-dark', 2.4);
        // Phần kính phía trên cửa chính (y: 2.55..3.8)
        darkFrames.push(createInstanceMatrix(toWorld, 66.95, 14.0, dy + 2.55, Math.PI / 2, 3.6, 0.08, 0.1));
        clearGlass.push(createInstanceMatrix(toWorld, 66.95, 14.0, dy + 3.15, Math.PI / 2, 3.6, 1.15, 0.04));
      } else {
        addWallOrGlassSection(solidSpandrels, whiteFrames, clearGlass, 11.5, 0.05, 67.0, 0.05, dy, 'ribbon-window', 2.5);
        addWallOrGlassSection(solidSpandrels, whiteFrames, clearGlass, 11.5, 27.95, 67.0, 27.95, dy, 'ribbon-window', 2.5);
        addWallOrGlassSection(solidSpandrels, whiteFrames, clearGlass, 66.95, 0.05, 66.95, 27.95, dy, 'ribbon-window', 2.5);
      }

      // -----------------------------------------------------------------------
      // 5. CHI TIẾT NỘI THẤT TỪNG TẦNG
      // -----------------------------------------------------------------------
      if (f === 1) {
        // A. Tiền sảnh kính (đẩy sát cửa Đông u = 65.2..67) + 3 trụ 2 lane cửa chính & 2 cửa phụ (Bắc + Nam hướng về B3)
        addWallOrGlassSection(solidSpandrels, whiteFrames, clearGlass, 65.2, 10.5, 67.0, 10.5, dy, 'full-glass-white', 1.6);
        addWallOrGlassSection(solidSpandrels, whiteFrames, clearGlass, 65.2, 17.5, 67.0, 17.5, dy, 'full-glass-white', 1.6);
        addWallOrGlassSection(solidSpandrels, whiteFrames, clearGlass, 65.2, 10.5, 65.2, 12.2, dy, 'full-glass-white', 1.7);
        addWallOrGlassSection(solidSpandrels, whiteFrames, clearGlass, 65.2, 15.8, 65.2, 17.5, dy, 'full-glass-white', 1.7);
        whiteFrames.push(createInstanceMatrix(toWorld, 65.2, 14.0, dy + 3.18, Math.PI / 2, 3.6, 1.24, 0.06));
        clearGlass.push(createInstanceMatrix(toWorld, 65.2, 14.0, dy + 3.18, Math.PI / 2, 3.6, 1.18, 0.03));

        for (const tv of [12.5, 14.0, 15.5]) {
          stainlessSteel.push(createInstanceMatrix(toWorld, 65.2, tv, dy + 0.5, 0, 1.2, 1.0, 0.22));
          blackSteel.push(createInstanceMatrix(toWorld, 65.2, tv, dy + 1.01, 0, 1.12, 0.03, 0.2));
          turnstileArrows.push(createInstanceMatrix(toWorld, 65.82, tv, dy + 0.72, -Math.PI / 2, 0.14, 0.14, 1));
          if (tv < 15.0) {
            blueFlaps.push(createInstanceMatrix(toWorld, 65.2, tv + 0.75, dy + 0.6, 0, 0.02, 0.52, 0.48));
          }
        }
        // Cửa phụ phía Bắc (khu in ấn) & cửa phụ phía Nam (hướng về B3): đều có 3 trụ = 2 lane máy quét thẻ
        addSideTurnstile2Lane(
          stainlessSteel,
          blackSteel,
          blueFlaps,
          clearGlass,
          turnstileArrows,
          whiteFrames,
          48.5,
          1.15,
          0.05,
          dy,
          Math.PI
        );
        addSideTurnstile2Lane(
          stainlessSteel,
          blackSteel,
          blueFlaps,
          clearGlass,
          turnstileArrows,
          whiteFrames,
          48.5,
          26.85,
          27.95,
          dy,
          0
        );

        // B. 2 Phòng máy tính tra cứu OPAC (Bắc & Nam cầu thang: 8 dãy bàn × 6 máy = 48 máy)
        for (const u of [54.2, 57.6, 61.0, 64.4]) {
          for (const vCenter of [4.9, 23.1]) {
            walnutWood.push(createInstanceMatrix(toWorld, u, vCenter, dy + 0.74, 0, 1.25, 0.05, 5.1));
            blackSteel.push(createInstanceMatrix(toWorld, u, vCenter - 2.25, dy + 0.36, 0, 1.1, 0.72, 0.06));
            blackSteel.push(createInstanceMatrix(toWorld, u, vCenter + 2.25, dy + 0.36, 0, 1.1, 0.72, 0.06));
            blackSteel.push(createInstanceMatrix(toWorld, u, vCenter, dy + 0.85, 0, 0.05, 0.2, 5.0));

            for (const dv of [-1.6, 0, 1.6]) {
              const mv = vCenter + dv;
              // 3 máy quay Tây (-u) + 3 máy quay Đông (+u)
              monitorBodies.push(createInstanceMatrix(toWorld, u - 0.18, mv, dy + 1.06, 0, 0.05, 0.36, 0.56));
              monitorScreens.push(createInstanceMatrix(toWorld, u - 0.21, mv, dy + 1.06, Math.PI / 2, 0.52, 0.32, 1));
              keyboards.push(createInstanceMatrix(toWorld, u - 0.42, mv, dy + 0.77, 0, 0.16, 0.02, 0.42));
              addDswPcChair(dswShells, dswLegs, u - 0.85, mv, dy, Math.PI / 2);

              monitorBodies.push(createInstanceMatrix(toWorld, u + 0.18, mv, dy + 1.06, 0, 0.05, 0.36, 0.56));
              monitorScreens.push(createInstanceMatrix(toWorld, u + 0.21, mv, dy + 1.06, -Math.PI / 2, 0.52, 0.32, 1));
              keyboards.push(createInstanceMatrix(toWorld, u + 0.42, mv, dy + 0.77, 0, 0.16, 0.02, 0.42));
              addDswPcChair(dswShells, dswLegs, u + 0.85, mv, dy, -Math.PI / 2);
            }
          }
        }

        // C. Vách tường ngăn xám sau lưng khu In ấn & Tủ gửi đồ 36 ngăn (u = 43.0, nối tường kính Bắc tới trụ xám)
        concreteCounters.push(createInstanceMatrix(toWorld, 43.0, 5.35, dy + FLOOR_HEIGHT * 0.5, 0, 0.26, FLOOR_HEIGHT, 10.3));
        // Tủ gửi đồ 36 ngăn (9 cột × 4 hàng) áp sát mặt Đông bức tường ngăn tại u = 43.45, v = 4.0..9.4
        lightGreyCabinets.push(createInstanceMatrix(toWorld, 43.45, 6.7, dy + 0.72, 0, 0.56, 1.44, 5.4));
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 9; c++) {
            blackSteel.push(
              createInstanceMatrix(toWorld, 43.74, 4.3 + c * 0.6, dy + 0.22 + r * 0.32, 0, 0.01, 0.018, 0.24)
            );
          }
        }
        addPottedPlant(plantPots, walnutWood, plantLeaves, 43.45, 9.0, dy + 1.44, 0.55);
        // 2 Máy in đa năng Konica Minolta áp sát mặt Đông bức tường ngăn cạnh cửa hông B11
        for (const pv of [1.65, 2.85]) {
          lightGreyCabinets.push(createInstanceMatrix(toWorld, 43.55, pv, dy + 0.28, 0, 0.72, 0.56, 0.72));
          blackSteel.push(createInstanceMatrix(toWorld, 43.55, pv, dy + 0.78, 0, 0.68, 0.44, 0.68));
          lightGreyCabinets.push(createInstanceMatrix(toWorld, 43.55, pv, dy + 1.04, 0, 0.64, 0.08, 0.64));
        }

        // D. Quầy thông tin dài (u = 37.5..46.3, v = 13.0..15.0) với 4 máy tính bàn & cổng nan gỗ đầu Tây
        oakWood.push(createInstanceMatrix(toWorld, 41.9, 13.15, dy + 0.55, 0, 8.8, 1.1, 0.38));
        oakWood.push(createInstanceMatrix(toWorld, 41.9, 14.85, dy + 0.55, 0, 8.8, 1.1, 0.38));
        oakWood.push(createInstanceMatrix(toWorld, 46.15, 14.0, dy + 0.55, 0, 0.38, 1.1, 2.0));
        concreteCounters.push(createInstanceMatrix(toWorld, 41.9, 13.15, dy + 1.12, 0, 8.85, 0.06, 0.44));
        concreteCounters.push(createInstanceMatrix(toWorld, 41.9, 14.85, dy + 1.12, 0, 8.85, 0.06, 0.44));
        concreteCounters.push(createInstanceMatrix(toWorld, 46.15, 14.0, dy + 1.12, 0, 0.44, 0.06, 2.04));
        // Cửa lùa nan gỗ ở đầu Tây quầy (u = 37.45)
        for (const gv of [13.55, 14.45]) {
          oakWood.push(createInstanceMatrix(toWorld, 37.45, gv, dy + 0.85, 0, 0.06, 0.07, 0.68));
          oakWood.push(createInstanceMatrix(toWorld, 37.45, gv, dy + 0.15, 0, 0.06, 0.07, 0.68));
          for (let sl = -2; sl <= 2; sl++) {
            oakWood.push(createInstanceMatrix(toWorld, 37.45, gv + sl * 0.12, dy + 0.5, 0, 0.04, 0.66, 0.04));
          }
        }
        // 4 máy tính bàn trên quầy sảnh (2 cánh Bắc + 2 cánh Nam) kèm ghế ngồi (chị nhân viên ngồi tại 43.9, 13.86)
        for (const mu of [39.5, 43.9]) {
          blackSteel.push(createInstanceMatrix(toWorld, mu, 13.14, dy + 1.19, 0, 0.06, 0.12, 0.08));
          monitorBodies.push(createInstanceMatrix(toWorld, mu, 13.15, dy + 1.36, 0, 0.55, 0.36, 0.05));
          monitorScreens.push(createInstanceMatrix(toWorld, mu, 13.185, dy + 1.36, 0, 0.51, 0.32, 1));
          keyboards.push(createInstanceMatrix(toWorld, mu, 13.32, dy + 1.16, 0, 0.44, 0.02, 0.14));
          addTealChair(blackSteel, blackSteel, blackSteel, mu, 13.86, dy, Math.PI);
        }
        for (const mu of [38.9, 42.5]) {
          blackSteel.push(createInstanceMatrix(toWorld, mu, 14.86, dy + 1.19, 0, 0.06, 0.12, 0.08));
          monitorBodies.push(createInstanceMatrix(toWorld, mu, 14.85, dy + 1.36, 0, 0.55, 0.36, 0.05));
          monitorScreens.push(createInstanceMatrix(toWorld, mu, 14.815, dy + 1.36, Math.PI, 0.51, 0.32, 1));
          keyboards.push(createInstanceMatrix(toWorld, mu, 14.68, dy + 1.16, 0, 0.44, 0.02, 0.14));
          addTealChair(blackSteel, blackSteel, blackSteel, mu, 14.18, dy, 0);
        }
        // Chậu cây nhỏ & chồng sách trên mặt quầy thông tin
        addPottedPlant(plantPots, walnutWood, plantLeaves, 45.4, 13.14, dy + 1.15, 0.42);
        booksBlue.push(createInstanceMatrix(toWorld, 44.7, 13.16, dy + 1.18, 0, 0.28, 0.06, 0.22));
        booksRed.push(createInstanceMatrix(toWorld, 44.7, 13.16, dy + 1.24, 0.08, 0.26, 0.05, 0.2));

        // 5 đôn da nâu & bàn tròn xám đầu Tây quầy thông tin (trên thảm xám)
        for (const [ou, ov] of [
          [35.9, 13.1],
          [36.3, 14.7],
          [34.9, 13.3],
          [34.7, 14.7],
          [35.5, 15.3],
        ] as const) {
          cubbyBinsTerra.push(createInstanceMatrix(toWorld, ou, ov, dy + 0.225, 0, 0.52, 0.45, 0.52));
        }
        plantPots.push(createInstanceMatrix(toWorld, 35.5, 14.0, dy + 0.23, 0, 0.68, 0.46, 0.68));

        // 2 ghế sofa xanh dương: (1) áp sát mặt Tây vách ngăn xám, (2) cạnh cột Nam ngang đầu quầy
        addLightBlueSofa(lightBlueSofas, oakWood, 42.35, 7.6, dy, Math.PI / 2);
        addLightBlueSofa(lightBlueSofas, oakWood, 41.2, 19.0, dy, Math.PI);

        // E. Các cụm bàn tự học gỗ sồi + ghế Tolix đen (6 cụm hai bên + 2 bàn giữa)
        for (const u of [16.8, 27.2, 37.5]) {
          for (const v of [4.6, 23.4]) {
            oakWood.push(createInstanceMatrix(toWorld, u, v, dy + 0.74, 0, 2.5, 0.06, 1.05));
            blackSteel.push(createInstanceMatrix(toWorld, u - 1.1, v, dy + 0.36, 0, 0.06, 0.72, 0.95));
            blackSteel.push(createInstanceMatrix(toWorld, u + 1.1, v, dy + 0.36, 0, 0.06, 0.72, 0.95));
            for (const du of [-0.65, 0.65]) {
              addTolixChair(tolixSeats, tolixBacks, tolixLegs, u + du, v - 0.7, dy, 0);
              addTolixChair(tolixSeats, tolixBacks, tolixLegs, u + du, v + 0.7, dy, Math.PI);
            }
          }
        }
        // 2 bàn đọc giữa hành lang (theo sơ đồ Tầng 1)
        for (const u of [18.0, 26.5]) {
          oakWood.push(createInstanceMatrix(toWorld, u, 14.0, dy + 0.74, 0, 1.05, 0.06, 2.6));
          blackSteel.push(createInstanceMatrix(toWorld, u, 12.85, dy + 0.36, 0, 0.95, 0.72, 0.06));
          blackSteel.push(createInstanceMatrix(toWorld, u, 15.15, dy + 0.36, 0, 0.95, 0.72, 0.06));
          for (const dv of [-0.7, 0.7]) {
            addTolixChair(tolixSeats, tolixBacks, tolixLegs, u - 0.7, 14.0 + dv, dy, Math.PI / 2);
            addTolixChair(tolixSeats, tolixBacks, tolixLegs, u + 0.7, 14.0 + dv, dy, -Math.PI / 2);
          }
        }

        // F. Góc trao đổi sách (Book Exchange Corner u = 0.5..11.5, v = 0.5..10.0)
        // Kệ ô vuông mở bậc thang bằng gỗ sồi + thùng vải nâu/đất nung có tay nắm tối & sách
        oakWood.push(createInstanceMatrix(toWorld, 11.3, 4.4, dy + 0.48, 0, 0.04, 0.94, 4.5));
        oakWood.push(createInstanceMatrix(toWorld, 11.3, 4.4, dy + 1.16, 0, 0.04, 0.46, 2.9));
        for (const [sy, sz] of [
          [0.04, 4.5],
          [0.49, 4.5],
          [0.94, 4.5],
          [1.38, 2.9],
        ] as const) {
          oakWood.push(createInstanceMatrix(toWorld, 11.08, 4.4, dy + sy, 0, 0.44, 0.035, sz));
        }
        for (let i = 0; i <= 8; i++) {
          oakWood.push(createInstanceMatrix(toWorld, 11.08, 2.18 + i * 0.555, dy + 0.49, 0, 0.44, 0.92, 0.035));
        }
        for (let i = 0; i <= 5; i++) {
          oakWood.push(createInstanceMatrix(toWorld, 11.08, 3.0 + i * 0.56, dy + 1.16, 0, 0.44, 0.46, 0.035));
        }
        for (let i = 0; i < 8; i++) {
          const bv = 2.4575 + i * 0.555;
          // Hàng 1 (dưới cùng): 8 thùng vải xen kẽ
          const mat1 = createInstanceMatrix(toWorld, 11.05, bv, dy + 0.26, 0, 0.38, 0.36, 0.44);
          if (i % 2 === 0) cubbyBinsBrown.push(mat1);
          else cubbyBinsTerra.push(mat1);
          blackSteel.push(createInstanceMatrix(toWorld, 10.855, bv, dy + 0.3, 0, 0.015, 0.04, 0.14));

          // Hàng 2: 6 thùng vải + 2 ô mở bày sách
          if (i === 2 || i === 5) {
            booksRed.push(createInstanceMatrix(toWorld, 11.05, bv - 0.1, dy + 0.62, 0, 0.22, 0.24, 0.08));
            booksBlue.push(createInstanceMatrix(toWorld, 11.05, bv, dy + 0.63, 0, 0.22, 0.26, 0.08));
            booksGold.push(createInstanceMatrix(toWorld, 11.05, bv + 0.1, dy + 0.61, 0, 0.22, 0.22, 0.08));
          } else {
            const mat2 = createInstanceMatrix(toWorld, 11.05, bv, dy + 0.71, 0, 0.38, 0.36, 0.44);
            if (i % 2 === 1) cubbyBinsBrown.push(mat2);
            else cubbyBinsTerra.push(mat2);
            blackSteel.push(createInstanceMatrix(toWorld, 10.855, bv, dy + 0.75, 0, 0.015, 0.04, 0.14));
          }
        }
        // Hàng 3 (trên cùng): 5 thùng vải xen kẽ
        for (let i = 0; i < 5; i++) {
          const bv = 3.28 + i * 0.56;
          const mat3 = createInstanceMatrix(toWorld, 11.05, bv, dy + 1.15, 0, 0.38, 0.36, 0.44);
          if (i % 2 === 0) cubbyBinsTerra.push(mat3);
          else cubbyBinsBrown.push(mat3);
          blackSteel.push(createInstanceMatrix(toWorld, 10.855, bv, dy + 1.19, 0, 0.015, 0.04, 0.14));
        }

        // G. Vườn cây tre trúc & chậu gốm xám dưới gầm cầu thang trung tâm + tiền sảnh (chừa lối rộng trước cổng)
        for (const [pu, pv] of [
          [62.0, 11.1],
          [62.0, 16.9],
          [51.8, 13.0],
          [51.8, 15.0],
          [53.2, 12.8],
          [53.2, 15.2],
          [54.6, 13.2],
          [54.6, 14.8],
          [10.4, 1.2],
          [43.9, 10.0],
        ] as const) {
          addPottedPlant(plantPots, walnutWood, plantLeaves, pu, pv, dy, 1.0);
        }
      }

      if (f === 2) {
        // A. Lan can kính bảo vệ lỗ thông cầu thang trung tâm
        addGlassRailing(railPosts, railGlass, railHands, 50.8, 12.4, 59.8, 12.4, dy);
        addGlassRailing(railPosts, railGlass, railHands, 50.8, 15.6, 59.8, 15.6, dy);

        // B. Phòng 202 Server Room góc Đông Bắc (vách kính mờ khung trắng + 4 bình chữa cháy + tủ server)
        addWallOrGlassSection(solidSpandrels, whiteFrames, frostedGlass, 52.0, 0.2, 52.0, 10.5, dy, 'full-glass-white', 1.8);
        addWallOrGlassSection(solidSpandrels, whiteFrames, frostedGlass, 52.0, 10.5, 54.0, 10.5, dy, 'full-glass-white', 1.8);
        addWallOrGlassSection(solidSpandrels, whiteFrames, frostedGlass, 55.2, 10.5, 66.8, 10.5, dy, 'full-glass-white', 1.8);
        // Cửa gỗ Phòng 202
        oakWood.push(createInstanceMatrix(toWorld, 54.6, 10.5, dy + 1.15, 0, 1.1, 2.3, 0.08));
        // 4 bình chữa cháy đỏ đặt sát chân vách Phòng 202 (ảnh step_394 & step_498)
        for (const fu of [52.4, 52.85, 53.3, 53.75]) {
          fireExtinguishers.push(createInstanceMatrix(toWorld, fu, 10.8, dy + 0.34, 0, 0.2, 0.68, 0.2));
        }
        // Tủ server đen bên trong Phòng 202
        for (const su of [58.0, 60.5, 63.0]) {
          blackSteel.push(createInstanceMatrix(toWorld, su, 4.5, dy + 1.1, 0, 1.0, 2.2, 1.1));
        }

        // C. Dãy 9 phòng học nhóm dọc tường Nam (Phòng 09 đa năng + 08..01)
        // Vách hành lang trắng & cửa gỗ + ô kính quan sát + bàn họp + ghế Tolix
        for (const uPart of [22.5, 28.0, 33.5, 39.0, 44.5, 50.0, 55.5, 61.0, 66.5]) {
          solidSpandrels.push(createInstanceMatrix(toWorld, uPart, 25.15, dy + 1.9, 0, 0.14, 3.8, 5.3));
        }
        // Phòng 09 đa năng (u = 11.5..22.5)
        solidSpandrels.push(createInstanceMatrix(toWorld, 13.5, 22.5, dy + 1.9, 0, 4.0, 3.8, 0.14));
        solidSpandrels.push(createInstanceMatrix(toWorld, 17.0, 22.5, dy + 3.05, 0, 1.4, 1.5, 0.14));
        addWallOrGlassSection(solidSpandrels, darkFrames, clearGlass, 17.7, 22.5, 22.5, 22.5, dy, 'full-glass-dark', 1.6);
        for (const tu of [14.5, 19.5]) {
          walnutWood.push(createInstanceMatrix(toWorld, tu, 25.2, dy + 0.74, 0, 2.8, 0.06, 1.25));
          blackSteel.push(createInstanceMatrix(toWorld, tu - 1.2, 25.2, dy + 0.36, 0, 0.06, 0.72, 1.1));
          blackSteel.push(createInstanceMatrix(toWorld, tu + 1.2, 25.2, dy + 0.36, 0, 0.06, 0.72, 1.1));
          for (const du of [-0.8, 0, 0.8]) {
            addTolixChair(tolixSeats, tolixBacks, tolixLegs, tu + du, 24.3, dy, 0);
            addTolixChair(tolixSeats, tolixBacks, tolixLegs, tu + du, 26.1, dy, Math.PI);
          }
        }

        // 8 phòng 08..01 (mỗi phòng 5.5 m)
        for (let i = 0; i < 8; i++) {
          const uStart = 22.5 + i * 5.5;
          const doorC = uStart + 2.75;
          // Lintel trên cửa
          solidSpandrels.push(createInstanceMatrix(toWorld, uStart + 1.1, 22.5, dy + 1.9, 0, 2.2, 3.8, 0.14));
          solidSpandrels.push(createInstanceMatrix(toWorld, doorC, 22.5, dy + 3.05, 0, 1.2, 1.5, 0.14));
          // Cánh cửa gỗ hé mở
          oakWood.push(createInstanceMatrix(toWorld, doorC - 0.55, 22.85, dy + 1.15, Math.PI / 3, 0.05, 2.3, 0.95));
          // Ô kính hông phòng họp (step_484)
          addWallOrGlassSection(solidSpandrels, darkFrames, clearGlass, doorC + 0.6, 22.5, uStart + 5.5, 22.5, dy, 'full-glass-dark', 2.0);
          // Bàn họp & 6 ghế Tolix bên trong
          walnutWood.push(createInstanceMatrix(toWorld, doorC, 25.2, dy + 0.74, 0, 2.6, 0.06, 1.2));
          blackSteel.push(createInstanceMatrix(toWorld, doorC - 1.1, 25.2, dy + 0.36, 0, 0.06, 0.72, 1.05));
          blackSteel.push(createInstanceMatrix(toWorld, doorC + 1.1, 25.2, dy + 0.36, 0, 0.06, 0.72, 1.05));
          for (const du of [-0.75, 0, 0.75]) {
            addTolixChair(tolixSeats, tolixBacks, tolixLegs, doorC + du, 24.35, dy, 0);
            addTolixChair(tolixSeats, tolixBacks, tolixLegs, doorC + du, 26.05, dy, Math.PI);
          }
          // Bình chữa cháy hành lang mỗi 2 phòng
          if (i % 2 === 0) {
            fireExtinguishers.push(createInstanceMatrix(toWorld, uStart + 0.4, 22.15, dy + 0.34, 0, 0.2, 0.68, 0.2));
          }
        }

        // D. Sofa lượn sóng màu xanh ngọc hai bên hành lang trung tâm + chậu cây xanh
        for (const u of [19.0, 29.5, 40.0]) {
          for (const v of [11.5, 16.5]) {
            wavyTealSofas.push(createInstanceMatrix(toWorld, u - 1.4, v, dy + 0.42, 0, 2.2, 0.24, 0.72));
            wavyTealSofas.push(createInstanceMatrix(toWorld, u, v, dy + 0.52, 0, 1.1, 0.42, 0.72));
            wavyTealSofas.push(createInstanceMatrix(toWorld, u + 1.4, v, dy + 0.42, 0, 2.2, 0.24, 0.72));
            blackSteel.push(createInstanceMatrix(toWorld, u - 2.2, v, dy + 0.16, 0, 0.05, 0.32, 0.6));
            blackSteel.push(createInstanceMatrix(toWorld, u + 2.2, v, dy + 0.16, 0, 0.05, 0.32, 0.6));
          }
        }
        for (const [pu, pv] of [[15.0, 11.4], [15.0, 16.6], [35.4, 11.4], [35.4, 16.6], [46.4, 11.4], [46.4, 16.6]] as const) {
          addPottedPlant(plantPots, walnutWood, plantLeaves, pu, pv, dy, 1.05);
        }

        // E. Khu học nhóm mở phía Nam (v = 19.8) & Khu tự học Tầng 2 phía Bắc (bàn xám + ghế xanh ngọc)
        for (const u of [18.0, 30.0, 42.0, 54.0]) {
          walnutWood.push(createInstanceMatrix(toWorld, u, 19.8, dy + 0.74, 0, 2.8, 0.06, 1.15));
          blackSteel.push(createInstanceMatrix(toWorld, u - 1.2, 19.8, dy + 0.36, 0, 0.06, 0.72, 1.0));
          blackSteel.push(createInstanceMatrix(toWorld, u + 1.2, 19.8, dy + 0.36, 0, 0.06, 0.72, 1.0));
          for (const du of [-0.75, 0.75]) {
            addTolixChair(tolixSeats, tolixBacks, tolixLegs, u + du, 18.9, dy, 0);
            addTolixChair(tolixSeats, tolixBacks, tolixLegs, u + du, 20.7, dy, Math.PI);
          }
        }
        for (const u of [18.0, 31.5, 45.0]) {
          for (const v of [4.5, 7.5]) {
            greyTables.push(createInstanceMatrix(toWorld, u, v, dy + 0.74, 0, 3.0, 0.05, 1.1));
            blackSteel.push(createInstanceMatrix(toWorld, u - 1.35, v, dy + 0.36, 0, 0.04, 0.72, 1.0));
            blackSteel.push(createInstanceMatrix(toWorld, u + 1.35, v, dy + 0.36, 0, 0.04, 0.72, 1.0));
            for (const du of [-0.9, 0, 0.9]) {
              addTealChair(tealSeats, tealBacks, tealLegs, u + du, v - 0.75, dy, 0);
              addTealChair(tealSeats, tealBacks, tealLegs, u + du, v + 0.75, dy, Math.PI);
            }
          }
        }
      }

      if (f === 3) {
        // A. Lan can kính cầu thang & Vách kính cửa LỐI RA / EXIT + Cổng an ninh RFID
        addGlassRailing(railPosts, railGlass, railHands, 50.8, 12.4, 59.8, 12.4, dy);
        addGlassRailing(railPosts, railGlass, railHands, 50.8, 15.6, 59.8, 15.6, dy);
        addGlassRailing(railPosts, railGlass, railHands, 59.8, 12.4, 59.8, 15.6, dy);

        addWallOrGlassSection(solidSpandrels, whiteFrames, clearGlass, 49.8, 10.5, 66.8, 10.5, dy, 'full-glass-white', 2.4);
        addWallOrGlassSection(solidSpandrels, whiteFrames, clearGlass, 49.8, 17.5, 66.8, 17.5, dy, 'full-glass-white', 2.4);
        // Cánh tường gỗ sồi + cửa kính trượt LỐI RA / EXIT tại u = 49.8
        oakWood.push(createInstanceMatrix(toWorld, 49.8, 11.35, dy + 1.5, 0, 0.16, 3.0, 1.5));
        oakWood.push(createInstanceMatrix(toWorld, 49.8, 16.65, dy + 1.5, 0, 0.16, 3.0, 1.5));
        whiteFrames.push(createInstanceMatrix(toWorld, 49.8, 14.0, dy + 2.85, Math.PI / 2, 3.8, 0.18, 0.14));
        clearGlass.push(createInstanceMatrix(toWorld, 49.8, 14.0, dy + 3.3, Math.PI / 2, 7.0, 0.95, 0.04));
        // 2 cổng kiểm soát an ninh RFID trong suốt
        for (const gv of [13.2, 14.8]) {
          stainlessSteel.push(createInstanceMatrix(toWorld, 50.4, gv, dy + 0.04, 0, 0.55, 0.08, 0.18));
          clearGlass.push(createInstanceMatrix(toWorld, 50.4, gv, dy + 0.9, 0, 0.45, 1.65, 0.03));
        }

        // B. Khối phòng nghiệp vụ STAFF ONLY (u = 23.5..35.5, v = 11.0..17.0)
        addWallOrGlassSection(solidSpandrels, darkFrames, clearGlass, 23.5, 11.0, 35.5, 11.0, dy, 'full-glass-dark', 2.0);
        addWallOrGlassSection(solidSpandrels, darkFrames, clearGlass, 23.5, 17.0, 35.5, 17.0, dy, 'full-glass-dark', 2.0);
        walnutWood.push(createInstanceMatrix(toWorld, 29.5, 14.0, dy + 0.74, 0, 5.0, 0.06, 1.2));

        // C. 2 Quầy lưu hành (Đông u = 36.2..39.8 & Tây u = 19.6..22.8) + Lam gỗ đứng
        for (const [cu, wallU, dir] of [[38.0, 35.55, 1], [21.2, 23.45, -1]] as const) {
          concreteCounters.push(createInstanceMatrix(toWorld, cu, 12.5, dy + 0.54, 0, 3.6, 1.08, 0.55));
          concreteCounters.push(createInstanceMatrix(toWorld, cu, 15.5, dy + 0.54, 0, 3.6, 1.08, 0.55));
          concreteCounters.push(createInstanceMatrix(toWorld, cu + dir * 1.65, 14.0, dy + 0.54, 0, 0.55, 1.08, 3.55));
          oakWood.push(createInstanceMatrix(toWorld, cu + dir * 0.2, 14.0, dy + 1.1, 0, 3.2, 0.06, 3.0));
          // Vách lam gỗ đứng đặc trưng (step_115) — đặt gọn về phía Bắc tường gỗ để không che chữ LIBRARY
          for (let s = 0; s < 9; s++) {
            oakWood.push(createInstanceMatrix(toWorld, wallU + dir * 0.2, 10.8 + s * 0.14, dy + 1.85, 0, 0.06, 3.7, 0.06));
          }
          monitorBodies.push(createInstanceMatrix(toWorld, cu + dir * 1.35, 13.4, dy + 1.36, 0, 0.06, 0.38, 0.56));
          monitorScreens.push(createInstanceMatrix(toWorld, cu + dir * 1.4, 13.4, dy + 1.36, (-dir * Math.PI) / 2, 0.52, 0.34, 1));
        }

        // D. 2 Bàn tròn gỗ sồi giới thiệu sách + Bình hoa lan trắng tím (step_72, step_549)
        for (const ru of [45.0, 15.2]) {
          roundOakTables.push(createInstanceMatrix(toWorld, ru, 14.0, dy + 0.76, 0, 3.2, 0.08, 3.2));
          blackSteel.push(createInstanceMatrix(toWorld, ru, 14.0, dy + 0.36, 0.5, 2.2, 0.72, 0.1));
          blackSteel.push(createInstanceMatrix(toWorld, ru, 14.0, dy + 0.36, -0.5, 2.2, 0.72, 0.1));
          plantPots.push(createInstanceMatrix(toWorld, ru, 14.0, dy + 0.95, 0, 0.42, 0.34, 0.42));
          plantLeaves.push(createInstanceMatrix(toWorld, ru, 14.0, dy + 1.12, 0, 0.4, 0.14, 0.4));
          plantLeaves.push(createInstanceMatrix(toWorld, ru - 0.07, 13.95, dy + 1.34, 0.08, 0.03, 0.48, 0.03));
          plantLeaves.push(createInstanceMatrix(toWorld, ru + 0.07, 14.05, dy + 1.34, -0.08, 0.03, 0.48, 0.03));
          for (const [ou, ov, oy, os, isWhite] of [
            [-0.1, -0.06, 1.3, 0.15, true],
            [0.08, 0.05, 1.34, 0.16, false],
            [-0.08, 0.04, 1.43, 0.17, false],
            [0.11, -0.04, 1.46, 0.16, true],
            [-0.04, -0.08, 1.56, 0.14, true],
            [0.05, 0.07, 1.58, 0.13, false],
          ] as const) {
            const mat = createInstanceMatrix(toWorld, ru + ou, 14.0 + ov, dy + oy, oy * 3, os, os, os);
            if (isWhite) orchidWhite.push(mat);
            else orchidPurple.push(mat);
          }
          for (let b = 0; b < 8; b++) {
            const ang = (b / 8) * Math.PI * 2;
            const bu = ru + Math.cos(ang) * 1.15;
            const bv = 14.0 + Math.sin(ang) * 1.15;
            const mat = createInstanceMatrix(toWorld, bu, bv, dy + 0.92, -ang, 0.16, 0.28, 0.22);
            if (b % 3 === 0) booksBlue.push(mat);
            else if (b % 3 === 1) booksRed.push(mat);
            else booksGold.push(mat);
          }
        }

        // E. 32 dãy kệ sách trắng 6 tầng hồi gỗ sồi + 4 góc ghế bành + 2 bàn đọc cửa sổ
        const northRackUs = [13.5, 16.0, 18.5, 21.0, 41.0, 43.5, 46.0, 48.5, 53.5, 56.0, 58.5, 61.0];
        for (const u of northRackUs) {
          addBookshelfRow(
            shelfFrames,
            shelfBoards,
            shelfEndPanels,
            booksRed,
            booksBlue,
            booksGold,
            booksGreen,
            booksWhite,
            u,
            5.7,
            dy,
            5.0
          );
          addBookshelfRow(
            shelfFrames,
            shelfBoards,
            shelfEndPanels,
            booksRed,
            booksBlue,
            booksGold,
            booksGreen,
            booksWhite,
            u,
            22.3,
            dy,
            5.0
          );
        }
        // Bổ sung kệ phụ sát khu đọc Nam
        for (const u of [36.0, 38.5]) {
          addBookshelfRow(
            shelfFrames,
            shelfBoards,
            shelfEndPanels,
            booksRed,
            booksBlue,
            booksGold,
            booksGreen,
            booksWhite,
            u,
            22.3,
            dy,
            5.0
          );
        }

        // 4 cụm ghế bành Lounge (2×2 mỗi góc)
        for (const [lu, lv] of [[24.2, 4.5], [24.2, 7.0], [50.8, 20.8], [50.8, 23.3]] as const) {
          addLoungeChair(loungeBodies, loungeCushions, blackSteel, lu - 0.65, lv, dy, Math.PI / 2);
          addLoungeChair(loungeBodies, loungeCushions, blackSteel, lu + 0.65, lv, dy, -Math.PI / 2);
        }

        // 2 bàn đọc cửa sổ + ghế Tolix + giá gỗ kê chậu cây sát cửa sổ (step_600_shot_1)
        for (const [tu, tv] of [[33.6, 3.6], [31.2, 24.0]] as const) {
          oakWood.push(createInstanceMatrix(toWorld, tu, tv, dy + 0.74, 0, 4.6, 0.07, 1.3));
          blackSteel.push(createInstanceMatrix(toWorld, tu - 2.0, tv, dy + 0.36, 0, 0.08, 0.72, 1.15));
          blackSteel.push(createInstanceMatrix(toWorld, tu + 2.0, tv, dy + 0.36, 0, 0.08, 0.72, 1.15));
          for (const du of [-1.4, 0, 1.4]) {
            addTolixChair(tolixSeats, tolixBacks, tolixLegs, tu + du, tv - 0.8, dy, 0);
            addTolixChair(tolixSeats, tolixBacks, tolixLegs, tu + du, tv + 0.8, dy, Math.PI);
          }
        }
        for (const [pu, pv] of [[30.2, 5.2], [37.4, 2.0], [28.0, 22.8], [34.8, 25.4], [46.8, 16.8], [46.8, 11.2]] as const) {
          addPottedPlant(plantPots, walnutWood, plantLeaves, pu, pv, dy, 1.12);
        }
      }

      // -----------------------------------------------------------------------
      // 6. LÕI WC & THANG BỘ PHỤ TÂY NAM (TẦNG 1–3)
      // -----------------------------------------------------------------------
      if (f >= 2) {
        // Cửa khu vệ sinh WC (Nam / Nữ / Tiếp cận) phía Tây Bắc
        oakWood.push(createInstanceMatrix(toWorld, 8.9, 10.5, dy + 1.15, 0, 1.6, 2.3, 0.08));
      }

      if (f < 3) {
        const st = B4_REAR_STAIR;
        const midY = dy + st.landRatio * FLOOR_HEIGHT;
        addSwitchbackFlight(toWorld, stairSteps, stairSoffits, stairRails, st.f1[0], st.f1[1], dy, st.f1[2], st.f1[3], midY, st.width, st.steps1);
        addSwitchbackFlight(toWorld, stairSteps, stairSoffits, stairRails, st.f2[0], st.f2[1], midY, st.f2[2], st.f2[3], dy + FLOOR_HEIGHT, st.width, st.steps2);
        // Chiếu nghỉ thang bộ Tây Nam
        stairSteps.push(createInstanceMatrix(toWorld, st.land[0], st.land[1], midY - 0.1, 0, st.land[2], 0.2, st.land[3]));
      }
    }

    return {
      greyCarpetGeo: greyCarpetQuads.length ? BufferGeometryUtils.mergeGeometries(greyCarpetQuads) : null,
      tanCarpetGeo: tanCarpetQuads.length ? BufferGeometryUtils.mergeGeometries(tanCarpetQuads) : null,
      carpetCleanup: [...greyCarpetQuads, ...tanCarpetQuads],
      ceilingSlabs,
      ceilingBeams,
      hvacDucts,
      firePipes,
      ledLights,
      drywallSoffits,
      waffleWoodGrid,
      metalMeshCeilings,
      pendantShades,
      whiteCols,
      greyCols,
      darkColCaps,
      redColCaps,
      solidSpandrels,
      whiteFrames,
      darkFrames,
      clearGlass,
      frostedGlass,
      oakWood,
      roundOakTables,
      walnutWood,
      greyTables,
      blackSteel,
      stainlessSteel,
      blueFlaps,
      concreteCounters,
      lightGreyCabinets,
      tolixSeats,
      tolixBacks,
      tolixLegs,
      tealSeats,
      tealBacks,
      tealLegs,
      dswShells,
      dswLegs,
      loungeBodies,
      loungeCushions,
      lightBlueSofas,
      wavyTealSofas,
      monitorBodies,
      monitorScreens,
      turnstileArrows,
      keyboards,
      fireExtinguishers,
      shelfFrames,
      shelfBoards,
      shelfEndPanels,
      booksRed,
      booksBlue,
      booksGold,
      booksGreen,
      booksWhite,
      cubbyBinsTerra,
      cubbyBinsBrown,
      railPosts,
      railGlass,
      railHands,
      plantPots,
      plantLeaves,
      orchidWhite,
      orchidPurple,
      stairSteps,
      stairSoffits,
      stairRails,
    };
  }, [floor, showUpperFloors]);

  useEffect(() => {
    data.carpetCleanup.forEach((g) => g.dispose());
    return () => {
      data.greyCarpetGeo?.dispose();
      data.tanCarpetGeo?.dispose();
    };
  }, [data]);

  // Cached canvas textures
  const textures = useMemo(
    () => ({
      greyCarpet: getCarpetTexture('grey'),
      tanCarpet: getCarpetTexture('tan'),
      reclaimedWood: getReclaimedWoodTexture(),
      opacScreen: getOpacScreenTexture(),
      turnstileArrow: getTurnstileArrowTexture(),
    }),
    []
  );

  // Tọa độ & góc quay các yếu tố chữ/poster đặc trưng
  const [eleX, eleZ] = toWorld(B4_ELEVATOR_POS_LOCAL[0], B4_ELEVATOR_POS_LOCAL[1]);
  const eleYaw = getLocalFacingYaw(0);
  const colFacingEast = getLocalFacingYaw(-Math.PI / 2);
  const colFacingWest = getLocalFacingYaw(Math.PI / 2);
  const colFacingSouth = getLocalFacingYaw(0);
  const colFacingNorth = getLocalFacingYaw(Math.PI);

  return (
    <group key={floor}>
      {/* 1. Thảm tấm 2 tông màu (chỉ 2 draw call) */}
      {data.greyCarpetGeo && (
        <mesh geometry={data.greyCarpetGeo} receiveShadow>
          <meshStandardMaterial
            map={textures.greyCarpet}
            roughness={0.85}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-2}
          />
        </mesh>
      )}
      {data.tanCarpetGeo && (
        <mesh geometry={data.tanCarpetGeo} receiveShadow>
          <meshStandardMaterial
            map={textures.tanCarpet}
            roughness={0.85}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-2}
          />
        </mesh>
      )}

      {/* 2. Kết cấu trần, cột, vách kính & cửa sổ băng ngang */}
      <InstancedBatch batchKey="b4-ceil" matrices={data.ceilingSlabs} geometry={sharedGeos.box} color="#25282e" roughness={0.9} />
      <InstancedBatch batchKey="b4-beams" matrices={data.ceilingBeams} geometry={sharedGeos.box} color="#2f333a" roughness={0.85} />
      <InstancedBatch batchKey="b4-hvac" matrices={data.hvacDucts} geometry={sharedGeos.box} color="#9ca3af" metalness={0.35} roughness={0.45} />
      <InstancedBatch batchKey="b4-fire" matrices={data.firePipes} geometry={sharedGeos.box} color="#dc2626" roughness={0.4} />
      <InstancedBatch batchKey="b4-led" matrices={data.ledLights} geometry={sharedGeos.box} color="#ffffff" emissive="#ffffff" emissiveIntensity={1.15} />
      <InstancedBatch batchKey="b4-soffit" matrices={data.drywallSoffits} geometry={sharedGeos.box} color="#e5e7eb" roughness={0.75} />
      <InstancedBatch batchKey="b4-waffle" matrices={data.waffleWoodGrid} geometry={sharedGeos.box} color="#c99c6b" roughness={0.6} />
      <InstancedBatch batchKey="b4-meshceil" matrices={data.metalMeshCeilings} geometry={sharedGeos.box} color="#475569" metalness={0.4} roughness={0.5} />
      <InstancedBatch batchKey="b4-pendant" matrices={data.pendantShades} geometry={sharedGeos.cyl} color="#18181b" metalness={0.4} roughness={0.4} />

      <InstancedBatch batchKey="b4-wcols" matrices={data.whiteCols} geometry={sharedGeos.box} color="#f8fafc" roughness={0.65} />
      <InstancedBatch batchKey="b4-gcols" matrices={data.greyCols} geometry={sharedGeos.box} color="#64748b" roughness={0.75} />
      <InstancedBatch batchKey="b4-dcaps" matrices={data.darkColCaps} geometry={sharedGeos.box} color="#374151" roughness={0.55} />
      <InstancedBatch batchKey="b4-rcaps" matrices={data.redColCaps} geometry={sharedGeos.box} color="#dc2626" roughness={0.45} />

      <InstancedBatch batchKey="b4-spandrel" matrices={data.solidSpandrels} geometry={sharedGeos.box} color="#f1f5f9" roughness={0.75} />
      <InstancedBatch batchKey="b4-wframe" matrices={data.whiteFrames} geometry={sharedGeos.box} color="#e2e8f0" roughness={0.35} metalness={0.2} />
      <InstancedBatch batchKey="b4-dframe" matrices={data.darkFrames} geometry={sharedGeos.box} color="#1f2937" roughness={0.35} metalness={0.4} />
      <InstancedBatch batchKey="b4-cglass" matrices={data.clearGlass} geometry={sharedGeos.box} color="#bae6fd" transparent opacity={0.22} depthWrite={false} roughness={0.08} metalness={0.2} />
      <InstancedBatch batchKey="b4-fglass" matrices={data.frostedGlass} geometry={sharedGeos.box} color="#e2e8f0" transparent opacity={0.55} depthWrite={false} roughness={0.35} />

      {/* 3. Nội thất gỗ, kim loại, quầy, ghế & máy tính */}
      <InstancedBatch batchKey="b4-oak" matrices={data.oakWood} geometry={sharedGeos.box} color="#c78a4b" roughness={0.58} />
      <InstancedBatch batchKey="b4-roak" matrices={data.roundOakTables} geometry={sharedGeos.cyl} color="#c78a4b" roughness={0.55} />
      <InstancedBatch batchKey="b4-walnut" matrices={data.walnutWood} geometry={sharedGeos.box} color="#4e3222" roughness={0.55} />
      <InstancedBatch batchKey="b4-greytbl" matrices={data.greyTables} geometry={sharedGeos.box} color="#9ca3af" roughness={0.48} />
      <InstancedBatch batchKey="b4-steel" matrices={data.blackSteel} geometry={sharedGeos.box} color="#18181b" metalness={0.55} roughness={0.4} />
      <InstancedBatch batchKey="b4-inox" matrices={data.stainlessSteel} geometry={sharedGeos.box} color="#cbd5e1" metalness={0.85} roughness={0.22} />
      <InstancedBatch batchKey="b4-flaps" matrices={data.blueFlaps} geometry={sharedGeos.box} color="#0284c7" emissive="#0ea5e9" emissiveIntensity={0.35} transparent opacity={0.62} depthWrite={false} />
      <InstancedBatch batchKey="b4-conc" matrices={data.concreteCounters} geometry={sharedGeos.box} color="#94a3b8" roughness={0.7} />
      <InstancedBatch batchKey="b4-lockers" matrices={data.lightGreyCabinets} geometry={sharedGeos.box} color="#d1d5db" roughness={0.45} />

      <InstancedBatch batchKey="b4-tolix-s" matrices={data.tolixSeats} geometry={sharedGeos.box} color="#18181b" metalness={0.45} roughness={0.38} />
      <InstancedBatch batchKey="b4-tolix-b" matrices={data.tolixBacks} geometry={sharedGeos.box} color="#18181b" metalness={0.45} roughness={0.38} />
      <InstancedBatch batchKey="b4-tolix-l" matrices={data.tolixLegs} geometry={sharedGeos.box} color="#18181b" metalness={0.55} roughness={0.35} />
      <InstancedBatch batchKey="b4-teal-s" matrices={data.tealSeats} geometry={sharedGeos.box} color="#0d9488" roughness={0.45} />
      <InstancedBatch batchKey="b4-teal-b" matrices={data.tealBacks} geometry={sharedGeos.box} color="#18181b" roughness={0.5} />
      <InstancedBatch batchKey="b4-teal-l" matrices={data.tealLegs} geometry={sharedGeos.box} color="#18181b" metalness={0.55} roughness={0.35} />
      <InstancedBatch batchKey="b4-dsw-s" matrices={data.dswShells} geometry={sharedGeos.box} color="#1e293b" roughness={0.55} />
      <InstancedBatch batchKey="b4-dsw-l" matrices={data.dswLegs} geometry={sharedGeos.box} color="#c99c6b" roughness={0.6} />
      <InstancedBatch batchKey="b4-lounge-b" matrices={data.loungeBodies} geometry={sharedGeos.box} color="#475569" roughness={0.7} />
      <InstancedBatch batchKey="b4-lounge-c" matrices={data.loungeCushions} geometry={sharedGeos.box} color="#cbd5e1" roughness={0.75} />
      <InstancedBatch batchKey="b4-bsofa" matrices={data.lightBlueSofas} geometry={sharedGeos.box} color="#60a5fa" roughness={0.75} />
      <InstancedBatch batchKey="b4-wsofa" matrices={data.wavyTealSofas} geometry={sharedGeos.box} color="#0f766e" roughness={0.55} />

      <InstancedBatch batchKey="b4-mon" matrices={data.monitorBodies} geometry={sharedGeos.box} color="#f1f5f9" roughness={0.35} />
      <TexturedPlaneBatch matrices={data.monitorScreens} geometry={sharedGeos.plane} texture={textures.opacScreen} emissiveIntensity={0.28} />
      <TexturedPlaneBatch matrices={data.turnstileArrows} geometry={sharedGeos.plane} texture={textures.turnstileArrow} emissiveIntensity={0.65} />
      <InstancedBatch batchKey="b4-kb" matrices={data.keyboards} geometry={sharedGeos.box} color="#f8fafc" roughness={0.4} />
      <InstancedBatch batchKey="b4-ext" matrices={data.fireExtinguishers} geometry={sharedGeos.cyl} color="#dc2626" roughness={0.35} />

      {/* 4. Kệ sách & gáy sách nhiều màu + hộp vải Góc trao đổi sách */}
      <InstancedBatch batchKey="b4-sh-f" matrices={data.shelfFrames} geometry={sharedGeos.box} color="#f8fafc" roughness={0.35} />
      <InstancedBatch batchKey="b4-sh-b" matrices={data.shelfBoards} geometry={sharedGeos.box} color="#f1f5f9" roughness={0.35} />
      <InstancedBatch batchKey="b4-sh-e" matrices={data.shelfEndPanels} geometry={sharedGeos.box} color="#d4a373" roughness={0.6} />
      <InstancedBatch batchKey="b4-bk-r" matrices={data.booksRed} geometry={sharedGeos.box} color="#dc2626" roughness={0.7} />
      <InstancedBatch batchKey="b4-bk-b" matrices={data.booksBlue} geometry={sharedGeos.box} color="#2563eb" roughness={0.7} />
      <InstancedBatch batchKey="b4-bk-g" matrices={data.booksGold} geometry={sharedGeos.box} color="#d97706" roughness={0.7} />
      <InstancedBatch batchKey="b4-bk-gr" matrices={data.booksGreen} geometry={sharedGeos.box} color="#059669" roughness={0.7} />
      <InstancedBatch batchKey="b4-bk-w" matrices={data.booksWhite} geometry={sharedGeos.box} color="#e2e8f0" roughness={0.7} />
      <InstancedBatch batchKey="b4-bin-t" matrices={data.cubbyBinsTerra} geometry={sharedGeos.box} color="#8c4a3e" roughness={0.85} />
      <InstancedBatch batchKey="b4-bin-b" matrices={data.cubbyBinsBrown} geometry={sharedGeos.box} color="#5c4033" roughness={0.85} />

      {/* 5. Lan can kính, cây xanh, hoa lan, thang bộ phụ */}
      <InstancedBatch batchKey="b4-rp" matrices={data.railPosts} geometry={sharedGeos.box} color="#e2e8f0" metalness={0.8} roughness={0.2} />
      <InstancedBatch batchKey="b4-rh" matrices={data.railHands} geometry={sharedGeos.box} color="#e2e8f0" metalness={0.85} roughness={0.18} />
      <InstancedBatch batchKey="b4-rg" matrices={data.railGlass} geometry={sharedGeos.box} color="#bae6fd" transparent opacity={0.3} depthWrite={false} roughness={0.1} />

      <InstancedBatch batchKey="b4-pots" matrices={data.plantPots} geometry={sharedGeos.cyl} color="#94a3b8" roughness={0.75} />
      <InstancedBatch batchKey="b4-leaves" matrices={data.plantLeaves} geometry={sharedGeos.foliage} color="#15803d" roughness={0.75} />
      <InstancedBatch batchKey="b4-orw" matrices={data.orchidWhite} geometry={sharedGeos.foliage} color="#f8fafc" roughness={0.5} />
      <InstancedBatch batchKey="b4-orp" matrices={data.orchidPurple} geometry={sharedGeos.foliage} color="#a855f7" roughness={0.5} />

      <InstancedBatch batchKey="b4-rstp" matrices={data.stairSteps} geometry={sharedGeos.box} color="#475569" roughness={0.6} />
      <InstancedBatch batchKey="b4-rsof" matrices={data.stairSoffits} geometry={sharedGeos.box} color="#e2e8f0" roughness={0.7} />
      <InstancedBatch batchKey="b4-rrail" matrices={data.stairRails} geometry={sharedGeos.box} color="#cbd5e1" metalness={0.5} roughness={0.3} />

      {/* 6. Hai tầng cầu thang gáy sách trung tâm EIU */}
      <GrandBookStaircase baseFloor={1} currentFloor={floor} />
      <GrandBookStaircase baseFloor={2} currentFloor={floor} />

      {/* 7. Chữ ZONE A / B / C trên cột đúng màu từng tầng */}
      {[1, 2].map((f) => {
        if (!showUpperFloors && f > floor) return null;
        const dy = (f - floor) * FLOOR_HEIGHT;
        if (f === 1) {
          const f1Cols: readonly {
            readonly u: number;
            readonly v: number;
            readonly letter: string;
            readonly faces: readonly ('N' | 'E' | 'W')[];
          }[] = [
            // Bên phải (Bắc v = 10.5): cột 1 = ZONE A, cột 2 & 3 = ZONE C
            { u: 52.0, v: 10.5, letter: 'A', faces: ['N', 'E', 'W'] },
            { u: 32.5, v: 10.5, letter: 'C', faces: ['E', 'W'] },
            { u: 22.0, v: 10.5, letter: 'C', faces: ['E', 'W'] },
            // Bên trái (Nam v = 17.5): 2 cột đầu = ZONE A, 2 cột sau = ZONE B
            { u: 52.0, v: 17.5, letter: 'A', faces: ['E', 'W'] },
            { u: 43.0, v: 17.5, letter: 'A', faces: ['E', 'W'] },
            { u: 32.5, v: 17.5, letter: 'B', faces: ['E', 'W'] },
            { u: 22.0, v: 17.5, letter: 'B', faces: ['E', 'W'] },
          ];
          return (
            <group key="zones-1">
              {f1Cols.map(({ u, v, letter, faces }) => {
                const [wx, wz] = toWorld(u, v);
                return (
                  <group key={`f1-${u}-${v}`}>
                    {faces.map((face) => {
                      const rotY = face === 'N' ? colFacingNorth : face === 'E' ? colFacingEast : colFacingWest;
                      return (
                        <group key={`${u}-${v}-${face}`} position={[wx, dy, wz]} rotation-y={rotY}>
                          <Text position={[0, 3.16, 0.355]} fontSize={0.28} color="#ffffff" anchorX="center" anchorY="middle">
                            {letter}
                          </Text>
                          <Text
                            position={[0, 2.25, 0.34]}
                            fontSize={0.27}
                            lineHeight={0.92}
                            color="#0284c7"
                            anchorX="center"
                            anchorY="middle"
                          >
                            {'Z\nO\nN\nE'}
                          </Text>
                        </group>
                      );
                    })}
                  </group>
                );
              })}
            </group>
          );
        }

        const zoneColor = '#dc2626';
        const specs = [
          { u: 56.5, label: 'ZONE A' },
          { u: 34.5, label: 'ZONE B' },
          { u: 24.5, label: 'ZONE C' },
        ];
        return (
          <group key={`zones-${f}`}>
            {specs.map(({ u, label }) => {
              const verticalText = label.replace(' ', '\n').split('').join('\n');
              const [wxN, wzN] = toWorld(u, 10.5);
              const [wxS, wzS] = toWorld(u, 17.5);
              return (
                <group key={`${f}-${label}`}>
                  <group position={[wxN, dy + 2.0, wzN]} rotation-y={colFacingSouth}>
                    <Text position={[0, 0, 0.34]} fontSize={0.28} lineHeight={0.92} color={zoneColor} anchorX="center" anchorY="middle">
                      {verticalText}
                    </Text>
                  </group>
                  <group position={[wxN, dy + 2.0, wzN]} rotation-y={colFacingEast}>
                    <Text position={[0, 0, 0.34]} fontSize={0.28} lineHeight={0.92} color={zoneColor} anchorX="center" anchorY="middle">
                      {verticalText}
                    </Text>
                  </group>
                  <group position={[wxS, dy + 2.0, wzS]} rotation-y={colFacingNorth}>
                    <Text position={[0, 0, 0.34]} fontSize={0.28} lineHeight={0.92} color={zoneColor} anchorX="center" anchorY="middle">
                      {verticalText}
                    </Text>
                  </group>
                  <group position={[wxS, dy + 2.0, wzS]} rotation-y={colFacingEast}>
                    <Text position={[0, 0, 0.34]} fontSize={0.28} lineHeight={0.92} color={zoneColor} anchorX="center" anchorY="middle">
                      {verticalText}
                    </Text>
                  </group>
                </group>
              );
            })}
          </group>
        );
      })}

      {/* 8. Poster EIU có texture rõ nét, biển phòng học nhóm 01..09, bảng DDC & tường LIBRARY */}
      <B4TexturedAccents floor={floor} showUpperFloors={showUpperFloors} reclaimedWoodTex={textures.reclaimedWood} />

      {/* 8b. Nhân viên nữ ngồi trực máy tính tại Quầy thông tin Tầng 1 */}
      {floor === 1 && (
        <Suspense fallback={null}>
          <LibraryStaffNpc />
        </Suspense>
      )}

      {/* 9. Thang máy phía Tây */}
      <group position={[eleX, 0, eleZ]} rotation-y={eleYaw}>
        <mesh position={[0, 1.4, 0]}>
          <boxGeometry args={[2.3, 2.8, 0.3]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.15, 0.08]}>
          <boxGeometry args={[1.5, 2.3, 0.06]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[0, 2.52, 0.16]}>
          <boxGeometry args={[0.56, 0.2, 0.05]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <Text position={[0, 2.52, 0.2]} fontSize={0.12} color="#38bdf8" anchorX="center" anchorY="middle">
          {`TẦNG ${floor}`}
        </Text>
      </group>
    </group>
  );
}

function B4TexturedAccents({
  floor,
  showUpperFloors,
  reclaimedWoodTex,
}: {
  floor: number;
  showUpperFloors: boolean;
  reclaimedWoodTex: CanvasTexture;
}) {
  const faceSouth = getLocalFacingYaw(0);
  const faceNorth = getLocalFacingYaw(Math.PI);
  const faceWest = getLocalFacingYaw(Math.PI / 2);
  const faceEast = getLocalFacingYaw(-Math.PI / 2);

  const postersF1Wall: readonly { v: number; kind: B4PosterKind }[] = [
    { v: 3.0, kind: 'core-values' },
    { v: 4.3, kind: 'mission' },
    { v: 5.6, kind: 'vision' },
    { v: 6.9, kind: 'objectives' },
  ];

  const postersF1Glass: readonly { u: number; kind: B4PosterKind }[] = [
    { u: 16.0, kind: 'nurse-purple' },
    { u: 22.0, kind: 'dream-green' },
    { u: 28.0, kind: 'year-2021-teal' },
    { u: 34.0, kind: 'opac-white' },
    { u: 40.0, kind: 'databases-white' },
  ];

  const room202Posters: readonly { u: number; kind: B4PosterKind }[] = [
    { u: 56.2, kind: 'adam-smith' },
    { u: 58.6, kind: 'karl-marx' },
    { u: 61.0, kind: 'max-weber' },
    { u: 63.4, kind: 'keynes' },
  ];

  const ddcSignsNorth: readonly { u: number; range: string; cat: string }[] = [
    { u: 61.0, range: '000–099', cat: 'Computer Science & Information' },
    { u: 58.5, range: '100–299', cat: 'Philosophy & Psychology' },
    { u: 56.0, range: '300–399', cat: 'Social Sciences' },
    { u: 53.5, range: '400–599', cat: 'Language & Natural Science' },
    { u: 48.5, range: '600–617', cat: 'Technology & Medicine' },
    { u: 46.0, range: '618–629', cat: 'Engineering & Mechanics' },
    { u: 21.0, range: '630–658', cat: 'Business & Management' },
    { u: 16.0, range: '660–799', cat: 'Arts & Design' },
  ];

  const ddcSignsSouth: readonly { u: number; range: string; cat: string }[] = [
    { u: 61.0, range: '800–899', cat: 'Literature & Rhetoric' },
    { u: 56.0, range: '900–999', cat: 'History & Geography' },
    { u: 46.0, range: 'Reference', cat: 'Encyclopedias & Journals' },
    { u: 18.5, range: 'Journals', cat: 'Academic Periodicals' },
  ];

  return (
    <group>
      {/* TẦNG 1: Bộ 4 poster trên tường xám, poster kính mặt Nam & Bắc */}
      {(showUpperFloors || floor === 1) && (
        <group position-y={(1 - floor) * FLOOR_HEIGHT}>
          {postersF1Wall.map(({ v, kind }) => {
            const [wx, wz] = toWorld(42.85, v);
            const tex = getPosterTexture(kind);
            return (
              <mesh key={kind} position={[wx, 2.15, wz]} rotation-y={faceWest}>
                <planeGeometry args={[0.92, 1.25]} />
                <meshStandardMaterial map={tex} roughness={0.35} />
              </mesh>
            );
          })}
          {postersF1Glass.map(({ u, kind }) => {
            const [wx, wz] = toWorld(u, 27.86);
            const tex = getPosterTexture(kind);
            return (
              <mesh key={`g-${kind}`} position={[wx, 1.85, wz]} rotation-y={faceNorth}>
                <planeGeometry args={[1.15, 1.52]} />
                <meshStandardMaterial map={tex} roughness={0.3} side={DoubleSide} />
              </mesh>
            );
          })}
        </group>
      )}

      {/* TẦNG 2: Poster Phòng 202 Server Room, poster tường Tây, biển 4 dải màu 9 phòng nhóm */}
      {(showUpperFloors || floor >= 2) && (
        <group position-y={(2 - floor) * FLOOR_HEIGHT}>
          {room202Posters.map(({ u, kind }) => {
            const [wx, wz] = toWorld(u, 10.62);
            const tex = getPosterTexture(kind);
            return (
              <mesh key={`p202-${kind}`} position={[wx, 1.75, wz]} rotation-y={faceSouth}>
                <planeGeometry args={[1.35, 1.65]} />
                <meshStandardMaterial map={tex} roughness={0.35} side={DoubleSide} />
              </mesh>
            );
          })}
          {/* Biển phòng 202 Server Room */}
          {(() => {
            const [wx, wz] = toWorld(53.4, 10.62);
            return (
              <group position={[wx, 1.7, wz]} rotation-y={faceSouth}>
                <mesh>
                  <planeGeometry args={[0.42, 0.24]} />
                  <meshStandardMaterial color="#f8fafc" />
                </mesh>
                <Text position={[0, 0, 0.01]} fontSize={0.07} color="#0f172a" anchorX="center" anchorY="middle">
                  {'202\nServer Room'}
                </Text>
              </group>
            );
          })()}
          {/* 3 poster tường Tây khu tự học Tầng 2 */}
          {[
            { v: 3.2, kind: 'mission' as B4PosterKind },
            { v: 5.5, kind: 'vision' as B4PosterKind },
            { v: 7.8, kind: 'objectives' as B4PosterKind },
          ].map(({ v, kind }) => {
            const [wx, wz] = toWorld(11.66, v);
            return (
              <mesh key={`w2-${kind}`} position={[wx, 1.9, wz]} rotation-y={faceEast}>
                <planeGeometry args={[1.0, 1.35]} />
                <meshStandardMaterial map={getPosterTexture(kind)} roughness={0.35} />
              </mesh>
            );
          })}
          {/* Biển mica 4 dải màu phòng 09 (đa năng) & 08..01 (nhóm) */}
          {[
            { num: '09', u: 15.6, vi: 'Phòng đa năng', en: 'Multipurpose Room' },
            ...Array.from({ length: 8 }, (_, i) => ({
              num: `0${8 - i}`,
              u: 22.5 + i * 5.5 + 1.95,
              vi: 'Phòng họp nhóm',
              en: 'Group Study Room',
            })),
          ].map(({ num, u, vi, en }) => {
            const [wx, wz] = toWorld(u, 22.4);
            const tex = getRoomPlaqueTexture(num, vi, en);
            return (
              <mesh key={`room-${num}`} position={[wx, 1.62, wz]} rotation-y={faceNorth}>
                <planeGeometry args={[0.38, 0.38]} />
                <meshStandardMaterial map={tex} roughness={0.3} />
              </mesh>
            );
          })}
        </group>
      )}

      {/* TẦNG 3: Tường gỗ tái chế "LIBRARY", biển LỐI RA / EXIT, biển DDC đầu kệ sách */}
      {(showUpperFloors || floor === 3) && (
        <group position-y={(3 - floor) * FLOOR_HEIGHT}>
          {/* Tường gỗ tái chế phát sáng chữ LIBRARY phía sau Quầy lưu hành Đông */}
          {(() => {
            const [wx, wz] = toWorld(35.62, 14.0);
            return (
              <group position={[wx, 1.85, wz]} rotation-y={faceEast}>
                <mesh>
                  <planeGeometry args={[4.4, 3.6]} />
                  <meshStandardMaterial map={reclaimedWoodTex} roughness={0.75} />
                </mesh>
                <Text position={[-0.35, 0.78, 0.03]} fontSize={0.38} color="#ffffff" anchorX="center" anchorY="middle">
                  LIBRARY
                </Text>
              </group>
            );
          })()}

          {/* Biển LỐI RA / EXIT trên cửa kính cầu thang Tầng 3 */}
          {(() => {
            const [wx, wz] = toWorld(49.7, 14.0);
            return (
              <group position={[wx, 2.52, wz]} rotation-y={faceWest}>
                <mesh>
                  <planeGeometry args={[1.1, 0.36]} />
                  <meshStandardMaterial color="#f8fafc" />
                </mesh>
                <Text position={[0, 0, 0.02]} fontSize={0.11} color="#0f172a" anchorX="center" anchorY="middle">
                  {'LỐI RA · EXIT →'}
                </Text>
              </group>
            );
          })()}

          {/* Biển STAFF ONLY trên khối phòng nghiệp vụ */}
          {(() => {
            const [wx, wz] = toWorld(29.5, 10.88);
            return (
              <group position={[wx, 2.3, wz]} rotation-y={faceNorth}>
                <mesh>
                  <planeGeometry args={[1.5, 0.35]} />
                  <meshStandardMaterial color="#991b1b" />
                </mesh>
                <Text position={[0, 0, 0.02]} fontSize={0.13} color="#ffffff" anchorX="center" anchorY="middle">
                  STAFF ONLY
                </Text>
              </group>
            );
          })()}

          {/* Bảng chỉ mục DDC xanh tím đầu hồi kệ sách */}
          {ddcSignsNorth.map(({ u, range, cat }) => {
            const [wx, wz] = toWorld(u, 8.24);
            return (
              <mesh key={`ddc-n-${u}`} position={[wx, 1.48, wz]} rotation-y={faceSouth}>
                <planeGeometry args={[0.58, 0.82]} />
                <meshStandardMaterial map={getDdcHeaderTexture(range, cat)} roughness={0.35} />
              </mesh>
            );
          })}
          {ddcSignsSouth.map(({ u, range, cat }) => {
            const [wx, wz] = toWorld(u, 19.76);
            return (
              <mesh key={`ddc-s-${u}`} position={[wx, 1.48, wz]} rotation-y={faceNorth}>
                <planeGeometry args={[0.58, 0.82]} />
                <meshStandardMaterial map={getDdcHeaderTexture(range, cat)} roughness={0.35} />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
}
