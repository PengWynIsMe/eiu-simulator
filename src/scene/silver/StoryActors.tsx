import { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Group, Vector3 } from 'three';
import CharacterModel, { type CharacterHandle } from '../characters/CharacterModel';
import { turnToward } from '../npc/lod';
import { toWorld, yawOf } from './frame';
import { characterConfig } from '../../data';
import type { Classroom } from '../../types';
import type { ClassSignal, StageSpec } from '../../types/silverWorld';

export interface StoryActorsProps {
  room: Classroom;
  stage?: StageSpec;
  getSignal: () => ClassSignal;
  subscribe: (listener: (signal: ClassSignal) => void) => () => void;
  sitYOffset?: number;
}

interface HanActorProps {
  room: Classroom;
  seatId: string;
  stage?: StageSpec;
  getSignal: () => ClassSignal;
  sitYOffset: number;
}

/**
 * Nhân vật Han: bạn học ngồi cạnh người chơi ở companionSeat (406-r2-s6 trong 406.B8).
 * - Clip chính: `sit`, mông chạm mặt ghế cao 0.45 m (sitYOffset = 0.40).
 * - Quay mặt về người chơi khi đang nói (signal.speaker === 'han'), quay về bảng khi không nói.
 * - playUpper('raiseHand') 1 lần khi cảnh bắt đầu.
 * - playUpper('yes') khi người chơi hoàn thành đúng bài tập code.
 * - Nhãn tên nhỏ (<= 6 m) bằng <Html> của drei, dấu "!" khi là đích talk.
 */
function HanActor({ room, seatId, stage, getSignal, sitYOffset }: HanActorProps) {
  const group = useRef<Group>(null);
  const handle = useRef<CharacterHandle>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  const seat = useMemo(() => {
    return room.seats.find((s) => s.id === seatId) ?? room.seats.find((s) => s.id === room.companionSeat);
  }, [room, seatId]);

  const playerSeat = useMemo(() => {
    return room.seats.find((s) => s.id === room.playerSeat);
  }, [room]);

  const { seatW, defaultYaw, playerYaw } = useMemo(() => {
    const sU = seat?.u ?? 86.48;
    const sV = seat?.v ?? -203.2;
    const [sx, sz] = toWorld(room.frame, sU, sV);
    const pU = playerSeat?.u ?? 86.48;
    const pV = playerSeat?.v ?? -204.2;
    const [px, pz] = toWorld(room.frame, pU, pV);

    const defYaw = yawOf(room.frame, room.studentFacing[0], room.studentFacing[1]);
    const pYaw = Math.atan2(px - sx, pz - sz);

    return {
      seatW: [sx, sz] as const,
      defaultYaw: defYaw,
      playerYaw: pYaw,
    };
  }, [room, seat, playerSeat]);

  const sim = useMemo(() => {
    const pos = new Vector3(seatW[0], sitYOffset, seatW[1]);
    return {
      yaw: defaultYaw,
      startTime: -1,
      hasRaisedHand: false,
      raising: false,
      seenResultId: -1,
      nextTyping: 8 + Math.random() * 5,
      worldPos: pos,
    };
  }, [seatW, defaultYaw, sitYOffset]);

  const isTalkTarget = Boolean(stage?.trigger === 'talk');

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.1);
    const now = state.clock.elapsedTime;
    const signal = getSignal();

    if (sim.startTime < 0) {
      sim.startTime = now;
    }

    // 1. Giơ tay 1 lần khi cảnh bắt đầu
    if (!sim.hasRaisedHand) {
      sim.hasRaisedHand = true;
      sim.raising = true;
      handle.current?.playUpper('raiseHand', { loop: false, timeScale: 0.6 });
    }
    if (sim.raising && now - sim.startTime > 1.8) {
      sim.raising = false;
      handle.current?.stopUpper();
    }

    // 2. Phản ứng đúng khi làm bài tập code (emote-yes)
    if (signal.result && signal.result.id !== sim.seenResultId) {
      sim.seenResultId = signal.result.id;
      if (signal.result.correct && signal.mode === 'exercise') {
        handle.current?.playUpper('yes');
        sim.nextTyping = now + 4;
      }
    }

    // 3. Thi thoảng gõ phím khi đang ngồi nghe/học
    if (!sim.raising && signal.mode !== 'end' && now >= sim.nextTyping) {
      sim.nextTyping = now + 8 + Math.random() * 8;
      handle.current?.playUpper('interact');
    }

    // 4. Quay mặt về người chơi khi đang nói
    const isSpeaking = signal.speaker === 'han';
    const targetYaw = isSpeaking ? playerYaw : defaultYaw;
    sim.yaw = turnToward(sim.yaw, targetYaw, Math.min(1, dt * 8));
    g.rotation.y = sim.yaw;

    // 5. Cập nhật nhãn tên ẩn/hiện theo khoảng cách camera <= 6 m (không kích hoạt React re-render)
    if (labelRef.current) {
      const dist = state.camera.position.distanceTo(sim.worldPos);
      labelRef.current.style.display = dist <= 6.0 ? 'flex' : 'none';
    }
  });

  const hanUrl = characterConfig.story?.han ?? characterConfig.roles.students[3] ?? 'models/characters/character-female-c.glb';

  return (
    <group ref={group} position={[seatW[0], sitYOffset, seatW[1]]} rotation={[0, defaultYaw, 0]}>
      <CharacterModel ref={handle} url={hanUrl} clip="sit" />
      <Html position={[0, 1.45, 0]} center zIndexRange={[15, 0]}>
        <div
          ref={labelRef}
          style={{ display: 'none' }}
          className="flex-col items-center pointer-events-none select-none transform -translate-y-2"
        >
          {isTalkTarget && (
            <div className="mb-1 w-5 h-5 rounded-full bg-amber-400 text-slate-900 font-bold text-xs flex items-center justify-center shadow-md animate-bounce">
              !
            </div>
          )}
          <div className="px-2 py-0.5 rounded bg-slate-900/90 text-white text-[11px] font-semibold border border-slate-700/80 shadow backdrop-blur-sm whitespace-nowrap">
            Han
          </div>
        </div>
      </Html>
    </group>
  );
}

/**
 * Quản lý các nhân vật cốt truyện (Han, Thành, Quyền, ...) xuất hiện trong cảnh theo StageSpec.
 */
export default function StoryActors({
  room,
  stage,
  getSignal,
  sitYOffset = 0.4,
}: StoryActorsProps) {
  const actors = stage?.actors ?? [];

  // Han ở companionSeat (mặc định luôn có trong các cảnh lab CSE 103 và 406.B8)
  const hanActorSpec = actors.find((a) => a.speaker === 'han');
  const hanSeatId = hanActorSpec?.seatId ?? room.companionSeat ?? '406-r2-s6';

  return (
    <Suspense fallback={null}>
      <HanActor
        room={room}
        seatId={hanSeatId}
        stage={stage}
        getSignal={getSignal}
        sitYOffset={sitYOffset}
      />
    </Suspense>
  );
}
