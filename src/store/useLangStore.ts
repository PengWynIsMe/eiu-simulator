import { create } from 'zustand';
import type { Lang } from '../types';

const KEY = 'campussim.lang';

function readLang(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'en' ? 'en' : 'vi';
  } catch {
    return 'vi';
  }
}

function applyLang(lang: Lang) {
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
}

interface LangState {
  lang: Lang;
  /** Lưu localStorage + đặt <html lang>. Lỗi storage thì bỏ qua (vẫn đổi trong phiên). */
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const initial = readLang();
applyLang(initial);

export const useLangStore = create<LangState>()((set, get) => ({
  lang: initial,
  setLang: (lang) => {
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      /* bỏ qua */
    }
    applyLang(lang);
    set({ lang });
  },
  toggleLang: () => get().setLang(get().lang === 'vi' ? 'en' : 'vi'),
}));
