import { useEffect, useMemo, useState } from 'react';
import { getClassroom, characterConfig } from '../../data';
import { getStage } from '../../data/silver/stages';
import { useActivityStore } from '../../store/useActivityStore';
import { useLangStore } from '../../store/useLangStore';
import { useSilverStore } from '../../store/useSilverStore';
import { useWalkStore } from '../../store/useWalkStore';
import { createSilverSignal, type SilverSignalHandle, type SubscribablePlayStore } from '../../silverWorld/silverSignal';
import { isComputerLabRoom } from '../../silverWorld/seatAnchor';
import ClassroomNpcs from '../npc/ClassroomNpcs';
import ProjectorScreen from '../lesson/ProjectorScreen';
import Teacher from '../lesson/Teacher';
import SeatHighlight from './SeatHighlight';
import StoryActors from './StoryActors';
import TheoryRoom from './rooms/TheoryRoom';
import Room208 from './rooms/Room208';
import ResultBoard from './ResultBoard';
import PeCrowd from './PeCrowd';
import { createSafeClassroomForStage, filterBackgroundModels } from './stageFiltering';
import type { Classroom } from '../../types';
import type { StageSpec } from '../../types/silverWorld';

function isSubscribablePlayStore(store: unknown): store is SubscribablePlayStore {
  return Boolean(
    store
    && (typeof store === 'object' || typeof store === 'function')
    && 'getState' in store
    && typeof (store as Record<string, unknown>).getState === 'function'
    && 'subscribe' in store
    && typeof (store as Record<string, unknown>).subscribe === 'function',
  );
}

export interface SilverStageProps {
  sitYOffset?: number;
  stageSpec?: StageSpec;
}

interface SilverStageContentProps {
  stage: StageSpec;
  room?: Classroom | null;
  sitYOffset: number;
}

/**
 * Nội dung sân khấu tương tác Silver — mount khi người chơi ở đúng tòa nhà/tầng hoặc ngoài trời.
 * Quản lý vòng đời createSilverSignal trong useEffect an toàn với React StrictMode:
 * mount -> subscribe -> unmount -> dispose -> remount -> subscribe lại với handle mới.
 */
function SilverStageContent({ stage, room, sitYOffset }: SilverStageContentProps) {
  const seated = useActivityStore((s) => s.seated);
  const activity = useActivityStore((s) => s.activity);

  const silverStore = useSilverStore;
  if (!isSubscribablePlayStore(silverStore)) {
    throw new Error('[SilverStage] useSilverStore thiếu phương thức subscribe');
  }
  const playStore = silverStore;

  const [handle, setHandle] = useState<SilverSignalHandle | null>(null);

  useEffect(() => {
    const nextHandle = createSilverSignal(
      playStore,
      useLangStore,
    );
    setHandle(nextHandle);
    return () => {
      nextHandle.dispose();
      setHandle(null);
    };
  }, [playStore]);

  // Lọc model sinh viên nền (bỏ các model của nhân vật cốt truyện)
  const filteredModels = useMemo(() => {
    return filterBackgroundModels(characterConfig.roles.students, characterConfig.story);
  }, []);

  // Phòng an toàn (chỉ tính khi có room trong classrooms.json)
  const safeRoom = useMemo(() => {
    if (!room) return null;
    return createSafeClassroomForStage(room, stage);
  }, [room, stage]);

  const instructorActor = useMemo(() => {
    return stage.actors.find((a) => (a.speaker === 'teacher' || a.speaker === 'examiner') && !a.spot);
  }, [stage.actors]);

  const instructorModelUrl = useMemo(() => {
    if (!instructorActor) return undefined;
    return instructorActor.speaker === 'examiner'
      ? (characterConfig.story?.examiner ?? characterConfig.roles.teacher)
      : characterConfig.roles.teacher;
  }, [instructorActor]);

  if (!handle) {
    return null;
  }

  const effectiveSitY = room?.sitYOffset ?? sitYOffset;
  const effectiveCrowd = stage.crowd ?? safeRoom?.npcSeats.length ?? 0;

  return (
    <>
      {/* 0. Phòng lý thuyết (bàn học, ghế, bàn GV, bảng, khung TV) khi có room và không phải phòng máy */}
      {room && !isComputerLabRoom(room) && <TheoryRoom key={room.code} room={room} />}

      {/* 1. Màn TV slide trên tường trước (không thêm đèn vào scene) khi có phòng học */}
      {room && (
        <ProjectorScreen room={room} getSignal={handle.getSignal} subscribe={handle.subscribe} />
      )}

      {/* 2. Thầy giảng / Giám thị đi lại và phản ứng với bài học (khi stage có teacher hoặc examiner đứng lớp) */}
      {room && instructorActor && (
        <Teacher
          room={room}
          getSignal={handle.getSignal}
          subscribe={handle.subscribe}
          crowd={effectiveCrowd}
          modelUrl={instructorModelUrl}
        />
      )}

      {/* 3. Bạn học nền trong phòng học (chỉ dựng khi có safeRoom và crowd > 0) */}
      {safeRoom && effectiveCrowd > 0 && (
        <ClassroomNpcs
          room={safeRoom}
          getSignal={handle.getSignal}
          subscribe={handle.subscribe}
          crowd={effectiveCrowd}
          sitYOffset={effectiveSitY}
          models={filteredModels}
        />
      )}

      {/* 4. Bạn học ngoài trời (cảnh 1.1/pe: 4 bạn đứng tập thể dục ở sân cỏ) */}
      {stage.sceneId === '1.1/pe' && stage.crowd > 0 && (
        <PeCrowd crowd={stage.crowd} target={stage.target} />
      )}

      {/* 5. Bảng kết quả thi ngoài trời (chỉ hiện ở cảnh entrance/result) */}
      {stage.sceneId === 'entrance/result' && (
        <ResultBoard stage={stage} />
      )}

      {/* 6. Diễn viên cốt truyện (Han, Quyền, Thành... theo danh sách stage.actors) */}
      <StoryActors
        room={room}
        stage={stage}
        getSignal={handle.getSignal}
        subscribe={handle.subscribe}
        sitYOffset={effectiveSitY}
      />

      {/* 7. Viền vàng ghế người chơi khi chưa ngồi + màn hình máy tính người chơi phủ sáng */}
      <SeatHighlight room={room} activity={activity} seated={seated} sitYOffset={effectiveSitY} />
    </>
  );
}

/**
 * Gom phòng học và sân khấu tương tác Silver:
 * - Khi useActivityStore.activity.source === 'silver':
 *   + Cảnh ngoài trời (stage.target.buildingId === null): chỉ dựng khi interior === null.
 *   + Cảnh trong nhà: chỉ dựng khi interior.buildingId và interior.floor trùng với stage.target.
 *   + Không tạo Classroom giả khi roomCode là null hoặc 208.B8.
 *   + Tự động unmount khi đổi cảnh, đổi tầng hoặc rời tòa nhà.
 */
export default function SilverStage({ sitYOffset = 0.4, stageSpec }: SilverStageProps) {
  const interior = useWalkStore((s) => s.interior);
  const activity = useActivityStore((s) => s.activity);
  const playItem = useSilverStore((s) => s.play?.item);

  const isSilverActive = Boolean(activity && activity.source === 'silver');
  const sceneId = playItem?.scene?.id;

  const stage = useMemo(() => {
    if (stageSpec) return stageSpec;
    if (sceneId) return getStage(sceneId) ?? null;
    return null;
  }, [stageSpec, sceneId]);

  const room = useMemo(() => {
    if (!stage?.roomCode) return null;
    return getClassroom(stage.roomCode) ?? null;
  }, [stage]);

  if (!isSilverActive || !stage) {
    return null;
  }

  // 1. Cảnh ngoài trời (stage.target.buildingId === null): chỉ dựng khi interior === null
  if (stage.target.buildingId === null) {
    if (interior !== null) {
      return null;
    }
    return <SilverStageContent stage={stage} room={null} sitYOffset={sitYOffset} />;
  }

  // 2. Cảnh trong nhà: chỉ dựng khi đúng tòa nhà và tầng của stage.target
  if (
    !interior
    || interior.buildingId.toLowerCase() !== stage.target.buildingId.toLowerCase()
    || interior.floor !== stage.target.floor
  ) {
    return null;
  }

  // Phòng 208.B8 (thi vấn đáp 1-1, không có trong classrooms.json)
  if (stage.roomCode === '208.B8') {
    return (
      <>
        <Room208 />
        <SilverStageContent stage={stage} room={null} sitYOffset={sitYOffset} />
      </>
    );
  }

  return <SilverStageContent stage={stage} room={room} sitYOffset={sitYOffset} />;
}
