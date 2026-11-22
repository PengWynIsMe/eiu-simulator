import type { Vec2 } from '../../types';

/** Kích thước ô lưới tra cứu (m). Nhỏ hơn khoảng cách ngọn cỏ (0.7 m) nên lọc đủ mịn. */
const CELL = 0.5;

export interface GrassMaskRoad {
  readonly points: readonly Vec2[];
  /** Bề rộng mặt đường (m). */
  readonly width: number;
}

export interface GrassMaskInput {
  readonly boundary: readonly Vec2[];
  readonly roads: readonly GrassMaskRoad[];
  readonly buildingOuters: readonly (readonly Vec2[])[];
  readonly parking: readonly (readonly Vec2[])[];
  readonly roundabout: { readonly radius: number; readonly roadWidth: number };
  /** Vùng cấm bổ sung (hồ nước...). Chỉ gọi cho ô còn là cỏ. */
  readonly isBlocked: (x: number, z: number) => boolean;
  /** Đệm thêm quanh mép đường (m). */
  readonly roadMargin: number;
  /** Đệm thêm quanh tòa nhà / bãi xe (m). */
  readonly solidMargin: number;
}

export interface GrassMask {
  /** true nếu điểm [x, z] là bãi cỏ trống (được phép mọc cỏ). */
  isGrass(x: number, z: number): boolean;
  /** Bán kính trong của vành đường vòng xoay: bên trong là đảo cỏ cao hơn. */
  readonly roundaboutInner: number;
}

/**
 * Dựng sẵn lưới bit "chỗ nào mọc cỏ được" cho toàn khuôn viên (một lần), để tra cứu O(1) mỗi ngọn cỏ.
 * Bắt đầu từ ranh giới trường rồi khoét đường, tòa nhà, bãi xe, vành vòng xoay, hồ.
 */
export function buildGrassMask(input: GrassMaskInput): GrassMask {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const [x, z] of input.boundary) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  minX -= 1;
  minZ -= 1;
  const cols = Math.ceil((maxX - minX) / CELL) + 2;
  const rows = Math.ceil((maxZ - minZ) / CELL) + 2;
  const grid = new Uint8Array(cols * rows);

  /** Điền đa giác (even-odd, theo tâm ô) bằng scanline. */
  const fillPolygon = (poly: readonly Vec2[], value: number) => {
    const n = poly.length;
    if (n < 3) return;
    const xs: number[] = [];
    for (let r = 0; r < rows; r++) {
      const z = minZ + (r + 0.5) * CELL;
      xs.length = 0;
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const a = poly[i];
        const b = poly[j];
        if (!a || !b) continue;
        if (a[1] > z !== b[1] > z) {
          xs.push(a[0] + ((z - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
        }
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const x0 = xs[k] ?? 0;
        const x1 = xs[k + 1] ?? 0;
        const c0 = Math.max(0, Math.ceil((x0 - minX) / CELL - 0.5));
        const c1 = Math.min(cols - 1, Math.floor((x1 - minX) / CELL - 0.5));
        for (let c = c0; c <= c1; c++) grid[r * cols + c] = value;
      }
    }
  };

  /** Xóa mọi ô cách đoạn [a, b] không quá radius ("viên thuốc" quanh đoạn thẳng). */
  const clearCapsule = (a: Vec2, b: Vec2, radius: number) => {
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const lenSq = dx * dx + dz * dz;
    const c0 = Math.max(0, Math.floor((Math.min(a[0], b[0]) - radius - minX) / CELL));
    const c1 = Math.min(cols - 1, Math.ceil((Math.max(a[0], b[0]) + radius - minX) / CELL));
    const r0 = Math.max(0, Math.floor((Math.min(a[1], b[1]) - radius - minZ) / CELL));
    const r1 = Math.min(rows - 1, Math.ceil((Math.max(a[1], b[1]) + radius - minZ) / CELL));
    const rSq = radius * radius;
    for (let r = r0; r <= r1; r++) {
      const z = minZ + (r + 0.5) * CELL;
      for (let c = c0; c <= c1; c++) {
        const x = minX + (c + 0.5) * CELL;
        const t = lenSq < 1e-9 ? 0 : Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / lenSq));
        const ex = x - (a[0] + t * dx);
        const ez = z - (a[1] + t * dz);
        if (ex * ex + ez * ez <= rSq) grid[r * cols + c] = 0;
      }
    }
  };

  const clearPolygon = (poly: readonly Vec2[], margin: number) => {
    fillPolygon(poly, 0);
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      if (a && b) clearCapsule(a, b, margin);
    }
  };

  // 1. Trong ranh giới trường
  fillPolygon(input.boundary, 1);

  // 2. Tòa nhà + bãi xe (đa giác + viền đệm)
  for (const outer of input.buildingOuters) clearPolygon(outer, input.solidMargin);
  for (const p of input.parking) clearPolygon(p, input.solidMargin);

  // 3. Đường: nửa bề rộng + đệm
  for (const road of input.roads) {
    const r = road.width / 2 + input.roadMargin;
    for (let i = 0; i < road.points.length - 1; i++) {
      const a = road.points[i];
      const b = road.points[i + 1];
      if (a && b) clearCapsule(a, b, r);
    }
  }

  // 4. Vành đường vòng xoay (tâm [0, 0])
  const rbInner = input.roundabout.radius - input.roundabout.roadWidth / 2;
  const rbOuter = input.roundabout.radius + input.roundabout.roadWidth / 2;
  const lo = rbInner - input.roadMargin;
  const hi = rbOuter + input.roadMargin;
  {
    const c0 = Math.max(0, Math.floor((-hi - minX) / CELL));
    const c1 = Math.min(cols - 1, Math.ceil((hi - minX) / CELL));
    const r0 = Math.max(0, Math.floor((-hi - minZ) / CELL));
    const r1 = Math.min(rows - 1, Math.ceil((hi - minZ) / CELL));
    for (let r = r0; r <= r1; r++) {
      const z = minZ + (r + 0.5) * CELL;
      for (let c = c0; c <= c1; c++) {
        const x = minX + (c + 0.5) * CELL;
        const d = Math.hypot(x, z);
        if (d >= lo && d <= hi) grid[r * cols + c] = 0;
      }
    }
  }

  // 5. Vùng cấm bổ sung (hồ nước)
  for (let r = 0; r < rows; r++) {
    const z = minZ + (r + 0.5) * CELL;
    for (let c = 0; c < cols; c++) {
      if (grid[r * cols + c] === 1 && input.isBlocked(minX + (c + 0.5) * CELL, z)) {
        grid[r * cols + c] = 0;
      }
    }
  }

  return {
    roundaboutInner: rbInner,
    isGrass(x: number, z: number): boolean {
      const c = Math.floor((x - minX) / CELL);
      const r = Math.floor((z - minZ) / CELL);
      if (c < 0 || r < 0 || c >= cols || r >= rows) return false;
      return grid[r * cols + c] === 1;
    },
  };
}
