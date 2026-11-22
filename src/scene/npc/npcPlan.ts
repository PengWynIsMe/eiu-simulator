// Kế hoạch NPC ngoài trời: tính 1 lần lúc nạp module (seed cố định → mọi lần mở trang giống nhau).
import { characterConfig, npcRoutes } from '../../data';
import type { NpcRoute } from '../../types';

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface RouteGeom {
  route: NpcRoute;
  /** cum[i] = quãng đường từ điểm 0 tới điểm i. */
  cum: Float64Array;
  total: number;
}

export interface RouteSample {
  x: number;
  z: number;
  /** Tiếp tuyến đơn vị theo chiều tăng của s. */
  tx: number;
  tz: number;
}

function buildGeom(route: NpcRoute): RouteGeom {
  const pts = route.points;
  const cum = new Float64Array(pts.length);
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if (!a || !b) continue;
    cum[i] = (cum[i - 1] ?? 0) + Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return { route, cum, total: cum[pts.length - 1] ?? 0 };
}

/** Điểm + tiếp tuyến tại quãng đường s (ghi vào `out`, không cấp phát). */
export function sampleRoute(g: RouteGeom, s: number, out: RouteSample): void {
  const pts = g.route.points;
  let lo = 0;
  let hi = pts.length - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if ((g.cum[mid] ?? 0) <= s) lo = mid;
    else hi = mid - 1;
  }
  const a = pts[lo];
  const b = pts[lo + 1];
  if (!a || !b) return;
  const segLen = (g.cum[lo + 1] ?? 0) - (g.cum[lo] ?? 0);
  const t = segLen > 0 ? Math.min(1, Math.max(0, (s - (g.cum[lo] ?? 0)) / segLen)) : 0;
  out.x = a[0] + (b[0] - a[0]) * t;
  out.z = a[1] + (b[1] - a[1]) * t;
  if (segLen > 0) {
    out.tx = (b[0] - a[0]) / segLen;
    out.tz = (b[1] - a[1]) / segLen;
  }
}

export interface WalkerSpec {
  id: string;
  url: string;
  geom: RouteGeom;
  startS: number;
  speed: number;
  dir: 1 | -1;
}

export interface StaticNpcSpec {
  id: string;
  url: string;
  x: number;
  z: number;
  /** Góc quay quanh Y (model nhìn +Z): yaw = atan2(hướngX, hướngZ). */
  yaw: number;
  seed: number;
}

const yawOf = (dx: number, dz: number) => Math.atan2(dx, dz);

const students = characterConfig.roles.students;
let studentCursor = 0;
const nextStudent = (): string => students[studentCursor++ % students.length] ?? characterConfig.roles.player;

function buildWalkers(): WalkerSpec[] {
  const rng = mulberry32(20261123);
  const all = npcRoutes.routes;
  const byId = new Map(all.map((r) => [r.id, r]));
  // Ưu tiên route dài: vòng xoay 3, r12-8 3, 10 route dài nhất còn lại 1 người → 16.
  const plan: { route: NpcRoute; count: number }[] = [];
  const ring = byId.get('roundabout-ring');
  const long = byId.get('r12-8');
  if (ring) plan.push({ route: ring, count: 3 });
  if (long) plan.push({ route: long, count: 3 });
  const others = all
    .filter((r) => r !== ring && r !== long)
    .sort((a, b) => b.length - a.length)
    .slice(0, 10);
  for (const route of others) plan.push({ route, count: 1 });

  const walkers: WalkerSpec[] = [];
  let workerGiven = false;
  for (const { route, count } of plan) {
    const geom = buildGeom(route);
    for (let k = 0; k < count; k++) {
      const isWorker = !workerGiven && route.id === 'r2-0';
      if (isWorker) workerGiven = true;
      walkers.push({
        id: `walker-${walkers.length}`,
        url: isWorker ? characterConfig.roles.worker : nextStudent(),
        geom,
        startS: ((k + rng()) / count) * geom.total,
        speed: 1.1 + rng() * 0.4,
        dir: route.loop ? (k % 2 === 1 ? -1 : 1) : rng() < 0.5 ? 1 : -1,
      });
    }
  }
  return walkers;
}

export const WALKERS: readonly WalkerSpec[] = buildWalkers();

export const GUARDS: readonly StaticNpcSpec[] = npcRoutes.guards.map((g, i) => ({
  id: g.id,
  url: characterConfig.roles.guard,
  x: g.position[0],
  z: g.position[1],
  yaw: yawOf(g.facing[0], g.facing[1]),
  seed: 700 + i,
}));

/** Mỗi nhóm `size` người (thường 2), đứng thành cặp cách nhau 1.1 m, quay mặt vào nhau. */
export const GROUP_PEOPLE: readonly StaticNpcSpec[] = (() => {
  const rng = mulberry32(777);
  const out: StaticNpcSpec[] = [];
  npcRoutes.groups.forEach((group, gi) => {
    const angle = rng() * Math.PI;
    const dx = Math.cos(angle);
    const dz = Math.sin(angle);
    const n = Math.max(2, group.size);
    for (let k = 0; k < n; k++) {
      const side = k % 2 === 0 ? -1 : 1;
      const offset = side * 0.55 * (1 + Math.floor(k / 2) * 1.6);
      out.push({
        id: `${group.id}-${k}`,
        url: nextStudent(),
        x: group.position[0] + dx * offset,
        z: group.position[1] + dz * offset,
        yaw: side < 0 ? yawOf(dx, dz) : yawOf(-dx, -dz),
        seed: 900 + gi * 10 + k,
      });
    }
  });
  return out;
})();
