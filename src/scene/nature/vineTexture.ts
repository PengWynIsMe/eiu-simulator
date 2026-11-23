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
 * Sinh CanvasTexture rèm dây leo buông rủ (Cúc Tần Ấn Độ / Vernonia elliptica)
 * gồm các sợi tơ rủ mảnh, chùm lá nhỏ hình bầu dục nhiều sắc xanh tự nhiên xen kẽ khe sáng xuyên qua (alpha).
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

  const leafPalette = [
    '#365314', // Xanh rêu đậm
    '#3f6212', // Xanh olive
    '#4d7c0f', // Xanh lá tự nhiên
    '#65a30d', // Xanh lá non tươi
    '#84cc16', // Chồi xanh non điểm sáng
    '#2d4f10', // Xanh bóng râm
    '#1a2e05', // Xanh lõi tối
  ];

  // Vẽ 28 dải sợi dây leo mảnh buông rủ từ đỉnh xuống
  const strandCount = 28;
  for (let i = 0; i < strandCount; i++) {
    const baseX = 8 + (i / (strandCount - 1)) * (width - 16) + (rng() - 0.5) * 8;
    // Độ dài dải ngẫu nhiên rủ từ 65% tới 98% chiều cao
    const strandLen = height * (0.68 + rng() * 0.30);
    const waveFreq = 0.015 + rng() * 0.015;
    const waveAmp = 4 + rng() * 6;

    // 1. Thân sợi dây leo mảnh
    ctx.beginPath();
    ctx.strokeStyle = rng() > 0.4 ? '#4a5320' : '#394018';
    ctx.lineWidth = 1.2 + rng() * 0.8;
    ctx.lineCap = 'round';

    for (let y = 0; y <= strandLen; y += 8) {
      const x = baseX + Math.sin(y * waveFreq) * waveAmp;
      if (y === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 2. Các chùm lá nhỏ mọc so le dọc sợi dây leo
    const leafStep = 9 + rng() * 6;
    for (let y = 6; y < strandLen - 12; y += leafStep) {
      const curX = baseX + Math.sin(y * waveFreq) * waveAmp;
      const leavesPerNode = rng() > 0.3 ? 2 : 1;

      for (let l = 0; l < leavesPerNode; l++) {
        const side = l === 0 ? (rng() > 0.5 ? 1 : -1) : -1;
        const leafAngle = (Math.PI / 2) + side * (0.45 + rng() * 0.45);
        const leafLen = 8 + rng() * 9;
        const leafW = 3.5 + rng() * 2.5;

        ctx.save();
        ctx.translate(curX, y);
        ctx.rotate(leafAngle);

        ctx.fillStyle = leafPalette[Math.floor(rng() * leafPalette.length)] ?? '#4d7c0f';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(leafLen * 0.45, -leafW * 0.6, leafLen, 0);
        ctx.quadraticCurveTo(leafLen * 0.45, leafW * 0.6, 0, 0);
        ctx.fill();

        // Gân lá mảnh tinh tế
        if (rng() > 0.4) {
          ctx.strokeStyle = '#a3e635';
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

  const colors = ['#284408', '#365314', '#3f6212', '#4d7c0f', '#65a30d', '#1e3304'];

  // Vẽ hàng trăm chiếc lá đan dày kín mặt giàn nhưng để lại các lỗ hổng xuyên sáng tự nhiên
  const leafCount = 900;
  for (let i = 0; i < leafCount; i++) {
    const lx = rng() * size;
    const ly = rng() * size;
    const angle = rng() * Math.PI * 2;
    const len = 12 + rng() * 14;
    const wid = 5 + rng() * 4;

    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(angle);

    ctx.fillStyle = colors[Math.floor(rng() * colors.length)] ?? '#3f6212';
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

  uvs.push(
    0, 0,
    1, 0,
    1, 1,
    0, 1,
  );

  indices.push(
    baseIdx, baseIdx + 1, baseIdx + 2,
    baseIdx, baseIdx + 2, baseIdx + 3,
  );
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

