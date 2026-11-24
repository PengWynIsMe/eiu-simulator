import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Vector3, type Group } from 'three';
import CharacterModel, { type CharacterHandle } from '../characters/CharacterModel';
import { turnToward } from '../npc/lod';
import { toWorld, yawOf } from './frame';
import { characterConfig } from '../../data';
import { useLangStore } from '../../store/useLangStore';
import { useSilverStore } from '../../store/useSilverStore';
import type { Classroom } from '../../types';
import type { ClassSignal, StageActor, StageSpec } from '../../types/silverWorld';
import { departureManager, shouldTriggerDeparture, useDepartureSessionKey } from './departureState';

const SPEAKER_NAMES: Record<string, { vi: string; en: string }> = {
  han: { vi: 'Han', en: 'Han' },
  quyen: { vi: 'Quyền', en: 'Quyen' },
  thanh: { vi: 'Thành', en: 'Thanh' },
  examiner: { vi: 'Giám khảo', en: 'Examiner' },
  guide: { vi: 'Hướng dẫn viên', en: 'Guide' },
};

export interface StoryActorsProps {
  room?: Classroom | null;
  stage: StageSpec;
  getSignal: () => ClassSignal;
  subscribe: (listener: () => void) => () => void;
  sitYOffset?: number;
}

interface ActorInstanceProps {
  actor: StageActor;
  room?: Classroom | null;
  stage: StageSpec;
  getSignal: () => ClassSignal;
  sitYOffset: number;
  isTalkTarget: boolean;
}

function getDepartureConfig(sceneId: string, speaker: string): {
  key: string;
  dir: [number, number];
  maxDist: number;
  speed: number;
} | null {
  if (sceneId === 'entrance/meet-thanh' && speaker === 'thanh') {
    // Thành đi vào cửa Nam B8: từ (17.91, -164.85) tới cửa (14.49, -170.72)
    // Hướng: dx = 14.49 - 17.91 = -3.42, dz = -170.72 - -164.85 = -5.87
    const len = Math.hypot(-3.42, -5.87);
    return {
      key: `${sceneId}:${speaker}`,
      dir: [-3.42 / len, -5.87 / len],
      maxDist: 2.0,
      speed: 1.4,
    };
  }
  if (sceneId === '1.1/after' && speaker === 'quyen') {
    // Quyền đi ngang 8m ở hành lang tầng 2 B8 (dọc trục hành lang hướng Tây / thang máy)
    return {
      key: `${sceneId}:${speaker}`,
      dir: [-0.97398, 0.22663], // Vector chuẩn hóa dọc hành lang B8
      maxDist: 8.0,
      speed: 1.5,
    };
  }
  if (sceneId === '2.2/opening' && speaker === 'quyen') {
    // Quyền đi về thang máy sau 2.2/opening (đi thẳng 4 m rồi ẩn)
    return {
      key: `${sceneId}:${speaker}`,
      dir: [-0.22663, -0.97398], // Hướng Bắc dọc trục hành lang B8 về phía thang máy
      maxDist: 4.0,
      speed: 1.4,
    };
  }
  return null;
}

function ActorInstance({ actor, room, stage, getSignal, sitYOffset, isTalkTarget }: ActorInstanceProps) {
  const group = useRef<Group>(null);
  const handle = useRef<CharacterHandle>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const lang = useLangStore((s) => s.lang);

  const departConfig = useMemo(() => {
    return getDepartureConfig(stage.sceneId, actor.speaker);
  }, [stage.sceneId, actor.speaker]);

  const sessionKey = useDepartureSessionKey();

  // Nếu diễn viên này đã hoàn thành rời đi ở lượt chơi này, không render lại
  const alreadyDeparted = departConfig ? departureManager.isCompleted(sessionKey, departConfig.key) : false;

  // Tính tọa độ, hướng quay mặc định và hướng nhìn về người chơi
  const poseInfo = useMemo(() => {
    // 1. Ngồi trong phòng học có seatId
    if (actor.seatId && room) {
      const seat = room.seats.find((s) => s.id === actor.seatId);
      if (!seat) {
        console.warn(`[StoryActors] Ghế ${actor.seatId} không tìm thấy trong phòng ${room.code}`);
        return null;
      }

      const [sx, sz] = toWorld(room.frame, seat.u, seat.v);
      const playerSeat = room.seats.find((s) => s.id === room.playerSeat);
      const [px, pz] = playerSeat ? toWorld(room.frame, playerSeat.u, playerSeat.v) : [sx, sz];

      const defYaw = yawOf(room.frame, room.studentFacing[0], room.studentFacing[1]);
      const pYaw = Math.atan2(px - sx, pz - sz);

      return {
        pos: [sx, sitYOffset, sz] as const,
        worldVec: new Vector3(sx, sitYOffset, sz),
        defaultYaw: defYaw,
        playerYaw: pYaw,
        clip: 'sit' as const,
        labelY: 1.05,
      };
    }

    // 2. Ngồi tại spot (ví dụ giám khảo phòng 208.B8: spot + pose 'sit')
    if (actor.spot && actor.pose === 'sit') {
      const spot = actor.spot;
      const defYaw = Math.atan2(spot.facing[0], spot.facing[1]);
      const target = stage.target;
      const pYaw = Math.atan2(target.x - spot.x, target.z - spot.z);

      return {
        pos: [spot.x, sitYOffset, spot.z] as const,
        worldVec: new Vector3(spot.x, sitYOffset, spot.z),
        defaultYaw: defYaw,
        playerYaw: pYaw,
        clip: 'sit' as const,
        labelY: 1.05,
      };
    }

    // 3. Đứng tại spot (mặc định idle)
    if (actor.spot) {
      const spot = actor.spot;
      const defYaw = Math.atan2(spot.facing[0], spot.facing[1]);
      const target = stage.target;
      const pYaw = Math.atan2(target.x - spot.x, target.z - spot.z);

      return {
        pos: [spot.x, 0, spot.z] as const,
        worldVec: new Vector3(spot.x, 0, spot.z),
        defaultYaw: defYaw,
        playerYaw: pYaw,
        clip: 'idle' as const,
        labelY: 1.80,
      };
    }

    return null;
  }, [actor, room, stage, sitYOffset]);

  // Bộ nhớ trạng thái hoạt cảnh cho Han
  const initialResultId = useRef<number>(getSignal().result?.id ?? -1);
  const seenResultIdRef = useRef<number>(initialResultId.current);
  const hasRaisedHandRef = useRef<boolean>(false);
  const isRaisingRef = useRef<boolean>(false);
  const raiseStartRef = useRef<number>(-1);
  const nextTypingRef = useRef<number>(8 + Math.random() * 5);
  const currentYawRef = useRef<number>(poseInfo?.defaultYaw ?? 0);

  // Bộ nhớ trạng thái rời đi (departure)
  const isDepartingRef = useRef<boolean>(false);
  const departStartRef = useRef<number>(-1);
  const isFinishedDepartRef = useRef<boolean>(alreadyDeparted);
  const stepTimeRef = useRef<{ stepIndex: number; shownAt: number }>({ stepIndex: -1, shownAt: 0 });

  // Reset vị trí và hiển thị ban đầu khi poseInfo hoặc session thay đổi
  useEffect(() => {
    const g = group.current;
    if (g && poseInfo && !alreadyDeparted) {
      g.position.set(poseInfo.pos[0], poseInfo.pos[1], poseInfo.pos[2]);
      g.rotation.y = poseInfo.defaultYaw;
      g.visible = true;
      if (labelRef.current) {
        labelRef.current.style.display = 'block';
      }
      isDepartingRef.current = false;
      departStartRef.current = -1;
      isFinishedDepartRef.current = false;
    }
    return () => {
      // Khi unmount đưa vị trí về đúng chỗ
      if (g && poseInfo) {
        g.position.set(poseInfo.pos[0], poseInfo.pos[1], poseInfo.pos[2]);
        g.rotation.y = poseInfo.defaultYaw;
      }
    };
  }, [poseInfo, alreadyDeparted, sessionKey]);

  const nameConfig = SPEAKER_NAMES[actor.speaker];
  const actorName = nameConfig ? nameConfig[lang] : actor.speaker;

  useFrame((state, delta) => {
    const g = group.current;
    if (!g || !poseInfo || isFinishedDepartRef.current) return;

    const dt = Math.min(delta, 0.1);
    const now = state.clock.elapsedTime;
    const signal = getSignal();

    const playState = useSilverStore.getState().play;
    const currentStepIndex = playState?.stepIndex ?? -1;
    if (stepTimeRef.current.stepIndex !== currentStepIndex) {
      stepTimeRef.current = { stepIndex: currentStepIndex, shownAt: now };
    }
    const stepElapsed = now - stepTimeRef.current.shownAt;

    // 1. Kiểm tra kích hoạt rời đi (Thành vào cửa Nam, Quyền đi ngang)
    if (departConfig && !isDepartingRef.current) {
      const trigger = shouldTriggerDeparture({
        signalMode: signal.mode,
        signalSpeaker: signal.speaker,
        actorSpeaker: actor.speaker,
        stepIndex: playState?.stepIndex ?? 0,
        stepCount: playState?.stepCount ?? 0,
        currentStepSpeaker: (playState?.step && 'speaker' in playState.step) ? (playState.step as { speaker?: string }).speaker ?? null : null,
        stepElapsedSeconds: stepElapsed,
      });

      if (trigger) {
        isDepartingRef.current = true;
        departStartRef.current = now;
        handle.current?.play('walk');
        // Quay mặt theo hướng đi
        const walkYaw = Math.atan2(departConfig.dir[0], departConfig.dir[1]);
        currentYawRef.current = walkYaw;
        g.rotation.y = walkYaw;
        if (labelRef.current) {
          labelRef.current.style.display = 'none';
        }
      }
    }

    // 2. Thực hiện di chuyển rời đi
    if (departConfig && isDepartingRef.current) {
      const elapsed = now - departStartRef.current;
      const traveled = elapsed * departConfig.speed;

      if (traveled >= departConfig.maxDist) {
        // Hoàn thành rời đi: ẩn và lưu trạng thái vào session
        isFinishedDepartRef.current = true;
        departureManager.markCompleted(sessionKey, departConfig.key);
        g.visible = false;
        return;
      }

      g.position.x = poseInfo.pos[0] + departConfig.dir[0] * traveled;
      g.position.z = poseInfo.pos[2] + departConfig.dir[1] * traveled;
      return;
    }

    // 3. Phản ứng kết quả / lựa chọn
    const isExam = stage.sceneId.toLowerCase().includes('exam') || signal.stepKey.toLowerCase().includes('exam');
    if (signal.result && signal.result.id !== seenResultIdRef.current) {
      seenResultIdRef.current = signal.result.id;
      // 1-on-1 choice: người đối diện gật đầu khi người chơi chọn
      if (signal.mode === 'talk' && signal.speaker === actor.speaker) {
        handle.current?.playUpper('yes');
      } else if (actor.speaker === 'han' && !isExam && signal.result.correct && signal.mode === 'exercise') {
        handle.current?.playUpper('yes');
        nextTypingRef.current = now + 4;
      }
    }

    // Cử chỉ riêng cho Han: giơ tay một lần khi cảnh bắt đầu, gõ máy lúc rảnh
    if (actor.speaker === 'han') {
      if (!isExam) {
        if (!hasRaisedHandRef.current) {
          hasRaisedHandRef.current = true;
          isRaisingRef.current = true;
          raiseStartRef.current = now;
          handle.current?.playUpper('raiseHand', { loop: false, timeScale: 0.6 });
        }
        if (isRaisingRef.current && now - raiseStartRef.current > 1.8) {
          isRaisingRef.current = false;
          handle.current?.stopUpper();
        }
      }

      if (poseInfo.clip === 'sit' && !isRaisingRef.current && signal.mode !== 'end' && now >= nextTypingRef.current) {
        nextTypingRef.current = now + 8 + Math.random() * 8;
        handle.current?.playUpper('interact');
      }
    }

    // 4. Quay mặt về phía người chơi khi đang nói chuyện
    const isSpeaking = signal.speaker === actor.speaker;
    const targetYaw = isSpeaking ? poseInfo.playerYaw : poseInfo.defaultYaw;
    currentYawRef.current = turnToward(currentYawRef.current, targetYaw, Math.min(1, dt * 8));
    g.rotation.y = currentYawRef.current;

    // 5. Cập nhật ẩn/hiện nhãn tên theo khoảng cách camera <= 6.0 m
    if (labelRef.current) {
      const dist = state.camera.position.distanceTo(poseInfo.worldVec);
      labelRef.current.style.display = dist <= 6.0 ? 'flex' : 'none';
    }
  });

  if (alreadyDeparted || !poseInfo) return null;

  const roleCandidate = actor.speaker in characterConfig.roles
    ? characterConfig.roles[actor.speaker as keyof typeof characterConfig.roles]
    : undefined;
  const roleUrl = typeof roleCandidate === 'string' ? roleCandidate : undefined;
  const modelUrl = characterConfig.story?.[actor.speaker] ?? roleUrl;

  if (!modelUrl) {
    console.warn(`[StoryActors] Không tìm thấy model cho diễn viên ${actor.speaker}`);
    return null;
  }

  return (
    <group ref={group} position={poseInfo.pos} rotation={[0, poseInfo.defaultYaw, 0]}>
      <Suspense fallback={null}>
        <CharacterModel ref={handle} url={modelUrl} clip={poseInfo.clip} />
      </Suspense>
      <Html position={[0, poseInfo.labelY, 0]} center zIndexRange={[15, 0]}>
        <div
          ref={labelRef}
          style={{ display: 'none' }}
          className="flex-col items-center pointer-events-none select-none transform -translate-y-2"
        >
          {isTalkTarget && (
            <div className="mb-0.5 w-4 h-4 rounded-full bg-amber-400 text-slate-900 font-bold text-[10px] flex items-center justify-center shadow-md animate-bounce">
              !
            </div>
          )}
          <span className="px-2 py-0.5 rounded bg-slate-900/90 text-white font-medium text-xs whitespace-nowrap shadow border border-slate-700/60">
            {actorName}
          </span>
        </div>
      </Html>
    </group>
  );
}

/**
 * Diễn viên cốt truyện theo StageActor của StageSpec:
 * - Hỗ trợ cả phòng học (Classroom) và cảnh ngoài trời / sảnh / hành lang (room null).
 * - Tư thế ngồi (sit) tại ghế (seatId) hoặc tại chỗ (spot) với cùng độ cao sitYOffset.
 * - Tư thế đứng (idle) tại spot với hướng quay từ spot.facing.
 * - Cơ chế rời đi (Thành vào cửa Nam, Quyền đi ngang) kích hoạt theo mốc kết thúc cảnh.
 */
export default function StoryActors({
  room,
  stage,
  getSignal,
  sitYOffset = 0.4,
}: StoryActorsProps) {
  // Lọc bỏ teacher (và examiner đứng lớp không có spot) vì do component Teacher riêng đảm nhiệm
  const nonTeacherActors = useMemo(() => {
    return stage.actors.filter((a) => a.speaker !== 'teacher' && !(a.speaker === 'examiner' && !a.spot && room));
  }, [stage.actors, room]);

  // Tìm diễn viên đứng gần stage.target nhất để gắn dấu "!" khi trigger === 'talk'
  const targetActorSpeaker = useMemo(() => {
    if (stage.trigger !== 'talk') return null;
    let minD2 = Infinity;
    let closest: string | null = null;
    for (const actor of nonTeacherActors) {
      let ax = 0;
      let az = 0;
      if (actor.seatId && room) {
        const seat = room.seats.find((s) => s.id === actor.seatId);
        if (seat) [ax, az] = toWorld(room.frame, seat.u, seat.v);
      } else if (actor.spot) {
        ax = actor.spot.x;
        az = actor.spot.z;
      }
      const d2 = (ax - stage.target.x) ** 2 + (az - stage.target.z) ** 2;
      if (d2 < minD2) {
        minD2 = d2;
        closest = actor.speaker;
      }
    }
    return closest;
  }, [stage, nonTeacherActors, room]);

  return (
    <>
      {nonTeacherActors.map((actor, idx) => (
        <ActorInstance
          key={`${stage.sceneId}:${actor.speaker}:${actor.seatId ?? idx}`}
          actor={actor}
          room={room}
          stage={stage}
          getSignal={getSignal}
          sitYOffset={sitYOffset}
          isTalkTarget={targetActorSpeaker === actor.speaker}
        />
      ))}
    </>
  );
}
