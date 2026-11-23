import { useEffect, useMemo } from 'react';
import { getClassroom } from '../../data';
import { getStage } from '../../data/silver/stages';
import { useActivityStore } from '../../store/useActivityStore';
import { useLangStore } from '../../store/useLangStore';
import { useSilverStore } from '../../store/useSilverStore';
import { useWalkStore } from '../../store/useWalkStore';
import { createSilverSignal, type SubscribablePlayStore } from '../../silverWorld/silverSignal';
import ProjectorScreen from '../lesson/ProjectorScreen';
import Teacher from '../lesson/Teacher';
import SeatHighlight from './SeatHighlight';
import SilverClassroomNpcs from './SilverClassroomNpcs';
import StoryActors from './StoryActors';
import type { PlayView } from '../../types/silver';
import type { StageSpec } from '../../types/silverWorld';

interface StoreWithSubscribe {
  getState: () => { play: PlayView | null };
  subscribe: (listener: (state: { play: PlayView | null }, prev: { play: PlayView | null }) => void) => () => void;
}

function isSubscribable(store: object): store is StoreWithSubscribe {
  return 'subscribe' in store && typeof (store as Record<string, unknown>).subscribe === 'function';
}

export interface SilverStageProps {
  sitYOffset?: number;
  stageSpec?: StageSpec;
}

/**
 * Gom phòng học Silver (406.B8) thành sân khấu tương tác 3D:
 * - Khi useActivityStore.activity.source === 'silver' và người chơi ở đúng tòa B8 tầng 4:
 *   mount Teacher, ProjectorScreen, ClassroomNpcs, StoryActors (Han), SeatHighlight theo StageSpec.
 * - Tự động unmount toàn bộ diễn viên khi đổi tầng hoặc rời tòa nhà.
 * - Nối tín hiệu lớp học với store qua createSilverSignal và tự giải phóng khi unmount.
 */
export default function SilverStage({ sitYOffset = 0.4, stageSpec }: SilverStageProps) {
  const interior = useWalkStore((s) => s.interior);
  const activity = useActivityStore((s) => s.activity);
  const seated = useActivityStore((s) => s.seated);
  const playItem = useSilverStore((s) => s.play?.item);

  const isB8Floor4 = Boolean(
    interior && interior.buildingId.toLowerCase() === 'b8' && interior.floor === 4,
  );
  const isSilverActive = Boolean(activity && activity.source === 'silver');

  const sceneId = playItem?.scene?.id;
  const stage = useMemo(() => {
    if (stageSpec) return stageSpec;
    if (sceneId) return getStage(sceneId);
    return getStage('CSE 103/lab-1');
  }, [stageSpec, sceneId]);

  const room = useMemo(() => {
    const code = stage?.roomCode ?? '406.B8';
    return getClassroom(code) ?? getClassroom('406.B8');
  }, [stage]);

  // Bộ tín hiệu Silver kết nối với useSilverStore và useLangStore
  const signalHandle = useMemo(() => {
    const playStore: SubscribablePlayStore = isSubscribable(useSilverStore)
      ? useSilverStore
      : {
          getState: () => ({ play: useSilverStore.getState().play }),
          subscribe: () => () => {},
        };
    return createSilverSignal(playStore, useLangStore);
  }, []);

  useEffect(() => {
    return () => {
      signalHandle.dispose();
    };
  }, [signalHandle]);

  // Điều kiện mount: chỉ mount khi ở đúng B8 tầng 4 và activity nguồn silver đang hoạt động
  if (!isB8Floor4 || !isSilverActive || !room) {
    return null;
  }

  const effectiveSitY = room.sitYOffset ?? sitYOffset;

  return (
    <>
      {/* Ánh sáng tự nhiên phòng máy 406.B8 sáng sủa, trắng tự nhiên như ảnh thực tế */}
      <ambientLight intensity={1.5} color="#ffffff" />
      <directionalLight position={[42.0, 3.7, -220.0]} intensity={0.9} color="#fffcf5" />

      {/* 1. Màn TV slide trên tường trước (91.2; -205.1) */}
      <ProjectorScreen room={room} getSignal={signalHandle.getSignal} subscribe={signalHandle.subscribe} />

      {/* 2. Thầy giảng đi lại và phản ứng với bài học */}
      <Teacher
        room={room}
        getSignal={signalHandle.getSignal}
        subscribe={signalHandle.subscribe}
        crowd={stage?.crowd}
      />

      {/* 3. 12 bạn học nền ngồi gõ phím, giơ tay, hoan hô (đã loại ghế Han và lọc model người trong truyện) */}
      <SilverClassroomNpcs
        room={room}
        getSignal={signalHandle.getSignal}
        subscribe={signalHandle.subscribe}
        crowd={stage?.crowd}
        sitYOffset={effectiveSitY}
      />

      {/* 4. Nhân vật cốt truyện (Han ở companionSeat 406-r2-s6, quay nhìn người chơi, chào tay, yes...) */}
      <StoryActors
        room={room}
        stage={stage}
        getSignal={signalHandle.getSignal}
        subscribe={signalHandle.subscribe}
        sitYOffset={effectiveSitY}
      />

      {/* 5. Viền vàng ghế người chơi khi chưa ngồi + màn hình máy tính người chơi phủ sáng */}
      <SeatHighlight room={room} activity={activity} seated={seated} />
    </>
  );
}
