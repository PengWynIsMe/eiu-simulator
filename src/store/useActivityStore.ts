import { create } from 'zustand';
import type { ActivityState, WorldSpot } from '../types/silverWorld';

const initial = {
  activity: null,
  phase: 'travel',
  seated: false,
  screenOpen: false,
  inRange: false,
  teleport: null,
} as const;

export const useActivityStore = create<ActivityState>()((set) => {
  let teleportId = 0;
  const teleport = (spot: WorldSpot) => ({ id: ++teleportId, spot });

  return {
    ...initial,
    begin: (activity, { teleportTo, keepSeated }) => set((state) => {
      const seated = keepSeated && state.seated;
      const phase = seated || activity.trigger === 'none' ? 'engaged' : 'travel';
      const destination = seated || teleportTo === 'none' ? null : activity[teleportTo];
      if (!destination && state.activity === activity && state.phase === phase && state.seated === seated
        && !state.screenOpen && !state.inRange && !state.teleport) return state;

      return { ...initial, activity, phase, seated, teleport: destination ? teleport(destination) : null };
    }),
    setInRange: (inRange) => set((state) => {
      if (!state.activity) return state;
      const phase = state.phase === 'engaged' ? 'engaged' : inRange ? 'near' : 'travel';
      return state.inRange === inRange && state.phase === phase ? state : { inRange, phase };
    }),
    interact: () => set((state) => {
      if (!state.activity || !state.inRange || state.phase !== 'near') return state;
      return { seated: state.activity.seat !== null, phase: 'engaged' };
    }),
    standUp: () => set((state) => {
      const seat = state.activity?.seat;
      if (!state.seated || !seat) return state;
      return { seated: false, screenOpen: false, phase: 'near', teleport: teleport(seat.stand) };
    }),
    setScreenOpen: (screenOpen) => set((state) => {
      return state.activity && state.screenOpen !== screenOpen ? { screenOpen } : state;
    }),
    arriveNow: () => set((state) => {
      const activity = state.activity;
      if (!activity) return state;
      if (activity.seat) return { teleport: teleport(activity.seat.stand) };

      const { target } = activity;
      const [dx, dz] = target.facing;
      const length = Math.hypot(dx, dz);
      const facing: WorldSpot['facing'] = length ? [dx / length, dz / length] : [0, 0];
      return {
        teleport: teleport({ ...target, facing, x: target.x - 1.2 * facing[0], z: target.z - 1.2 * facing[1] }),
      };
    }),
    end: () => set((state) => state.activity ? initial : state),
  };
});
