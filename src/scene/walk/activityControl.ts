import { useActivityStore } from '../../store/useActivityStore';
import type { Activity, ActivityState } from '../../types/silverWorld';

type Interior = { buildingId: string; floor: number } | null;

export function activityRadius(activity: Activity): number {
  return activity.trigger === 'sit' ? 1.2 : 1.8;
}

export function syncActivityRange(state: ActivityState, interior: Interior, x: number, z: number): boolean {
  const { activity, phase } = state;
  const spot = activity?.trigger === 'sit' ? activity.seat?.spot : activity?.target;
  const inRange = Boolean(activity && activity.trigger !== 'none' && phase !== 'engaged' && spot
    && spot.buildingId === (interior?.buildingId ?? null) && spot.floor === (interior?.floor ?? null)
    && Math.hypot(x - spot.x, z - spot.z) <= activityRadius(activity));
  if (state.inRange !== inRange) state.setInRange(inRange);
  return inRange;
}

export function focusActivity(state: ActivityState): Activity | null {
  const { activity, phase } = state;
  return phase === 'engaged' && (activity?.trigger === 'talk' || activity?.trigger === 'look') ? activity : null;
}

let handledEscape = false;

export function handleActivityEscape(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return;
  const state = useActivityStore.getState();
  if (!event.repeat) handledEscape = state.screenOpen || state.seated;
  if (!handledEscape) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (event.repeat) return;
  if (state.screenOpen) state.setScreenOpen(false);
  else state.standUp();
}
