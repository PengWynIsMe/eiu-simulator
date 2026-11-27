import { CAMPUS_POIS, getPoi } from '../../data/explore';
import { useExploreStore } from '../../store/useExploreStore';
import { useWalkStore } from '../../store/useWalkStore';
import { useCampusStore } from '../../store/useCampusStore';
import { useLangStore } from '../../store/useLangStore';
import { UI_TEXT, useT } from '../text';

export default function PoiDetailCard() {
  const tr = useT();
  const lang = useLangStore((s) => s.lang);
  const activePoiId = useExploreStore((s) => s.activePoiId);
  const discoveredPoiIds = useExploreStore((s) => s.discoveredPoiIds);
  const closePoi = useExploreStore((s) => s.closePoi);

  if (!activePoiId) return null;
  const poi = getPoi(activePoiId);
  if (!poi) return null;

  const discoveredSet = new Set(discoveredPoiIds);
  const nextUndiscovered = CAMPUS_POIS.find((p) => !discoveredSet.has(p.id));

  const handleFindNext = () => {
    const es = useExploreStore.getState();
    if (!nextUndiscovered) {
      es.showToast(UI_TEXT.exploreAllPoisFound);
      closePoi();
      return;
    }
    if (!useWalkStore.getState().walkMode) {
      useWalkStore.setState({ walkMode: true, interior: null, moveInput: { x: 0, y: 0 } });
    }
    es.setNavTarget({
      id: nextUndiscovered.id,
      pos: nextUndiscovered.pos,
      label: nextUndiscovered.title,
      buildingId: nextUndiscovered.buildingId,
    });
    es.showToast({
      vi: `Đang dẫn đường tới ${nextUndiscovered.title.vi}`,
      en: `Guiding path set to ${nextUndiscovered.title.en}`,
    });
    closePoi();
  };

  const handleViewBuilding = () => {
    if (!poi.buildingId) return;
    useWalkStore.getState().exitWalkMode();
    useCampusStore.getState().selectBuilding(poi.buildingId);
    closePoi();
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-3xl border border-white/15 bg-slate-900 p-5 text-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
              ✨ {tr(UI_TEXT.exploreDiscoveredBadge, { done: discoveredPoiIds.length, total: CAMPUS_POIS.length })}
            </span>
            <h2 className="mt-2 text-lg font-bold">{poi.title[lang]}</h2>
            <p className="text-xs font-medium text-amber-300">{poi.subtitle[lang]}</p>
          </div>
          <button
            type="button"
            onClick={closePoi}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm hover:bg-white/20"
            aria-label={tr(UI_TEXT.close)}
          >
            ✕
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-slate-200">{poi.description[lang]}</p>

        {poi.facts.length > 0 && (
          <ul className="mt-3 space-y-1.5 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
            {poi.facts.map((fact, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-300">•</span>
                <span>{fact[lang]}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleFindNext}
            className="w-full rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 shadow hover:bg-amber-300"
          >
            {nextUndiscovered ? `🧭 ${tr(UI_TEXT.exploreFindNextPoi)} →` : `🎉 ${tr(UI_TEXT.exploreAllPoisFound, { total: CAMPUS_POIS.length })}`}
          </button>

          {poi.buildingId && (
            <button
              type="button"
              onClick={handleViewBuilding}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20"
            >
              🏛 {tr(UI_TEXT.exploreViewBuilding)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
