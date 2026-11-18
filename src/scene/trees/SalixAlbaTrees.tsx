import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Euler,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  SRGBColorSpace,
  Vector3,
  type InstancedMesh,
} from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface SalixAlbaInstance {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly rotY: number;
  readonly scaleXZ: number;
  readonly scaleY: number;
}

const UP_VEC = new Vector3(0, 1, 0);

function createPrng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tạo CanvasTexture cành lá liễu trắng (Salix alba) nền trong suốt, sắc nét không dùng ảnh ngoài. */
function createSalixLeafTexture(): CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, size, size);
  const rng = createPrng(164408);

  const leafPalette = [
    '#515f47',
    '#5f6f54',
    '#708065',
    '#829277',
    '#94a389',
    '#a8b59c',
    '#b7c3ac',
  ];

  // Vẽ các nhánh tăm tỏa quạt + lá liễu thon dài hơi rủ đặc trưng của Salix alba S1644
  const twigCount = 15;
  for (let t = 0; t < twigCount; t++) {
    const spread = ((t / (twigCount - 1)) - 0.5) * 2.15 + (rng() - 0.5) * 0.14;
    const baseAngle = -Math.PI / 2 + spread * 0.68;
    const length = 220 + (1 - Math.abs(spread) * 0.45) * 195 + (rng() - 0.5) * 35;

    let cx = size * 0.5 + spread * 14;
    let cy = size - 22;
    let dir = baseAngle;
    const steps = 11;
    const stepLen = length / steps;

    for (let s = 0; s < steps; s++) {
      const progress = s / steps;
      // Nhánh hơi cong mềm xuống ở đầu ngọn
      dir += spread * 0.055 + (rng() - 0.5) * 0.08;
      const nx = cx + Math.cos(dir) * stepLen;
      const ny = cy + Math.sin(dir) * stepLen;

      ctx.strokeStyle = s < 4 ? '#5a533f' : '#6b674f';
      ctx.lineWidth = Math.max(1.2, 4.2 * (1 - progress * 0.72));
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      // Rải 3–4 lá liễu thon nhọn hai bên mỗi đốt nhánh
      const leavesHere = s < 2 ? 2 : 4;
      for (let l = 0; l < leavesHere; l++) {
        const uAlong = rng();
        const lx = cx + (nx - cx) * uAlong;
        const ly = cy + (ny - cy) * uAlong;
        const side = (l % 2 === 0 ? 1 : -1) * (0.38 + rng() * 0.65);
        const leafAngle = dir + side + 0.18 * Math.sign(spread || 1);
        const leafLen = (34 + rng() * 34) * (0.75 + (1 - progress * 0.35) * 0.4);
        const leafWidth = 4.2 + rng() * 3.8;

        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(leafAngle);
        ctx.fillStyle = leafPalette[Math.floor(rng() * leafPalette.length)] ?? '#7e8e73';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(leafLen * 0.45, -leafWidth, leafLen, 0.8);
        ctx.quadraticCurveTo(leafLen * 0.45, leafWidth, 0, 0);
        ctx.fill();
        ctx.restore();
      }

      cx = nx;
      cy = ny;
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/** Gắn vertex color với sắc độ tối nhẹ ở phần gốc/lõi cho khối BufferGeometry. */
function applyVertexColorGradient(
  geo: BufferGeometry,
  bottomColorHex: string,
  topColorHex: string,
  minY: number,
  maxY: number,
  jitterRng: () => number
): void {
  const posAttr = geo.getAttribute('position');
  if (!posAttr) return;
  const count = posAttr.count;
  const colors = new Float32Array(count * 3);
  const cBottom = new Color(bottomColorHex);
  const cTop = new Color(topColorHex);
  const work = new Color();
  const span = Math.max(0.01, maxY - minY);

  for (let i = 0; i < count; i++) {
    const y = posAttr.getY(i);
    const t = Math.max(0, Math.min(1, (y - minY) / span));
    work.copy(cBottom).lerp(cTop, t);
    const shade = 0.9 + jitterRng() * 0.2;
    colors[i * 3] = Math.min(1, work.r * shade);
    colors[i * 3 + 1] = Math.min(1, work.g * shade);
    colors[i * 3 + 2] = Math.min(1, work.b * shade);
  }
  geo.setAttribute('color', new BufferAttribute(colors, 3));
}

function makeBarkSegment(
  p1: Vector3,
  p2: Vector3,
  rBottom: number,
  rTop: number,
  radialSegments = 6
): BufferGeometry {
  const dir = new Vector3().subVectors(p2, p1);
  const len = dir.length();
  const mid = new Vector3().addVectors(p1, p2).multiplyScalar(0.5);
  const raw = new CylinderGeometry(rTop, rBottom, len, radialSegments);
  const geo = raw.index ? raw.toNonIndexed() : raw;
  if (raw !== geo) raw.dispose();
  const quat = new Quaternion().setFromUnitVectors(UP_VEC, dir.normalize());
  geo.applyMatrix4(new Matrix4().compose(mid, quat, new Vector3(1, 1, 1)));
  return geo;
}

/** Tạo một mảnh cành lá cong 3D hai mặt (không phẳng lì khi nhìn ngang hay từ trên xuống). */
function makeArchedLeafSprayCard(width: number, height: number): BufferGeometry {
  const hw = width * 0.5;
  const bendZ = width * 0.16;
  const tipDrop = height * 0.12;

  // Lưới 2x2 gập cong theo cung nhẹ dọc cả chiều ngang lẫn chiều cao
  const pBL = [-hw, 0, bendZ];
  const pBC = [0, 0, 0];
  const pBR = [hw, 0, bendZ];
  const pML = [-hw * 0.94, height * 0.52, -bendZ * 0.35];
  const pMC = [0, height * 0.56, -bendZ * 0.85];
  const pMR = [hw * 0.94, height * 0.52, -bendZ * 0.35];
  const pTL = [-hw * 0.72, height - tipDrop, bendZ * 0.6];
  const pTC = [0, height, 0];
  const pTR = [hw * 0.72, height - tipDrop, bendZ * 0.6];

  const uvBL = [0, 0];
  const uvBC = [0.5, 0];
  const uvBR = [1, 0];
  const uvML = [0, 0.52];
  const uvMC = [0.5, 0.52];
  const uvMR = [1, 0.52];
  const uvTL = [0, 1];
  const uvTC = [0.5, 1];
  const uvTR = [1, 1];

  const pushTri = (
    posArr: number[],
    uvArr: number[],
    a: readonly number[],
    b: readonly number[],
    c: readonly number[],
    ua: readonly number[],
    ub: readonly number[],
    uc: readonly number[]
  ) => {
    posArr.push(a[0] ?? 0, a[1] ?? 0, a[2] ?? 0);
    posArr.push(b[0] ?? 0, b[1] ?? 0, b[2] ?? 0);
    posArr.push(c[0] ?? 0, c[1] ?? 0, c[2] ?? 0);
    uvArr.push(ua[0] ?? 0, ua[1] ?? 0);
    uvArr.push(ub[0] ?? 0, ub[1] ?? 0);
    uvArr.push(uc[0] ?? 0, uc[1] ?? 0);
  };

  const positions: number[] = [];
  const uvs: number[] = [];

  // Hàng dưới
  pushTri(positions, uvs, pBL, pBC, pMC, uvBL, uvBC, uvMC);
  pushTri(positions, uvs, pBL, pMC, pML, uvBL, uvMC, uvML);
  pushTri(positions, uvs, pBC, pBR, pMR, uvBC, uvBR, uvMR);
  pushTri(positions, uvs, pBC, pMR, pMC, uvBC, uvMR, uvMC);
  // Hàng trên
  pushTri(positions, uvs, pML, pMC, pTC, uvML, uvMC, uvTC);
  pushTri(positions, uvs, pML, pTC, pTL, uvML, uvTC, uvTL);
  pushTri(positions, uvs, pMC, pMR, pTR, uvMC, uvMR, uvTR);
  pushTri(positions, uvs, pMC, pTR, pTC, uvMC, uvTR, uvTC);

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geo.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
  geo.computeVertexNormals();
  return geo;
}

export interface SalixAlbaAssets {
  readonly barkGeo: BufferGeometry;
  readonly foliageGeo: BufferGeometry;
  readonly barkMat: MeshStandardMaterial;
  readonly foliageMat: MeshStandardMaterial;
  readonly leafTexture: CanvasTexture | null;
  readonly dispose: () => void;
}

/**
 * Dựng mô hình 3D cây liễu trắng Salix alba (tham khảo ảnh meye_salix-alba_S1644-1190x2048):
 * - Chiều cao chuẩn đơn vị = 14.5 m, tán rộng ~8.2 m (tỷ lệ mảnh thanh cao 1:1.72)
 * - Gốc bành rễ, thân chính hơi lượn tự nhiên chia cành vươn góc nhọn + cành vươn thấp bên hông
 * - Chùm cành lá thon rủ bạc xanh phân tầng thoáng, giữ được khe sáng qua thân cành.
 */
export function createSalixAlbaAssets(): SalixAlbaAssets {
  const rng = createPrng(16442020);
  const barkParts: BufferGeometry[] = [];
  const foliageParts: BufferGeometry[] = [];
  const twigAnchors: { pos: Vector3; dir: Vector3; scale: number }[] = [];

  // 1. Thân chính từ y = 0 -> 12.1 m (uốn cong nhẹ đặc trưng của S1644)
  const leaderPts: { pos: Vector3; r: number }[] = [
    { pos: new Vector3(0, 0, 0), r: 0.28 },
    { pos: new Vector3(-0.04, 0.55, 0.02), r: 0.21 },
    { pos: new Vector3(-0.1, 2.2, 0.04), r: 0.18 },
    { pos: new Vector3(-0.14, 3.6, 0.06), r: 0.155 },
    { pos: new Vector3(-0.06, 5.4, 0.02), r: 0.125 },
    { pos: new Vector3(0.06, 7.4, -0.04), r: 0.095 },
    { pos: new Vector3(0.02, 9.6, 0.02), r: 0.06 },
    { pos: new Vector3(0.14, 12.1, 0.04), r: 0.024 },
  ];

  for (let i = 0; i < leaderPts.length - 1; i++) {
    const a = leaderPts[i];
    const b = leaderPts[i + 1];
    if (!a || !b) continue;
    barkParts.push(makeBarkSegment(a.pos, b.pos, a.r, b.r, i < 3 ? 7 : 6));
  }

  // 4 bành rễ nhỏ bám chặt bồn đất
  for (let r = 0; r < 4; r++) {
    const ang = (r / 4) * Math.PI * 2 + 0.35;
    barkParts.push(
      makeBarkSegment(
        new Vector3(Math.cos(ang) * 0.25, -0.02, Math.sin(ang) * 0.25),
        new Vector3(Math.cos(ang) * 0.05, 0.58, Math.sin(ang) * 0.05),
        0.11,
        0.06,
        5
      )
    );
  }

  // 2. Hệ cành chính vươn lên theo góc nhọn (~32°–50°) + 1 cành sà ngang lệch hông trái giống ảnh S1644
  const primarySpecs: {
    baseIdx: number;
    azimuth: number;
    elevDeg: number;
    len: number;
    rBase: number;
    subCount: number;
    leafScale: number;
  }[] = [
    // Cành lớn vươn rộng bên hông dưới (tạo dáng bất đối xứng tự nhiên như ảnh mẫu)
    { baseIdx: 3, azimuth: Math.PI * 1.02, elevDeg: 32, len: 3.9, rBase: 0.09, subCount: 4, leafScale: 1.15 },
    { baseIdx: 3, azimuth: 0.35, elevDeg: 42, len: 3.4, rBase: 0.085, subCount: 4, leafScale: 1.08 },
    { baseIdx: 4, azimuth: 2.15, elevDeg: 45, len: 3.3, rBase: 0.08, subCount: 4, leafScale: 1.05 },
    { baseIdx: 4, azimuth: -1.2, elevDeg: 46, len: 3.1, rBase: 0.075, subCount: 3, leafScale: 1.02 },
    { baseIdx: 4, azimuth: 0.95, elevDeg: 50, len: 3.2, rBase: 0.075, subCount: 3, leafScale: 1.0 },
    { baseIdx: 5, azimuth: -2.4, elevDeg: 52, len: 2.8, rBase: 0.065, subCount: 3, leafScale: 0.96 },
    { baseIdx: 5, azimuth: -0.3, elevDeg: 54, len: 2.9, rBase: 0.065, subCount: 3, leafScale: 0.96 },
    { baseIdx: 5, azimuth: 1.65, elevDeg: 55, len: 2.6, rBase: 0.06, subCount: 3, leafScale: 0.92 },
    { baseIdx: 6, azimuth: -1.7, elevDeg: 58, len: 2.3, rBase: 0.048, subCount: 2, leafScale: 0.88 },
    { baseIdx: 6, azimuth: 0.65, elevDeg: 60, len: 2.2, rBase: 0.048, subCount: 2, leafScale: 0.86 },
    { baseIdx: 6, azimuth: 2.7, elevDeg: 60, len: 2.1, rBase: 0.045, subCount: 2, leafScale: 0.85 },
  ];

  for (const spec of primarySpecs) {
    const start = leaderPts[spec.baseIdx]?.pos;
    if (!start) continue;
    const elev = (spec.elevDeg * Math.PI) / 180;
    const dir1 = new Vector3(
      Math.cos(spec.azimuth) * Math.cos(elev),
      Math.sin(elev),
      Math.sin(spec.azimuth) * Math.cos(elev)
    ).normalize();
    const mid = start.clone().addScaledVector(dir1, spec.len * 0.52);
    // Đoạn ngoài hơi ngẩng lên tạo nét mềm mại của cành liễu
    const dir2 = dir1.clone().add(new Vector3(0, 0.22, 0)).normalize();
    const tip = mid.clone().addScaledVector(dir2, spec.len * 0.48);

    barkParts.push(makeBarkSegment(start, mid, spec.rBase, spec.rBase * 0.62, 5));
    barkParts.push(makeBarkSegment(mid, tip, spec.rBase * 0.62, 0.022, 5));

    twigAnchors.push({ pos: tip.clone(), dir: dir2.clone(), scale: spec.leafScale });
    twigAnchors.push({ pos: mid.clone().lerp(tip, 0.55), dir: dir2.clone(), scale: spec.leafScale * 0.92 });

    // Cành cấp 2 chẽ nhánh xung quanh cành chính
    for (let j = 0; j < spec.subCount; j++) {
      const alongT = 0.28 + (j / Math.max(1, spec.subCount - 1)) * 0.55;
      const subOrigin = start.clone().lerp(tip, alongT);
      const subAz = spec.azimuth + (j % 2 === 0 ? 1 : -1) * (0.55 + rng() * 0.45);
      const subElev = elev + (rng() - 0.35) * 0.35;
      const subDir = new Vector3(
        Math.cos(subAz) * Math.cos(subElev),
        Math.sin(subElev),
        Math.sin(subAz) * Math.cos(subElev)
      ).normalize();
      const subLen = spec.len * (0.42 + rng() * 0.22);
      const subTip = subOrigin.clone().addScaledVector(subDir, subLen);

      barkParts.push(makeBarkSegment(subOrigin, subTip, spec.rBase * 0.45, 0.015, 4));
      twigAnchors.push({ pos: subTip.clone(), dir: subDir.clone(), scale: spec.leafScale * 0.9 });
      twigAnchors.push({
        pos: subOrigin.clone().lerp(subTip, 0.58),
        dir: subDir.clone(),
        scale: spec.leafScale * 0.82,
      });
    }
  }

  // Cụm ngọn đỉnh thân chính (y ~ 11.2 -> 14.3 m)
  const lastLeader = leaderPts[leaderPts.length - 1];
  if (lastLeader) {
    const crownTop = lastLeader.pos;
    twigAnchors.push({ pos: crownTop.clone(), dir: new Vector3(0.08, 1, 0).normalize(), scale: 1.0 });
    twigAnchors.push({ pos: crownTop.clone().add(new Vector3(0.25, 0.65, -0.2)), dir: new Vector3(0.2, 1, -0.15).normalize(), scale: 0.92 });
    twigAnchors.push({ pos: crownTop.clone().add(new Vector3(-0.3, 0.45, 0.22)), dir: new Vector3(-0.22, 1, 0.15).normalize(), scale: 0.9 });
  }

  // 3. Tạo tán lá Salix alba 3D dạng cụm cánh lá liễu vòm cong quanh mỗi đầu cành
  const baseCardA = makeArchedLeafSprayCard(1.75, 1.95);
  const baseCardB = makeArchedLeafSprayCard(1.55, 1.75);
  const cShadow = new Color('#77876c');
  const cHighlight = new Color('#b5c2aa');
  const cardColor = new Color();

  for (const anchor of twigAnchors) {
    const cardsInCluster = 3;
    for (let k = 0; k < cardsInCluster; k++) {
      const card = (k === 0 ? baseCardA : baseCardB).clone();
      const yaw = (k / cardsInCluster) * Math.PI + rng() * 0.45;
      const pitch = 0.25 + (rng() - 0.5) * 0.55;
      const roll = (rng() - 0.5) * 0.45;
      const s = anchor.scale * (0.85 + rng() * 0.34);

      const offset = new Vector3(
        (rng() - 0.5) * 0.48,
        (rng() - 0.35) * 0.42,
        (rng() - 0.5) * 0.48
      );
      const pos = anchor.pos.clone().add(offset);
      const quat = new Quaternion().setFromEuler(new Euler(pitch, yaw, roll));
      card.applyMatrix4(new Matrix4().compose(pos, quat, new Vector3(s, s, s)));

      // Tô sắc độ tán lá sáng dần theo độ cao và phía ngoài
      const heightRatio = Math.max(0, Math.min(1, pos.y / 14.5));
      cardColor.copy(cShadow).lerp(cHighlight, 0.25 + heightRatio * 0.6 + rng() * 0.15);
      const posAttr = card.getAttribute('position');
      const vCols = new Float32Array(posAttr.count * 3);
      for (let v = 0; v < posAttr.count; v++) {
        vCols[v * 3] = cardColor.r;
        vCols[v * 3 + 1] = cardColor.g;
        vCols[v * 3 + 2] = cardColor.b;
      }
      card.setAttribute('color', new BufferAttribute(vCols, 3));
      foliageParts.push(card);
    }
  }

  baseCardA.dispose();
  baseCardB.dispose();

  const barkGeo = BufferGeometryUtils.mergeGeometries(barkParts);
  const foliageGeo = BufferGeometryUtils.mergeGeometries(foliageParts);
  barkParts.forEach((g) => g.dispose());
  foliageParts.forEach((g) => g.dispose());

  applyVertexColorGradient(barkGeo, '#4b4432', '#6e654d', 0, 12.1, rng);

  const leafTexture = createSalixLeafTexture();

  const barkMat = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.02,
    flatShading: true,
  });

  const foliageMat = new MeshStandardMaterial({
    map: leafTexture ?? undefined,
    vertexColors: true,
    alphaTest: 0.36,
    side: DoubleSide,
    roughness: 0.82,
    metalness: 0.02,
  });

  return {
    barkGeo,
    foliageGeo,
    barkMat,
    foliageMat,
    leafTexture,
    dispose: () => {
      barkGeo.dispose();
      foliageGeo.dispose();
      barkMat.dispose();
      foliageMat.dispose();
      leafTexture?.dispose();
    },
  };
}

interface SalixAlbaTreesProps {
  readonly instances: readonly SalixAlbaInstance[];
  readonly castShadow?: boolean;
}

/** Hiển thị hàng loạt cây 3D Salix alba bằng InstancedMesh (2 draw calls: vỏ cây + tán lá). */
export default function SalixAlbaTrees({
  instances,
  castShadow = true,
}: SalixAlbaTreesProps) {
  const assets = useMemo(() => createSalixAlbaAssets(), []);
  const barkRef = useRef<InstancedMesh | null>(null);
  const foliageRef = useRef<InstancedMesh | null>(null);

  useEffect(() => {
    return () => {
      assets.dispose();
    };
  }, [assets]);

  useLayoutEffect(() => {
    const barkMesh = barkRef.current;
    const foliageMesh = foliageRef.current;
    if (!barkMesh || !foliageMesh) return;

    const pos = new Vector3();
    const quat = new Quaternion();
    const euler = new Euler();
    const scale = new Vector3();
    const mat = new Matrix4();

    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      if (!inst) continue;
      pos.set(inst.x, inst.y, inst.z);
      euler.set(0, inst.rotY, 0);
      quat.setFromEuler(euler);
      scale.set(inst.scaleXZ, inst.scaleY, inst.scaleXZ);
      mat.compose(pos, quat, scale);
      barkMesh.setMatrixAt(i, mat);
      foliageMesh.setMatrixAt(i, mat);
    }

    barkMesh.instanceMatrix.needsUpdate = true;
    foliageMesh.instanceMatrix.needsUpdate = true;
    barkMesh.computeBoundingSphere();
    foliageMesh.computeBoundingSphere();
  }, [instances]);

  if (instances.length === 0) return null;

  return (
    <group>
      <instancedMesh
        ref={barkRef}
        key={`salix-bark-${instances.length}`}
        args={[assets.barkGeo, assets.barkMat, instances.length]}
        castShadow={castShadow}
        receiveShadow
      />
      <instancedMesh
        ref={foliageRef}
        key={`salix-foliage-${instances.length}`}
        args={[assets.foliageGeo, assets.foliageMat, instances.length]}
        castShadow={castShadow}
        receiveShadow
      />
    </group>
  );
}
