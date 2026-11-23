import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { Road, Vec2 } from '../../types';

/** Cắt đoạn thẳng [p1, p2] trong phạm vi bán kính maxR từ gốc [0, 0] để không dựng đường quá xa. */
export function clipSegmentToRadius(p1: Vec2, p2: Vec2, maxR: number): [Vec2, Vec2] | null {
  const [x1, z1] = p1;
  const [x2, z2] = p2;
  const dx = x2 - x1;
  const dz = z2 - z1;
  const d1 = Math.hypot(x1, z1);
  const d2 = Math.hypot(x2, z2);

  // Cả hai điểm đều nằm trong phạm vi
  if (d1 <= maxR && d2 <= maxR) {
    return [p1, p2];
  }

  const a = dx * dx + dz * dz;
  if (a < 1e-6) {
    return d1 <= maxR ? [p1, p2] : null;
  }

  const b = 2 * (x1 * dx + z1 * dz);
  const c = x1 * x1 + z1 * z1 - maxR * maxR;
  const discr = b * b - 4 * a * c;
  if (discr < 0) return null;

  const sqrtD = Math.sqrt(discr);
  const tA = (-b - sqrtD) / (2 * a);
  const tB = (-b + sqrtD) / (2 * a);
  const tStart = Math.max(0, Math.min(tA, tB));
  const tEnd = Math.min(1, Math.max(tA, tB));

  if (tStart >= tEnd || tStart > 1 || tEnd < 0) return null;

  return [
    [x1 + tStart * dx, z1 + tStart * dz],
    [x1 + tEnd * dx, z1 + tEnd * dz],
  ];
}

/** Tách đường thành các "đoạn liền" nằm trong bán kính maxR (mỗi đoạn liền là một đường gấp khúc ≥ 2 điểm). */
function splitIntoRuns(points: readonly Vec2[], maxR: number): Vec2[][] {
  const runs: Vec2[][] = [];
  let cur: Vec2[] = [];
  const flush = () => {
    if (cur.length >= 2) runs.push(cur);
    cur = [];
  };
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    if (!p1 || !p2) continue;
    const clipped = clipSegmentToRadius(p1, p2, maxR);
    if (!clipped) {
      flush();
      continue;
    }
    if (cur.length === 0) cur.push(clipped[0]);
    cur.push(clipped[1]);
    // Nếu điểm cuối bị cắt thì đường dừng ở đây
    if (clipped[1] !== p2) flush();
  }
  flush();
  return runs;
}

/** Bỏ các điểm trùng/quá gần nhau để hướng đoạn không bị suy biến. */
function dedupe(points: readonly Vec2[]): Vec2[] {
  const out: Vec2[] = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) >= 0.05) out.push(p);
  }
  return out;
}

export interface RoadStyle {
  /** Bề rộng mặt đường (m). */
  width: number;
  /** Độ cao mặt đường (m). */
  elevation: number;
  /** Độ dài (m) dọc đường ứng với u = 1 của texture. */
  texLength: number;
  /** Độ rộng (m) ngang đường ứng với v = 1 của texture (v = 0.5 ở tim đường). */
  texWidth: number;
}

/**
 * Dải ruy băng mặt đường có UV dọc theo đường: u = quãng đường tích lũy / texLength, v = vị trí ngang.
 * Khớp nối gấp khúc dùng góc vát (miter) liền mạch, nên vạch kẻ chạy suốt qua chỗ cua, không bị đĩa tròn che.
 */
export function buildRoadRibbon(
  roads: readonly Road[],
  styleOf: (road: Road) => RoadStyle,
  maxRadius = 600,
): BufferGeometry | null {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const pushVertex = (x: number, y: number, z: number, u: number, v: number) => {
    positions.push(x, y, z);
    normals.push(0, 1, 0);
    uvs.push(u, v);
  };

  for (const road of roads) {
    if (road.kind === 'bridge' || road.points.length < 2) continue;
    const style = styleOf(road);
    const hw = style.width / 2;
    const vHalf = hw / style.texWidth;

    for (const rawRun of splitIntoRuns(road.points, maxRadius)) {
      const run = dedupe(rawRun);
      const n = run.length;
      if (n < 2) continue;

      // Pháp tuyến phẳng của từng đoạn: (-dz, dx) / len
      const segNx: number[] = [];
      const segNz: number[] = [];
      for (let i = 0; i < n - 1; i++) {
        const a = run[i];
        const b = run[i + 1];
        if (!a || !b) continue;
        const dx = b[0] - a[0];
        const dz = b[1] - a[1];
        const len = Math.hypot(dx, dz);
        segNx.push(-dz / len);
        segNz.push(dx / len);
      }

      let cum = 0;
      const baseIndex = positions.length / 3;
      for (let k = 0; k < n; k++) {
        const p = run[k];
        if (!p) continue;
        if (k > 0) {
          const q = run[k - 1];
          if (q) cum += Math.hypot(p[0] - q[0], p[1] - q[1]);
        }
        // Vector lệch ngang tại đỉnh k: pháp tuyến của đoạn kề, hoặc vát góc nếu là đỉnh trong
        let mx: number;
        let mz: number;
        if (k === 0) {
          mx = segNx[0] ?? 0;
          mz = segNz[0] ?? 0;
        } else if (k === n - 1) {
          mx = segNx[n - 2] ?? 0;
          mz = segNz[n - 2] ?? 0;
        } else {
          const ax = segNx[k - 1] ?? 0;
          const az = segNz[k - 1] ?? 0;
          const bx = segNx[k] ?? 0;
          const bz = segNz[k] ?? 0;
          let sx = ax + bx;
          let sz = az + bz;
          const sl = Math.hypot(sx, sz);
          if (sl < 1e-4) {
            sx = ax;
            sz = az;
          } else {
            sx /= sl;
            sz /= sl;
          }
          const cosHalf = Math.max(0.5, sx * ax + sz * az);
          mx = sx / cosHalf;
          mz = sz / cosHalf;
        }
        const u = cum / style.texLength;
        // đỉnh trái (+n) rồi đỉnh phải (-n)
        pushVertex(p[0] + mx * hw, style.elevation, p[1] + mz * hw, u, 0.5 + vHalf);
        pushVertex(p[0] - mx * hw, style.elevation, p[1] - mz * hw, u, 0.5 - vHalf);
      }
      // Mỗi đoạn: 2 tam giác, cùng chiều quay với bản cũ (mặt hướng lên +Y)
      for (let k = 0; k < n - 1; k++) {
        const L0 = baseIndex + k * 2;
        const R0 = L0 + 1;
        const L1 = L0 + 2;
        const R1 = L0 + 3;
        indices.push(L0, L1, R0, L1, R1, R0);
      }
    }
  }

  if (positions.length === 0) return null;

  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

/** Vành đường tròn (vòng xoay) tâm [0, 0] có UV dọc theo chu vi; số ô texture là số nguyên để không lộ mối. */
export function buildRingRibbon(
  innerR: number,
  outerR: number,
  elevation: number,
  texLength: number,
  segments = 192,
): BufferGeometry {
  const midR = (innerR + outerR) / 2;
  const tiles = Math.max(1, Math.round((2 * Math.PI * midR) / texLength));
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const u = (i / segments) * tiles;
    positions.push(c * innerR, elevation, s * innerR, c * outerR, elevation, s * outerR);
    normals.push(0, 1, 0, 0, 1, 0);
    uvs.push(u, 0, u, 1);
  }
  for (let i = 0; i < segments; i++) {
    const I0 = i * 2;
    const O0 = I0 + 1;
    const I1 = I0 + 2;
    const O1 = I0 + 3;
    // Hướng lên +Y: (I0, I1, O0) và (I1, O1, O0)
    indices.push(I0, I1, O0, I1, O1, O0);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

export interface KerbOptions {
  /** Các đường internal cần bó vỉa. */
  roads: readonly Road[];
  /** Mọi đường (để tránh đặt bó vỉa đè lên chỗ giao nhau). */
  allRoads: readonly Road[];
  halfWidth: number;
  /** Độ cao mặt đường (y đáy bó vỉa). */
  baseY: number;
  height: number;
  thickness: number;
  maxRadius: number;
  /** true nếu điểm [x, z] nằm trên vành đường vòng xoay (không đặt bó vỉa ở đó). */
  onRoundabout: (x: number, z: number) => boolean;
  /** Bề rộng đường theo loại, dùng cho kiểm tra giao nhau. */
  widthOf: (road: Road) => number;
}

function distToSegment(px: number, pz: number, a: Vec2, b: Vec2): number {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const lenSq = dx * dx + dz * dz;
  const t = lenSq < 1e-9 ? 0 : Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / lenSq));
  return Math.hypot(px - (a[0] + t * dx), pz - (a[1] + t * dz));
}

function distToRoad(px: number, pz: number, road: Road): number {
  let best = Infinity;
  for (let i = 0; i < road.points.length - 1; i++) {
    const a = road.points[i];
    const b = road.points[i + 1];
    if (a && b) best = Math.min(best, distToSegment(px, pz, a, b));
  }
  return best;
}

/**
 * Bó vỉa: khối nhỏ (rộng `thickness`, cao `height`) chạy dọc 2 mép đường internal, nằm TRONG bề rộng mặt đường
 * (không đổi bề rộng đường). Cắt thành đoạn ngắn ~1.5 m và bỏ đoạn nào rơi vào chỗ giao với đường khác,
 * vành vòng xoay, đường phố, lối đi bộ hay cầu.
 */
export function buildKerbGeometry(opts: KerbOptions): BufferGeometry | null {
  const positions: number[] = [];
  const normals: number[] = [];
  const PIECE = 1.5;
  const hw = opts.halfWidth;
  const y0 = opts.baseY;
  const y1 = opts.baseY + opts.height;

  /** Hai tam giác cho mặt phẳng a-b-c-d, tự đảo chiều để mặt hướng theo pháp tuyến (nx, ny, nz). */
  const quad = (
    a: [number, number, number],
    b: [number, number, number],
    c: [number, number, number],
    d: [number, number, number],
    nx: number,
    ny: number,
    nz: number,
  ) => {
    const e1x = b[0] - a[0];
    const e1y = b[1] - a[1];
    const e1z = b[2] - a[2];
    const e2x = c[0] - a[0];
    const e2y = c[1] - a[1];
    const e2z = c[2] - a[2];
    const cx = e1y * e2z - e1z * e2y;
    const cy = e1z * e2x - e1x * e2z;
    const cz = e1x * e2y - e1y * e2x;
    const flip = cx * nx + cy * ny + cz * nz < 0;
    const tri = (p: [number, number, number], q: [number, number, number], r: [number, number, number]) => {
      if (flip) positions.push(...p, ...r, ...q);
      else positions.push(...p, ...q, ...r);
      normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    };
    tri(a, b, c);
    tri(a, c, d);
  };

  const blocked = (x: number, z: number, self: Road): boolean => {
    if (opts.onRoundabout(x, z)) return true;
    for (const r of opts.allRoads) {
      if (r === self) continue;
      if (distToRoad(x, z, r) < opts.widthOf(r) / 2 + 0.4) return true;
    }
    return false;
  };

  for (const road of opts.roads) {
    for (const run of splitIntoRuns(road.points, opts.maxRadius)) {
      for (let i = 0; i < run.length - 1; i++) {
        const a = run[i];
        const b = run[i + 1];
        if (!a || !b) continue;
        const dx = b[0] - a[0];
        const dz = b[1] - a[1];
        const len = Math.hypot(dx, dz);
        if (len < 0.05) continue;
        const ux = dx / len;
        const uz = dz / len;
        const nx = -uz;
        const nz = ux;
        const pieces = Math.max(1, Math.round(len / PIECE));
        for (let k = 0; k < pieces; k++) {
          const t0 = (k / pieces) * len;
          const t1 = ((k + 1) / pieces) * len;
          const tm = (t0 + t1) / 2;
          for (const side of [1, -1]) {
            const outer = hw * side;
            const inner = (hw - opts.thickness) * side;
            const mx = a[0] + ux * tm + nx * (hw - opts.thickness / 2) * side;
            const mz = a[1] + uz * tm + nz * (hw - opts.thickness / 2) * side;
            if (blocked(mx, mz, road)) continue;
            const ax = a[0] + ux * t0;
            const az = a[1] + uz * t0;
            const bx = a[0] + ux * t1;
            const bz = a[1] + uz * t1;
            const o0: [number, number, number] = [ax + nx * outer, y1, az + nz * outer];
            const o1: [number, number, number] = [bx + nx * outer, y1, bz + nz * outer];
            const i0: [number, number, number] = [ax + nx * inner, y1, az + nz * inner];
            const i1: [number, number, number] = [bx + nx * inner, y1, bz + nz * inner];
            // mặt trên
            quad(o0, o1, i1, i0, 0, 1, 0);
            // mặt ngoài (về phía vỉa/cỏ) kéo xuống y = 0 để cắm chặt vào đất, triệt tiêu khe hở và bóng rỗng; mặt trong về phía lòng đường
            quad([o0[0], 0, o0[2]], [o1[0], 0, o1[2]], o1, o0, nx * side, 0, nz * side);
            quad([i0[0], y0, i0[2]], [i1[0], y0, i1[2]], i1, i0, -nx * side, 0, -nz * side);
          }
        }
      }
    }
  }

  if (positions.length === 0) return null;
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  return geo;
}
