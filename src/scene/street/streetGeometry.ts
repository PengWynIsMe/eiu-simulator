import { BoxGeometry, BufferGeometry, CanvasTexture, CylinderGeometry, Float32BufferAttribute, SRGBColorSpace } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Hộp đặt tại (cx, cy, cz) kích thước (w, h, d), có thể tô một màu đỉnh. */
function box(w: number, h: number, d: number, cx: number, cy: number, cz: number, color?: string): BufferGeometry {
  const g = new BoxGeometry(w, h, d);
  g.translate(cx, cy, cz);
  if (color) paint(g, color);
  return g;
}

/** Trụ đứng bán kính r, cao h, tâm tại (cx, cy, cz). */
function cylinder(r: number, h: number, cx: number, cy: number, cz: number, seg = 8): BufferGeometry {
  const g = new CylinderGeometry(r, r, h, seg, 1);
  g.translate(cx, cy, cz);
  return g;
}

/** Gán màu đỉnh đồng nhất (hex "#rrggbb", đã đổi sang không gian tuyến tính như three làm với Color). */
function paint(g: BufferGeometry, hex: string): void {
  const n = parseInt(hex.slice(1), 16);
  const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const r = toLinear(((n >> 16) & 255) / 255);
  const gg = toLinear(((n >> 8) & 255) / 255);
  const b = toLinear((n & 255) / 255);
  const count = g.getAttribute('position').count;
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    arr[i * 3] = r;
    arr[i * 3 + 1] = gg;
    arr[i * 3 + 2] = b;
  }
  g.setAttribute('color', new Float32BufferAttribute(arr, 3));
}

/** Gộp các mảnh (đủ position/normal/uv/color) thành 1 geometry. */
function merge(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  if (!merged) throw new Error('streetGeometry: gộp geometry thất bại');
  return merged;
}

/** Cột đèn 6 m Ø0.12 + cần vươn 1 m về +Z (không có màu đỉnh: màu lấy từ material). */
export function createLampPostGeometry(): BufferGeometry {
  return merge([
    cylinder(0.06, 6, 0, 3, 0),
    cylinder(0.1, 0.25, 0, 0.125, 0, 8),
    box(0.07, 0.07, 1.05, 0, 5.97, 0.5),
  ]);
}

/** Chụp đèn ở đầu cần (z = 1), rộng 0.5 × 0.12 × 0.28. */
export function createLampHeadGeometry(): BufferGeometry {
  return box(0.28, 0.12, 0.5, 0, 5.88, 1.0);
}

/** Ghế đá 1.6 × 0.45 × 0.45, mặt ngồi quay về +Z (lưng ghế ở -Z). */
export function createBenchGeometry(): BufferGeometry {
  return merge([
    box(1.6, 0.07, 0.45, 0, 0.42, 0),
    box(1.6, 0.4, 0.07, 0, 0.65, -0.2),
    box(0.12, 0.4, 0.4, -0.65, 0.2, 0),
    box(0.12, 0.4, 0.4, 0.65, 0.2, 0),
  ]);
}

/** Thùng rác 0.4 × 0.4 × 0.8: thân xanh lá + nắp vàng (màu đỉnh). */
export function createBinGeometry(): BufferGeometry {
  return merge([box(0.4, 0.7, 0.4, 0, 0.35, 0, '#2f8f4e'), box(0.44, 0.1, 0.44, 0, 0.75, 0, '#e6b422')]);
}

/**
 * Xe máy đậu, dài 1.8 m theo +Z, cao ~1.0 m: thân + yên + ghi đông + 2 bánh.
 * Thân/yên màu đỉnh trắng (nhân với màu instance: đỏ hoặc đen), bánh và ghi đông xám đen.
 */
export function createBikeGeometry(): BufferGeometry {
  const wheelR = 0.27;
  const parts: BufferGeometry[] = [];
  // Thân + yên + đèn: trắng (nhận màu instance)
  parts.push(box(0.32, 0.3, 0.9, 0, 0.5, -0.05, '#ffffff'));
  parts.push(box(0.3, 0.1, 0.6, 0, 0.72, -0.25, '#ffffff'));
  parts.push(box(0.4, 0.55, 0.12, 0, 0.55, 0.5, '#ffffff'));
  // Cổ + ghi đông
  parts.push(box(0.06, 0.4, 0.06, 0, 0.8, 0.55, '#222222'));
  parts.push(box(0.7, 0.05, 0.05, 0, 1.0, 0.55, '#222222'));
  // Bánh trước/sau: trụ dẹt quay quanh trục X
  for (const z of [0.65, -0.65]) {
    const w = new CylinderGeometry(wheelR, wheelR, 0.1, 10, 1);
    w.rotateZ(Math.PI / 2);
    w.translate(0, wheelR, z);
    paint(w, '#1a1a1a');
    parts.push(w);
  }
  return merge(parts);
}

/** Biển "EIU" 3 × 1.2 (mặt trước +Z và mặt sau -Z đều có chữ) + 2 trụ; một geometry, một texture. */
export function createSignGeometry(): BufferGeometry {
  const panel = new BoxGeometry(3, 1.2, 0.14);
  panel.translate(0, 1.8, 0);
  // BoxGeometry có 6 mặt × 4 đỉnh: thứ tự +X, -X, +Y, -Y, +Z, -Z. Chỉ +Z và -Z dùng toàn bộ texture,
  // các mặt còn lại lấy một điểm nền xanh đậm ở góc để không bị kéo chữ.
  const uv = panel.getAttribute('uv');
  for (let face = 0; face < 6; face++) {
    if (face >= 4) continue;
    for (let v = 0; v < 4; v++) uv.setXY(face * 4 + v, 0.01, 0.5);
  }
  const postL = box(0.1, 1.25, 0.1, -1.1, 0.625, 0);
  const postR = box(0.1, 1.25, 0.1, 1.1, 0.625, 0);
  for (const p of [postL, postR]) {
    const puv = p.getAttribute('uv');
    for (let i = 0; i < puv.count; i++) puv.setXY(i, 0.01, 0.5);
  }
  return merge([panel, postL, postR]);
}

/** Texture chữ "EIU" vẽ bằng canvas (không tải ảnh ngoài). Nền xanh đậm viền trắng, chữ trắng. */
export function createSignTexture(): CanvasTexture {
  const W = 768;
  const H = 307;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0b3d6e';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#f2f6fa';
    ctx.lineWidth = 8;
    ctx.strokeRect(22, 22, W - 44, H - 44);
    ctx.fillStyle = '#f2f6fa';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 150px Arial, Helvetica, sans-serif';
    ctx.fillText('EIU', W / 2, H / 2 - 22);
    ctx.font = '600 34px Arial, Helvetica, sans-serif';
    ctx.fillText('Eastern International University', W / 2, H - 70);
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
