import { useState } from 'react';
import { getBuilding, getBuildingDetail, getMajor, getMajorsOfBuilding } from '../data';
import { useCampusStore } from '../store/useCampusStore';
import type { Building, BuildingDetail, RoomEntry } from '../types';
import { useLangStore } from '../store/useLangStore';
import MajorPicker from './major/MajorPicker';
import MajorView from './major/MajorView';
import { UI_TEXT, useT } from './text';

function RoomList({ rooms }: { rooms: readonly RoomEntry[] }) {
  return (
    <ul className="space-y-1.5">
      {rooms.map((room, idx) => (
        <li
          key={`${room.code ?? ''}-${room.name}-${idx}`}
          className="rounded-lg bg-slate-800/75 px-2.5 py-1.5 text-xs leading-relaxed text-slate-200 border border-white/5"
        >
          {room.code && (
            <span className="mr-1.5 inline-block rounded bg-sky-500/20 px-1.5 py-0.5 font-semibold text-sky-300">
              {room.code}
            </span>
          )}
          <span>{room.name}</span>
        </li>
      ))}
    </ul>
  );
}

function BuildingDetailsBody({ spec }: { spec: BuildingDetail }) {
  const tr = useT();
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const floors = spec.floors;
  const currentFloor =
    floors?.find((f) => f.floorNumber === selectedFloor) ?? floors?.[0];

  const floorGridClass =
    floors && floors.length <= 2
      ? 'grid-cols-2'
      : floors && floors.length === 3
        ? 'grid-cols-3'
        : 'grid-cols-4';

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-800/60 p-3 border border-white/10">
        <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-sky-300">
          {tr(UI_TEXT.structureTitle)}
        </h3>
        <ul className="space-y-1 text-xs leading-relaxed text-slate-300">
          {spec.facts.map((fact) => (
            <li key={fact} className="flex gap-1.5">
              <span className="text-sky-400">•</span>
              <span>{fact}</span>
            </li>
          ))}
        </ul>
      </div>

      {floors && floors.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
            {tr(UI_TEXT.floorsTitle)}
          </h3>
          <div className={`grid ${floorGridClass} gap-1.5`}>
            {floors.map((floor) => {
              const isActive = floor.floorNumber === selectedFloor;
              return (
                <button
                  key={floor.floorNumber}
                  type="button"
                  onClick={() => setSelectedFloor(floor.floorNumber)}
                  className={`rounded-lg px-2 py-2 text-xs font-medium transition ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                  }`}
                >
                  {tr(UI_TEXT.floorN, { n: floor.floorNumber })}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {currentFloor && (
        <div className="space-y-3 rounded-xl bg-slate-800/45 p-3 border border-white/10">
          <div className="flex items-baseline justify-between gap-2 border-b border-white/10 pb-2">
            <span className="text-sm font-semibold text-white">{currentFloor.label}</span>
            <span className="text-xs text-sky-300">{currentFloor.elevation}</span>
          </div>

          <p className="text-xs leading-relaxed text-slate-300">
            {currentFloor.architecturalNote}
          </p>

          {currentFloor.groups.map((group, idx) => (
            <div key={group.title ?? `group-${idx}`}>
              {group.title && (
                <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {group.title}
                </h4>
              )}
              <RoomList rooms={group.rooms} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PanelContent({
  building,
  onClose,
}: {
  building: Building;
  onClose: () => void;
}) {
  const tr = useT();
  const lang = useLangStore((s) => s.lang);
  const spec = getBuildingDetail(building.id);
  const majors = getMajorsOfBuilding(building.id);
  const hasMajors = majors.length > 0;
  const selectedMajorId = useCampusStore((s) => s.selectedMajorId);
  const selectMajor = useCampusStore((s) => s.selectMajor);
  const selectedMajor = (selectedMajorId ? getMajor(selectedMajorId) : undefined) ?? majors[0];
  const [tab, setTab] = useState<'majors' | 'building'>('majors');
  const [expanded, setExpanded] = useState(false);
  const showMajors = hasMajors && tab === 'majors';

  return (
    <aside
      aria-label={building.name}
      className={`fixed inset-x-3 bottom-3 z-20 flex ${expanded ? 'max-h-[min(88vh,calc(100dvh-8rem))]' : 'max-h-[58vh]'} flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-900/92 text-slate-100 shadow-2xl backdrop-blur-md md:inset-x-auto md:bottom-auto md:right-4 md:top-20 md:max-h-[calc(100vh-6rem)] md:w-[420px]`}
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-label={tr(expanded ? UI_TEXT.collapseSheet : UI_TEXT.expandSheet)}
        onClick={() => setExpanded((v) => !v)}
        className="flex h-8 w-full shrink-0 items-center justify-center md:hidden"
      >
        <span className="h-1 w-9 rounded-full bg-white/30" />
      </button>
      <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3.5">
        <div className="min-w-0">
          <h2 className="text-sm font-bold leading-snug text-white md:text-base">
            {building.name}
          </h2>
          {spec && (
            <p className="mt-0.5 text-xs text-sky-300/90">{spec.subtitle}</p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-medium text-slate-300">
            <span className="rounded-md bg-white/10 px-2 py-0.5">
              {`${building.floors} ${tr(UI_TEXT.floorsUnit)}`}
            </span>
            <span className="rounded-md bg-white/10 px-2 py-0.5">
              {`${tr(UI_TEXT.heightPrefix)} ${building.height.toFixed(1)} m`}
            </span>
            <span className="rounded-md bg-white/10 px-2 py-0.5">
              {`${tr(UI_TEXT.zonePrefix)} ${building.zone}`}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/20"
        >
          {tr(UI_TEXT.close)}
        </button>
      </div>

      {hasMajors && (
        <div className="flex shrink-0 gap-1 border-b border-white/10 px-4" role="tablist">
          {(['majors', 'building'] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`min-h-10 whitespace-nowrap border-b-2 px-3 text-xs font-semibold transition ${
                tab === id ? 'border-sky-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {id === 'majors' ? tr(UI_TEXT.majorsTab, { n: majors.length }) : tr(UI_TEXT.buildingTab)}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3.5">
        {showMajors && selectedMajor ? (
          <div className="space-y-4">
            <MajorPicker majors={majors} selectedId={selectedMajor.id} onSelect={selectMajor} />
            <MajorView key={selectedMajor.id} major={selectedMajor} />
          </div>
        ) : spec ? (
          <>
            {hasMajors && lang === 'en' && (
              <p className="mb-3 rounded-lg bg-white/5 px-2.5 py-1.5 text-[11px] text-slate-300">{tr(UI_TEXT.viOnlyNote)}</p>
            )}
            <BuildingDetailsBody spec={spec} />
            <div className={`mt-4 rounded-xl border p-3 text-xs leading-relaxed ${
              spec.source.status === 'chua-xac-minh'
                ? 'border-amber-400/25 bg-amber-400/10 text-amber-100'
                : 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100'
            }`}>
              <span className={`mr-1.5 font-semibold ${
                spec.source.status === 'chua-xac-minh' ? 'text-amber-300' : 'text-emerald-300'
              }`}>
                {spec.source.status === 'chua-xac-minh' ? tr(UI_TEXT.unverifiedSource) : tr(UI_TEXT.verifiedSource)}
              </span>
              {spec.source.url ? (
                <a className="underline underline-offset-2" href={spec.source.url} target="_blank" rel="noreferrer">
                  {spec.source.label}
                </a>
              ) : (
                <span>{spec.source.label}</span>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs leading-relaxed text-slate-300">
            {tr(UI_TEXT.genericHint)}
          </p>
        )}
      </div>

      <div className="border-t border-white/10 px-4 py-2.5">
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-slate-800 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
        >
          {tr(UI_TEXT.backToOverview)}
        </button>
      </div>
    </aside>
  );
}

export default function BuildingPanel() {
  const selectedBuildingId = useCampusStore((s) => s.selectedBuildingId);
  const clearSelection = useCampusStore((s) => s.clearSelection);

  if (!selectedBuildingId) return null;
  const building = getBuilding(selectedBuildingId);
  if (!building) return null;

  return <PanelContent key={building.id} building={building} onClose={clearSelection} />;
}
