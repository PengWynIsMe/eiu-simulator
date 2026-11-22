import { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import CharacterModel, { type CharacterHandle } from '../characters/CharacterModel';
import { turnToward } from '../npc/lod';
import { localDirToYaw } from '../npc/sitPose';
import { b11ToWorld } from '../interior/layouts/b11';
import { characterConfig, getClassroom } from '../../data';
import { useLessonStore, type LessonResult } from '../../store/useLessonStore';
import { useWalkStore } from '../../store/useWalkStore';
import type { CharacterClip } from '../../types';

const WALK_SPEED = 1.2; // m/s, ứng timeScale 1 của clip walk
const ARRIVE_EPS = 0.05;
const TURN_RATE = 6;
// Đường vòng phía tường Tây giữa chỗ bàn và chỗ giảng, tránh đi xuyên bàn GV (u).
const DETOUR_U = 87.95;

function worldPoint(u: number, v: number): [number, number] {
  return b11ToWorld(u, v);
}

function TeacherBody() {
  const room = getClassroom('406.B11');
  const group = useRef<Group>(null);
  const handle = useRef<CharacterHandle>(null);

  const plan = useMemo(() => {
    if (!room) return null;
    const { lecture, desk } = room.teacherSpots;
    const seat = room.seats.find((s) => s.id === room.playerSeat);
    const lectureW = worldPoint(lecture.u, lecture.v);
    const deskW = worldPoint(desk.u, desk.v);
    return {
      lectureW,
      deskW,
      toLecture: [worldPoint(DETOUR_U, desk.v), worldPoint(DETOUR_U, lecture.v), lectureW],
      toDesk: [worldPoint(DETOUR_U, lecture.v), worldPoint(DETOUR_U, desk.v), deskW],
      seatW: seat ? worldPoint(seat.u, seat.v) : lectureW,
      frontYaw: localDirToYaw(1, 0), // mặt về +u (về lớp)
    };
  }, [room]);

  const sim = useMemo(
    () => ({
      init: false,
      x: 0,
      z: 0,
      yaw: 0,
      atLecture: false,
      route: null as [number, number][] | null,
      wp: 0,
      moving: false,
      step: -1,
      phase: '' as string,
      slide: -1,
      result: null as LessonResult | null,
      pending: null as CharacterClip | null,
    }),
    [],
  );

  useFrame((_, delta) => {
    const g = group.current;
    const h = handle.current;
    if (!g || !plan) return;
    const dt = Math.min(delta, 0.1);
    const lesson = useLessonStore.getState();

    if (!sim.init) {
      sim.init = true;
      sim.x = plan.deskW[0];
      sim.z = plan.deskW[1];
      sim.yaw = plan.frontYaw;
    }

    // Chưa vào buổi học: đứng chỗ bàn; vào học: đứng chỗ giảng cạnh màn chiếu.
    const inLesson = lesson.phase !== 'idle' && lesson.phase !== 'goToClass' && lesson.phase !== 'findSeat';
    if (inLesson !== sim.atLecture) {
      sim.atLecture = inLesson;
      sim.route = inLesson ? plan.toLecture : plan.toDesk;
      sim.wp = 0;
    }

    // Phản ứng theo pha / bước / slide / kết quả — hàng đợi 1 phần tử, phát khi thầy đã đứng yên.
    if (lesson.phase !== sim.phase || lesson.stepIndex !== sim.step) {
      sim.phase = lesson.phase;
      sim.step = lesson.stepIndex;
      sim.slide = lesson.slideIndex;
      sim.result = lesson.lastResult;
      if (lesson.phase === 'dialogue' || lesson.phase === 'summary' || lesson.phase === 'lecture') sim.pending = 'interact';
    } else {
      if (lesson.phase === 'lecture' && lesson.slideIndex !== sim.slide) {
        sim.slide = lesson.slideIndex;
        sim.pending = 'interact';
      }
      if (lesson.lastResult !== sim.result) {
        sim.result = lesson.lastResult;
        if (lesson.lastResult && (lesson.phase === 'question' || lesson.phase === 'exercise')) {
          sim.pending = lesson.lastResult.correct ? 'yes' : 'no';
        }
      }
    }

    // Đi theo đường vòng nếu chưa tới điểm đến.
    let tyaw = sim.yaw;
    let walking = false;
    const route = sim.route;
    if (route && sim.wp < route.length) {
      const wp = route[sim.wp];
      if (wp) {
        const dx = wp[0] - sim.x;
        const dz = wp[1] - sim.z;
        const dist = Math.hypot(dx, dz);
        if (dist <= ARRIVE_EPS) {
          sim.x = wp[0];
          sim.z = wp[1];
          sim.wp++;
        } else {
          const stepLen = Math.min(dist, WALK_SPEED * dt);
          sim.x += (dx / dist) * stepLen;
          sim.z += (dz / dist) * stepLen;
          tyaw = Math.atan2(dx, dz);
          walking = true;
        }
      }
    }

    if (walking !== sim.moving) {
      sim.moving = walking;
      h?.play(walking ? 'walk' : 'idle');
    }

    if (!walking) {
      const toPlayer = lesson.phase === 'dialogue' || lesson.phase === 'summary';
      tyaw = toPlayer ? Math.atan2(plan.seatW[0] - sim.x, plan.seatW[1] - sim.z) : plan.frontYaw;
      if (sim.pending && h) {
        h.playOnce(sim.pending);
        sim.pending = null;
      }
    }

    sim.yaw = turnToward(sim.yaw, tyaw, Math.min(1, dt * TURN_RATE));
    g.position.set(sim.x, 0, sim.z);
    g.rotation.y = sim.yaw;
  });

  if (!plan) return null;
  return (
    <group ref={group} position={[plan.deskW[0], 0, plan.deskW[1]]} rotation={[0, plan.frontYaw, 0]}>
      <CharacterModel ref={handle} url={characterConfig.roles.teacher} clip="idle" />
    </group>
  );
}

/** Thầy giảng phòng 406.B11. Chỉ mount (và chạy mixer) khi người chơi ở B11 tầng 4 — tầng khác thì tắt hẳn. */
export default function Teacher() {
  const active = useWalkStore((s) => s.interior?.buildingId.toLowerCase() === 'b11' && s.interior.floor === 4);
  if (!active) return null;
  return (
    <Suspense fallback={null}>
      <TeacherBody />
    </Suspense>
  );
}
