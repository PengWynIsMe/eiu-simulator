import { DoubleSide } from 'three';
import StaticInstances, { type StaticInstance } from '../kit/StaticInstances';
import {
  BOOK_LANDING_DEPTH,
  BOOK_STAIR_WIDTH,
  BOOK_STEP_COUNT,
  BOOK_STEP_RISE,
  BOOK_STEP_RUN,
} from './bookStairLayout';
import { BOOK_ATLAS_ROW_INDEXES, getBookSpineAtlas, applyBookAtlasRows } from './bookSpineAtlas';

const FLIGHT_LENGTH = BOOK_STEP_RUN * BOOK_STEP_COUNT;
const FLIGHT_HEIGHT = BOOK_STEP_RISE * BOOK_STEP_COUNT;
const HALF_WIDTH = BOOK_STAIR_WIDTH / 2;
const WALL_HEIGHT = FLIGHT_HEIGHT + 2.65;
const WALL_DEPTH = FLIGHT_LENGTH + BOOK_LANDING_DEPTH;
const RAIL_HEIGHT = 0.92;
const SILL_HEIGHT = 0.92;
const WINDOW_BOTTOM = FLIGHT_HEIGHT + SILL_HEIGHT;
const WINDOW_HEIGHT = WALL_HEIGHT - WINDOW_BOTTOM;
const WINDOW_X = HALF_WIDTH + 0.07;

const steps: StaticInstance[] = Array.from({ length: BOOK_STEP_COUNT }, (_, i) => {
  const height = BOOK_STEP_RISE * (i + 1);
  return { position: [0, height / 2, -(i + 0.5) * BOOK_STEP_RUN], scale: [BOOK_STAIR_WIDTH, height, BOOK_STEP_RUN] };
});
steps.push({
  position: [0, FLIGHT_HEIGHT / 2, -FLIGHT_LENGTH - BOOK_LANDING_DEPTH / 2],
  scale: [BOOK_STAIR_WIDTH, FLIGHT_HEIGHT, BOOK_LANDING_DEPTH],
});

const spines: StaticInstance[] = Array.from({ length: BOOK_STEP_COUNT }, (_, i) => ({
  position: [0, (i + 0.5) * BOOK_STEP_RISE, -i * BOOK_STEP_RUN + 0.002],
  scale: [BOOK_STAIR_WIDTH - 0.025, BOOK_STEP_RISE - 0.016, 1],
}));

const rails: StaticInstance[] = [];
const handrailLength = Math.hypot(FLIGHT_LENGTH, FLIGHT_HEIGHT);
const handrailAngle = Math.atan2(-FLIGHT_LENGTH, FLIGHT_HEIGHT);
for (const x of [-HALF_WIDTH + 0.11, HALF_WIDTH - 0.11]) {
  rails.push({
    position: [x, RAIL_HEIGHT + (FLIGHT_HEIGHT + BOOK_STEP_RISE) / 2, -(FLIGHT_LENGTH - BOOK_STEP_RUN) / 2],
    scale: [0.035, handrailLength, 0.035],
    rotation: [handrailAngle, 0, 0],
  });
  for (let i = 0; i < BOOK_STEP_COUNT; i += 3) {
    rails.push({
      position: [x, (i + 1) * BOOK_STEP_RISE + RAIL_HEIGHT / 2, -(i + 0.5) * BOOK_STEP_RUN],
      scale: [0.021, RAIL_HEIGHT, 0.021],
    });
  }
}
// Chân vách và dải kính đi lên theo vế thang, thêm một ô bên chiếu nghỉ.
const wallPanels: StaticInstance[] = [{
  position: [-HALF_WIDTH - 0.07, WALL_HEIGHT / 2, -WALL_DEPTH / 2],
  scale: [0.14, WALL_HEIGHT, WALL_DEPTH],
}];
const glassPanes: StaticInstance[] = [];
const windowFrames: StaticInstance[] = [];
const windowBays = 5;
for (let i = 0; i < windowBays; i++) {
  const depth = WALL_DEPTH / windowBays;
  const baseY = SILL_HEIGHT + Math.min(FLIGHT_HEIGHT, i * depth / BOOK_STEP_RUN * BOOK_STEP_RISE);
  const z = -(i + 0.5) * depth;
  wallPanels.push({ position: [WINDOW_X, baseY / 2, z], scale: [0.14, baseY, depth] });
  glassPanes.push({
    position: [WINDOW_X, (baseY + WALL_HEIGHT) / 2, z],
    scale: [depth - 0.08, WALL_HEIGHT - baseY - 0.06, 1],
    rotation: [0, -Math.PI / 2, 0],
  });
  for (const y of [baseY, WINDOW_BOTTOM + WINDOW_HEIGHT - 0.03]) {
    windowFrames.push({ position: [WINDOW_X, y, z], scale: [0.11, 0.06, depth] });
  }
  windowFrames.push({
    position: [WINDOW_X, (baseY + WALL_HEIGHT) / 2, -i * depth],
    scale: [0.11, WALL_HEIGHT - baseY, 0.08],
  });
}
windowFrames.push({
  position: [WINDOW_X, (WINDOW_BOTTOM + WALL_HEIGHT) / 2, -WALL_DEPTH],
  scale: [0.11, WINDOW_HEIGHT, 0.08],
});

// Ô kính trên lối cuối chiếu nghỉ, chừa khoảng thông hành cao 2.05 m.
const REAR_WINDOW_BOTTOM = FLIGHT_HEIGHT + 2.05;
const REAR_WINDOW_HEIGHT = WALL_HEIGHT - REAR_WINDOW_BOTTOM;
glassPanes.push({
  position: [0, (REAR_WINDOW_BOTTOM + WALL_HEIGHT) / 2, -WALL_DEPTH],
  scale: [BOOK_STAIR_WIDTH - 0.1, REAR_WINDOW_HEIGHT - 0.08, 1],
});
for (const y of [REAR_WINDOW_BOTTOM, WALL_HEIGHT]) {
  windowFrames.push({
    position: [0, y, -WALL_DEPTH],
    scale: [BOOK_STAIR_WIDTH, 0.08, 0.1],
  });
}
for (const x of [-HALF_WIDTH, 0, HALF_WIDTH]) {
  windowFrames.push({
    position: [x, (REAR_WINDOW_BOTTOM + WALL_HEIGHT) / 2, -WALL_DEPTH],
    scale: [0.07, REAR_WINDOW_HEIGHT, 0.10],
  });
}

interface Props {
  /** Tâm cạnh trước ở cao độ sàn dưới. Thang lên theo trục −Z cục bộ. */
  position: [number, number, number];
  rotationY?: number;
  /** Cao độ chiếu nghỉ tính từ chân thang. Mặc định cao một tầng B6. */
  height?: number;
}

export default function BookStaircase({ position, rotationY = 0, height = FLIGHT_HEIGHT }: Props) {
  return (
    <group position={position} rotation-y={rotationY} scale-y={height / FLIGHT_HEIGHT}>
      <StaticInstances items={steps} receiveShadow>
        <boxGeometry />
        <meshStandardMaterial color="#64748b" roughness={0.68} />
      </StaticInstances>
      <StaticInstances items={spines}>
        <planeGeometry>
          <instancedBufferAttribute attach="attributes-bookRow" args={[BOOK_ATLAS_ROW_INDEXES, 1]} />
        </planeGeometry>
        <meshStandardMaterial map={getBookSpineAtlas()} onBeforeCompile={applyBookAtlasRows} roughness={0.6} />
      </StaticInstances>
      <StaticInstances items={rails}>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.22} />
      </StaticInstances>
      <StaticInstances items={wallPanels} receiveShadow>
        <boxGeometry />
        <meshStandardMaterial color="#bb8c7e" emissive="#bb8c7e" emissiveIntensity={0.16} roughness={0.85} flatShading />
      </StaticInstances>
      <StaticInstances items={windowFrames}>
        <boxGeometry />
        <meshStandardMaterial color="#94a3b8" roughness={0.42} metalness={0.5} />
      </StaticInstances>
      <StaticInstances items={glassPanes}>
        <planeGeometry />
        <meshStandardMaterial
          color="#bae6fd"
          roughness={0.1}
          metalness={0.2}
          opacity={0.35}
          transparent
          depthWrite={false}
          side={DoubleSide}
          forceSinglePass
        />
      </StaticInstances>
    </group>
  );
}
