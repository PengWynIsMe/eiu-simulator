import { getBuilding } from '../../../data';
import type { Vec2 } from '../../../types';
import { computePrincipalAxis } from '../../kit/geometryHelpers';
import type { InteriorLayout, InteractivePoint, WallSegment } from '../types';

const building = getBuilding('can-tin');
if (!building) throw new Error('Dữ liệu sai ở căn tin');
const axis = computePrincipalAxis(building.shape.outer);
export const canteenWidth = axis.maxU;
export const canteenDepth = axis.maxV;
export const canteenToWorld = (u: number, v: number): Vec2 => [axis.originX + u * axis.ux + v * axis.vx, axis.originZ + u * axis.uz + v * axis.vz];
const toLocal = (x: number, z: number): [number, number] => axis.toUV([x, z]);
const inside = canteenToWorld(canteenWidth / 2, canteenDepth - 2.5);
const outside = canteenToWorld(canteenWidth / 2, canteenDepth + 2.5);
const yaw = Math.atan2(-axis.vz, -axis.vx);
const entrance = { id: 'canteen-door', buildingId: 'can-tin', worldPos: outside, radius: 4, label: 'Vào căn tin', spawnInsideWorld: inside, spawnInsideYaw: yaw, spawnOutsideWorld: outside, spawnOutsideYaw: yaw + Math.PI };
const walls: WallSegment[] = [
  { u1: 0, v1: 0, u2: canteenWidth, v2: 0, thickness: 0.2 },
  { u1: 0, v1: 0, u2: 0, v2: canteenDepth, thickness: 0.2 },
  { u1: canteenWidth, v1: 0, u2: canteenWidth, v2: canteenDepth, thickness: 0.2 },
  { u1: 0, v1: canteenDepth, u2: canteenWidth / 2 - 3, v2: canteenDepth, thickness: 0.2 },
  { u1: canteenWidth / 2 + 3, v1: canteenDepth, u2: canteenWidth, v2: canteenDepth, thickness: 0.2 },
];
export const tableCenters: [number, number][] = [];
for (let u = 6; u < canteenWidth - 4; u += 5.2) {
  if (Math.abs(u - canteenWidth / 2) < 3.5) continue;
  for (let v = 12; v < canteenDepth - 4; v += 5.2) tableCenters.push([u, v]);
}
function near(x: number, z: number, floor: number | null): InteractivePoint | null {
  const pos = floor === null ? outside : inside;
  if (Math.hypot(x - pos[0], z - pos[1]) > 4) return null;
  return { id: floor === null ? entrance.id : 'canteen-exit', type: floor === null ? 'exterior-door' : 'interior-door', worldPos: pos, radius: 4, label: floor === null ? 'Vào căn tin' : 'Ra ngoài', buildingId: 'can-tin', spawnPosWorld: floor === null ? inside : outside, spawnYaw: floor === null ? yaw : yaw + Math.PI };
}
export const canteenLayout: InteriorLayout = {
  buildingId: 'can-tin', name: 'Căn tin EIU', origin: [axis.originX, axis.originZ], rotationY: axis.rotY, floors: 1,
  toWorld: canteenToWorld, toLocal, getFloorWalls: () => walls, getFloorRooms: () => [],
  getFloorBoundaryPts: () => [canteenToWorld(0, 0), canteenToWorld(canteenWidth, 0), canteenToWorld(canteenWidth, canteenDepth), canteenToWorld(0, canteenDepth)],
  resolvePosition: (x, z, px, pz, _floor, radius = 0.35) => {
    const [u, v] = toLocal(x, z);
    if (u < radius || u > canteenWidth - radius || v < radius || v > canteenDepth - radius || v < 5 || tableCenters.some(([tu, tv]) => Math.abs(u - tu) < 1.45 + radius && Math.abs(v - tv) < 1.15 + radius)) return [px, pz];
    return [x, z];
  },
  getActiveRoom: () => null, getNearInteractive: near,
  elevator: { posLocal: [0, 0], spawnLocal: [0, 0], posWorld: inside, spawnWorld: inside, facingYaw: yaw },
  exteriorEntrances: [entrance], defaultInsideEntrance: inside, defaultOutsideEntrance: outside,
};
