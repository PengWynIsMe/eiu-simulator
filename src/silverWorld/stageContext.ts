import { getClassroom } from '../data/phase2';
import { getStage } from '../data/silver/stages';
import type { Classroom } from '../types/lesson';
import type { LocalizedText, Vec2 } from '../types';
import type { Activity, SeatAnchor, StageSpec } from '../types/silverWorld';
import { resolveSeatAnchor } from './seatAnchor';

export interface StageContextOptions {
  getClassroom?: (code: string) => Classroom | undefined;
  toWorld?: (u: number, v: number) => Vec2;
}

/**
 * Tạo Activity từ StageSpec để điều khiển người chơi và WalkMode.
 */
export function createStageActivity(
  stage: StageSpec,
  opts?: StageContextOptions,
): Activity {
  const getRoom = opts?.getClassroom ?? getClassroom;
  let seat: SeatAnchor | null = null;
  if (stage.trigger === 'sit') {
    seat = resolveSeatAnchor(stage.roomCode, getRoom);
  }

  let prompt: LocalizedText;
  if (stage.trigger === 'sit') {
    prompt = { vi: 'Ngồi (E)', en: 'Sit (E)' };
  } else if (stage.trigger === 'talk') {
    prompt = { vi: 'Nói chuyện (E)', en: 'Talk (E)' };
  } else if (stage.trigger === 'look') {
    prompt = { vi: 'Xem (E)', en: 'Look (E)' };
  } else {
    prompt = { vi: '', en: '' };
  }

  return {
    key: `silver:${stage.sceneId}`,
    source: 'silver',
    trigger: stage.trigger,
    arrival: stage.arrival,
    target: stage.target,
    seat,
    prompt,
  };
}

/**
 * Tra cứu StageSpec theo sceneId và tạo Activity tương ứng.
 */
export function getStageActivity(
  sceneId: string,
  opts?: StageContextOptions,
): Activity | undefined {
  const stage = getStage(sceneId);
  return stage ? createStageActivity(stage, opts) : undefined;
}
