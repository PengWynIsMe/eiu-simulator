import { getClassroom, getLesson } from '../../data';
import { b8UvToWorld, getRoomSpecForStage } from '../../data/timeline/curriculumPlans';
import { useActivityStore } from '../../store/useActivityStore';
import { useExploreStore } from '../../store/useExploreStore';
import { useLessonStore } from '../../store/useLessonStore';
import { useTimelineStore } from '../../store/useTimelineStore';
import { useWalkStore } from '../../store/useWalkStore';
import type { Vec2 } from '../../types';
import { getInteriorLayout } from '../interior/layouts';
import {
  B8_ELEVATOR_SPAWN_LOCAL,
  B8_ENTRANCE_NORTH_OUTSIDE,
  B8_ENTRANCE_SOUTH_OUTSIDE,
  getFloorDoors as getB8FloorDoors,
  getFloorRooms as getB8FloorRooms,
  toLocal as b8ToLocal,
} from '../interior/layouts/b8';
import { b11ToLocal, b11ToWorld } from '../interior/layouts/b11';

export type GuideTone = 'target' | 'transit';

export interface ActiveGuideRoute {
  readonly count: number;
  readonly points: [number, number][];
  readonly tone: GuideTone;
  readonly isExplorePoi: boolean;
  readonly arriveRadius: number;
}

const MAX_ROUTE_POINTS = 8;

/** Bộ đệm tái sử dụng không cấp phát mới trong vòng lặp useFrame. */
const scratchPoints: [number, number][] = Array.from({ length: MAX_ROUTE_POINTS }, () => [0, 0]);
const scratchRoute: {
  count: number;
  points: [number, number][];
  tone: GuideTone;
  isExplorePoi: boolean;
  arriveRadius: number;
} = {
  count: 0,
  points: scratchPoints,
  tone: 'target',
  isExplorePoi: false,
  arriveRadius: 3.0,
};

function resetRoute(tone: GuideTone, isExplorePoi: boolean, arriveRadius: number): void {
  scratchRoute.count = 0;
  scratchRoute.tone = tone;
  scratchRoute.isExplorePoi = isExplorePoi;
  scratchRoute.arriveRadius = arriveRadius;
}

function pushPoint(x: number, z: number): void {
  if (scratchRoute.count >= MAX_ROUTE_POINTS) return;
  if (scratchRoute.count > 0) {
    const prev = scratchPoints[scratchRoute.count - 1];
    if (prev && Math.hypot(x - prev[0], z - prev[1]) < 0.35) return;
  }
  const slot = scratchPoints[scratchRoute.count];
  if (slot) {
    slot[0] = x;
    slot[1] = z;
    scratchRoute.count++;
  }
}

function closestExteriorEntrance(buildingId: string, px: number, pz: number): Vec2 | null {
  const layout = getInteriorLayout(buildingId);
  if (!layout || layout.exteriorEntrances.length === 0) return null;
  let best = layout.exteriorEntrances[0]?.worldPos ?? null;
  let bestDistSq = Number.POSITIVE_INFINITY;
  for (const ent of layout.exteriorEntrances) {
    const dx = ent.worldPos[0] - px;
    const dz = ent.worldPos[1] - pz;
    const d2 = dx * dx + dz * dz;
    if (d2 < bestDistSq) {
      bestDistSq = d2;
      best = ent.worldPos;
    }
  }
  return best;
}

function pushExitRouteFromCurrentBuilding(
  buildingId: string,
  floor: number,
  px: number,
  pz: number
): void {
  const id = buildingId.toLowerCase();
  resetRoute('transit', false, 2.2);
  pushPoint(px, pz);

  const layout = getInteriorLayout(id);
  if (!layout) return;

  // Nếu đang ở tầng trên, dẫn ra thang máy trước để xuống tầng 1
  if (floor > 1 && layout.elevator) {
    if (id === 'b8') {
      pushB8CorridorPoints(px, pz, B8_ELEVATOR_SPAWN_LOCAL[0], B8_ELEVATOR_SPAWN_LOCAL[1]);
    } else if (id === 'b11') {
      pushB11CorridorPoints(px, pz, 63.0, -127.0);
    } else {
      pushPoint(layout.elevator.spawnWorld[0], layout.elevator.spawnWorld[1]);
    }
    return;
  }

  // Tầng 1: chọn cửa ra gần nhất
  let best: Vec2 | null = null;
  let bestDistSq = Number.POSITIVE_INFINITY;
  for (const ent of layout.exteriorEntrances) {
    const pos = ent.spawnInsideWorld;
    const dx = pos[0] - px;
    const dz = pos[1] - pz;
    const d2 = dx * dx + dz * dz;
    if (d2 < bestDistSq) {
      bestDistSq = d2;
      best = pos;
    }
  }
  if (best) {
    if (id === 'b8') {
      const [du, dv] = b8ToLocal(best[0], best[1]);
      pushB8CorridorPoints(px, pz, du, dv);
    } else if (id === 'b11') {
      const [du, dv] = b11ToLocal(best[0], best[1]);
      pushB11CorridorPoints(px, pz, du, dv);
    } else {
      pushPoint(best[0], best[1]);
    }
  }
}

/** Dẫn đường theo hành lang Block 8 (tránh cắt xuyên tường phòng học & sân trong). */
function pushB8CorridorPoints(
  px: number,
  pz: number,
  targetU: number,
  targetV: number,
  floor?: number,
  targetRoomCode?: string
): void {
  const [pu, pv] = b8ToLocal(px, pz);
  const NORTH_CORR_V = -198.4;
  const SOUTH_CORR_V = -178.7;
  const BRIDGE_U = 52.2;

  // Nếu đích nằm trong 1 phòng cụ thể ở cánh Bắc hoặc cánh Nam
  if (floor !== undefined && targetRoomCode) {
    const rooms = getB8FloorRooms(floor);
    const room = rooms.find((r) => r.code === targetRoomCode);
    if (room) {
      const inRoom =
        pu >= room.minU - 0.1 &&
        pu <= room.maxU + 0.1 &&
        pv >= room.minV - 0.1 &&
        pv <= room.maxV + 0.1;
      if (inRoom) {
        const [tx, tz] = b8UvToWorld(targetU, targetV);
        pushPoint(tx, tz);
        return;
      }

      const doors = getB8FloorDoors(floor).filter((d) => d.roomCode === room.code);
      let doorU = (room.minU + room.maxU) * 0.5;
      let doorV = room.maxV <= -200.0 ? room.maxV : room.minV;
      const firstDoor = doors[0];
      if (firstDoor) {
        let bestDoor = firstDoor;
        let bestDist = Number.POSITIVE_INFINITY;
        for (const d of doors) {
          const midU = (d.u1 + d.u2) * 0.5;
          const dist = Math.abs(pu - midU);
          if (dist < bestDist) {
            bestDist = dist;
            bestDoor = d;
          }
        }
        doorU = (bestDoor.u1 + bestDoor.u2) * 0.5;
        doorV = bestDoor.v;
      }

      const isNorthRoom = room.maxV <= -200.0;
      const roomCorrV = isNorthRoom ? NORTH_CORR_V : SOUTH_CORR_V;
      const insideDoorV = isNorthRoom ? doorV - 1.3 : doorV + 1.3;

      // Nếu người chơi đang ở trong phòng khác (ngoài hành lang), bước ra hành lang trước
      if (pv < -200.0) {
        const [cx, cz] = b8UvToWorld(pu, NORTH_CORR_V);
        pushPoint(cx, cz);
      } else if (pv > -177.7) {
        const [cx, cz] = b8UvToWorld(pu, SOUTH_CORR_V);
        pushPoint(cx, cz);
      }

      // Nếu người chơi đang ở cánh đối diện hoặc sảnh thang máy giữa -> qua cầu giữa (u = 52.2)
      const playerOnNorth = pv <= -194.5;
      const playerOnSouth = pv >= -183.0;
      if ((isNorthRoom && !playerOnNorth) || (!isNorthRoom && !playerOnSouth)) {
        const curV = playerOnNorth ? NORTH_CORR_V : playerOnSouth ? SOUTH_CORR_V : pv;
        const [b1x, b1z] = b8UvToWorld(BRIDGE_U, curV);
        const [b2x, b2z] = b8UvToWorld(BRIDGE_U, roomCorrV);
        pushPoint(b1x, b1z);
        pushPoint(b2x, b2z);
      }

      // Dọc hành lang đến ngay trước cửa phòng -> xuyên qua cửa -> tới điểm đích
      const [pDoorOutX, pDoorOutZ] = b8UvToWorld(doorU, roomCorrV);
      const [pDoorInX, pDoorInZ] = b8UvToWorld(doorU, insideDoorV);
      const [tx, tz] = b8UvToWorld(targetU, targetV);
      pushPoint(pDoorOutX, pDoorOutZ);
      pushPoint(pDoorInX, pDoorInZ);
      pushPoint(tx, tz);
      return;
    }
  }

  // Đích là thang máy hoặc lối ra ở trục giữa (targetU ~ 52..54)
  if (pv < -200.0) {
    const [cx, cz] = b8UvToWorld(pu, NORTH_CORR_V);
    pushPoint(cx, cz);
  } else if (pv > -177.7) {
    const [cx, cz] = b8UvToWorld(pu, SOUTH_CORR_V);
    pushPoint(cx, cz);
  }

  const playerOnNorth = pv <= -194.5;
  const playerOnSouth = pv >= -183.0;
  if (playerOnNorth && targetV > -195.0) {
    const [bx, bz] = b8UvToWorld(BRIDGE_U, NORTH_CORR_V);
    pushPoint(bx, bz);
  } else if (playerOnSouth && targetV < -182.0) {
    const [bx, bz] = b8UvToWorld(BRIDGE_U, SOUTH_CORR_V);
    pushPoint(bx, bz);
  }
  const [tx, tz] = b8UvToWorld(targetU, targetV);
  pushPoint(tx, tz);
}

/** Dẫn đường theo hành lang Block 11 (tránh cắt xuyên tường & sân trong). */
function pushB11CorridorPoints(
  px: number,
  pz: number,
  targetU: number,
  targetV: number,
  doorUv?: readonly [number, number]
): void {
  const [pu, pv] = b11ToLocal(px, pz);
  const NORTH_CORR_V = -134.1;
  const SOUTH_CORR_V = -118.8;
  const BRIDGE_U = 63.0;

  if (doorUv) {
    const inNorthRoom = pv <= -136.0 && Math.abs(pu - doorUv[0]) <= 6.5;
    if (inNorthRoom) {
      const [tx, tz] = b11ToWorld(targetU, targetV);
      pushPoint(tx, tz);
      return;
    }
    const isNorthTarget = doorUv[1] <= -134.5;
    const targetCorrV = isNorthTarget ? NORTH_CORR_V : SOUTH_CORR_V;
    const playerOnNorth = pv <= -131.5;
    const playerOnSouth = pv >= -121.0;

    if ((isNorthTarget && !playerOnNorth) || (!isNorthTarget && !playerOnSouth)) {
      const curV = playerOnNorth ? NORTH_CORR_V : playerOnSouth ? SOUTH_CORR_V : pv;
      const [b1x, b1z] = b11ToWorld(BRIDGE_U, curV);
      const [b2x, b2z] = b11ToWorld(BRIDGE_U, targetCorrV);
      pushPoint(b1x, b1z);
      pushPoint(b2x, b2z);
    }

    const [dOutX, dOutZ] = b11ToWorld(doorUv[0], targetCorrV);
    const [dInX, dInZ] = b11ToWorld(doorUv[0], isNorthTarget ? doorUv[1] - 1.4 : doorUv[1] + 1.4);
    const [tx, tz] = b11ToWorld(targetU, targetV);
    pushPoint(dOutX, dOutZ);
    pushPoint(dInX, dInZ);
    pushPoint(tx, tz);
    return;
  }

  const playerOnNorth = pv <= -131.5;
  const playerOnSouth = pv >= -121.0;
  if (playerOnNorth && targetV > -131.5) {
    const [bx, bz] = b11ToWorld(BRIDGE_U, NORTH_CORR_V);
    pushPoint(bx, bz);
  } else if (playerOnSouth && targetV < -121.0) {
    const [bx, bz] = b11ToWorld(BRIDGE_U, SOUTH_CORR_V);
    pushPoint(bx, bz);
  }
  const [tx, tz] = b11ToWorld(targetU, targetV);
  pushPoint(tx, tz);
}

/**
 * Trả về lộ trình mũi tên 3D đang hoạt động cho cả trong nhà và ngoài trời:
 * Ưu tiên: (1) IT Silver -> (2) Buổi học -> (3) Lộ trình 5 năm -> (4) Điểm ghim Explore.
 */
export function resolveActiveGuideRoute(): ActiveGuideRoute | null {
  const ws = useWalkStore.getState();
  const interior = ws.interior;
  const px = ws.walkMode || interior ? ws.playerPos.x : 244;
  const pz = ws.walkMode || interior ? ws.playerPos.z : -28;

  // 1. IT Silver (useActivityStore)
  const actState = useActivityStore.getState();
  if (
    actState.activity &&
    actState.phase !== 'engaged' &&
    !actState.seated &&
    !actState.screenOpen
  ) {
    const act = actState.activity;
    const spot = act.seat ? act.seat.spot : act.target;
    const targetBld = spot.buildingId?.toLowerCase() ?? null;
    const targetFloor = spot.floor ?? 1;

    if (!targetBld) {
      if (interior) {
        pushExitRouteFromCurrentBuilding(interior.buildingId, interior.floor, px, pz);
        return scratchRoute.count >= 2 ? scratchRoute : null;
      }
      resetRoute('target', false, 2.2);
      pushPoint(px, pz);
      pushPoint(spot.x, spot.z);
      return scratchRoute.count >= 2 ? scratchRoute : null;
    }

    if (!interior) {
      const ent = closestExteriorEntrance(targetBld, px, pz);
      resetRoute('target', false, 2.5);
      pushPoint(px, pz);
      pushPoint(ent ? ent[0] : spot.x, ent ? ent[1] : spot.z);
      return scratchRoute.count >= 2 ? scratchRoute : null;
    }

    if (interior.buildingId.toLowerCase() !== targetBld) {
      pushExitRouteFromCurrentBuilding(interior.buildingId, interior.floor, px, pz);
      return scratchRoute.count >= 2 ? scratchRoute : null;
    }

    if (interior.floor !== targetFloor) {
      resetRoute('transit', false, 1.8);
      pushPoint(px, pz);
      if (targetBld === 'b8') {
        pushB8CorridorPoints(px, pz, B8_ELEVATOR_SPAWN_LOCAL[0], B8_ELEVATOR_SPAWN_LOCAL[1]);
      } else if (targetBld === 'b11') {
        pushB11CorridorPoints(px, pz, 63.0, -127.0);
      } else {
        const elev = getInteriorLayout(targetBld)?.elevator.spawnWorld;
        if (elev) pushPoint(elev[0], elev[1]);
      }
      return scratchRoute.count >= 2 ? scratchRoute : null;
    }

    resetRoute('target', false, 1.5);
    pushPoint(px, pz);
    if (targetBld === 'b8') {
      const [tu, tv] = b8ToLocal(spot.x, spot.z);
      const room = getB8FloorRooms(targetFloor).find(
        (r) => r.code.includes('.B8') && tu >= r.minU && tu <= r.maxU && tv >= r.minV && tv <= r.maxV
      );
      pushB8CorridorPoints(px, pz, tu, tv, targetFloor, room?.code);
    } else if (targetBld === 'b11') {
      const [tu, tv] = b11ToLocal(spot.x, spot.z);
      const room = getClassroom('406.B11');
      const in406 =
        room &&
        targetFloor === room.floor &&
        tu >= room.bounds.minU &&
        tu <= room.bounds.maxU &&
        tv >= room.bounds.minV &&
        tv <= room.bounds.maxV;
      pushB11CorridorPoints(px, pz, tu, tv, in406 ? [room.door.u, room.door.v] : undefined);
    } else {
      pushPoint(spot.x, spot.z);
    }
    return scratchRoute.count >= 2 ? scratchRoute : null;
  }

  // 2. Buổi học (useLessonStore)
  const lessonState = useLessonStore.getState();
  if (
    (lessonState.phase === 'goToClass' || lessonState.phase === 'findSeat') &&
    lessonState.lessonId
  ) {
    const lesson = getLesson(lessonState.lessonId);
    const room = lesson ? getClassroom(lesson.roomCode) : undefined;
    if (room) {
      const targetBld = room.buildingId.toLowerCase();
      const targetFloor = room.floor;

      if (!interior) {
        const ent = closestExteriorEntrance(targetBld, px, pz);
        resetRoute('target', false, 2.5);
        pushPoint(px, pz);
        pushPoint(ent ? ent[0] : room.doorWorld[0], ent ? ent[1] : room.doorWorld[1]);
        return scratchRoute.count >= 2 ? scratchRoute : null;
      }

      if (interior.buildingId.toLowerCase() !== targetBld) {
        pushExitRouteFromCurrentBuilding(interior.buildingId, interior.floor, px, pz);
        return scratchRoute.count >= 2 ? scratchRoute : null;
      }

      if (interior.floor !== targetFloor) {
        resetRoute('transit', false, 1.8);
        pushPoint(px, pz);
        if (targetBld === 'b11') {
          pushB11CorridorPoints(px, pz, 63.0, -127.0);
        } else if (targetBld === 'b8') {
          pushB8CorridorPoints(px, pz, B8_ELEVATOR_SPAWN_LOCAL[0], B8_ELEVATOR_SPAWN_LOCAL[1]);
        }
        return scratchRoute.count >= 2 ? scratchRoute : null;
      }

      resetRoute('target', false, 1.5);
      pushPoint(px, pz);
      const targetWorld = lessonState.phase === 'findSeat' ? room.centerWorld : room.doorWorld;
      if (targetBld === 'b11') {
        const [tu, tv] = b11ToLocal(targetWorld[0], targetWorld[1]);
        pushB11CorridorPoints(px, pz, tu, tv, [room.door.u, room.door.v]);
      } else if (targetBld === 'b8') {
        const [tu, tv] = b8ToLocal(targetWorld[0], targetWorld[1]);
        pushB8CorridorPoints(px, pz, tu, tv, targetFloor, room.code);
      } else {
        pushPoint(targetWorld[0], targetWorld[1]);
      }
      return scratchRoute.count >= 2 ? scratchRoute : null;
    }
  }

  // 3. Lộ trình 5 năm (useTimelineStore)
  const ts = useTimelineStore.getState();
  if (
    ts.active &&
    !ts.modalOpen &&
    ts.stage !== 'graduation' &&
    ts.stage !== 'ielts-exam'
  ) {
    const spec = getRoomSpecForStage(ts.stage);
    if (!interior) {
      // Chọn cửa Block 8 gần nhất (Nam hoặc Bắc)
      const dSouth = Math.hypot(B8_ENTRANCE_SOUTH_OUTSIDE[0] - px, B8_ENTRANCE_SOUTH_OUTSIDE[1] - pz);
      const dNorth = Math.hypot(B8_ENTRANCE_NORTH_OUTSIDE[0] - px, B8_ENTRANCE_NORTH_OUTSIDE[1] - pz);
      const ent = dSouth <= dNorth ? B8_ENTRANCE_SOUTH_OUTSIDE : B8_ENTRANCE_NORTH_OUTSIDE;
      resetRoute('target', false, 3.0);
      pushPoint(px, pz);
      pushPoint(ent[0], ent[1]);
      return scratchRoute.count >= 2 ? scratchRoute : null;
    }

    if (interior.buildingId.toLowerCase() !== spec.buildingId) {
      pushExitRouteFromCurrentBuilding(interior.buildingId, interior.floor, px, pz);
      return scratchRoute.count >= 2 ? scratchRoute : null;
    }

    if (interior.floor !== spec.floor) {
      resetRoute('transit', false, 1.8);
      pushPoint(px, pz);
      pushB8CorridorPoints(px, pz, B8_ELEVATOR_SPAWN_LOCAL[0], B8_ELEVATOR_SPAWN_LOCAL[1]);
      return scratchRoute.count >= 2 ? scratchRoute : null;
    }

    // Đúng tòa B8 & đúng tầng -> dẫn dọc hành lang rẽ vào cửa phòng -> tới mốc sáng
    resetRoute('target', false, 1.6);
    pushPoint(px, pz);
    pushB8CorridorPoints(px, pz, spec.beaconUv[0], spec.beaconUv[1], spec.floor, spec.roomCode);
    return scratchRoute.count >= 2 ? scratchRoute : null;
  }

  // 4. Điểm ghim bản đồ Explore (useExploreStore.navTarget)
  const es = useExploreStore.getState();
  if (es.navTarget) {
    if (interior) {
      pushExitRouteFromCurrentBuilding(interior.buildingId, interior.floor, px, pz);
      return scratchRoute.count >= 2 ? scratchRoute : null;
    }
    resetRoute('target', true, 4.5);
    pushPoint(px, pz);
    pushPoint(es.navTarget.pos[0], es.navTarget.pos[1]);
    return scratchRoute.count >= 2 ? scratchRoute : null;
  }

  return null;
}
