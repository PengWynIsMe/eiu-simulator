// Lớp DUY NHẤT đọc dữ liệu. Component chỉ import từ file này, không import JSON trực tiếp.
// Sau này chuyển sang Supabase chỉ cần sửa file này.
import campusRaw from './campus.json';
import layoutRaw from './layout.json';
import buildingDetailsRaw from './building-details.json';
import type { Building, BuildingDetail, BuildingFloorDetail, BuildingInfo, BuildingKind, Campus, DetailLevel, Footprint, InfoSource, Layout, Major, Road, RoadKind, RoomEntry, RoomGroup, Vec2 } from '../types';
import { arr, fail, num, obj, oneOf, optStr, polygon, str, vec2 } from './validate';

/** Chiều cao trung bình một tầng (m). */
export const FLOOR_HEIGHT = 3.8;

// ---- Kiểm tra + ghép dữ liệu (hàm kiểm tra ở ./validate) ----

const BUILDING_KINDS: readonly BuildingKind[] = ['academic', 'library', 'admin', 'canteen', 'kiosk', 'parking', 'gate', 'other'];
const ROAD_KINDS: readonly RoadKind[] = ['street', 'internal', 'footway', 'bridge'];

function detailLevel(v: unknown, path: string): DetailLevel {
  if (v !== 1 && v !== 2 && v !== 3) fail(path, '1 | 2 | 3');
  return v;
}

function buildingInfo(v: unknown, path: string): BuildingInfo {
  const o = obj(v, path);
  return {
    id: str(o.id, `${path}.id`),
    osmId: optStr(o.osmId, `${path}.osmId`),
    footprint: o.footprint === undefined ? undefined : polygon(o.footprint, `${path}.footprint`),
    name: str(o.name, `${path}.name`),
    shortName: str(o.shortName, `${path}.shortName`),
    kind: oneOf(o.kind, BUILDING_KINDS, `${path}.kind`),
    zone: num(o.zone, `${path}.zone`),
    floors: num(o.floors, `${path}.floors`),
    color: str(o.color, `${path}.color`),
    detailLevel: detailLevel(o.detailLevel, `${path}.detailLevel`),
    modelUrl: optStr(o.modelUrl, `${path}.modelUrl`),
    majorIds: arr(o.majorIds, `${path}.majorIds`).map((m, i) => str(m, `${path}.majorIds[${i}]`)),
    notes: optStr(o.notes, `${path}.notes`),
  };
}

function major(v: unknown, path: string): Major {
  const o = obj(v, path);
  const strings = (x: unknown, p: string) => arr(x, p).map((s, i) => str(s, `${p}[${i}]`));
  const source = obj(o.source, `${path}.source`);
  return {
    id: str(o.id, `${path}.id`),
    name: str(o.name, `${path}.name`),
    shortDescription: str(o.shortDescription, `${path}.shortDescription`),
    curriculum: arr(o.curriculum, `${path}.curriculum`).map((y, i) => {
      const yo = obj(y, `${path}.curriculum[${i}]`);
      return {
        year: num(yo.year, `${path}.curriculum[${i}].year`),
        courses: arr(yo.courses, `${path}.curriculum[${i}].courses`).map((c, j) => {
          const p = `${path}.curriculum[${i}].courses[${j}]`;
          const co = obj(c, p);
          return {
            code: optStr(co.code, `${p}.code`),
            name: str(co.name, `${p}.name`),
            credits: co.credits === undefined ? undefined : num(co.credits, `${p}.credits`),
            description: optStr(co.description, `${p}.description`),
          };
        }),
      };
    }),
    dayInLife: strings(o.dayInLife, `${path}.dayInLife`),
    skills: strings(o.skills, `${path}.skills`),
    careers: strings(o.careers, `${path}.careers`),
    source: {
      label: str(source.label, `${path}.source.label`),
      url: optStr(source.url, `${path}.source.url`),
      updatedAt: str(source.updatedAt, `${path}.source.updatedAt`),
    },
  };
}

function road(v: unknown, path: string): Road {
  const o = obj(v, path);
  return {
    kind: oneOf(o.kind, ROAD_KINDS, `${path}.kind`),
    name: o.name === null ? null : str(o.name, `${path}.name`),
    lanes: o.lanes === null ? null : num(o.lanes, `${path}.lanes`),
    points: arr(o.points, `${path}.points`).map((p, i) => vec2(p, `${path}.points[${i}]`)),
  };
}

function buildingDetail(v: unknown, path: string): BuildingDetail {
  const o = obj(v, path);
  const sourceObj = obj(o.source, `${path}.source`);
  const source: InfoSource = {
    status: oneOf(sourceObj.status, ['xac-minh', 'chua-xac-minh'], `${path}.source.status`),
    label: str(sourceObj.label, `${path}.source.label`),
    url: optStr(sourceObj.url, `${path}.source.url`),
  };
  const floors: BuildingFloorDetail[] | undefined = o.floors === undefined
    ? undefined
    : arr(o.floors, `${path}.floors`).map((floor, i) => {
      const floorPath = `${path}.floors[${i}]`;
      const f = obj(floor, floorPath);
      const groups: RoomGroup[] = arr(f.groups, `${floorPath}.groups`).map((group, j) => {
        const groupPath = `${floorPath}.groups[${j}]`;
        const g = obj(group, groupPath);
        const rooms: RoomEntry[] = arr(g.rooms, `${groupPath}.rooms`).map((room, k) => {
          const roomPath = `${groupPath}.rooms[${k}]`;
          const r = obj(room, roomPath);
          return { code: optStr(r.code, `${roomPath}.code`), name: str(r.name, `${roomPath}.name`) };
        });
        return { title: optStr(g.title, `${groupPath}.title`), rooms };
      });
      return {
        floorNumber: num(f.floorNumber, `${floorPath}.floorNumber`),
        label: str(f.label, `${floorPath}.label`),
        elevation: str(f.elevation, `${floorPath}.elevation`),
        architecturalNote: str(f.architecturalNote, `${floorPath}.architecturalNote`),
        groups,
      };
    });
  return {
    subtitle: str(o.subtitle, `${path}.subtitle`),
    facts: arr(o.facts, `${path}.facts`).map((fact, i) => str(fact, `${path}.facts[${i}]`)),
    floors,
    source,
  };
}

// ---- Ghép campus.json (thông tin) + layout.json (hình học từ OSM) ----

function centroid(pts: Vec2[]): Vec2 {
  const sx = pts.reduce((s, p) => s + p[0], 0);
  const sz = pts.reduce((s, p) => s + p[1], 0);
  return [sx / pts.length, sz / pts.length];
}

function load(): { campus: Campus; majors: Major[]; buildingDetails: Record<string, BuildingDetail> } {
  const root = obj(campusRaw, 'campus.json');
  const campusObj = obj(root.campus, 'campus');
  const lay = obj(layoutRaw, 'layout.json');

  const osmShapes = new Map<string, Footprint>();
  arr(lay.buildings, 'layout.buildings').forEach((b, i) => {
    const o = obj(b, `layout.buildings[${i}]`);
    osmShapes.set(str(o.osmId, `layout.buildings[${i}].osmId`), {
      outer: polygon(o.footprint, `layout.buildings[${i}].footprint`),
      holes: arr(o.holes, `layout.buildings[${i}].holes`).map((h, j) => polygon(h, `layout.buildings[${i}].holes[${j}]`)),
    });
  });

  const majors = arr(root.majors, 'majors').map((m, i) => major(m, `majors[${i}]`));
  const majorIds = new Set(majors.map((m) => m.id));

  const ids = new Set<string>();
  const buildings: Building[] = arr(campusObj.buildings, 'campus.buildings').map((b, i) => {
    const path = `campus.buildings[${i}]`;
    const info = buildingInfo(b, path);
    if (ids.has(info.id)) fail(`${path}.id`, `id không trùng (đã có "${info.id}")`);
    ids.add(info.id);
    info.majorIds.forEach((m) => {
      if (!majorIds.has(m)) fail(`${path}.majorIds`, `ngành "${m}" có trong majors`);
    });
    const shape = info.footprint
      ? { outer: info.footprint, holes: [] }
      : info.osmId
        ? osmShapes.get(info.osmId)
        : undefined;
    if (!shape) fail(path, `osmId có trong layout.json hoặc footprint (osmId = ${info.osmId ?? 'trống'})`);
    return { ...info, shape, center: centroid(shape.outer), height: info.floors * FLOOR_HEIGHT };
  });

  const buildingDetailsObj = obj(buildingDetailsRaw, 'building-details.json');
  const buildingDetails: Record<string, BuildingDetail> = {};
  for (const [id, detail] of Object.entries(buildingDetailsObj)) {
    if (!ids.has(id)) fail(`building-details.${id}`, 'id có trong campus.buildings');
    buildingDetails[id] = buildingDetail(detail, `building-details.${id}`);
  }

  const rb = obj(lay.roundabout, 'layout.roundabout');
  const layout: Layout = {
    roundabout: { center: vec2(rb.center, 'layout.roundabout.center'), radius: num(rb.radius, 'layout.roundabout.radius') },
    boundary: polygon(lay.boundary, 'layout.boundary'),
    roads: arr(lay.roads, 'layout.roads').map((r, i) => road(r, `layout.roads[${i}]`)),
    parking: arr(lay.parking, 'layout.parking').map((p, i) => polygon(obj(p, `layout.parking[${i}]`).footprint, `layout.parking[${i}].footprint`)),
  };

  return {
    campus: { id: str(campusObj.id, 'campus.id'), name: str(campusObj.name, 'campus.name'), buildings, layout },
    majors,
    buildingDetails,
  };
}

const data = load();

export const campus: Campus = data.campus;
export const majors: Major[] = data.majors;
const buildingDetails = data.buildingDetails;

const buildingById = new Map(campus.buildings.map((b) => [b.id, b]));
const majorById = new Map(majors.map((m) => [m.id, m]));

export function getBuilding(id: string): Building | undefined {
  return buildingById.get(id);
}

export function getMajor(id: string): Major | undefined {
  return majorById.get(id);
}

export function getMajorsOfBuilding(buildingId: string): Major[] {
  return (getBuilding(buildingId)?.majorIds ?? []).flatMap((id) => majorById.get(id) ?? []);
}

export function getBuildingsInZone(zone: number): Building[] {
  return campus.buildings.filter((b) => b.zone === zone);
}

export function getBuildingDetail(id: string): BuildingDetail | undefined {
  return buildingDetails[id];
}
