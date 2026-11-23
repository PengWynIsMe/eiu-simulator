import { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import CharacterModel, { type CharacterHandle } from '../characters/CharacterModel';
import { characterConfig } from '../../data';
import type { Classroom, CharacterClip } from '../../types';
import type { ClassSignal } from '../../types/silverWorld';
import { buildClassroomPlan, samplePath, type PathSample, type StudentSpec } from './classroomPlan';
import { turnToward } from './lod';
import { SIT_Y_OFFSET } from './sitPose';

const WALK_SPEED = 1.2; // m/s, ứng timeScale 1 của clip walk (cùng ước lượng với CampusNpcs)
const SUMMARY_STAND_DELAY = 2; // s từ lúc vào summary tới khi cả lớp đứng dậy
const EXIT_GAP = 0.8; // s giữa 2 bạn rời lớp
const EXIT_FIRST_WALK = 0.6; // s đứng yên sau khi đứng dậy trước khi bạn đầu tiên đi

const TYPING_MIN = 6;
const TYPING_MAX = 14;
const CHEER_TIME = 0.7; // clip emote-yes dài 0.67 s
const RAISE_SPEED = 0.5; // clip pick-up chỉ 0.33 s, làm chậm lại cho giống giơ tay

const SEATED = 0;
const EXIT_STAND = 3;
const WALK = 4;
const GONE = 5;

function rand01(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface StudentProps {
  spec: StudentSpec;
  url: string;
  getSignal: () => ClassSignal;
  sitYOffset: number;
}

function Student({ spec, url, getSignal, sitYOffset }: StudentProps) {
  const group = useRef<Group>(null);
  const handle = useRef<CharacterHandle>(null);
  const sample = useMemo<PathSample>(() => ({ x: 0, z: 0, yaw: 0 }), []);
  const sim = useMemo(
    () => ({
      mode: SEATED as number,
      clip: 'sit' as CharacterClip,
      x: spec.seatX,
      z: spec.seatZ,
      y: sitYOffset,
      yaw: spec.yaw,
      s: 0,
      nextTyping: 0,
      sumStart: -1,
      raising: false,
      seenResultId: -1,
    }),
    [spec, sitYOffset],
  );

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.1);
    const now = state.clock.elapsedTime;
    const signal = getSignal();
    const summary = signal.mode === 'end';

    const play = (c: CharacterClip) => {
      if (sim.clip === c) return;
      sim.clip = c;
      handle.current?.play(c);
    };

    // Vào / rời pha tổng kết
    if (summary) {
      if (sim.sumStart < 0) sim.sumStart = now;
    } else if (sim.sumStart >= 0) {
      sim.sumStart = -1;
      sim.mode = SEATED;
      g.visible = true;
    }
    if (sim.nextTyping === 0) sim.nextTyping = now + TYPING_MIN + rand01(spec.index + 1) * (TYPING_MAX - TYPING_MIN);

    if (summary) {
      const t = now - sim.sumStart;
      if (sim.mode < EXIT_STAND && t >= SUMMARY_STAND_DELAY) {
        sim.mode = EXIT_STAND;
        sim.raising = false;
        handle.current?.stopUpper();
      }
      if (sim.mode === EXIT_STAND && t >= SUMMARY_STAND_DELAY + EXIT_FIRST_WALK + spec.exitRank * EXIT_GAP) {
        sim.mode = WALK;
        sim.s = 0;
      }
    } else {
      // Cử chỉ nửa người trên khi đang ngồi (chân/thân vẫn theo clip `sit`)
      const h = handle.current;
      if (sim.mode === SEATED && h) {
        if (signal.result && signal.result.id !== sim.seenResultId) {
          sim.seenResultId = signal.result.id;
          if (spec.cheerer && signal.mode === 'exercise' && signal.result.correct) {
            h.playUpper('yes');
            sim.nextTyping = now + CHEER_TIME + 1;
          }
        }
        const raise = spec.raiser && signal.mode === 'question' && signal.result === null;
        if (raise) {
          if (!sim.raising) {
            sim.raising = true;
            h.playUpper('raiseHand', { loop: true, timeScale: RAISE_SPEED });
          }
        } else {
          if (sim.raising) {
            sim.raising = false;
            h.stopUpper();
          }
          if (now >= sim.nextTyping) {
            sim.nextTyping = now + TYPING_MIN + Math.random() * (TYPING_MAX - TYPING_MIN);
            h.playUpper('interact');
          }
        }
      }
    }

    // Đích của tư thế theo mode
    let tx = spec.seatX;
    let tz = spec.seatZ;
    let ty = sitYOffset;
    let tyaw = spec.yaw;
    let direct = false;
    if (sim.mode === SEATED) {
      play('sit');
    } else if (sim.mode === EXIT_STAND) {
      play('idle');
      tx = spec.backX;
      tz = spec.backZ;
      ty = 0;
    } else if (sim.mode === WALK) {
      play('walk');
      sim.s += WALK_SPEED * dt;
      samplePath(spec, sim.s, sample);
      tx = sample.x;
      tz = sample.z;
      ty = 0;
      tyaw = sample.yaw;
      direct = true;
      if (sim.s >= spec.total) sim.mode = GONE;
    }

    if (sim.mode === GONE) {
      if (g.visible) g.visible = false;
      return;
    }
    if (!g.visible) g.visible = true;

    const k = Math.min(1, dt * 12);
    if (direct) {
      sim.x = tx;
      sim.z = tz;
    } else {
      sim.x += (tx - sim.x) * k;
      sim.z += (tz - sim.z) * k;
    }
    sim.y += (ty - sim.y) * k;
    sim.yaw = turnToward(sim.yaw, tyaw, Math.min(1, dt * 8));
    g.position.set(sim.x, sim.y, sim.z);
    g.rotation.y = sim.yaw;
  });

  return (
    <group ref={group} position={[spec.seatX, sitYOffset, spec.seatZ]} rotation={[0, spec.yaw, 0]}>
      <CharacterModel ref={handle} url={url} clip="sit" />
    </group>
  );
}

export interface ClassroomNpcsProps {
  room: Classroom;
  getSignal: () => ClassSignal;
  subscribe: (listener: () => void) => () => void;
  crowd?: number;
  sitYOffset?: number;
}

/**
 * Bạn học ngồi trong phòng học (406.B11, 406.B8...).
 * Nhận room, getSignal, subscribe, crowd, sitYOffset (mặc định 0.40).
 * Không import useLessonStore. Điều kiện mount do nơi gọi quản lý.
 */
export default function ClassroomNpcs({
  room,
  getSignal,
  crowd,
  sitYOffset = SIT_Y_OFFSET,
}: ClassroomNpcsProps) {
  const effectiveSitY = room.sitYOffset ?? sitYOffset;
  const effectiveCrowd = crowd ?? room.npcSeats.length;
  const students = useMemo(() => buildClassroomPlan(room, effectiveCrowd), [room, effectiveCrowd]);
  const models = characterConfig.roles.students;

  return (
    <>
      {students.map((spec) => (
        <Suspense key={spec.seatId} fallback={null}>
          <Student
            spec={spec}
            url={models[spec.index % models.length] ?? characterConfig.roles.player}
            getSignal={getSignal}
            sitYOffset={effectiveSitY}
          />
        </Suspense>
      ))}
    </>
  );
}
