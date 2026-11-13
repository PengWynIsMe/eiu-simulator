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
  /**
   * Đang ở bên trong một tòa nhà (chỉ khi đi bộ). null = ngoài khuôn viên.
   * Campus.tsx thấy giá trị này thì render cảnh nội thất thay cho khuôn viên.
   */
  interior: { buildingId: string; floor: number } | null;
  /** Vào tòa nhà, bắt đầu ở tầng 1. */
  enterInterior: (buildingId: string) => void;
  /** Đổi tầng (thang máy). */
  setInteriorFloor: (floor: number) => void;
  /** Ra khỏi tòa nhà, về khuôn viên (vẫn đang đi bộ). */
  exitInterior: () => void;
}

export const useWalkStore = create<WalkState>()((set) => ({
  walkMode: false,
  toggleWalkMode: () => set((s) => ({ walkMode: !s.walkMode, moveInput: { x: 0, y: 0 }, interior: null })),
  exitWalkMode: () => set({ walkMode: false, moveInput: { x: 0, y: 0 }, interior: null }),
  moveInput: { x: 0, y: 0 },
  setMoveInput: (x, y) => set({ moveInput: { x, y } }),
  interior: null,
  enterInterior: (buildingId) => set({ interior: { buildingId, floor: 1 }, moveInput: { x: 0, y: 0 } }),
  setInteriorFloor: (floor) => set((s) => (s.interior ? { interior: { ...s.interior, floor } } : {})),
  exitInterior: () => set({ interior: null, moveInput: { x: 0, y: 0 } }),
}));
