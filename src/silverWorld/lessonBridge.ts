import { getClassroom, getLesson } from '../data';
import { useActivityStore } from '../store/useActivityStore';
import { useLessonStore } from '../store/useLessonStore';
import { useWalkStore } from '../store/useWalkStore';
import type { Vec2 } from '../types';
import type { Activity, WorldSpot } from '../types/silverWorld';

type ToWorld = (u: number, v: number) => Vec2;

function direction(from: Vec2, to: Vec2): Vec2 {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const length = Math.hypot(dx, dz);
  return length ? [dx / length, dz / length] : [0, 0];
}

function lessonActivity(id: string, room: NonNullable<ReturnType<typeof getClassroom>>, toWorld: ToWorld): Activity | undefined {
  const seat = room.seats.find(({ id }) => id === room.playerSeat);
  if (!seat) return;

  const spot = ([x, z]: Vec2, facing: Vec2): WorldSpot => (
    { buildingId: room.buildingId, floor: room.floor, x, z, facing }
  );
  const cameraPoint = (u: number, v: number, y: number): [number, number, number] => {
    const [x, z] = toWorld(u, v);
    return [x, y, z];
  };
  const [du, dv] = room.studentFacing;
  const seatPosition = toWorld(seat.u, seat.v);
  const facing = direction(seatPosition, toWorld(seat.u + du, seat.v + dv));
  const seatSpot = spot(seatPosition, facing);
  const arrival = toWorld(room.arrival.u, room.arrival.v);
  const door = toWorld(room.door.u, room.door.v);

  // Giữ các góc nhìn và điểm đứng ở lối đi của buổi nmlt-01.
  return {
    key: `lesson:${id}`,
    source: 'lesson',
    trigger: 'sit',
    arrival: spot(arrival, direction(arrival, door)),
    target: seatSpot,
    prompt: { vi: 'Ngồi (E)', en: 'Sit (E)' },
    seat: {
      id: seat.id,
      spot: seatSpot,
      stand: spot(toWorld(seat.u + dv, seat.v - du), facing),
      camera: {
        eye: cameraPoint(seat.u - 0.65 * du - 0.15 * dv, seat.v - 0.65 * dv + 0.15 * du, 1.55),
        look: cameraPoint(room.projectorScreen.u - 0.05 * du, room.projectorScreen.v - 0.05 * dv, 1.35),
      },
      screenCamera: {
        eye: cameraPoint(seat.u + 0.20 * du, seat.v + 0.20 * dv, 1.08),
        look: cameraPoint(seat.u + 0.65 * du, seat.v + 0.65 * dv, 1.05),
      },
    },
  };
}

export function startLessonBridge(toWorld: ToWorld): () => void {
  let inClassroom: ((x: number, z: number) => boolean) | undefined;
  const beginLesson = (id: string) => {
    const lesson = getLesson(id);
    const room = lesson && getClassroom(lesson.roomCode);
    const activity = room && lessonActivity(id, room, toWorld);
    if (!room || !activity) return;

    const { minU, maxU, minV, maxV } = room.bounds;
    const [x0, z0] = toWorld(minU, minV);
    const [xU, zU] = toWorld(maxU, minV);
    const [xV, zV] = toWorld(minU, maxV);
    const ux = xU - x0;
    const uz = zU - z0;
    const vx = xV - x0;
    const vz = zV - z0;
    const area = ux * vz - uz * vx;
    inClassroom = (x, z) => {
      const dx = x - x0;
      const dz = z - z0;
      const u = (dx * vz - dz * vx) / area;
      const v = (ux * dz - uz * dx) / area;
      return u >= 0 && u <= 1 && v >= 0 && v <= 1;
    };
    useActivityStore.getState().begin(activity, { teleportTo: 'arrival', keepSeated: false });
  };

  const stopLesson = useLessonStore.subscribe((lesson, prev) => {
    const state = useActivityStore.getState();
    if (lesson.phase === 'idle') {
      inClassroom = undefined;
      if (state.activity?.source === 'lesson') state.end();
      return;
    }
    if (lesson.phase === 'goToClass' && lesson.lessonId && (
      prev.phase !== 'goToClass' || lesson.lessonId !== prev.lessonId || lesson.startedAt !== prev.startedAt
    )) {
      beginLesson(lesson.lessonId);
      return;
    }
    if (state.activity?.key !== `lesson:${lesson.lessonId}`) return;

    if (lesson.seatId !== prev.seatId) {
      if (lesson.seatId && !state.seated && state.inRange) {
        state.interact();
      } else if (!lesson.seatId && state.seated) {
        state.standUp();
      }
    }
    if (lesson.desktopOpen !== prev.desktopOpen) state.setScreenOpen(lesson.desktopOpen);
  });

  // Vào phòng đổi hướng dẫn; tầm ghế do WalkMode đo riêng.
  const stopWalk = useWalkStore.subscribe(({ playerPos, interior }, prev) => {
    if (playerPos === prev.playerPos || !interior || !inClassroom) return;
    const lesson = useLessonStore.getState();
    if (lesson.phase !== 'goToClass') return;
    const activity = useActivityStore.getState().activity;
    if (activity?.key !== `lesson:${lesson.lessonId}` || activity.target.buildingId !== interior.buildingId
      || activity.target.floor !== interior.floor || playerPos.floor !== interior.floor) return;
    if (inClassroom(playerPos.x, playerPos.z)) lesson.arriveAtClass();
  });

  const stopActivity = useActivityStore.subscribe((state, prev) => {
    const lesson = useLessonStore.getState();
    const activity = state.activity;
    if (!activity || activity.source !== 'lesson' || activity.key !== `lesson:${lesson.lessonId}`) return;

    if (state.phase === 'near' && prev.phase === 'travel' && !lesson.seatId) lesson.arriveAtClass();
    if (state.seated !== prev.seated) {
      if (state.seated && activity.seat && !lesson.seatId) lesson.sitDown(activity.seat.id);
      else if (!state.seated && lesson.seatId) lesson.standUp();
    }
    if (state.screenOpen !== prev.screenOpen && state.screenOpen !== useLessonStore.getState().desktopOpen) {
      if (state.screenOpen) lesson.openDesktop();
      else lesson.closeDesktop();
    }
  });

  const lesson = useLessonStore.getState();
  if (lesson.phase === 'goToClass' && lesson.lessonId
    && useActivityStore.getState().activity?.key !== `lesson:${lesson.lessonId}`) beginLesson(lesson.lessonId);

  return () => {
    stopLesson();
    stopActivity();
    stopWalk();
  };
}
