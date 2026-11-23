import { create } from 'zustand';

interface SnowState {
  isSnowing: boolean;
  isCinematicActive: boolean;
  toggleSnow: (override?: boolean) => void;
  startCinematic: () => void;
  endCinematic: () => void;
}

/** Tuyết BẬT mặc định (chiến dịch mùa đông). ?snow=0 / false tắt hẳn; ?snow=1 bật. Ngôn ngữ dùng chung useLangStore. */
function getInitialState(): { isSnowing: boolean; isCinematicActive: boolean } {
  if (typeof window === 'undefined') return { isSnowing: false, isCinematicActive: false };

  const params = new URLSearchParams(window.location.search);
  const snowParam = params.get('snow');
  const off = snowParam === '0' || snowParam === 'false';
  // ?cam= / ?building= là liên kết kiểm thử camera: không chạy cảnh mở đầu để khỏi giành camera.
  const debugCamera = params.has('cam') || params.has('building');
  return { isSnowing: !off, isCinematicActive: !off && !debugCamera };
}

const initial = getInitialState();

export const useSnowStore = create<SnowState>()((set) => ({
  isSnowing: initial.isSnowing,
  isCinematicActive: initial.isCinematicActive,

  toggleSnow: (override) =>
    set((state) => {
      const nextSnow = override !== undefined ? override : !state.isSnowing;
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('snow', nextSnow ? '1' : '0');
        window.history.replaceState({}, '', url.toString());
      }
      return {
        isSnowing: nextSnow,
        isCinematicActive: nextSnow ? state.isCinematicActive : false,
      };
    }),

  startCinematic: () => set({ isSnowing: true, isCinematicActive: true }),

  endCinematic: () => set({ isCinematicActive: false }),
}));
