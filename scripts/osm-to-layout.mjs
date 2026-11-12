// Tải dữ liệu OpenStreetMap quanh EIU và xuất src/data/layout.json (tọa độ mét).
// Chạy: npm run layout
// Hệ tọa độ: gốc = tâm vòng xoay, 1 đơn vị = 1 m, +X = Đông, -Z = Bắc, Y = lên trên.
// Dữ liệu © OpenStreetMap contributors (ODbL).

import { writeFile } from 'node:fs/promises';

const BBOX = '106.6615,11.0490,106.6705,11.0575';
const OUT = new URL('../src/data/layout.json', import.meta.url);

const res = await fetch(`https://api.openstreetmap.org/api/0.6/map.json?bbox=${BBOX}`, {
  headers: { 'User-Agent': 'campussim-dev/0.1' },
});
if (!res.ok) throw new Error(`OSM API ${res.status}`);
const { elements } = await res.json();

const nodes = new Map(elements.filter((e) => e.type === 'node').map((e) => [e.id, e]));
const ways = new Map(elements.filter((e) => e.type === 'way').map((e) => [e.id, e]));
const relations = elements.filter((e) => e.type === 'relation');

const lonLat = (id) => nodes.get(id);
const ring = (way) => way.nodes.map(lonLat).filter(Boolean);

// Tâm vòng xoay: đường service khép kín, bán kính 50–120 m.
const centroid = (pts) => [
  pts.reduce((s, p) => s + p.lon, 0) / pts.length,
  pts.reduce((s, p) => s + p.lat, 0) / pts.length,
];
let roundabout = null;
for (const w of ways.values()) {
  if (w.tags?.highway !== 'service' || w.nodes[0] !== w.nodes.at(-1)) continue;
  const pts = ring(w);
  const [lon, lat] = centroid(pts);
  const r = Math.hypot((pts[0].lon - lon) * 109260, (pts[0].lat - lat) * 110574);
  if (r > 50 && r < 120) roundabout = { lon, lat, wayId: w.id };
}
if (!roundabout) throw new Error('Không tìm thấy vòng xoay');

const LON0 = roundabout.lon;
const LAT0 = roundabout.lat;
const M_PER_LON = 111320 * Math.cos((LAT0 * Math.PI) / 180);
const M_PER_LAT = 110574;
const round = (v) => Math.round(v * 10) / 10;
const toXZ = (n) => [round((n.lon - LON0) * M_PER_LON), round(-(n.lat - LAT0) * M_PER_LAT)];
const path = (way) => ring(way).map(toXZ);

const campusWay = [...ways.values()].find((w) => w.tags?.amenity === 'university');
const boundary = path(campusWay);

// Điểm nằm trong đa giác (ray casting) — lọc chỉ lấy thứ trong khuôn viên.
const inside = ([x, z], poly) => {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) hit = !hit;
  }
  return hit;
};
const avg = (pts) => [
  pts.reduce((s, p) => s + p[0], 0) / pts.length,
  pts.reduce((s, p) => s + p[1], 0) / pts.length,
];

const buildings = [];
const usedWays = new Set();
for (const r of relations) {
  if (!r.tags?.building) continue;
  const outer = r.members.find((m) => m.role === 'outer' && ways.has(m.ref));
  if (!outer) continue;
  const footprint = path(ways.get(outer.ref));
  if (!inside(avg(footprint), boundary)) continue;
  const holes = r.members.filter((m) => m.role === 'inner' && ways.has(m.ref)).map((m) => path(ways.get(m.ref)));
  r.members.forEach((m) => usedWays.add(m.ref));
  buildings.push({ osmId: `r${r.id}`, osmName: r.tags.name ?? null, levels: Number(r.tags['building:levels']) || null, footprint, holes });
}
for (const w of ways.values()) {
  if (!w.tags?.building || usedWays.has(w.id)) continue;
  const footprint = path(w);
  if (!inside(avg(footprint), boundary)) continue;
  buildings.push({ osmId: `w${w.id}`, osmName: w.tags.name ?? null, levels: Number(w.tags['building:levels']) || null, footprint, holes: [] });
}

const roads = [];
for (const w of ways.values()) {
  const h = w.tags?.highway;
  if (!h || w.id === roundabout.wayId) continue;
  const points = path(w);
  const kind = w.tags.bridge === 'yes' ? 'bridge' : h === 'footway' ? 'footway' : h === 'tertiary' ? 'street' : 'internal';
  // Đường nội bộ/lối đi: chỉ lấy nếu có điểm trong khuôn viên. Đường phố bao quanh: giữ hết.
  if (kind !== 'street' && !points.some((p) => inside(p, boundary))) continue;
  roads.push({ osmId: `w${w.id}`, name: w.tags.name ?? null, kind, lanes: Number(w.tags.lanes) || null, points });
}

const parking = [...ways.values()]
  .filter((w) => w.tags?.amenity === 'motorcycle_parking')
  .map((w) => ({ osmId: `w${w.id}`, footprint: path(w) }));

const rbPts = path(ways.get(roundabout.wayId));
const rbRadius = round(rbPts.reduce((s, [x, z]) => s + Math.hypot(x, z), 0) / rbPts.length);

const layout = {
  _note: 'File sinh tự động bởi scripts/osm-to-layout.mjs — KHÔNG sửa tay. Dữ liệu © OpenStreetMap contributors (ODbL).',
  origin: { lat: LAT0, lon: LON0 },
  units: 'm; +X = Đông, -Z = Bắc',
  roundabout: { center: [0, 0], radius: rbRadius },
  boundary,
  buildings,
  parking,
  roads,
};
await writeFile(OUT, JSON.stringify(layout) + '\n');
console.log(`layout.json: ${buildings.length} tòa, ${roads.length} đường, ${parking.length} bãi xe, vòng xoay r=${rbRadius} m`);
