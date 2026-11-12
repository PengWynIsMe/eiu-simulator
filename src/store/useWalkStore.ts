import { create } from 'zustand';

interface WalkState {
  /** true = đang điều khiển nhân vật đi bộ (camera bám sau nhân vật, CameraRig tạm tắt). */
  walkMode: boolean;
  toggleWalkMode: () => void;
  exitWalkMode: () => void;
  /**
   * Cần điều khiển ảo trên điện thoại (ui/walk) → nhân vật (scene/walk).
   * x: trái(-1) → phải(+1); y: lùi(-1) → tiến(+1). Bàn phím xử lý trực tiếp trong scene.
   */
  moveInput: { x: number; y: number };
  setMoveInput: (x: number, y: number) => void;
}

export const useWalkStore = create<WalkState>()((set) => ({
  walkMode: false,
  toggleWalkMode: () => set((s) => ({ walkMode: !s.walkMode, moveInput: { x: 0, y: 0 } })),
  exitWalkMode: () => set({ walkMode: false, moveInput: { x: 0, y: 0 } }),
  moveInput: { x: 0, y: 0 },
  setMoveInput: (x, y) => set({ moveInput: { x, y } }),
}));
