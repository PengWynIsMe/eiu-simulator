import { CanvasTexture, SRGBColorSpace } from 'three';

/** Bộ sinh số giả ngẫu nhiên có hạt giống cố định để texture sinh nhất quán. */
function createPrng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let cachedVineTexture: CanvasTexture | null = null;
let cachedCanopyTexture: CanvasTexture | null = null;

/**
 * Sinh CanvasTexture rèm dây leo buông rủ Cúc Tần Ấn Độ (Vernonia elliptica)
 * theo ảnh thực tế t017s, t037s, walk-eiu/00:
 * - Viền tán lá xanh sum suê bám mép nóc/xà trần.
 * - Nhiều sợi tơ buông rủ mềm mại với các chùm lá bầu dục xanh tươi, nhiều sắc độ diệp lục.
 * - Khe sáng tự nhiên xuyên qua giữa các dải lá rủ, nền alpha trong suốt.
 */
export function getOrCreateVineTexture(): CanvasTexture | null {
  if (cachedVineTexture) return cachedVineTexture;
  if (typeof document === 'undefined') return null;

  const width = 512;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, width, height);
  const rng = createPrng(20261123);

  // Bảng màu xanh diệp lục tươi sáng tự nhiên hắt nắng theo ảnh thật
  const leafPalette = [
    '#84cc16', // Chồi xanh non sáng (lime 500)
    '#65a30d', // Xanh lá tươi rực rỡ (lime 600)
    '#4ade80', // Xanh lộc tươi sáng (green 400)
    '#22c55e', // Xanh diệp lục tươi (green 500)
    '#16a34a', // Xanh tự nhiên trung tính (green 600)
    '#a3e635', // Chồi non nõn chuối (lime 400)
    '#4d7c0f', // Xanh lá bóng râm nhẹ (lime 700)
  ];

  // 1. Viền tán lá dày đặc bám mép trần (y từ 0 đến 55px)
  const topBorderLeaves = 90;
  for (let i = 0; i < topBorderLeaves; i++) {
    const lx = rng() * width;
    const ly = rng() * 45;
    const angle = (rng() - 0.5) * 1.4 + Math.PI / 2;
    const len = 12 + rng() * 10;
    const wid = 5 + rng() * 4;

    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(angle);
    ctx.fillStyle = leafPalette[Math.floor(rng() * leafPalette.length)] ?? '#65a30d';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.45, -wid * 0.6, len, 0);
    ctx.quadraticCurveTo(len * 0.45, wid * 0.6, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  // 2. Vẽ 46 sợi dây leo mảnh buông rủ tha thướt
  const strandCount = 46;
  for (let i = 0; i < strandCount; i++) {
    const baseX = 6 + (i / (strandCount - 1)) * (width - 12) + (rng() - 0.5) * 6;
    // Độ dài dải ngẫu nhiên rủ từ 65% tới 98% chiều cao
    const strandLen = height * (0.68 + rng() * 0.30);
    const waveFreq = 0.012 + rng() * 0.015;
    const waveAmp = 4 + rng() * 7;

    // Thân sợi dây leo
    ctx.beginPath();
    ctx.strokeStyle = rng() > 0.4 ? '#4d7c0f' : '#3f6212';
    ctx.lineWidth = 1.3 + rng() * 0.8;
    ctx.lineCap = 'round';

    for (let y = 0; y <= strandLen; y += 8) {
      const x = baseX + Math.sin(y * waveFreq) * waveAmp;
      if (y === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Các chùm lá mọc dày so le dọc sợi dây leo
    const leafStep = 8 + rng() * 5;
    for (let y = 8; y < strandLen - 10; y += leafStep) {
      const curX = baseX + Math.sin(y * waveFreq) * waveAmp;
      const leavesPerNode = rng() > 0.35 ? 2 : 1;

      for (let l = 0; l < leavesPerNode; l++) {
        const side = l === 0 ? (rng() > 0.5 ? 1 : -1) : -1;
        const leafAngle = (Math.PI / 2) + side * (0.42 + rng() * 0.45);
        const leafLen = 9 + rng() * 9;
        const leafW = 4.0 + rng() * 3.0;

        ctx.save();
        ctx.translate(curX, y);
        ctx.rotate(leafAngle);

        ctx.fillStyle = leafPalette[Math.floor(rng() * leafPalette.length)] ?? '#65a30d';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(leafLen * 0.45, -leafW * 0.65, leafLen, 0);
        ctx.quadraticCurveTo(leafLen * 0.45, leafW * 0.65, 0, 0);
        ctx.fill();

        // Gân lá màu vàng chanh sáng
        if (rng() > 0.35) {
          ctx.strokeStyle = '#d9f99d';
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(leafLen * 0.75, 0);
          ctx.stroke();
        }

        ctx.restore();
      }
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  cachedVineTexture = texture;
  return texture;
}

/**
 * Sinh CanvasTexture tán lá đan xen phủ trên mặt giàn pergola
 * với các chùm lá đan dày có khe hở ánh sáng lốm đốm.
 */
export function getOrCreateCanopyTexture(): CanvasTexture | null {
  if (cachedCanopyTexture) return cachedCanopyTexture;
  if (typeof document === 'undefined') return null;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, size, size);
  const rng = createPrng(20261124);

  const colors = ['#3f6212', '#4d7c0f', '#65a30d', '#84cc16', '#22c55e', '#2e5b0e'];

  // Vẽ 900 chiếc lá đan dày kín mặt giàn nhưng để lại các lỗ hổng xuyên sáng tự nhiên
  const leafCount = 950;
  for (let i = 0; i < leafCount; i++) {
    const lx = rng() * size;
    const ly = rng() * size;
    const angle = rng() * Math.PI * 2;
    const len = 13 + rng() * 15;
    const wid = 5.5 + rng() * 4.5;

    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(angle);

    ctx.fillStyle = colors[Math.floor(rng() * colors.length)] ?? '#4d7c0f';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.5, -wid, len, 0);
    ctx.quadraticCurveTo(len * 0.5, wid, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  cachedCanopyTexture = texture;
  return texture;
}

/**
 * Thêm một dải rèm quad buông rủ từ p1 [x1, z1] đến p2 [x2, z2] ở cao độ topY, rủ xuống topY - dropH.
 * UV được ánh xạ đúng: đỉnh quad (topY) nhận V=1 (nơi lá bám mép trần), đáy quad nhận V=0 (đầu rủ).
 */
export function addVineCurtain(
  positions: number[],
  normals: number[],
  uvs: number[],
  indices: number[],
  p1: [number, number],
  p2: [number, number],
  topY: number,
  dropH: number,
  nx: number,
  nz: number,
  offsetDist = 0,
): void {
  const baseIdx = positions.length / 3;
  const ox = nx * offsetDist;
  const oz = nz * offsetDist;

  // 4 đỉnh của quad buông rủ
  positions.push(
    p1[0] + ox, topY, p1[1] + oz,
    p2[0] + ox, topY, p2[1] + oz,
    p2[0] + ox, topY - dropH, p2[1] + oz,
    p1[0] + ox, topY - dropH, p1[1] + oz,
  );

  normals.push(
    nx, 0, nz,
    nx, 0, nz,
    nx, 0, nz,
    nx, 0, nz,
  );

  // Đỉnh quad map vào v=1 (đỉnh rèm lá canvas), đáy quad map vào v=0 (đầu buông rủ)
  uvs.push(
    0, 1,
    1, 1,
    1, 0,
    0, 0,
  );

  indices.push(
    baseIdx, baseIdx + 1, baseIdx + 2,
    baseIdx, baseIdx + 2, baseIdx + 3,
  );
}

/**
 * Thêm dải lá dây leo quấn bám dọc thân cột thép (creepers on post) theo ảnh thật t017s, walk-eiu/00.
 */
export function addPostVines(
  positions: number[],
  normals: number[],
  uvs: number[],
  indices: number[],
  colPos: [number, number],
  topY: number,
  bottomY: number,
  halfW = 0.16,
): void {
  const [cx, cz] = colPos;
  const dropH = topY - bottomY;

  // Mặt trước-sau
  addVineCurtain(positions, normals, uvs, indices, [cx - halfW, cz + halfW + 0.02], [cx + halfW, cz + halfW + 0.02], topY, dropH, 0, 1, 0);
  addVineCurtain(positions, normals, uvs, indices, [cx + halfW, cz - halfW - 0.02], [cx - halfW, cz - halfW - 0.02], topY, dropH, 0, -1, 0);
  // Mặt trái-phải
  addVineCurtain(positions, normals, uvs, indices, [cx + halfW + 0.02, cz + halfW], [cx + halfW + 0.02, cz - halfW], topY, dropH, 1, 0, 0);
  addVineCurtain(positions, normals, uvs, indices, [cx - halfW - 0.02, cz - halfW], [cx - halfW - 0.02, cz + halfW], topY, dropH, -1, 0, 0);
}

/**
 * Thêm một mặt phẳng tán lá nằm ngang cho nóc giàn pergola.
 */
export function addCanopyQuad(
  positions: number[],
  normals: number[],
  uvs: number[],
  indices: number[],
  corners: [[number, number], [number, number], [number, number], [number, number]],
  y: number,
): void {
  const baseIdx = positions.length / 3;
  for (const c of corners) {
    positions.push(c[0], y, c[1]);
    normals.push(0, 1, 0);
  }
  uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
  indices.push(
    baseIdx, baseIdx + 1, baseIdx + 2,
    baseIdx, baseIdx + 2, baseIdx + 3,
  );
}
