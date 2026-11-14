import { campus } from '../../data';
import { isOnMedianPlanter, MEDIAN_TOP } from '../zone1/medianLayout';
import type { Vec2 } from '../../types';
import {
  BRIDGE,
  BRIDGE_WIDTH,
  FOOTWAY,
  FOOTWAY_WIDTH,
  GRASS,
  GROUND,
  INTERNAL,
  PARKING,
  POND_RIM,
  ROAD_WIDTH,
  ROUNDABOUT_GRASS,
  ROUNDABOUT_ROAD,
  ROUNDABOUT_ROAD_WIDTH,
  STREET,
  STREET_LANE_WIDTH,
} from '../groundLevels';

const { layout } = campus;
const BRIDGE_DX = 11.7;
const BRIDGE_DZ = 110.95;
const BRIDGE_LENGTH = Math.hypot(BRIDGE_DX, BRIDGE_DZ);
const V_X = BRIDGE_DX / BRIDGE_LENGTH;
const V_Z = BRIDGE_DZ / BRIDGE_LENGTH;
const U_X = V_Z;
const U_Z = -V_X;
const POND_MIN_V = -12.65;
const POND_MAX_V = 13.35;
const POND_BASINS: readonly [number, number][] = [[88, 111.8], [115.45, 128.15], [131.75, 140.5]];
const BRIDGES: readonly [Vec2, Vec2][] = [
  [[123, -72.6], [134.7, 38.4]],
  [[106.8, -70.8], [118.5, 40.1]],
];

function containsPolygon(points: readonly Vec2[], x: number, z: number): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i];
    const b = points[j];
    if (!a || !b) continue;
    if ((a[1] > z) !== (b[1] > z) && x < ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]) + a[0]) {
      inside = !inside;
    }
  }
  return inside;
}

function nearRoads(x: number, z: number, kind: 'street' | 'internal' | 'footway' | 'bridge'): boolean {
  const roads = layout.roads;
  for (let r = 0; r < roads.length; r++) {
    const road = roads[r];
    if (!road || road.kind !== kind) continue;
    let width = ROAD_WIDTH;
    if (kind === 'street') width = (road.lanes ?? 2) * STREET_LANE_WIDTH;
    else if (kind === 'footway') width = FOOTWAY_WIDTH;
    else if (kind === 'bridge') width = BRIDGE_WIDTH;
    const radiusSq = (width / 2) ** 2;
    for (let i = 0; i < road.points.length - 1; i++) {
      const a = road.points[i];
      const b = road.points[i + 1];
      if (!a || !b) continue;
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const lenSq = dx * dx + dz * dz;
      const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / lenSq));
      const px = a[0] + t * dx;
      const pz = a[1] + t * dz;
      if ((x - px) ** 2 + (z - pz) ** 2 <= radiusSq) return true;
    }
  }
  return false;
}

function inPond(x: number, z: number): boolean {
  const u = x * U_X + z * U_Z;
  const v = x * V_X + z * V_Z;
  for (let i = 0; i < POND_BASINS.length; i++) {
    const basin = POND_BASINS[i];
    if (basin && u >= basin[0] && u <= basin[1] && v >= POND_MIN_V && v <= POND_MAX_V) return true;
  }
  return false;
}

function onBridge(x: number, z: number): boolean {
  for (let i = 0; i < BRIDGES.length; i++) {
    const bridge = BRIDGES[i];
    if (!bridge) continue;
    const a = bridge[0];
    const b = bridge[1];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const lenSq = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / lenSq));
    const px = a[0] + t * dx;
    const pz = a[1] + t * dz;
    if ((x - px) ** 2 + (z - pz) ** 2 <= (BRIDGE_WIDTH / 2) ** 2) return true;
  }
  return false;
}

/** Trả cao độ lớp mặt đất cao nhất phủ lên tọa độ thế giới [x, z]. */
export function getGroundHeight(x: number, z: number): number {
  if (onBridge(x, z)) return BRIDGE;
  if (isOnMedianPlanter(x, z)) return MEDIAN_TOP;
  if (inPond(x, z)) return POND_RIM;
  if (nearRoads(x, z, 'footway')) return FOOTWAY;
  if (nearRoads(x, z, 'internal')) return INTERNAL;
  if (nearRoads(x, z, 'street')) return STREET;

  const radius = Math.hypot(x - layout.roundabout.center[0], z - layout.roundabout.center[1]);
  const inner = layout.roundabout.radius - ROUNDABOUT_ROAD_WIDTH / 2;
  const outer = layout.roundabout.radius + ROUNDABOUT_ROAD_WIDTH / 2;
  if (radius >= inner && radius <= outer) return ROUNDABOUT_ROAD;

  for (let i = 0; i < layout.parking.length; i++) {
    const parking = layout.parking[i];
    if (parking && containsPolygon(parking, x, z)) return PARKING;
  }
  if (radius < inner) return ROUNDABOUT_GRASS;
  return containsPolygon(layout.boundary, x, z) ? GRASS : GROUND;
}

/** Nội suy mượt cao độ theo thời gian, độc lập với tần số khung hình. */
export function dampHeight(current: number, target: number, dt: number): number {
  const alpha = 1 - Math.exp(-12 * Math.max(0, dt));
  return current + (target - current) * alpha;
}
