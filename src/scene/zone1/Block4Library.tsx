import { useEffect, useMemo } from 'react';
import {
  BufferGeometry,
  CanvasTexture,
  CylinderGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
  SRGBColorSpace,
} from 'three';
import { FLOOR_HEIGHT } from '../../data';
import { useSnowStore } from '../../store/useSnowStore';
import { useWalkStore } from '../../store/useWalkStore';
import type { Building } from '../../types';
import {
  addBox,
  createExtrudedPolygon,
  expandShapePolygon,
  safeMerge,
  stripClosingPoint,
  toShapePoints,
} from '../kit/geometryHelpers';

interface Block4LibraryProps {
  building: Building;
  isHovered?: boolean;
  isSelected?: boolean;
}

const B4_LOCAL_ORIGIN_X = 91.5;
const B4_LOCAL_ORIGIN_Z = -97.4;
const B4_LOCAL_ROT_Y = -0.10912; // -6.25°
const U_LEN = 67.0;
const V_LEN = 28.0;

const B4_COS = Math.cos(B4_LOCAL_ROT_Y);
const B4_SIN = Math.sin(B4_LOCAL_ROT_Y);

/** Kiểm tra điểm thế giới [x, z] có nằm trên sân bê tông hành lang / pergola / sảnh đón Block 4 để lọc bỏ ngọn cỏ. */
export function isPointInB4Plaza(x: number, z: number): boolean {
  const dx = x - B4_LOCAL_ORIGIN_X;
  const dz = z - B4_LOCAL_ORIGIN_Z;
  const u = dx * B4_COS + dz * B4_SIN;
  const v = -dx * B4_SIN + dz * B4_COS;

  if (u >= 11.0 && u <= 66.8 && v >= 24.4 && v <= 32.0) return true;
  if (u >= 30.2 && u <= 43.6 && v >= 28.0 && v <= 34.4) return true;
  if (u >= 54.8 && u <= 64.6 && v >= 28.0 && v <= 34.0) return true;
  if (u >= 11.0 && u <= 66.8 && v >= -0.6 && v <= 2.8) return true;
  if (u >= -1.8 && u <= 0.4 && v >= 11.8 && v <= 16.2) return true;
  return false;
}

// =============================================================================
// TEXTURE BIỂN HIỆU & POSTER NGOẠI THẤT ĐỐI CHIẾU TOUR 360° KHAMPHAEIU
// =============================================================================

interface ExteriorTextures {
  b45Banner: CanvasTexture;
  directoryBoard: CanvasTexture;
  vsipStandee: CanvasTexture;
  welcomeMat: CanvasTexture;
  atriumLogoBand: CanvasTexture;
  posterRed: CanvasTexture;
  posterGreen: CanvasTexture;
  posterPurple: CanvasTexture;
  posterTan: CanvasTexture;
}

let cachedTextures: ExteriorTextures | null = null;

function createCanvasTex(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
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
    // Tầng 3 - Xanh lá
    ctx.fillStyle = '#2d8a68';
    ctx.fillRect(0, 0, 256, 108);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('BẢNG HƯỚNG DẪN', 28, 32);
    ctx.font = '14px sans-serif';
    ctx.fillText('3  · Khu sách chuyên ngành', 18, 68);
    ctx.fillText('   · Phòng đọc yên tĩnh', 18, 90);

    // Tầng 2 - Vàng nâu
    ctx.fillStyle = '#d48a48';
    ctx.fillRect(0, 108, 256, 98);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('2', 16, 152);
    ctx.font = '14px sans-serif';
    ctx.fillText('Phòng học nhóm 01–09', 48, 146);
    ctx.fillText('Phòng đa năng & Tự học', 48, 172);

    // Tầng 1 - Cam đất
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

  // Nam (+V), Bắc (-V), Đông (+U), Tây (-U)
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
  // Bàn cafe thép đen + 4 ghế nan đen trên sàn pergola
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

/**
 * Mặt đứng ngoại thất Thư viện EIU (Block 4 — 3 tầng = 11.4 m).
 * Dựng lại đối chiếu trực tiếp với tour 360° thực tế tại https://demo.eiu.vn/KhamPhaEIU/index.htm:
 * - Tường vữa sơn nâu mận đặc trưng kết hợp cột, chỉ sàn, ô văng chắn nắng & diềm mái kem sáng.
 * - Tầng 1 lùi hành lang cột có mái che, trần ô caro trắng, bệ tường nâu thấp, vách kính khung trắng,
 *   cửa kính đôi "Lối Vào Thư Viện EIU" kèm thảm xanh WELCOME, bảng hướng dẫn & standee VSIP.
 * - Góc Đông Nam giáp Block 5 có vách kính phản quang xanh ngọc 3 tầng, biển ngang EIU B4-5
 *   và sảnh đón porte-cochère có viền bồn cây trên mái.
 * - Mặt Nam giáp cầu đi bộ có sân pergola khung thép đen, sàn gỗ, bàn ghế cafe & bồn gạch hoa gió.
 * - Mái vát viền nâu mận trên nền mái tôn ghi sáng cùng giàn ô văng mái đua sâu 1.2 m.
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
    whiteFrameGeo,
    darkSteelGeo,
    corridorGlassGeo,
    curtainBlueGeo,
    woodDeckGeo,
    planterWallGeo,
    foliageGeo,
    roofSoffitGeo,
    roofFasciaGeo,
    roofDeckGeo,
    blueSignGeo,
    inoxGeo,
  } = useMemo(() => {
    const stucco: BufferGeometry[] = [];
    const cream: BufferGeometry[] = [];
    const soffitTiles: BufferGeometry[] = [];
    const colonnadeFloors: BufferGeometry[] = [];
    const whiteFrames: BufferGeometry[] = [];
    const darkSteels: BufferGeometry[] = [];
    const corridorGlass: BufferGeometry[] = [];
    const curtainBlue: BufferGeometry[] = [];
    const woodDecks: BufferGeometry[] = [];
    const planterWalls: BufferGeometry[] = [];
    const foliage: BufferGeometry[] = [];
    const roofDecks: BufferGeometry[] = [];
    const blueSigns: BufferGeometry[] = [];
    const inox: BufferGeometry[] = [];

    const yColBottom = 0.0;
    const southCurtainV = 24.8; // Hành lang có mái che lùi sâu 3.2 m vào từ mép v = 28.0
    const northCurtainV = 2.6; // Hành lang mặt Bắc lùi 2.6 m vào từ mép v = 0.0
    const mainBayEndU = 54.0; // Điểm chuyển tiếp sang vách kính xanh B4–B5 (u = 54..67)

    // -------------------------------------------------------------------------
    // 1. NỀN HÀNH LANG ĐÁ GẠCH SÁNG & TRẦN Ô CARO TẦNG 1 (step_258, step_264)
    // -------------------------------------------------------------------------
    addBox(colonnadeFloors, 11.0, U_LEN, 0.0, 0.14, southCurtainV - 0.1, V_LEN + 0.35);
    addBox(colonnadeFloors, 11.0, 64.2, 0.0, 0.1, V_LEN + 0.35, 31.6); // Vỉa hè & sân bê tông xám dọc mặt Nam
    addBox(colonnadeFloors, 11.0, U_LEN, 0.0, 0.14, -0.25, northCurtainV + 0.1);
    addBox(colonnadeFloors, 55.0, 64.2, 0.0, 0.14, 31.6, 33.6); // Sân đón porte-cochère

    // Trần thạch cao ô vuông trắng dưới dầm tầng 2 hành lang Nam & Bắc
    addBox(soffitTiles, 11.2, U_LEN - 0.1, 3.55, 3.65, southCurtainV + 0.05, V_LEN - 0.25);
    addBox(soffitTiles, 11.2, U_LEN - 0.1, 3.55, 3.65, 0.25, northCurtainV - 0.05);

    // -------------------------------------------------------------------------
    // 2. KHỐI LÕI TƯỜNG NÂU MẬN TẦNG 1–3 & LÕI KỸ THUẬT TÂY (u = 0..11.5)
    // -------------------------------------------------------------------------
    addBox(stucco, 0.0, 11.5, 3.56, totalH, 0.0, V_LEN);
    addBox(stucco, 0.0, 11.5, 0.0, 3.56, 0.0, 12.2);
    addBox(stucco, 0.0, 11.5, 0.0, 3.56, 15.8, V_LEN);
    addBox(stucco, 0.55, 11.5, 0.0, 3.56, 12.2, 15.8);
    // Hốc cửa phụ Tây (nối B11, u = 0, v = 12.2..15.8)
    addBox(colonnadeFloors, -0.4, 0.55, 0.0, 0.14, 12.2, 15.8);
    addBox(whiteFrames, -0.05, 0.05, 2.48, 2.56, 12.2, 15.8);
    addBox(whiteFrames, -0.05, 0.05, 3.4, 3.56, 12.2, 15.8);
    addBox(whiteFrames, -0.05, 0.05, 0.14, 3.56, 12.18, 12.28);
    addBox(whiteFrames, -0.05, 0.05, 0.14, 3.56, 15.72, 15.82);
    addBox(corridorGlass, -0.02, 0.03, 0.16, 3.42, 12.26, 15.74);
    addBox(inox, -0.08, -0.02, 0.95, 1.55, 13.86, 13.92);
    addBox(inox, -0.08, -0.02, 0.95, 1.55, 14.08, 14.14);

    addBox(stucco, 11.5, U_LEN - 0.3, 0.14, FLOOR_HEIGHT - 0.15, northCurtainV - 0.3, northCurtainV + 0.1);
    // Dải cửa chớp trắng trên tường kỹ thuật phía Tây & Bắc
    for (const ly of [2.5, 6.2, 9.8]) {
      addBox(whiteFrames, -0.04, 0.06, ly, ly + 0.65, 6.0, 10.5);
      addBox(whiteFrames, -0.04, 0.06, ly, ly + 0.65, 17.5, 22.0);
    }

    // Các khối trụ tường nâu mận đầu Đông (quanh bảng xe lăn & lối vào atrium)
    addBox(stucco, 49.6, 54.0, 0.14, totalH, V_LEN - 0.55, V_LEN);
    addBox(stucco, 49.6, 54.0, 0.14, totalH, 0.0, 0.55);
    // Biển xe lăn xanh dương gắn trên tường trụ nâu góc Đông Nam (step_308_shot_2)
    addBox(blueSigns, 52.3, 52.9, 1.75, 2.35, V_LEN, V_LEN + 0.05);

    // -------------------------------------------------------------------------
    // 3. MẶT ĐỨNG TẦNG 1 LÙI SÂU: BỆ TƯỜNG NÂU + VÁCH KÍNH TRẮNG + LỐI VÀO THƯ VIỆN
    // -------------------------------------------------------------------------
    // Mặt Nam (v = southCurtainV): trừ khoảng cửa chính (u = 45.2..49.2) & cửa atrium (u = 58.2..62.8)
    for (const [uA, uB] of [
      [11.5, 45.2],
      [49.2, 58.2],
      [62.8, 66.8],
    ] as const) {
      // Bệ tường nâu thấp + len chân tường trắng (step_258_shot_3)
      addBox(whiteFrames, uA, uB, 0.14, 0.24, southCurtainV - 0.06, southCurtainV + 0.08);
      addBox(stucco, uA, uB, 0.24, 0.9, southCurtainV - 0.04, southCurtainV + 0.06);
      // Kính & khung nhôm trắng
      addBox(corridorGlass, uA + 0.06, uB - 0.06, 0.94, 3.48, southCurtainV - 0.02, southCurtainV + 0.03);
      addBox(whiteFrames, uA, uB, 0.88, 0.96, southCurtainV - 0.05, southCurtainV + 0.06);
      addBox(whiteFrames, uA, uB, 2.42, 2.5, southCurtainV - 0.05, southCurtainV + 0.06);
      addBox(whiteFrames, uA, uB, 3.46, 3.55, southCurtainV - 0.05, southCurtainV + 0.06);
      for (let mu = uA; mu <= uB + 0.01; mu += 1.9) {
        addBox(whiteFrames, mu - 0.04, mu + 0.04, 0.9, 3.54, southCurtainV - 0.05, southCurtainV + 0.06);
      }
    }

    // Lối Vào Thư Viện EIU chính (u = 45.2..49.2, step_264_shot_2)
    addBox(stucco, 45.2, 46.2, 0.14, 3.56, southCurtainV - 0.12, southCurtainV + 0.1);
    addBox(stucco, 48.4, 49.2, 0.14, 3.56, southCurtainV - 0.12, southCurtainV + 0.1);
    addBox(stucco, 46.2, 48.4, 3.45, 3.6, southCurtainV - 0.12, southCurtainV + 0.1);
    // Vách kính ô trên (white transom) & 2 cánh kính cường lực không khung + tay nắm inox
    addBox(whiteFrames, 46.18, 48.42, 2.48, 2.56, southCurtainV - 0.05, southCurtainV + 0.05);
    addBox(whiteFrames, 46.18, 48.42, 3.38, 3.46, southCurtainV - 0.05, southCurtainV + 0.05);
    addBox(whiteFrames, 46.18, 46.25, 2.5, 3.45, southCurtainV - 0.05, southCurtainV + 0.05);
    addBox(whiteFrames, 48.35, 48.42, 2.5, 3.45, southCurtainV - 0.05, southCurtainV + 0.05);
    addBox(corridorGlass, 46.24, 48.36, 0.16, 3.42, southCurtainV - 0.02, southCurtainV + 0.03);
    addBox(darkSteels, 46.2, 48.4, 0.14, 0.19, southCurtainV - 0.06, southCurtainV + 0.06);
    addBox(inox, 47.2, 47.25, 0.95, 1.55, southCurtainV + 0.04, southCurtainV + 0.1);
    addBox(inox, 47.35, 47.4, 0.95, 1.55, southCurtainV + 0.04, southCurtainV + 0.1);

    // Lối vào sảnh atrium phía Đông (u = 58.2..62.8, step_281_shot_1)
    addBox(corridorGlass, 58.25, 62.75, 0.18, 3.48, southCurtainV - 0.02, southCurtainV + 0.03);
    addBox(whiteFrames, 58.2, 62.8, 2.48, 2.55, southCurtainV - 0.05, southCurtainV + 0.05);
    addBox(whiteFrames, 58.2, 62.8, 3.44, 3.52, southCurtainV - 0.05, southCurtainV + 0.05);
    for (const mu of [58.2, 59.35, 61.65, 62.8]) {
      addBox(whiteFrames, mu - 0.04, mu + 0.04, 0.16, 3.52, southCurtainV - 0.05, southCurtainV + 0.05);
    }

    // Hành lang & vách kính Tầng 1 mặt Bắc (v = northCurtainV), chừa cửa phụ u = 47.0..50.0
    for (const [uA, uB] of [
      [11.5, 47.0],
      [50.0, 66.8],
    ] as const) {
      addBox(stucco, uA, uB, 0.14, 0.88, northCurtainV - 0.04, northCurtainV + 0.06);
      addBox(corridorGlass, uA + 0.05, uB - 0.05, 0.9, 3.48, northCurtainV - 0.02, northCurtainV + 0.03);
      addBox(whiteFrames, uA, uB, 0.88, 0.96, northCurtainV - 0.05, northCurtainV + 0.06);
      addBox(whiteFrames, uA, uB, 2.42, 2.5, northCurtainV - 0.05, northCurtainV + 0.06);
      for (let mu = uA; mu <= uB + 0.01; mu += 2.2) {
        addBox(whiteFrames, mu - 0.04, mu + 0.04, 0.88, 3.52, northCurtainV - 0.05, northCurtainV + 0.06);
      }
    }
    // Cửa kính đôi mặt Bắc (u = 47.0..50.0, v = northCurtainV)
    addBox(whiteFrames, 47.0, 50.0, 2.48, 2.56, northCurtainV - 0.05, northCurtainV + 0.05);
    addBox(whiteFrames, 47.0, 50.0, 3.38, 3.46, northCurtainV - 0.05, northCurtainV + 0.05);
    addBox(whiteFrames, 47.0, 47.08, 0.16, 3.45, northCurtainV - 0.05, northCurtainV + 0.05);
    addBox(whiteFrames, 49.92, 50.0, 0.16, 3.45, northCurtainV - 0.05, northCurtainV + 0.05);
    addBox(corridorGlass, 47.06, 49.94, 0.16, 3.42, northCurtainV - 0.02, northCurtainV + 0.03);
    addBox(darkSteels, 47.0, 50.0, 0.14, 0.19, northCurtainV - 0.06, northCurtainV + 0.06);
    addBox(inox, 48.4, 48.45, 0.95, 1.55, northCurtainV - 0.1, northCurtainV - 0.04);
    addBox(inox, 48.55, 48.6, 0.95, 1.55, northCurtainV - 0.1, northCurtainV - 0.04);

    // -------------------------------------------------------------------------
    // 4. TẦNG 2 & 3: MẢNG NÂU MẬN LỚN + CỬA SỔ BĂNG NGANG LÙI SÂU + Ô VĂNG KEM (step_387_shot_1)
    // -------------------------------------------------------------------------
    const bayCols = [11.5, 19.2, 26.8, 34.4, 42.0, 49.6] as const;

    for (let f = 1; f < building.floors; f++) {
      const yBase = f * FLOOR_HEIGHT;
      // Gờ chỉ sàn kem chạy dọc chu vi mặt đứng
      addBox(cream, 11.3, 54.2, yBase - 0.12, yBase + 0.14, -0.15, 0.16);
      addBox(cream, 11.3, 54.2, yBase - 0.12, yBase + 0.14, V_LEN - 0.16, V_LEN + 0.15);

      // Tường bệ đặc nâu mận (dưới băng cửa sổ: cao 1.45 m) & dầm trên (yBase + 2.82 .. yBase + 3.68)
      addBox(stucco, 11.5, 49.6, yBase + 0.14, yBase + 1.52, 0.0, 0.45);
      addBox(stucco, 11.5, 49.6, yBase + 0.14, yBase + 1.52, V_LEN - 0.45, V_LEN);
      addBox(stucco, 11.5, 49.6, yBase + 2.86, yBase + FLOOR_HEIGHT - 0.12, 0.0, 0.45);
      addBox(stucco, 11.5, 49.6, yBase + 2.86, yBase + FLOOR_HEIGHT - 0.12, V_LEN - 0.45, V_LEN);

      // Cửa sổ băng ngang lùi sâu 0.35 m vào trong tường + đố thép mảnh tối màu
      const wMinY = yBase + 1.52;
      const wMaxY = yBase + 2.82;
      addBox(corridorGlass, 11.5, 49.6, wMinY, wMaxY, 0.28, 0.42);
      addBox(corridorGlass, 11.5, 49.6, wMinY, wMaxY, V_LEN - 0.42, V_LEN - 0.28);
      addBox(darkSteels, 11.5, 49.6, wMinY - 0.03, wMinY + 0.04, 0.24, 0.44);
      addBox(darkSteels, 11.5, 49.6, wMinY - 0.03, wMinY + 0.04, V_LEN - 0.44, V_LEN - 0.24);
      for (let wu = 11.5; wu <= 49.6; wu += 1.52) {
        addBox(darkSteels, wu - 0.03, wu + 0.03, wMinY, wMaxY, 0.25, 0.43);
        addBox(darkSteels, wu - 0.03, wu + 0.03, wMinY, wMaxY, V_LEN - 0.43, V_LEN - 0.25);
      }

      // Mái ô văng chắn nắng bê tông kem nhô ra 0.78 m ngay phía trên mỗi băng cửa sổ (đặc trưng EIU!)
      addBox(cream, 11.3, 49.8, wMaxY - 0.02, wMaxY + 0.16, -0.78, 0.32);
      addBox(cream, 11.3, 49.8, wMaxY - 0.02, wMaxY + 0.16, V_LEN - 0.32, V_LEN + 0.78);
    }

    // Hệ cột bê tông vuông màu kem chạy suốt 3 tầng (mặt Nam & mặt Bắc)
    for (const cu of bayCols) {
      addBox(cream, cu - 0.3, cu + 0.3, yColBottom, totalH, V_LEN - 0.42, V_LEN + 0.22);
      addBox(cream, cu - 0.3, cu + 0.3, yColBottom, totalH, -0.22, 0.42);
      // Chân sườn cột phụ nhô ra đỡ ô văng mái (step_308_shot_2)
      addBox(cream, cu - 0.14, cu + 0.14, totalH - 0.55, totalH + 0.1, V_LEN + 0.18, V_LEN + 0.82);
      addBox(cream, cu - 0.14, cu + 0.14, totalH - 0.55, totalH + 0.1, -0.82, -0.18);
    }
    // Con sơn kem nhỏ đỡ mái đua trên khoảng giữa các nhịp (u: 54..66.5)
    for (const fu of [55.5, 59.5, 63.5]) {
      addBox(cream, fu - 0.12, fu + 0.12, totalH - 0.48, totalH + 0.08, V_LEN - 0.05, V_LEN + 0.72);
    }

    // -------------------------------------------------------------------------
    // 5. VÁCH KÍNH PHẢN QUANG XANH NGỌC 2–3 TẦNG GÓC B4–B5 & SẢNH ĐÓN PORTE-COCHÈRE
    // -------------------------------------------------------------------------
    // Mảng kính phản quang xanh ngọc Tầng 2–3 góc Đông Nam (u = 54.0..66.9, step_308_shot_2)
    addBox(curtainBlue, mainBayEndU, 66.88, FLOOR_HEIGHT - 0.05, totalH - 0.05, V_LEN - 0.25, V_LEN - 0.06);
    addBox(curtainBlue, 66.7, 66.92, FLOOR_HEIGHT - 0.05, totalH - 0.05, 0.2, V_LEN - 0.1);
    for (let u = mainBayEndU; u <= 66.9; u += 1.6) {
      addBox(darkSteels, u - 0.04, u + 0.04, FLOOR_HEIGHT - 0.05, totalH, V_LEN - 0.28, V_LEN - 0.02);
    }
    for (const gy of [3.8, 5.1, 6.4, 7.6, 8.9, 10.2, 11.3]) {
      addBox(darkSteels, mainBayEndU, 66.92, gy - 0.04, gy + 0.04, V_LEN - 0.28, V_LEN - 0.02);
      addBox(darkSteels, 66.66, 66.95, gy - 0.04, gy + 0.04, 0.2, V_LEN - 0.08);
    }
    for (let v = 1.0; v <= V_LEN - 0.5; v += 2.2) {
      addBox(darkSteels, 66.66, 66.95, FLOOR_HEIGHT - 0.05, totalH, v - 0.04, v + 0.04);
    }

    // Sảnh đón Porte-cochère nhô ra tại lối vào sảnh B4–B5 (u = 56.5..64.0, v = 28.0..33.4, step_308_shot_2)
    addBox(cream, 56.5, 64.0, 3.58, 3.84, V_LEN, 33.4);
    addBox(darkSteels, 56.45, 64.05, 3.78, 3.9, V_LEN, 33.46); // Viền thép đen mép mái canopy
    for (const pu of [58.3, 62.2]) {
      addBox(cream, pu - 0.3, pu + 0.3, 0.12, 3.58, 31.1, 31.7);
      addBox(darkSteels, pu - 0.09, pu + 0.09, 2.25, 2.58, 31.7, 31.77); // Đèn hắt cột
    }
    // Bồn cây xanh trên nóc mái sảnh porte-cochère (gờ bồn thấp + dải bụi lá liền mạch)
    addBox(cream, 56.5, 64.0, 3.84, 4.06, 32.85, 33.4);
    for (let fu = 56.85; fu <= 63.65; fu += 0.45) {
      const fMesh = new IcosahedronGeometry(0.28, 1);
      fMesh.scale(1.1, 0.72, 0.85);
      fMesh.translate(fu, 4.14, 33.12);
      foliage.push(fMesh);
    }

    // -------------------------------------------------------------------------
    // 6. SÂN PERGOLA CAFE KHUNG THÉP ĐEN MẶT NAM (GIỮA CẦU 1 & HIGHLANDS, step_258_1 & 387_1)
    // -------------------------------------------------------------------------
    const pMinU = 30.6;
    const pMaxU = 43.2;
    const pMinV = V_LEN;
    const pMaxV = 34.0;
    // Sàn gỗ nhựa ấm áp ngoài trời
    addBox(woodDecks, pMinU, pMaxU, 0.04, 0.16, pMinV, pMaxV);
    // Bồn hoa & tường gạch hoa gió chạy quanh chu vi pergola
    addBox(planterWalls, pMinU, pMaxU, 0.16, 0.92, pMaxV - 0.24, pMaxV);
    addBox(planterWalls, pMinU, pMinU + 0.24, 0.16, 0.92, pMinV + 0.2, pMaxV - 0.24);
    addBox(planterWalls, pMaxU - 0.24, pMaxU, 0.16, 0.92, pMinV + 0.2, pMaxV - 0.24);
    for (let lu = pMinU + 0.8; lu <= pMaxU - 0.8; lu += 1.2) {
      const leaf = new IcosahedronGeometry(0.45, 1);
      leaf.scale(1.2, 0.75, 0.9);
      leaf.translate(lu, 0.95, pMaxV - 0.55);
      foliage.push(leaf);
    }

    // Khung cột thép đen H-beam & dàn kèo lưới thép đen trên mái pergola (y = 3.55)
    for (const cu of [pMinU + 0.15, 34.8, 39.0, pMaxU - 0.15]) {
      addBox(darkSteels, cu - 0.1, cu + 0.1, 0.16, 3.62, pMaxV - 0.22, pMaxV - 0.02);
      addBox(darkSteels, cu - 0.08, cu + 0.08, 3.48, 3.64, pMinV - 0.1, pMaxV + 0.05);
    }
    addBox(darkSteels, pMinU, pMaxU, 3.48, 3.64, pMaxV - 0.22, pMaxV + 0.02);
    for (let lv = pMinV + 0.4; lv < pMaxV; lv += 0.75) {
      addBox(darkSteels, pMinU, pMaxU, 3.52, 3.58, lv - 0.03, lv + 0.03);
    }
    for (let lu = pMinU + 0.6; lu < pMaxU; lu += 0.8) {
      addBox(darkSteels, lu - 0.02, lu + 0.02, 3.55, 3.58, pMinV, pMaxV);
    }

    // 6 bộ bàn ghế cafe thép đen ngoài trời trên sàn gỗ pergola (step_258_shot_1)
    for (const tu of [32.6, 36.9, 41.2]) {
      for (const tv of [29.7, 32.1]) {
        addCafeSet(darkSteels, tu, tv, 0.16);
      }
    }

    // -------------------------------------------------------------------------
    // 7. MÁI CHÌA KEM SÂU 1.2m + VIỀN MÁI VÁT NÂU MẬN + MÁI TÔN GHI SÁNG (step_249_shot_2)
    // -------------------------------------------------------------------------
    const outerShape = toShapePoints(stripClosingPoint(building.shape.outer));
    const expandedRoofSoffit = expandShapePolygon(outerShape, 1.2);
    const holesShape = building.shape.holes.map((h) => toShapePoints(stripClosingPoint(h)));
    const roofSoffit = createExtrudedPolygon(expandedRoofSoffit, holesShape, totalH, 0.28);

    // Viền mái vát nghiêng nâu mận & sàn mái tôn ghi sáng phía trong
    const roofFascia = createSlopedFascia(-0.55, U_LEN + 0.55, -0.55, V_LEN + 0.55, totalH + 0.27, totalH + 1.16, 1.05);
    addBox(roofDecks, 0.48, U_LEN - 0.48, totalH + 1.06, totalH + 1.15, 0.48, V_LEN - 0.48);

    return {
      stuccoGeo: safeMerge(stucco),
      creamGeo: safeMerge(cream),
      soffitTileGeo: safeMerge(soffitTiles),
      colonnadeFloorGeo: safeMerge(colonnadeFloors),
      whiteFrameGeo: safeMerge(whiteFrames),
      darkSteelGeo: safeMerge(darkSteels),
      corridorGlassGeo: safeMerge(corridorGlass),
      curtainBlueGeo: safeMerge(curtainBlue),
      woodDeckGeo: safeMerge(woodDecks),
      planterWallGeo: safeMerge(planterWalls),
      foliageGeo: safeMerge(foliage),
      roofSoffitGeo: roofSoffit,
      roofFasciaGeo: roofFascia,
      roofDeckGeo: safeMerge(roofDecks),
      blueSignGeo: safeMerge(blueSigns),
      inoxGeo: safeMerge(inox),
    };
  }, [building.floors, building.shape, totalH]);

  useEffect(() => {
    return () => {
      stuccoGeo?.dispose();
      creamGeo?.dispose();
      soffitTileGeo?.dispose();
      colonnadeFloorGeo?.dispose();
      whiteFrameGeo?.dispose();
      darkSteelGeo?.dispose();
      corridorGlassGeo?.dispose();
      curtainBlueGeo?.dispose();
      woodDeckGeo?.dispose();
      planterWallGeo?.dispose();
      foliageGeo?.dispose();
      roofSoffitGeo?.dispose();
      roofFasciaGeo.dispose();
      roofDeckGeo?.dispose();
      blueSignGeo?.dispose();
      inoxGeo?.dispose();
    };
  }, [
    stuccoGeo,
    creamGeo,
    soffitTileGeo,
    colonnadeFloorGeo,
    whiteFrameGeo,
    darkSteelGeo,
    corridorGlassGeo,
    curtainBlueGeo,
    woodDeckGeo,
    planterWallGeo,
    foliageGeo,
    roofSoffitGeo,
    roofFasciaGeo,
    roofDeckGeo,
    blueSignGeo,
    inoxGeo,
  ]);

  // Chậu cây trang trí đứng ở chân cột sảnh đón & hành lang (bản trụ tròn xám)
  const entrancePotGeo = useMemo(() => {
    const pots: BufferGeometry[] = [];
    for (const [pu, pv] of [
      [44.6, 25.3],
      [56.2, 27.6],
      [63.5, 25.4],
    ] as const) {
      const pot = new CylinderGeometry(0.28, 0.24, 0.56, 10);
      pot.translate(pu, 0.42, pv);
      pots.push(pot);
    }
    return safeMerge(pots);
  }, []);

  useEffect(() => () => entrancePotGeo?.dispose(), [entrancePotGeo]);

  return (
    <group>
      {/* Mái chìa bê tông kem sáng vươn 1.2 m theo đúng đa giác OSM */}
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

      {/* Toàn bộ mặt đứng, hành lang cột, pergola cafe, sảnh đón & bảng hiệu xoay đúng trục B4 */}
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
            <meshStandardMaterial color="#bfc5cc" roughness={0.65} />
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
            <meshStandardMaterial color="#1f4259" transparent opacity={0.68} roughness={0.12} metalness={0.35} />
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
            <meshStandardMaterial color="#8b6f60" roughness={0.85} />
          </mesh>
        )}
        {foliageGeo && (
          <mesh geometry={foliageGeo} castShadow>
            <meshStandardMaterial color="#2e6f3e" roughness={0.8} />
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
        {blueSignGeo && (
          <mesh geometry={blueSignGeo}>
            <meshStandardMaterial color="#1d4ed8" roughness={0.4} />
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

        {/* Biển ngang EIU · B4-5 viền đỏ trên mảng kính xanh ngọc tầng 2–3 (step_308_shot_2) */}
        <mesh position={[58.0, 9.05, V_LEN + 0.04]}>
          <planeGeometry args={[4.8, 2.3]} />
          <meshStandardMaterial map={textures.b45Banner} roughness={0.4} />
        </mesh>

        {/* Bảng hướng dẫn 3 tầng dán trên cánh phải cửa kính Lối Vào Thư Viện EIU (step_264_shot_2) */}
        <mesh position={[47.82, 1.48, 24.86]}>
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

        {/* Thảm xanh WELCOME trước 4 lối vào (cửa chính hành lang, cửa atrium, cửa Bắc & cửa Tây) */}
        <mesh position={[47.3, 0.155, 25.65]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[1.9, 1.1]} />
          <meshStandardMaterial map={textures.welcomeMat} roughness={0.88} />
        </mesh>
        <mesh position={[60.5, 0.155, 25.65]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[2.2, 1.15]} />
          <meshStandardMaterial map={textures.welcomeMat} roughness={0.88} />
        </mesh>
        <mesh position={[48.5, 0.155, 1.8]} rotation={[-Math.PI / 2, 0, Math.PI]}>
          <planeGeometry args={[1.9, 1.05]} />
          <meshStandardMaterial map={textures.welcomeMat} roughness={0.88} />
        </mesh>
        <mesh position={[-0.75, 0.155, 14.0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
          <planeGeometry args={[1.9, 1.05]} />
          <meshStandardMaterial map={textures.welcomeMat} roughness={0.88} />
        </mesh>

        {/* Dải xanh EASTERN INTERNATIONAL UNIVERSITY + Logo EIU cửa vào từ sảnh B4–B5 */}
        <mesh position={[60.5, 2.05, 24.85]}>
          <planeGeometry args={[3.4, 0.85]} />
          <meshStandardMaterial map={textures.atriumLogoBand} transparent roughness={0.35} />
        </mesh>

        {/* Bộ poster màu dán kính dọc hành lang Lối Vào Thư Viện EIU (step_258_shot_3 & 264_shot_2) */}
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
    </group>
  );
}
