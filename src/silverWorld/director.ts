import { getClassroom } from '../data/phase2';
import { getStage } from '../data/silver/stages';
import { useActivityStore } from '../store/useActivityStore';
import { useSilverStore } from '../store/useSilverStore';
import { useWalkStore } from '../store/useWalkStore';
import type { Classroom } from '../types/lesson';
import type { RunItem, SilverApi, SilverScreen, UseSilver } from '../types/silver';
import type { StageSpec } from '../types/silverWorld';
import { createStageActivity } from './stageContext';

export interface SilverStoreSubscribable {
  getState: () => SilverApi;
  subscribe: (listener: (state: SilverApi, prev: SilverApi) => void) => () => void;
}

export interface DirectorDeps {
  silver?: SilverStoreSubscribable | UseSilver;
  activity?: typeof useActivityStore;
  walk?: typeof useWalkStore;
  getClassroom?: (code: string) => Classroom | undefined;
}

export function startDirector(deps?: DirectorDeps): () => void {
  const silverStore = (deps?.silver ?? useSilverStore) as SilverStoreSubscribable;
  const activityStore = deps?.activity ?? useActivityStore;
  const walkStore = deps?.walk ?? useWalkStore;
  const getRoom = deps?.getClassroom ?? getClassroom;

  let prevItemId: string | null = null;
  let prevItem: RunItem | null = null;
  let prevStage: StageSpec | null = null;
  let prevScreen: SilverScreen | null = null;
  const warnedSceneIds = new Set<string>();

  const handlePlayItem = (currItem: RunItem, screenJustEntered: boolean) => {
    const sceneId = currItem.scene?.id ?? currItem.id;
    const stage = getStage(sceneId);

    if (!stage) {
      if (!warnedSceneIds.has(sceneId)) {
        warnedSceneIds.add(sceneId);
        console.warn(`[SilverDirector] Cảnh không có trong stages.json: ${sceneId}`);
      }
      prevItemId = currItem.id;
      prevItem = currItem;
      prevStage = null;
      prevScreen = 'play';
      return;
    }

    const activity = createStageActivity(stage, { getClassroom: getRoom });
    const activityState = activityStore.getState();
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
    let teleportTo: 'none' | 'arrival' = 'arrival';
    if (keepSeated) {
      teleportTo = 'none';
    } else if (!screenJustEntered && sameDay) {
      const walkState = walkStore.getState();
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

    activityStore.getState().begin(activity, { teleportTo, keepSeated });

    prevItemId = currItem.id;
    prevItem = currItem;
    prevStage = stage;
    prevScreen = 'play';
  };

  const stopSilver = silverStore.subscribe((state: SilverApi, prev: SilverApi) => {
    if (state.screen === 'play') {
      const isEnteringPlay = prev.screen !== 'play' || prevScreen !== 'play';
      const isItemChanged = state.play !== null && state.play.item.id !== prevItemId;
      if (state.play && (isEnteringPlay || isItemChanged)) {
        handlePlayItem(state.play.item, isEnteringPlay);
      }
    } else {
      // PLAN-3D mục 4.5: screen==='closed'|'home' → end
      if (state.screen === 'closed' || state.screen === 'home') {
        const currentActivity = activityStore.getState().activity;
        if (currentActivity?.source === 'silver') {
          activityStore.getState().end();
        }
        prevItemId = null;
        prevItem = null;
        prevStage = null;
      }
      prevScreen = state.screen;
    }
  });

  // useWalkStore.walkMode về false giữa lượt → exitRun()
  const stopWalk = walkStore.subscribe((state, prev) => {
    if (prev.walkMode && !state.walkMode) {
      const silverState = silverStore.getState();
      if (silverState.screen === 'play') {
        silverState.exitRun();
      }
    }
  });

  // Kiểm tra nếu khi khởi động đã ở screen === 'play'
  const initialSilver = silverStore.getState();
  if (initialSilver.screen === 'play' && initialSilver.play) {
    handlePlayItem(initialSilver.play.item, true);
  }

  return () => {
    stopSilver();
    stopWalk();
  };
}
