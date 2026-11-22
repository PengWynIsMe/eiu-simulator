// `node scripts/npc-routes.mjs`: sinh src/data/npc-routes.json (tuyến đi NPC ngoài trời) từ layout.json.
// Lấy đường nội bộ / lối bộ / cầu nằm trong ranh trường + vòng quanh quảng trường tròn.
import { readFileSync, writeFileSync } from 'node:fs';

const layout = JSON.parse(readFileSync('src/data/layout.json', 'utf8'));
const campus = JSON.parse(readFileSync('src/data/campus.json', 'utf8'));

const inside = (p, poly) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > p[1] !== zj > p[1] && p[0] < ((xj - xi) * (p[1] - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
};
const len = (pts) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
const r1 = (v) => Math.round(v * 10) / 10;

const footprints = [
  ...layout.buildings.map((b) => b.footprint),
  ...campus.campus.buildings.filter((b) => b.footprint).map((b) => b.footprint),
];
const inBuilding = (p) => footprints.some((f) => inside(p, f));

// Chia nhỏ đoạn dài để điểm nào nằm trong tòa nhà thì bỏ được chính xác hơn.
function densify(pts, step = 4) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1];
    const [bx, bz] = pts[i];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step));
    for (let k = 1; k <= n; k++) out.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
  }
  return out;
}

// Tách polyline thành các đoạn liên tục nằm trong ranh trường và ngoài tòa nhà.
function clip(pts) {
  const runs = [];
  let cur = [];
  for (const p of densify(pts)) {
    if (inside(p, layout.boundary) && !inBuilding(p)) cur.push(p);
    else if (cur.length) (runs.push(cur), (cur = []));
  }
  if (cur.length) runs.push(cur);
  return runs;
}

// Giảm lại số điểm: giữ điểm cách nhau ≥ 8 m (và điểm cuối).
function thin(pts, minGap = 8) {
  const out = [pts[0]];
  for (const p of pts.slice(1, -1)) {
    const q = out[out.length - 1];
    if (Math.hypot(p[0] - q[0], p[1] - q[1]) >= minGap) out.push(p);
  }
  out.push(pts[pts.length - 1]);
  return out.map(([x, z]) => [r1(x), r1(z)]);
}

const routes = [];
layout.roads.forEach((road, i) => {
  if (road.kind === 'street') return;
  for (const run of clip(road.points)) {
    if (run.length < 2 || len(run) < 25) continue;
    const pts = thin(run);
    const closed = Math.hypot(pts[0][0] - pts.at(-1)[0], pts[0][1] - pts.at(-1)[1]) < 1;
    routes.push({
      id: `r${i}-${routes.length}`,
      kind: road.kind,
      loop: closed,
      // Đường nội bộ: đi lệch sang lề phải 2.6 m (như vỉa hè); lối bộ / cầu: đi giữa.
      sideOffset: road.kind === 'internal' ? 2.6 : 0,
      length: r1(len(pts)),
      points: pts,
    });
  }
});

// Vòng quanh quảng trường tròn (mép ngoài + 3 m).
const { center, radius } = layout.roundabout;
const ring = [];
for (let k = 0; k < 32; k++) {
  const a = (k / 32) * Math.PI * 2;
  ring.push([r1(center[0] + Math.cos(a) * (radius + 3)), r1(center[1] + Math.sin(a) * (radius + 3))]);
}
routes.push({ id: 'roundabout-ring', kind: 'footway', loop: true, sideOffset: 0, length: r1(len([...ring, ring[0]])), points: ring });

const guards = [
  { id: 'guard-main-gate', position: [249.0, -28.5], facing: [1, 0], note: 'Ngay sau cổng chính (Nam Kỳ Khởi Nghĩa), giữa 2 làn vào, nhìn ra cổng' },
  { id: 'guard-side-gate', position: [-64.0, -230.0], facing: [0, -1], note: 'Cổng phụ phía Bắc' },
];
const groups = [
  { id: 'group-plaza', position: [24.0, 70.0], size: 2, note: 'Mép Nam quảng trường tròn' },
  { id: 'group-b11-west', position: [-26.0, -121.0], size: 2, note: 'Trước sảnh Tây Block 11' },
  { id: 'group-highlands', position: [146.0, -54.0], size: 2, note: 'Trước ki-ốt Highlands' },
];
for (const g of [...guards, ...groups]) {
  if (inBuilding(g.position)) console.warn(`CẢNH BÁO: ${g.id} nằm trong khung nền tòa nhà`);
  if (!inside(g.position, layout.boundary)) console.warn(`CẢNH BÁO: ${g.id} nằm ngoài ranh trường`);
}

const out = {
  _note: 'SINH TỰ ĐỘNG bởi scripts/npc-routes.mjs từ layout.json — không sửa tay. Tọa độ [x, z] mét. facing = hướng nhìn (vector đơn vị).',
  routes,
  guards,
  groups,
};
writeFileSync('src/data/npc-routes.json', JSON.stringify(out, null, 2) + '\n');
console.log(`${routes.length} tuyến, tổng ${r1(routes.reduce((s, r) => s + r.length, 0))} m`);
routes.forEach((r) => console.log(' ', r.id, r.kind, r.loop ? 'vòng' : 'đi-về', r.length, 'm', r.points.length, 'điểm'));
