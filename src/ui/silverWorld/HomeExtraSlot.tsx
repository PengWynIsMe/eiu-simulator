import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../text';
import { setSilverUserMode, useSilverUserMode } from '../silver/presentation';
import { ST_W } from './text';

/**
 * Gắn nút "Chơi nhanh 2D" / "Chơi 3D" vào slot [data-silver-slot="home-extra"] của màn Home.
 * Sử dụng createPortal từ ui/silverWorld theo spec 3D-11 A.5.
 */
export default function HomeExtraSlot() {
  const tr = useT();
  const userMode = useSilverUserMode();
  const [slot, setSlot] = useState<Element | null>(null);

  useEffect(() => {
    const updateSlot = () => {
      const el = document.querySelector('[data-silver-slot="home-extra"]');
      setSlot(el);
    };
    updateSlot();

    const observer = new MutationObserver(updateSlot);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  if (!slot) return null;

  const isWorld = userMode === 'world';

  return createPortal(
    <button
      type="button"
      onClick={() => {
        setSilverUserMode(isWorld ? 'overlay' : 'world');
      }}
      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 active:scale-95"
      title={isWorld ? tr(ST_W.modeFast2D) : tr(ST_W.mode3D)}
    >
      <span aria-hidden="true">{isWorld ? '⚡' : '🏛️'}</span>
      <span>{isWorld ? tr(ST_W.modeFast2D) : tr(ST_W.mode3D)}</span>
    </button>,
    slot,
  );
}
