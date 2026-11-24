import { useEffect, useMemo } from 'react';
import {
  BufferGeometry,
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  IcosahedronGeometry,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three';
import { FLOOR_HEIGHT } from '../../data';
import { useSnowStore } from '../../store/useSnowStore';
import { useWalkStore } from '../../store/useWalkStore';
import type { Building } from '../../types';
import { addBox, safeMerge } from '../kit/geometryHelpers';

interface Block4LibraryProps {
  building: Building;
  isHovered?: boolean;
  isSelected?: boolean;
}

const B4_LOCAL_ORIGIN_X = 91.5;
const B4_LOCAL_ORIGIN_Z = -97.4;
const B4_LOCAL_ROT_Y = -0.10912; // -6.25°
const LIBRARY_END_U = 53.5; // Khối thư viện khép tại u = 53.5; u = 53.5..77.5 là Sảnh Atrium B4–B5
const ATRIUM_END_U = 77.5;
const V_LEN = 28.0;

const B4_COS = Math.cos(B4_LOCAL_ROT_Y);
const B4_SIN = Math.sin(B4_LOCAL_ROT_Y);

/**
 * Kiểm tra điểm thế giới [x, z] có nằm trên hành lang rìa 4 mặt, hai sân pergola (Bắc/Nam),
 * lối đi Tây sang B11 hay Sảnh lớn B4–B5 để lọc bỏ ngọn cỏ mọc xuyên nền gạch.
 */
export function isPointInB4Plaza(x: number, z: number): boolean {
  const dx = x - B4_LOCAL_ORIGIN_X;
  const dz = z - B4_LOCAL_ORIGIN_Z;
  const u = dx * B4_COS + dz * B4_SIN;
  const v = -dx * B4_SIN + dz * B4_COS;

  // Toàn bộ khuôn viên bao quanh B4 (tới rìa bê tông ngoài 4 phía) & sảnh chung B4–B5
  if (u >= -3.5 && u <= ATRIUM_END_U && v >= -9.5 && v <= 34.4) {
    // Trừ phần cánh đặc Tây Nam của Block 5
    if (u > 64.2 && v > 28.2) return false;
    return true;
  }
  // Hành lang thép nối từ cửa Tây ra đường trục hướng sang Block 11
  if (u >= -14.0 && u <= 0.0 && v >= 11.4 && v <= 16.6) return true;
  return false;
}

// =============================================================================
// TEXTURE BIỂN HIỆU, HỒ GẠCH MOSAIC, GẠCH HOA GIÓ & CỜ PHƯỚN SẢNH B4–B5
// =============================================================================

interface ExteriorTextures {
  b45Banner: CanvasTexture;
  directoryBoard: CanvasTexture;
  vsipStandee: CanvasTexture;
  welcomeMat: CanvasTexture;
  atriumLogoBand: CanvasTexture;
  blueMosaic: CanvasTexture;
  breezeBlock: CanvasTexture;
  bannerRed: CanvasTexture;
  bannerGreen: CanvasTexture;
  bannerYellow: CanvasTexture;
  posterRed: CanvasTexture;
  posterGreen: CanvasTexture;
  posterPurple: CanvasTexture;
  posterTan: CanvasTexture;
}

let cachedTextures: ExteriorTextures | null = null;

function createCanvasTex(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
  repeat?: readonly [number, number]
): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeat) {
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  tex.needsUpdate = true;
  return tex;
}

function getExteriorTextures(): ExteriorTextures {
  if (cachedTextures) return cachedTextures;

  const b45Banner = createCanvasTex(512, 256, (ctx) => {
    ctx.fillStyle = '#525860';
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 502, 246);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(54, 48, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f3f72';
    ctx.fillRect(42, 42, 24, 5);
    ctx.fillRect(40, 50, 28, 5);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('EIU', 88, 60);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '15px sans-serif';
    ctx.fillText('EASTERN INTERNATIONAL UNIVERSITY', 34, 88);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 84px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('B4-5', 476, 222);
    ctx.textAlign = 'left';
  });

  const directoryBoard = createCanvasTex(256, 360, (ctx) => {
    ctx.fillStyle = '#2d8a68';
    ctx.fillRect(0, 0, 256, 108);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('BẢNG HƯỚNG DẪN', 28, 32);
    ctx.font = '14px sans-serif';
    ctx.fillText('3  · Khu sách chuyên ngành', 18, 68);
    ctx.fillText('   · Phòng đọc yên tĩnh', 18, 90);

    ctx.fillStyle = '#d48a48';
    ctx.fillRect(0, 108, 256, 98);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('2', 16, 152);
    ctx.font = '14px sans-serif';
    ctx.fillText('Phòng học nhóm 01–09', 48, 146);
    ctx.fillText('Phòng đa năng & Tự học', 48, 172);

    ctx.fillStyle = '#d45a3a';
    ctx.fillRect(0, 206, 256, 154);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('1', 16, 252);
    ctx.font = '14px sans-serif';
    ctx.fillText('Quầy thông tin & OPAC', 48, 240);
    ctx.fillText('Khu vực máy tính · In ấn', 48, 268);
    ctx.fillText('Khu tự học · Trao đổi sách', 48, 296);
    ctx.fillText('Sách của cộng đồng', 48, 324);
  });

  const vsipStandee = createCanvasTex(256, 512, (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#0b5cab');
    grad.addColorStop(0.65, '#1d8cd8');
    grad.addColorStop(1, '#5fb536');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 512);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VSIP', 128, 76);
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('CƠ HỘI', 128, 145);
    ctx.fillText('VIỆC LÀM', 128, 182);

    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(24, 220, 208, 115);
    ctx.fillStyle = '#15803d';
    ctx.fillRect(24, 305, 208, 30);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(24, 360, 208, 90);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('EIU CAREER FAIR', 128, 412);
    ctx.textAlign = 'left';
  });

  const welcomeMat = createCanvasTex(256, 128, (ctx) => {
    ctx.fillStyle = '#164e9e';
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, 240, 112);
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WELCOME', 128, 76);
    ctx.textAlign = 'left';
  });

  const atriumLogoBand = createCanvasTex(512, 128, (ctx) => {
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 56, 512, 34);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EASTERN INTERNATIONAL UNIVERSITY', 256, 79);

    ctx.beginPath();
    ctx.arc(256, 28, 24, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(240, 19, 32, 4);
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(236, 27, 40, 4);
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(240, 35, 32, 4);
    ctx.textAlign = 'left';
  });

  // Gạch mosaic xanh đậm (tỷ lệ mét thực 1:1 tránh dãn UV quanh hồ nước)
  const blueMosaic = createCanvasTex(128, 128, (ctx) => {
    const tones = ['#0e4b86', '#1663aa', '#1e75c4', '#0b3868', '#2684d4', '#135393'] as const;
    const cell = 16;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        ctx.fillStyle = tones[(r * 5 + c * 3) % tones.length] ?? '#1663aa';
        ctx.fillRect(c * cell + 1, r * cell + 1, cell - 2, cell - 2);
      }
    }
  });
  blueMosaic.wrapS = RepeatWrapping;
  blueMosaic.wrapT = RepeatWrapping;

  // Gạch hoa gió đa sắc dọc rìa sân pergola ngoài trời
  const breezeBlock = createCanvasTex(
    256,
    128,
    (ctx) => {
      const colors = ['#b4533c', '#c88c42', '#3f7660', '#c7beb2', '#8f4739', '#6e8c5e'] as const;
      ctx.fillStyle = '#554d47';
      ctx.fillRect(0, 0, 256, 128);
      const cell = 32;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 8; c++) {
          ctx.fillStyle = colors[(r * 3 + c * 5) % colors.length] ?? '#c7beb2';
          ctx.fillRect(c * cell + 2, r * cell + 2, cell - 4, cell - 4);
          ctx.fillStyle = '#3d3733';
          ctx.fillRect(c * cell + 9, r * cell + 9, cell - 18, cell - 18);
        }
      }
    },
    [4, 1]
  );

  const makeHangingBanner = (bg: string, label: string, sub: string) =>
    createCanvasTex(160, 420, (ctx) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 160, 420);
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 4;
      ctx.strokeRect(6, 6, 148, 408);

      // Logo EIU đầu phướn
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(80, 46, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(66, 39, 28, 4);
      ctx.fillRect(64, 47, 32, 4);
      ctx.fillRect(66, 55, 28, 4);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('EIU', 80, 92);

      // Chữ dọc khẩu hiệu chính
      ctx.save();
      ctx.translate(80, 245);
      ctx.rotate(-Math.PI / 2);
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(label, 0, 10);
      ctx.restore();

      ctx.font = '13px sans-serif';
      ctx.fillText(sub, 80, 398);
      ctx.textAlign = 'left';
    });

  const makePoster = (bg: string, topText: string, midText: string, subText: string) =>
    createCanvasTex(192, 256, (ctx) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 192, 256);
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, 176, 240);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(topText, 96, 68);
      ctx.fillText(midText, 96, 104);
      ctx.font = '15px sans-serif';
      ctx.fillText(subText, 96, 180);
      ctx.textAlign = 'left';
    });

  cachedTextures = {
    b45Banner,
    directoryBoard,
    vsipStandee,
    welcomeMat,
    atriumLogoBand,
    blueMosaic,
    breezeBlock,
    bannerRed: makeHangingBanner('#c62828', 'ĐỔI MỚI', 'MIỀN ĐÔNG'),
    bannerGreen: makeHangingBanner('#2e7d47', 'PHÁT TRIỂN', 'BỀN VỮNG'),
    bannerYellow: makeHangingBanner('#e0af1f', 'CREATIVITY', 'EIU CAMPUS'),
    posterRed: makePoster('#b83931', 'HÀNH TRÌNH', 'TẠI EIU', 'EIU LIBRARY'),
    posterGreen: makePoster('#2c8d56', 'STAY', 'SAFE', '2m spacing · fresh air'),
    posterPurple: makePoster('#564182', 'GET', 'TESTED', 'CAMPUS CARE'),
    posterTan: makePoster('#c5a37b', 'BE', 'KIND', 'COMMUNITY'),
  };
  return cachedTextures;
}

// =============================================================================
// HÀM TẠO HÌNH HỌC PHỤ TRỢ CHO MÁI VÁT & NỘI THẤT NGOẠI THẤT
// =============================================================================

function createSlopedFascia(
  u1: number,
  u2: number,
  v1: number,
  v2: number,
  yBot: number,
  yTop: number,
  inset: number
): BufferGeometry {
  const geo = new BufferGeometry();
  const pos: number[] = [];
  const idx: number[] = [];

  const pushQuad = (
    a: readonly [number, number, number],
    b: readonly [number, number, number],
    c: readonly [number, number, number],
    d: readonly [number, number, number]
  ) => {
    const base = pos.length / 3;
    pos.push(...a, ...b, ...c, ...d);
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };

  pushQuad([u1, yBot, v2], [u2, yBot, v2], [u2 - inset, yTop, v2 - inset], [u1 + inset, yTop, v2 - inset]);
  pushQuad([u2, yBot, v1], [u1, yBot, v1], [u1 + inset, yTop, v1 + inset], [u2 - inset, yTop, v1 + inset]);
  pushQuad([u2, yBot, v2], [u2, yBot, v1], [u2 - inset, yTop, v1 + inset], [u2 - inset, yTop, v2 - inset]);
  pushQuad([u1, yBot, v1], [u1, yBot, v2], [u1 + inset, yTop, v2 - inset], [u1 + inset, yTop, v1 + inset]);

  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

function addCafeSet(steels: BufferGeometry[], u: number, v: number, baseY: number): void {
  addBox(steels, u - 0.6, u + 0.6, baseY + 0.72, baseY + 0.76, v - 0.45, v + 0.45);
  for (const du of [-0.5, 0.5]) {
    for (const dv of [-0.36, 0.36]) {
      addBox(steels, u + du - 0.03, u + du + 0.03, baseY, baseY + 0.72, v + dv - 0.03, v + dv + 0.03);
    }
  }
  for (const side of [-1, 1]) {
    for (const du of [-0.32, 0.32]) {
      const cu = u + du;
      const cv = v + side * 0.72;
      addBox(steels, cu - 0.2, cu + 0.2, baseY + 0.42, baseY + 0.46, cv - 0.19, cv + 0.19);
      addBox(steels, cu - 0.2, cu + 0.2, baseY + 0.46, baseY + 0.82, cv + side * 0.16, cv + side * 0.2);
      for (const lx of [-0.16, 0.16]) {
        for (const lz of [-0.15, 0.15]) {
          addBox(steels, cu + lx - 0.02, cu + lx + 0.02, baseY, baseY + 0.42, cv + lz - 0.02, cv + lz + 0.02);
        }
      }
    }
  }
}

function createPlanarQuad(u1: number, u2: number, v1: number, v2: number, y: number, uvScale = 0.8): BufferGeometry {
  const geo = new BufferGeometry();
  const pos = new Float32Array([
    u1, y, v1,
    u1, y, v2,
    u2, y, v2,
    u1, y, v1,
    u2, y, v2,
    u2, y, v1,
  ]);
  const norm = new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]);
  const uv = new Float32Array([
    u1 * uvScale, v1 * uvScale,
    u1 * uvScale, v2 * uvScale,
    u2 * uvScale, v2 * uvScale,
    u1 * uvScale, v1 * uvScale,
    u2 * uvScale, v2 * uvScale,
    u2 * uvScale, v1 * uvScale,
  ]);
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new Float32BufferAttribute(norm, 3));
  geo.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  return geo;
}

function addPergolaSection(
  woodDecks: BufferGeometry[],
  darkSteels: BufferGeometry[],
  curbs: BufferGeometry[],
  foliage: BufferGeometry[],
  u1: number,
  u2: number,
  vMin: number,
  vMax: number,
  outerEdgeAtMaxV: boolean,
  tableUs: readonly number[],
  outerOpeningU?: readonly [number, number]
): void {
  const outerV = outerEdgeAtMaxV ? vMax : vMin;
  const wallV1 = outerEdgeAtMaxV ? vMax - 0.26 : vMin;
  const wallV2 = outerEdgeAtMaxV ? vMax : vMin + 0.26;
  const bushV = outerEdgeAtMaxV ? vMax - 0.52 : vMin + 0.52;

  // Sàn gỗ ấm ngoài trời
  addBox(woodDecks, u1, u2, 0.04, 0.16, vMin, vMax);
  // Bồn gạch thấp dọc mép ngoài (lối bên hành lang cột mở hoàn toàn)
  if (outerOpeningU) {
    addBox(curbs, u1, outerOpeningU[0], 0.16, 0.96, wallV1, wallV2);
    addBox(curbs, outerOpeningU[1], u2, 0.16, 0.96, wallV1, wallV2);
  } else {
    addBox(curbs, u1, u2, 0.16, 0.96, wallV1, wallV2);
  }
  addBox(curbs, u1, u1 + 0.24, 0.16, 0.96, outerEdgeAtMaxV ? vMin + 2.8 : vMin + 0.26, outerEdgeAtMaxV ? wallV1 : vMax - 2.8);
  addBox(curbs, u2 - 0.24, u2, 0.16, 0.96, outerEdgeAtMaxV ? vMin + 2.8 : vMin + 0.26, outerEdgeAtMaxV ? wallV1 : vMax - 2.8);

  for (let lu = u1 + 0.9; lu <= u2 - 0.9; lu += 1.45) {
    if (outerOpeningU && lu >= outerOpeningU[0] - 0.3 && lu <= outerOpeningU[1] + 0.3) continue;
    const leaf = new IcosahedronGeometry(0.4, 1);
    leaf.scale(1.15, 0.72, 0.88);
    leaf.translate(lu, 0.95, bushV);
    foliage.push(leaf);
  }

  // Khung cột thép đen H-beam & dàn giàn thép lưới che nắng trên mái
  const stepCount = Math.max(2, Math.round((u2 - u1) / 4.2));
  for (let i = 0; i <= stepCount; i++) {
    const cu = u1 + 0.15 + ((u2 - u1 - 0.3) * i) / stepCount;
    addBox(darkSteels, cu - 0.09, cu + 0.09, 0.16, 3.62, outerV + (outerEdgeAtMaxV ? -0.22 : 0.04), outerV + (outerEdgeAtMaxV ? -0.04 : 0.22));
    addBox(darkSteels, cu - 0.07, cu + 0.07, 3.48, 3.64, vMin - 0.08, vMax + 0.08);
  }
  addBox(darkSteels, u1, u2, 3.48, 3.64, outerEdgeAtMaxV ? vMax - 0.2 : vMin, outerEdgeAtMaxV ? vMax : vMin + 0.2);
  for (let lv = vMin + 0.45; lv < vMax; lv += 0.78) {
    addBox(darkSteels, u1, u2, 3.52, 3.58, lv - 0.03, lv + 0.03);
  }
  for (let lu = u1 + 0.6; lu < u2; lu += 0.85) {
    addBox(darkSteels, lu - 0.02, lu + 0.02, 3.55, 3.58, vMin, vMax);
  }

  const tableV = (vMin + vMax) * 0.5 + (outerEdgeAtMaxV ? 0.15 : -0.15);
  for (const tu of tableUs) {
    addCafeSet(darkSteels, tu, tableV, 0.16);
  }
}

/**
 * Ngoại thất Thư viện EIU (Block 4) + Sảnh lớn thông tầng B4–B5 có hồ nước trung tâm:
 * - Hành lang đá gạch sáng rộng bao quanh ĐỦ 4 MẶT (Tây lùi sau trụ lõi thang/WC, Bắc, Nam & thông vào Sảnh B4–B5).
 * - Lối đi mái che nối cửa Tây ra trục đường sang Block 11.
 * - HAI sân pergola ngoài trời sàn gỗ, giàn mái thép đen, rào gạch hoa gió & bàn ghế cafe ở cả mặt Nam (B3) và mặt Bắc (Fami/B11).
 * - Sảnh lớn thông tầng 3 tầng B4–B5 (`u = 53.5..77.5`): đi bộ xuyên qua Bắc ↔ Nam tự do quanh hồ đá tối, viền gạch mosaic xanh,
 *   các khối đá ngọc xanh, cửa kính đôi Lối Vào Thư Viện ở phía Tây hồ, bồn cây xanh phía B5, ban công tầng 2–3 lan can kính,
 *   cờ phướn EIU treo thả & mái giếng trời giàn không gian.
 */
export default function Block4Library({ building, isHovered, isSelected }: Block4LibraryProps) {
  const isSnowing = useSnowStore((s) => s.isSnowing);
  const walkMode = useWalkStore((s) => s.walkMode);
  const activeSelected = Boolean(isSelected && !walkMode);
  const activeHovered = Boolean(isHovered && !walkMode);
  const emissiveColor = activeSelected ? '#60a5fa' : activeHovered ? '#38bdf8' : '#000000';
  const emissiveIntensity = activeSelected ? 0.14 : activeHovered ? 0.08 : 0;
  const totalH = building.height;

  const textures = useMemo(() => getExteriorTextures(), []);

  const {
    stuccoGeo,
    creamGeo,
    soffitTileGeo,
    colonnadeFloorGeo,
    apronFloorGeo,
    whiteFrameGeo,
    darkSteelGeo,
    corridorGlassGeo,
    skylightGlassGeo,
    poolStoneGeo,
    poolWaterGeo,
    poolMoatGeo,
    jadeBlockGeo,
    curtainBlueGeo,
    woodDeckGeo,
    planterWallGeo,
    foliageGeo,
    roofSoffitGeo,
    roofFasciaGeo,
    roofDeckGeo,
    inoxGeo,
  } = useMemo(() => {
    const stucco: BufferGeometry[] = [];
    const cream: BufferGeometry[] = [];
    const soffitTiles: BufferGeometry[] = [];
    const colonnadeFloors: BufferGeometry[] = [];
    const apronFloors: BufferGeometry[] = [];
    const whiteFrames: BufferGeometry[] = [];
    const darkSteels: BufferGeometry[] = [];
    const corridorGlass: BufferGeometry[] = [];
    const skylightGlass: BufferGeometry[] = [];
    const poolStone: BufferGeometry[] = [];
    const poolWater: BufferGeometry[] = [];
    const poolMoats: BufferGeometry[] = [];
    const jadeBlocks: BufferGeometry[] = [];
    const curtainBlue: BufferGeometry[] = [];
    const woodDecks: BufferGeometry[] = [];
    const planterWalls: BufferGeometry[] = [];
    const foliage: BufferGeometry[] = [];
    const roofSoffits: BufferGeometry[] = [];
    const roofDecks: BufferGeometry[] = [];
    const inox: BufferGeometry[] = [];

    const southCurtainV = 24.8; // Hành lang Nam (v = 24.8..28.0)
    const northCurtainV = 2.8; // Hành lang Bắc (v = 0.0..2.8)
    const westCurtainU = 3.4; // Hành lang Tây bọc quanh đuôi tòa nhà (u = 0.0..3.4)

    // -------------------------------------------------------------------------
    // 1. NỀN ĐÁ GẠCH HÀNH LANG BAO QUANH 4 MẶT + SẢNH B4–B5 + LỐI ĐI NGOÀI BAO QUANH
    // -------------------------------------------------------------------------
    // Hành lang có mái che 4 phía & Sảnh lớn B4–B5 (cao độ y = 0.14)
    addBox(colonnadeFloors, 0.0, ATRIUM_END_U, 0.0, 0.14, southCurtainV - 0.05, V_LEN + 0.25); // Hành lang Nam
    addBox(colonnadeFloors, 0.0, ATRIUM_END_U, 0.0, 0.14, -0.25, northCurtainV + 0.05); // Hành lang Bắc
    addBox(colonnadeFloors, 0.0, westCurtainU + 0.1, 0.0, 0.14, northCurtainV, southCurtainV); // Hành lang Tây rộng 3.4 m
    addBox(colonnadeFloors, LIBRARY_END_U - 0.1, ATRIUM_END_U, 0.0, 0.14, -0.5, 28.25); // Toàn bộ nền Sảnh B4–B5
    addBox(colonnadeFloors, LIBRARY_END_U, 64.2, 0.0, 0.14, 28.25, 33.6); // Sảnh đón Porte-cochère phía Nam atrium

    // Vỉa hè & sân bê tông xám bao quanh ngoài hành lang & hai sân pergola (cao độ y = 0.10)
    addBox(apronFloors, -3.2, 0.0, 0.0, 0.1, -2.5, 30.5); // Sân bao phía Tây (quảng trường / B11)
    addBox(apronFloors, 0.0, ATRIUM_END_U, 0.0, 0.1, -9.0, -6.0); // Đường đi ngoài rìa Bắc pergola (hướng Fami/B11)
    addBox(apronFloors, 43.8, ATRIUM_END_U, 0.0, 0.1, -6.0, -0.25); // Sân Bắc thông vào sảnh B4–B5
    addBox(apronFloors, 0.0, 10.6, 0.0, 0.1, 28.25, 32.0); // Sân Tây Nam ngoài hành lang
    addBox(apronFloors, 10.6, 14.3, 0.0, 0.1, 28.25, 32.0); // Đón cầu đi bộ Tây (Bridge 2)
    addBox(apronFloors, 26.7, 30.5, 0.0, 0.1, 28.25, 32.0); // Đón cầu đi bộ Đông (Bridge 1)
    addBox(apronFloors, 43.8, LIBRARY_END_U, 0.0, 0.1, 28.25, 33.6); // Sân Nam nối vào Porte-cochère

    // Lối đi bộ mái che nối từ cửa Tây ra đường trục hướng sang Block 11 (step_581_shot_2)
    addBox(apronFloors, -13.5, -3.2, 0.0, 0.12, 11.8, 16.2);
    addBox(roofSoffits, -13.5, 0.0, 3.15, 3.25, 11.8, 16.2);
    for (let su = -13.0; su <= -0.5; su += 4.1) {
      addBox(darkSteels, su - 0.06, su + 0.06, 0.12, 3.15, 11.96, 12.08);
      addBox(darkSteels, su - 0.06, su + 0.06, 0.12, 3.15, 15.92, 16.04);
      addBox(darkSteels, su - 0.05, su + 0.05, 3.08, 3.15, 11.96, 16.04);
    }

    // Trần thạch cao ô vuông trắng dưới tầng 2 của cả 3 hành lang (Tây, Bắc, Nam)
    addBox(soffitTiles, 0.25, LIBRARY_END_U, 3.55, 3.65, southCurtainV + 0.05, V_LEN - 0.25);
    addBox(soffitTiles, 0.25, LIBRARY_END_U, 3.55, 3.65, 0.25, northCurtainV - 0.05);
    addBox(soffitTiles, 0.25, westCurtainU - 0.05, 3.55, 3.65, northCurtainV - 0.05, southCurtainV + 0.05);

    // -------------------------------------------------------------------------
    // 2. LÕI TƯỜNG NÂU MẬN TẦNG 1 LÙI SÂU VÀO TRONG (CHỪA HÀNH LANG TÂY RỘNG 3.4 m!)
    // -------------------------------------------------------------------------
    // Khối kỹ thuật & WC/thang bộ phía Tây lùi vào u = 3.4..11.5 (chừa sảnh cửa Tây v = 12.2..15.8)
    addBox(stucco, westCurtainU, 11.5, 0.14, 3.56, northCurtainV, 12.2);
    addBox(stucco, westCurtainU, 11.5, 0.14, 3.56, 15.8, southCurtainV);
    addBox(stucco, 4.0, 11.5, 0.14, 3.56, 12.2, 15.8);
    // Dải cửa chớp trắng trên tường kỹ thuật mặt Tây (tầng 1..3)
    for (const ly of [2.5, 6.2, 9.8]) {
      const lu = ly < 3.6 ? westCurtainU : 0.0;
      addBox(whiteFrames, lu - 0.05, lu + 0.05, ly, ly + 0.65, 5.2, 10.2);
      addBox(whiteFrames, lu - 0.05, lu + 0.05, ly, ly + 0.65, 17.8, 22.8);
    }
    // Cửa kính đôi phía Tây bên trong hành lang Tây (u = westCurtainU = 3.4, v = 12.2..15.8)
    addBox(whiteFrames, westCurtainU - 0.05, westCurtainU + 0.05, 2.48, 2.56, 12.2, 15.8);
    addBox(whiteFrames, westCurtainU - 0.05, westCurtainU + 0.05, 3.4, 3.56, 12.2, 15.8);
    addBox(whiteFrames, westCurtainU - 0.05, westCurtainU + 0.05, 0.14, 3.56, 12.18, 12.28);
    addBox(whiteFrames, westCurtainU - 0.05, westCurtainU + 0.05, 0.14, 3.56, 15.72, 15.82);
    addBox(corridorGlass, westCurtainU - 0.02, westCurtainU + 0.03, 0.16, 3.42, 12.26, 15.74);
    addBox(inox, westCurtainU - 0.09, westCurtainU - 0.02, 0.95, 1.55, 13.86, 13.92);
    addBox(inox, westCurtainU - 0.09, westCurtainU - 0.02, 0.95, 1.55, 14.08, 14.14);

    // -------------------------------------------------------------------------
    // 3. VÁCH KÍNH TẦNG 1 LÙI SÂU MẶT NAM & MẶT BẮC (u = 11.5..53.5)
    // -------------------------------------------------------------------------
    for (const [uA, uB] of [
      [11.5, 45.2],
      [49.2, LIBRARY_END_U],
    ] as const) {
      addBox(whiteFrames, uA, uB, 0.14, 0.24, southCurtainV - 0.06, southCurtainV + 0.08);
      addBox(stucco, uA, uB, 0.24, 0.9, southCurtainV - 0.04, southCurtainV + 0.06);
      addBox(corridorGlass, uA + 0.06, uB - 0.06, 0.94, 3.48, southCurtainV - 0.02, southCurtainV + 0.03);
      addBox(whiteFrames, uA, uB, 0.88, 0.96, southCurtainV - 0.05, southCurtainV + 0.06);
      addBox(whiteFrames, uA, uB, 2.42, 2.5, southCurtainV - 0.05, southCurtainV + 0.06);
      addBox(whiteFrames, uA, uB, 3.46, 3.55, southCurtainV - 0.05, southCurtainV + 0.06);
      for (let mu = uA; mu <= uB + 0.01; mu += 1.9) {
        addBox(whiteFrames, mu - 0.04, mu + 0.04, 0.9, 3.54, southCurtainV - 0.05, southCurtainV + 0.06);
      }
    }
    // Cửa phụ phía Nam ("Lối Vào Thư Viện EIU" u = 45.2..49.2)
    addBox(stucco, 45.2, 46.2, 0.14, 3.56, southCurtainV - 0.12, southCurtainV + 0.1);
    addBox(stucco, 48.4, 49.2, 0.14, 3.56, southCurtainV - 0.12, southCurtainV + 0.1);
    addBox(stucco, 46.2, 48.4, 3.45, 3.6, southCurtainV - 0.12, southCurtainV + 0.1);
    addBox(whiteFrames, 46.18, 48.42, 2.48, 2.56, southCurtainV - 0.05, southCurtainV + 0.05);
    addBox(whiteFrames, 46.18, 48.42, 3.38, 3.46, southCurtainV - 0.05, southCurtainV + 0.05);
    addBox(whiteFrames, 46.18, 46.25, 2.5, 3.45, southCurtainV - 0.05, southCurtainV + 0.05);
    addBox(whiteFrames, 48.35, 48.42, 2.5, 3.45, southCurtainV - 0.05, southCurtainV + 0.05);
    addBox(corridorGlass, 46.24, 48.36, 0.16, 3.42, southCurtainV - 0.02, southCurtainV + 0.03);
    addBox(darkSteels, 46.2, 48.4, 0.14, 0.19, southCurtainV - 0.06, southCurtainV + 0.06);
    addBox(inox, 47.2, 47.25, 0.95, 1.55, southCurtainV + 0.04, southCurtainV + 0.1);
    addBox(inox, 47.35, 47.4, 0.95, 1.55, southCurtainV + 0.04, southCurtainV + 0.1);

    // Mặt Bắc tầng 1 (v = northCurtainV = 2.8), chừa cửa phụ khu in ấn u = 47.0..50.0
    for (const [uA, uB] of [
      [11.5, 47.0],
      [50.0, LIBRARY_END_U],
    ] as const) {
      addBox(stucco, uA, uB, 0.14, 0.88, northCurtainV - 0.04, northCurtainV + 0.06);
      addBox(corridorGlass, uA + 0.05, uB - 0.05, 0.9, 3.48, northCurtainV - 0.02, northCurtainV + 0.03);
      addBox(whiteFrames, uA, uB, 0.88, 0.96, northCurtainV - 0.05, northCurtainV + 0.06);
      addBox(whiteFrames, uA, uB, 2.42, 2.5, northCurtainV - 0.05, northCurtainV + 0.06);
      for (let mu = uA; mu <= uB + 0.01; mu += 2.2) {
        addBox(whiteFrames, mu - 0.04, mu + 0.04, 0.88, 3.52, northCurtainV - 0.05, northCurtainV + 0.06);
      }
    }
    addBox(whiteFrames, 47.0, 50.0, 2.48, 2.56, northCurtainV - 0.05, northCurtainV + 0.05);
    addBox(whiteFrames, 47.0, 50.0, 3.38, 3.46, northCurtainV - 0.05, northCurtainV + 0.05);
    addBox(whiteFrames, 47.0, 47.08, 0.16, 3.45, northCurtainV - 0.05, northCurtainV + 0.05);
    addBox(whiteFrames, 49.92, 50.0, 0.16, 3.45, northCurtainV - 0.05, northCurtainV + 0.05);
    addBox(corridorGlass, 47.06, 49.94, 0.16, 3.42, northCurtainV - 0.02, northCurtainV + 0.03);
    addBox(darkSteels, 47.0, 50.0, 0.14, 0.19, northCurtainV - 0.06, northCurtainV + 0.06);
    addBox(inox, 48.4, 48.45, 0.95, 1.55, northCurtainV - 0.1, northCurtainV - 0.04);
    addBox(inox, 48.55, 48.6, 0.95, 1.55, northCurtainV - 0.1, northCurtainV - 0.04);

    // -------------------------------------------------------------------------
    // 4. TẦNG 2 & 3 KHỐI THƯ VIỆN (u = 0..53.5) + HÀNG CỘT HÀNH LANG ĐỦ 4 CẠNH
    // -------------------------------------------------------------------------
    // Khối đặc tầng 2 & 3 đầu Tây (u = 0..11.5) trùm ra trên hành lang Tây v = 0..28
    addBox(stucco, 0.0, 11.5, 3.56, totalH, 0.0, V_LEN);
    addBox(cream, -0.15, 11.5, 3.54, 3.82, -0.15, V_LEN + 0.15);
    addBox(cream, -0.15, 11.5, FLOOR_HEIGHT * 2 - 0.12, FLOOR_HEIGHT * 2 + 0.14, -0.15, V_LEN + 0.15);

    const bayCols = [11.5, 19.2, 26.8, 34.4, 42.0, 49.6] as const;

    for (let f = 1; f < building.floors; f++) {
      const yBase = f * FLOOR_HEIGHT;
      addBox(cream, 11.3, LIBRARY_END_U, yBase - 0.12, yBase + 0.14, -0.15, 0.16);
      addBox(cream, 11.3, LIBRARY_END_U, yBase - 0.12, yBase + 0.14, V_LEN - 0.16, V_LEN + 0.15);

      // Tường bệ & dầm nâu mận trên dãy kính băng ngang (u = 11.5..53.5)
      addBox(stucco, 11.5, LIBRARY_END_U, yBase + 0.14, yBase + 1.52, 0.0, 0.45);
      addBox(stucco, 11.5, LIBRARY_END_U, yBase + 0.14, yBase + 1.52, V_LEN - 0.45, V_LEN);
      addBox(stucco, 11.5, LIBRARY_END_U, yBase + 2.86, yBase + FLOOR_HEIGHT - 0.12, 0.0, 0.45);
      addBox(stucco, 11.5, LIBRARY_END_U, yBase + 2.86, yBase + FLOOR_HEIGHT - 0.12, V_LEN - 0.45, V_LEN);

      const wMinY = yBase + 1.52;
      const wMaxY = yBase + 2.82;
      addBox(corridorGlass, 11.5, LIBRARY_END_U, wMinY, wMaxY, 0.28, 0.42);
      addBox(corridorGlass, 11.5, LIBRARY_END_U, wMinY, wMaxY, V_LEN - 0.42, V_LEN - 0.28);
      addBox(darkSteels, 11.5, LIBRARY_END_U, wMinY - 0.03, wMinY + 0.04, 0.24, 0.44);
      addBox(darkSteels, 11.5, LIBRARY_END_U, wMinY - 0.03, wMinY + 0.04, V_LEN - 0.44, V_LEN - 0.24);
      for (let wu = 11.5; wu <= LIBRARY_END_U; wu += 1.52) {
        addBox(darkSteels, wu - 0.03, wu + 0.03, wMinY, wMaxY, 0.25, 0.43);
        addBox(darkSteels, wu - 0.03, wu + 0.03, wMinY, wMaxY, V_LEN - 0.43, V_LEN - 0.25);
      }

      // Ô văng chắn nắng kem nhô ra 0.78 m
      addBox(cream, 11.3, LIBRARY_END_U, wMaxY - 0.02, wMaxY + 0.16, -0.78, 0.32);
      addBox(cream, 11.3, LIBRARY_END_U, wMaxY - 0.02, wMaxY + 0.16, V_LEN - 0.32, V_LEN + 0.78);
    }

    // Hệ cột hành lang Tây (u = 0.3, cao 3 tầng) + cột dọc mặt Nam & Bắc
    for (const wv of [0.3, 7.0, 14.0, 21.0, 27.7] as const) {
      addBox(cream, 0.0, 0.6, 0.0, totalH, wv - 0.3, wv + 0.3);
    }
    for (const cu of bayCols) {
      addBox(cream, cu - 0.3, cu + 0.3, 0.0, totalH, V_LEN - 0.42, V_LEN + 0.22);
      addBox(cream, cu - 0.3, cu + 0.3, 0.0, totalH, -0.22, 0.42);
      addBox(cream, cu - 0.14, cu + 0.14, totalH - 0.55, totalH + 0.1, V_LEN + 0.18, V_LEN + 0.82);
      addBox(cream, cu - 0.14, cu + 0.14, totalH - 0.55, totalH + 0.1, -0.82, -0.18);
    }

    // -------------------------------------------------------------------------
    // 5. HAI SÂN PERGOLA CAFE NGOÀI TRỜI (BÊN HÔNG BẮC HƯỚNG FAMI/B11 & BÊN HÔNG NAM HƯỚNG B3)
    // -------------------------------------------------------------------------
    // Mặt Bắc (hướng Fami Pizza & B11): u = 12.0..43.8, v = -6.0..0.0, chừa lối đi u = 26.8..29.2
    addPergolaSection(
      woodDecks,
      darkSteels,
      planterWalls,
      foliage,
      12.0,
      43.8,
      -6.0,
      0.0,
      false,
      [14.5, 19.0, 23.5, 28.0, 32.5, 37.0, 41.3],
      [26.8, 29.2]
    );
    // Mặt Nam (hướng Block 3 & hồ): tách 2 khu chừa lối đi thông hai cầu B3 (u = 10.7..13.9 & 27.0..30.2)
    addPergolaSection(woodDecks, darkSteels, planterWalls, foliage, 14.4, 26.6, V_LEN, 34.0, true, [
      16.5, 20.5, 24.5,
    ]);
    addPergolaSection(woodDecks, darkSteels, planterWalls, foliage, 30.6, 43.8, V_LEN, 34.0, true, [
      32.8, 37.2, 41.6,
    ]);

    // -------------------------------------------------------------------------
    // 6. SẢNH LỚN THÔNG TẦNG B4–B5 & HỒ NƯỚC TRUNG TÂM (u = 53.5..77.5, v = 0..28)
    // -------------------------------------------------------------------------
    // 6a. Hồ nước trung tâm: viền bệ đá tối cao 0.62 m + mặt nước gương + 3 khối đá ngọc xanh
    addBox(poolStone, 61.0, 70.0, 0.14, 0.76, 9.0, 9.38);
    addBox(poolStone, 61.0, 70.0, 0.14, 0.76, 18.62, 19.0);
    addBox(poolStone, 61.0, 61.38, 0.14, 0.76, 9.38, 18.62);
    addBox(poolStone, 69.62, 70.0, 0.14, 0.76, 9.38, 18.62);
    addBox(poolStone, 61.38, 69.62, 0.14, 0.48, 9.38, 18.62); // Lòng bể đá tối dưới nước
    addBox(poolWater, 61.38, 69.62, 0.68, 0.72, 9.38, 18.62);
    // Viền gạch mosaic xanh quanh chân hồ (4 dải gộp chung UV đồng nhất)
    poolMoats.push(
      createPlanarQuad(59.8, 71.2, 7.8, 9.0, 0.148),
      createPlanarQuad(59.8, 71.2, 19.0, 20.2, 0.148),
      createPlanarQuad(59.8, 61.0, 9.0, 19.0, 0.148),
      createPlanarQuad(70.0, 71.2, 9.0, 19.0, 0.148)
    );
    // 3 trụ đá cẩm thạch xanh ngọc nhô lên giữa mặt hồ (giống hệt ảnh chụp số 3 của người dùng)
    addBox(jadeBlocks, 63.75, 64.35, 0.68, 1.72, 11.9, 12.5);
    addBox(jadeBlocks, 66.2, 66.8, 0.68, 1.56, 15.3, 15.9);
    addBox(jadeBlocks, 67.5, 68.05, 0.68, 1.66, 11.1, 11.65);

    // 6b. Mặt Tây Sảnh B4–B5 (u = 53.5): Lối vào kính đôi Thư viện hướng Đông ra thẳng hồ nước!
    addBox(stucco, LIBRARY_END_U - 0.4, LIBRARY_END_U + 0.05, 0.14, 3.8, northCurtainV, 10.5);
    addBox(stucco, LIBRARY_END_U - 0.4, LIBRARY_END_U + 0.05, 0.14, 3.8, 17.5, southCurtainV);
    // Vách kính toàn khổ & cửa đôi chính ở giữa (v = 10.5..17.5, cửa mở v = 12.2..15.8)
    addBox(corridorGlass, LIBRARY_END_U - 0.04, LIBRARY_END_U + 0.04, 0.16, 3.74, 10.5, 17.5);
    addBox(whiteFrames, LIBRARY_END_U - 0.06, LIBRARY_END_U + 0.06, 2.52, 2.6, 10.5, 17.5);
    addBox(whiteFrames, LIBRARY_END_U - 0.06, LIBRARY_END_U + 0.06, 3.68, 3.78, 10.5, 17.5);
    for (const mv of [10.5, 12.2, 15.8, 17.5]) {
      addBox(whiteFrames, LIBRARY_END_U - 0.06, LIBRARY_END_U + 0.06, 0.14, 3.78, mv - 0.05, mv + 0.05);
    }
    // Tay nắm inox cửa chính sảnh B4–B5
    addBox(inox, LIBRARY_END_U + 0.04, LIBRARY_END_U + 0.1, 0.95, 1.58, 13.86, 13.92);
    addBox(inox, LIBRARY_END_U + 0.04, LIBRARY_END_U + 0.1, 0.95, 1.58, 14.08, 14.14);

    // Quầy lễ tân/bảo vệ nhỏ & bình chữa cháy bên tường góc Tây Nam sảnh B4–B5 (giống ảnh 3)
    addBox(cream, 53.65, 54.5, 0.14, 0.92, 20.0, 22.6);
    addBox(inox, 54.35, 54.55, 0.14, 0.72, 18.2, 18.4);

    // 6c. Bồn gạch đất nung trồng hàng cây xanh sát tường B5 phía Đông sảnh (u = 75.8..77.5)
    addBox(planterWalls, 75.8, 77.5, 0.14, 0.52, 5.5, 22.5);
    for (let fv = 6.2; fv <= 21.8; fv += 0.95) {
      const hedge = new IcosahedronGeometry(0.75, 1);
      hedge.scale(0.95, 1.45, 0.95);
      hedge.translate(76.55, 1.38, fv);
      foliage.push(hedge);
    }

    // 6d. Hàng cột cao 3 tầng, hành lang tầng 2 & 3 nhìn xuống hồ, vách kính lấy sáng & giếng trời
    const atriumColsU = [54.2, 62.5, 70.5, 76.8] as const;
    for (const cu of atriumColsU) {
      addBox(cream, cu - 0.36, cu + 0.36, 0.0, totalH, 0.04, 0.76);
      addBox(cream, cu - 0.36, cu + 0.36, 0.0, totalH, V_LEN - 0.76, V_LEN - 0.04);
    }
    for (const [iu, iv] of [
      [54.2, 9.2],
      [54.2, 18.8],
      [76.8, 9.2],
      [76.8, 18.8],
    ] as const) {
      addBox(cream, iu - 0.36, iu + 0.36, 0.0, totalH, iv - 0.36, iv + 0.36);
    }

    // Sàn hành lang tầng 2 (y = 3.8) & tầng 3 (y = 7.6) chạy quanh 4 cạnh sảnh thông tầng + lan can kính
    for (const ySlab of [FLOOR_HEIGHT, FLOOR_HEIGHT * 2]) {
      // 4 dải hành lang ban công quanh giếng trời trung tâm (u = 56.5..74.5, v = 3.0..25.0 là khoảng thông tầng)
      addBox(cream, LIBRARY_END_U, ATRIUM_END_U, ySlab - 0.12, ySlab + 0.14, 0.0, 3.0);
      addBox(cream, LIBRARY_END_U, ATRIUM_END_U, ySlab - 0.12, ySlab + 0.14, 25.0, V_LEN);
      addBox(cream, LIBRARY_END_U, 56.5, ySlab - 0.12, ySlab + 0.14, 3.0, 25.0);
      addBox(cream, 74.5, ATRIUM_END_U, ySlab - 0.12, ySlab + 0.14, 3.0, 25.0);

      // Lan can kính + tay vịn thép đen 4 cạnh ban công thông tầng
      addBox(darkSteels, 56.5, 74.5, ySlab + 1.06, ySlab + 1.12, 2.94, 3.02);
      addBox(darkSteels, 56.5, 74.5, ySlab + 1.06, ySlab + 1.12, 24.98, 25.06);
      addBox(darkSteels, 56.44, 56.52, ySlab + 1.06, ySlab + 1.12, 3.0, 25.0);
      addBox(darkSteels, 74.48, 74.56, ySlab + 1.06, ySlab + 1.12, 3.0, 25.0);

      addBox(corridorGlass, 56.5, 74.5, ySlab + 0.14, ySlab + 1.06, 2.96, 3.0);
      addBox(corridorGlass, 56.5, 74.5, ySlab + 0.14, ySlab + 1.06, 25.0, 25.04);
      addBox(corridorGlass, 56.46, 56.5, ySlab + 0.14, ySlab + 1.06, 3.0, 25.0);
      addBox(corridorGlass, 74.5, 74.54, ySlab + 0.14, ySlab + 1.06, 3.0, 25.0);

      // Cột lan can dọc theo chu vi ban công
      for (let ru = 56.5; ru <= 74.5; ru += 3.0) {
        addBox(darkSteels, ru - 0.03, ru + 0.03, ySlab + 0.14, ySlab + 1.1, 2.94, 3.02);
        addBox(darkSteels, ru - 0.03, ru + 0.03, ySlab + 0.14, ySlab + 1.1, 24.98, 25.06);
      }
      for (let rv = 3.0; rv <= 25.0; rv += 3.1) {
        addBox(darkSteels, 56.44, 56.52, ySlab + 0.14, ySlab + 1.1, rv - 0.03, rv + 0.03);
        addBox(darkSteels, 74.48, 74.56, ySlab + 0.14, ySlab + 1.1, rv - 0.03, rv + 0.03);
      }
    }

    // Mảng kính phản quang tầng 2–3 phía Bắc (u = 53.5..77.5) & phía Nam (u = 53.5..64.2), tầng trệt mở hoàn toàn
    addBox(curtainBlue, LIBRARY_END_U, ATRIUM_END_U, FLOOR_HEIGHT - 0.05, totalH - 0.05, 0.08, 0.24);
    addBox(curtainBlue, LIBRARY_END_U, 64.22, FLOOR_HEIGHT - 0.05, totalH - 0.05, V_LEN - 0.24, V_LEN - 0.08);
    for (let u = LIBRARY_END_U; u <= ATRIUM_END_U; u += 2.0) {
      addBox(darkSteels, u - 0.04, u + 0.04, FLOOR_HEIGHT - 0.05, totalH, 0.06, 0.26);
      if (u <= 64.22) {
        addBox(darkSteels, u - 0.04, u + 0.04, FLOOR_HEIGHT - 0.05, totalH, V_LEN - 0.26, V_LEN - 0.06);
      }
    }
    for (const gy of [3.8, 5.1, 6.4, 7.6, 8.9, 10.2, 11.3]) {
      addBox(darkSteels, LIBRARY_END_U, ATRIUM_END_U, gy - 0.04, gy + 0.04, 0.06, 0.26);
      addBox(darkSteels, LIBRARY_END_U, 64.22, gy - 0.04, gy + 0.04, V_LEN - 0.26, V_LEN - 0.06);
    }

    // Sảnh đón Porte-cochère nhô ra phía Nam atrium (u = 54.5..63.8, v = 28.0..33.4)
    addBox(cream, 54.5, 63.8, 3.58, 3.84, V_LEN, 33.4);
    addBox(darkSteels, 54.45, 63.85, 3.78, 3.9, V_LEN, 33.46);
    for (const pu of [56.8, 61.5]) {
      addBox(cream, pu - 0.3, pu + 0.3, 0.14, 3.58, 31.1, 31.7);
      addBox(darkSteels, pu - 0.09, pu + 0.09, 2.25, 2.58, 31.7, 31.77);
    }
    addBox(cream, 54.5, 63.8, 3.84, 4.06, 32.85, 33.4);
    for (let fu = 54.9; fu <= 63.4; fu += 0.48) {
      const fMesh = new IcosahedronGeometry(0.28, 1);
      fMesh.scale(1.1, 0.72, 0.85);
      fMesh.translate(fu, 4.14, 33.12);
      foliage.push(fMesh);
    }

    // -------------------------------------------------------------------------
    // 7. MÁI NHÀ THƯ VIỆN + MÁI GIẾNG TRỜI KHUNG GIÀN KHÔNG GIAN SẢNH B4–B5
    // -------------------------------------------------------------------------
    // Mái chìa bê tông kem & mái vát nâu mận khối Thư viện (u = 0..53.5)
    addBox(roofSoffits, -1.2, LIBRARY_END_U, totalH, totalH + 0.28, -1.2, V_LEN + 1.2);
    const roofFascia = createSlopedFascia(-0.55, LIBRARY_END_U, -0.55, V_LEN + 0.55, totalH + 0.27, totalH + 1.16, 1.05);
    addBox(roofDecks, 0.48, LIBRARY_END_U - 0.1, totalH + 1.06, totalH + 1.15, 0.48, V_LEN - 0.48);

    // Dải mái bao quanh giếng trời sảnh B4–B5 (u = 53.5..77.5, chừa lỗ giếng trời u = 57..74, v = 4.5..23.5)
    addBox(roofSoffits, LIBRARY_END_U, ATRIUM_END_U, totalH, totalH + 0.28, -1.2, 4.5);
    addBox(roofSoffits, LIBRARY_END_U, ATRIUM_END_U, totalH, totalH + 0.28, 23.5, V_LEN + 1.2);
    addBox(roofSoffits, LIBRARY_END_U, 57.0, totalH, totalH + 0.28, 4.5, 23.5);
    addBox(roofSoffits, 74.0, ATRIUM_END_U, totalH, totalH + 0.28, 4.5, 23.5);

    addBox(roofDecks, LIBRARY_END_U, ATRIUM_END_U, totalH + 0.28, totalH + 0.52, -0.3, 4.5);
    addBox(roofDecks, LIBRARY_END_U, 64.2, totalH + 0.28, totalH + 0.52, 23.5, V_LEN + 0.3);
    addBox(roofDecks, 64.2, ATRIUM_END_U, totalH + 0.28, totalH + 0.52, 23.5, 28.08);
    addBox(roofDecks, LIBRARY_END_U, 57.0, totalH + 0.28, totalH + 0.52, 4.5, 23.5);
    addBox(roofDecks, 74.0, ATRIUM_END_U, totalH + 0.28, totalH + 0.52, 4.5, 23.5);

    // Giàn khung thép & mái kính giếng trời vát nhẹ trên ô trung tâm (y = 11.7..13.8)
    for (let tu = 57.0; tu <= 74.01; tu += 2.8) {
      addBox(darkSteels, tu - 0.08, tu + 0.08, totalH + 0.35, totalH + 2.25, 4.45, 4.65);
      addBox(darkSteels, tu - 0.08, tu + 0.08, totalH + 0.35, totalH + 2.25, 23.35, 23.55);
      addBox(darkSteels, tu - 0.06, tu + 0.06, totalH + 2.1, totalH + 2.32, 4.45, 23.55);
      addBox(darkSteels, tu - 0.04, tu + 0.04, totalH + 0.65, totalH + 0.78, 4.5, 23.5);
    }
    for (let tv = 4.5; tv <= 23.51; tv += 2.7) {
      addBox(darkSteels, 56.9, 74.1, totalH + 2.15, totalH + 2.34, tv - 0.05, tv + 0.05);
    }
    addBox(skylightGlass, 56.95, 74.05, totalH + 2.3, totalH + 2.38, 4.45, 23.55);

    return {
      stuccoGeo: safeMerge(stucco),
      creamGeo: safeMerge(cream),
      soffitTileGeo: safeMerge(soffitTiles),
      colonnadeFloorGeo: safeMerge(colonnadeFloors),
      apronFloorGeo: safeMerge(apronFloors),
      whiteFrameGeo: safeMerge(whiteFrames),
      darkSteelGeo: safeMerge(darkSteels),
      corridorGlassGeo: safeMerge(corridorGlass),
      skylightGlassGeo: safeMerge(skylightGlass),
      poolStoneGeo: safeMerge(poolStone),
      poolWaterGeo: safeMerge(poolWater),
      poolMoatGeo: safeMerge(poolMoats),
      jadeBlockGeo: safeMerge(jadeBlocks),
      curtainBlueGeo: safeMerge(curtainBlue),
      woodDeckGeo: safeMerge(woodDecks),
      planterWallGeo: safeMerge(planterWalls),
      foliageGeo: safeMerge(foliage),
      roofSoffitGeo: safeMerge(roofSoffits),
      roofFasciaGeo: roofFascia,
      roofDeckGeo: safeMerge(roofDecks),
      inoxGeo: safeMerge(inox),
    };
  }, [building.floors, totalH]);

  useEffect(() => {
    return () => {
      stuccoGeo?.dispose();
      creamGeo?.dispose();
      soffitTileGeo?.dispose();
      colonnadeFloorGeo?.dispose();
      apronFloorGeo?.dispose();
      whiteFrameGeo?.dispose();
      darkSteelGeo?.dispose();
      corridorGlassGeo?.dispose();
      skylightGlassGeo?.dispose();
      poolStoneGeo?.dispose();
      poolWaterGeo?.dispose();
      poolMoatGeo?.dispose();
      jadeBlockGeo?.dispose();
      curtainBlueGeo?.dispose();
      woodDeckGeo?.dispose();
      planterWallGeo?.dispose();
      foliageGeo?.dispose();
      roofSoffitGeo?.dispose();
      roofFasciaGeo.dispose();
      roofDeckGeo?.dispose();
      inoxGeo?.dispose();
    };
  }, [
    stuccoGeo,
    creamGeo,
    soffitTileGeo,
    colonnadeFloorGeo,
    apronFloorGeo,
    whiteFrameGeo,
    darkSteelGeo,
    corridorGlassGeo,
    skylightGlassGeo,
    poolStoneGeo,
    poolWaterGeo,
    poolMoatGeo,
    jadeBlockGeo,
    curtainBlueGeo,
    woodDeckGeo,
    planterWallGeo,
    foliageGeo,
    roofSoffitGeo,
    roofFasciaGeo,
    roofDeckGeo,
    inoxGeo,
  ]);

  // Chậu cây trang trí dọc hành lang Nam & sảnh B4–B5
  const entrancePotGeo = useMemo(() => {
    const pots: BufferGeometry[] = [];
    for (const [pu, pv] of [
      [44.6, 25.3],
      [54.2, 19.6],
      [62.5, 26.8],
      [54.2, 8.4],
    ] as const) {
      const pot = new CylinderGeometry(0.28, 0.24, 0.56, 10);
      pot.translate(pu, 0.42, pv);
      pots.push(pot);
    }
    return safeMerge(pots);
  }, []);

  useEffect(() => () => entrancePotGeo?.dispose(), [entrancePotGeo]);

  return (
    <group position={[B4_LOCAL_ORIGIN_X, 0, B4_LOCAL_ORIGIN_Z]} rotation-y={-B4_LOCAL_ROT_Y}>
      {stuccoGeo && (
        <mesh geometry={stuccoGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color="#684c4f"
            roughness={0.76}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity * 0.75}
          />
        </mesh>
      )}
      {creamGeo && (
        <mesh geometry={creamGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color={isSnowing ? '#f1f5f9' : '#e6dfd3'}
            roughness={0.65}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity * 0.7}
          />
        </mesh>
      )}
      {soffitTileGeo && (
        <mesh geometry={soffitTileGeo}>
          <meshStandardMaterial color="#f1f5f9" roughness={0.75} />
        </mesh>
      )}
      {colonnadeFloorGeo && (
        <mesh geometry={colonnadeFloorGeo} receiveShadow>
          <meshStandardMaterial color="#c4cad1" roughness={0.55} />
        </mesh>
      )}
      {apronFloorGeo && (
        <mesh geometry={apronFloorGeo} receiveShadow>
          <meshStandardMaterial color="#b4bbc4" roughness={0.78} />
        </mesh>
      )}
      {whiteFrameGeo && (
        <mesh geometry={whiteFrameGeo}>
          <meshStandardMaterial color="#f8fafc" roughness={0.35} metalness={0.18} />
        </mesh>
      )}
      {darkSteelGeo && (
        <mesh geometry={darkSteelGeo} castShadow>
          <meshStandardMaterial color="#1c2128" roughness={0.42} metalness={0.55} />
        </mesh>
      )}
      {corridorGlassGeo && (
        <mesh geometry={corridorGlassGeo}>
          <meshStandardMaterial color="#1f4259" transparent opacity={0.62} roughness={0.12} metalness={0.35} />
        </mesh>
      )}
      {skylightGlassGeo && (
        <mesh geometry={skylightGlassGeo}>
          <meshStandardMaterial color="#e0f2fe" transparent opacity={0.42} roughness={0.22} metalness={0.15} />
        </mesh>
      )}
      {poolStoneGeo && (
        <mesh geometry={poolStoneGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#3c424a" roughness={0.72} />
        </mesh>
      )}
      {poolWaterGeo && (
        <mesh geometry={poolWaterGeo} receiveShadow>
          <meshStandardMaterial color="#216598" roughness={0.08} metalness={0.62} />
        </mesh>
      )}
      {jadeBlockGeo && (
        <mesh geometry={jadeBlockGeo} castShadow>
          <meshStandardMaterial color="#48a384" roughness={0.4} metalness={0.12} />
        </mesh>
      )}
      {curtainBlueGeo && (
        <mesh geometry={curtainBlueGeo}>
          <meshStandardMaterial
            color="#225570"
            roughness={0.14}
            metalness={0.55}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity * 0.4}
          />
        </mesh>
      )}
      {woodDeckGeo && (
        <mesh geometry={woodDeckGeo} receiveShadow>
          <meshStandardMaterial color="#7c5238" roughness={0.78} />
        </mesh>
      )}
      {planterWallGeo && (
        <mesh geometry={planterWallGeo} castShadow receiveShadow>
          <meshStandardMaterial map={textures.breezeBlock} color="#d6cdc2" roughness={0.82} />
        </mesh>
      )}
      {foliageGeo && (
        <mesh geometry={foliageGeo} castShadow>
          <meshStandardMaterial color="#2e6f3e" roughness={0.8} />
        </mesh>
      )}
      {roofSoffitGeo && (
        <mesh geometry={roofSoffitGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color={isSnowing ? '#f8fafc' : '#e6dfd3'}
            roughness={0.68}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity * 0.5}
          />
        </mesh>
      )}
      {roofFasciaGeo && (
        <mesh geometry={roofFasciaGeo} castShadow>
          <meshStandardMaterial
            color="#563d40"
            roughness={0.72}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity * 0.5}
          />
        </mesh>
      )}
      {roofDeckGeo && (
        <mesh geometry={roofDeckGeo} receiveShadow>
          <meshStandardMaterial
            color={isSnowing ? '#f8fafc' : '#b5bac0'}
            roughness={0.72}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity * 0.4}
          />
        </mesh>
      )}
      {inoxGeo && (
        <mesh geometry={inoxGeo}>
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
        </mesh>
      )}
      {entrancePotGeo && (
        <mesh geometry={entrancePotGeo} castShadow>
          <meshStandardMaterial color="#64748b" roughness={0.75} />
        </mesh>
      )}

      {/* Viền gạch mosaic xanh quanh chân hồ nước sảnh B4–B5 */}
      {poolMoatGeo && (
        <mesh geometry={poolMoatGeo} receiveShadow>
          <meshStandardMaterial map={textures.blueMosaic} roughness={0.22} metalness={0.2} />
        </mesh>
      )}

      {/* Cờ phướn dọc EIU (đỏ, xanh lá, vàng CREATIVITY) treo dọc các cột tầng 3 sảnh B4–B5 */}
      {(
        [
          { pos: [54.6, 8.4, 8.2] as const, rotY: Math.PI / 2, tex: textures.bannerGreen },
          { pos: [54.6, 8.4, 19.8] as const, rotY: Math.PI / 2, tex: textures.bannerRed },
          { pos: [62.5, 8.4, 24.4] as const, rotY: 0, tex: textures.bannerRed },
          { pos: [70.5, 8.4, 24.4] as const, rotY: 0, tex: textures.bannerYellow },
          { pos: [76.2, 8.4, 8.2] as const, rotY: -Math.PI / 2, tex: textures.bannerYellow },
          { pos: [76.2, 8.4, 19.8] as const, rotY: -Math.PI / 2, tex: textures.bannerRed },
        ] as const
      ).map(({ pos, rotY, tex }, i) => (
        <mesh key={`atrium-banner-${i}`} position={pos} rotation-y={rotY}>
          <planeGeometry args={[1.15, 3.3]} />
          <meshStandardMaterial map={tex} side={DoubleSide} roughness={0.45} />
        </mesh>
      ))}

      {/* Biển ngang EIU · B4-5 viền đỏ trên mặt đứng kính phía Nam sảnh B4–B5 */}
      <mesh position={[58.8, 9.05, V_LEN + 0.04]}>
        <planeGeometry args={[4.8, 2.3]} />
        <meshStandardMaterial map={textures.b45Banner} roughness={0.4} />
      </mesh>

      {/* Bảng hướng dẫn 3 tầng dán cạnh cửa kính Nam & cửa chính từ sảnh B4–B5 */}
      <mesh position={[47.82, 1.48, 24.86]}>
        <planeGeometry args={[0.92, 1.32]} />
        <meshStandardMaterial map={textures.directoryBoard} roughness={0.35} />
      </mesh>
      <mesh position={[LIBRARY_END_U + 0.06, 1.48, 16.5]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[0.92, 1.32]} />
        <meshStandardMaterial map={textures.directoryBoard} roughness={0.35} />
      </mesh>

      {/* Standee VSIP trên bệ trắng cạnh cửa Lối Vào Thư Viện EIU */}
      <group position={[49.8, 0.14, 25.05]}>
        <mesh position={[0, 0.07, 0]}>
          <boxGeometry args={[0.98, 0.14, 0.42]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.06, 0]}>
          <boxGeometry args={[0.82, 1.84, 0.08]} />
          <meshStandardMaterial color="#0b5cab" roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.06, 0.045]}>
          <planeGeometry args={[0.8, 1.8]} />
          <meshStandardMaterial map={textures.vsipStandee} roughness={0.35} />
        </mesh>
      </group>

      {/* Thảm xanh WELCOME trước đủ 4 cửa kính vào Thư viện */}
      <mesh position={[47.3, 0.155, 25.65]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1.9, 1.1]} />
        <meshStandardMaterial map={textures.welcomeMat} roughness={0.88} />
      </mesh>
      <mesh position={[LIBRARY_END_U + 0.9, 0.155, 14.0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[2.2, 1.15]} />
        <meshStandardMaterial map={textures.welcomeMat} roughness={0.88} />
      </mesh>
      <mesh position={[48.5, 0.155, 1.9]} rotation={[-Math.PI / 2, 0, Math.PI]}>
        <planeGeometry args={[1.9, 1.05]} />
        <meshStandardMaterial map={textures.welcomeMat} roughness={0.88} />
      </mesh>
      <mesh position={[2.4, 0.155, 14.0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
        <planeGeometry args={[1.9, 1.05]} />
        <meshStandardMaterial map={textures.welcomeMat} roughness={0.88} />
      </mesh>

      {/* Dải xanh EASTERN INTERNATIONAL UNIVERSITY + Logo EIU cửa chính hướng ra sảnh B4–B5 */}
      <mesh position={[LIBRARY_END_U + 0.06, 2.95, 14.0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[3.4, 0.85]} />
        <meshStandardMaterial map={textures.atriumLogoBand} transparent roughness={0.35} />
      </mesh>

      {/* Bộ poster màu dán kính dọc hành lang Lối Vào Thư Viện EIU */}
      {(
        [
          { u: 43.2, tex: textures.posterRed },
          { u: 40.4, tex: textures.posterGreen },
          { u: 37.6, tex: textures.posterPurple },
          { u: 34.8, tex: textures.posterTan },
          { u: 32.0, tex: textures.posterGreen },
          { u: 29.2, tex: textures.posterPurple },
        ] as const
      ).map(({ u, tex }) => (
        <mesh key={`ext-post-${u}`} position={[u, 1.72, 24.86]}>
          <planeGeometry args={[1.05, 1.38]} />
          <meshStandardMaterial map={tex} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}
