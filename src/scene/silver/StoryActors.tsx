import { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Vector3, type Group } from 'three';
import CharacterModel, { type CharacterHandle } from '../characters/CharacterModel';
import { turnToward } from '../npc/lod';
import { toWorld, yawOf } from './frame';
import { characterConfig } from '../../data';
import type { Classroom } from '../../types';
import type { SpeakerId } from '../../types/silver';
import type { ClassSignal, StageActor, StageSpec } from '../../types/silverWorld';

const SPEAKER_NAMES: Partial<Record<SpeakerId, string>> = {
  han: 'Han',
  quyen: 'Quyền',
  thanh: 'Thành',
  teacher: 'Thầy Nam',
  examiner: 'Giám khảo',
  guide: 'Hướng dẫn viên',
  player: 'Bạn',
};

export interface StoryActorsProps {
  room: Classroom;
  stage: StageSpec;
  getSignal: () => ClassSignal;
  subscribe: (listener: () => void) => () => void;
  sitYOffset?: number;
}

interface ActorInstanceProps {
  actor: StageActor;
  room: Classroom;
  stage: StageSpec;
  getSignal: () => ClassSignal;
  sitYOffset: number;
}

function ActorInstance({ actor, room, stage, getSignal, sitYOffset }: ActorInstanceProps) {
  const group = useRef<Group>(null);
  const handle = useRef<CharacterHandle>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  // Tính tọa độ, hướng quay mặc định và hướng nhìn về người chơi
  const poseInfo = useMemo(() => {
    if (actor.pose === 'sit' || actor.seatId) {
      const seat = room.seats.find((s) => s.id === actor.seatId)
        ?? (actor.speaker === 'han' ? room.seats.find((s) => s.id === room.companionSeat) : undefined);
      if (!seat) return null;

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
        labelY: 1.05, // Sát đỉnh đầu khi ngồi (chiều cao đầu ngồi ~ 0.95 - 1.0 m)
      };
    }

    // Đứng tại spot
    const spot = actor.spot ?? stage.arrival;
    const defYaw = Math.atan2(spot.facing[0], spot.facing[1]);
    const target = stage.target;
    const pYaw = Math.atan2(target.x - spot.x, target.z - spot.z);

    return {
      pos: [spot.x, 0, spot.z] as const,
      worldVec: new Vector3(spot.x, 0, spot.z),
      defaultYaw: defYaw,
      playerYaw: pYaw,
      clip: 'idle' as const,
      labelY: 1.80, // Sát đỉnh đầu khi đứng (chiều cao nhân vật ~ 1.7 m)
    };
  }, [actor, room, stage, sitYOffset]);

  // Bộ nhớ trạng thái mô phỏng hoạt cảnh và cử chỉ
  const lastSceneIdRef = useRef<string>(stage.sceneId);
  const initialResultId = useRef<number>(getSignal().result?.id ?? -1);
  const seenResultIdRef = useRef<number>(initialResultId.current);
  const hasRaisedHandRef = useRef<boolean>(false);
  const isRaisingRef = useRef<boolean>(false);
  const raiseStartRef = useRef<number>(-1);
  const nextTypingRef = useRef<number>(8 + Math.random() * 5);
  const currentYawRef = useRef<number>(poseInfo?.defaultYaw ?? 0);

  // Reset cử chỉ giơ tay khi đổi sceneId (vd lab-1 -> lab-2 mà không unmount)
  if (lastSceneIdRef.current !== stage.sceneId) {
    lastSceneIdRef.current = stage.sceneId;
    hasRaisedHandRef.current = false;
    isRaisingRef.current = false;
    raiseStartRef.current = -1;
    seenResultIdRef.current = getSignal().result?.id ?? -1;
  }

  const isTalkTarget = Boolean(stage.trigger === 'talk');
  const actorName = SPEAKER_NAMES[actor.speaker] ?? actor.speaker;

  useFrame((state, delta) => {
    const g = group.current;
    if (!g || !poseInfo) return;

    const dt = Math.min(delta, 0.1);
    const now = state.clock.elapsedTime;
    const signal = getSignal();

    // Cử chỉ riêng cho Han: giơ tay một lần khi cảnh bắt đầu, phản ứng yes khi đúng bài tập
    if (actor.speaker === 'han') {
      // 1. Giơ tay 1 lần ở đầu cảnh
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

      // 2. Phản ứng hoan hô (yes) khi bài tập code đúng (chỉ phản ứng với result mới phát sinh sau khi vào cảnh)
      if (signal.result && signal.result.id !== seenResultIdRef.current) {
        seenResultIdRef.current = signal.result.id;
        if (signal.result.correct && signal.mode === 'exercise') {
          handle.current?.playUpper('yes');
          nextTypingRef.current = now + 4;
        }
      }

      // 3. Thi thoảng gõ phím khi đang ngồi trong lớp
      if (poseInfo.clip === 'sit' && !isRaisingRef.current && signal.mode !== 'end' && now >= nextTypingRef.current) {
        nextTypingRef.current = now + 8 + Math.random() * 8;
        handle.current?.playUpper('interact');
      }
    }

    // Quay mặt về phía người chơi khi đang nói chuyện (signal.speaker trùng với mình)
    const isSpeaking = signal.speaker === actor.speaker;
    const targetYaw = isSpeaking ? poseInfo.playerYaw : poseInfo.defaultYaw;
    currentYawRef.current = turnToward(currentYawRef.current, targetYaw, Math.min(1, dt * 8));
    g.rotation.y = currentYawRef.current;

    // Cập nhật ẩn/hiện nhãn tên theo khoảng cách camera <= 6.0 m
    if (labelRef.current) {
      const dist = state.camera.position.distanceTo(poseInfo.worldVec);
      labelRef.current.style.display = dist <= 6.0 ? 'flex' : 'none';
    }
  });

  if (!poseInfo) return null;

  const roleCandidate = actor.speaker in characterConfig.roles
    ? characterConfig.roles[actor.speaker as keyof typeof characterConfig.roles]
    : undefined;
  const roleUrl = typeof roleCandidate === 'string' ? roleCandidate : undefined;

  const modelUrl = characterConfig.story?.[actor.speaker]
    ?? roleUrl
    ?? characterConfig.roles.player;

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
 * - Dựng tất cả diễn viên trong stage.actors (ngoại trừ teacher do component Teacher đảm nhiệm).
 * - Tự động định vị theo seatId (ngồi) hoặc spot (đứng).
 * - Quay mặt về người chơi khi signal.speaker là mình.
 * - Cử chỉ đặc thù của Han: giơ tay một lần khi bắt đầu cảnh, yes khi bài tập code đúng.
 * - Nhãn tên gắn sát đỉnh đầu (<Html>), tự ẩn khi xa > 6 m, hiện huy hiệu "!" khi là đối tượng talk.
 */
export default function StoryActors({
  room,
  stage,
  getSignal,
  sitYOffset = 0.4,
}: StoryActorsProps) {
  // Lọc bỏ teacher vì teacher do component Teacher riêng đảm nhiệm
  const nonTeacherActors = useMemo(() => {
    return stage.actors.filter((a) => a.speaker !== 'teacher');
  }, [stage.actors]);

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
        />
      ))}
    </>
  );
}
