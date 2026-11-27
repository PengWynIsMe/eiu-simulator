import { useEffect, useState } from 'react';
import { getPoi } from '../../data/explore';
import { useExploreStore } from '../../store/useExploreStore';
import { useWalkStore } from '../../store/useWalkStore';
import { useLangStore } from '../../store/useLangStore';
import { UI_TEXT, useT } from '../text';

export default function ContextActionPill() {
  const tr = useT();
  const lang = useLangStore((s) => s.lang);
  const [hasInteriorInteractive, setHasInteriorInteractive] = useState(false);

  const walkMode = useWalkStore((s) => s.walkMode);
  const interior = useWalkStore((s) => s.interior);

  const shuttleActive = useExploreStore((s) => s.shuttleActive);
  const seatedBenchIndex = useExploreStore((s) => s.seatedBenchIndex);
  const nearbyShuttle = useExploreStore((s) => s.nearbyShuttle);
  const nearbyNoticeBoard = useExploreStore((s) => s.nearbyNoticeBoard);
  const nearbyPoiId = useExploreStore((s) => s.nearbyPoiId);
  const nearbyBenchIndex = useExploreStore((s) => s.nearbyBenchIndex);

  useEffect(() => {
    const onProx = (e: Event) => {
      const detail = (e as CustomEvent<{ interactive: unknown }>).detail;
      setHasInteriorInteractive(Boolean(detail?.interactive));
    };
    window.addEventListener('campussim:interior-proximity', onProx);
    return () => window.removeEventListener('campussim:interior-proximity', onProx);
  }, []);

  if (!walkMode || interior || shuttleActive || hasInteriorInteractive) return null;

  let label: string | null = null;
  let onTrigger: (() => void) | null = null;

  if (seatedBenchIndex !== null) {
    label = tr(UI_TEXT.exploreStandUp);
    onTrigger = () => useExploreStore.getState().standUpBench();
  } else if (nearbyShuttle) {
    label = tr(UI_TEXT.exploreShuttleBoard);
    onTrigger = () => useExploreStore.getState().boardShuttle();
  } else if (nearbyNoticeBoard) {
    label = tr(UI_TEXT.exploreReadNotice);
    onTrigger = () => useExploreStore.getState().setNoticeBoardOpen(true);
  } else if (nearbyPoiId) {
    const poi = getPoi(nearbyPoiId);
    if (poi) {
      label = tr(UI_TEXT.exploreInspectPoi, { name: poi.title[lang] });
      onTrigger = () => useExploreStore.getState().openPoi(poi.id);
    }
  } else if (nearbyBenchIndex !== null) {
    label = tr(UI_TEXT.exploreSitBench);
    onTrigger = () => useExploreStore.getState().sitOnBench(nearbyBenchIndex);
  }

  if (!label || !onTrigger) return null;

  return (
    <button
      type="button"
      onClick={onTrigger}
      className="pointer-events-auto fixed bottom-40 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border-2 border-amber-300 bg-[#f5b700] px-5 py-2.5 text-xs font-bold text-slate-950 shadow-2xl transition hover:scale-105 active:scale-95 sm:bottom-16 sm:text-sm"
    >
      <span className="rounded bg-slate-900/15 px-1.5 py-0.5 text-[11px] font-black">E</span>
      <span>{label}</span>
    </button>
  );
}
