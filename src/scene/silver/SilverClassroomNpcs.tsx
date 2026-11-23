import { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import CharacterModel, { type CharacterHandle } from '../characters/CharacterModel';
import { characterConfig } from '../../data';
import type { Classroom, CharacterClip } from '../../types';
import type { ClassSignal } from '../../types/silverWorld';
import { buildClassroomPlan, samplePath, type PathSample, type StudentSpec } from '../npc/classroomPlan';
import { turnToward } from '../npc/lod';
import { SIT_Y_OFFSET } from '../npc/sitPose';

const WALK_SPEED = 1.2;
const SUMMARY_STAND_DELAY = 2;
const EXIT_GAP = 0.8;
const EXIT_FIRST_WALK = 0.6;

const TYPING_MIN = 6;
const TYPING_MAX = 14;
const CHEER_TIME = 0.7;
const RAISE_SPEED = 0.5;

const SEATED = 0;
const EXIT_STAND = 3;
const WALK = 4;
const GONE = 5;

function rand01(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface SilverStudentProps {
  spec: StudentSpec;
  url: string;
  getSignal: () => ClassSignal;
  sitYOffset: number;
}

function SilverStudent({ spec, url, getSignal, sitYOffset }: SilverStudentProps) {
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

    if (summary) {
      if (sim.sumStart < 0) sim.sumStart = now;
    } else if (sim.sumStart >= 0) {
      sim.sumStart = -1;
      sim.mode = SEATED;
      g.visible = true;
    }
    if (sim.nextTyping === 0) {
      sim.nextTyping = now + TYPING_MIN + rand01(spec.index + 1) * (TYPING_MAX - TYPING_MIN);
    }

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

export interface SilverClassroomNpcsProps {
  room: Classroom;
  getSignal: () => ClassSignal;
  subscribe?: (listener: () => void) => () => void;
  crowd?: number;
  sitYOffset?: number;
}

/**
 * Bạn học nền trong phòng Silver (406.B8):
 * - Tự động loại bỏ ghế companionSeat (ghế của Han) và playerSeat khỏi danh sách ghế bạn nền.
 * - Lọc bỏ các model nhân vật truyện (Han, Thành, Quyền) khỏi vòng roles.students để không bị trùng lặp.
 * - 406.B11 giữ nguyên bộ roles.students gốc, không bị thay đổi.
 */
export default function SilverClassroomNpcs({
  room,
  getSignal,
  crowd,
  sitYOffset = SIT_Y_OFFSET,
}: SilverClassroomNpcsProps) {
  const effectiveSitY = room.sitYOffset ?? sitYOffset;

  // 1. Loại bỏ companionSeat và playerSeat khỏi npcSeats
  const safeRoom = useMemo(() => {
    const excludedSeats = new Set<string>();
    if (room.playerSeat) excludedSeats.add(room.playerSeat);
    if (room.companionSeat) excludedSeats.add(room.companionSeat);

    const filteredNpcSeats = room.npcSeats.filter((seatId) => !excludedSeats.has(seatId));
    return {
      ...room,
      npcSeats: filteredNpcSeats,
    };
  }, [room]);

  const effectiveCrowd = crowd ?? safeRoom.npcSeats.length;
  const students = useMemo(() => buildClassroomPlan(safeRoom, effectiveCrowd), [safeRoom, effectiveCrowd]);

  // 2. Lọc bỏ các model truyện (thành: male-e, quyên: male-g, han: female-c) phía phòng Silver
  const models = useMemo(() => {
    const rawStudents = characterConfig.roles.students;
    const storyModels = new Set(Object.values(characterConfig.story ?? {}));
    const filtered = rawStudents.filter((url) => !storyModels.has(url));
    return filtered.length > 0 ? filtered : rawStudents;
  }, []);

  return (
    <>
      {students.map((spec) => (
        <Suspense key={spec.seatId} fallback={null}>
          <SilverStudent
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
