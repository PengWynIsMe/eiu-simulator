import { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import CharacterModel, { type CharacterHandle } from '../characters/CharacterModel';
import { useWalkStore } from '../../store/useWalkStore';
import { dampHeight, getGroundHeight } from '../walk/groundHeight';
import { applyLod, turnToward } from './lod';
import { GROUP_PEOPLE, GUARDS, mulberry32, sampleRoute, WALKERS, type RouteSample, type StaticNpcSpec, type WalkerSpec } from './npcPlan';

const HEIGHT_INTERVAL = 0.2; // giây giữa 2 lần đọc độ cao đất (getGroundHeight khá tốn)
const BLOCK_RADIUS = 1.2;
const UNBLOCK_RADIUS = 1.5;
const GUARD_RADIUS = 4;
const GREET_COOLDOWN = 8;
const WALK_CLIP_SPEED = 1.2; // m/s ứng với timeScale 1 của clip walk (ước lượng — chỉnh khi xem thật)

/** SV / lao công đi theo polyline, lệch phải theo hướng đi, quay đầu ở cuối (route không loop). */
function WalkingNpc({ spec }: { spec: WalkerSpec }) {
  const group = useRef<Group>(null);
  const handle = useRef<CharacterHandle>(null);
  const sample = useMemo<RouteSample>(() => ({ x: 0, z: 0, tx: 1, tz: 0 }), []);
  const sim = useMemo(
    () => ({ s: spec.startS, dir: spec.dir as number, lat: spec.dir * spec.geom.route.sideOffset, yaw: 0, y: 0, targetY: 0, hTimer: 0, blocked: false, init: false }),
    [spec],
  );

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.1);
    const { route } = spec.geom;
    const total = spec.geom.total;

    sampleRoute(spec.geom, sim.s, sample);
    // Pháp tuyến (-tz, tx) = bên phải khi đi theo chiều tăng s; đi ngược thì lat đổi dấu → luôn đi bên phải.
    sim.lat += (sim.dir * route.sideOffset - sim.lat) * Math.min(1, dt * 1.5);
    const x = sample.x - sample.tz * sim.lat;
    const z = sample.z + sample.tx * sim.lat;
    const hx = sim.dir * sample.tx;
    const hz = sim.dir * sample.tz;

    const shown = applyLod(state.camera.position, g, handle.current, x, sim.y, z);

    let blocked = false;
    const ws = useWalkStore.getState();
    const pp = ws.playerPos;
    if (shown && ws.walkMode && (pp.x !== 0 || pp.z !== 0)) {
      const px = pp.x - x;
      const pz = pp.z - z;
      const lim = sim.blocked ? UNBLOCK_RADIUS : BLOCK_RADIUS;
      blocked = px * hx + pz * hz > 0 && px * px + pz * pz < lim * lim;
    }
    sim.blocked = blocked;

    if (!blocked) {
      sim.s += sim.dir * spec.speed * dt;
      if (route.loop) {
        sim.s = ((sim.s % total) + total) % total;
      } else if (sim.s >= total) {
        sim.s = total;
        sim.dir = -1;
      } else if (sim.s <= 0) {
        sim.s = 0;
        sim.dir = 1;
      }
    }
    handle.current?.play(blocked ? 'idle' : 'walk', blocked ? 1 : spec.speed / WALK_CLIP_SPEED);

    const targetYaw = Math.atan2(hx, hz);
    sim.yaw = sim.init ? turnToward(sim.yaw, targetYaw, Math.min(1, dt * 6)) : targetYaw;

    sim.hTimer -= dt;
    if (shown && (sim.hTimer <= 0 || !sim.init)) {
      sim.targetY = getGroundHeight(x, z);
      sim.hTimer = HEIGHT_INTERVAL;
      if (!sim.init) sim.y = sim.targetY;
    }
    sim.init = true;
    sim.y = dampHeight(sim.y, sim.targetY, dt);
    g.position.set(x, sim.y, z);
    g.rotation.y = sim.yaw;
  });

  return (
    <group ref={group} visible={false}>
      <CharacterModel ref={handle} url={spec.url} clip="walk" />
    </group>
  );
}

/** Bảo vệ: đứng idle nhìn theo facing; người chơi < 4 m thì quay lại nhìn + chào (yes). */
function GuardNpc({ spec }: { spec: StaticNpcSpec }) {
  const group = useRef<Group>(null);
  const handle = useRef<CharacterHandle>(null);
  const y = useMemo(() => getGroundHeight(spec.x, spec.z), [spec]);
  const sim = useMemo(() => ({ yaw: spec.yaw, lastGreet: -100 }), [spec]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const shown = applyLod(state.camera.position, g, handle.current, spec.x, y, spec.z);
    if (!shown) return;
    const dt = Math.min(delta, 0.1);
    let target = spec.yaw;
    const ws = useWalkStore.getState();
    const pp = ws.playerPos;
    if (ws.walkMode && (pp.x !== 0 || pp.z !== 0)) {
      const px = pp.x - spec.x;
      const pz = pp.z - spec.z;
      if (px * px + pz * pz < GUARD_RADIUS * GUARD_RADIUS) {
        target = Math.atan2(px, pz);
        if (state.clock.elapsedTime - sim.lastGreet > GREET_COOLDOWN) {
          sim.lastGreet = state.clock.elapsedTime;
          handle.current?.playOnce('yes', 'idle');
        }
      }
    }
    sim.yaw = turnToward(sim.yaw, target, Math.min(1, dt * 5));
    g.rotation.y = sim.yaw;
  });

  return (
    <group ref={group} position={[spec.x, y, spec.z]} rotation={[0, spec.yaw, 0]}>
      <CharacterModel ref={handle} url={spec.url} clip="idle" />
    </group>
  );
}

/** Người đứng nói chuyện: idle, mỗi 8–15 s gật hoặc lắc đầu một lần. */
function ChatNpc({ spec }: { spec: StaticNpcSpec }) {
  const group = useRef<Group>(null);
  const handle = useRef<CharacterHandle>(null);
  const y = useMemo(() => getGroundHeight(spec.x, spec.z), [spec]);
  const sim = useMemo(() => {
    const rng = mulberry32(spec.seed);
    return { rng, next: 3 + rng() * 12 };
  }, [spec]);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const shown = applyLod(state.camera.position, g, handle.current, spec.x, y, spec.z);
    if (!shown) return;
    const now = state.clock.elapsedTime;
    if (now < sim.next) return;
    sim.next = now + 8 + sim.rng() * 7;
    handle.current?.playOnce(sim.rng() < 0.6 ? 'yes' : 'no', 'idle');
  });

  return (
    <group ref={group} position={[spec.x, y, spec.z]} rotation={[0, spec.yaw, 0]}>
      <CharacterModel ref={handle} url={spec.url} clip="idle" />
    </group>
  );
}

/** NPC ngoài trời: 16 người đi bộ + 2 bảo vệ + 6 người đứng nói chuyện (≤ 24). Ẩn khi đang ở trong nhà. */
export default function CampusNpcs() {
  const inInterior = useWalkStore((s) => s.interior !== null);
  if (inInterior) return null;
  return (
    <Suspense fallback={null}>
      {WALKERS.map((w) => (
        <WalkingNpc key={w.id} spec={w} />
      ))}
      {GUARDS.map((g) => (
        <GuardNpc key={g.id} spec={g} />
      ))}
      {GROUP_PEOPLE.map((p) => (
        <ChatNpc key={p.id} spec={p} />
      ))}
    </Suspense>
  );
}
