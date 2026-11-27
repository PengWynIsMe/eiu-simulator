import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { DoubleSide, type Mesh } from 'three';
import { CAMPUS_POIS, type CampusPoi } from '../../data/explore';
import { useExploreStore } from '../../store/useExploreStore';
import { useWalkStore } from '../../store/useWalkStore';
import { useLangStore } from '../../store/useLangStore';
import { getGroundHeight } from '../walk/groundHeight';

const DISCOVER_RADIUS = 7.5;
const INTERACT_RADIUS = 5.5;
const LABEL_RADIUS = 38;

interface PoiMeshProps {
  poi: CampusPoi;
  groundY: number;
  isTarget: boolean;
  isDiscovered: boolean;
  showLabel: boolean;
  distanceM: number | null;
}

function PoiBeaconItem({ poi, groundY, isTarget, isDiscovered, showLabel, distanceM }: PoiMeshProps) {
  const lang = useLangStore((s) => s.lang);
  const ringRef = useRef<Mesh>(null);
  const beamRef = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringRef.current) {
      const s = isTarget ? 1 + Math.sin(t * 4) * 0.22 : 1 + Math.sin(t * 2.4) * 0.1;
      ringRef.current.scale.set(s, s, 1);
    }
    if (beamRef.current) {
      const mat = beamRef.current.material as { opacity: number };
      mat.opacity = isTarget ? 0.34 + Math.sin(t * 4) * 0.1 : isDiscovered ? 0.14 : 0.24 + Math.sin(t * 2.5) * 0.06;
    }
  });

  const color = isTarget ? '#facc15' : isDiscovered ? '#10b981' : poi.color;
  const beamH = isTarget ? 28 : 14;
  const radius = isTarget ? 2.6 : 1.7;

  return (
    <group position={[poi.pos[0], groundY, poi.pos[1]]}>
      <mesh ref={ringRef} rotation-x={-Math.PI / 2} position-y={0.09}>
        <ringGeometry args={[radius * 0.68, radius, 28]} />
        <meshBasicMaterial color={color} transparent opacity={isTarget ? 0.92 : 0.7} side={DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={beamRef} position-y={beamH * 0.5 + 0.08}>
        <cylinderGeometry args={[isTarget ? 0.18 : 0.12, isTarget ? 0.85 : 0.5, beamH, 12, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} side={DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position-y={2.4}>
        <octahedronGeometry args={[isTarget ? 0.48 : 0.32, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.65} roughness={0.25} />
      </mesh>
      {showLabel && (
        <Html position={[0, isTarget ? 4.4 : 3.5, 0]} center zIndexRange={[10, 0]}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              useExploreStore.getState().openPoi(poi.id);
            }}
            className="pointer-events-auto flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/30 bg-slate-950/85 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg backdrop-blur-sm transition hover:scale-105"
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            <span>{poi.title[lang]}</span>
            {distanceM !== null && (
              <span className="rounded bg-amber-400/20 px-1 text-[10px] font-bold text-amber-300">
                {distanceM}m
              </span>
            )}
          </button>
        </Html>
      )}
    </group>
  );
}

export default function PoiBeacons() {
  const navTarget = useExploreStore((s) => s.navTarget);
  const discoveredPoiIds = useExploreStore((s) => s.discoveredPoiIds);
  const walkMode = useWalkStore((s) => s.walkMode);
  const shuttleActive = useExploreStore((s) => s.shuttleActive);

  const [closestLabel, setClosestLabel] = useState<{ id: string | null; dist: number | null }>({ id: null, dist: null });
  const [targetDist, setTargetDist] = useState<number | null>(null);

  const poiGroundYs = useMemo(() => CAMPUS_POIS.map((p) => getGroundHeight(p.pos[0], p.pos[1])), []);
  const checkTimer = useRef(0);
  const discoveredSet = useMemo(() => new Set(discoveredPoiIds), [discoveredPoiIds]);

  useFrame((_, delta) => {
    checkTimer.current += Math.min(delta, 0.1);
    if (checkTimer.current < 0.2) return;
    checkTimer.current = 0;

    const ws = useWalkStore.getState();
    const es = useExploreStore.getState();
    const px = ws.walkMode ? ws.playerPos.x : 244;
    const pz = ws.walkMode ? ws.playerPos.z : -28;

    let nearestId: string | null = null;
    let nearestDist = Infinity;
    let interactId: string | null = null;
    let activeTargetDist: number | null = null;

    for (let i = 0; i < CAMPUS_POIS.length; i++) {
      const poi = CAMPUS_POIS[i];
      if (!poi) continue;
      const d = Math.hypot(px - poi.pos[0], pz - poi.pos[1]);
      if (d < nearestDist) {
        nearestDist = d;
        nearestId = poi.id;
      }
      if (es.navTarget?.id === poi.id) {
        activeTargetDist = Math.round(d);
      }
      if (ws.walkMode && !es.shuttleActive) {
        if (d <= DISCOVER_RADIUS && !es.discoveredPoiIds.includes(poi.id)) {
          const isNew = es.discoverPoi(poi.id);
          if (isNew) {
            es.showToast({
              vi: `Đã khám phá điểm mới: ${poi.title.vi}`,
              en: `New landmark discovered: ${poi.title.en}`,
            });
          }
        }
        if (d <= INTERACT_RADIUS && (interactId === null || d <= nearestDist + 0.01)) {
          interactId = poi.id;
        }
      }
    }

    if (ws.walkMode && !es.shuttleActive) {
      es.setNearbyPoi(interactId);
    } else if (es.nearbyPoiId !== null) {
      es.setNearbyPoi(null);
    }

    const labelId = walkMode && nearestDist <= LABEL_RADIUS ? nearestId : null;
    const labelDist = labelId ? Math.round(nearestDist) : null;
    if (closestLabel.id !== labelId || closestLabel.dist !== labelDist) {
      setClosestLabel({ id: labelId, dist: labelDist });
    }
    if (targetDist !== activeTargetDist) {
      setTargetDist(activeTargetDist);
    }
  });

  // Nếu navTarget trỏ tới tòa nhà chưa có POI riêng, vẫn dựng beacon vàng tại điểm đến
  const customNavTarget = useMemo(() => {
    if (!navTarget) return null;
    const matchesPoi = CAMPUS_POIS.some((p) => p.id === navTarget.id);
    if (matchesPoi) return null;
    return {
      pos: navTarget.pos,
      groundY: getGroundHeight(navTarget.pos[0], navTarget.pos[1]),
      label: navTarget.label,
    };
  }, [navTarget]);

  const lang = useLangStore((s) => s.lang);

  return (
    <group>
      {CAMPUS_POIS.map((poi, i) => {
        const isTarget = navTarget?.id === poi.id;
        const showLabel = !shuttleActive && (isTarget || closestLabel.id === poi.id);
        const dist = isTarget ? targetDist : closestLabel.id === poi.id ? closestLabel.dist : null;
        return (
          <PoiBeaconItem
            key={poi.id}
            poi={poi}
            groundY={poiGroundYs[i] ?? 0.2}
            isTarget={isTarget}
            isDiscovered={discoveredSet.has(poi.id)}
            showLabel={showLabel}
            distanceM={dist}
          />
        );
      })}
      {customNavTarget && (
        <group position={[customNavTarget.pos[0], customNavTarget.groundY, customNavTarget.pos[1]]}>
          <mesh rotation-x={-Math.PI / 2} position-y={0.1}>
            <ringGeometry args={[1.8, 2.6, 28]} />
            <meshBasicMaterial color="#facc15" transparent opacity={0.92} side={DoubleSide} depthWrite={false} />
          </mesh>
          <mesh position-y={14}>
            <cylinderGeometry args={[0.18, 0.85, 28, 12, 1, true]} />
            <meshBasicMaterial color="#facc15" transparent opacity={0.34} side={DoubleSide} depthWrite={false} />
          </mesh>
          <Html position={[0, 4.4, 0]} center zIndexRange={[10, 0]}>
            <div className="pointer-events-none whitespace-nowrap rounded-full border border-amber-300/60 bg-slate-950/90 px-3 py-1 text-[11px] font-semibold text-amber-200 shadow-lg">
              {customNavTarget.label[lang]}
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}
