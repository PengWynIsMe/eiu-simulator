import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

/** Kích thước mỗi texture (px). */
const SIZE = 1024;

/** Chiều dài (m) một chu kỳ texture nhựa đường theo hướng đường: 3 m vạch + 3 m hở. */
export const ASPHALT_TILE_LENGTH = 6;
/** Chiều dài (m) / bề rộng (m) phủ bởi một ô texture gạch: 8 viên × 12 hàng, viên 0.4 × 0.2 m. */
export const BRICK_TILE_LENGTH = 3.2;
export const BRICK_TILE_WIDTH = 2.4;

export interface AsphaltOptions {
  /** Bề rộng mặt đường (m) — texture vẽ vừa khít bề ngang này (v: 0 → 1). */
  widthM: number;
  /** Màu nền nhựa (hex). */
  base: string;
  /** Biên độ hạt nhựa (0–255). */
  grain: number;
  /** Số làn: vạch giữa là vàng nếu chia đôi được, các vạch ngăn làn khác là trắng đứt. 0 = không có vạch ngăn làn. */
  lanes: number;
  /** Màu vạch giữa: 'yellow' (đường phố) hoặc 'white' (đường nội bộ). */
  centerColor: 'yellow' | 'white';
  /** Chiều dài vạch đứt (m); phần còn lại của chu kỳ 6 m là hở. */
  dashM: number;
  /** Vạch mép liền trắng cách mép 0.3 m. */
  edgeLines: boolean;
}

/** Bộ sinh số giả ngẫu nhiên cố định (LCG) để hạt nhựa giống nhau mỗi lần chạy. */
function createRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function finishTexture(canvas: HTMLCanvasElement, anisotropy: number): CanvasTexture {
  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

function createCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không tạo được canvas 2D để sinh texture mặt đường');
  return { canvas, ctx };
}

/**
 * Nhựa đường: nền + hạt 2 tầng (điểm mịn + mảng thô 8 px, đều tuần hoàn nên ghép ô không lộ mối) + vạch kẻ.
 * Trục x của canvas = hướng dọc đường (u), trục y = ngang đường (v).
 */
export function createAsphaltTexture(opts: AsphaltOptions, anisotropy: number): CanvasTexture {
  const { canvas, ctx } = createCanvas();
  const rnd = createRng(Math.round(opts.widthM * 100) + opts.lanes * 7 + opts.grain);
  const [br, bg, bb] = hexToRgb(opts.base);

  const cell = 8;
  const cells = SIZE / cell;
  const coarse = new Float32Array(cells * cells);
  for (let i = 0; i < coarse.length; i++) coarse[i] = rnd() - 0.5;

  const img = ctx.createImageData(SIZE, SIZE);
  const d = img.data;
  for (let y = 0; y < SIZE; y++) {
    const cy = Math.floor(y / cell) * cells;
    for (let x = 0; x < SIZE; x++) {
      const n = (rnd() - 0.5) * opts.grain + (coarse[cy + Math.floor(x / cell)] ?? 0) * opts.grain * 0.8;
      const o = (y * SIZE + x) * 4;
      d[o] = br + n;
      d[o + 1] = bg + n;
      d[o + 2] = bb + n;
      d[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const pxPerM = SIZE / opts.widthM;
  const lineH = Math.max(2, 0.15 * pxPerM);
  const dashPx = (opts.dashM / ASPHALT_TILE_LENGTH) * SIZE;

  // Vạch mép trắng liền, cách mép 0.3 m
  if (opts.edgeLines) {
    ctx.fillStyle = 'rgba(238,238,232,0.93)';
    const off = 0.3 * pxPerM;
    ctx.fillRect(0, off, SIZE, lineH);
    ctx.fillRect(0, SIZE - off - lineH, SIZE, lineH);
  }

  // Vạch giữa / ngăn làn (đứt)
  const dividers = opts.lanes >= 2 ? opts.lanes - 1 : 1;
  for (let k = 1; k <= dividers; k++) {
    const frac = opts.lanes >= 2 ? k / opts.lanes : 0.5;
    const isCenter = Math.abs(frac - 0.5) < 1e-6;
    ctx.fillStyle = isCenter && opts.centerColor === 'yellow' ? 'rgba(238,196,40,0.95)' : 'rgba(238,238,232,0.9)';
    ctx.fillRect(0, frac * SIZE - lineH / 2, dashPx, lineH);
  }

  return finishTexture(canvas, anisotropy);
}

/**
 * Gạch lát: viên 0.4 × 0.2 m xếp so le, mạch nhạt, mỗi viên lệch màu một chút.
 * Một ô texture = BRICK_TILE_LENGTH × BRICK_TILE_WIDTH (m).
 */
export function createBrickTexture(baseHex: string, anisotropy: number): CanvasTexture {
  const { canvas, ctx } = createCanvas();
  const rnd = createRng(parseInt(baseHex.slice(1), 16));
  const [br, bg, bb] = hexToRgb(baseHex);

  ctx.fillStyle = 'rgb(196,190,180)'; // màu mạch vữa
  ctx.fillRect(0, 0, SIZE, SIZE);

  const cols = 8;
  const rows = 12;
  const bw = SIZE / cols;
  const bh = SIZE / rows;
  const gap = 4;
  for (let r = 0; r < rows; r++) {
    const shift = r % 2 === 0 ? 0 : bw / 2;
    for (let c = -1; c < cols; c++) {
      const v = (rnd() - 0.5) * 26;
      ctx.fillStyle = `rgb(${Math.round(br + v)},${Math.round(bg + v)},${Math.round(bb + v)})`;
      const x = c * bw + shift;
      // viên cắt ngang mép ô được vẽ cả 2 phía để ghép ô liền mạch
      ctx.fillRect(x + gap / 2, r * bh + gap / 2, bw - gap, bh - gap);
      if (x + bw > SIZE) ctx.fillRect(x - SIZE + gap / 2, r * bh + gap / 2, bw - gap, bh - gap);
    }
  }
  return finishTexture(canvas, anisotropy);
}
