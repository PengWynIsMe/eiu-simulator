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
  room: Classroom;
  sitYOffset: number;
}

/**
 * Nội dung sân khấu tương tác Silver — chỉ mount khi các điều kiện kiểm tra đã thỏa mãn.
 * Quản lý vòng đời createSilverSignal trong useEffect an toàn với React StrictMode:
 * mount -> subscribe -> unmount -> dispose -> remount -> subscribe lại với handle mới.
 */
function SilverStageContent({ stage, room, sitYOffset }: SilverStageContentProps) {
  const seated = useActivityStore((s) => s.seated);
  const activity = useActivityStore((s) => s.activity);

  const silverStore = useSilverStore;
  // Kiểm tra store hợp lệ: ném lỗi rõ ràng nếu store thiếu hàm subscribe
  if (!isSubscribablePlayStore(silverStore)) {
    throw new Error('[SilverStage] useSilverStore thiếu phương thức subscribe');
  }
  const playStore = silverStore;

  // Khởi tạo và hủy signal trong cùng 1 useEffect chịu được StrictMode
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

  // Phòng an toàn (đã loại bỏ ghế người chơi, companionSeat và ghế của tất cả diễn viên trong stage)
  const safeRoom = useMemo(() => {
    return createSafeClassroomForStage(room, stage);
  }, [room, stage]);

  const hasTeacher = useMemo(() => {
    return stage.actors.some((a) => a.speaker === 'teacher');
  }, [stage.actors]);

  if (!handle) {
    return null;
  }

  const effectiveSitY = room.sitYOffset ?? sitYOffset;
  const effectiveCrowd = stage.crowd ?? safeRoom.npcSeats.length;

  return (
    <>
      {/* 0. Phòng lý thuyết (bàn học, ghế, bàn GV, bảng, khung TV) khi không phải phòng máy */}
      {!isComputerLabRoom(room) && <TheoryRoom room={room} />}

      {/* 1. Màn TV slide trên tường trước (không thêm đèn vào scene) */}
      <ProjectorScreen room={room} getSignal={handle.getSignal} subscribe={handle.subscribe} />

      {/* 2. Thầy giảng đi lại và phản ứng với bài học (chỉ dựng khi stage có teacher) */}
      {hasTeacher && (
        <Teacher
          room={room}
          getSignal={handle.getSignal}
          subscribe={handle.subscribe}
          crowd={effectiveCrowd}
        />
      )}

      {/* 3. Bạn học nền (dùng trực tiếp ClassroomNpcs với safeRoom và models đã lọc, crowd = 0 thì không dựng) */}
      {effectiveCrowd > 0 && (
        <ClassroomNpcs
          room={safeRoom}
          getSignal={handle.getSignal}
          subscribe={handle.subscribe}
          crowd={effectiveCrowd}
          sitYOffset={effectiveSitY}
          models={filteredModels}
        />
      )}

      {/* 4. Diễn viên cốt truyện (Han, Quyền... theo danh sách stage.actors) */}
      <StoryActors
        room={room}
        stage={stage}
        getSignal={handle.getSignal}
        subscribe={handle.subscribe}
        sitYOffset={effectiveSitY}
      />

      {/* 5. Viền vàng ghế người chơi khi chưa ngồi + màn hình máy tính người chơi phủ sáng */}
      <SeatHighlight room={room} activity={activity} seated={seated} />
    </>
  );
}

/**
 * Gom phòng học Silver thành sân khấu tương tác 3D:
 * - Khi useActivityStore.activity.source === 'silver' và người chơi ở đúng tòa nhà / tầng của phòng:
 *   mount ProjectorScreen, Teacher (nếu có), ClassroomNpcs (nếu crowd > 0), StoryActors, SeatHighlight.
 * - Không fallback về cảnh khác hay phòng khác khi không tìm thấy stage / room.
 * - Tự động unmount toàn bộ diễn viên khi đổi tầng hoặc rời tòa nhà.
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

  // Phòng 208.B8 (thi vấn đáp 1-1, không có trong classrooms.json)
  if (
    isSilverActive
    && stage?.roomCode === '208.B8'
    && interior?.buildingId.toLowerCase() === 'b8'
    && interior?.floor === 2
  ) {
    return <Room208 />;
  }

  // Điều kiện mount: chỉ mount khi ở đúng tòa nhà và tầng của phòng (không viết cứng b8/4)
  if (!isSilverActive || !stage || !room || !interior) {
    return null;
  }

  const isSameBuilding = interior.buildingId.toLowerCase() === room.buildingId.toLowerCase();
  const isSameFloor = interior.floor === room.floor;

  if (!isSameBuilding || !isSameFloor) {
    return null;
  }

  return <SilverStageContent stage={stage} room={room} sitYOffset={sitYOffset} />;
}
