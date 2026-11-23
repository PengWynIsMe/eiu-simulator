import { useLangStore } from '../../store/useLangStore';
import { UI_TEXT, useT } from '../text';
import type { Lang } from '../../types';

const OPTIONS: { lang: Lang; label: string; name: string }[] = [
  { lang: 'vi', label: 'VI', name: 'Tiếng Việt' },
  { lang: 'en', label: 'EN', name: 'English' },
];

/** Viên thuốc VI | EN: nửa đang chọn nền đậm. */
export default function LangToggle() {
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const tr = useT();

  return (
    <div role="group" aria-label={tr(UI_TEXT.langSwitch)} className="flex shrink-0 overflow-hidden rounded-lg bg-white/85 font-semibold shadow backdrop-blur-sm">
      {OPTIONS.map((o) => (
        <button
          key={o.lang}
          type="button"
          aria-pressed={lang === o.lang}
          aria-label={o.name}
          onClick={() => setLang(o.lang)}
          className={`px-2 py-1.5 text-xs transition-colors sm:px-2.5 sm:text-sm ${
            lang === o.lang ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-white hover:text-slate-900'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
