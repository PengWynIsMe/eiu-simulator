import { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import CharacterModel, { type CharacterHandle } from '../characters/CharacterModel';
import { turnToward } from '../npc/lod';
import { toWorld, yawOf } from '../silver/frame';
import { characterConfig } from '../../data';
import type { Classroom } from '../../types';
import type { ClassSignal } from '../../types/silverWorld';
import type { CharacterClip } from '../../types';

const WALK_SPEED = 1.2; // m/s, ứng timeScale 1 của clip walk
const ARRIVE_EPS = 0.05;
const TURN_RATE = 6;
const DETOUR_DISTANCE = 0.7; // m, khoảng cách vòng phía sau bàn giáo viên

export interface TeacherProps {
  room: Classroom;
  getSignal: () => ClassSignal;
  subscribe: (listener: () => void) => () => void;
  crowd?: number;
}

/**
 * Kiểm tra đoạn thẳng từ (u1, v1) tới (u2, v2) có cắt hình chữ nhật [minU, maxU] x [minV, maxV] không (thuật toán Liang-Barsky).
 */
export function segmentIntersectsBox(
  u1: number,
  v1: number,
  u2: number,
  v2: number,
  minU: number,
  maxU: number,
  minV: number,
  maxV: number,
): boolean {
  if (u1 >= minU && u1 <= maxU && v1 >= minV && v1 <= maxV) return true;
  if (u2 >= minU && u2 <= maxU && v2 >= minV && v2 <= maxV) return true;

  const du = u2 - u1;
  const dv = v2 - v1;
  let t0 = 0;
  let t1 = 1;

  const p = [-du, du, -dv, dv];
  const q = [u1 - minU, maxU - u1, v1 - minV, maxV - v1];

  for (let i = 0; i < 4; i++) {
    const pi = p[i] ?? 0;
    const qi = q[i] ?? 0;
    if (pi === 0) {
      if (qi < 0) return false;
    } else {
      const t = qi / pi;
      if (pi < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return t0 <= t1;
}

/**
 * Tính toán tuyến đi của thầy giữa bàn giáo viên và vị trí giảng.
 * Nếu đoạn thẳng cắt bàn GV, đi vòng phía sau cách bàn 0.7 m.
 */
export function computeTeacherPlan(room: Classroom) {
  const { lecture, desk } = room.teacherSpots;
  const tDesk = room.teacherDesk;
  const frame = room.frame;

  const lectureW = toWorld(frame, lecture.u, lecture.v);
  const deskW = toWorld(frame, desk.u, desk.v);
  const seat = room.seats.find((s) => s.id === room.playerSeat);
  const seatW = seat ? toWorld(frame, seat.u, seat.v) : lectureW;

  // Hướng thầy nhìn lớp học khi đứng giảng: ngược hướng studentFacing
  const frontYaw = yawOf(frame, -room.studentFacing[0], -room.studentFacing[1]);

  // Kích thước bàn giáo viên theo hướng facing
  const facing = tDesk.facing;
  const alongU = Math.abs(facing[0]) >= Math.abs(facing[1]);
  const halfDepth = tDesk.depth / 2;
  const halfWidth = tDesk.width / 2;

  const minU = tDesk.u - (alongU ? halfDepth : halfWidth);
  const maxU = tDesk.u + (alongU ? halfDepth : halfWidth);
  const minV = tDesk.v - (alongU ? halfWidth : halfDepth);
  const maxV = tDesk.v + (alongU ? halfWidth : halfDepth);

  const intersects = segmentIntersectsBox(desk.u, desk.v, lecture.u, lecture.v, minU, maxU, minV, maxV);

  let toLecture: [number, number][];
  let toDesk: [number, number][];

  if (intersects) {
    if (alongU) {
      // Bàn xoay mặt theo trục u: phía sau bàn ở hướng -facing[0]
      const detourU = tDesk.u - facing[0] * DETOUR_DISTANCE;
      toLecture = [
        toWorld(frame, detourU, desk.v),
        toWorld(frame, detourU, lecture.v),
        lectureW,
      ];
      toDesk = [
        toWorld(frame, detourU, lecture.v),
        toWorld(frame, detourU, desk.v),
        deskW,
      ];
    } else {
      // Bàn xoay mặt theo trục v: phía sau bàn ở hướng -facing[1]
      const detourV = tDesk.v - facing[1] * DETOUR_DISTANCE;
      toLecture = [
        toWorld(frame, desk.u, detourV),
        toWorld(frame, lecture.u, detourV),
        lectureW,
      ];
      toDesk = [
        toWorld(frame, lecture.u, detourV),
        toWorld(frame, desk.u, detourV),
        deskW,
      ];
    }
  } else {
    toLecture = [lectureW];
    toDesk = [deskW];
  }

  return {
    lectureW,
    deskW,
    toLecture,
    toDesk,
    seatW,
    frontYaw,
  };
}

function TeacherBody({ room, getSignal }: TeacherProps) {
  const group = useRef<Group>(null);
  const handle = useRef<CharacterHandle>(null);

  const plan = useMemo(() => computeTeacherPlan(room), [room]);

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
      stepKey: '',
      resultId: -1,
      pending: null as CharacterClip | null,
    }),
    [],
  );

  useFrame((_, delta) => {
    const g = group.current;
    const h = handle.current;
    if (!g || !plan) return;
    const dt = Math.min(delta, 0.1);
    const signal = getSignal();

    if (!sim.init) {
      sim.init = true;
      sim.x = plan.deskW[0];
      sim.z = plan.deskW[1];
      sim.yaw = plan.frontYaw;
    }

    // Chưa vào buổi học (idle): đứng chỗ bàn; vào học: đứng chỗ giảng cạnh màn chiếu
    const inLesson = signal.mode !== 'idle';
    if (inLesson !== sim.atLecture) {
      sim.atLecture = inLesson;
      sim.route = inLesson ? plan.toLecture : plan.toDesk;
      sim.wp = 0;
    }

    // Phản ứng theo mode / stepKey / result
    const isExam = signal.stepKey.toLowerCase().includes('exam');
    if (signal.stepKey !== sim.stepKey) {
      sim.stepKey = signal.stepKey;
      sim.resultId = signal.result ? signal.result.id : -1;
      if (signal.mode === 'talk' || signal.mode === 'end' || signal.mode === 'slide') {
        sim.pending = 'interact';
      }
    } else if (signal.result && signal.result.id !== sim.resultId) {
      sim.resultId = signal.result.id;
      // Chế độ exam: thầy không gật/lắc đến khi nộp (signal.mode === 'end')
      if (!isExam && (signal.mode === 'question' || signal.mode === 'exercise')) {
        sim.pending = signal.result.correct ? 'yes' : 'no';
      }
    }

    // Đi theo tuyến nếu chưa tới điểm đến
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
      const toPlayer = signal.mode === 'talk' || signal.mode === 'end';
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

  return (
    <group ref={group} position={[plan.deskW[0], 0, plan.deskW[1]]} rotation={[0, plan.frontYaw, 0]}>
      <CharacterModel ref={handle} url={characterConfig.roles.teacher} clip="idle" />
    </group>
  );
}

/**
 * Thầy giảng dùng chung cho các phòng học (406.B11, 406.B8...).
 * Nhận room, getSignal, subscribe, crowd; không import useLessonStore.
 * Điều kiện mount do nơi gọi quản lý.
 */
export default function Teacher({ room, getSignal, subscribe, crowd }: TeacherProps) {
  return (
    <Suspense fallback={null}>
      <TeacherBody room={room} getSignal={getSignal} subscribe={subscribe} crowd={crowd} />
    </Suspense>
  );
}
