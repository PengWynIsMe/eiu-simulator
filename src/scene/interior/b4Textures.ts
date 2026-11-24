import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Material } from 'three';

function makeTexture(canvas: HTMLCanvasElement, repeatX = 1, repeatY = 1): CanvasTexture {
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

// =============================================================================
// 1. THẢM TẤM HAI TÔNG MÀU (XÁM LỐI ĐI & BE/NÂU NHẠT KHU ĐỌC SÁCH)
// =============================================================================

const carpetCache = new Map<string, CanvasTexture>();

export function getCarpetTexture(variant: 'grey' | 'tan', repeatX = 1, repeatY = 1): CanvasTexture {
  const key = `${variant}-${repeatX.toFixed(2)}-${repeatY.toFixed(2)}`;
  const cached = carpetCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const palette =
      variant === 'grey'
        ? ['#636a73', '#5a616a', '#6b727c', '#545b64']
        : ['#aa987e', '#9e8c72', '#b3a187', '#948269'];

    const tile = 64;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const baseColor = palette[(row * 3 + col * 5) % palette.length] ?? '#636a73';
        ctx.fillStyle = baseColor;
        ctx.fillRect(col * tile, row * tile, tile, tile);

        // Sợi thảm đan chéo xen kẽ ngang / dọc giữa các ô
        const horizontal = (row + col) % 2 === 0;
        ctx.fillStyle = 'rgba(255,255,255,0.045)';
        for (let i = 2; i < tile; i += 5) {
          if (horizontal) ctx.fillRect(col * tile + 2, row * tile + i, tile - 4, 2);
          else ctx.fillRect(col * tile + i, row * tile + 2, 2, tile - 4);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        for (let i = 4; i < tile; i += 7) {
          if (horizontal) ctx.fillRect(col * tile + 2, row * tile + i, tile - 4, 1);
          else ctx.fillRect(col * tile + i, row * tile + 2, 1, tile - 4);
        }

        // Đường ron mảnh giữa các tấm thảm 50×50 cm
        ctx.strokeStyle = 'rgba(15,23,42,0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(col * tile + 0.5, row * tile + 0.5, tile - 1, tile - 1);
      }
    }
  }

  const tex = makeTexture(canvas, repeatX, repeatY);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  carpetCache.set(key, tex);
  return tex;
}

// =============================================================================
// 2. ATLAS GÁY SÁCH CẦU THANG TRUNG TÂM THƯ VIỆN EIU (20 BẬC THẬT TỪ ẢNH 360°)
// =============================================================================

const LIBRARY_STAIR_BOOKS = [
  ['HỒI SINH SỰ THẦN KỲ NHẬT BẢN', '#e2dfd7', '#1e293b', '#dc2626'],
  ['Bringing Out the Best in People', '#ebe7df', '#1e293b', '#991b1b'],
  ['2 BILLION UNDER 20', '#f1ede4', '#1e293b', '#d97706'],
  ['THE COURAGE TO BE DISLIKED', '#e6e8ea', '#334155', '#0ea5e9'],
  ['Work Smarter, Live Better', '#1e4e79', '#ffffff', '#ef4444'],
  ['THINKING, FAST AND SLOW', '#edeae2', '#1e293b', '#f59e0b'],
  ['BRIDGING THE SOFT SKILLS GAP', '#22459a', '#ffffff', '#facc15'],
  ['BLUE OCEAN SHIFT', '#dce6e5', '#16436d', '#0284c7'],
  ['Behavioral Economics', '#c83e37', '#fffaf0', '#1e293b'],
  ['TALK LIKE TED', '#e8e4da', '#242436', '#b91c1c'],
  ["KEYNES'S WAY TO WEALTH", '#f3efe6', '#1f2937', '#15803d'],
  ['LEAN SIX SIGMA FOR LEADERS', '#3f3d76', '#ffffff', '#38bdf8'],
  ['OWN YOUR FUTURE', '#b83139', '#fff7ed', '#f59e0b'],
  ['GLOBAL LOGISTICS', '#227449', '#fffaf0', '#eab308'],
  ['ADAM SMITH', '#9f2d34', '#fff3df', '#d97706'],
  ['STRATEGY', '#392f48', '#fff1d2', '#a855f7'],
  ['LEADERSHIP', '#607981', '#fff9ea', '#0d9488'],
  ['MARKETING', '#1c4667', '#f8fafc', '#38bdf8'],
  ['ECONOMICS', '#44604c', '#fff1cf', '#84cc16'],
  ['MANAGEMENT', '#963738', '#fff1d2', '#f97316'],
] as const;

const STAIR_ATLAS_ROWS = 32;
let bookStairAtlas: CanvasTexture | undefined;

export const B4_BOOK_ATLAS_ROW_INDEXES = Float32Array.from({ length: 20 }, (_, i) => i);

export function getLibraryBookStairAtlas(): CanvasTexture {
  if (bookStairAtlas) return bookStairAtlas;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const rowHeight = canvas.height / STAIR_ATLAS_ROWS;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    LIBRARY_STAIR_BOOKS.forEach(([title, bg, ink, accent], i) => {
      const top = i * rowHeight;
      const mid = top + rowHeight * 0.5;
      ctx.fillStyle = bg;
      ctx.fillRect(0, top, canvas.width, rowHeight);

      // Dải nhấn đầu/cuối gáy sách
      ctx.fillStyle = accent;
      ctx.fillRect(16, top + 3, 24, rowHeight - 6);
      ctx.fillRect(canvas.width - 40, top + 3, 24, rowHeight - 6);

      ctx.fillStyle = ink;
      ctx.fillRect(58, top + 4, 3, rowHeight - 8);
      ctx.fillRect(canvas.width - 61, top + 4, 3, rowHeight - 8);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 21px "Segoe UI", Arial, sans-serif';
      ctx.fillText(title, canvas.width / 2, mid, canvas.width - 160);
    });
  }
  bookStairAtlas = makeTexture(canvas);
  return bookStairAtlas;
}

export function applyB4BookAtlasRows(shader: Parameters<Material['onBeforeCompile']>[0]): void {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nattribute float bookRow;')
    .replace(
      '#include <uv_vertex>',
      `#include <uv_vertex>
       vMapUv.y = 1.0 - (bookRow + mix(0.94, 0.06, vMapUv.y)) / ${STAIR_ATLAS_ROWS.toFixed(1)};`
    );
}

// =============================================================================
// 3. TƯỜNG GỖ TÁI CHẾ PHÍA SAU QUẦY LƯU HÀNH "LIBRARY" (TẦNG 3)
// =============================================================================

let reclaimedWoodTex: CanvasTexture | undefined;

export function getReclaimedWoodTexture(): CanvasTexture {
  if (reclaimedWoodTex) return reclaimedWoodTex;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const tones = ['#7c4a2b', '#8e5a36', '#693d23', '#a06a41', '#5a331d', '#925e39'];
    const rows = 14;
    const h = canvas.height / rows;
    for (let r = 0; r < rows; r++) {
      let x = 0;
      let segIdx = 0;
      while (x < canvas.width) {
        const w = 90 + ((r * 53 + segIdx * 97) % 120);
        const color = tones[(r * 7 + segIdx * 3) % tones.length] ?? '#7c4a2b';
        ctx.fillStyle = color;
        ctx.fillRect(x, r * h, w, h - 2);
        // Vân gỗ ngang
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x + 4, r * h + h * 0.35, w - 8, 2);
        ctx.fillStyle = 'rgba(255,220,180,0.08)';
        ctx.fillRect(x + 6, r * h + h * 0.68, w - 12, 1.5);
        // Đường nối giữa các thanh gỗ
        ctx.fillStyle = '#2d1a10';
        ctx.fillRect(x + w - 2, r * h, 2, h);
        ctx.fillRect(0, (r + 1) * h - 2, canvas.width, 2);
        x += w;
        segIdx++;
      }
    }
  }
  reclaimedWoodTex = makeTexture(canvas);
  return reclaimedWoodTex;
}

// =============================================================================
// 4. MÀN HÌNH TRA CỨU OPAC (48 MÁY TÍNH TẦNG 1 & QUẦY THỦ THƯ)
// =============================================================================

let opacScreenTex: CanvasTexture | undefined;

export function getOpacScreenTexture(): CanvasTexture {
  if (opacScreenTex) return opacScreenTex;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 320);
    // Top bar xanh navy EIU
    ctx.fillStyle = '#0b3d6e';
    ctx.fillRect(0, 0, 512, 52);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.fillText('EIU LIBRARY · OPAC', 18, 33);
    ctx.fillStyle = '#bae6fd';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText('lib.eiu.edu.vn', 392, 32);

    // Thanh tìm kiếm
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(24, 68, 464, 42);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(28, 72, 360, 34);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(394, 72, 90, 34);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText('TÌM KIẾM', 409, 94);
    ctx.fillStyle = '#64748b';
    ctx.font = '13px Arial, sans-serif';
    ctx.fillText('Nhập tên sách, tác giả, mã DDC...', 40, 93);

    // Thẻ sách nổi bật
    const cardColors = ['#1d4ed8', '#0d9488', '#b91c1c', '#d97706'];
    for (let i = 0; i < 4; i++) {
      const cx = 24 + i * 118;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx, 128, 108, 166);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx, 128, 108, 166);
      ctx.fillStyle = cardColors[i] ?? '#1d4ed8';
      ctx.fillRect(cx + 8, 136, 92, 96);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx + 8, 244, 78, 10);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(cx + 8, 262, 56, 8);
    }
  }
  opacScreenTex = makeTexture(canvas);
  return opacScreenTex;
}

// =============================================================================
// 5. POSTER TƯỜNG & KÍNH EIU + TRÍCH DẪN PHÒNG 202
// =============================================================================

export type B4PosterKind =
  | 'mission'
  | 'vision'
  | 'core-values'
  | 'objectives'
  | 'nurse-purple'
  | 'dream-green'
  | 'year-2021-teal'
  | 'opac-white'
  | 'databases-white'
  | 'adam-smith'
  | 'karl-marx'
  | 'max-weber'
  | 'keynes';

interface PosterDef {
  bg: string;
  accent: string;
  title: string;
  lines: readonly string[];
  portrait?: boolean;
}

const POSTER_DEFS: Record<B4PosterKind, PosterDef> = {
  mission: {
    bg: '#b91c1c',
    accent: '#fecaca',
    title: 'SỨ MẠNG · MISSION',
    lines: ['Đào tạo nguồn nhân lực', 'chất lượng cao, nghiên cứu', 'khoa học và phục vụ cộng đồng'],
  },
  vision: {
    bg: '#991b1b',
    accent: '#fde68a',
    title: 'TẦM NHÌN · VISION',
    lines: ['Trường đại học đa ngành', 'đạt chuẩn mực quốc tế', 'tại miền Đông Nam Bộ'],
  },
  'core-values': {
    bg: '#c2410c',
    accent: '#fed7aa',
    title: 'GIÁ TRỊ CỐT LÕI',
    lines: ['CHẤT LƯỢNG · SÁNG TẠO', 'TRÁCH NHIỆM · HỘI NHẬP', 'EIU CORE VALUES'],
  },
  objectives: {
    bg: '#0f766e',
    accent: '#99f6e4',
    title: 'MỤC TIÊU GIÁO DỤC',
    lines: ['Kiến thức vững vàng', 'Kỹ năng thực hành chuẩn', 'Tư duy đổi mới sáng tạo'],
  },
  'nurse-purple': {
    bg: '#581c87',
    accent: '#e9d5ff',
    title: 'SCHOOL OF NURSING',
    lines: ["Save one person", "YOU'RE A HERO", 'Save hundreds', "YOU'RE A NURSE"],
  },
  'dream-green': {
    bg: '#15803d',
    accent: '#bbf7d0',
    title: 'EIU SPIRIT',
    lines: ['dám ƯỚC MƠ', 'dám THỰC HIỆN', 'BUILDING THE FUTURE'],
  },
  'year-2021-teal': {
    bg: '#0d9488',
    accent: '#ccfbf1',
    title: 'NĂM HỌC EIU',
    lines: ['EIU LIBRARY', 'OPEN KNOWLEDGE SPACE', 'WELCOME STUDENTS'],
  },
  'opac-white': {
    bg: '#f8fafc',
    accent: '#0b3d6e',
    title: 'LIBRARY OPAC',
    lines: ['CỔNG TRA CỨU TÀI LIỆU', 'lib.eiu.edu.vn', '[ QR CODE SCAN ]'],
  },
  'databases-white': {
    bg: '#f8fafc',
    accent: '#0369a1',
    title: 'ONLINE DATABASES',
    lines: ['IEEE · ScienceDirect · ProQuest', 'EIU DIGITAL LIBRARY', '[ QR CODE SCAN ]'],
  },
  'adam-smith': {
    bg: '#1e3a5f',
    accent: '#facc15',
    title: 'ADAM SMITH',
    lines: ['"Labour was the first price,', 'the original purchase-money', 'that was paid for all things."'],
    portrait: true,
  },
  'karl-marx': {
    bg: '#14532d',
    accent: '#86efac',
    title: 'KARL MARX',
    lines: ['"Philosophers have hitherto', 'only interpreted the world;', 'the point is to change it."'],
    portrait: true,
  },
  'max-weber': {
    bg: '#166534',
    accent: '#bbf7d0',
    title: 'MAX WEBER',
    lines: ['"It is the intellect which', 'forms the concept of', 'the problem of meaning."'],
    portrait: true,
  },
  keynes: {
    bg: '#991b1b',
    accent: '#fde047',
    title: 'J. M. KEYNES',
    lines: ['"The difficulty lies not', 'in the new ideas, but in', 'escaping from old ones."'],
    portrait: true,
  },
};

const posterCache = new Map<B4PosterKind, CanvasTexture>();

export function getPosterTexture(kind: B4PosterKind): CanvasTexture {
  const cached = posterCache.get(kind);
  if (cached) return cached;

  const def = POSTER_DEFS[kind];
  const isLight = def.bg === '#f8fafc';
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 340;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = def.bg;
    ctx.fillRect(0, 0, 256, 340);

    // Khung viền tinh tế
    ctx.strokeStyle = def.accent;
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 236, 320);

    if (def.portrait) {
      // Vòng tròn minh họa chân dung nhà kinh tế / triết học
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.beginPath();
      ctx.arc(128, 86, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.arc(128, 76, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(128, 118, 26, Math.PI, 0);
      ctx.fill();
    } else if (isLight) {
      // Ô QR cách điệu
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(88, 224, 80, 80);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(96, 232, 24, 24);
      ctx.fillRect(136, 232, 24, 24);
      ctx.fillRect(96, 272, 24, 24);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(102, 238, 12, 12);
      ctx.fillRect(142, 238, 12, 12);
      ctx.fillRect(102, 278, 12, 12);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = isLight ? def.accent : '#ffffff';
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.fillText(def.title, 128, def.portrait ? 162 : 76, 210);

    ctx.fillStyle = def.accent;
    ctx.fillRect(58, def.portrait ? 176 : 94, 140, 3);

    ctx.fillStyle = isLight ? '#334155' : '#f8fafc';
    ctx.font = '15px "Segoe UI", Arial, sans-serif';
    def.lines.forEach((line, idx) => {
      ctx.fillText(line, 128, (def.portrait ? 210 : 138) + idx * 28, 216);
    });

    ctx.fillStyle = def.accent;
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText('EIU LIBRARY', 128, 316);
  }

  const tex = makeTexture(canvas);
  posterCache.set(kind, tex);
  return tex;
}

// =============================================================================
// 6. BẢNG CHỈ MỤC PHÂN LOẠI SÁCH DDC XANH TÍM ĐẦU HỒI KỆ SÁCH (TẦNG 3)
// =============================================================================

const ddcCache = new Map<string, CanvasTexture>();

export function getDdcHeaderTexture(range: string, category: string): CanvasTexture {
  const key = `${range}::${category}`;
  const cached = ddcCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 360);
    grad.addColorStop(0, '#1e2959');
    grad.addColorStop(1, '#313d8c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 360);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, 0, 256, 12);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px "Segoe UI", Arial, sans-serif';
    ctx.fillText(range, 20, 74, 216);

    ctx.fillStyle = '#bae6fd';
    ctx.font = '18px "Segoe UI", Arial, sans-serif';
    const words = category.split(' ');
    let line = '';
    let y = 122;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (test.length > 18) {
        ctx.fillText(line, 20, y, 216);
        line = w;
        y += 28;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, 20, y, 216);

    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(20, 300, 216, 2);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText('EIU LIBRARY COLLECTION', 20, 330);
  }

  const tex = makeTexture(canvas);
  ddcCache.set(key, tex);
  return tex;
}

// =============================================================================
// 7. BIỂN MICA 4 DẢI MÀU CHUẨN EIU CHO PHÒNG HỌC NHÓM 01–09 (TẦNG 2)
// =============================================================================

const plaqueCache = new Map<string, CanvasTexture>();

export function getRoomPlaqueTexture(num: string, titleVi: string, titleEn: string): CanvasTexture {
  const key = `${num}-${titleVi}`;
  const cached = plaqueCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // 4 dải màu nhận diện EIU thực tế trong ảnh Tầng 2 (`step_484.png`)
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, 256, 60);
    ctx.fillStyle = '#65a30d';
    ctx.fillRect(0, 60, 256, 68);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(0, 128, 256, 68);
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(0, 196, 256, 60);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillText('EIU', 128, 40);

    ctx.font = 'bold 42px Arial, sans-serif';
    ctx.fillText(num, 128, 108);

    ctx.font = 'bold 17px "Segoe UI", Arial, sans-serif';
    ctx.fillText(titleVi, 128, 155, 232);
    ctx.font = '15px "Segoe UI", Arial, sans-serif';
    ctx.fillText(titleEn, 128, 180, 232);

    ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
    ctx.fillText('THƯ VIỆN · Library', 128, 234);
  }

  const tex = makeTexture(canvas);
  plaqueCache.set(key, tex);
  return tex;
}

// =============================================================================
// 8. ĐÈN LED MŨI TÊN XANH CỔNG QUẸT THẺ (TURNSTILE)
// =============================================================================

let turnstileArrowTex: CanvasTexture | undefined;

export function getTurnstileArrowTexture(): CanvasTexture {
  if (turnstileArrowTex) return turnstileArrowTex;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(64, 64, 48, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(40, 56);
    ctx.lineTo(68, 56);
    ctx.lineTo(68, 40);
    ctx.lineTo(96, 64);
    ctx.lineTo(68, 88);
    ctx.lineTo(68, 72);
    ctx.lineTo(40, 72);
    ctx.closePath();
    ctx.fill();
  }
  turnstileArrowTex = makeTexture(canvas);
  return turnstileArrowTex;
}
