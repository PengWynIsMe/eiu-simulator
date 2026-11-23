import { getClassroom } from '../data/phase2';
import { getStage, isStageAvailable } from '../data/silver/stages';
import type { Classroom } from '../types/lesson';
import type { Vec2 } from '../types';
import type { RunItem, SilverApi, SilverScreen } from '../types/silver';
import type { ActivityState, StageSpec } from '../types/silverWorld';
import { useWalkStore } from '../store/useWalkStore';
import { createStageActivity } from './stageContext';

type WalkState = ReturnType<typeof useWalkStore.getState>;

export interface SubscribableSilverStore {
  getState: () => SilverApi;
  subscribe: (listener: (state: SilverApi, prev: SilverApi) => void) => () => void;
}

export interface SubscribableActivityStore {
  getState: () => ActivityState;
  subscribe: (listener: (state: ActivityState, prev: ActivityState) => void) => () => void;
}

export interface SubscribableWalkStore {
  getState: () => WalkState;
  subscribe: (listener: (state: WalkState, prev: WalkState) => void) => () => void;
}

export interface DirectorDeps {
  silver: SubscribableSilverStore;
  activity: SubscribableActivityStore;
  walk: SubscribableWalkStore;
  toWorld: (frame: 'b11' | 'b8', u: number, v: number) => Vec2;
  getClassroom?: (code: string) => Classroom | undefined;
}

/**
 * Đạo diễn Silver: điều phối luồng chơi giữa useSilverStore và useActivityStore.
 */
export function startDirector({
  silver,
  activity,
  walk,
  toWorld,
  getClassroom: getRoom = getClassroom,
}: DirectorDeps): () => void {
  let prevItemId: string | null = null;
  let prevItem: RunItem | null = null;
  let prevStage: StageSpec | null = null;
  let prevScreen: SilverScreen | null = null;
  const warnedSceneIds = new Set<string>();

  const handlePlayItem = (currItem: RunItem) => {
    // Cùng item.id thì không begin lại
    if (currItem.id === prevItemId) {
      prevScreen = 'play';
      return;
    }

    const sceneId = currItem.scene?.id ?? currItem.id;
    const stage = getStage(sceneId);
    const available = Boolean(stage && isStageAvailable(stage, getRoom));

    if (!available || !stage) {
      if (!warnedSceneIds.has(sceneId)) {
        warnedSceneIds.add(sceneId);
        console.warn(`[SilverDirector] Cảnh lạ hoặc phòng chưa có: ${sceneId}`);
      }
      // Cảnh lạ/vắng: nếu activity Silver cũ còn thì end(), không end activity nguồn lesson
      const currentActivity = activity.getState().activity;
      if (currentActivity?.source === 'silver') {
        activity.getState().end();
      }
      prevItemId = currItem.id;
      prevItem = currItem;
      prevStage = null;
      prevScreen = 'play';
      return;
    }

    const stageActivity = createStageActivity(stage, currItem.id, { getClassroom: getRoom, toWorld });
    const activityState = activity.getState();
    const wasSeated = activityState.seated;

    // keepSeated khi cùng phòng, cùng meeting.day (hoặc cùng không có meeting) và đang ngồi
    const prevMeeting = prevItem?.meeting;
    const currMeeting = currItem.meeting;
    const sameDay = (prevMeeting === undefined && currMeeting === undefined)
      || (prevMeeting !== undefined && currMeeting !== undefined && prevMeeting.day === currMeeting.day);
    const sameRoom = Boolean(stage.roomCode && prevStage?.roomCode && stage.roomCode === prevStage.roomCode);
    const keepSeated = Boolean(sameRoom && sameDay && wasSeated);

    // teleportTo='none' khi cùng tòa/tầng và cách arrival < 60 m và không đổi ngày
    // 'arrival' khi vào chương/tiếp tục/đổi ngày/khác nơi
    // Từ week sang item MỚI cùng ngày, gần: theo luật 60 m (vào chương/tiếp tục từ home/recap mới là 'arrival')
    let teleportTo: 'none' | 'arrival' = 'arrival';
    if (keepSeated) {
      teleportTo = 'none';
    } else if (sameDay && (prevScreen === 'play' || prevScreen === 'week')) {
      const walkState = walk.getState();
      const playerPos = walkState.playerPos;
      const interior = walkState.interior;
      const sameBuilding = (interior?.buildingId ?? null) === (stage.arrival.buildingId ?? null);
      const sameFloor = (interior?.floor ?? null) === (stage.arrival.floor ?? null);
      if (sameBuilding && sameFloor) {
        const dist = Math.hypot(playerPos.x - stage.arrival.x, playerPos.z - stage.arrival.z);
        if (dist < 60) {
          teleportTo = 'none';
        }
      }
    }

    activity.getState().begin(stageActivity, { teleportTo, keepSeated });

    prevItemId = currItem.id;
    prevItem = currItem;
    prevStage = stage;
    prevScreen = 'play';
  };

  const stopSilver = silver.subscribe((state: SilverApi) => {
    if (state.screen === 'play') {
      if (state.play) {
        handlePlayItem(state.play.item);
      }
    } else {
      // PLAN-3D mục 4.5: screen==='closed'|'home' → end
      if (state.screen === 'closed' || state.screen === 'home') {
        const currentActivity = activity.getState().activity;
        if (currentActivity?.source === 'silver') {
          activity.getState().end();
        }
        prevItemId = null;
        prevItem = null;
        prevStage = null;
      }
      prevScreen = state.screen;
    }
  });

  // useWalkStore.walkMode về false giữa lượt:
  // Nếu đang ở màn 'play' thì exitRun()
  const stopWalk = walk.subscribe((state, prev) => {
    if (prev.walkMode && !state.walkMode) {
      const silverState = silver.getState();
      if (silverState.screen === 'play') {
        silverState.exitRun();
      }
    }
  });

  // Kiểm tra nếu khi khởi động đã ở screen === 'play'
  const initialSilver = silver.getState();
  if (initialSilver.screen === 'play' && initialSilver.play) {
    handlePlayItem(initialSilver.play.item);
  }

  return () => {
    stopSilver();
    stopWalk();
  };
}
