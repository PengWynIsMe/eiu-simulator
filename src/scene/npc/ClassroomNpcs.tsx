import { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import CharacterModel, { type CharacterHandle } from '../characters/CharacterModel';
import { characterConfig } from '../../data';
import { useLessonStore, type LessonResult } from '../../store/useLessonStore';
import { useWalkStore } from '../../store/useWalkStore';
import type { CharacterClip } from '../../types';
import { buildClassroomPlan, samplePath, type PathSample, type StudentSpec } from './classroomPlan';
import { turnToward } from './lod';
import { SIT_Y_OFFSET } from './sitPose';

const WALK_SPEED = 1.2; // m/s, ứng timeScale 1 của clip walk (cùng ước lượng với CampusNpcs)
const SUMMARY_STAND_DELAY = 2; // s từ lúc vào summary tới khi cả lớp đứng dậy
const EXIT_GAP = 0.8; // s giữa 2 bạn rời lớp
const EXIT_FIRST_WALK = 0.6; // s đứng yên sau khi đứng dậy trước khi bạn đầu tiên đi
const CHEER_TIME = 1.0; // s (clip emote-yes dài 0.67 s)

/**
 * Các clip cử chỉ của Kenney (interact/yes/raiseHand) là tư thế ĐỨNG, không có bản ngồi. Với `interact` (gõ phím mỗi 6–14 s)
 * 18 bạn sẽ liên tục đứng bật lên ngồi xuống nên mặc định TẮT; bật lại nếu sau này có clip nửa người trên.
 */
const TYPING_GESTURE = false;
const TYPING_MIN = 6;
const TYPING_MAX = 14;
const TYPING_TIME = 0.9;

const SEATED = 0;
const GESTURE = 1;
const RAISED = 2;
const EXIT_STAND = 3;
const WALK = 4;
const GONE = 5;

function rand01(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function Student({ spec, url }: { spec: StudentSpec; url: string }) {
  const group = useRef<Group>(null);
  const handle = useRef<CharacterHandle>(null);
  const sample = useMemo<PathSample>(() => ({ x: 0, z: 0, yaw: 0 }), []);
  const sim = useMemo(
    () => ({
      mode: SEATED as number,
      clip: 'sit' as CharacterClip,
      x: spec.seatX,
      z: spec.seatZ,
      y: SIT_Y_OFFSET,
      yaw: spec.yaw,
      s: 0,
      until: 0,
      nextTyping: 0,
      sumStart: -1,
      seenResult: null as LessonResult | null,
    }),
    [spec],
  );

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.1);
    const now = state.clock.elapsedTime;
    const lesson = useLessonStore.getState();
    const summary = lesson.phase === 'summary';

    const play = (c: CharacterClip) => {
      if (sim.clip === c) return;
      sim.clip = c;
      handle.current?.play(c);
    };

    // Vào / rời pha tổng kết.
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
      if (sim.mode < EXIT_STAND && t >= SUMMARY_STAND_DELAY) sim.mode = EXIT_STAND;
      if (sim.mode === EXIT_STAND && t >= SUMMARY_STAND_DELAY + EXIT_FIRST_WALK + spec.exitRank * EXIT_GAP) {
        sim.mode = WALK;
        sim.s = 0;
      }
    } else {
      // Hoan hô khi vừa làm đúng bài tập.
      if (lesson.lastResult !== sim.seenResult) {
        sim.seenResult = lesson.lastResult;
        if (spec.cheerer && lesson.phase === 'exercise' && lesson.lastResult?.correct && sim.mode === SEATED) {
          sim.mode = GESTURE;
          sim.until = now + CHEER_TIME;
          play('yes');
        }
      }
      // Giơ tay khi có câu hỏi chưa trả lời.
      const raise = spec.raiser && lesson.phase === 'question' && lesson.lastResult === null;
      if (raise && sim.mode === SEATED) {
        sim.mode = RAISED;
        play('raiseHand');
      } else if (!raise && sim.mode === RAISED) {
        sim.mode = SEATED;
      }
      if (TYPING_GESTURE && sim.mode === SEATED && now >= sim.nextTyping) {
        sim.mode = GESTURE;
        sim.until = now + TYPING_TIME;
        sim.nextTyping = now + TYPING_MIN + Math.random() * (TYPING_MAX - TYPING_MIN);
        play('interact');
      }
      if (sim.mode === GESTURE && now >= sim.until) sim.mode = SEATED;
    }

    // Đích của tư thế theo mode.
    let tx = spec.seatX;
    let tz = spec.seatZ;
    let ty = SIT_Y_OFFSET;
    let tyaw = spec.yaw;
    let direct = false;
    if (sim.mode === SEATED) {
      play('sit');
    } else if (sim.mode === GESTURE || sim.mode === RAISED) {
      tx = spec.backX;
      tz = spec.backZ;
      ty = 0;
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
    <group ref={group} position={[spec.seatX, SIT_Y_OFFSET, spec.seatZ]} rotation={[0, spec.yaw, 0]}>
      <CharacterModel ref={handle} url={url} clip="sit" />
    </group>
  );
}

function ClassroomStudents() {
  const students = useMemo(() => buildClassroomPlan(), []);
  const models = characterConfig.roles.students;
  return (
    <>
      {students.map((spec) => (
        <Suspense key={spec.seatId} fallback={null}>
          <Student spec={spec} url={models[spec.index % models.length] ?? characterConfig.roles.player} />
        </Suspense>
      ))}
    </>
  );
}

/**
 * 18 bạn học ngồi trong phòng 406.B11. Chỉ mount (và chạy mixer) khi người chơi ở B11 tầng 4.
 * Trong cảnh nội thất, sàn tầng đang đứng có y = 0 nên toạ độ y của nhân vật tính thẳng từ 0.
 */
export default function ClassroomNpcs() {
  const active = useWalkStore((s) => s.interior?.buildingId.toLowerCase() === 'b11' && s.interior.floor === 4);
  if (!active) return null;
  return <ClassroomStudents />;
}
