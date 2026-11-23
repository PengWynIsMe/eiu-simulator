import { create } from 'zustand';
import type { SnowLang } from '../ui/snowText';

interface SnowState {
  isSnowing: boolean;
  isCinematicActive: boolean;
  lang: SnowLang;
  toggleSnow: (override?: boolean) => void;
  startCinematic: () => void;
  endCinematic: () => void;
  setLang: (lang: SnowLang) => void;
  toggleLang: () => void;
}

function getInitialState(): { isSnowing: boolean; isCinematicActive: boolean; lang: SnowLang } {
  if (typeof window === 'undefined') {
    return { isSnowing: false, isCinematicActive: false, lang: 'vi' };
  }

  const params = new URLSearchParams(window.location.search);
  const snowParam = params.get('snow');
  const langParam = params.get('lang');

  const isSnowing = snowParam === '1' || snowParam === 'true';
  const lang: SnowLang = langParam === 'en' ? 'en' : 'vi';

  return {
    isSnowing,
    isCinematicActive: isSnowing,
    lang,
  };
}

const initial = getInitialState();

export const useSnowStore = create<SnowState>()((set) => ({
  isSnowing: initial.isSnowing,
  isCinematicActive: initial.isCinematicActive,
  lang: initial.lang,

  toggleSnow: (override) =>
    set((state) => {
      const nextSnow = override !== undefined ? override : !state.isSnowing;
      // Cập nhật URL query param nhẹ nhàng
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (nextSnow) {
          url.searchParams.set('snow', '1');
        } else {
          url.searchParams.delete('snow');
        }
        window.history.replaceState({}, '', url.toString());
      }
      return {
        isSnowing: nextSnow,
        isCinematicActive: nextSnow ? state.isCinematicActive : false,
      };
    }),

  startCinematic: () =>
    set({
      isSnowing: true,
      isCinematicActive: true,
    }),

  endCinematic: () =>
    set({
      isCinematicActive: false,
    }),

  setLang: (lang) =>
    set(() => {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (lang === 'en') {
          url.searchParams.set('lang', 'en');
        } else {
          url.searchParams.delete('lang');
        }
        window.history.replaceState({}, '', url.toString());
      }
      return { lang };
    }),

  toggleLang: () =>
    set((state) => {
      const nextLang: SnowLang = state.lang === 'vi' ? 'en' : 'vi';
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (nextLang === 'en') {
          url.searchParams.set('lang', 'en');
        } else {
          url.searchParams.delete('lang');
        }
        window.history.replaceState({}, '', url.toString());
      }
      return { lang: nextLang };
    }),
}));
