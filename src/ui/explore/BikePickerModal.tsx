import { BIKE_COLORS, BIKE_STYLES } from '../../data/explore';
import { useExploreStore } from '../../store/useExploreStore';
import { useWalkStore } from '../../store/useWalkStore';
import { useLangStore } from '../../store/useLangStore';
import { UI_TEXT, useT } from '../text';

export default function BikePickerModal() {
  const tr = useT();
  const lang = useLangStore((s) => s.lang);
  const bikeModalOpen = useExploreStore((s) => s.bikeModalOpen);
  const bikeStyle = useExploreStore((s) => s.bikeStyle);
  const bikeColor = useExploreStore((s) => s.bikeColor);
  const setBikeStyle = useExploreStore((s) => s.setBikeStyle);
  const setBikeColor = useExploreStore((s) => s.setBikeColor);
  const setBikeModalOpen = useExploreStore((s) => s.setBikeModalOpen);
  const setMoveMode = useExploreStore((s) => s.setMoveMode);

  if (!bikeModalOpen) return null;

  const rideNow = () => {
    if (!useWalkStore.getState().walkMode) {
      useWalkStore.setState({ walkMode: true, interior: null, moveInput: { x: 0, y: 0 } });
    }
    setMoveMode('bike');
    setBikeModalOpen(false);
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tr(UI_TEXT.exploreBikeTitle)}
        className="w-full max-w-md rounded-3xl border border-white/15 bg-slate-900 p-5 text-white shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">🚲 {tr(UI_TEXT.exploreBikeTitle)}</h2>
          <button
            type="button"
            onClick={() => setBikeModalOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm hover:bg-white/20"
            aria-label={tr(UI_TEXT.close)}
          >
            ✕
          </button>
        </div>

        <div className="mt-4 grid gap-2">
          {BIKE_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => setBikeStyle(style.id)}
              className={`rounded-2xl border p-3 text-left transition ${
                bikeStyle === style.id
                  ? 'border-sky-400 bg-sky-500/20'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="text-sm font-bold">{style.name[lang]}</div>
              <div className="text-xs text-slate-300">{style.desc[lang]}</div>
            </button>
          ))}
        </div>

        <div className="mt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
            {tr(UI_TEXT.exploreBikeColorLabel)}
          </div>
          <div className="flex flex-wrap gap-2">
            {BIKE_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setBikeColor(c.hex)}
                title={c.name[lang]}
                aria-label={c.name[lang]}
                className={`h-8 w-8 rounded-full border-2 transition ${
                  bikeColor === c.hex ? 'scale-110 border-white ring-2 ring-sky-400' : 'border-white/30'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={rideNow}
          className="mt-5 w-full rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-sky-400"
        >
          🚲 {tr(UI_TEXT.exploreBikeRideNow)}
        </button>
      </div>
    </div>
  );
}
