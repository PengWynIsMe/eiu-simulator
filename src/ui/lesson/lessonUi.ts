import { create } from 'zustand';

/** Trạng thái thuần giao diện: thẻ lịch học đang mở hay không (TopBar và LessonStarter dùng chung). */
interface LessonUiState {
  scheduleOpen: boolean;
  toggleSchedule: () => void;
  closeSchedule: () => void;
}

export const useLessonUi = create<LessonUiState>()((set) => ({
  scheduleOpen: false,
  toggleSchedule: () => set((s) => ({ scheduleOpen: !s.scheduleOpen })),
  closeSchedule: () => set({ scheduleOpen: false }),
}));
