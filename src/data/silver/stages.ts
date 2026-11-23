import raw from './stages.json';
import { getClassroom } from '../phase2';
import type { Classroom } from '../../types/lesson';
import type { SpeakerId } from '../../types/silver';
import type { Pose, StageActor, StageSpec, StageTier, StageTrigger, WorldSpot } from '../../types/silverWorld';
import { arr, fail, loc, num, obj, oneOf, str, vec2 } from '../validate';

const validSpeakers: readonly SpeakerId[] = [
  'player', 'thanh', 'quyen', 'han', 'teacher', 'examiner', 'guide', 'narrator',
];
const validTiers: readonly StageTier[] = ['full', 'light', 'backdrop'];
const validTriggers: readonly StageTrigger[] = ['sit', 'talk', 'look', 'none'];
const validPoses: readonly Pose[] = ['sit', 'idle'];

function parseWorldSpot(v: unknown, path: string): WorldSpot {
  const o = obj(v, path);
  const x = num(o.x, `${path}.x`);
  const z = num(o.z, `${path}.z`);
  const facing = vec2(o.facing, `${path}.facing`);
  if (!Number.isFinite(x) || !Number.isFinite(z)) fail(path, 'tọa độ hữu hạn');
  if (!Number.isFinite(facing[0]) || !Number.isFinite(facing[1])) fail(`${path}.facing`, 'hướng nhìn hữu hạn');

  const buildingId = o.buildingId === null ? null : str(o.buildingId, `${path}.buildingId`);
  const floor = o.floor === null ? null : num(o.floor, `${path}.floor`);
  return { buildingId, floor, x, z, facing };
}

function parseStageActor(v: unknown, path: string): StageActor {
  const o = obj(v, path);
  const speaker = oneOf(o.speaker, validSpeakers, `${path}.speaker`);
  const pose = oneOf(o.pose, validPoses, `${path}.pose`);
  const actor: StageActor = { speaker, pose };
  if (o.seatId !== undefined) {
    actor.seatId = str(o.seatId, `${path}.seatId`);
  }
  if (o.spot !== undefined && o.spot !== null) {
    actor.spot = parseWorldSpot(o.spot, `${path}.spot`);
  }
  return actor;
}

export function parseStages(
  value: unknown,
  getRoom: (code: string) => Classroom | undefined = getClassroom,
): { version: 1; stages: StageSpec[] } {
  const root = obj(value, 'stages');
  if (root.version !== 1) fail('stages.version', '1');

  const list = arr(root.stages, 'stages.stages');
  const seenIds = new Set<string>();

  const stages = list.map((item, index): StageSpec => {
    const p = `stages.stages[${index}]`;
    const s = obj(item, p);
    const sceneId = str(s.sceneId, `${p}.sceneId`);
    if (seenIds.has(sceneId)) fail(p, `sceneId duy nhất (${sceneId})`);
    seenIds.add(sceneId);

    const tier = oneOf(s.tier, validTiers, `${p}.tier`);
    const trigger = oneOf(s.trigger, validTriggers, `${p}.trigger`);
    const place = loc(s.place, `${p}.place`);
    const roomCode = s.roomCode === null ? null : str(s.roomCode, `${p}.roomCode`);

    const arrival = parseWorldSpot(s.arrival, `${p}.arrival`);
    const target = parseWorldSpot(s.target, `${p}.target`);

    const actors = arr(s.actors, `${p}.actors`).map((a, j) => parseStageActor(a, `${p}.actors[${j}]`));
    const crowd = num(s.crowd, `${p}.crowd`);
    if (crowd < 0) fail(`${p}.crowd`, 'số ≥ 0');

    // sit phải có phòng hoặc ghế riêng (208.B8 khai ghế tại seatAnchor)
    if (trigger === 'sit' && roomCode === null) {
      fail(p, 'sit phải có phòng hoặc ghế riêng');
    }

    // seatId có thật: nếu phòng có trong classrooms.json thì kiểm tra ghế tồn tại
    if (roomCode !== null) {
      const room = getRoom(roomCode);
      if (room) {
        for (const actor of actors) {
          if (actor.seatId && !room.seats.some((seat) => seat.id === actor.seatId)) {
            fail(p, `ghế ${actor.seatId} có thật trong phòng ${roomCode}`);
          }
        }
      }
    }

    return {
      sceneId,
      tier,
      trigger,
      place,
      roomCode,
      arrival,
      target,
      actors,
      crowd,
    };
  });

  return { version: 1, stages };
}

const parsed = parseStages(raw, getClassroom);
export const stages: StageSpec[] = parsed.stages;

const stageBySceneId = new Map<string, StageSpec>(stages.map((s) => [s.sceneId, s]));

export function getStage(sceneId: string): StageSpec | undefined {
  return stageBySceneId.get(sceneId);
}

/**
 * Kiểm tra xem stage có khả dụng trong đợt hiện tại hay không.
 * Phòng chưa có trong classrooms.json (đợt 1) và không phải 208.B8 thì coi như vắng.
 */
export function isStageAvailable(
  stageOrSceneId: StageSpec | string,
  getRoom: (code: string) => Classroom | undefined = getClassroom,
): boolean {
  const stage = typeof stageOrSceneId === 'string' ? getStage(stageOrSceneId) : stageOrSceneId;
  if (!stage) return false;
  if (stage.roomCode === null || stage.roomCode === '208.B8') return true;
  return Boolean(getRoom(stage.roomCode));
}
